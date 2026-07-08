export type Message = {
  id: string
  senderId: string
  content: string
  sentAt: string       // ISO 8601
  status: 'sending' | 'sent' | 'failed'
  isOptimistic?: boolean
}

export type ConnectionStatus = 'connected' | 'reconnecting' | 'offline'
