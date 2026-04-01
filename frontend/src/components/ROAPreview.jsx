/* eslint-disable react/prop-types */
import { useMemo } from "react";
import { BRANDING } from "../constants/branding";
import logo from "../assets/cfs-logo.png";
import CheckboxRow from "./CheckboxRow";

/**
 * Split AI ROA text into titled sections using ## headings or standalone ALL CAPS lines.
 */
export function parseRoaOutputIntoSections(text) {
  if (!text?.trim()) return [];
  const lines = text.replace(/\r\n/g, "\n").split("\n");
  const sections = [];
  let currentTitle = "Overview";
  let buffer = [];

  const isHeadingLine = (raw) => {
    const t = raw.trim();
    if (!t) return false;
    if (/^##\s+/.test(t)) return true;
    if (t.length < 4 || t.length > 90) return false;
    if (t !== t.toUpperCase()) return false;
    if (!/^[A-Z0-9 &/,.:\-]+$/.test(t)) return false;
    const words = t.split(/\s+/).filter(Boolean);
    if (words.length === 1 && t.length < 14) return false;
    return true;
  };

  const flush = () => {
    const body = buffer.join("\n").trim();
    buffer = [];
    if (!body) return;
    sections.push({ title: currentTitle, body });
  };

  for (const line of lines) {
    if (isHeadingLine(line)) {
      flush();
      currentTitle = line.trim().replace(/^##\s+/, "").trim();
      continue;
    }
    buffer.push(line);
  }
  flush();

  return sections;
}

function Section({ title, children }) {
  return (
    <section className="roa-section">
      <h2 className="roa-section-title">{title}</h2>
      <div className="roa-section-divider" />
      <div className="roa-section-body roa-text-column">{children}</div>
    </section>
  );
}

function Field({ label, value }) {
  const display = value === undefined || value === null || value === "" ? "—" : String(value);
  return (
    <div className="roa-field">
      <span className="roa-field-label">{label}</span>
      <span className="roa-field-value">{display}</span>
    </div>
  );
}

function toParagraphs(value) {
  const text = String(value || "").trim();
  if (!text) return ["—"];
  if (text.includes("\n")) return text.split("\n").map((part) => part.trim()).filter(Boolean);
  return text.split(/(?<=[.!?])\s+/).map((part) => part.trim()).filter(Boolean);
}

function ParsedNarrativeBlocks({ sections }) {
  if (!sections.length) return null;
  return (
    <div className="roa-parsed-narrative">
      <div className="roa-subtitle">Advisor narrative (structured)</div>
      {sections.map((sec) => (
        <div key={`${sec.title}-${sec.body.slice(0, 24)}`} className="roa-parsed-block">
          <h3 className="roa-parsed-heading">{sec.title}</h3>
          <div className="roa-prose roa-prose--tight">
            {toParagraphs(sec.body).map((paragraph, idx) => (
              <p key={`${sec.title}-${idx}`} className="roa-paragraph">
                {paragraph}
              </p>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function ROAPreview({ formData, roaOutput }) {
  const today = new Date().toLocaleDateString("en-ZA");
  const adviceDate = formData.clientDetails.adviceDate || today;
  const meetingDate = formData.clientDetails.meetingDate || "—";

  const narrativeSections = useMemo(() => parseRoaOutputIntoSections(roaOutput || ""), [roaOutput]);

  return (
    <div id="roa-preview-export" className="roa-document">
      <header className="roa-header">
        <div className="roa-header-top">
          <img className="roa-logo" src={logo} alt="Continuum Financial Services Logo" />
          <div className="roa-header-text">
            <div className="roa-company-name">{BRANDING.companyName}</div>
            <div className="roa-fsp">{BRANDING.fsp}</div>
            <div className="roa-contact">Phone: {BRANDING.phone}</div>
            <div className="roa-contact">Email: {BRANDING.email}</div>
          </div>
        </div>
        <div className="roa-header-rule" />
        <div className="roa-date-row">
          <p className="roa-advice-date">Date of Meeting: {meetingDate}</p>
          <p className="roa-advice-date">Date of Advice: {adviceDate}</p>
        </div>
        <div className="roa-doc-title">Record of Advice</div>
        <p className="roa-doc-sub">
          Prepared for: <strong>{formData.clientDetails.name || "Client"}</strong>
          {formData.clientDetails.adviceDate ? ` · Date: ${formData.clientDetails.adviceDate}` : ""}
        </p>
      </header>

      <Section title="CLIENT DETAILS">
        <div className="roa-field-grid">
          <Field label="Full name" value={formData.clientDetails.name} />
          <Field label="ID number" value={formData.clientDetails.idNumber} />
          <Field label="Contact" value={formData.clientDetails.contact} />
          <Field label="Email" value={formData.clientDetails.email} />
          <Field label="Advisor" value={formData.clientDetails.advisorName || BRANDING.advisorDefault} />
        </div>
      </Section>

      <Section title="DISCLOSURES">
        <CheckboxRow label="Conflict of interest disclosed" checked={formData.disclosures.conflictDisclosed === "yes"} />
        <CheckboxRow label="Fees and charges disclosed" checked={formData.disclosures.feesDisclosed === "yes"} />
        <CheckboxRow label="Complaints process disclosed" checked={formData.disclosures.complaintsProcessDisclosed === "yes"} />
        <CheckboxRow label="POPIA consent obtained" checked={formData.disclosures.popiaConsent === "yes"} />
      </Section>

      <Section title="FICA">
        <div className="roa-field-grid">
          <Field label="FICA verified" value={formData.fica.verified === "yes" ? "Yes" : formData.fica.verified === "no" ? "No" : "—"} />
          <Field label="Source of funds" value={formData.fica.sourceOfFunds} />
        </div>
        <div className="roa-subtitle">Supporting documents</div>
        {formData.fica.supportingDocuments?.length ? (
          <ul className="roa-list">
            {formData.fica.supportingDocuments.map((doc) => (
              <li key={doc}>{doc}</li>
            ))}
          </ul>
        ) : (
          <p className="roa-paragraph">None listed</p>
        )}
      </Section>

      <Section title="NEEDS ANALYSIS">
        <Field label="Scope of advice" value={formData.needs.scopeOfAdvice?.join(", ") || ""} />
        <Field label="Client financial needs" value={formData.needs.clientFinancialNeeds} />
        <Field label="Insurance needs" value={formData.needs.insuranceNeeds} />
        <Field label="Investment objective" value={formData.investment.objective} />
        <Field label="Investment horizon" value={formData.investment.horizon} />
        <Field label="Risk appetite / profile" value={formData.investment.riskAppetite} />
        <Field label="Products considered" value={formData.needs.productsConsidered} />
        <Field
          label="Replacement advice"
          value={formData.needs.replacementAdvice === "yes" ? "Yes" : formData.needs.replacementAdvice === "no" ? "No" : ""}
        />
      </Section>

      <Section title="RECOMMENDATION">
        <div className="roa-subtitle">Recommendation summary</div>
        <div className="roa-prose">
          {toParagraphs(formData.recommendation.adviceSummary).map((paragraph) => (
            <p key={paragraph} className="roa-paragraph">
              {paragraph}
            </p>
          ))}
        </div>
        <div className="roa-subtitle">Product details</div>
        <div className="roa-paragraph">{formData.recommendation.productRecommendation || "—"}</div>
        <div className="roa-subtitle">Suitability reasoning</div>
        <div className="roa-paragraph">{formData.recommendation.suitabilityJustification || "—"}</div>
        <div className="roa-subtitle">Alternatives considered</div>
        <div className="roa-paragraph">{formData.recommendation.alternatives || "—"}</div>
        <ParsedNarrativeBlocks sections={narrativeSections} />
      </Section>

      <Section title="COSTS">
        <div className="roa-field-grid">
          <Field label="Income / affordability context" value={formData.financials.income} />
          <Field label="Expenses" value={formData.financials.expenses} />
          <Field label="Initial fees" value={formData.costs.initialFee} />
          <Field label="Ongoing fees" value={formData.costs.ongoingFee} />
          <Field label="Premiums / contributions" value={formData.costs.premium} />
          <Field label="Cost notes" value={formData.costs.feeNotes} />
        </div>
      </Section>

      <Section title="ACCEPTANCE">
        <CheckboxRow label="Accepted in full" checked={formData.acceptance.decision === "full"} />
        <CheckboxRow label="Accepted partially" checked={formData.acceptance.decision === "partial"} />
        <CheckboxRow label="Rejected" checked={formData.acceptance.decision === "rejected"} />
      </Section>

      <footer className="roa-signatures">
        <div className="roa-signature-line">
          <span>Client signature</span>
          <span className="roa-signature-blank">{formData.acceptance.clientSignature || "_______________________________"}</span>
        </div>
        <div className="roa-signature-line">
          <span>Advisor Signature (Denzil Appadu)</span>
          <span className="roa-signature-blank">{formData.acceptance.advisorSignature || "_______________________________"}</span>
        </div>
        <div className="roa-signature-line">
          <span>Date</span>
          <span className="roa-signature-blank">{formData.acceptance.acceptanceDate || "_______________________________"}</span>
        </div>
      </footer>

      <p className="roa-footer-note">
        This document is a draft for review. Final responsibility rests with the licensed advisor. {BRANDING.footerCompanyName} · {BRANDING.fsp}
      </p>
    </div>
  );
}
