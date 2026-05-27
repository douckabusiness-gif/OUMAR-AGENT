const { PrismaClient } = require('@prisma/client')

/**
 * Prisma Database Plugin for Fastify
 * Creates a singleton Prisma client instance
 */

const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' 
    ? ['query', 'info', 'warn', 'error'] 
    : ['error'],
})

async function dbPlugin(fastify, options) {
  // Add Prisma client to fastify instance
  fastify.decorate('prisma', prisma)
  
  // Graceful shutdown
  fastify.addHook('onClose', async (instance) => {
    await prisma.$disconnect()
  })
}

module.exports = dbPlugin
module.exports.prisma = prisma
