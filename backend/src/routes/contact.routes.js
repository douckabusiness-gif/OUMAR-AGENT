const { authenticate } = require('../middlewares/auth.middleware')

/**
 * Contact Routes
 * CRM contact management
 */

async function contactRoutes(fastify, options) {
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

  // List contacts with filters
  fastify.get('/', async (request, reply) => {
    const { 
      page = 1, 
      limit = 20, 
      search,
      tags,
      channel
    } = request.query
    
    const where = {
      organizationId: request.user.organizationId
    }
    
    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search } },
        { email: { contains: search, mode: 'insensitive' } }
      ]
    }
    
    if (tags) {
      where.tags = { hasSome: Array.isArray(tags) ? tags : [tags] }
    }
    
    const contacts = await fastify.prisma.contact.findMany({
      where,
      include: {
        _count: {
          select: { conversations: true }
        },
        conversations: {
          take: 1,
          orderBy: { createdAt: 'desc' },
          include: {
            channel: { select: { type: true } }
          }
        }
      },
      orderBy: { updatedAt: 'desc' },
      skip: (page - 1) * limit,
      take: parseInt(limit)
    })
    
    const total = await fastify.prisma.contact.count({ where })
    
    reply.send({ contacts, total, page: parseInt(page), limit: parseInt(limit) })
  })

  // Get single contact
  fastify.get('/:id', async (request, reply) => {
    const { id } = request.params
    
    const contact = await fastify.prisma.contact.findUnique({
      where: { id },
      include: {
        conversations: {
          include: {
            channel: { select: { type: true, name: true } },
            messages: {
              take: 5,
              orderBy: { createdAt: 'desc' }
            }
          },
          orderBy: { lastMessageAt: 'desc' }
        }
      }
    })
    
    if (!contact) {
      return reply.code(404).send({ error: 'Contact not found' })
    }
    
    reply.send(contact)
  })

  // Create contact
  fastify.post('/', async (request, reply) => {
    const { firstName, lastName, phone, email, avatar, language, tags, notes, customFields } = request.body
    
    const contact = await fastify.prisma.contact.create({
      data: {
        firstName,
        lastName,
        phone,
        email,
        avatar,
        language,
        tags: tags || [],
        notes,
        customFields,
        organizationId: request.user.organizationId
      }
    })
    
    reply.code(201).send(contact)
  })

  // Update contact
  fastify.put('/:id', async (request, reply) => {
    const { id } = request.params
    const { firstName, lastName, phone, email, avatar, language, tags, notes, customFields } = request.body
    
    const contact = await fastify.prisma.contact.update({
      where: { id },
      data: { firstName, lastName, phone, email, avatar, language, tags, notes, customFields }
    })
    
    reply.send(contact)
  })

  // Delete contact
  fastify.delete('/:id', async (request, reply) => {
    const { id } = request.params
    
    await fastify.prisma.contact.delete({
      where: { id }
    })
    
    reply.send({ success: true })
  })

  // Add tag to contact
  fastify.post('/:id/tags', async (request, reply) => {
    const { id } = request.params
    const { tags } = request.body
    
    const contact = await fastify.prisma.contact.findUnique({ where: { id } })
    
    const updatedTags = [...new Set([...(contact.tags || []), ...tags])]
    
    const updated = await fastify.prisma.contact.update({
      where: { id },
      data: { tags: updatedTags }
    })
    
    reply.send(updated)
  })

  // Remove tag from contact
  fastify.delete('/:id/tags/:tag', async (request, reply) => {
    const { id, tag } = request.params
    
    const contact = await fastify.prisma.contact.findUnique({ where: { id } })
    
    const updatedTags = (contact.tags || []).filter(t => t !== tag)
    
    const updated = await fastify.prisma.contact.update({
      where: { id },
      data: { tags: updatedTags }
    })
    
    reply.send(updated)
  })

  // Merge contacts
  fastify.post('/merge', async (request, reply) => {
    const { contactId1, contactId2 } = request.body
    
    // TODO: Implement contact merge logic
    reply.code(501).send({ 
      error: 'Not Implemented',
      message: 'Contact merge not yet implemented' 
    })
  })

  // Import contacts (CSV)
  fastify.post('/import', async (request, reply) => {
    // TODO: Implement CSV import
    reply.code(501).send({ 
      error: 'Not Implemented',
      message: 'Contact import not yet implemented' 
    })
  })

  // Export contacts (CSV)
  fastify.get('/export', async (request, reply) => {
    // TODO: Implement CSV export
    reply.code(501).send({ 
      error: 'Not Implemented',
      message: 'Contact export not yet implemented' 
    })
  })
}

module.exports = contactRoutes
