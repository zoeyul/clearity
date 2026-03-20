"use client"

import { useRouter } from "next/navigation"
import { useChatHistory } from "@/hooks/use-chat-history"
import { createClient } from "@clearity/lib"
import { MessageSquare } from "lucide-react"
import { cn } from "@clearity/ui/lib/utils"
import { LeftSidebar } from "@/components/dashboard/left-sidebar"

function formatDate(dateStr: string) {
  const date = new Date(dateStr)
  const now = new Date()
  const diffDays = Math.floor((now.getTime() - date.getTime()) / 86400000)

  if (diffDays === 0) return "Today"
  if (diffDays === 1) return "Yesterday"
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" })
}

export default function HistoryPage() {
  const router = useRouter()
  const chatHistory = useChatHistory()
  const supabase = createClient()

  const handleNewSession = async () => {
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
    <div className="relative flex h-screen w-full overflow-hidden">
      <div className="absolute inset-0 bg-[#edf0f5] dark:bg-[#1a1d1d]" />
      <div className="absolute -top-[20%] left-[10%] h-[60%] w-[50%] rounded-full bg-[#d4dff0]/50 blur-[120px] dark:bg-[#2a3040]/20" />
      <div className="absolute -bottom-[15%] right-[5%] h-[50%] w-[40%] rounded-full bg-[#dde3ed]/45 blur-[120px] dark:bg-[#252d38]/15" />
      <div className="absolute top-[30%] left-[40%] h-[40%] w-[35%] rounded-full bg-[#e5eaf2]/60 blur-[100px] dark:bg-[#2d3342]/15" />
      <div className="absolute inset-0 opacity-[0.02] dark:opacity-[0.03]" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")` }} />

      <div className="relative z-10 flex h-full w-full gap-4 p-4 lg:gap-5 lg:p-5">
        {/* Sidebar */}
        <div className="hidden w-[280px] shrink-0 lg:block h-full">
          <LeftSidebar
            sessions={chatHistory.sessions}
            activeSessionId={null}
            onSelectSession={handleSelectSession}
            onNewChat={handleNewSession}
            isLoading={chatHistory.isLoading}
          />
        </div>

        {/* Main Content */}
        <main className="flex-1 min-w-0 h-full">
          <div className="glass flex flex-col h-full !rounded-3xl p-6 overflow-y-auto">
            {/* Header */}
            <div className="mb-6">
              <h1 className="text-xl font-bold text-zinc-800 dark:text-zinc-100">Chat History</h1>
            </div>

            {/* Session List */}
            {chatHistory.isLoading ? (
              <p className="text-sm text-zinc-400 text-center py-12">Loading...</p>
            ) : chatHistory.sessions.length === 0 ? (
              <div className="text-center py-20">
                <MessageSquare className="h-12 w-12 text-zinc-300 mx-auto mb-4" />
                <p className="text-zinc-500 mb-2">No conversations yet</p>
                <p className="text-xs text-zinc-400">Start a new conversation to see it here</p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {chatHistory.sessions.map((session) => (
                  <button
                    key={session.id}
                    onClick={() => handleSelectSession(session.id)}
                    className="glass-subtle !rounded-2xl p-5 text-left hover:scale-[1.005] transition-all"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">
                        {session.title}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className={cn(
                          "text-[10px] px-2 py-0.5 rounded-full font-medium",
                          session.status === "active"
                            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300"
                            : "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400"
                        )}>
                          {session.status === "active" ? "Active" : "Completed"}
                        </span>
                        <span className="text-xs text-zinc-400">
                          {formatDate(session.updated_at)}
                        </span>
                      </div>
                    </div>
                    {session.preview && (
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-2">
                        {session.preview}
                      </p>
                    )}
                    {session.duration_minutes && (
                      <p className="text-[10px] text-zinc-400 mt-2">
                        {session.duration_minutes} min
                      </p>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}
