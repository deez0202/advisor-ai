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

export function extractData(transcript) {
  return request("/extract", { transcript });
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

export function voiceUpdate(transcript, formData) {
  return fetch("http://localhost:3001/voice-update", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ transcript, formData }),
  }).then(async (response) => {
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data?.error || "Voice update request failed.");
    }
    return data;
  });
}
