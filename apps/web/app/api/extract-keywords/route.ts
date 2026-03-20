import { createGoogleGenerativeAI } from "@ai-sdk/google"
import { generateObject, embed } from "ai"
import { z } from "zod"
import { createServerSupabaseClient } from "@clearity/lib/supabase/server"
import { cosineSimilarity } from "@clearity/lib/utils/cosine"

const SIMILARITY_THRESHOLD = 0.85

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

    // 2. Generate embedding for main keyword
    let mainEmbedding: number[] | null = null
    try {
      const { embedding } = await embed({
        model: google.textEmbeddingModel("gemini-embedding-001"),
        value: object.main,
      })
      mainEmbedding = embedding
    } catch {
      // Embedding failed
    }

    // 3. Dedup: compare with existing main keywords
    let matchedKeywordId: string | null = null
    let similarities: { id: string; score: number }[] = []

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

    // 4. Dedup result
    if (matchedKeywordId) {
      // Same topic — atomic increment hit_count + refresh updated_at
      await supabase.rpc("increment_hit_count", { keyword_id: matchedKeywordId })

      return Response.json({
        action: "merged",
        mergedInto: matchedKeywordId,
        sessionTitle: object.sessionTitle,
        subs: object.subs,
        similarities: similarities.filter(s => s.score > 0.3),
      })
    }

    // 5. New topic — generate sub embeddings too
    const embeddings: Record<string, number[]> = {}
    if (mainEmbedding) embeddings[object.main] = mainEmbedding

    for (const sub of object.subs) {
      try {
        const { embedding } = await embed({
          model: google.textEmbeddingModel("gemini-embedding-001"),
          value: sub,
        })
        embeddings[sub] = embedding
      } catch {
        // continue
      }
    }

    return Response.json({
      action: "created",
      main: object.main,
      subs: object.subs,
      sessionTitle: object.sessionTitle,
      embeddings,
      similarities: similarities.filter(s => s.score > 0.3),
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
