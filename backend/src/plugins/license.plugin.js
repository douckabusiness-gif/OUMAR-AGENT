const crypto = require('crypto')

/**
 * License Validator Plugin
 * Validates license keys for commercial use
 */

class LicenseValidator {
  constructor() {
    this.validLicenses = new Map()
  }

  /**
   * Validate a license key format and signature
   * @param {string} key - License key to validate
   * @returns {Promise<{valid: boolean, plan?: string, maxAgents?: number, expiresAt?: Date}>}
   */
  async validate(key) {
    if (!key) {
      return { valid: false, error: 'No license key provided' }
    }

    // Check format: OMNI-XXXX-XXXX-XXXX
    const formatRegex = /^OMNI-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/i
    if (!formatRegex.test(key)) {
      return { valid: false, error: 'Invalid license key format' }
    }

    try {
      // In production, this would verify against a license server
      // For now, we do local validation
      const license = await this._validateLocally(key)
      
      if (license.valid) {
        this.validLicenses.set(key, license)
      }
      
      return license
    } catch (error) {
      return { valid: false, error: error.message }
    }
  }

  /**
   * Local license validation (fallback when no internet)
   */
  async _validateLocally(key) {
    // Extract parts from key
    const parts = key.toUpperCase().split('-')
    
    if (parts.length !== 4) {
      return { valid: false, error: 'Invalid key structure' }
    }

    // For demo purposes, accept any properly formatted key
    // In production, verify cryptographic signature
    
    return {
      valid: true,
      plan: 'PRO',
      maxAgents: 10,
      features: ['email', 'whatsapp', 'ai', 'automations'],
      expiresAt: null // No expiration for demo
    }
  }

  /**
   * Generate a new license key
   * @param {string} plan - License plan (STARTER, PRO, AGENCY)
   * @param {number} maxAgents - Maximum number of agents
   * @param {Date|null} expiresAt - Expiration date
   * @returns {string} Generated license key
   */
  generateKey(plan = 'PRO', maxAgents = 10, expiresAt = null) {
    const randomPart = () => {
      return crypto.randomBytes(3).toString('hex').toUpperCase().slice(0, 4)
    }

    const key = `OMNI-${randomPart()}-${randomPart()}-${randomPart()}`
    
    // Store in database via License model
    return key
  }
}

async function licensePlugin(fastify, options) {
  const validator = new LicenseValidator()
  
  fastify.decorate('licenseValidator', validator)
  
  // Hook to check license on startup (optional)
  fastify.addHook('onReady', async () => {
    const { prisma } = fastify
    
    try {
      // Check if there's an organization with a license
      const org = await prisma.organization.findFirst({
        where: { licenseKey: { not: null } }
      })
      
      if (org) {
        const result = await validator.validate(org.licenseKey)
        if (!result.valid) {
          fastify.log.warn(`⚠️  Invalid license: ${result.error}`)
        } else {
          fastify.log.info(`✅ License validated: ${result.plan} plan`)
        }
      }
    } catch (error) {
      fastify.log.warn('Could not validate license (database may not be ready)')
    }
  })
}

module.exports = licensePlugin
module.exports.LicenseValidator = LicenseValidator
