/**
 * Vercel Serverless Function — POST /api/update
 * Voice-driven form patches. Returns { success, message, updates }.
 * Every response is JSON (same pattern as /api/voice) so the client never gets HTML.
 *
 * Env (optional):
 *   ANTHROPIC_API_KEY — if set, calls Anthropic to produce JSON patch from transcript + formData.
 */

const ANTHROPIC_URL = "https://api.anthropic.com/v1/messages";

const VOICE_UPDATE_SYSTEM = `You update a financial advice form from spoken instructions.

Rules:
- Return ONLY valid JSON. No markdown, no explanation.
- Include ONLY keys/fields the user asked to change. Omit unchanged sections entirely.
- Nested objects should contain only the fields being updated.

Output shape (only include keys you are updating):
{
  "clientDetails": {},
  "financials": {},
  "needs": {},
  "investment": {},
  "insurance": {},
  "recommendation": {},
  "costs": {},
  "acceptance": {},
  "disclosures": {},
  "fica": {}
}`;

function sendJson(res, status, obj) {
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.status(status).end(JSON.stringify(obj));
}

function parseBody(req) {
  const b = req.body;
  if (b == null) return {};
  if (typeof b === "string") {
    try {
      const parsed = JSON.parse(b);
      return typeof parsed === "object" && parsed !== null && !Array.isArray(parsed) ? parsed : {};
    } catch {
      return {};
    }
  }
  if (typeof b === "object" && !Array.isArray(b)) return b;
  return {};
}

function parseJsonPatch(text) {
  if (!text || typeof text !== "string") return {};
  const cleaned = text.replace(/```json/gi, "").replace(/```/g, "").trim();
  try {
    const parsed = JSON.parse(cleaned);
    return typeof parsed === "object" && parsed !== null && !Array.isArray(parsed) ? parsed : {};
  } catch {
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (!match) return {};
    try {
      const parsed = JSON.parse(match[0]);
      return typeof parsed === "object" && parsed !== null && !Array.isArray(parsed) ? parsed : {};
    } catch {
      return {};
    }
  }
}

async function anthropicVoicePatch(transcript, formData) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return {};

  const model = process.env.ANTHROPIC_MODEL || "claude-sonnet-4-5";
  const userContent = `Update this financial advice form based on the user instruction.

Current form:
${JSON.stringify(formData, null, 2)}

Instruction:
${transcript}

Return ONLY updated JSON partial object for changed sections. No explanation.`;

  const response = await fetch(ANTHROPIC_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model,
      max_tokens: 4000,
      system: VOICE_UPDATE_SYSTEM,
      messages: [{ role: "user", content: userContent }],
    }),
  });

  const data = await response.json();
  if (!response.ok) {
    const msg = data?.error?.message || data?.error || "Anthropic request failed";
    throw new Error(typeof msg === "string" ? msg : JSON.stringify(msg));
  }

  const raw = data?.content?.[0]?.text;
  return parseJsonPatch(raw);
}

async function handler(req, res) {
  console.log("[api/update] method:", req.method);

  if (req.method === "OPTIONS") {
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    return res.status(204).end();
  }

  if (req.method !== "POST") {
    return sendJson(res, 405, { success: false, error: "Method not allowed" });
  }

  try {
    const body = parseBody(req);
    const { transcript, formData } = body;

    if (!transcript || !String(transcript).trim()) {
      return sendJson(res, 400, {
        success: false,
        error: "transcript is required",
        message: "Missing transcript",
      });
    }

    if (!formData || typeof formData !== "object" || Array.isArray(formData)) {
      return sendJson(res, 400, {
        success: false,
        error: "formData is required",
        message: "Missing form data",
      });
    }

    let updates = {};

    try {
      updates = await anthropicVoicePatch(String(transcript).trim(), formData);
    } catch (aiErr) {
      console.error("[api/update] Anthropic pass failed (non-fatal):", aiErr?.message || aiErr);
    }

    console.log("[api/update] OK, keys in updates:", Object.keys(updates).join(", ") || "(none)");

    return sendJson(res, 200, {
      success: true,
      message: "Form updated successfully",
      updates,
    });
  } catch (err) {
    console.error("[api/update] Unhandled error:", err);
    return sendJson(res, 500, {
      success: false,
      error: err?.message || "Server error",
      message: "Voice update could not be completed",
    });
  }
}

/** @see https://vercel.com/docs/functions/configuring-functions/duration */
export const config = { maxDuration: 60 };

/** ESM default export: frontend/package.json has "type": "module". */
export default handler;
