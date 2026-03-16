import { create } from "zustand"

interface ChatMessage {
  id: string
  conversationId: string
  role: "USER" | "ASSISTANT" | "TOOL"
  content: string
  toolCalls?: unknown
  toolResults?: unknown
  createdAt: Date
}

interface ConversationSummary {
  id: string
  title: string | null
  updatedAt: Date
}

interface ChatStore {
  conversations: ConversationSummary[]
  activeConversationId: string | null
  messages: ChatMessage[]
  isLoading: boolean
  isStreaming: boolean

  setConversations: (conversations: ConversationSummary[]) => void
  setActiveConversation: (id: string | null) => void
  setMessages: (messages: ChatMessage[]) => void
  addMessage: (message: ChatMessage) => void
  updateMessage: (id: string, updates: Partial<ChatMessage>) => void
  setIsLoading: (loading: boolean) => void
  setIsStreaming: (streaming: boolean) => void
  reset: () => void
}

export const useChatStore = create<ChatStore>((set) => ({
  conversations: [],
  activeConversationId: null,
  messages: [],
  isLoading: false,
  isStreaming: false,

  setConversations: (conversations) => set({ conversations }),
  setActiveConversation: (id) => set({ activeConversationId: id }),
  setMessages: (messages) => set({ messages }),
  addMessage: (message) =>
    set((state) => ({ messages: [...state.messages, message] })),
  updateMessage: (id, updates) =>
    set((state) => ({
      messages: state.messages.map((m) =>
        m.id === id ? { ...m, ...updates } : m
      ),
    })),
  setIsLoading: (isLoading) => set({ isLoading }),
  setIsStreaming: (isStreaming) => set({ isStreaming }),
  reset: () =>
    set({
      conversations: [],
      activeConversationId: null,
      messages: [],
      isLoading: false,
      isStreaming: false,
    }),
}))
