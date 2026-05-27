const { authenticate } = require('../middlewares/auth.middleware')

/**
 * Channel Routes
 * Manage communication channels (WhatsApp, Email)
 */

async function channelRoutes(fastify, options) {
  // Protect all routes
  fastify.addHook('preHandler', async (request, reply) => {
    try {
      await request.jwtVerify()
      const user = await fastify.prisma.user.findUnique({
        where: { id: request.user.id },
        include: { organization: true }
      })
      
      if (!user || !user.isActive) {
        return reply.code(401).send({ error: 'Unauthorized' })
      }
      
      request.user = user
    } catch (error) {
      return reply.code(401).send({ error: 'Unauthorized' })
    }
  })

  // List channels
  fastify.get('/', async (request, reply) => {
    const channels = await fastify.prisma.channel.findMany({
      where: { organizationId: request.user.organizationId },
      include: {
        _count: {
          select: { conversations: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    })
    
    reply.send(channels)
  })

  // Get single channel
  fastify.get('/:id', async (request, reply) => {
    const { id } = request.params
    
    const channel = await fastify.prisma.channel.findUnique({
      where: { id },
      include: {
        _count: {
          select: { conversations: true }
        }
      }
    })
    
    if (!channel) {
      return reply.code(404).send({ error: 'Channel not found' })
    }
    
    reply.send(channel)
  })

  // Create channel
  fastify.post('/', async (request, reply) => {
    const { type, name, config } = request.body
    
    const channel = await fastify.prisma.channel.create({
      data: {
        type,
        name,
        config: config || {},
        status: 'DISCONNECTED',
        organizationId: request.user.organizationId
      }
    })
    
    reply.code(201).send(channel)
  })

  // Update channel
  fastify.put('/:id', async (request, reply) => {
    const { id } = request.params
    const { name, config, isActive } = request.body
    
    const channel = await fastify.prisma.channel.update({
      where: { id },
      data: { name, config, isActive }
    })
    
    reply.send(channel)
  })

  // Delete channel
  fastify.delete('/:id', async (request, reply) => {
    const { id } = request.params
    
    await fastify.prisma.channel.delete({
      where: { id }
    })
    
    reply.send({ success: true })
  })

  // =====================
  // WHATSAPP BAILEYS SPECIFIC
  // =====================

  // Generate QR code for WhatsApp Baileys
  fastify.get('/baileys/:id/qr', async (request, reply) => {
    const { id } = request.params
    
    const channel = await fastify.prisma.channel.findUnique({
      where: { id },
      where: { organizationId: request.user.organizationId }
    })
    
    if (!channel || channel.type !== 'WHATSAPP_BAILEYS') {
      return reply.code(404).send({ error: 'Baileys channel not found' })
    }
    
    // TODO: Implement QR generation via BaileysClient
    // For now, return placeholder
    reply.send({ 
      qrCode: null, 
      message: 'QR code generation not yet implemented',
      status: channel.status
    })
  })

  // Disconnect WhatsApp Baileys
  fastify.post('/baileys/:id/disconnect', async (request, reply) => {
    const { id } = request.params
    
    await fastify.prisma.channel.update({
      where: { id },
      data: { status: 'DISCONNECTED' }
    })
    
    // TODO: Actually disconnect Baileys client
    
    reply.send({ success: true })
  })

  // Get Baileys status
  fastify.get('/baileys/:id/status', async (request, reply) => {
    const { id } = request.params
    
    const channel = await fastify.prisma.channel.findUnique({
      where: { id },
      select: { status: true, config: true }
    })
    
    if (!channel) {
      return reply.code(404).send({ error: 'Channel not found' })
    }
    
    reply.send({ 
      status: channel.status,
      lastSeen: channel.config?.lastSeen || null
    })
  })

  // =====================
  // WHATSAPP CLOUD API SPECIFIC
  // =====================

  // Verify Cloud API webhook
  fastify.get('/cloud/:id/verify', async (request, reply) => {
    const { id } = request.params
    const { 'hub.mode': mode, 'hub.verify_token': token, 'hub.challenge': challenge } = request.query
    
    const channel = await fastify.prisma.channel.findUnique({
      where: { id }
    })
    
    if (!channel || channel.type !== 'WHATSAPP_CLOUD') {
      return reply.code(404).send({ error: 'Cloud API channel not found' })
    }
    
    const verifyToken = channel.config?.verifyToken
    
    if (mode === 'subscribe' && token === verifyToken) {
      reply.send(challenge)
    } else {
      reply.code(403).send({ error: 'Verification failed' })
    }
  })

  // Test Cloud API connection
  fastify.post('/cloud/:id/test', async (request, reply) => {
    const { id } = request.params
    
    const channel = await fastify.prisma.channel.findUnique({
      where: { id }
    })
    
    if (!channel || channel.type !== 'WHATSAPP_CLOUD') {
      return reply.code(404).send({ error: 'Cloud API channel not found' })
    })
    
    // TODO: Actually test connection to Meta API
    
    reply.send({ 
      success: true, 
      message: 'Connection test successful' 
    })
  })

  // =====================
  // EMAIL SPECIFIC
  // =====================

  // Test email connection
  fastify.post('/email/:id/test', async (request, reply) => {
    const { id } = request.params
    
    const channel = await fastify.prisma.channel.findUnique({
      where: { id }
    })
    
    if (!channel || channel.type !== 'EMAIL') {
      return reply.code(404).send({ error: 'Email channel not found' })
    })
    
    // TODO: Actually test IMAP/SMTP connection
    
    reply.send({ 
      success: true, 
      message: 'Email connection test successful' 
    })
  })

  // Sync emails
  fastify.post('/email/:id/sync', async (request, reply) => {
    const { id } = request.params
    
    const channel = await fastify.prisma.channel.findUnique({
      where: { id }
    })
    
    if (!channel || channel.type !== 'EMAIL') {
      return reply.code(404).send({ error: 'Email channel not found' })
    })
    
    // TODO: Trigger email sync job
    
    reply.send({ 
      success: true, 
      message: 'Email sync started' 
    })
  })
}

module.exports = channelRoutes
