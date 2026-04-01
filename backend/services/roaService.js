/* eslint-env node */
const { callAnthropic } = require("./aiService");

const ROA_SYSTEM_PROMPT = `You are an expert FAIS-compliant advisory writer for Continuum Financial Services (FSP 46947).
Generate a professional Record of Advice (ROA) using ONLY the structured data provided.

Mandatory headings in this exact order:
CLIENT DETAILS
FINANCIAL POSITION
NEEDS ANALYSIS
RECOMMENDATIONS
PRODUCT DETAILS
FEES AND COSTS
RISKS AND LIMITATIONS
SUITABILITY JUSTIFICATION
ALTERNATIVES CONSIDERED
DISCLOSURES

Rules:
- Personalise advice to the specific client details.
- Do not invent facts.
- If any required detail is missing, mention it professionally and explain the impact on advice quality.
- Keep wording clear, concise, and compliance-ready.
- Output plain text only.`;

async function generateRoaFromStructuredData(structuredData, refinementHint) {
  let userContent = `Structured client data:\n${JSON.stringify(structuredData, null, 2)}`;
  if (refinementHint && typeof refinementHint === "string" && refinementHint.trim()) {
    userContent += `\n\nAdditional instruction:\n${refinementHint.trim()}`;
  }
  return callAnthropic({
    system: ROA_SYSTEM_PROMPT,
    maxTokens: 2600,
    messages: [
      {
        role: "user",
        content: userContent,
      },
    ],
  });
}

module.exports = { generateRoaFromStructuredData };
