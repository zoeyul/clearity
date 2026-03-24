"use client"

import { useRouter } from "next/navigation"
import { createClient } from "@clearity/lib"

export function useNewSession() {
  const router = useRouter()
  const supabase = createClient()

  const createNewSession = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const id = crypto.randomUUID()
    const { error } = await supabase
      .from("chat_sessions")
      .insert({ id, title: "New Chat", user_id: user.id })
    if (!error) router.push(`/chat/${id}`)
  }

  return createNewSession
}
