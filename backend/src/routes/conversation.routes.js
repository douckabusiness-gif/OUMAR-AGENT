const { authenticate } = require('../middlewares/auth.middleware')

/**
 * Conversation Routes
 * Unified conversation management for all channels
 */

async function conversationRoutes(fastify, options) {
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

  // List conversations with filters
  fastify.get('/', async (request, reply) => {
    const { 
      page = 1, 
      limit = 20, 
      status, 
      channelId, 
      assignedTo,
      search,
      tags
    } = request.query
    
    const where = {
      organizationId: request.user.organizationId
    }
    
    if (status) {
      where.status = status
    }
    
    if (channelId) {
      where.channelId = channelId
    }
    
    if (assignedTo === 'me') {
      where.assignedToId = request.user.id
    } else if (assignedTo === 'unassigned') {
      where.assignedToId = null
    } else if (assignedTo) {
      where.assignedToId = assignedTo
    }
    
    if (search) {
      where.OR = [
        { subject: { contains: search, mode: 'insensitive' } },
        { contact: { firstName: { contains: search, mode: 'insensitive' } } },
        { contact: { lastName: { contains: search, mode: 'insensitive' } } },
        { contact: { phone: { contains: search } } },
        { contact: { email: { contains: search, mode: 'insensitive' } } }
      ]
    }
    
    if (tags) {
      where.tags = { hasSome: Array.isArray(tags) ? tags : [tags] }
    }
    
    const conversations = await fastify.prisma.conversation.findMany({
      where,
      include: {
        channel: { select: { type: true, name: true } },
        contact: { 
          select: { 
            id: true, 
            firstName: true, 
            lastName: true, 
            phone: true, 
            email: true,
            avatar: true 
          } 
        },
        assignedTo: {
          select: { id: true, firstName: true, lastName: true, avatar: true }
        },
        messages: {
          take: 1,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            content: true,
            type: true,
            direction: true,
            createdAt: true
          }
        }
      },
      orderBy: { lastMessageAt: 'desc' },
      skip: (page - 1) * limit,
      take: parseInt(limit)
    })
    
    const total = await fastify.prisma.conversation.count({ where })
    
    reply.send({ conversations, total, page: parseInt(page), limit: parseInt(limit) })
  })

  // Get single conversation with messages
  fastify.get('/:id', async (request, reply) => {
    const { id } = request.params
    
    const conversation = await fastify.prisma.conversation.findUnique({
      where: { id },
      include: {
        channel: { select: { type: true, name: true, config: true } },
        contact: true,
        assignedTo: {
          select: { id: true, firstName: true, lastName: true, avatar: true }
        },
        messages: {
          orderBy: { createdAt: 'asc' },
          include: {
            sentBy: {
              select: { id: true, firstName: true, lastName: true, avatar: true }
            },
            replyTo: {
              select: { id: true, content: true, type: true }
            }
          }
        }
      }
    })
    
    if (!conversation) {
      return reply.code(404).send({ error: 'Not Found', message: 'Conversation not found' })
    }
    
    // Mark as read
    if (conversation.unreadCount > 0) {
      await fastify.prisma.conversation.update({
        where: { id },
        data: { unreadCount: 0 }
      })
      
      // Emit real-time event
      const io = fastify.getIO()
      io.to(`conversation:${id}`).emit('conversation:read', {
        conversationId: id,
        userId: request.user.id
      })
    }
    
    reply.send(conversation)
  })

  // Create conversation
  fastify.post('/', async (request, reply) => {
    const { channelId, contactId, subject } = request.body
    
    const conversation = await fastify.prisma.conversation.create({
      data: {
        channelId,
        contactId,
        subject,
        organizationId: request.user.organizationId,
        status: 'OPEN'
      },
      include: {
        channel: true,
        contact: true
      }
    })
    
    reply.code(201).send(conversation)
  })

  // Update conversation (assign, change status, etc.)
  fastify.put('/:id', async (request, reply) => {
    const { id } = request.params
    const { status, assignedToId, tags, aiSummary } = request.body
    
    const updateData = {}
    if (status) updateData.status = status
    if (assignedToId !== undefined) updateData.assignedToId = assignedToId
    if (tags) updateData.tags = tags
    if (aiSummary) updateData.aiSummary = aiSummary
    
    const conversation = await fastify.prisma.conversation.update({
      where: { id },
      data: updateData,
      include: {
        channel: true,
        contact: true,
        assignedTo: {
          select: { id: true, firstName: true, lastName: true }
        }
      }
    })
    
    // Emit real-time event
    const io = fastify.getIO()
    io.to(`conversation:${id}`).emit('conversation:updated', conversation)
    
    reply.send(conversation)
  })

  // Delete conversation
  fastify.delete('/:id', async (request, reply) => {
    const { id } = request.params
    
    await fastify.prisma.conversation.delete({
      where: { id }
    })
    
    reply.send({ success: true })
  })

  // Send message in conversation
  fastify.post('/:id/messages', async (request, reply) => {
    const { id: conversationId } = request.params
    const { content, type = 'TEXT', mediaUrl, mediaType, caption, replyToId, isInternal } = request.body
    
    const conversation = await fastify.prisma.conversation.findUnique({
      where: { id: conversationId },
      include: { channel: true, contact: true }
    })
    
    if (!conversation) {
      return reply.code(404).send({ error: 'Conversation not found' })
    }
    
    // Create message
    const message = await fastify.prisma.message.create({
      data: {
        conversationId,
        direction: 'OUTBOUND',
        type,
        content,
        mediaUrl,
        mediaType,
        caption,
        replyToId,
        isInternal: isInternal || false,
        sentById: request.user.id,
        status: 'SENT'
      },
      include: {
        sentBy: {
          select: { id: true, firstName: true, lastName: true, avatar: true }
        },
        replyTo: {
          select: { id: true, content: true, type: true }
        }
      }
    })
    
    // Update conversation last message
    await fastify.prisma.conversation.update({
      where: { id: conversationId },
      data: {
        lastMessageAt: new Date(),
        unreadCount: { increment: 1 }
      }
    })
    
    // Emit real-time event
    const io = fastify.getIO()
    io.to(`conversation:${conversationId}`).emit('message:new', {
      conversationId,
      message
    })
    
    // TODO: Send via channel (WhatsApp, Email, etc.)
    // This would call the appropriate channel client
    
    reply.code(201).send(message)
  })

  // Get messages with pagination
  fastify.get('/:id/messages', async (request, reply) => {
    const { id } = request.params
    const { page = 1, limit = 50, before } = request.query
    
    const where = { conversationId: id }
    
    if (before) {
      where.createdAt = { lt: new Date(before) }
    }
    
    const messages = await fastify.prisma.message.findMany({
      where,
      include: {
        sentBy: {
          select: { id: true, firstName: true, lastName: true, avatar: true }
        },
        replyTo: {
          select: { id: true, content: true, type: true }
        }
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: parseInt(limit)
    })
    
    // Reverse to get ascending order
    messages.reverse()
    
    reply.send({ messages, page: parseInt(page), limit: parseInt(limit) })
  })

  // Update message status
  fastify.patch('/messages/:messageId/status', async (request, reply) => {
    const { messageId } = request.params
    const { status, readAt, deliveredAt } = request.body
    
    const updateData = {}
    if (status) updateData.status = status
    if (readAt) updateData.readAt = new Date(readAt)
    if (deliveredAt) updateData.deliveredAt = new Date(deliveredAt)
    
    const message = await fastify.prisma.message.update({
      where: { id: messageId },
      data: updateData
    })
    
    // Emit real-time event
    const io = fastify.getIO()
    io.emit('message:status', {
      messageId,
      status: message.status,
      readAt: message.readAt,
      deliveredAt: message.deliveredAt
    })
    
    reply.send(message)
  })
}

module.exports = conversationRoutes
