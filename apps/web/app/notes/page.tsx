"use client"

import { useRouter } from "next/navigation"
import { useChatHistory } from "@/hooks/use-chat-history"
import { createClient } from "@clearity/lib"
import { StickyNote } from "lucide-react"
import { LeftSidebar } from "@/components/dashboard/left-sidebar"

export default function NotesPage() {
  const router = useRouter()
  const chatHistory = useChatHistory()
  const supabase = createClient()

  const handleNewSession = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data } = await supabase
      .from("chat_sessions")
      .insert({ title: "New Chat", user_id: user.id })
      .select()
      .single()
    if (data) router.push(`/chat/${data.id}`)
  }

  const handleSelectSession = (sessionId: string) => router.push(`/chat/${sessionId}`)

  return (
    <div className="relative flex h-screen w-full overflow-hidden">
      <div className="absolute inset-0 bg-[#edf0f5] dark:bg-[#1a1d1d]" />
      <div className="absolute -top-[20%] left-[10%] h-[60%] w-[50%] rounded-full bg-[#d4dff0]/50 blur-[120px] dark:bg-[#2a3040]/20" />
      <div className="absolute -bottom-[15%] right-[5%] h-[50%] w-[40%] rounded-full bg-[#dde3ed]/45 blur-[120px] dark:bg-[#252d38]/15" />
      <div className="absolute top-[30%] left-[40%] h-[40%] w-[35%] rounded-full bg-[#e5eaf2]/60 blur-[100px] dark:bg-[#2d3342]/15" />
      <div className="absolute inset-0 opacity-[0.02] dark:opacity-[0.03]" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")` }} />

      <div className="relative z-10 flex h-full w-full gap-4 p-4 lg:gap-5 lg:p-5">
        <div className="hidden w-[280px] shrink-0 lg:block h-full">
          <LeftSidebar
            sessions={chatHistory.sessions}
            activeSessionId={null}
            onSelectSession={handleSelectSession}
            onNewChat={handleNewSession}
            isLoading={chatHistory.isLoading}
          />
        </div>

        <main className="flex-1 min-w-0 h-full">
          <div className="glass flex flex-col h-full !rounded-3xl p-8 overflow-y-auto">
            <h1 className="text-xl font-bold text-zinc-800 dark:text-zinc-100 mb-6">Notes</h1>

            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <StickyNote className="h-12 w-12 text-zinc-300 mx-auto mb-4" />
                <p className="text-zinc-500 mb-2">No notes yet</p>
                <p className="text-xs text-zinc-400">Your notes will appear here</p>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
