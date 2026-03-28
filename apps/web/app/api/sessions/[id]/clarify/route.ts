import { createGoogleGenerativeAI } from "@ai-sdk/google"
import { generateObject } from "ai"
import { z } from "zod"
import { createServerSupabaseClient } from "@clearity/lib/supabase/server"
import { MODELS } from "@clearity/lib"

export const maxDuration = 30

const ClarifySummarySchema = z.object({
  contradiction: z.string().describe(
    "The core tension or contradiction the user is facing, in one sentence"
  ),
  mainKeywords: z.array(z.string()).describe(
    "2-5 key themes extracted from the conversation (1-3 words each)"
  ),
  personalityInsight: z.string().describe(
    "A brief insight about how the user's thinking pattern affects this concern (1-2 sentences)"
  ),
  reframing: z.string().describe(
    "One alternative perspective to break the user's current frame (1-2 sentences)"
  ),
  userNote: z.string().describe(
    "A suggested conclusion written in first person, as if the user wrote it (1-2 sentences)"
  ),
  actionItems: z.array(
    z.object({
      text: z.string().describe("A small, concrete, immediately actionable step"),
    })
  ).describe("2-4 small actionable steps derived from the conversation"),
  // User profile extraction
  profile: z.object({
    interests: z.string().describe(
      "Specific interests or activities the user mentioned (comma-separated). Only include what was explicitly stated."
    ),
    patterns: z.string().describe(
      "Observed decision-making patterns and psychological traits (e.g., perfectionism, risk aversion, need for approval). Only based on evidence from the conversation."
    ),
    threshold: z.string().describe(
      "Any economic, time, or other constraints/limits the user set (e.g., budget caps, deadlines). Empty string if none mentioned."
    ),
    assets: z.string().describe(
      "User's actual career, skills, problem-solving abilities, or resources they mentioned. Only factual data."
    ),
  }).describe("Extract user traits for cross-session personalization. Only use explicitly stated information — no guessing."),
  // Thinking tendency scores
  tendencies: z.object({
    analytical_emotional: z.number().min(0).max(100).describe(
      "0 = purely analytical/logical thinking, 100 = purely emotional/feeling-based thinking. Based on how the user reasons in this conversation."
    ),
    future_present: z.number().min(0).max(100).describe(
      "0 = focused on future possibilities/plans, 100 = focused on present moment/current state. Based on temporal orientation of their thoughts."
    ),
    action_reflection: z.number().min(0).max(100).describe(
      "0 = action-oriented (wants to do things), 100 = reflection-oriented (wants to think/understand). Based on whether they talk about doing or pondering."
    ),
    optimistic_cautious: z.number().min(0).max(100).describe(
      "0 = sees possibilities and opportunities, 100 = sees risks and obstacles. Based on their framing of situations."
    ),
  }).describe("Score the user's thinking tendencies on each spectrum based ONLY on this conversation's evidence."),
})

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { apiKey }: { apiKey: string } = await req.json()
  const { id: sessionId } = await params

  if (!apiKey) {
    return Response.json({ error: "API key required" }, { status: 401 })
  }

  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    // Idempotency: return cached summary if exists
    const { data: existing } = await supabase
      .from("session_summaries")
      .select("*")
      .eq("session_id", sessionId)
      .single()

    if (existing) {
      const { data: items } = await supabase
        .from("action_items")
        .select("*")
        .eq("session_id", sessionId)
        .order("sort_order", { ascending: true })

      return Response.json({ summary: existing, actionItems: items ?? [] })
    }

    // Fetch all messages
    const { data: messages } = await supabase
      .from("messages")
      .select("role, content")
      .eq("session_id", sessionId)
      .order("created_at", { ascending: true })

    if (!messages || messages.length === 0) {
      return Response.json({ error: "No messages in this session" }, { status: 400 })
    }

    const conversation = messages
      .map(m => `${m.role === "user" ? "User" : "Clara"}: ${m.content}`)
      .join("\n\n")

    const google = createGoogleGenerativeAI({ apiKey })

    const { object } = await generateObject({
      model: google(MODELS.chat),
      maxRetries: 0,
      schema: ClarifySummarySchema,
      prompt: `You are Clara, an intellectual companion who helps people untangle complex thoughts and find clarity. You've just finished a conversation with a user. Generate a structured summary.

Rules:
- "contradiction": State the core tension, contradiction, or deadlock the user is facing in ONE clear sentence. Use the same language as the conversation.
- "mainKeywords": Extract 2-5 key themes (1-3 words each, same language as the user).
- "personalityInsight": Based on patterns you observed (e.g., perfectionism, overthinking, risk aversion), provide a brief insight about how their thinking style affects this concern. Be direct, not generic.
- "reframing": Suggest ONE concrete alternative perspective. Not vague advice — a specific angle they haven't considered.
- "userNote": Write a suggested conclusion as if the user wrote it (first person, 1-2 sentences). It should feel like a natural commitment or realization.
- "actionItems": 2-4 small, concrete, immediately actionable steps. Each should be something doable today or this week. Not "reflect on..." but specific actions.
- "profile": Extract user traits for cross-session learning. ONLY use explicitly stated information — no guessing or fabricating data.
  - "interests": Specific interests/activities the user mentioned
  - "patterns": Observed decision-making patterns and psychological traits
  - "threshold": Economic, time, or other constraints the user set (empty string if none)
  - "assets": User's actual career, skills, or resources they mentioned

Tone: Warm but direct. No therapeutic jargon. Mirror the user's language.

Conversation:
${conversation}`,
    })

    // Save summary
    const { data: summary, error: summaryError } = await supabase
      .from("session_summaries")
      .insert({
        session_id: sessionId,
        user_id: user.id,
        contradiction: object.contradiction,
        main_keywords: object.mainKeywords,
        personality_insight: object.personalityInsight,
        reframing: object.reframing,
        user_note: object.userNote,
      })
      .select()
      .single()

    if (summaryError) {
      console.error("[clarify] summary insert error:", summaryError)
      return Response.json({ error: "Failed to save summary" }, { status: 500 })
    }

    // Save action items
    const actionItemsToInsert = object.actionItems.map((item, i) => ({
      session_id: sessionId,
      text: item.text,
      sort_order: i,
      is_completed: false,
    }))

    const { data: items } = await supabase
      .from("action_items")
      .insert(actionItemsToInsert)
      .select()

    // Upsert user profile (accumulate interests/assets, overwrite patterns/threshold)
    const { data: existingProfile } = await supabase
      .from("user_profiles")
      .select("*")
      .eq("user_id", user.id)
      .single()

    const mergedProfile = {
      interests: existingProfile?.interests
        ? `${existingProfile.interests}, ${object.profile.interests}`.replace(/,\s*,/g, ",").replace(/^,\s*|,\s*$/g, "")
        : object.profile.interests,
      patterns: object.profile.patterns || existingProfile?.patterns || "",
      threshold: object.profile.threshold || existingProfile?.threshold || "",
      assets: existingProfile?.assets
        ? `${existingProfile.assets}, ${object.profile.assets}`.replace(/,\s*,/g, ",").replace(/^,\s*|,\s*$/g, "")
        : object.profile.assets,
    }

    if (existingProfile) {
      await supabase
        .from("user_profiles")
        .update(mergedProfile)
        .eq("user_id", user.id)
    } else {
      await supabase
        .from("user_profiles")
        .insert({ user_id: user.id, ...mergedProfile })
    }

    // Upsert user tendencies (running average)
    const { data: existingTendencies } = await supabase
      .from("user_tendencies")
      .select("*")
      .eq("user_id", user.id)
      .single()

    const t = object.tendencies
    if (existingTendencies) {
      const n = existingTendencies.session_count
      // Running average: new_avg = (old_avg * n + new_value) / (n + 1)
      await supabase
        .from("user_tendencies")
        .update({
          analytical_emotional: Math.round((existingTendencies.analytical_emotional * n + t.analytical_emotional) / (n + 1)),
          future_present: Math.round((existingTendencies.future_present * n + t.future_present) / (n + 1)),
          action_reflection: Math.round((existingTendencies.action_reflection * n + t.action_reflection) / (n + 1)),
          optimistic_cautious: Math.round((existingTendencies.optimistic_cautious * n + t.optimistic_cautious) / (n + 1)),
          session_count: n + 1,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", user.id)
    } else {
      await supabase
        .from("user_tendencies")
        .insert({
          user_id: user.id,
          ...t,
          session_count: 1,
        })
    }

    return Response.json({ summary, actionItems: items ?? [] })
  } catch (error: unknown) {
    const err = error as { statusCode?: number; message?: string }
    console.error("[clarify]", err.statusCode ?? 500, err.message ?? error)
    return Response.json(
      { error: err.message ?? "Summary generation failed" },
      { status: err.statusCode ?? 500 }
    )
  }
}
