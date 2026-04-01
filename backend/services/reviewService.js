/* eslint-env node */
const { callAnthropic } = require("./aiService");

const REVIEW_PROMPT =
  "Review this financial advice form. Identify missing data, compliance risks, and weak areas. Respond in short, clear sentences suitable for voice output.";

async function reviewFormData(formData) {
  return callAnthropic({
    system: REVIEW_PROMPT,
    maxTokens: 1000,
    messages: [{ role: "user", content: JSON.stringify(formData, null, 2) }],
  });
}

module.exports = { reviewFormData };
