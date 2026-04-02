import { useMemo, useRef, useState } from "react";
import { extractData, generateRoa, requestFixCompliance, requestFixRecommendation, reviewForm, voiceUpdate } from "./services/api";
import { callAI } from "./utils/callAI";
import { generatePDF } from "./utils/roaPdf";
import ROAPreview from "./components/ROAPreview";
import ClientDetailsForm from "./components/ClientDetailsForm";
import NeedsForm from "./components/NeedsForm";
import InvestmentForm from "./components/InvestmentForm";
import RecommendationForm from "./components/RecommendationForm";

const DRAFT_STORAGE_KEY = "roaDrafts";

const initialFormData = {
  clientDetails: { name: "", idNumber: "", contact: "", email: "", advisorName: "Denzil Appadu", meetingDate: "", adviceDate: "" },
  financials: { income: "", expenses: "" },
  disclosures: { conflictDisclosed: "", feesDisclosed: "", complaintsProcessDisclosed: "", popiaConsent: "" },
  fica: { verified: "", sourceOfFunds: "", supportingDocuments: [] },
  needs: {
    scopeOfAdvice: [],
    clientFinancialNeeds: "",
    insuranceNeeds: "",
    replacementAdvice: "",
    productsConsidered: "",
  },
  investment: { objective: "", horizon: "", riskAppetite: "", monthlyContribution: "", lumpSum: "" },
  insurance: { lifeCover: "", disabilityCover: "", criticalIllness: "", incomeProtection: "" },
  recommendation: { adviceSummary: "", productRecommendation: "", suitabilityJustification: "", alternatives: "" },
  costs: { initialFee: "", ongoingFee: "", premium: "", feeNotes: "" },
  acceptance: { decision: "", clientSignature: "", advisorSignature: "", acceptanceDate: "" },
};

function setNestedValue(object, path, value) {
  const [root, key] = path.split(".");
  return { ...object, [root]: { ...object[root], [key]: value } };
}

function buildWarnings(formData) {
  const warnings = [];
  if (!formData.financials.income.trim()) warnings.push("Missing income.");
  if (!formData.investment.riskAppetite.trim()) warnings.push("Missing risk profile.");
  if (!formData.investment.horizon.trim()) warnings.push("Missing investment horizon.");
  return warnings;
}

function validate(formData) {
  const required = [
    "clientDetails.name",
    "clientDetails.idNumber",
    "clientDetails.contact",
    "investment.objective",
    "investment.horizon",
    "investment.riskAppetite",
    "recommendation.adviceSummary",
    "acceptance.decision",
  ];
  return required.filter((field) => {
    const [root, key] = field.split(".");
    return !String(formData[root][key] || "").trim();
  });
}

function checkMissingFields(formData) {
  const issues = [];
  if (!formData.clientDetails.name.trim()) issues.push("Client name is missing.");
  if (!formData.clientDetails.contact.trim()) issues.push("Contact details are missing.");
  if (!formData.financials.income.trim()) issues.push("Income is missing. Affordability risk.");
  if (!formData.investment.riskAppetite.trim()) issues.push("Risk profile is missing.");
  if (!formData.investment.horizon.trim()) issues.push("Investment horizon is missing.");
  return issues;
}

function speak(text) {
  if (!("speechSynthesis" in window)) return;
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "en-ZA";
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(utterance);
}

function deepMergeForm(base, patch) {
  if (!patch || typeof patch !== "object") return base;
  const out = { ...base };
  for (const key of Object.keys(patch)) {
    const pv = patch[key];
    if (pv === undefined) continue;
    const bv = base[key];
    if (
      pv !== null &&
      typeof pv === "object" &&
      !Array.isArray(pv) &&
      bv !== null &&
      typeof bv === "object" &&
      !Array.isArray(bv)
    ) {
      out[key] = deepMergeForm(bv, pv);
    } else {
      out[key] = pv;
    }
  }
  return out;
}

export default function App() {
  const [transcript, setTranscript] = useState("");
  const [formData, setFormData] = useState(initialFormData);
  const [roaOutput, setRoaOutput] = useState("");
  const [error, setError] = useState("");
  const [isBusy, setIsBusy] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [isReviewing, setIsReviewing] = useState(false);
  const [isListeningVoice, setIsListeningVoice] = useState(false);
  const [isVoiceUpdating, setIsVoiceUpdating] = useState(false);
  const [voicePreview, setVoicePreview] = useState("");
  const voiceRecognitionRef = useRef(null);
  const voiceTranscriptRef = useRef("");
  const [requiredMissing, setRequiredMissing] = useState([]);
  const [draftName, setDraftName] = useState("");
  const [selectedDraft, setSelectedDraft] = useState("");
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [roaSuccessFlash, setRoaSuccessFlash] = useState(false);
  const [copyFeedback, setCopyFeedback] = useState(false);

  const warnings = useMemo(() => buildWarnings(formData), [formData]);
  const handleCheckFormAi = async () => {
    const issues = checkMissingFields(formData);
    const missingPaths = [];
    if (!formData.clientDetails.name.trim()) missingPaths.push("clientDetails.name");
    if (!formData.clientDetails.contact.trim()) missingPaths.push("clientDetails.contact");
    if (!formData.financials.income.trim()) missingPaths.push("financials.income");
    if (!formData.investment.riskAppetite.trim()) missingPaths.push("investment.riskAppetite");
    if (!formData.investment.horizon.trim()) missingPaths.push("investment.horizon");
    setRequiredMissing((prev) => Array.from(new Set([...prev, ...missingPaths])));

    if (!issues.length) {
      speak("Form is complete");
    } else {
      speak(issues.join(" "));
    }

    setIsReviewing(true);
    try {
      const response = await reviewForm(formData);
      console.log("[Check Form AI] review response:", response);
      if (response?.review) {
        speak(response.review);
      }
    } catch (requestError) {
      console.error("[Check Form AI] failed:", requestError);
      alert("AI review failed. Please try again.");
    } finally {
      setIsReviewing(false);
    }
  };


  const updateField = (path, value) => setFormData((prev) => setNestedValue(prev, path, value));

  const toggleArrayValue = (path, value) => {
    setFormData((prev) => {
      const [root, key] = path.split(".");
      const current = prev[root][key] || [];
      const exists = current.includes(value);
      const next = exists ? current.filter((item) => item !== value) : [...current, value];
      return { ...prev, [root]: { ...prev[root], [key]: next } };
    });
  };

  const handleFillFromTranscript = async () => {
    if (!transcript.trim()) {
      setError("Transcript is required to autofill.");
      return;
    }
    setIsExtracting(true);
    setError("");
    try {
      console.log("[Fill Form] Sending transcript to http://localhost:3001/extract");
      const extracted = await extractData(transcript);
      console.log("[Fill Form] Received extract response:", extracted);
      setFormData((prev) => ({
        ...prev,
        clientDetails: {
          ...prev.clientDetails,
          ...extracted.clientDetails,
        },
        financials: {
          ...prev.financials,
          ...extracted.financials,
        },
        needs: {
          ...prev.needs,
          ...extracted.needs,
        },
        investment: {
          ...prev.investment,
          objective: extracted?.needs?.goal || prev.investment.objective,
          riskAppetite: extracted?.needs?.riskProfile || prev.investment.riskAppetite,
        },
        costs: {
          ...prev.costs,
          premium: extracted?.financials?.income || prev.costs.premium,
          feeNotes: extracted?.financials?.expenses || prev.costs.feeNotes,
        },
      }));
    } catch (requestError) {
      console.error("[Fill Form] Extract failed:", requestError);
      alert("Failed to extract structured data.");
      setError(requestError.message || "Failed to extract structured data.");
    } finally {
      setIsExtracting(false);
    }
  };

  const applyVoiceUpdates = async (spokenText) => {
    const text = spokenText.trim();
    if (!text) {
      setError("No speech captured. Try again.");
      return;
    }
    setIsVoiceUpdating(true);
    setError("");
    try {
      console.log("[Voice Update] Applying spoken text, length:", text.length);
      const patch = await voiceUpdate(text, formData);
      setFormData((prev) => deepMergeForm(prev, patch));
      setTranscript((t) => (t ? `${t}\n\n[Voice]: ${text}` : `[Voice]: ${text}`));
    } catch (requestError) {
      console.error("[Voice Update] failed:", requestError);
      setError(requestError.message || "Voice update failed.");
    } finally {
      setIsVoiceUpdating(false);
    }
  };

  const handleSpeakToFillForm = async () => {
    if (isVoiceUpdating || isExtracting) return;
    const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognitionAPI) {
      setError("Speech recognition is not supported in this browser.");
      return;
    }

    if (isListeningVoice) {
      const spoken = voiceTranscriptRef.current;
      if (voiceRecognitionRef.current) {
        try {
          voiceRecognitionRef.current.stop();
        } catch (_) {
          /* ignore */
        }
        voiceRecognitionRef.current = null;
      }
      setIsListeningVoice(false);
      setVoicePreview("");
      voiceTranscriptRef.current = "";
      await applyVoiceUpdates(spoken);
      return;
    }

    voiceTranscriptRef.current = "";
    setVoicePreview("");

    const recognition = new SpeechRecognitionAPI();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-ZA";

    recognition.onresult = (event) => {
      let fullTranscript = "";
      for (let i = 0; i < event.results.length; i += 1) {
        fullTranscript += `${event.results[i][0].transcript} `;
      }
      const trimmed = fullTranscript.trim();
      voiceTranscriptRef.current = trimmed;
      setVoicePreview(trimmed);
    };

    recognition.onerror = () => {
      setIsListeningVoice(false);
      voiceRecognitionRef.current = null;
      setError("Speech recognition error. Check microphone and try again.");
    };

    recognition.onend = () => {
      setIsListeningVoice(false);
      voiceRecognitionRef.current = null;
    };

    try {
      recognition.start();
      voiceRecognitionRef.current = recognition;
      setIsListeningVoice(true);
      setError("");
    } catch (_) {
      setError("Could not start microphone.");
    }
  };

  const handleGenerateFromForm = async () => {
    const missing = validate(formData);
    setRequiredMissing(missing);
    if (missing.length) {
      setError("Complete required fields before generating ROA.");
      return;
    }
    setIsBusy(true);
    setError("");
    setRoaSuccessFlash(false);
    try {
      const result = await generateRoa(formData);
      setRoaOutput(result.roaText || "");
      setRoaSuccessFlash(true);
    } catch (requestError) {
      setError(requestError.message || "Failed to generate ROA from form.");
    } finally {
      setIsBusy(false);
    }
  };

  const fixRecommendation = async () => {
    if (!roaOutput?.trim()) return;

    setIsProcessing(true);
    setError("");
    setRoaSuccessFlash(false);
    try {
      let improved;
      try {
        improved = await callAI(
          `Improve ONLY the recommendation section of this Record of Advice.
Make it more professional, compliant, and detailed.

${roaOutput}`
        );
      } catch (err) {
        if (err.code === "NO_BROWSER_KEY" || err.message === "NO_BROWSER_KEY") {
          const result = await requestFixRecommendation(roaOutput);
          improved = result.roaText || "";
        } else {
          throw err;
        }
      }
      setRoaOutput(improved);
    } catch (requestError) {
      alert(requestError.message || "Failed to fix recommendation.");
    } finally {
      setIsProcessing(false);
    }
  };

  const fixCompliance = async () => {
    if (!roaOutput?.trim()) return;

    setIsProcessing(true);
    setError("");
    setRoaSuccessFlash(false);
    try {
      let improved;
      try {
        improved = await callAI(
          `Review this Record of Advice for compliance.
Fix missing information and strengthen compliance wording.

${roaOutput}`
        );
      } catch (err) {
        if (err.code === "NO_BROWSER_KEY" || err.message === "NO_BROWSER_KEY") {
          const result = await requestFixCompliance(roaOutput);
          improved = result.roaText || "";
        } else {
          throw err;
        }
      }
      setRoaOutput(improved);
    } catch (requestError) {
      alert(requestError.message || "Failed to fix compliance.");
    } finally {
      setIsProcessing(false);
    }
  };

  const saveDraft = () => {
    const name = draftName.trim();
    if (!name) {
      setError("Enter a draft/client name before saving.");
      return;
    }
    const current = JSON.parse(localStorage.getItem(DRAFT_STORAGE_KEY) || "{}");
    current[name] = formData;
    localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(current));
    setError("");
  };

  const loadDraft = () => {
    const current = JSON.parse(localStorage.getItem(DRAFT_STORAGE_KEY) || "{}");
    if (!selectedDraft || !current[selectedDraft]) {
      setError("Select a saved client draft.");
      return;
    }
    setFormData(current[selectedDraft]);
    setError("");
  };

  const draftNames = Object.keys(JSON.parse(localStorage.getItem(DRAFT_STORAGE_KEY) || "{}"));

  const handleCopyRoaText = async () => {
    if (!roaOutput.trim()) return;
    try {
      await navigator.clipboard.writeText(roaOutput);
      setCopyFeedback(true);
      window.setTimeout(() => setCopyFeedback(false), 2200);
    } catch {
      setError("Could not copy to clipboard.");
    }
  };

  const downloadPdfFromForm = () => {
    setIsExportingPdf(true);
    setError("");
    setTimeout(() => {
      console.log("Exporting PDF...");
      console.log(document.getElementById("roa-content"));
      generatePDF()
        .catch((err) => {
          console.error(err);
          setError(err?.message || "PDF export failed.");
        })
        .finally(() => setIsExportingPdf(false));
    }, 500);
  };

  return (
    <div className="app-shell">
      <header className="app-header" role="banner">
        <div className="app-header-brand">
          <div className="app-header-title">CONTINUUM FINANCIAL SERVICES</div>
          <div className="app-header-fsp">Authorised Financial Services Provider (FSP 46947)</div>
          <p className="app-header-tagline">Built for financial advisors • Fast • Compliant • Professional</p>
        </div>
      </header>
      {roaSuccessFlash && (
        <div className="success-banner" role="status">
          ✅ Record of Advice generated successfully
        </div>
      )}
      {error && <div className="error-banner">{error}</div>}
      {!!warnings.length && (
        <div className="warning-panel panel">
          <h3>Missing Data Warnings</h3>
          <ul>{warnings.map((warning) => <li key={warning}>{warning}</li>)}</ul>
        </div>
      )}
      {!!requiredMissing.length && (
        <div className="error-banner">
          Required fields: {requiredMissing.join(", ")}
        </div>
      )}

      <div className="panel">
        <h3>Client meeting notes</h3>
        <textarea
          className="textarea"
          value={transcript}
          onChange={(event) => setTranscript(event.target.value)}
          placeholder="Start by recording your client meeting, then generate a professional Record of Advice."
        />
        <div className="row wrap-row">
          <button className="button" disabled={isExtracting || isBusy || isVoiceUpdating} onClick={handleFillFromTranscript}>
            {isExtracting ? "Extracting..." : "Fill form from transcript"}
          </button>
          <button
            className="button"
            type="button"
            disabled={isVoiceUpdating || isExtracting}
            onClick={() => handleSpeakToFillForm()}
          >
            {isVoiceUpdating ? "Updating form..." : isListeningVoice ? "Listening… (tap again to apply)" : "🎙 Record"}
          </button>
          <button className="button secondary" disabled={isReviewing || isBusy || isExtracting || isVoiceUpdating} onClick={handleCheckFormAi}>
            {isReviewing ? "Analysing…" : "Check form (AI)"}
          </button>
        </div>
        {(isListeningVoice || voicePreview) && (
          <div className="voice-preview">
            <strong>{isListeningVoice ? "Listening... " : ""}</strong>
            {voicePreview || "(speak now)"}
          </div>
        )}
      </div>

      <ClientDetailsForm
        formData={formData}
        updateField={updateField}
        toggleArrayValue={toggleArrayValue}
        requiredMissing={requiredMissing}
      />
      <NeedsForm formData={formData} updateField={updateField} toggleArrayValue={toggleArrayValue} requiredMissing={requiredMissing} />
      <InvestmentForm formData={formData} updateField={updateField} requiredMissing={requiredMissing} />
      <RecommendationForm formData={formData} updateField={updateField} requiredMissing={requiredMissing} />

      <div className="panel">
        <h3>Draft Management</h3>
        <div className="row">
          <input
            className="input"
            value={draftName}
            onChange={(event) => setDraftName(event.target.value)}
            placeholder="Draft / Client Name"
          />
          <button className="button secondary" onClick={saveDraft}>Save Draft</button>
        </div>
        <div className="row">
          <select className="input" value={selectedDraft} onChange={(event) => setSelectedDraft(event.target.value)}>
            <option value="">Select saved client</option>
            {draftNames.map((name) => <option key={name} value={name}>{name}</option>)}
          </select>
          <button className="button secondary" onClick={loadDraft}>Load Client</button>
        </div>
      </div>

      <div className="panel roa-output-panel">
        <h3>Record of Advice — preview</h3>
        <p className="roa-output-hint">
          Workflow: <strong>Record</strong> (notes / voice) → <strong>Complete the form</strong> → <strong>Create Record of Advice</strong> →
          review → <strong>Download PDF</strong>.
        </p>
        <div className="row wrap-row roa-actions-row">
          <button
            className="button success"
            disabled={isBusy || isProcessing}
            onClick={handleGenerateFromForm}
          >
            {isBusy ? "Creating…" : "⚡ Create Record of Advice"}
          </button>
          <button
            className="button button-download-primary"
            type="button"
            disabled={isExportingPdf || isProcessing}
            onClick={() => downloadPdfFromForm()}
          >
            {isExportingPdf ? "Preparing…" : "📄 Download PDF"}
          </button>
          <button
            className="button button-copy-muted"
            type="button"
            disabled={!roaOutput.trim() || isProcessing}
            onClick={handleCopyRoaText}
          >
            {copyFeedback ? "Copied" : "📋 Copy"}
          </button>
        </div>
        <p className="roa-output-hint">
          The preview shows a structured document only. Use <strong>Improve Recommendation</strong> or <strong>Fix Compliance</strong> below to
          update the ROA text with AI.
        </p>
        <div className="roa-fix-toolbar">
          <button
            type="button"
            className="btn-improve-recommendation"
            disabled={isProcessing || !roaOutput.trim()}
            onClick={fixRecommendation}
          >
            {isProcessing ? "Processing…" : "🔧 Improve Recommendation"}
          </button>
          <button
            type="button"
            className="btn-fix-compliance"
            disabled={isProcessing || !roaOutput.trim()}
            onClick={fixCompliance}
          >
            {isProcessing ? "Processing…" : "⚠ Fix Compliance"}
          </button>
        </div>
        <div id="roa-content" className="roa-content-root">
          <ROAPreview formData={formData} roaOutput={roaOutput} />
        </div>
      </div>
    </div>
  );
}
