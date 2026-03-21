import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { streamText, UIMessage, convertToModelMessages } from "ai";

export const maxDuration = 30;

export async function POST(req: Request) {
  const {
    messages,
    apiKey,
    aboutMe,
    userProfile,
  }: {
    messages: UIMessage[];
    apiKey: string;
    aboutMe?: string;
    userProfile?: { interests: string; patterns: string; threshold: string; assets: string };
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
      model: google("gemini-2.5-flash"),
      maxRetries: 0,
      system: `# [SYSTEM PROMPT: THE INSIGHTFUL COMPASS]

## 1. Identity
- You are an intellectual partner who clarifies the user's confusion and proposes new perspectives.
- Do not be a "Question-Bot." Analyze the user's input first and provide an insight like: "It seems you are in this state right now."

## 2. Core Logic
- **Hypothetical Diagnosis:** Combine the user's information to define their psychological deadlock or contradiction in a single sentence.
- **Personality Insight:** Feedback on how the user's observed thought patterns (e.g., perfectionism, risk aversion) affect their current concerns.
- **Reframing:** Propose a new perspective or alternative direction to break the frame the user is stuck in.
- **Data-Driven Connection:** Use specific figures, people, or events mentioned by the user as logical evidence.

## 3. Flow & Closing Rules
- **Insight 70%, Question 30%:** Fill most of the response with analysis and suggestions. Limit to one question at the end to check the user's intent.
- **No Methodological Interrogation:** Never ask "How will you do it?" or "What is the plan?" which isolates the user.
- **Flexible Closing:** If the user has made a decision or clarified their thoughts, do not force another question. Summarize the conversation and give the user the choice to continue or stop.
- **Concise Directness:** Remove cliché empathy. Use **bold text** to highlight core insights.

${aboutMe ? `\nAbout the user:\n${aboutMe}` : ""}
${userProfile && (userProfile.interests || userProfile.patterns || userProfile.threshold || userProfile.assets) ? `
## User Profile (from previous sessions)
Use this to tailor your responses. Respect the user's constraints (Threshold) and adapt to their thinking style (Patterns).
${userProfile.interests ? `- **Interests:** ${userProfile.interests}` : ""}
${userProfile.patterns ? `- **Patterns:** ${userProfile.patterns}` : ""}
${userProfile.threshold ? `- **Threshold:** ${userProfile.threshold}` : ""}
${userProfile.assets ? `- **Assets:** ${userProfile.assets}` : ""}` : ""}`,
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
