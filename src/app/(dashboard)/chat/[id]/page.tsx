"use client"

import { useState, useEffect, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import { ChatContainer } from "@/components/chat/ChatContainer"
import { ChatSidebar, type ConversationItem } from "@/components/chat/ChatSidebar"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet"
import { PanelLeftOpen, Loader2 } from "lucide-react"

interface ConversationMessage {
  id: string
  role: string
  content: string
  toolCalls?: unknown
  toolResults?: unknown
  createdAt: string
}

interface ConversationDetail {
  id: string
  title: string | null
  messages: ConversationMessage[]
}

export default function ConversationPage() {
  const params = useParams()
  const router = useRouter()
  const conversationId = params.id as string

  const [conversations, setConversations] = useState<ConversationItem[]>([])
  const [conversationDetail, setConversationDetail] =
    useState<ConversationDetail | null>(null)
  const [isLoadingConversations, setIsLoadingConversations] = useState(true)
  const [isLoadingDetail, setIsLoadingDetail] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // Fetch conversation list
  useEffect(() => {
    async function loadConversations() {
      try {
        const response = await fetch("/api/chat")
        if (response.ok) {
          const data = (await response.json()) as ConversationItem[]
          setConversations(data)
        }
      } catch {
        // Silently fail
      } finally {
        setIsLoadingConversations(false)
      }
    }
    loadConversations()
  }, [])

  // Fetch conversation detail
  useEffect(() => {
    async function loadConversation() {
      if (!conversationId) return
      setIsLoadingDetail(true)
      try {
        const response = await fetch(
          `/api/chat?conversationId=${conversationId}`
        )
        if (response.ok) {
          const data = (await response.json()) as ConversationDetail
          setConversationDetail(data)
        } else {
          // Conversation not found — redirect to main chat
          router.push("/chat")
        }
      } catch {
        router.push("/chat")
      } finally {
        setIsLoadingDetail(false)
      }
    }
    loadConversation()
  }, [conversationId, router])

  const handleSelectConversation = useCallback(
    (id: string) => {
      setSidebarOpen(false)
      router.push(`/chat/${id}`)
    },
    [router]
  )

  const handleNewConversation = useCallback(() => {
    setSidebarOpen(false)
    router.push("/chat")
  }, [router])

  const handleDeleteConversation = useCallback(
    async (id: string) => {
      try {
        await fetch(`/api/chat?conversationId=${id}`, { method: "DELETE" })
        setConversations((prev) => prev.filter((c) => c.id !== id))
        if (id === conversationId) {
          router.push("/chat")
        }
      } catch {
        // Silently fail
      }
    },
    [conversationId, router]
  )

  const handleConversationCreated = useCallback(
    (id: string) => {
      // Refresh list
      fetch("/api/chat")
        .then((res) => res.json())
        .then((data) => setConversations(data as ConversationItem[]))
        .catch(() => {})
      router.push(`/chat/${id}`)
    },
    [router]
  )

  const sidebarContent = (
    <ChatSidebar
      conversations={conversations}
      activeConversationId={conversationId}
      isLoadingConversations={isLoadingConversations}
      onSelectConversation={handleSelectConversation}
      onNewConversation={handleNewConversation}
      onDeleteConversation={handleDeleteConversation}
    />
  )

  return (
    <div className="flex h-[calc(100vh-4rem)] -m-6">
      {/* Desktop sidebar */}
      <div className="hidden lg:block">{sidebarContent}</div>

      {/* Mobile sidebar */}
      <div className="lg:hidden">
        <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
          <SheetTrigger
            render={
              <Button
                variant="ghost"
                size="icon-sm"
                className="absolute left-2 top-2 z-10"
              />
            }
          >
            <PanelLeftOpen className="h-4 w-4" />
          </SheetTrigger>
          <SheetContent side="left" className="w-72 p-0" showCloseButton={false}>
            <SheetTitle className="sr-only">Conversation history</SheetTitle>
            {sidebarContent}
          </SheetContent>
        </Sheet>
      </div>

      {/* Chat area */}
      <div className="flex-1">
        {isLoadingDetail ? (
          <div className="flex h-full items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <ChatContainer
            conversationId={conversationId}
            onConversationCreated={handleConversationCreated}
            initialMessages={conversationDetail?.messages}
          />
        )}
      </div>
    </div>
  )
}
