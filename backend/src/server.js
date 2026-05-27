const Fastify = require('fastify')
const cors = require('@fastify/cors')
const jwt = require('@fastify/jwt')
const websocket = require('@fastify/websocket')
const multipart = require('@fastify/multipart')
const staticPlugin = require('@fastify/static')
const { Server } = require('socket.io')
const pino = require('pino')
const path = require('path')
require('dotenv').config()

// Import routes
const authRoutes = require('./routes/auth.routes')
const adminRoutes = require('./routes/admin.routes')
const conversationRoutes = require('./routes/conversation.routes')
const channelRoutes = require('./routes/channel.routes')
const contactRoutes = require('./routes/contact.routes')
const aiRoutes = require('./routes/ai.routes')
const webhookRoutes = require('./routes/webhook.routes')

// Import plugins
const socketPlugin = require('./plugins/socket.plugin')
const prismaPlugin = require('./plugins/prisma.plugin')
const licensePlugin = require('./plugins/license.plugin')

// Create logger
const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport: {
    target: 'pino-pretty',
    options: {
      translateTime: 'HH:MM:ss Z',
      ignore: 'pid,hostname'
    }
  }
})

/**
 * OmniDesk Backend Server
 * Main entry point for the application
 */
async function buildServer() {
  const server = Fastify({
    logger: {
      level: process.env.LOG_LEVEL || 'info'
    }
  })

  // Register CORS
  await server.register(cors, {
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    credentials: process.env.CORS_CREDENTIALS === 'true'
  })

  // Register JWT
  await server.register(jwt, {
    secret: process.env.JWT_SECRET || 'fallback-secret-change-in-production',
    sign: {
      expiresIn: process.env.JWT_EXPIRES_IN || '15m'
    }
  })

  // Register WebSocket
  await server.register(websocket)

  // Register Multipart (file uploads)
  await server.register(multipart, {
    limits: {
      fileSize: parseInt(process.env.MAX_FILE_SIZE) || 50 * 1024 * 1024 // 50MB
    }
  })

  // Register Static files (media storage)
  await server.register(staticPlugin, {
    root: path.join(__dirname, '../storage'),
    prefix: '/media/',
    decorateReply: false
  })

  // Register Prisma plugin (database connection)
  await server.register(prismaPlugin)

  // Register License validator
  await server.register(licensePlugin)

  // Register Socket.io plugin
  await server.register(socketPlugin)

  // Health check endpoint
  server.get('/health', async (request, reply) => {
    return { status: 'ok', timestamp: new Date().toISOString() }
  })

  // API Routes
  await server.register(authRoutes, { prefix: '/api/auth' })
  await server.register(adminRoutes, { prefix: '/api/admin' })
  await server.register(conversationRoutes, { prefix: '/api/conversations' })
  await server.register(channelRoutes, { prefix: '/api/channels' })
  await server.register(contactRoutes, { prefix: '/api/contacts' })
  await server.register(aiRoutes, { prefix: '/api/ai' })
  await server.register(webhookRoutes, { prefix: '/api/webhooks' })

  // 404 handler
  server.setNotFoundHandler((request, reply) => {
    reply.code(404).send({ error: 'Not Found', message: 'Route not found' })
  })

  // Global error handler
  server.setErrorHandler((error, request, reply) => {
    logger.error({ err: error }, 'Global error handler')
    
    reply.code(error.statusCode || 500).send({
      error: error.name || 'Internal Server Error',
      message: error.message || 'An unexpected error occurred'
    })
  })

  return server
}

// Start server
const start = async () => {
  const server = await buildServer()
  
  try {
    const port = parseInt(process.env.PORT) || 3000
    const host = process.env.HOST || '0.0.0.0'
    
    await server.listen({ port, address: host })
    logger.info(`🚀 OmniDesk server running at http://${host}:${port}`)
    logger.info(`📊 Environment: ${process.env.NODE_ENV || 'development'}`)
  } catch (err) {
    logger.error(err, 'Failed to start server')
    process.exit(1)
  }
}

start()

module.exports = buildServer
