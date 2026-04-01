/* eslint-env node */
const { callAnthropic } = require("./aiService");

const BASE_SYSTEM = `You are an expert FAIS-compliant advisory editor for Continuum Financial Services.
Return the complete Record of Advice as plain text only. Preserve logical structure and section headings.`;

async function fixRecommendationText(roaText) {
  return callAnthropic({
    system: BASE_SYSTEM,
    maxTokens: 4000,
    messages: [
      {
        role: "user",
        content: `Improve the recommendation section of this Record of Advice.
Make it more professional, clear, and compliant.
Do not change other sections.

Current Record of Advice:
${roaText}`,
      },
    ],
  });
}

async function fixComplianceText(roaText) {
  return callAnthropic({
    system: BASE_SYSTEM,
    maxTokens: 4000,
    messages: [
      {
        role: "user",
        content: `Review this Record of Advice for compliance.
Fix missing information and strengthen compliance language.
Do not remove existing content.

Current Record of Advice:
${roaText}`,
      },
    ],
  });
}

module.exports = { fixRecommendationText, fixComplianceText };
