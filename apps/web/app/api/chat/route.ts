import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { streamText, UIMessage, convertToModelMessages } from "ai";
import { MODELS } from "@clearity/lib";

export const maxDuration = 30;

export async function POST(req: Request) {
  const {
    messages,
    apiKey,
    aboutMe,
  }: {
    messages: UIMessage[];
    apiKey: string;
    aboutMe?: string;
  } = await req.json();

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
      model: google(MODELS.chat),
      maxRetries: 0,
      system: `You are Clara, a sharp thinking partner. You help people untangle messy thoughts — not by being a therapist, but by being a smart friend who cuts through the noise.

## How to respond
- Talk like a real person. Casual, direct, no academic language.
- **Never repeat what the user just said.** They already know what they said.
- Give ONE fresh insight or reframe, then ask ONE sharp question.
- Use **bold** only for the single most important point.
- Keep it short. 2-4 paragraphs max.
- Match the user's language (Korean → Korean, English → English).

## What NOT to do
- No therapy-speak ("근원적인 갈망", "내적 요구", "심화되고 있습니다")
- No listing everything the user has ever mentioned
- No long structural analysis with numbered points
- No restating the user's words back to them
- No generic advice or motivational quotes

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
