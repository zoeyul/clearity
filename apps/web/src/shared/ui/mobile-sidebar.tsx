"use client"

import { Button, Sheet, SheetContent, SheetTrigger } from "@clearity/ui"
import { Menu } from "lucide-react"
import { LeftSidebar } from "@/shared/ui/left-sidebar"
import { useChatHistory } from "@/shared/lib/use-chat-history"
import { useNewSession } from "@/shared/lib/use-new-session"
import { useRouter } from "next/navigation"

interface MobileSidebarProps {
  activeSessionId?: string | null
}

export function MobileSidebar({ activeSessionId = null }: MobileSidebarProps) {
  const router = useRouter()
  const chatHistory = useChatHistory()
  const handleNewChat = useNewSession()

  const handleSelectSession = (sessionId: string) => router.push(`/chat/${sessionId}`)

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden !rounded-2xl border-0 bg-transparent hover:bg-zinc-200/50 dark:hover:bg-zinc-700/50 text-zinc-700 dark:text-zinc-300"
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
