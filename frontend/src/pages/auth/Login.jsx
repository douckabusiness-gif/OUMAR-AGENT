import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Mail, Lock, Loader2 } from 'lucide-react'
import { useAuthStore } from '../../stores/authStore'
import api from '../../lib/api'
import toast from 'react-hot-toast'

export default function Login() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const login = useAuthStore((state) => state.login)
  
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const response = await api.post('/auth/login', { email, password })
      const { user, token, refreshToken } = response.data
      
      login(user, token, refreshToken)
      toast.success(t('auth.loginSuccess'))
      navigate('/')
    } catch (error) {
      console.error('Login error:', error)
      toast.error(error.response?.data?.message || t('auth.loginFailed'))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 to-secondary/10 p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-primary mb-2">OmniDesk</h1>
          <p className="text-gray-600">{t('auth.welcomeBack')}</p>
        </div>

        {/* Form */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('auth.email')}
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
                  placeholder="exemple@email.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('auth.password')}
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center">
                <input type="checkbox" className="w-4 h-4 text-primary rounded focus:ring-primary" />
                <span className="ml-2 text-sm text-gray-600">{t('auth.rememberMe')}</span>
              </label>
              <button
                type="button"
                onClick={() => navigate('/forgot-password')}
                className="text-sm text-primary hover:underline"
              >
                {t('auth.forgotPassword')}
              </button>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-primary hover:bg-primary-dark text-white py-3 rounded-lg font-medium transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading && <Loader2 className="w-5 h-5 animate-spin" />}
              {t('auth.login')}
            </button>
          </form>
        </div>

        {/* Footer */}
        <p className="text-center text-sm text-gray-500 mt-6">
          © 2025 OmniDesk. All rights reserved.
        </p>
      </div>
    </div>
  )
}
