const bcrypt = require('bcrypt')
const { z } = require('zod')

/**
 * Authentication Middleware
 * Verifies JWT tokens and attaches user to request
 */

async function authenticate(fastify, request, reply) {
  try {
    await request.jwtVerify()
    
    // Attach user to request
    request.user = request.user
    
    // Check if user is active
    const user = await fastify.prisma.user.findUnique({
      where: { id: request.user.id },
      include: { organization: true }
    })
    
    if (!user || !user.isActive) {
      return reply.code(401).send({ 
        error: 'Unauthorized', 
        message: 'User account is deactivated' 
      })
    }
    
    // Update last seen
    await fastify.prisma.user.update({
      where: { id: user.id },
      data: { lastSeen: new Date() }
    })
    
    request.user = user
  } catch (error) {
    return reply.code(401).send({ 
      error: 'Unauthorized', 
      message: 'Invalid or expired token' 
    })
  }
}

/**
 * Permission Checker Decorator
 * Checks if user has required permissions
 */
function checkPermission(requiredPermission) {
  return async (fastify, request, reply) => {
    await authenticate(fastify, request, reply)
    
    const user = request.user
    if (!user) return
    
    // Super admin has all permissions
    if (user.role === 'SUPER_ADMIN') {
      return
    }
    
    // Admin has most permissions
    if (user.role === 'ADMIN') {
      const adminPermissions = ['canReply', 'canTransfer', 'canClose', 'canViewReports']
      if (adminPermissions.includes(requiredPermission)) {
        return
      }
    }
    
    // Check custom role permissions
    if (user.customRole && user.customRole.permissions) {
      const permissions = JSON.parse(user.customRole.permissions)
      if (permissions[requiredPermission]) {
        return
      }
    }
    
    return reply.code(403).send({
      error: 'Forbidden',
      message: `Missing required permission: ${requiredPermission}`
    })
  }
}

/**
 * Role Checker Decorator
 * Checks if user has required role
 */
function checkRole(requiredRoles) {
  const roles = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles]
  
  return async (fastify, request, reply) => {
    await authenticate(fastify, request, reply)
    
    const user = request.user
    if (!user) return
    
    if (!roles.includes(user.role)) {
      return reply.code(403).send({
        error: 'Forbidden',
        message: `Required role: ${roles.join(' or ')}`
      })
    }
  }
}

/**
 * Password hashing utility
 */
async function hashPassword(password) {
  const saltRounds = 10
  return bcrypt.hash(password, saltRounds)
}

/**
 * Password verification utility
 */
async function verifyPassword(password, hash) {
  return bcrypt.compare(password, hash)
}

// Validation schemas
const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters')
})

const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  role: z.enum(['ADMIN', 'AGENT']).optional().default('AGENT')
})

module.exports = {
  authenticate,
  checkPermission,
  checkRole,
  hashPassword,
  verifyPassword,
  loginSchema,
  registerSchema
}
