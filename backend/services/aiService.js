/* eslint-env node */
const ANTHROPIC_URL = "https://api.anthropic.com/v1/messages";

function getApiKey() {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY is not configured on the server.");
  }
  return apiKey;
}

async function callAnthropic({ system, messages, maxTokens = 2500, model = "claude-sonnet-4-5" }) {
  const response = await fetch(ANTHROPIC_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": getApiKey(),
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model,
      max_tokens: maxTokens,
      system,
      messages,
    }),
  });

  const data = await response.json();

  if (!response.ok || data.error) {
    const message = data?.error?.message || "Anthropic request failed.";
    throw new Error(message);
  }

  const content = data?.content?.[0]?.text;
  if (!content) {
    throw new Error("Anthropic returned an empty response.");
  }

  return content;
}

module.exports = { callAnthropic };
