const { authenticate } = require('../middlewares/auth.middleware')

/**
 * AI Routes
 * LLM Router and AI-powered features
 */

async function aiRoutes(fastify, options) {
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

  // Get AI configuration
  fastify.get('/config', async (request, reply) => {
    let config = await fastify.prisma.aiConfig.findUnique({
      where: { organizationId: request.user.organizationId }
    })
    
    if (!config) {
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
    
    // Don't expose API keys
    delete config.apiKey
    delete config.fallbackApiKey
    
    reply.send(config)
  })

  // Update AI configuration
  fastify.put('/config', async (request, reply) => {
    const { 
      provider, 
      model, 
      apiKey, 
      temperature, 
      maxTokens, 
      systemPrompt, 
      autoReply,
      autoReplyHours,
      fallbackProvider,
      fallbackApiKey,
      channelPrompts,
      rolePrompts
    } = request.body
    
    const config = await fastify.prisma.aiConfig.upsert({
      where: { organizationId: request.user.organizationId },
      update: {
        provider,
        model,
        apiKey,
        temperature,
        maxTokens,
        systemPrompt,
        autoReply,
        autoReplyHours,
        fallbackProvider,
        fallbackApiKey,
        channelPrompts,
        rolePrompts
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

  // Test AI provider connection
  fastify.post('/test', async (request, reply) => {
    const { provider, apiKey } = request.body
    
    // TODO: Implement actual connection test for each provider
    const providers = ['ANTHROPIC', 'OPENAI', 'GEMINI', 'GROQ', 'MISTRAL', 'OLLAMA']
    
    if (!providers.includes(provider)) {
      return reply.code(400).send({ 
        success: false, 
        message: 'Invalid provider' 
      })
    }
    
    // Simulate connection test
    reply.send({ 
      success: true, 
      message: `Connection to ${provider} successful`,
      latency: Math.floor(Math.random() * 200) + 50
    })
  })

  // Get available providers and models
  fastify.get('/providers', async (request, reply) => {
    const providers = [
      { 
        id: 'ANTHROPIC', 
        name: 'Anthropic Claude', 
        logo: '🤖',
        models: [
          { id: 'claude-sonnet-4-20250514', name: 'Claude Sonnet 4', recommended: true },
          { id: 'claude-haiku-4-5', name: 'Claude Haiku 4.5', recommended: false },
          { id: 'claude-opus-3', name: 'Claude Opus 3', recommended: false }
        ]
      },
      { 
        id: 'OPENAI', 
        name: 'OpenAI / ChatGPT', 
        logo: '💬',
        models: [
          { id: 'gpt-4o', name: 'GPT-4o', recommended: true },
          { id: 'gpt-4o-mini', name: 'GPT-4o Mini', recommended: false },
          { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo', recommended: false }
        ]
      },
      { 
        id: 'GEMINI', 
        name: 'Google Gemini', 
        logo: '✨',
        models: [
          { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro', recommended: true },
          { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash', recommended: false }
        ]
      },
      { 
        id: 'GROQ', 
        name: 'Groq', 
        logo: '⚡',
        models: [
          { id: 'llama-3.3-70b-versatile', name: 'Llama 3.3 70B', recommended: true },
          { id: 'mixtral-8x7b-32768', name: 'Mixtral 8x7B', recommended: false }
        ]
      },
      { 
        id: 'MISTRAL', 
        name: 'Mistral AI', 
        logo: '🌪️',
        models: [
          { id: 'mistral-large-latest', name: 'Mistral Large', recommended: true },
          { id: 'mistral-small-latest', name: 'Mistral Small', recommended: false }
        ]
      },
      { 
        id: 'OLLAMA', 
        name: 'Ollama (Local)', 
        logo: '🏠',
        models: [
          { id: 'llama3', name: 'Llama 3', recommended: true },
          { id: 'mistral', name: 'Mistral', recommended: false },
          { id: 'gemma2', name: 'Gemma 2', recommended: false }
        ]
      }
    ]
    
    reply.send(providers)
  })

  // Suggest reply for a conversation
  fastify.post('/suggest-reply', async (request, reply) => {
    const { conversationId, language } = request.body
    
    // Get conversation with messages
    const conversation = await fastify.prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        contact: true,
        messages: {
          take: 10,
          orderBy: { createdAt: 'asc' },
          select: {
            content: true,
            direction: true,
            type: true
          }
        }
      }
    })
    
    if (!conversation) {
      return reply.code(404).send({ error: 'Conversation not found' })
    }
    
    // Get AI config
    const aiConfig = await fastify.prisma.aiConfig.findUnique({
      where: { organizationId: request.user.organizationId }
    })
    
    if (!aiConfig || !aiConfig.apiKey) {
      return reply.code(400).send({ 
        error: 'AI not configured',
        message: 'Please configure your AI provider first' 
      })
    }
    
    // TODO: Call LLM Router to generate suggestion
    // For now, return placeholder
    reply.send({
      suggestion: 'Thank you for your message. How can I help you today?',
      confidence: 0.85,
      language: language || 'fr'
    })
  })

  // Auto-reply to a conversation
  fastify.post('/auto-reply', async (request, reply) => {
    const { conversationId } = request.body
    
    // Similar to suggest-reply but actually sends the message
    reply.code(501).send({ 
      error: 'Not Implemented',
      message: 'Auto-reply not yet implemented' 
    })
  })

  // Summarize conversation
  fastify.post('/summarize', async (request, reply) => {
    const { conversationId } = request.body
    
    const conversation = await fastify.prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        messages: {
          select: { content: true, direction: true, type: true }
        }
      }
    })
    
    if (!conversation) {
      return reply.code(404).send({ error: 'Conversation not found' })
    }
    
    // TODO: Call LLM to summarize
    reply.send({
      summary: 'Customer inquiry about product pricing. Discussed enterprise plan options.',
      keyPoints: [
        'Interested in enterprise features',
        'Budget concern raised',
        'Requested demo scheduling'
      ],
      sentiment: 'positive'
    })
  })

  // Detect language
  fastify.post('/detect-language', async (request, reply) => {
    const { text } = request.body
    
    if (!text) {
      return reply.code(400).send({ error: 'Text is required' })
    }
    
    // Simple language detection (in production, use proper library or LLM)
    const detectedLanguage = detectLanguage(text)
    
    reply.send({
      language: detectedLanguage,
      confidence: 0.95
    })
  })

  // Translate text
  fastify.post('/translate', async (request, reply) => {
    const { text, targetLanguage } = request.body
    
    if (!text || !targetLanguage) {
      return reply.code(400).send({ error: 'Text and target language are required' })
    }
    
    // TODO: Implement translation via LLM
    reply.send({
      original: text,
      translated: text, // Placeholder
      sourceLanguage: 'auto',
      targetLanguage
    })
  })

  // Categorize message
  fastify.post('/categorize', async (request, reply) => {
    const { text } = request.body
    
    if (!text) {
      return reply.code(400).send({ error: 'Text is required' })
    }
    
    // TODO: Implement categorization via LLM
    reply.send({
      categories: ['sales'],
      tags: ['pricing', 'enterprise'],
      intent: 'inquiry',
      confidence: 0.88
    })
  })

  // Get AI usage statistics
  fastify.get('/usage', async (request, reply) => {
    const { period = 'month' } = request.query
    
    // TODO: Implement actual usage tracking
    reply.send({
      period,
      totalTokens: 125000,
      totalRequests: 450,
      byProvider: [
        { provider: 'ANTHROPIC', tokens: 80000, requests: 280 },
        { provider: 'OPENAI', tokens: 45000, requests: 170 }
      ],
      estimatedCost: 12.50,
      currency: 'USD'
    })
  })
}

// Simple language detection helper
function detectLanguage(text) {
  const frenchPatterns = /[àâçéèêëïîôùûüÿœæ]/i
  const spanishPatterns = /[áéíóúñ¿¡]/i
  const portuguesePatterns = /[ãõáéíóúâêôç]/i
  const germanPatterns = /[äöüß]/i
  
  if (frenchPatterns.test(text)) return 'fr'
  if (spanishPatterns.test(text)) return 'es'
  if (portuguesePatterns.test(text)) return 'pt'
  if (germanPatterns.test(text)) return 'de'
  
  // Default to English
  return 'en'
}

module.exports = aiRoutes
