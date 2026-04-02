/**
 * Vercel Serverless — POST /api/voice
 * "Fill form from transcript" — always returns valid JSON (never HTML).
 */

function sendJson(res, status, obj) {
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.status(status).end(JSON.stringify(obj));
}

function parseBody(req) {
  if (req.body && typeof req.body === "object") {
    return req.body;
  }
  return {};
}

module.exports = async (req, res) => {
  console.log("[api/voice] method:", req.method);

  if (req.method === "OPTIONS") {
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    return res.status(204).end();
  }

  if (req.method !== "POST") {
    console.warn("[api/voice] Method not allowed:", req.method);
    return sendJson(res, 405, { success: false, error: "Method not allowed" });
  }

  try {
    const body = parseBody(req);
    console.log("Incoming request:", body);

    const transcript = body.transcript;
    if (transcript === undefined || transcript === null || !String(transcript).trim()) {
      console.warn("[api/voice] Missing transcript");
      return sendJson(res, 400, { success: false, error: "No transcript provided" });
    }

    const t = String(transcript).trim();

    // Test / stub response — swap for real extraction (Anthropic/OpenAI) later
    return sendJson(res, 200, {
      success: true,
      data: {
        extracted: "Test successful",
        transcript: t,
      },
    });
  } catch (err) {
    console.error("[api/voice] Unhandled:", err);
    return sendJson(res, 500, {
      success: false,
      error: err?.message || "Internal error",
    });
  }
};
