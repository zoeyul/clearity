import { createGoogleGenerativeAI } from "@ai-sdk/google"
import { generateText } from "ai"
import { MODELS } from "@clearity/lib"

export const maxDuration = 15

export async function POST(req: Request) {
  const { keyword, context, apiKey, aboutMe } = await req.json()

  if (!apiKey) {
    return Response.json({ greeting: "What's been on your mind lately? No need to organize it — just start wherever feels right." })
  }

  try {
    const google = createGoogleGenerativeAI({ apiKey })

    const { text } = await generateText({
      model: google(MODELS.chat),
      maxRetries: 0,
      system: `You are Clara, a warm but concise thought-organizing companion. Generate ONE opening message for a conversation.

Rules:
- 1-2 sentences max
- Acknowledge what the user said naturally
- Ask a relevant, specific follow-up question based on the actual content
- Match the user's language (if they wrote in Korean, respond in Korean)
- No cliché empathy, no therapeutic jargon
- Be curious and specific, not generic`,
      prompt: keyword && context
        ? `The user previously wrote: "${context}"\nThis was categorized under the keyword: "${keyword}"\n\nGenerate a natural opening message that acknowledges what they said and asks a specific follow-up.${aboutMe ? `\n\nAbout the user: ${aboutMe}` : ""}`
        : `Generate a casual, inviting opening message for someone starting a new thought session.${aboutMe ? `\n\nAbout the user: ${aboutMe}` : ""}`,
    })

    return Response.json({ greeting: text.trim() })
  } catch {
    // Fallback to neutral template on error
    const fallback = keyword
      ? `You mentioned "${keyword}". Tell me more about what's going on with this.`
      : "What's been on your mind lately? No need to organize it — just start wherever feels right."
    return Response.json({ greeting: fallback })
  }
}
