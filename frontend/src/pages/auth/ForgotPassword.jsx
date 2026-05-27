import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Mail, ArrowLeft, Loader2 } from 'lucide-react'
import api from '../../lib/api'
import toast from 'react-hot-toast'

export default function ForgotPassword() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      await api.post('/auth/forgot-password', { email })
      toast.success('Email de réinitialisation envoyé !')
      navigate('/login')
    } catch (error) {
      toast.error(error.response?.data?.message || t('common.error'))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 to-secondary/10 p-4">
      <div className="w-full max-w-md">
        <button
          onClick={() => navigate('/login')}
          className="flex items-center gap-2 text-gray-600 hover:text-primary mb-8 transition"
        >
          <ArrowLeft className="w-5 h-5" />
          {t('common.back')}
        </button>

        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">{t('auth.resetPassword')}</h1>
          <p className="text-gray-600 mb-6">
            Entrez votre email et nous vous enverrons les instructions pour réinitialiser votre mot de passe.
          </p>

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

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-primary hover:bg-primary-dark text-white py-3 rounded-lg font-medium transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading && <Loader2 className="w-5 h-5 animate-spin" />}
              {t('auth.resetPassword')}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
