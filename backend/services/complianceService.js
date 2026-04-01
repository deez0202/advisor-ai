/* eslint-env node */
const { callAnthropic } = require("./aiService");

const COMPLIANCE_SYSTEM_PROMPT = `You are a FAIS compliance reviewer for Record of Advice documents.
Review the ROA and return JSON only with this exact structure:
{
  "issues": [],
  "risks": [],
  "missingInfo": [],
  "suggestedFixes": []
}
Each array should contain concise, practical bullet-style strings.`;

async function runComplianceCheck(roaText) {
  const response = await callAnthropic({
    system: COMPLIANCE_SYSTEM_PROMPT,
    maxTokens: 1400,
    messages: [{ role: "user", content: roaText }],
  });

  try {
    return JSON.parse(response);
  } catch (_) {
    const match = response.match(/\{[\s\S]*\}/);
    if (!match) {
      throw new Error("Compliance response is not valid JSON.");
    }
    return JSON.parse(match[0]);
  }
}

module.exports = { runComplianceCheck };
