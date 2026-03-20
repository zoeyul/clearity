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

    const id = crypto.randomUUID()
    const { error } = await supabase
      .from("chat_sessions")
      .insert({ id, title: "New Chat", user_id: user.id })

    if (error) return null

    const session = { id, title: "New Chat", user_id: user.id, status: "active", created_at: new Date().toISOString(), updated_at: new Date().toISOString() } as ChatSession
    setSessions((prev) => [session, ...prev])
    return session
  }, [supabase])

  return { sessions, isLoading, createSession, refetch: fetchSessions }
}
