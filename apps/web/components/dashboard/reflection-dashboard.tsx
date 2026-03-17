"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Checkbox } from "@clearity/ui"
import { Sparkles, MessageSquare, Target, Calendar } from "lucide-react"
import { cn } from "@clearity/ui/lib/utils"
import { createClient } from "@clearity/lib"
import { useDashboard } from "@/hooks/use-dashboard"
import { useChatHistory } from "@/hooks/use-chat-history"
import { LeftSidebar } from "@/components/dashboard/left-sidebar"

export function ReflectionDashboard() {
  const router = useRouter()
  const supabase = createClient()
  const dashboard = useDashboard()
  const chatHistory = useChatHistory()
  const [animated, setAnimated] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setAnimated(true), 100)
    return () => clearTimeout(timer)
  }, [])

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

  const hour = new Date().getHours()
  const timeGreeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening"

  const insightSubtext = dashboard.topKeywords.length > 0
    ? `You've been focusing on '${dashboard.topKeywords[0]}' recently. How are you feeling right now?`
    : "Start a conversation to begin organizing your thoughts."

  const formatRelativeDate = (dateStr: string) => {
    const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000)
    if (diff === 0) return "today"
    if (diff === 1) return "yesterday"
    return `${diff} days ago`
  }

  if (dashboard.isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-[#edf0f5] dark:bg-[#1a1d1d]">
        <div className="flex flex-col items-center gap-3">
          <div className="glass-solid flex h-12 w-12 items-center justify-center !rounded-2xl animate-pulse">
            <Sparkles className="h-6 w-6 text-white" />
          </div>
          <p className="text-sm text-zinc-400">Loading your reflections...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="relative flex h-screen w-full overflow-hidden">
      {/* Background — identical to chat page */}
      <div className="absolute inset-0 bg-[#edf0f5] dark:bg-[#1a1d1d]" />
      <div className="absolute -top-[20%] left-[10%] h-[60%] w-[50%] rounded-full bg-[#d4dff0]/50 blur-[120px] dark:bg-[#2a3040]/20" />
      <div className="absolute -bottom-[15%] right-[5%] h-[50%] w-[40%] rounded-full bg-[#dde3ed]/45 blur-[120px] dark:bg-[#252d38]/15" />
      <div className="absolute top-[30%] left-[40%] h-[40%] w-[35%] rounded-full bg-[#e5eaf2]/60 blur-[100px] dark:bg-[#2d3342]/15" />
      <div className="absolute inset-0 opacity-[0.02] dark:opacity-[0.03]" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")` }} />

      {/* 2-column layout */}
      <div className="relative z-10 flex h-full w-full gap-4 p-4 lg:gap-5 lg:p-5">

        {/* LEFT SIDEBAR — same component as chat page */}
        <div className="hidden w-[280px] shrink-0 lg:block h-full">
          <LeftSidebar
            sessions={chatHistory.sessions}
            activeSessionId={null}
            onSelectSession={handleSelectSession}
            onNewChat={handleNewSession}
            isLoading={chatHistory.isLoading}
          />
        </div>

        {/* CENTER MAIN */}
        <main className="flex-1 flex flex-col gap-6 overflow-y-auto min-w-0">

          {/* Welcome Hero */}
          <section className={cn(
            "glass !rounded-[32px] p-10 transition-all duration-500",
            animated ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          )}>
            <div className="relative z-10">
              <h2 className="text-3xl font-bold text-zinc-800 dark:text-zinc-100 mb-3">
                {timeGreeting}{dashboard.userName ? `, ${dashboard.userName}` : ""}.
              </h2>
              <p className="text-zinc-500 dark:text-zinc-400 mb-2 max-w-md leading-relaxed text-sm">{insightSubtext}</p>
              {dashboard.keywordTrendMessage && (
                <p className="text-zinc-400 text-xs mb-6">{dashboard.keywordTrendMessage}</p>
              )}
              {!dashboard.keywordTrendMessage && <div className="mb-6" />}
              <button onClick={handleNewSession}
                className="glass-solid px-8 py-4 !rounded-2xl font-bold text-sm hover:scale-[1.02] transition-all">
                <span className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4" />
                  Start a New Conversation
                </span>
              </button>
            </div>
          </section>

          {/* Bento Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 flex-1 min-h-0">

            {/* Mood Trend (2 cols) */}
            <div className={cn(
              "md:col-span-2 glass !rounded-[32px] p-8 transition-all duration-500 delay-100",
              animated ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            )}>
              <div className="relative z-10 flex justify-between items-center mb-6">
                <h3 className="font-bold text-zinc-700 dark:text-zinc-200">Emotional Drift</h3>
                <Calendar className="w-4 h-4 text-zinc-400" />
              </div>
              <div className="relative z-10 h-48 flex items-end gap-3">
                {dashboard.weeklyMoods.map((mood, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-2">
                    <div className="w-full bg-zinc-200/40 dark:bg-zinc-700/20 rounded-2xl relative overflow-hidden h-40">
                      <div
                        className={cn(
                          "absolute bottom-0 w-full rounded-2xl transition-all duration-700 ease-out",
                          mood.value > 60 ? "bg-zinc-500/80 dark:bg-zinc-400/60"
                            : mood.value > 30 ? "bg-zinc-400/60 dark:bg-zinc-500/40"
                            : "bg-zinc-300/50 dark:bg-zinc-600/30"
                        )}
                        style={{ height: animated ? `${mood.value}%` : "0%" }}
                      />
                    </div>
                    <span className="text-[10px] text-zinc-400">{mood.day}</span>
                  </div>
                ))}
              </div>
              {dashboard.bestDay && (
                <p className="relative z-10 text-xs text-zinc-400 mt-4">
                  Most at ease on <span className="text-zinc-600 dark:text-zinc-300 font-medium">{dashboard.bestDay}</span>
                </p>
              )}
            </div>

            {/* Keywords (1 col) */}
            <div className={cn(
              "glass !rounded-[32px] p-8 transition-all duration-500 delay-150",
              animated ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            )}>
              <div className="relative z-10">
                <h3 className="font-bold text-zinc-700 dark:text-zinc-200 mb-6">Keywords</h3>
                {dashboard.topKeywords.length === 0 ? (
                  <p className="text-sm text-zinc-400">Themes will appear as you chat</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {dashboard.topKeywords.map((keyword) => (
                      <span key={keyword} className="glass-subtle px-4 py-2 !rounded-full text-xs font-bold text-zinc-600 dark:text-zinc-300">
                        #{keyword}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Action Items (full width) */}
            <div className={cn(
              "md:col-span-3 glass !rounded-[32px] p-8 transition-all duration-500 delay-200",
              animated ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            )}>
              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-5">
                  <Target className="w-5 h-5 text-zinc-600 dark:text-zinc-400" />
                  <h3 className="font-bold text-zinc-700 dark:text-zinc-200">Pending Action Items</h3>
                </div>
                {dashboard.pendingActions.length === 0 ? (
                  <p className="text-sm text-zinc-400">All caught up! Start a session to get new action items.</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {dashboard.pendingActions.map((item) => (
                      <label key={item.id}
                        className="flex items-center gap-4 p-4 glass-subtle !rounded-2xl cursor-pointer transition-all">
                        <Checkbox
                          checked={item.is_completed}
                          onCheckedChange={(checked) => dashboard.toggleActionItem(item.id, checked as boolean)}
                          className="rounded-full border-zinc-300 dark:border-zinc-600"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-zinc-600 dark:text-zinc-300">{item.text}</p>
                          <p className="text-[10px] text-zinc-400 mt-0.5">from &ldquo;{item.session_title}&rdquo; · {formatRelativeDate(item.created_at)}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
