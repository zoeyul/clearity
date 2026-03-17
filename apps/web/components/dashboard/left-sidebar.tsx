"use client"

import { Button } from "@clearity/ui"
import { ScrollArea } from "@clearity/ui"
import {
  Plus,
  Sparkles,
  Clock,
  TrendingUp,
  Settings,
  ChevronRight,
  LogOut,
} from "lucide-react"
import { useRouter } from "next/navigation"
import { cn } from "@clearity/ui/lib/utils"
import { createClient } from "@clearity/lib"
import type { ChatSession } from "@clearity/lib"

interface LeftSidebarProps {
  sessions: ChatSession[]
  activeSessionId: string | null
  onSelectSession: (sessionId: string) => void
  onNewChat: () => void
  isLoading: boolean
}

const insightsMenu = [
  { icon: TrendingUp, label: "Mood Trends" },
  { icon: Sparkles, label: "Key Themes" },
  { icon: Clock, label: "Session History" },
]

function formatDate(dateStr: string) {
  const date = new Date(dateStr)
  const now = new Date()
  const diffDays = Math.floor((now.getTime() - date.getTime()) / 86400000)

  if (diffDays === 0) return "Today"
  if (diffDays === 1) return "Yesterday"
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" })
}

export function LeftSidebar({
  sessions,
  activeSessionId,
  onSelectSession,
  onNewChat,
  isLoading,
}: LeftSidebarProps) {
  const router = useRouter()

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/login")
  }

  return (
    <aside className="glass flex h-full w-full flex-col">
      {/* Logo */}
      <div className="relative z-10 flex items-center gap-2.5 px-5 py-6 border-b border-white/15">
        <div className="glass-solid flex h-10 w-10 items-center justify-center !rounded-2xl">
          <Sparkles className="h-5 w-5 text-white" />
        </div>
        <span className="text-xl font-semibold tracking-tight text-zinc-800 dark:text-zinc-100">
          Clearity
        </span>
      </div>

      {/* New Chat Button */}
      <div className="relative z-10 px-4 py-4">
        <Button
          onClick={onNewChat}
          className="glass-solid w-full justify-start gap-2 !rounded-2xl border-0"
          size="lg"
        >
          <Plus className="h-4 w-4" />
          New Chat
        </Button>
      </div>

      {/* Chat History */}
      <div className="relative z-10 flex-1 overflow-hidden px-4">
        <div className="flex items-center justify-between py-2 mb-2">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
            History
          </h3>
        </div>
        <ScrollArea className="h-[calc(100%-2rem)]">
          {isLoading ? (
            <p className="text-xs text-zinc-400 px-3">Loading...</p>
          ) : sessions.length === 0 ? (
            <p className="text-xs text-zinc-400 px-3">No conversations yet</p>
          ) : (
            <div className="flex flex-col gap-1 pr-2 pb-4">
              {sessions.map((session) => (
                <button
                  key={session.id}
                  onClick={() => onSelectSession(session.id)}
                  className={cn(
                    "glass-interactive flex flex-col items-start gap-1 !rounded-2xl px-3 py-3 text-left !border-transparent !bg-transparent !shadow-none",
                    activeSessionId === session.id && "!bg-white/15 !border-white/20 !shadow-[inset_0_1px_0_rgba(255,255,255,0.3),0_4px_16px_rgba(31,38,135,0.05)]"
                  )}
                >
                  <div className="flex w-full items-center justify-between">
                    <span className="text-sm font-medium text-zinc-800 dark:text-zinc-100 line-clamp-1">
                      {session.title}
                    </span>
                    <span className="text-xs text-zinc-500 dark:text-zinc-400">
                      {formatDate(session.updated_at)}
                    </span>
                  </div>
                  {session.preview && (
                    <p className="text-xs text-zinc-600 dark:text-zinc-400 line-clamp-2">
                      {session.preview}
                    </p>
                  )}
                </button>
              ))}
            </div>
          )}
        </ScrollArea>
      </div>

      {/* Insights Menu */}
      <div className="relative z-10 border-t border-white/15 px-4 py-4">
        <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
          My Insights
        </h3>
        <div className="flex flex-col gap-1">
          {insightsMenu.map((item) => (
            <button
              key={item.label}
              className="glass-interactive flex items-center justify-between !rounded-2xl !border-transparent !bg-transparent !shadow-none px-3 py-2.5 text-sm text-zinc-700 dark:text-zinc-300"
            >
              <div className="flex items-center gap-3">
                <item.icon className="h-4 w-4 text-zinc-500 dark:text-zinc-400" />
                <span>{item.label}</span>
              </div>
              <ChevronRight className="h-4 w-4 text-zinc-400" />
            </button>
          ))}
        </div>
      </div>

      {/* Settings & Sign Out */}
      <div className="relative z-10 border-t border-white/15 px-4 py-4 flex flex-col gap-1">
        <button className="glass-interactive flex w-full items-center gap-3 !rounded-2xl !border-transparent !bg-transparent !shadow-none px-3 py-2.5 text-sm text-zinc-700 dark:text-zinc-300">
          <Settings className="h-4 w-4 text-zinc-500 dark:text-zinc-400" />
          <span>Settings</span>
        </button>
        <button
          onClick={handleSignOut}
          className="glass-interactive flex w-full items-center gap-3 !rounded-2xl !border-transparent !bg-transparent !shadow-none px-3 py-2.5 text-sm text-zinc-700 dark:text-zinc-300"
        >
          <LogOut className="h-4 w-4 text-zinc-500 dark:text-zinc-400" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  )
}
