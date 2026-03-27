import { createGoogleGenerativeAI } from "@ai-sdk/google"
import { generateObject } from "ai"
import { z } from "zod"
import { createServerSupabaseClient } from "@clearity/lib/supabase/server"

const TendencySchema = z.object({
  analytical_emotional: z.number().min(0).max(100),
  future_present: z.number().min(0).max(100),
  action_reflection: z.number().min(0).max(100),
  optimistic_cautious: z.number().min(0).max(100),
})

export async function POST(req: Request) {
  const { apiKey }: { apiKey: string } = await req.json()

  if (!apiKey) {
    return Response.json({ error: "API key required" }, { status: 401 })
  }

  const google = createGoogleGenerativeAI({ apiKey })
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    // Get all completed sessions with messages
    const { data: sessions } = await supabase
      .from("chat_sessions")
      .select("id, title")
      .eq("user_id", user.id)
      .eq("status", "completed")

    if (!sessions || sessions.length === 0) {
      return Response.json({ message: "No completed sessions" })
    }

    const allScores: z.infer<typeof TendencySchema>[] = []

    for (const session of sessions) {
      const { data: messages } = await supabase
        .from("messages")
        .select("role, content")
        .eq("session_id", session.id)
        .order("created_at", { ascending: true })

      if (!messages || messages.length === 0) continue

      const conversation = messages
        .map(m => `${m.role === "user" ? "User" : "Clara"}: ${m.content}`)
        .join("\n\n")

      try {
        const { object } = await generateObject({
          model: google("gemini-2.5-flash"),
          maxRetries: 0,
          schema: TendencySchema,
          prompt: `Score the user's thinking tendencies based on this conversation.

- analytical_emotional: 0 = purely analytical/logical, 100 = purely emotional/feeling-based
- future_present: 0 = focused on future possibilities, 100 = focused on present state
- action_reflection: 0 = action-oriented (wants to do), 100 = reflection-oriented (wants to understand)
- optimistic_cautious: 0 = sees possibilities, 100 = sees risks

Score based ONLY on evidence from the conversation.

Conversation:
${conversation}`,
        })
        allScores.push(object)
      } catch {
        // Skip on error
      }
    }

    if (allScores.length === 0) {
      return Response.json({ message: "No scores generated" })
    }

    // Average all scores
    const avg = {
      analytical_emotional: Math.round(allScores.reduce((s, t) => s + t.analytical_emotional, 0) / allScores.length),
      future_present: Math.round(allScores.reduce((s, t) => s + t.future_present, 0) / allScores.length),
      action_reflection: Math.round(allScores.reduce((s, t) => s + t.action_reflection, 0) / allScores.length),
      optimistic_cautious: Math.round(allScores.reduce((s, t) => s + t.optimistic_cautious, 0) / allScores.length),
    }

    // Upsert
    const { data: existing } = await supabase
      .from("user_tendencies")
      .select("id")
      .eq("user_id", user.id)
      .single()

    if (existing) {
      await supabase
        .from("user_tendencies")
        .update({ ...avg, session_count: allScores.length, updated_at: new Date().toISOString() })
        .eq("user_id", user.id)
    } else {
      await supabase
        .from("user_tendencies")
        .insert({ user_id: user.id, ...avg, session_count: allScores.length })
    }

    return Response.json({
      message: "Backfill complete",
      sessions: allScores.length,
      scores: avg,
    })
  } catch (error: unknown) {
    const err = error as { message?: string }
    console.error("[backfill-tendencies]", err.message ?? error)
    return Response.json({ error: err.message ?? "Backfill failed" }, { status: 500 })
  }
}
