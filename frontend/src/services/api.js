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

/**
 * Transcript → structured fields for "Fill form from transcript".
 * Production (Vercel): POST /api/voice → { success, data }.
 * Development: POST /extract on local Express (same shape without wrapper).
 */
export async function extractData(transcript) {
  const base = import.meta.env.VITE_API_BASE_URL
    ? String(import.meta.env.VITE_API_BASE_URL).replace(/\/$/, "")
    : "http://localhost:3001";

  const url = import.meta.env.PROD ? "/api/voice" : `${base}/extract`;

  console.log("[extractData] POST", url);

  let response;
  try {
    response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ transcript }),
    });
  } catch (networkErr) {
    console.error("[extractData] Network error:", networkErr);
    throw new Error("Could not reach the transcript service.");
  }

  const rawText = await response.text();
  let payload;
  try {
    payload = rawText ? JSON.parse(rawText) : {};
  } catch (parseErr) {
    console.error("[extractData] Non-JSON body (first 300 chars):", rawText?.slice(0, 300));
    throw new Error("Transcript service returned an invalid response.");
  }

  if (!response.ok) {
    console.error("[extractData] HTTP", response.status, payload);
    throw new Error(payload?.error || payload?.detail || `Extract failed (${response.status}).`);
  }

  if (payload.success === true && payload.data && typeof payload.data === "object") {
    const d = payload.data;
    console.log("[extractData] Vercel OK, keys:", Object.keys(d).join(", "));
    return {
      clientDetails: d.clientDetails,
      financials: d.financials,
      needs: d.needs,
    };
  }

  if (payload.success === false) {
    throw new Error(payload.error || "Extract failed.");
  }

  if (payload.clientDetails && payload.financials && payload.needs) {
    console.log("[extractData] Legacy Express shape OK");
    return payload;
  }

  console.error("[extractData] Unexpected payload:", payload);
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

  let data;
  try {
    const text = await response.text();
    data = text ? JSON.parse(text) : {};
  } catch (parseErr) {
    console.error("[voiceUpdate] Invalid JSON body:", parseErr);
    throw new Error("Voice update returned an invalid response.");
  }

  if (!response.ok) {
    console.error("[voiceUpdate] HTTP", response.status, data);
    throw new Error(data?.error || data?.message || `Voice update failed (${response.status}).`);
  }

  // Vercel API shape: { success, message, updates }
  if (data && typeof data.success === "boolean") {
    if (!data.success) {
      console.error("[voiceUpdate] success=false", data);
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
