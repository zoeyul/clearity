import { createServerSupabaseClient } from "@clearity/lib/supabase/server"
import { createClient } from "@supabase/supabase-js"
import { env } from "@clearity/lib"
import { NextResponse } from "next/server"

export async function POST() {
  // Get current user from session
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
  }

  // Use service role to delete user (admin only operation)
  const adminClient = createClient(
    env.supabase.url,
    env.supabase.serviceRoleKey
  )

  // DB data is CASCADE deleted via foreign keys
  const { error } = await adminClient.auth.admin.deleteUser(user.id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
