"use client"

import { useEffect, useRef, useState } from "react"
import type { SupabaseClient } from "@supabase/supabase-js"

const FALLBACK_GREETING = "What's been on your mind lately? No need to organize it — just start wherever feels right."

type ChatMessage = { id: string; role: "assistant"; parts: { type: "text"; text: string }[] }

/**
 * Generates and saves an AI greeting for fresh sessions.
 * Skips if the session already has messages.
 */
export function useGreeting({
  sessionId,
  keyword,
  context,
  apiKey,
  aboutMe,
  hasInitialMessages,
  supabase,
  setMessages,
  dbMessageIdsRef,
}: {
  sessionId: string
  keyword: string | null
  context?: string
  apiKey: string | null
  aboutMe: string | null
  hasInitialMessages: boolean
  supabase: SupabaseClient
  setMessages: (msgs: ChatMessage[]) => void
  dbMessageIdsRef: React.MutableRefObject<Set<string>>
}) {
  const [isLoading, setIsLoading] = useState(!hasInitialMessages && !!(keyword || apiKey))
  const greetingSavedRef = useRef(false)

  useEffect(() => {
    if (hasInitialMessages || greetingSavedRef.current) return
    if (!keyword && !apiKey) return

    greetingSavedRef.current = true

    const generate = async () => {
      try {
        const res = await fetch("/api/greeting", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ keyword, context, apiKey, aboutMe }),
        })
        const { greeting } = await res.json()
        saveGreeting(greeting)
      } catch {
        saveGreeting(FALLBACK_GREETING)
      }
    }

    const saveGreeting = async (text: string) => {
      const msg: ChatMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        parts: [{ type: "text", text }],
      }
      setMessages([msg])
      dbMessageIdsRef.current.add(msg.id)
      setIsLoading(false)

      await supabase.from("messages").insert({
        session_id: sessionId,
        role: "assistant",
        content: text,
      })
    }

    generate()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return isLoading
}
