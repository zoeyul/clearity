"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { createClient } from "@clearity/lib"

export interface DailyMood {
  day: string
  date: string
  value: number
  label: string
}

export interface PendingAction {
  id: string
  text: string
  is_completed: boolean
  session_title: string
  created_at: string
}

export interface UserTendencies {
  analytical_emotional: number
  future_present: number
  action_reflection: number
  optimistic_cautious: number
  session_count: number
}

export interface DashboardData {
  userName: string
  weeklyMoods: DailyMood[]
  bestDay: string | null
  topKeywords: string[]
  keywordTrendMessage: string | null
  pendingActions: PendingAction[]
  tendencies: UserTendencies | null
  recentSessionCount: number
  totalMessageCount: number
  isLoading: boolean
}

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

export function useDashboard() {
  const [data, setData] = useState<DashboardData>({
    userName: "",
    weeklyMoods: [],
    bestDay: null,
    topKeywords: [],
    keywordTrendMessage: null,
    pendingActions: [],
    tendencies: null,
    recentSessionCount: 0,
    totalMessageCount: 0,
    isLoading: true,
  })

  const supabaseRef = useRef(createClient())
  const supabase = supabaseRef.current

  const fetchDashboard = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    const userName = user?.user_metadata?.full_name
      ?? user?.user_metadata?.name
      ?? user?.email?.split("@")[0]
      ?? ""

    const now = new Date()
    const sevenDaysAgo = new Date(now)
    sevenDaysAgo.setDate(now.getDate() - 7)
    const fourteenDaysAgo = new Date(now)
    fourteenDaysAgo.setDate(now.getDate() - 14)

    const [emotionsRes, actionsRes, keywordsRes, prevKeywordsRes, sessionsRes, messagesRes] =
      await Promise.all([
        supabase.from("session_emotions").select("label, value, created_at")
          .gte("created_at", sevenDaysAgo.toISOString()).order("created_at", { ascending: true }),
        supabase.from("action_items").select("id, text, is_completed, session_id, created_at, chat_sessions(title)")
          .eq("is_completed", false).order("created_at", { ascending: false }).limit(8),
        supabase.from("session_keywords").select("label").gte("created_at", sevenDaysAgo.toISOString()),
        supabase.from("session_keywords").select("label")
          .gte("created_at", fourteenDaysAgo.toISOString()).lt("created_at", sevenDaysAgo.toISOString()),
        supabase.from("chat_sessions").select("id", { count: "exact", head: true })
          .gte("created_at", sevenDaysAgo.toISOString()),
        supabase.from("messages").select("id", { count: "exact", head: true })
          .gte("created_at", sevenDaysAgo.toISOString()),
      ])

    // Weekly moods by day
    const moodsByDay = new Map<number, { total: number; count: number; labels: Map<string, number> }>()
    for (const e of emotionsRes.data ?? []) {
      const dayOfWeek = new Date(e.created_at).getDay()
      const existing = moodsByDay.get(dayOfWeek) ?? { total: 0, count: 0, labels: new Map() }
      existing.total += e.value
      existing.count += 1
      existing.labels.set(e.label, (existing.labels.get(e.label) ?? 0) + e.value)
      moodsByDay.set(dayOfWeek, existing)
    }

    const weeklyMoods: DailyMood[] = []
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now)
      d.setDate(now.getDate() - i)
      const dayIdx = d.getDay()
      const entry = moodsByDay.get(dayIdx)
      if (entry) {
        const dominantLabel = Array.from(entry.labels.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] ?? ""
        weeklyMoods.push({ day: DAY_NAMES[dayIdx], date: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }), value: Math.round(entry.total / entry.count), label: dominantLabel })
      } else {
        weeklyMoods.push({ day: DAY_NAMES[dayIdx], date: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }), value: 0, label: "" })
      }
    }

    const activeDays = weeklyMoods.filter((d) => d.value > 0)
    const bestDayEntry = activeDays.length > 0
      ? activeDays.reduce((min, d) => (d.value < min.value ? d : min), activeDays[0])
      : null

    // Keywords
    const thisWeekCounts = new Map<string, number>()
    for (const k of keywordsRes.data ?? []) thisWeekCounts.set(k.label, (thisWeekCounts.get(k.label) ?? 0) + 1)
    const prevWeekCounts = new Map<string, number>()
    for (const k of prevKeywordsRes.data ?? []) prevWeekCounts.set(k.label, (prevWeekCounts.get(k.label) ?? 0) + 1)

    const topKeywords = Array.from(thisWeekCounts.entries()).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([label]) => label)

    let keywordTrendMessage: string | null = null
    if (topKeywords.length > 0) {
      const topKeyword = topKeywords[0]
      const thisCount = thisWeekCounts.get(topKeyword) ?? 0
      const prevCount = prevWeekCounts.get(topKeyword) ?? 0
      if (prevCount > 0) {
        const change = Math.round(((thisCount - prevCount) / prevCount) * 100)
        if (change < 0) keywordTrendMessage = `'${topKeyword}' related topics decreased by ${Math.abs(change)}% compared to last week`
        else if (change > 0) keywordTrendMessage = `'${topKeyword}' related topics increased by ${change}% compared to last week`
        else keywordTrendMessage = `'${topKeyword}' remains a consistent theme in your reflections`
      }
    }

    const pendingActions: PendingAction[] = (actionsRes.data ?? []).map((item: Record<string, unknown>) => ({
      id: item.id as string, text: item.text as string, is_completed: item.is_completed as boolean,
      session_title: (item.chat_sessions as Record<string, unknown>)?.title as string ?? "Unknown session",
      created_at: item.created_at as string,
    }))

    // Fetch user tendencies
    const { data: tendenciesData } = await supabase
      .from("user_tendencies")
      .select("analytical_emotional, future_present, action_reflection, optimistic_cautious, session_count")
      .single()

    const tendencies: UserTendencies | null = tendenciesData ? {
      analytical_emotional: tendenciesData.analytical_emotional,
      future_present: tendenciesData.future_present,
      action_reflection: tendenciesData.action_reflection,
      optimistic_cautious: tendenciesData.optimistic_cautious,
      session_count: tendenciesData.session_count,
    } : null

    setData({ userName, weeklyMoods, bestDay: bestDayEntry?.day ?? null, topKeywords, keywordTrendMessage, pendingActions, tendencies, recentSessionCount: sessionsRes.count ?? 0, totalMessageCount: messagesRes.count ?? 0, isLoading: false })
  }, [supabase])

  useEffect(() => { fetchDashboard() }, [fetchDashboard])

  const toggleActionItem = useCallback(async (itemId: string, isCompleted: boolean) => {
    setData((prev) => ({ ...prev, pendingActions: isCompleted ? prev.pendingActions.filter((item) => item.id !== itemId) : prev.pendingActions }))
    await supabase.from("action_items").update({ is_completed: isCompleted }).eq("id", itemId)
  }, [supabase])

  return { ...data, toggleActionItem, refetch: fetchDashboard }
}
