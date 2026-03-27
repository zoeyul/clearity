import { createServerSupabaseClient } from "@clearity/lib/supabase/server"
import { NextResponse } from "next/server"

export async function POST(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const supabase = createServerSupabaseClient()
  const sessionId = params.id

  // Check if session has any messages
  const { count } = await supabase
    .from("messages")
    .select("id", { count: "exact", head: true })
    .eq("session_id", sessionId)

  // Only delete if no messages AND title is "New Chat" (not from keyword Deep Dive)
  if (count === 0) {
    const { data: session } = await supabase
      .from("chat_sessions")
      .select("title")
      .eq("id", sessionId)
      .single()

    if (session?.title === "New Chat") {
      await supabase.from("chat_sessions").delete().eq("id", sessionId)
    }
  }

  return NextResponse.json({ ok: true })
}
