/**
 * Client-side Anthropic call. Set VITE_ANTHROPIC_API_KEY in frontend .env for direct browser access.
 * If unset, use requestFixRecommendation / requestFixCompliance from the API instead.
 */
const ANTHROPIC_URL = "https://api.anthropic.com/v1/messages";

export async function callAI(prompt) {
  const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY;
  if (!apiKey || !String(apiKey).trim()) {
    const err = new Error("NO_BROWSER_KEY");
    err.code = "NO_BROWSER_KEY";
    throw err;
  }

  const response = await fetch(ANTHROPIC_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "anthropic-dangerous-direct-browser-access": "true",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-6",
      max_tokens: 2000,
      messages: [{ role: "user", content: prompt }],
    }),
  });

  const data = await response.json();
  if (!response.ok || data.error) {
    const message = data?.error?.message || data?.error || "Anthropic request failed.";
    throw new Error(typeof message === "string" ? message : JSON.stringify(message));
  }

  return data.content?.[0]?.text || "No response";
}
