const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3001";

async function request(path, body) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data?.detail || data?.error || "Request failed.");
  }
  return data;
}

const MISSING = {
  clientDetails: { name: "MISSING", idNumber: "MISSING", contact: "MISSING", email: "MISSING" },
  financials: { income: "MISSING", expenses: "MISSING" },
  needs: { goal: "MISSING", riskProfile: "MISSING" },
};

/**
 * Transcript → structured fields for "Fill form from transcript".
 * Uses Vercel serverless POST /api/voice only (no Express server.js in production).
 * Local dev: run `vercel dev` (API on :3000) and Vite proxies /api → see vite.config.js.
 */
export async function extractData(transcript) {
  let res;
  try {
    res = await fetch("/api/voice", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ transcript }),
    });
  } catch (networkErr) {
    console.error("API ERROR: network", networkErr);
    throw new Error("Could not reach /api/voice. Is the Vercel function deployed?");
  }

  let data;
  try {
    const text = await res.text();
    data = text ? JSON.parse(text) : {};
  } catch (parseErr) {
    console.error("API ERROR: invalid JSON from /api/voice", parseErr);
    throw new Error("Transcript service returned an invalid response.");
  }

  if (data.success === false) {
    console.error("API ERROR:", data?.error || data);
    throw new Error(data?.error || "Transcript request failed.");
  }

  // Legacy Express /extract (no success flag): top-level clientDetails / financials / needs
  if (data.clientDetails && data.financials && data.needs && data.success === undefined) {
    console.log("[extractData] legacy Express shape");
    return {
      clientDetails: data.clientDetails,
      financials: data.financials,
      needs: data.needs,
    };
  }

  if (data.success !== true) {
    console.error("API ERROR: unexpected success flag", data);
    throw new Error(data?.error || "Transcript request failed.");
  }

  const inner = data.data;
  if (!inner || typeof inner !== "object") {
    console.error("API ERROR: missing data object", data);
    throw new Error("Invalid response: missing data.");
  }

  if (inner.extracted === "Test successful" && !inner.clientDetails) {
    console.log("[extractData] test payload OK, transcript length:", inner.transcript?.length ?? 0);
    return { ...MISSING };
  }

  if (inner.clientDetails && inner.financials && inner.needs) {
    return {
      clientDetails: inner.clientDetails,
      financials: inner.financials,
      needs: inner.needs,
    };
  }

  console.error("API ERROR: unexpected shape", data);
  throw new Error("Unexpected response from transcript service.");
}

export function generateRoa(structuredData, refinementHint) {
  return request("/generate-roa", { structuredData, refinementHint });
}

export function complianceCheck(roaText) {
  return request("/compliance-check", { roaText });
}

/** AI: improve recommendation section only (full ROA text in/out). */
export function requestFixRecommendation(roaText) {
  return request("/fix-recommendation", { roaText });
}

/** AI: compliance pass over full ROA text (full ROA text in/out). */
export function requestFixCompliance(roaText) {
  return request("/fix-compliance", { roaText });
}

export function sendChat(messages) {
  return request("/chat", { messages });
}

export function reviewForm(formData) {
  return request("/review-form", { formData });
}

/**
 * Voice → form patch. Production: same-origin /api/update (Vercel serverless).
 * Dev: VITE_VOICE_UPDATE_URL, or VITE_API_BASE_URL/voice-update, else localhost:3001/voice-update.
 */
export async function voiceUpdate(transcript, formData) {
  const base = import.meta.env.VITE_API_BASE_URL
    ? String(import.meta.env.VITE_API_BASE_URL).replace(/\/$/, "")
    : "http://localhost:3001";

  const url =
    import.meta.env.VITE_VOICE_UPDATE_URL ||
    (import.meta.env.PROD ? "/api/update" : `${base}/voice-update`);

  console.log("[voiceUpdate] POST", url);

  let response;
  try {
    response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ transcript, formData }),
    });
  } catch (networkErr) {
    console.error("[voiceUpdate] Network error:", networkErr);
    throw new Error("Could not reach the voice update service. Check your connection.");
  }

  const text = await response.text();
  const trimmed = text.trim();
  let data;
  try {
    data = trimmed ? JSON.parse(trimmed) : {};
  } catch (parseErr) {
    const ct = response.headers.get("content-type") || "";
    const preview = trimmed.replace(/\s+/g, " ").slice(0, 200);
    console.error("API ERROR: invalid JSON from voice update", {
      status: response.status,
      contentType: ct,
      preview,
      hint:
        "Production often means /api/update was not deployed (check Vercel Root Directory: repo root uses /api, \"frontend\" uses frontend/api) or the edge returned HTML (404/504).",
      parseErr,
    });
    throw new Error(
      `Voice update returned a non-JSON response (HTTP ${response.status}). ` +
        (preview ? `Body starts with: ${preview}` : "Empty body.")
    );
  }

  if (!response.ok) {
    console.error("API ERROR: voice update HTTP", response.status, data);
    throw new Error(data?.error || data?.message || `Voice update failed (${response.status}).`);
  }

  // Vercel API shape: { success, message, updates }
  if (data && typeof data.success === "boolean") {
    if (!data.success) {
      console.error("API ERROR: voice update success=false", data);
      throw new Error(data?.error || data?.message || "Voice update was not successful.");
    }
    const patch = data.updates && typeof data.updates === "object" && !Array.isArray(data.updates) ? data.updates : {};
    console.log("[voiceUpdate] OK:", data.message || "ok", "patch keys:", Object.keys(patch).join(", ") || "(none)");
    return patch;
  }

  // Legacy Express: body is the patch object directly
  if (data?.error) {
    throw new Error(data.error);
  }
  console.log("[voiceUpdate] Legacy patch keys:", Object.keys(data || {}).join(", ") || "(none)");
  return data;
}
