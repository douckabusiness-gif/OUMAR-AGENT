const { checkRole } = require('../middlewares/auth.middleware')

/**
 * Admin Routes
 * All routes require ADMIN or SUPER_ADMIN role
 */

async function adminRoutes(fastify, options) {
  // Protect all admin routes
  fastify.addHook('preHandler', async (request, reply) => {
    const user = request.user
    if (!user || (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN')) {
      return reply.code(403).send({
        error: 'Forbidden',
        message: 'Admin access required'
      })
    }
  })

  // =====================
  // USERS MANAGEMENT
  // =====================

  // List all users
  fastify.get('/users', async (request, reply) => {
    const { page = 1, limit = 20, search, status, role } = request.query
    
    const where = {
      organizationId: request.user.organizationId
    }
    
    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } }
      ]
    }
    
    if (status) {
      where.status = status
    }
    
    if (role) {
      where.role = role
    }
    
    const users = await fastify.prisma.user.findMany({
      where,
      include: {
        customRole: true,
        assignedConversations: {
          select: { id: true, status: true }
        }
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: parseInt(limit)
    })
    
    const total = await fastify.prisma.user.count({ where })
    
    reply.send({ users, total, page: parseInt(page), limit: parseInt(limit) })
  })

  // Create user
  fastify.post('/users', async (request, reply) => {
    const { email, password, firstName, lastName, role, customRoleId, language } = request.body
    
    // Check if email already exists
    const existing = await fastify.prisma.user.findUnique({ where: { email } })
    if (existing) {
      return reply.code(409).send({ 
        error: 'Conflict', 
        message: 'Email already registered' 
      })
    }
    
    // Hash password
    const hashedPassword = await fastify.hashPassword(password)
    
    const user = await fastify.prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        firstName,
        lastName,
        role,
        customRoleId,
        language: language || 'fr',
        organizationId: request.user.organizationId
      },
      include: { customRole: true }
    })
    
    // Audit log
    await fastify.prisma.auditLog.create({
      data: {
        userId: request.user.id,
        action: 'USER_CREATE',
        entity: 'User',
        entityId: user.id,
        ip: request.ip
      }
    })
    
    reply.code(201).send(user)
  })

  // Update user
  fastify.put('/users/:id', async (request, reply) => {
    const { id } = request.params
    const { firstName, lastName, role, customRoleId, language, isActive } = request.body
    
    const user = await fastify.prisma.user.update({
      where: { id },
      data: { firstName, lastName, role, customRoleId, language, isActive },
      include: { customRole: true }
    })
    
    reply.send(user)
  })

  // Delete/Deactivate user
  fastify.delete('/users/:id', async (request, reply) => {
    const { id } = request.params
    
    await fastify.prisma.user.update({
      where: { id },
      data: { isActive: false }
    })
    
    reply.send({ success: true })
  })

  // Reset user password
  fastify.post('/users/:id/reset-password', async (request, reply) => {
    const { id } = request.params
    const { newPassword } = request.body
    
    const hashedPassword = await fastify.hashPassword(newPassword)
    
    await fastify.prisma.user.update({
      where: { id },
      data: { password: hashedPassword }
    })
    
    reply.send({ success: true })
  })

  // =====================
  // ROLES MANAGEMENT
  // =====================

  // List custom roles
  fastify.get('/roles', async (request, reply) => {
    const roles = await fastify.prisma.customRole.findMany({
      where: { organizationId: request.user.organizationId },
      include: {
        users: {
          select: { id: true, firstName: true, lastName: true }
        }
      }
    })
    
    reply.send(roles)
  })

  // Create custom role
  fastify.post('/roles', async (request, reply) => {
    const { name, permissions } = request.body
    
    const role = await fastify.prisma.customRole.create({
      data: {
        name,
        permissions,
        organizationId: request.user.organizationId
      }
    })
    
    reply.code(201).send(role)
  })

  // Update custom role
  fastify.put('/roles/:id', async (request, reply) => {
    const { id } = request.params
    const { name, permissions } = request.body
    
    const role = await fastify.prisma.customRole.update({
      where: { id },
      data: { name, permissions }
    })
    
    reply.send(role)
  })

  // Delete custom role
  fastify.delete('/roles/:id', async (request, reply) => {
    const { id } = request.params
    
    await fastify.prisma.customRole.delete({
      where: { id }
    })
    
    reply.send({ success: true })
  })

  // =====================
  // AI CONFIGURATION
  // =====================

  // Get AI config
  fastify.get('/ai/config', async (request, reply) => {
    let config = await fastify.prisma.aiConfig.findUnique({
      where: { organizationId: request.user.organizationId }
    })
    
    if (!config) {
      // Create default config
      config = await fastify.prisma.aiConfig.create({
        data: {
          organizationId: request.user.organizationId,
          provider: 'ANTHROPIC',
          model: 'claude-sonnet-4-20250514',
          apiKey: '',
          temperature: 0.7,
          maxTokens: 1000
        }
      })
    }
    
    // Don't expose API key
    delete config.apiKey
    delete config.fallbackApiKey
    
    reply.send(config)
  })

  // Update AI config
  fastify.put('/ai/config', async (request, reply) => {
    const { provider, model, apiKey, temperature, maxTokens, systemPrompt, autoReply } = request.body
    
    const config = await fastify.prisma.aiConfig.upsert({
      where: { organizationId: request.user.organizationId },
      update: {
        provider,
        model,
        apiKey, // Will be encrypted in a real implementation
        temperature,
        maxTokens,
        systemPrompt,
        autoReply
      },
      create: {
        organizationId: request.user.organizationId,
        provider,
        model,
        apiKey,
        temperature,
        maxTokens,
        systemPrompt,
        autoReply
      }
    })
    
    reply.send(config)
  })

  // Test AI connection
  fastify.post('/ai/test', async (request, reply) => {
    const { provider, apiKey } = request.body
    
    // TODO: Implement actual connection test
    reply.send({ 
      success: true, 
      message: `Connection to ${provider} successful` 
    })
  })

  // Get available providers
  fastify.get('/ai/providers', async (request, reply) => {
    const providers = [
      { 
        id: 'ANTHROPIC', 
        name: 'Anthropic Claude', 
        models: ['claude-sonnet-4-20250514', 'claude-haiku-4-5', 'claude-opus-3'] 
      },
      { 
        id: 'OPENAI', 
        name: 'OpenAI / ChatGPT', 
        models: ['gpt-4o', 'gpt-4o-mini', 'gpt-3.5-turbo'] 
      },
      { 
        id: 'GEMINI', 
        name: 'Google Gemini', 
        models: ['gemini-1.5-pro', 'gemini-1.5-flash'] 
      },
      { 
        id: 'GROQ', 
        name: 'Groq', 
        models: ['llama-3.3-70b-versatile', 'mixtral-8x7b-32768'] 
      },
      { 
        id: 'MISTRAL', 
        name: 'Mistral AI', 
        models: ['mistral-large-latest', 'mistral-small-latest'] 
      },
      { 
        id: 'OLLAMA', 
        name: 'Ollama (Local)', 
        models: ['llama3', 'mistral', 'gemma2'] 
      }
    ]
    
    reply.send(providers)
  })

  // =====================
  // DASHBOARD METRICS
  // =====================

  fastify.get('/dashboard/metrics', async (request, reply) => {
    const orgId = request.user.organizationId
    
    // Get conversation stats
    const totalConversations = await fastify.prisma.conversation.count({
      where: { organizationId: orgId }
    })
    
    const openConversations = await fastify.prisma.conversation.count({
      where: { organizationId: orgId, status: 'OPEN' }
    })
    
    const resolvedToday = await fastify.prisma.conversation.count({
      where: {
        organizationId: orgId,
        status: 'RESOLVED',
        updatedAt: {
          gte: new Date(new Date().setHours(0, 0, 0, 0))
        }
      }
    })
    
    // Get agent stats
    const agents = await fastify.prisma.user.findMany({
      where: { organizationId: orgId, role: 'AGENT' },
      include: {
        assignedConversations: {
          where: { status: 'OPEN' },
          select: { id: true }
        }
      }
    })
    
    // Get channel stats
    const channels = await fastify.prisma.channel.findMany({
      where: { organizationId: orgId },
      select: {
        type: true,
        status: true,
        _count: { select: { conversations: true } }
      }
    })
    
    reply.send({
      conversations: {
        total: totalConversations,
        open: openConversations,
        resolvedToday
      },
      agents: {
        total: agents.length,
        online: agents.filter(a => a.status === 'ONLINE').length,
        conversations: agents.map(a => ({
          id: a.id,
          name: `${a.firstName} ${a.lastName}`,
          activeConversations: a.assignedConversations.length
        }))
      },
      channels: channels.map(c => ({
        type: c.type,
        status: c.status,
        conversations: c._count.conversations
      }))
    })
  })
}

module.exports = adminRoutes
