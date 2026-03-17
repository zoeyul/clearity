"use client"

import { useRouter } from "next/navigation"
import { LeftSidebar } from "@/components/dashboard/left-sidebar"
import { ChatArea } from "@/components/dashboard/chat-area"
import { AnalysisPanel } from "@/components/dashboard/analysis-panel"
import { useSession } from "@/hooks/use-session"
import { useChatHistory } from "@/hooks/use-chat-history"
import { createClient } from "@clearity/lib"

interface ClearityDashboardProps {
  sessionId: string
}

export function ClearityDashboard({ sessionId }: ClearityDashboardProps) {
  const router = useRouter()
  const supabase = createClient()
  const chatHistory = useChatHistory()
  const session = useSession(sessionId)

  const handleNewChat = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data } = await supabase
      .from("chat_sessions")
      .insert({ title: "New Chat", user_id: user.id })
      .select()
      .single()
    if (data) router.push(`/chat/${data.id}`)
  }

  const handleSelectSession = (id: string) => router.push(`/chat/${id}`)

  return (
    <div className="relative flex h-screen w-full overflow-hidden">
      <div className="absolute inset-0 bg-[#f0f4f4] dark:bg-[#1a1d1d]" />
      <div className="absolute -top-[20%] left-[10%] h-[60%] w-[50%] rounded-full bg-[#d0e4e4]/50 blur-[120px] dark:bg-[#2a4040]/20" />
      <div className="absolute -bottom-[15%] right-[5%] h-[50%] w-[40%] rounded-full bg-[#c8dede]/45 blur-[120px] dark:bg-[#253838]/15" />
      <div className="absolute top-[30%] left-[40%] h-[40%] w-[35%] rounded-full bg-[#dceaea]/60 blur-[100px] dark:bg-[#2d4242]/15" />
      <div className="absolute inset-0 opacity-[0.02] dark:opacity-[0.03]" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")` }} />

      <div className="relative z-10 flex h-full w-full gap-4 p-4 lg:gap-5 lg:p-5">
        <div className="hidden w-[280px] shrink-0 lg:block h-full">
          <LeftSidebar
            sessions={chatHistory.sessions}
            activeSessionId={sessionId}
            onSelectSession={handleSelectSession}
            onNewChat={handleNewChat}
            isLoading={chatHistory.isLoading}
          />
        </div>

        <main className="flex-1 min-h-0 h-full">
          <ChatArea
            messages={session.messages}
            sessionStatus={session.session?.status ?? "active"}
            onSendMessage={session.sendMessage}
            onFinishSession={session.finishSession}
            isLoading={session.isLoading}
          />
        </main>

        <div className="hidden w-[320px] shrink-0 xl:block h-full">
          <AnalysisPanel
            keywords={session.keywords}
            emotions={session.emotions}
            actionItems={session.actionItems}
            messageCount={session.messageCount}
            sessionDuration={session.session?.duration_minutes}
            sessionStartedAt={session.session?.started_at}
            onToggleActionItem={session.toggleActionItem}
            isLoading={session.isLoading}
          />
        </div>
      </div>
    </div>
  )
}
