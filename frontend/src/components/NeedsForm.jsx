/* eslint-disable react/prop-types */
function Missing({ path, requiredMissing }) {
  return requiredMissing.includes(path) ? <span className="missing-tag">Required</span> : null;
}

export default function NeedsForm({ formData, updateField, requiredMissing }) {
  return (
    <div className="panel">
      <h3>Client Financial Needs / Insurance / Products</h3>
      <div className="form-grid">
        <label>Income (Affordability) <Missing path="financials.income" requiredMissing={requiredMissing} />
          <input className={`input ${requiredMissing.includes("financials.income") ? "missing-field" : ""}`} value={formData.financials.income} onChange={(e) => updateField("financials.income", e.target.value)} />
        </label>
        <label>Expenses
          <input className="input" value={formData.financials.expenses} onChange={(e) => updateField("financials.expenses", e.target.value)} />
        </label>
      </div>
      <label>Client Financial Needs
        <textarea
          className="textarea"
          value={formData.needs.clientFinancialNeeds}
          onChange={(e) => updateField("needs.clientFinancialNeeds", e.target.value)}
        />
      </label>
      <label>Insurance Needs
        <textarea className="textarea" value={formData.needs.insuranceNeeds} onChange={(e) => updateField("needs.insuranceNeeds", e.target.value)} />
      </label>
      <div className="form-grid">
        <div>
          <div>Replacement Advice</div>
          <label><input type="radio" checked={formData.needs.replacementAdvice === "yes"} onChange={() => updateField("needs.replacementAdvice", "yes")} /> Yes</label>
          <label><input type="radio" checked={formData.needs.replacementAdvice === "no"} onChange={() => updateField("needs.replacementAdvice", "no")} /> No</label>
        </div>
        <label>Products Considered
          <input className="input" value={formData.needs.productsConsidered} onChange={(e) => updateField("needs.productsConsidered", e.target.value)} />
        </label>
      </div>

      <h4>Insurance Product Inputs</h4>
      <div className="form-grid">
        <label>Life Cover
          <input className="input" value={formData.insurance.lifeCover} onChange={(e) => updateField("insurance.lifeCover", e.target.value)} />
        </label>
        <label>Disability Cover
          <input className="input" value={formData.insurance.disabilityCover} onChange={(e) => updateField("insurance.disabilityCover", e.target.value)} />
        </label>
        <label>Critical Illness
          <input className="input" value={formData.insurance.criticalIllness} onChange={(e) => updateField("insurance.criticalIllness", e.target.value)} />
        </label>
        <label>Income Protection
          <input className="input" value={formData.insurance.incomeProtection} onChange={(e) => updateField("insurance.incomeProtection", e.target.value)} />
        </label>
      </div>
      <div className="inline-note">Investment objective <Missing path="investment.objective" requiredMissing={requiredMissing} /></div>
    </div>
  );
}
