"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import type { SupabaseClient } from "@supabase/supabase-js"

type ChatMessage = { id: string; role: "assistant"; parts: { type: "text"; text: string }[] }

/**
 * Generates and saves an AI greeting for fresh sessions.
 * Skips if the session already has messages.
 * On failure: deletes session and redirects to home.
 */
export function useGreeting({
  sessionId,
  keyword,
  apiKey,
  aboutMe,
  hasInitialMessages,
  supabase,
  setMessages,
  dbMessageIdsRef,
}: {
  sessionId: string
  keyword: string | null
  apiKey: string | null
  aboutMe: string | null
  hasInitialMessages: boolean
  supabase: SupabaseClient
  setMessages: (msgs: ChatMessage[]) => void
  dbMessageIdsRef: React.MutableRefObject<Set<string>>
}) {
  const [isLoading, setIsLoading] = useState(!hasInitialMessages && !!(keyword || apiKey))
  const greetingSavedRef = useRef(false)
  const router = useRouter()

  useEffect(() => {
    if (hasInitialMessages || greetingSavedRef.current) return
    if (!keyword && !apiKey) return

    greetingSavedRef.current = true

    const generate = async () => {
      try {
        const res = await fetch("/api/greeting", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ keyword, apiKey, aboutMe }),
        })

        if (!res.ok) {
          await handleFailure()
          return
        }

        const { greeting } = await res.json()
        saveGreeting(greeting)
      } catch {
        await handleFailure()
      }
    }

    const handleFailure = async () => {
      setIsLoading(false)
      await supabase.from("chat_sessions").delete().eq("id", sessionId)
      alert("AI is currently unavailable. Please try again later.")
      router.push("/")
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
