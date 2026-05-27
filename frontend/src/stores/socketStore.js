import { create } from 'zustand'

export const useSocketStore = create((set, get) => ({
  socket: null,
  isConnected: false,

  setSocket: (socket) => set({ socket }),
  
  setConnected: (isConnected) => set({ isConnected }),
  
  connect: (url) => {
    const { socket } = get()
    if (socket) return
    
    // Dynamic import to avoid SSR issues
    import('socket.io-client').then(({ io }) => {
      const newSocket = io(url, {
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
      })
      
      newSocket.on('connect', () => {
        console.log('Socket connected')
        set({ isConnected: true })
      })
      
      newSocket.on('disconnect', () => {
        console.log('Socket disconnected')
        set({ isConnected: false })
      })
      
      newSocket.on('connect_error', (error) => {
        console.error('Socket connection error:', error)
        set({ isConnected: false })
      })
      
      set({ socket: newSocket })
    })
  },
  
  disconnect: () => {
    const { socket } = get()
    if (socket) {
      socket.disconnect()
      set({ socket: null, isConnected: false })
    }
  },
  
  emit: (event, data) => {
    const { socket } = get()
    if (socket && socket.connected) {
      socket.emit(event, data)
    }
  },
  
  on: (event, callback) => {
    const { socket } = get()
    if (socket) {
      socket.on(event, callback)
      return () => socket.off(event, callback)
    }
    return () => {}
  },
}))
