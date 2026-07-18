// Server-only helper for calling the Lovable AI Gateway.
// LOVABLE_API_KEY is auto-provisioned by Lovable Cloud; never expose it to the browser.
//
// -----------------------------------------------------------------------------
// AI PROVIDER CONFIGURATION
// -----------------------------------------------------------------------------
// This app uses the Lovable AI Gateway (Google Gemini under the hood) with the
// project's built-in LOVABLE_API_KEY — NO manual API key entry required.
//
// If you want to switch to your OWN Google Gemini API key instead, replace the
// fetch below with a call to https://generativelanguage.googleapis.com/... and
// read the key from process.env.GEMINI_API_KEY (add it via Lovable → Settings
// → Secrets, NEVER hardcode it here).
// -----------------------------------------------------------------------------

const GATEWAY_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";
const DEFAULT_MODEL = "google/gemini-3.5-flash";

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export async function callGeminiJSON<T = unknown>(
  messages: ChatMessage[],
  opts: { model?: string; temperature?: number } = {},
): Promise<T> {
  const key = process.env.LOVABLE_API_KEY;
  if (!key) {
    throw new Error(
      "LOVABLE_API_KEY is not configured. AI service is unavailable.",
    );
  }

  const res = await fetch(GATEWAY_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Lovable-API-Key": key,
    },
    body: JSON.stringify({
      model: opts.model ?? DEFAULT_MODEL,
      messages,
      temperature: opts.temperature ?? 0.4,
      response_format: { type: "json_object" },
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    if (res.status === 429) {
      throw new Error(
        "AI rate limit reached. Please wait a moment and try again.",
      );
    }
    if (res.status === 402) {
      throw new Error(
        "AI credits exhausted. Please add credits to continue using the AI service.",
      );
    }
    throw new Error(`AI request failed [${res.status}]: ${body}`);
  }

  const data = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error("AI returned an empty response.");

  try {
    return JSON.parse(content) as T;
  } catch {
    // Try to extract JSON from a code fence if the model wrapped it.
    const match = content.match(/\{[\s\S]*\}/);
    if (match) return JSON.parse(match[0]) as T;
    throw new Error("AI returned invalid JSON.");
  }
}