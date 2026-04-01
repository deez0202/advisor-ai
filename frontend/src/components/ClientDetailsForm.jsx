/* eslint-disable react/prop-types */
function Missing({ path, requiredMissing }) {
  return requiredMissing.includes(path) ? <span className="missing-tag">Required</span> : null;
}

export default function ClientDetailsForm({ formData, updateField, toggleArrayValue, requiredMissing }) {
  const docs = ["ID Document", "Proof of Address", "Bank Statement", "Source of Funds Proof"];
  const scopeOptions = ["Investments", "Retirement", "Insurance", "Estate Planning"];

  return (
    <div className="panel">
      <h3>Client Details / Disclosures / FICA</h3>
      <div className="form-grid">
        <label>Name <Missing path="clientDetails.name" requiredMissing={requiredMissing} />
          <input className={`input ${requiredMissing.includes("clientDetails.name") ? "missing-field" : ""}`} value={formData.clientDetails.name} onChange={(e) => updateField("clientDetails.name", e.target.value)} />
        </label>
        <label>ID Number <Missing path="clientDetails.idNumber" requiredMissing={requiredMissing} />
          <input className="input" value={formData.clientDetails.idNumber} onChange={(e) => updateField("clientDetails.idNumber", e.target.value)} />
        </label>
        <label>Contact <Missing path="clientDetails.contact" requiredMissing={requiredMissing} />
          <input className={`input ${requiredMissing.includes("clientDetails.contact") ? "missing-field" : ""}`} value={formData.clientDetails.contact} onChange={(e) => updateField("clientDetails.contact", e.target.value)} />
        </label>
        <label>Email
          <input className="input" value={formData.clientDetails.email} onChange={(e) => updateField("clientDetails.email", e.target.value)} />
        </label>
        <label>Date of Meeting
          <input
            type="date"
            className="input"
            value={formData.clientDetails.meetingDate || ""}
            onChange={(e) => updateField("clientDetails.meetingDate", e.target.value)}
          />
        </label>
        <label>Date of Advice
          <input
            type="date"
            className="input"
            value={formData.clientDetails.adviceDate || ""}
            onChange={(e) => updateField("clientDetails.adviceDate", e.target.value)}
          />
        </label>
      </div>

      <h4>Compulsory Disclosures</h4>
      <div className="form-grid">
        {[
          ["disclosures.conflictDisclosed", "Conflict disclosed"],
          ["disclosures.feesDisclosed", "Fees disclosed"],
          ["disclosures.complaintsProcessDisclosed", "Complaints process disclosed"],
          ["disclosures.popiaConsent", "POPIA consent"],
        ].map(([path, label]) => (
          <div key={path}>
            <div>{label}</div>
            <label><input type="radio" checked={formData.disclosures[path.split(".")[1]] === "yes"} onChange={() => updateField(path, "yes")} /> Yes</label>
            <label><input type="radio" checked={formData.disclosures[path.split(".")[1]] === "no"} onChange={() => updateField(path, "no")} /> No</label>
          </div>
        ))}
      </div>

      <h4>FICA / Source of Funds / Supporting Documents</h4>
      <div className="form-grid">
        <div>
          <div>FICA verified</div>
          <label><input type="radio" checked={formData.fica.verified === "yes"} onChange={() => updateField("fica.verified", "yes")} /> Yes</label>
          <label><input type="radio" checked={formData.fica.verified === "no"} onChange={() => updateField("fica.verified", "no")} /> No</label>
        </div>
        <label>Source of Funds
          <input className="input" value={formData.fica.sourceOfFunds} onChange={(e) => updateField("fica.sourceOfFunds", e.target.value)} />
        </label>
      </div>
      <div className="checkbox-row">
        {docs.map((doc) => (
          <label key={doc}>
            <input
              type="checkbox"
              checked={formData.fica.supportingDocuments.includes(doc)}
              onChange={() => toggleArrayValue("fica.supportingDocuments", doc)}
            />
            {doc}
          </label>
        ))}
      </div>

      <h4>Scope of Advice</h4>
      <div className="checkbox-row">
        {scopeOptions.map((scope) => (
          <label key={scope}>
            <input
              type="checkbox"
              checked={formData.needs.scopeOfAdvice.includes(scope)}
              onChange={() => toggleArrayValue("needs.scopeOfAdvice", scope)}
            />
            {scope}
          </label>
        ))}
      </div>
    </div>
  );
}
