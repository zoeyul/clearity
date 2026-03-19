import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { streamText, UIMessage, convertToModelMessages } from "ai";

export const maxDuration = 30;

export async function POST(req: Request) {
  const {
    messages,
    apiKey,
    aboutMe,
  }: { messages: UIMessage[]; apiKey: string; aboutMe?: string } =
    await req.json();

  if (!apiKey) {
    return new Response(
      "API key is required. Add your Gemini API key in Settings.",
      {
        status: 401,
      },
    );
  }

  try {
    const google = createGoogleGenerativeAI({ apiKey });

    const result = streamText({
      model: google("gemini-2.5-flash"),
      maxRetries: 0,
      system: `You are Clara, a thoughtful AI companion for Clearity — an app that helps people organize their thoughts and find clarity.

Your role:
- Help users untangle complex thoughts, not provide therapy
- Ask reflective questions that help them see patterns
- Summarize and structure their thinking
- Suggest actionable next steps when appropriate
- Be warm but concise — avoid long monologues

Style:
- Use short paragraphs
- Mirror the user's language level
- When they're overwhelmed, help break things into smaller pieces
- When they're unclear, help them articulate what they actually mean
${aboutMe ? `\nAbout the user:\n${aboutMe}` : ""}`,
      messages: await convertToModelMessages(messages),
    });

    return result.toUIMessageStreamResponse();
  } catch (error: unknown) {
    const err = error as { statusCode?: number; message?: string };
    console.error("[chat]", err.statusCode ?? 500, err.message ?? error);
    return new Response(err.message ?? "Chat failed", {
      status: err.statusCode ?? 500,
    });
  }
}
