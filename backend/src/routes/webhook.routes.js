/**
 * Webhook Routes
 * Handle incoming webhooks from external services (WhatsApp Cloud, etc.)
 */

async function webhookRoutes(fastify, options) {
  
  // =====================
  // WHATSAPP CLOUD API WEBHOOK
  // =====================
  
  // Meta webhook verification (GET)
  fastify.get('/whatsapp-cloud', async (request, reply) => {
    const query = request.query
    
    const mode = query['hub.mode']
    const token = query['hub.verify_token']
    const challenge = query['hub.challenge']
    
    // Check if mode and token are present
    if (!mode || !token) {
      return reply.code(400).send({ error: 'Bad Request', message: 'Missing required parameters' })
    }
    
    // Verify the mode is 'subscribe' and token matches
    if (mode === 'subscribe') {
      // Get all WhatsApp Cloud channels and check verify tokens
      const channels = await fastify.prisma.channel.findMany({
        where: { type: 'WHATSAPP_CLOUD' },
        select: { id: true, config: true }
      })
      
      for (const channel of channels) {
        if (channel.config?.verifyToken === token) {
          fastify.log.info(`Webhook verified for channel ${channel.id}`)
          return reply.send(challenge)
        }
      }
    }
    
    return reply.code(403).send({ error: 'Forbidden', message: 'Verification failed' })
  })
  
  // Meta webhook events (POST)
  fastify.post('/whatsapp-cloud', async (request, reply) => {
    try {
      const body = request.body
      
      // Check if this is a WhatsApp event
      if (body.object !== 'whatsapp_business_account') {
        return reply.send({ status: 'ignored' })
      }
      
      // Process each entry
      for (const entry of body.entry || []) {
        // Handle messages
        if (entry.changes) {
          for (const change of entry.changes) {
            if (change.field === 'messages') {
              await handleWhatsAppMessage(change.value, fastify)
            } else if (change.field === 'message_template_status_update') {
              await handleTemplateStatusUpdate(change.value, fastify)
            }
          }
        }
        
        // Handle contacts
        if (entry.changes?.some(c => c.field === 'contacts')) {
          for (const change of entry.changes.filter(c => c.field === 'contacts')) {
            await handleContactUpdate(change.value, fastify)
          }
        }
      }
      
      // Always return 200 OK to Meta
      reply.send({ status: 'ok' })
    } catch (error) {
      fastify.log.error(error, 'Error processing WhatsApp webhook')
      reply.send({ status: 'ok' }) // Still return OK to prevent retries
    }
  })
  
  // =====================
  // HELPER FUNCTIONS
  // =====================
  
  async function handleWhatsAppMessage(value, fastify) {
    const { messages, contacts, metadata } = value
    
    if (!messages || !contacts) return
    
    const phoneNumberId = metadata?.phone_number_id
    
    // Find the channel
    const channel = await fastify.prisma.channel.findFirst({
      where: { 
        type: 'WHATSAPP_CLOUD',
        config: {
          path: ['phoneNumberId'],
          equals: phoneNumberId
        }
      }
    })
    
    if (!channel) {
      fastify.log.warn(`No channel found for phone number ID: ${phoneNumberId}`)
      return
    }
    
    // Process each message
    for (const message of messages) {
      const contact = contacts.find(c => c.wa_id === message.from)
      
      // Find or create contact
      let dbContact = await fastify.prisma.contact.findFirst({
        where: {
          organizationId: channel.organizationId,
          phone: contact?.profile?.name ? { contains: contact.profile.name } : undefined
        }
      })
      
      if (!dbContact && contact) {
        dbContact = await fastify.prisma.contact.create({
          data: {
            firstName: contact.profile?.name?.split(' ')[0] || null,
            lastName: contact.profile?.name?.split(' ').slice(1).join(' ') || null,
            phone: message.from,
            language: 'fr', // Default, will be detected later
            organizationId: channel.organizationId
          }
        })
      }
      
      if (!dbContact) continue
      
      // Find or create conversation
      let conversation = await fastify.prisma.conversation.findFirst({
        where: {
          channelId: channel.id,
          contactId: dbContact.id,
          status: { in: ['OPEN', 'PENDING'] }
        }
      })
      
      if (!conversation) {
        conversation = await fastify.prisma.conversation.create({
          data: {
            channelId: channel.id,
            contactId: dbContact.id,
            organizationId: channel.organizationId,
            status: 'OPEN',
            subject: null
          }
        })
      }
      
      // Create message based on type
      const messageType = getMessageType(message.type)
      
      await fastify.prisma.message.create({
        data: {
          conversationId: conversation.id,
          direction: 'INBOUND',
          type: messageType,
          content: message.text?.body || message.caption || null,
          externalId: message.id,
          status: 'DELIVERED',
          deliveredAt: new Date()
        }
      })
      
      // Update conversation
      await fastify.prisma.conversation.update({
        where: { id: conversation.id },
        data: {
          lastMessageAt: new Date(),
          unreadCount: { increment: 1 }
        }
      })
      
      // Emit real-time event
      const io = fastify.getIO()
      io.to(`conversation:${conversation.id}`).emit('message:new', {
        conversationId: conversation.id,
        message: { /* message data */ }
      })
    }
  }
  
  async function handleTemplateStatusUpdate(value, fastify) {
    // Handle template status updates (approved, rejected, etc.)
    const { message_template_id, status } = value
    
    fastify.log.info(`Template ${message_template_id} status: ${status}`)
  }
  
  async function handleContactUpdate(value, fastify) {
    // Handle contact updates
    const { contacts } = value
    
    for (const contact of contacts || []) {
      fastify.log.info(`Contact update: ${contact.wa_id}`)
    }
  }
  
  function getMessageType(type) {
    const typeMap = {
      text: 'TEXT',
      image: 'IMAGE',
      video: 'VIDEO',
      audio: 'AUDIO',
      document: 'DOCUMENT',
      sticker: 'STICKER',
      location: 'LOCATION',
      contacts: 'CONTACT_CARD',
      interactive: 'INTERACTIVE',
      template: 'TEMPLATE',
      button: 'INTERACTIVE',
      list: 'INTERACTIVE'
    }
    
    return typeMap[type] || 'TEXT'
  }
}

module.exports = webhookRoutes
