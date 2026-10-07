import {
  createChatSession as apiCreateChatSession,
  listChatSessions as apiListChatSessions,
  getChatSession as apiGetChatSession,
  sendChatMessage as apiSendChatMessage,
  streamChatMessage as apiStreamChatMessage,
  citizenGetMe as apiCitizenGetMe,
  type ChatMessage,
  type ChatSession,
} from '@/core'

export const homeRepository = {
  async getMe() {
    return apiCitizenGetMe()
  },

  async createSession(title?: string): Promise<ChatSession> {
    return apiCreateChatSession(title)
  },

  async listSessions(): Promise<ChatSession[]> {
    return apiListChatSessions()
  },

  async getSession(id: number | string): Promise<ChatSession> {
    return apiGetChatSession(id)
  },

  async sendMessage(sessionId: number | string, content: string): Promise<ChatMessage> {
    return apiSendChatMessage(sessionId, content)
  },

  async streamMessage(
    sessionId: number | string,
    content: string,
    onToken: (token: string, citations?: string[]) => void,
    onDone: (messageId: number) => void,
    onError: (err: any) => void
  ): Promise<void> {
    return apiStreamChatMessage(sessionId, content, onToken, onDone, onError)
  },
}
