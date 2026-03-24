"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useChatHistory } from "@/shared/lib/use-chat-history"
import { MessageSquare, Sparkles } from "lucide-react"
import { cn } from "@clearity/ui/lib/utils"
import { PageLayout } from "@/shared/ui/page-layout"
import { ClarifyModal } from "@/shared/ui/clarify-modal"

function formatDate(dateStr: string) {
  const date = new Date(dateStr)
  const now = new Date()
  const diffDays = Math.floor((now.getTime() - date.getTime()) / 86400000)

  if (diffDays === 0) return "Today"
  if (diffDays === 1) return "Yesterday"
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" })
}

function formatDuration(startedAt: string, endedAt: string | null) {
  const start = new Date(startedAt)
  const end = endedAt ? new Date(endedAt) : new Date()
  const diffMs = end.getTime() - start.getTime()
  const minutes = Math.floor(diffMs / 60000)

  if (minutes < 1) return "< 1 min"
  if (minutes < 60) return `${minutes} min`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ${minutes % 60}m`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days}d`
  const months = Math.floor(days / 30)
  return `${months}mo`
}

export function HistoryPage() {
  const router = useRouter()
  const chatHistory = useChatHistory()
  const [clarifySessionId, setClarifySessionId] = useState<string | null>(null)
  const [filter, setFilter] = useState<"all" | "active" | "completed">("all")

  const handleSelectSession = (sessionId: string) => router.push(`/chat/${sessionId}`)

  return (
    <PageLayout header={<h1 className="text-xl font-bold text-zinc-800 dark:text-zinc-100">Chat History</h1>}>
      <div className="glass flex flex-col h-full !rounded-3xl p-6 overflow-y-auto">
        {/* Filter */}
        <div className="flex justify-end mb-4">
          <div className="flex gap-1">
            {(["all", "active", "completed"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={cn(
                  "text-[11px] px-3 py-1.5 rounded-xl transition-all",
                  filter === f
                    ? "glass-solid text-white"
                    : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
                )}
              >
                {f === "all" ? "All" : f === "active" ? "Active" : "Completed"}
              </button>
            ))}
          </div>
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
            {chatHistory.sessions.filter(s => filter === "all" || s.status === filter).map((session) => (
              <div
                key={session.id}
                onClick={() => session.status === "completed" ? setClarifySessionId(session.id) : handleSelectSession(session.id)}
                className="glass-subtle !rounded-2xl p-5 text-left hover:scale-[1.005] transition-all cursor-pointer"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">
                    {session.title}
                  </span>
                  <div className="flex items-center gap-2">
                    {session.status === "completed" && (
                      <Sparkles className="h-3 w-3 text-zinc-400" />
                    )}
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
                <p className="text-[10px] text-zinc-400 mt-2">
                  {new Date(session.started_at).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}
                  {" · "}
                  {formatDuration(session.started_at, session.ended_at)}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
      {clarifySessionId && (
        <ClarifyModal
          open={!!clarifySessionId}
          onOpenChange={(open) => { if (!open) setClarifySessionId(null) }}
          sessionId={clarifySessionId}
          onConfirm={async () => {}}
          onViewChat={() => { router.push(`/chat/${clarifySessionId}`); setClarifySessionId(null) }}
        />
      )}
    </PageLayout>
  )
}
