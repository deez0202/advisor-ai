/* eslint-disable react/prop-types */
function Missing({ path, requiredMissing }) {
  return requiredMissing.includes(path) ? <span className="missing-tag">Required</span> : null;
}

export default function RecommendationForm({ formData, updateField, requiredMissing }) {
  return (
    <div className="panel">
      <h3>Recommendations / Costs / Acceptance / Signatures</h3>
      <label>Recommendation Summary <Missing path="recommendation.adviceSummary" requiredMissing={requiredMissing} />
        <textarea className="textarea" value={formData.recommendation.adviceSummary} onChange={(e) => updateField("recommendation.adviceSummary", e.target.value)} />
      </label>
      <div className="form-grid">
        <label>Product Recommendation
          <input className="input" value={formData.recommendation.productRecommendation} onChange={(e) => updateField("recommendation.productRecommendation", e.target.value)} />
        </label>
        <label>Suitability Justification
          <input className="input" value={formData.recommendation.suitabilityJustification} onChange={(e) => updateField("recommendation.suitabilityJustification", e.target.value)} />
        </label>
        <label>Alternatives Considered
          <input className="input" value={formData.recommendation.alternatives} onChange={(e) => updateField("recommendation.alternatives", e.target.value)} />
        </label>
      </div>

      <h4>Costs, Fees and Premiums</h4>
      <div className="form-grid">
        <label>Initial Fee
          <input className="input" value={formData.costs.initialFee} onChange={(e) => updateField("costs.initialFee", e.target.value)} />
        </label>
        <label>Ongoing Fee
          <input className="input" value={formData.costs.ongoingFee} onChange={(e) => updateField("costs.ongoingFee", e.target.value)} />
        </label>
        <label>Income/Premium
          <input className="input" value={formData.costs.premium} onChange={(e) => updateField("costs.premium", e.target.value)} />
        </label>
        <label>Cost Notes
          <input className="input" value={formData.costs.feeNotes} onChange={(e) => updateField("costs.feeNotes", e.target.value)} />
        </label>
      </div>

      <h4>Acceptance</h4>
      <div className="checkbox-row">
        <label><input type="radio" checked={formData.acceptance.decision === "full"} onChange={() => updateField("acceptance.decision", "full")} /> Full</label>
        <label><input type="radio" checked={formData.acceptance.decision === "partial"} onChange={() => updateField("acceptance.decision", "partial")} /> Partial</label>
        <label><input type="radio" checked={formData.acceptance.decision === "rejected"} onChange={() => updateField("acceptance.decision", "rejected")} /> Rejected</label>
      </div>
      <div className="inline-note"><Missing path="acceptance.decision" requiredMissing={requiredMissing} /></div>

      <h4>Signatures</h4>
      <div className="form-grid">
        <label>Client Signature Name
          <input className="input" value={formData.acceptance.clientSignature} onChange={(e) => updateField("acceptance.clientSignature", e.target.value)} />
        </label>
        <label>Advisor Signature Name
          <input className="input" value={formData.acceptance.advisorSignature} onChange={(e) => updateField("acceptance.advisorSignature", e.target.value)} />
        </label>
        <label>Date
          <input className="input" type="date" value={formData.acceptance.acceptanceDate} onChange={(e) => updateField("acceptance.acceptanceDate", e.target.value)} />
        </label>
      </div>
    </div>
  );
}
