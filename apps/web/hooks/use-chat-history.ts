"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { createClient } from "@clearity/lib"
import type { ChatSession } from "@clearity/lib"

export function useChatHistory() {
  const [sessions, setSessions] = useState<ChatSession[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const supabaseRef = useRef(createClient())
  const supabase = supabaseRef.current

  const fetchSessions = useCallback(async () => {
    const { data } = await supabase
      .from("chat_sessions")
      .select("*")
      .order("updated_at", { ascending: false })

    setSessions((data ?? []) as ChatSession[])
    setIsLoading(false)
  }, [supabase])

  useEffect(() => {
    fetchSessions()
  }, [fetchSessions])

  const createSession = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    const { data } = await supabase
      .from("chat_sessions")
      .insert({ title: "New Chat", user_id: user.id })
      .select()
      .single()

    if (data) {
      const session = data as ChatSession
      setSessions((prev) => [session, ...prev])
      return session
    }

    return null
  }, [supabase])

  return { sessions, isLoading, createSession, refetch: fetchSessions }
}
