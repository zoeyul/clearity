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

  // Only delete if no messages
  if (count === 0) {
    await supabase.from("chat_sessions").delete().eq("id", sessionId)
  }

  return NextResponse.json({ ok: true })
}
