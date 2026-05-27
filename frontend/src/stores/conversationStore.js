import { create } from 'zustand'

export const useConversationStore = create((set, get) => ({
  conversations: [],
  activeConversation: null,
  messages: [],
  filter: 'all', // all, mine, unassigned
  searchQuery: '',
  isLoading: false,

  setConversations: (conversations) => set({ conversations }),
  
  setActiveConversation: (conversation) => set({ activeConversation: conversation }),
  
  setMessages: (messages) => set({ messages }),
  
  addMessage: (message) => set((state) => ({
    messages: [...state.messages, message],
  })),
  
  updateMessage: (messageId, updates) => set((state) => ({
    messages: state.messages.map((msg) =>
      msg.id === messageId ? { ...msg, ...updates } : msg
    ),
  })),
  
  setFilter: (filter) => set({ filter }),
  
  setSearchQuery: (searchQuery) => set({ searchQuery }),
  
  setLoading: (loading) => set({ isLoading: loading }),
  
  addConversation: (conversation) => set((state) => ({
    conversations: [conversation, ...state.conversations],
  })),
  
  updateConversation: (conversationId, updates) => set((state) => ({
    conversations: state.conversations.map((conv) =>
      conv.id === conversationId ? { ...conv, ...updates } : conv
    ),
  })),
}))
