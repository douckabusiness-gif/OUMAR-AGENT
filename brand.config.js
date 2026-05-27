/**
 * OmniDesk Brand Configuration
 * White-label settings - Modify this file to customize the application
 */

module.exports = {
  // Application name and branding
  appName: 'OmniDesk',
  appTagline: 'Votre centre de communication intelligent',
  
  // Logo paths (relative to project root)
  logoPath: './assets/logo.png',
  faviconPath: './assets/favicon.ico',
  
  // Brand colors (hex values)
  colors: {
    primary: '#6366f1',      // Main brand color
    primaryDark: '#4f46e5',  // Hover/darker variant
    secondary: '#10b981',    // Secondary/accent color
    accent: '#f59e0b',       // Accent/highlight color
    background: '#f8fafc',   // Background color
    surface: '#ffffff',      // Card/surface color
  },
  
  // Contact and support
  supportEmail: 'support@omnidesk.app',
  docsUrl: 'https://docs.omnidesk.app',
  websiteUrl: 'https://omnidesk.app',
  
  // Localization
  defaultLanguage: 'fr',
  availableLanguages: ['fr', 'en', 'es', 'pt', 'ar', 'zh'],
  
  // Features toggle
  features: {
    emailChannel: true,
    whatsappBaileys: true,
    whatsappCloud: true,
    aiSuggestions: true,
    aiAutoReply: true,
    automations: true,
    analytics: true,
    customRoles: true,
    apiAccess: true,
  },
  
  // Limits
  limits: {
    maxAgents: 10,          // Default max agents (can be overridden by license)
    maxChannels: 5,         // Max channels per organization
    maxFileSize: 52428800,  // 50MB max file upload
    messageRetention: 365,  // Days to keep messages
  },
  
  // Demo mode (for trial installations)
  demoMode: false,
  demoExpiryDays: 14,
}
