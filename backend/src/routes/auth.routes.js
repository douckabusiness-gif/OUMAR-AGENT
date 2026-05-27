const { hashPassword, verifyPassword, loginSchema } = require('../middlewares/auth.middleware')

/**
 * Authentication Routes
 * POST /api/auth/login - Login and get JWT tokens
 * POST /api/auth/refresh - Refresh access token
 * POST /api/auth/logout - Logout (invalidate refresh token)
 * POST /api/auth/forgot-password - Request password reset
 * POST /api/auth/reset-password - Reset password with token
 * GET /api/auth/me - Get current user profile
 * PUT /api/auth/me - Update current user profile
 */

async function authRoutes(fastify, options) {
  // Login
  fastify.post('/login', async (request, reply) => {
    try {
      const { email, password } = loginSchema.parse(request.body)
      
      // Find user with organization
      const user = await fastify.prisma.user.findUnique({
        where: { email },
        include: { 
          organization: true,
          customRole: true
        }
      })
      
      if (!user) {
        return reply.code(401).send({ 
          error: 'Unauthorized', 
          message: 'Invalid email or password' 
        })
      }
      
      // Verify password
      const isValid = await verifyPassword(password, user.password)
      if (!isValid) {
        return reply.code(401).send({ 
          error: 'Unauthorized', 
          message: 'Invalid email or password' 
        })
      }
      
      // Check if user is active
      if (!user.isActive) {
        return reply.code(403).send({ 
          error: 'Forbidden', 
          message: 'Account is deactivated' 
        })
      }
      
      // Generate tokens
      const accessToken = fastify.jwt.sign({ 
        id: user.id, 
        email: user.email,
        role: user.role 
      })
      
      const refreshToken = fastify.jwt.sign({ 
        id: user.id 
      }, { expiresIn: '30d' })
      
      // Update last seen
      await fastify.prisma.user.update({
        where: { id: user.id },
        data: { lastSeen: new Date(), status: 'ONLINE' }
      })
      
      // Log audit
      await fastify.prisma.auditLog.create({
        data: {
          userId: user.id,
          action: 'LOGIN',
          entity: 'User',
          entityId: user.id,
          ip: request.ip
        }
      })
      
      reply.send({
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          avatar: user.avatar,
          role: user.role,
          language: user.language,
          organization: {
            id: user.organization.id,
            name: user.organization.name,
            logo: user.organization.logo,
            primaryColor: user.organization.primaryColor,
            defaultLanguage: user.organization.defaultLanguage
          }
        },
        tokens: {
          accessToken,
          refreshToken
        }
      })
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.code(400).send({ 
          error: 'Validation Error', 
          details: error.errors 
        })
      }
      throw error
    }
  })
  
  // Refresh token
  fastify.post('/refresh', async (request, reply) => {
    try {
      const { refreshToken } = request.body
      
      if (!refreshToken) {
        return reply.code(400).send({ 
          error: 'Bad Request', 
          message: 'Refresh token is required' 
        })
      }
      
      // Verify refresh token
      const decoded = fastify.jwt.verify(refreshToken)
      
      // Generate new access token
      const user = await fastify.prisma.user.findUnique({
        where: { id: decoded.id },
        include: { organization: true }
      })
      
      if (!user || !user.isActive) {
        return reply.code(401).send({ 
          error: 'Unauthorized', 
          message: 'User not found or inactive' 
        })
      }
      
      const accessToken = fastify.jwt.sign({ 
        id: user.id, 
        email: user.email,
        role: user.role 
      })
      
      reply.send({ accessToken })
    } catch (error) {
      return reply.code(401).send({ 
        error: 'Unauthorized', 
        message: 'Invalid refresh token' 
      })
    }
  })
  
  // Logout
  fastify.post('/logout', {
    preHandler: [fastify.authenticate]
  }, async (request, reply) => {
    try {
      // Update user status
      await fastify.prisma.user.update({
        where: { id: request.user.id },
        data: { status: 'OFFLINE', lastSeen: new Date() }
      })
      
      // Log audit
      await fastify.prisma.auditLog.create({
        data: {
          userId: request.user.id,
          action: 'LOGOUT',
          entity: 'User',
          entityId: request.user.id,
          ip: request.ip
        }
      })
      
      reply.send({ success: true })
    } catch (error) {
      fastify.log.error(error, 'Logout error')
      reply.send({ success: true }) // Still succeed even if DB update fails
    }
  })
  
  // Get current user
  fastify.get('/me', {
    preHandler: [fastify.authenticate]
  }, async (request, reply) => {
    const user = await fastify.prisma.user.findUnique({
      where: { id: request.user.id },
      include: { 
        organization: true,
        customRole: true
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        avatar: true,
        role: true,
        language: true,
        status: true,
        organizationId: true,
        organization: {
          select: {
            id: true,
            name: true,
            logo: true,
            primaryColor: true,
            defaultLanguage: true,
            timezone: true
          }
        },
        customRole: {
          select: {
            id: true,
            name: true,
            permissions: true
          }
        }
      }
    })
    
    reply.send(user)
  })
  
  // Update current user
  fastify.put('/me', {
    preHandler: [fastify.authenticate]
  }, async (request, reply) => {
    try {
      const { firstName, lastName, avatar, language } = request.body
      
      const updatedUser = await fastify.prisma.user.update({
        where: { id: request.user.id },
        data: { firstName, lastName, avatar, language },
        include: { organization: true }
      })
      
      reply.send({
        id: updatedUser.id,
        email: updatedUser.email,
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
        avatar: updatedUser.avatar,
        language: updatedUser.language,
        organization: {
          id: updatedUser.organization.id,
          name: updatedUser.organization.name,
          logo: updatedUser.organization.logo,
          primaryColor: updatedUser.organization.primaryColor
        }
      })
    } catch (error) {
      fastify.log.error(error, 'Update user error')
      return reply.code(500).send({ 
        error: 'Internal Server Error',
        message: 'Failed to update profile'
      })
    }
  })
  
  // Forgot password
  fastify.post('/forgot-password', async (request, reply) => {
    const { email } = request.body
    
    const user = await fastify.prisma.user.findUnique({ where: { email } })
    
    // Always return success to prevent email enumeration
    reply.send({ 
      success: true, 
      message: 'If the email exists, a reset link has been sent' 
    })
    
    // TODO: Send actual reset email
  })
  
  // Reset password
  fastify.post('/reset-password', async (request, reply) => {
    const { token, newPassword } = request.body
    
    // TODO: Implement token verification and password reset
    reply.code(501).send({ 
      error: 'Not Implemented',
      message: 'Password reset not yet implemented' 
    })
  })
}

module.exports = authRoutes
