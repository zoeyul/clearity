"use client"

import { useState } from "react"
import { Button } from "@clearity/ui"
import { ScrollArea } from "@clearity/ui"
import {
  Plus,
  Sparkles,
  Clock,
  TrendingUp,
  Settings,
  ChevronRight,
} from "lucide-react"
import { cn } from "@clearity/ui/lib/utils"

interface ChatHistoryItem {
  id: string
  title: string
  preview: string
  date: string
  isActive?: boolean
}

const chatHistory: ChatHistoryItem[] = [
  {
    id: "1",
    title: "Work Stress Discussion",
    preview: "We talked about managing deadlines and setting boundaries...",
    date: "Today",
    isActive: true,
  },
  {
    id: "2",
    title: "Relationship Concerns",
    preview: "Exploring communication patterns in your partnership...",
    date: "Yesterday",
  },
  {
    id: "3",
    title: "Sleep & Anxiety",
    preview: "Techniques for calming the mind before bed...",
    date: "Mar 14",
  },
  {
    id: "4",
    title: "Career Goals",
    preview: "Aligning your values with professional aspirations...",
    date: "Mar 12",
  },
]

const insightsMenu = [
  { icon: TrendingUp, label: "Mood Trends" },
  { icon: Sparkles, label: "Key Themes" },
  { icon: Clock, label: "Session History" },
]

export function LeftSidebar() {
  const [activeChat, setActiveChat] = useState("1")

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
        <Button className="glass-solid w-full justify-start gap-2 !rounded-2xl border-0" size="lg">
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
          <div className="flex flex-col gap-1 pr-2 pb-4">
            {chatHistory.map((chat) => (
              <button
                key={chat.id}
                onClick={() => setActiveChat(chat.id)}
                className={cn(
                  "glass-interactive flex flex-col items-start gap-1 !rounded-2xl px-3 py-3 text-left !border-transparent !bg-transparent !shadow-none",
                  activeChat === chat.id && "!bg-white/15 !border-white/20 !shadow-[inset_0_1px_0_rgba(255,255,255,0.3),0_4px_16px_rgba(31,38,135,0.05)]"
                )}
              >
                <div className="flex w-full items-center justify-between">
                  <span className="text-sm font-medium text-zinc-800 dark:text-zinc-100 line-clamp-1">
                    {chat.title}
                  </span>
                  <span className="text-xs text-zinc-500 dark:text-zinc-400">
                    {chat.date}
                  </span>
                </div>
                <p className="text-xs text-zinc-600 dark:text-zinc-400 line-clamp-2">
                  {chat.preview}
                </p>
              </button>
            ))}
          </div>
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

      {/* Settings */}
      <div className="relative z-10 border-t border-white/15 px-4 py-4">
        <button className="glass-interactive flex w-full items-center gap-3 !rounded-2xl !border-transparent !bg-transparent !shadow-none px-3 py-2.5 text-sm text-zinc-700 dark:text-zinc-300">
          <Settings className="h-4 w-4 text-zinc-500 dark:text-zinc-400" />
          <span>Settings</span>
        </button>
      </div>
    </aside>
  )
}
