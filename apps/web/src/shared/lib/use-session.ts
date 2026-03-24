"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { createClient } from "@clearity/lib"
import type { ChatSession, Message, SessionKeyword, SessionEmotion, ActionItem } from "@clearity/lib"

interface SessionData {
  session: ChatSession | null
  messages: Message[]
  keywords: SessionKeyword[]
  emotions: SessionEmotion[]
  actionItems: ActionItem[]
  messageCount: number
  isLoading: boolean
}

export function useSession(sessionId: string | null) {
  const [data, setData] = useState<SessionData>({
    session: null,
    messages: [],
    keywords: [],
    emotions: [],
    actionItems: [],
    messageCount: 0,
    isLoading: true,
  })

  const supabaseRef = useRef(createClient())
  const supabase = supabaseRef.current

  const fetchSession = useCallback(async () => {
    if (!sessionId) {
      setData((prev) => ({ ...prev, isLoading: false }))
      return
    }

    const [sessionRes, messagesRes, keywordsRes, emotionsRes, actionsRes] =
      await Promise.all([
        supabase.from("chat_sessions").select("*").eq("id", sessionId).single(),
        supabase.from("messages").select("*").eq("session_id", sessionId).order("created_at", { ascending: true }),
        supabase.from("session_keywords").select("*").eq("session_id", sessionId),
        supabase.from("session_emotions").select("*").eq("session_id", sessionId),
        supabase.from("action_items").select("*").eq("session_id", sessionId).order("sort_order", { ascending: true }),
      ])

    const messages = (messagesRes.data ?? []) as Message[]

    setData({
      session: sessionRes.data as ChatSession | null,
      messages,
      keywords: (keywordsRes.data ?? []) as SessionKeyword[],
      emotions: (emotionsRes.data ?? []) as SessionEmotion[],
      actionItems: (actionsRes.data ?? []) as ActionItem[],
      messageCount: messages.length,
      isLoading: false,
    })
  }, [sessionId, supabase])

  useEffect(() => {
    fetchSession()
  }, [fetchSession])

  const sendMessage = useCallback(
    async (content: string) => {
      if (!sessionId || !content.trim()) return null

      const { data: newMsg } = await supabase
        .from("messages")
        .insert({ session_id: sessionId, role: "user", content: content.trim() })
        .select()
        .single()

      if (newMsg) {
        const msg = newMsg as Message
        setData((prev) => ({
          ...prev,
          messages: [...prev.messages, msg],
          messageCount: prev.messageCount + 1,
        }))
        return msg
      }

      return null
    },
    [sessionId, supabase]
  )

  const addAssistantMessage = useCallback(
    async (content: string) => {
      if (!sessionId) return null

      const { data: newMsg } = await supabase
        .from("messages")
        .insert({ session_id: sessionId, role: "assistant", content })
        .select()
        .single()

      if (newMsg) {
        const msg = newMsg as Message
        setData((prev) => ({
          ...prev,
          messages: [...prev.messages, msg],
          messageCount: prev.messageCount + 1,
        }))
        return msg
      }

      return null
    },
    [sessionId, supabase]
  )

  const toggleActionItem = useCallback(
    async (itemId: string, isCompleted: boolean) => {
      setData((prev) => ({
        ...prev,
        actionItems: prev.actionItems.map((item) =>
          item.id === itemId ? { ...item, is_completed: isCompleted } : item
        ),
      }))

      const { error } = await supabase
        .from("action_items")
        .update({ is_completed: isCompleted })
        .eq("id", itemId)

      if (error) {
        setData((prev) => ({
          ...prev,
          actionItems: prev.actionItems.map((item) =>
            item.id === itemId ? { ...item, is_completed: !isCompleted } : item
          ),
        }))
      }
    },
    [supabase]
  )

  const finishSession = useCallback(async () => {
    if (!sessionId) return null

    const startedAt = data.session?.started_at
    const durationMinutes = startedAt
      ? Math.round((Date.now() - new Date(startedAt).getTime()) / 60000)
      : null

    const { data: updated } = await supabase
      .from("chat_sessions")
      .update({
        status: "completed",
        ended_at: new Date().toISOString(),
        duration_minutes: durationMinutes,
      })
      .eq("id", sessionId)
      .select()
      .single()

    if (updated) {
      setData((prev) => ({ ...prev, session: updated as ChatSession }))
    }

    return updated
  }, [sessionId, data.session?.started_at, supabase])

  return {
    ...data,
    sendMessage,
    addAssistantMessage,
    toggleActionItem,
    finishSession,
    refetch: fetchSession,
  }
}
