"use client"

import { Button, Sheet, SheetContent, SheetTrigger } from "@clearity/ui"
import { Menu } from "lucide-react"
import { LeftSidebar } from "@/components/dashboard/left-sidebar"
import { useChatHistory } from "@/hooks/use-chat-history"
import { useRouter } from "next/navigation"
import { createClient } from "@clearity/lib"

interface MobileSidebarProps {
  activeSessionId?: string | null
}

export function MobileSidebar({ activeSessionId = null }: MobileSidebarProps) {
  const router = useRouter()
  const chatHistory = useChatHistory()
  const supabase = createClient()

  const handleNewChat = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const id = crypto.randomUUID()
    const { error } = await supabase
      .from("chat_sessions")
      .insert({ id, title: "New Chat", user_id: user.id })
    if (!error) router.push(`/chat/${id}`)
  }

  const handleSelectSession = (sessionId: string) => router.push(`/chat/${sessionId}`)

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="glass-interactive lg:hidden !rounded-2xl !border-transparent !bg-transparent text-zinc-700 dark:text-zinc-300"
        >
          <Menu className="h-5 w-5" />
          <span className="sr-only">Open navigation</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[280px] p-4 bg-[#edf0f5] dark:bg-[#1a1d1d] border-none [&>button:last-child]:hidden">
        <LeftSidebar
          sessions={chatHistory.sessions}
          activeSessionId={activeSessionId}
          onSelectSession={handleSelectSession}
          onNewChat={handleNewChat}
          isLoading={chatHistory.isLoading}
        />
      </SheetContent>
    </Sheet>
  )
}
