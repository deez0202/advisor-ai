/* eslint-env node */
const { callAnthropic } = require("./aiService");

const VOICE_UPDATE_SYSTEM = `You update a financial advice form from spoken instructions.

Rules:
- Return ONLY valid JSON. No markdown, no explanation.
- Include ONLY keys/fields the user asked to change. Omit unchanged sections entirely.
- If a section has no changes, omit that top-level key.
- Nested objects should contain only the fields being updated.
- Preserve meaning: use empty string "" only if the user explicitly clears a field.

Output shape (only include keys you are updating):
{
  "clientDetails": {},
  "financials": {},
  "needs": {},
  "investment": {},
  "recommendation": {}
}`;

function parseJsonFromText(text) {
  const cleaned = text.replace(/```json/gi, "").replace(/```/g, "").trim();
  try {
    return JSON.parse(cleaned);
  } catch (_) {
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (!match) {
      throw new Error("Could not parse voice update as JSON.");
    }
    return JSON.parse(match[0]);
  }
}

async function voiceUpdateForm({ transcript, formData }) {
  const userContent = `Update this financial advice form based on the user instruction.

Current form:
${JSON.stringify(formData, null, 2)}

Instruction:
${transcript}

Return ONLY updated JSON in this format:
{
  "clientDetails": {},
  "financials": {},
  "needs": {},
  "investment": {},
  "recommendation": {}
}

Do not explain anything.`;

  const raw = await callAnthropic({
    system: VOICE_UPDATE_SYSTEM,
    maxTokens: 4000,
    messages: [{ role: "user", content: userContent }],
  });

  return parseJsonFromText(raw);
}

module.exports = { voiceUpdateForm };
