import { createGoogleGenerativeAI } from "@ai-sdk/google"
import { generateObject, embed } from "ai"
import { MODELS } from "@clearity/lib"
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
  const { message, apiKey, sessionId }: {
    message: string
    apiKey: string
    sessionId?: string
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
      model: google(MODELS.chat),
      maxRetries: 0,
      schema: ExtractionSchema,
      prompt: `You are analyzing someone's inner thoughts. Identify the thought that keeps occupying their mind — the thing they can't stop thinking about.

Rules:
- "main" = the recurring thought in 2-5 words. It should feel like an inner voice, not a textbook label.
  - NEVER use clinical/generic terms like "stress", "anxiety", "worries" (or their equivalents in any language)
  - Ask yourself: "Would this person recognize this phrase and say 'yes, that's exactly what's been stuck in my head'?"
- "subs" = 1-3 related thoughts branching from the main one, same style — raw and personal like the user's actual inner voice
- "sessionTitle" = a concise title for this thought (2-5 words)
- Consider the ENTIRE message equally — do NOT give extra weight to the last sentence. The main thought is often expressed throughout, not just at the end.
- Use the same language as the user's message

User message: "${message}"`,
    })

    // 2. Generate embedding (keyword + sentence combined)
    let mainEmbedding: number[] | null = null
    try {
      const { embedding } = await embed({
        model: google.textEmbeddingModel(MODELS.embedding),
        value: `${object.main} — ${message}`,
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
        .select("id, label, embedding_v2, hit_count")
        .eq("user_id", user.id)
        .eq("hierarchy", "main")
        .in("status", ["fragment", "clustered", "core"])

      if (existingKeywords) {
        for (const existing of existingKeywords) {
          // Exact keyword match → always merge
          if (existing.label === object.main) {
            matchedKeywordId = existing.id
          }

          if (!existing.embedding_v2) continue
          const score = cosineSimilarity(mainEmbedding, existing.embedding_v2 as number[])
          similarities.push({ id: existing.id, score })

          if (!matchedKeywordId && score >= SIMILARITY_THRESHOLD) {
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
          ...(sessionId ? { session_id: sessionId } : {}),
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
        embedding_v2: mainEmbedding,
        ...(sessionId ? { session_id: sessionId } : {}),
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
        ...(sessionId ? { session_id: sessionId } : {}),
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
