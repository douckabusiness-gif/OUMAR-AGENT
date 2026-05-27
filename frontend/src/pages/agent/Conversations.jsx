import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useConversationStore } from '../../stores/conversationStore'
import ConversationList from '../../components/conversation/ConversationList'
import MessageThread from '../../components/conversation/MessageThread'
import ContactPanel from '../../components/conversation/ContactPanel'

export default function Conversations() {
  const { t } = useTranslation()
  const { id } = useParams()
  const { activeConversation, setActiveConversation } = useConversationStore()
  
  // Mock data - will be replaced with API calls
  const [conversations] = useState([
    {
      id: '1',
      contact: { name: 'Jean Dupont', avatar: null },
      channel: 'whatsapp',
      lastMessage: 'Bonjour, j\'ai une question sur ma commande',
      unreadCount: 2,
      status: 'open',
      updatedAt: new Date(),
    },
    {
      id: '2',
      contact: { name: 'Marie Martin', avatar: null },
      channel: 'email',
      lastMessage: 'Merci pour votre aide!',
      unreadCount: 0,
      status: 'resolved',
      updatedAt: new Date(Date.now() - 3600000),
    },
  ])

  useEffect(() => {
    if (id) {
      const conv = conversations.find(c => c.id === id)
      if (conv) setActiveConversation(conv)
    }
  }, [id, conversations, setActiveConversation])

  return (
    <div className="h-full flex">
      {/* Conversation List */}
      <div className="w-80 border-r border-gray-200 bg-white flex flex-col">
        <ConversationList 
          conversations={conversations}
          selectedId={id}
        />
      </div>

      {/* Message Thread */}
      <div className="flex-1 flex flex-col bg-gray-50">
        {activeConversation ? (
          <MessageThread conversation={activeConversation} />
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500">
            {t('conversations.selectConversation')}
          </div>
        )}
      </div>

      {/* Contact Panel */}
      {activeConversation && (
        <div className="w-80 border-l border-gray-200 bg-white overflow-y-auto">
          <ContactPanel conversation={activeConversation} />
        </div>
      )}
    </div>
  )
}
