"use client"

import { Button } from "@clearity/ui"
import {
  Plus,
  Sparkles,
  Clock,
  Settings,
  ChevronRight,
  LogOut,
} from "lucide-react"
import { useRouter } from "next/navigation"
import { createClient } from "@clearity/lib"
import type { ChatSession } from "@clearity/lib"

interface LeftSidebarProps {
  sessions: ChatSession[]
  activeSessionId: string | null
  onSelectSession: (sessionId: string) => void
  onNewChat: () => void
  isLoading: boolean
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
      {/* Logo — click to go home */}
      <div className="relative z-10 px-5 py-6 border-b border-white/15">
        <button
          onClick={() => router.push("/")}
          className="flex items-center gap-2.5 cursor-pointer group"
        >
          <div className="glass-solid flex h-10 w-10 items-center justify-center !rounded-2xl transition-all group-hover:-translate-y-0.5 group-hover:shadow-lg group-active:translate-y-0 group-active:scale-[0.98]">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <span className="text-xl font-semibold tracking-tight text-zinc-800 dark:text-zinc-100 transition-all group-hover:-translate-y-0.5 group-active:translate-y-0">
            Clearity
          </span>
        </button>
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

      {/* Navigation */}
      <div className="relative z-10 flex-1 px-4 py-4">
        <div className="flex flex-col gap-1">
          {[
            { icon: Clock, label: "Chat History", href: "/history" },
          ].map((item) => (
            <button
              key={item.label}
              onClick={() => router.push(item.href)}
              className="glass-subtle flex items-center justify-between !rounded-2xl px-3 py-2.5 text-sm text-zinc-700 dark:text-zinc-300"
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
      <div className="relative z-10 border-t border-white/15 px-4 py-4 flex flex-col gap-2">
        <button className="glass-subtle flex w-full items-center gap-3 !rounded-2xl px-3 py-2.5 text-sm text-zinc-700 dark:text-zinc-300">
          <Settings className="h-4 w-4 text-zinc-500 dark:text-zinc-400" />
          <span>Settings</span>
        </button>
        <button
          onClick={handleSignOut}
          className="glass-subtle flex w-full items-center gap-3 !rounded-2xl px-3 py-2.5 text-sm text-zinc-700 dark:text-zinc-300"
        >
          <LogOut className="h-4 w-4 text-zinc-500 dark:text-zinc-400" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  )
}
