import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Mail, MessageCircle, Search, Filter } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { fr, enUS, es, ptBR } from 'date-fns/locale'

export default function ConversationList({ conversations, selectedId }) {
  const { t, i18n } = useTranslation()
  const [filter, setFilter] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')

  const getDateLocale = () => {
    switch (i18n.language) {
      case 'fr': return fr
      case 'es': return es
      case 'pt': return ptBR
      default: return enUS
    }
  }

  const getChannelIcon = (channel) => {
    switch (channel) {
      case 'email':
        return <Mail className="w-4 h-4" />
      case 'whatsapp':
      case 'whatsapp-baileys':
      case 'whatsapp-cloud':
        return <MessageCircle className="w-4 h-4" />
      default:
        return <MessageCircle className="w-4 h-4" />
    }
  }

  const getStatusClass = (status) => {
    switch (status) {
      case 'open': return 'status-open'
      case 'pending': return 'status-pending'
      case 'resolved': return 'status-resolved'
      case 'spam': return 'status-spam'
      default: return ''
    }
  }

  const filteredConversations = conversations.filter(conv => {
    if (filter !== 'all' && conv.status !== filter) return false
    if (searchQuery && !conv.contact.name.toLowerCase().includes(searchQuery.toLowerCase())) return false
    return true
  })

  return (
    <div className="flex flex-col h-full">
      {/* Search & Filters */}
      <div className="p-4 border-b border-gray-200 space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('conversations.searchPlaceholder')}
            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
          />
        </div>

        <div className="flex gap-2">
          {['all', 'open', 'pending', 'resolved'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 text-xs font-medium rounded-full transition ${
                filter === f
                  ? 'bg-primary text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {t(`conversations.${f}`)}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {filteredConversations.length === 0 ? (
          <div className="p-8 text-center text-gray-500 text-sm">
            {t('conversations.noMessages')}
          </div>
        ) : (
          filteredConversations.map((conv) => (
            <div
              key={conv.id}
              className={`p-4 border-b border-gray-100 cursor-pointer transition hover:bg-gray-50 ${
                selectedId === conv.id ? 'bg-blue-50' : ''
              }`}
            >
              <div className="flex items-start gap-3">
                {/* Avatar */}
                <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
                  {conv.contact.avatar ? (
                    <img src={conv.contact.avatar} alt="" className="w-10 h-10 rounded-full object-cover" />
                  ) : (
                    <span className="text-sm font-medium text-gray-600">
                      {conv.contact.name.charAt(0)}
                    </span>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-medium text-gray-900 truncate">{conv.contact.name}</h3>
                    <span className="text-xs text-gray-500">
                      {formatDistanceToNow(new Date(conv.updatedAt), {
                        addSuffix: true,
                        locale: getDateLocale()
                      })}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 mb-1">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs ${
                      conv.channel === 'email' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'
                    }`}>
                      {getChannelIcon(conv.channel)}
                      {t(`channels.${conv.channel}`)}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-xs ${getStatusClass(conv.status)}`}>
                      {t(`conversations.${conv.status}`)}
                    </span>
                  </div>

                  <p className="text-sm text-gray-600 truncate">{conv.lastMessage}</p>
                </div>

                {/* Unread badge */}
                {conv.unreadCount > 0 && (
                  <span className="flex-shrink-0 w-5 h-5 bg-primary text-white text-xs rounded-full flex items-center justify-center">
                    {conv.unreadCount}
                  </span>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
