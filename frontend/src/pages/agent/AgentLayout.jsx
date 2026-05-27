import { Outlet, Link, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { 
  MessageSquare, Settings, LogOut, Bell, Search, 
  Menu, X, User, Shield, BarChart3, Zap 
} from 'lucide-react'
import { useAuthStore } from '../../stores/authStore'

export default function AgentLayout() {
  const { t, i18n } = useTranslation()
  const location = useLocation()
  const { user, logout } = useAuthStore()
  
  const isActive = (path) => {
    return location.pathname === path || location.pathname.startsWith(path + '/')
  }

  const handleLogout = () => {
    logout()
  }

  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng)
  }

  return (
    <div className="h-screen flex bg-gray-50">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
        {/* Logo */}
        <div className="p-4 border-b border-gray-200">
          <h1 className="text-xl font-bold text-primary">OmniDesk</h1>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          <Link
            to="/"
            className={`flex items-center gap-3 px-3 py-2 rounded-lg transition ${
              isActive('/') && !isActive('/admin')
                ? 'bg-primary text-white'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            <MessageSquare className="w-5 h-5" />
            {t('conversations.title')}
          </Link>

          {user?.role === 'ADMIN' && (
            <>
              <Link
                to="/admin/dashboard"
                className={`flex items-center gap-3 px-3 py-2 rounded-lg transition ${
                  isActive('/admin')
                    ? 'bg-primary text-white'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <BarChart3 className="w-5 h-5" />
                {t('admin.dashboard')}
              </Link>
              <Link
                to="/admin/agents"
                className={`flex items-center gap-3 px-3 py-2 rounded-lg transition ${
                  isActive('/admin/agents')
                    ? 'bg-primary text-white'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <User className="w-5 h-5" />
                {t('admin.agents')}
              </Link>
              <Link
                to="/admin/roles"
                className={`flex items-center gap-3 px-3 py-2 rounded-lg transition ${
                  isActive('/admin/roles')
                    ? 'bg-primary text-white'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <Shield className="w-5 h-5" />
                {t('admin.roles')}
              </Link>
              <Link
                to="/admin/channels"
                className={`flex items-center gap-3 px-3 py-2 rounded-lg transition ${
                  isActive('/admin/channels')
                    ? 'bg-primary text-white'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <Zap className="w-5 h-5" />
                {t('admin.channels')}
              </Link>
              <Link
                to="/admin/ai"
                className={`flex items-center gap-3 px-3 py-2 rounded-lg transition ${
                  isActive('/admin/ai')
                    ? 'bg-primary text-white'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <Settings className="w-5 h-5" />
                {t('admin.ai')}
              </Link>
            </>
          )}
        </nav>

        {/* User section */}
        <div className="p-4 border-t border-gray-200">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white font-medium">
              {user?.firstName?.[0] || user?.email?.[0] || '?'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {user?.firstName} {user?.lastName}
              </p>
              <p className="text-xs text-gray-500 truncate">{user?.email}</p>
            </div>
          </div>

          {/* Language selector */}
          <select
            value={i18n.language}
            onChange={(e) => changeLanguage(e.target.value)}
            className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 mb-3 focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
          >
            <option value="fr">🇫🇷 Français</option>
            <option value="en">🇬🇧 English</option>
            <option value="es">🇪🇸 Español</option>
            <option value="pt">🇧🇷 Português</option>
            <option value="ar">🇸🇦 العربية</option>
            <option value="zh">🇨🇳 中文</option>
          </select>

          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition"
          >
            <LogOut className="w-4 h-4" />
            {t('auth.logout')}
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6">
          <div className="flex items-center gap-4 flex-1">
            <div className="relative w-96">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder={t('conversations.searchPlaceholder')}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button className="relative p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>
          </div>
        </header>

        {/* Page content */}
        <div className="flex-1 overflow-auto">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
