import { createGoogleGenerativeAI } from "@ai-sdk/google"
import { generateObject } from "ai"
import { z } from "zod"

const KeywordSchema = z.object({
  main: z.string().describe("The primary topic or core concern (2-4 words)"),
  subs: z.array(z.string()).describe("1-3 secondary/derivative concerns (1-3 words each)"),
  sessionTitle: z.string().describe("A concise session title based on the main topic (2-5 words)"),
})

export async function POST(req: Request) {
  const { message, apiKey }: { message: string; apiKey: string } = await req.json()

  if (!apiKey) {
    return Response.json({ error: "API key required" }, { status: 401 })
  }

  const google = createGoogleGenerativeAI({ apiKey })

  const { object } = await generateObject({
    model: google("gemini-2.0-flash"),
    schema: KeywordSchema,
    prompt: `Analyze this user message and extract the core topics they're thinking about.

Rules:
- "main" = the single most important topic (the real concern behind the words)
- "subs" = 1-3 derivative or related concerns branching from the main topic
- "sessionTitle" = a short, clean title for this conversation (like a journal entry title)
- Use the same language as the user's message
- Extract meaning, not just words — "I'm scared about changing jobs" → main: "Career transition", not "scared"

User message: "${message}"`,
  })

  return Response.json(object)
}
