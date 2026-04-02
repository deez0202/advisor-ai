/**
 * Vercel Serverless — POST /api/voice
 * Transcript → structured extract (same behaviour as legacy Express /extract).
 *
 * Body: { transcript: string }
 * Success: { success: true, data: { clientDetails, financials, needs } }
 * Error:   { success: false, error: "message" }
 *
 * Env: ANTHROPIC_API_KEY (required for real extraction)
 * Bonus: swap to OpenAI by adding OPENAI_API_KEY + branch on process.env.AI_PROVIDER
 */

const ANTHROPIC_URL = "https://api.anthropic.com/v1/messages";

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
  } catch {
    const match = rawText.match(/\{[\s\S]*\}/);
    if (!match) {
      throw new Error("Could not parse extraction response as JSON.");
    }
    return JSON.parse(match[0]);
  }
}

function normalizeExtracted(parsed) {
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

async function extractWithAnthropic(transcript) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY is not configured on the server.");
  }

  const model = process.env.ANTHROPIC_MODEL || "claude-sonnet-4-5";

  console.log("[api/voice] Calling Anthropic, transcript length:", transcript.length);

  const response = await fetch(ANTHROPIC_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model,
      max_tokens: 1800,
      system: EXTRACTION_SYSTEM_PROMPT,
      messages: [{ role: "user", content: `Transcript:\n${transcript}` }],
    }),
  });

  const raw = await response.json();
  if (!response.ok) {
    const msg = raw?.error?.message || raw?.error || "Anthropic request failed";
    console.error("[api/voice] Anthropic error:", response.status, msg);
    throw new Error(typeof msg === "string" ? msg : JSON.stringify(msg));
  }

  const text = raw?.content?.[0]?.text;
  if (!text) {
    throw new Error("Empty response from model.");
  }

  const parsed = parseJsonResponse(text);
  return normalizeExtracted(parsed);
}

function sendJson(res, status, obj) {
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.status(status).end(JSON.stringify(obj));
}

module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    return res.status(204).end();
  }

  if (req.method !== "POST") {
    return sendJson(res, 405, { success: false, error: "Method not allowed" });
  }

  try {
    const body = req.body || {};
    const transcript = body.transcript;

    if (!transcript || !String(transcript).trim()) {
      console.warn("[api/voice] Missing transcript");
      return sendJson(res, 400, { success: false, error: "transcript is required" });
    }

    const data = await extractWithAnthropic(String(transcript).trim());
    console.log("[api/voice] Success, client name:", data.clientDetails?.name || "(none)");

    return sendJson(res, 200, { success: true, data });
  } catch (err) {
    console.error("[api/voice] Error:", err?.message || err);
    return sendJson(res, 500, {
      success: false,
      error: err?.message || "Failed to process transcript",
    });
  }
};
