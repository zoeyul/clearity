"use client"

import { useEffect, useRef } from "react"
import type { SupabaseClient } from "@supabase/supabase-js"
import type { UIMessage } from "ai"

/**
 * Saves new assistant messages to DB when streaming completes.
 * Tracks which messages are already persisted to avoid duplicates.
 */
export function useMessagePersistence(
  sessionId: string,
  messages: UIMessage[],
  status: string,
  supabase: SupabaseClient,
  initialMessageIds: Set<string>,
) {
  const lastSavedIdRef = useRef<string | null>(null)
  const dbMessageIdsRef = useRef(initialMessageIds)

  useEffect(() => {
    if (status !== "ready" || messages.length === 0) return
    const lastMsg = messages[messages.length - 1]
    if (!lastMsg || lastMsg.role !== "assistant") return
    if (lastMsg.id === lastSavedIdRef.current) return
    if (dbMessageIdsRef.current.has(lastMsg.id)) return

    const content = lastMsg.parts
      ?.filter((p: { type: string }) => p.type === "text")
      .map((p: { type: string; text?: string }) => p.text ?? "")
      .join("") ?? ""
    if (!content) return

    const save = async () => {
      const { error } = await supabase
        .from("messages")
        .insert({ session_id: sessionId, role: "assistant", content })
      if (!error) {
        lastSavedIdRef.current = lastMsg.id
        dbMessageIdsRef.current.add(lastMsg.id)
      }
    }
    save()
  }, [status, messages.length, sessionId, supabase])

  return dbMessageIdsRef
}
