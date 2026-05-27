const { Server } = require('socket.io')

/**
 * Socket.io Plugin for Fastify
 * Handles real-time WebSocket communication
 */

let io = null

async function socketPlugin(fastify, options) {
  // Create Socket.io server attached to Fastify's HTTP server
  io = new Server(fastify.server, {
    cors: {
      origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
      credentials: true
    },
    transports: ['websocket', 'polling']
  })

  // Add Socket.io to fastify instance
  fastify.decorate('io', io)
  fastify.decorate('getIO', () => io)

  // Connection handler
  io.on('connection', (socket) => {
    console.log(`🔌 Client connected: ${socket.id}`)

    // Join a conversation room
    socket.on('conversation:join', ({ conversationId }) => {
      socket.join(`conversation:${conversationId}`)
      console.log(`User ${socket.id} joined conversation ${conversationId}`)
    })

    // Leave a conversation room
    socket.on('conversation:leave', ({ conversationId }) => {
      socket.leave(`conversation:${conversationId}`)
    })

    // Agent typing indicator
    socket.on('agent:typing', ({ conversationId, isTyping }) => {
      socket.to(`conversation:${conversationId}`).emit('agent:typing', {
        conversationId,
        isTyping,
        agentId: socket.userId
      })
    })

    // Mark conversation as read
    socket.on('conversation:read', ({ conversationId }) => {
      socket.to(`conversation:${conversationId}`).emit('conversation:read', {
        conversationId,
        userId: socket.userId
      })
    })

    // Disconnect handler
    socket.on('disconnect', () => {
      console.log(`❌ Client disconnected: ${socket.id}`)
    })

    // Error handler
    socket.on('error', (error) => {
      console.error(`Socket error:`, error)
    })
  })
}

module.exports = socketPlugin
