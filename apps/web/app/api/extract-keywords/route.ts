import { createGoogleGenerativeAI } from "@ai-sdk/google"
import { generateObject, embed } from "ai"
import { z } from "zod"
import { createServerSupabaseClient } from "@clearity/lib/supabase/server"
import { cosineSimilarity } from "@clearity/lib/utils/cosine"

const SIMILARITY_THRESHOLD = 0.8

const ExtractionSchema = z.object({
  main: z.string().describe("The primary topic or core concern (2-4 words)"),
  subs: z.array(z.string()).describe("1-3 secondary/derivative concerns (1-3 words each)"),
  sessionTitle: z.string().describe("A concise session title based on the main topic (2-5 words)"),
})

export async function POST(req: Request) {
  const { message, apiKey }: {
    message: string
    apiKey: string
  } = await req.json()

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
    // 1. Extract keywords via Gemini
    const { object } = await generateObject({
      model: google("gemini-2.5-flash"),
      maxRetries: 0,
      schema: ExtractionSchema,
      prompt: `Analyze this user message and extract the core topics they're thinking about.

Rules:
- "main" = the single most important topic (the real concern behind the words)
- "subs" = 1-3 derivative or related concerns branching from the main topic
- "sessionTitle" = a short, clean title for this conversation (like a journal entry title)
- Use the same language as the user's message
- Extract meaning, not just words — "I'm scared about changing jobs" → main: "Career transition", not "scared"

User message: "${message}"`,
    })

    // 2. Generate embedding from original message (not keyword) for better discrimination
    let mainEmbedding: number[] | null = null
    try {
      const { embedding } = await embed({
        model: google.textEmbeddingModel("gemini-embedding-001"),
        value: message,
      })
      mainEmbedding = embedding
    } catch {
      // Embedding failed
    }

    // 3. Dedup: compare with existing main keywords
    let matchedKeywordId: string | null = null
    const similarities: { id: string; score: number }[] = []

    if (mainEmbedding) {
      const { data: existingKeywords } = await supabase
        .from("session_keywords")
        .select("id, label, embedding, hit_count")
        .eq("user_id", user.id)
        .eq("hierarchy", "main")
        .in("status", ["fragment", "clustered", "core"])

      if (existingKeywords) {
        for (const existing of existingKeywords) {
          if (!existing.embedding) continue
          const score = cosineSimilarity(mainEmbedding, existing.embedding as number[])
          similarities.push({ id: existing.id, score })

          if (score >= SIMILARITY_THRESHOLD) {
            matchedKeywordId = existing.id
          }
        }
      }
    }

    // 4. Dedup: same topic → increment hit_count + append new subs
    if (matchedKeywordId) {
      await supabase.rpc("increment_hit_count", { keyword_id: matchedKeywordId })

      // Add new sub keywords under existing main
      const newSubs: { id: string; label: string }[] = []
      if (object.subs.length > 0) {
        const subsToInsert = object.subs.map(sub => ({
          label: sub,
          intensity: "medium",
          hierarchy: "sub",
          status: "fragment",
          user_id: user.id,
          parent_id: matchedKeywordId,
        }))

        const { data } = await supabase
          .from("session_keywords")
          .insert(subsToInsert)
          .select("id, label")

        if (data) newSubs.push(...data)
      }

      // Save raw input log
      await supabase.from("user_inputs").insert({
        user_id: user.id,
        message,
        embedding: mainEmbedding,
        extracted_main: object.main,
        extracted_subs: object.subs,
        matched_keyword_id: matchedKeywordId,
      })

      return Response.json({
        action: "merged",
        mergedInto: matchedKeywordId,
        sessionTitle: object.sessionTitle,
        subs: newSubs,
      })
    }

    // 5. New topic — insert main keyword
    const { data: mainInserted } = await supabase
      .from("session_keywords")
      .insert({
        label: object.main,
        intensity: "high",
        hierarchy: "main",
        status: "fragment",
        user_id: user.id,
        hit_count: 1,
        embedding: mainEmbedding,
      })
      .select("id")
      .single()

    if (!mainInserted) {
      return Response.json({ error: "Failed to insert keyword" }, { status: 500 })
    }

    // 6. Insert sub keywords
    const subsInserted: { id: string; label: string }[] = []
    if (object.subs.length > 0) {
      const subsToInsert = object.subs.map(sub => ({
        label: sub,
        intensity: "medium",
        hierarchy: "sub",
        status: "fragment",
        user_id: user.id,
        parent_id: mainInserted.id,
      }))

      const { data } = await supabase
        .from("session_keywords")
        .insert(subsToInsert)
        .select("id, label")

      if (data) subsInserted.push(...data)
    }

    // 7. Save raw input log
    await supabase.from("user_inputs").insert({
      user_id: user.id,
      message,
      embedding: mainEmbedding,
      extracted_main: object.main,
      extracted_subs: object.subs,
      matched_keyword_id: null,
    })

    // 8. Save similarity scores to keyword_relations
    const relationsToInsert = similarities
      .filter(s => s.score > 0)
      .map(s => ({
        source_id: s.id,
        target_id: mainInserted.id,
        score: s.score,
        user_id: user.id,
      }))

    if (relationsToInsert.length > 0) {
      await supabase.from("keyword_relations").insert(relationsToInsert)
    }

    return Response.json({
      action: "created",
      mainId: mainInserted.id,
      main: object.main,
      subs: subsInserted,
      sessionTitle: object.sessionTitle,
    })
  } catch (error: unknown) {
    const err = error as { statusCode?: number; message?: string }
    console.error("[extract-keywords]", err.statusCode ?? 500, err.message ?? error)
    return Response.json(
      { error: err.message ?? "Extraction failed" },
      { status: err.statusCode ?? 500 }
    )
  }
}
