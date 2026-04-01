/* eslint-env node */
const { callAnthropic } = require("./aiService");

const EXTRACTION_SYSTEM_PROMPT = `You are a financial data extraction engine.
Extract only information present in the transcript.
Return ONLY valid JSON. No explanation.
Use this exact schema:
{
  "clientDetails": {
    "name": "",
    "idNumber": "",
    "contact": "",
    "email": ""
  },
  "financials": {
    "income": "",
    "expenses": ""
  },
  "needs": {
    "goal": "",
    "riskProfile": ""
  }
}
For unknown values use "MISSING".`;

function parseJsonResponse(rawText) {
  try {
    return JSON.parse(rawText);
  } catch (_) {
    const match = rawText.match(/\{[\s\S]*\}/);
    if (!match) {
      throw new Error("Could not parse extraction response as JSON.");
    }
    return JSON.parse(match[0]);
  }
}

async function extractStructuredData(transcript) {
  const extractedText = await callAnthropic({
    system: EXTRACTION_SYSTEM_PROMPT,
    maxTokens: 1800,
    messages: [
      {
        role: "user",
        content: `Transcript:\n${transcript}`,
      },
    ],
  });

  const parsed = parseJsonResponse(extractedText);
  return {
    clientDetails: {
      name: parsed?.clientDetails?.name || "MISSING",
      idNumber: parsed?.clientDetails?.idNumber || "MISSING",
      contact: parsed?.clientDetails?.contact || "MISSING",
      email: parsed?.clientDetails?.email || "MISSING",
    },
    financials: {
      income: parsed?.financials?.income || "MISSING",
      expenses: parsed?.financials?.expenses || "MISSING",
    },
    needs: {
      goal: parsed?.needs?.goal || "MISSING",
      riskProfile: parsed?.needs?.riskProfile || "MISSING",
    },
  };
}

module.exports = { extractStructuredData };
