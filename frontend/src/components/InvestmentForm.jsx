/* eslint-disable react/prop-types */
function Missing({ path, requiredMissing }) {
  return requiredMissing.includes(path) ? <span className="missing-tag">Required</span> : null;
}

export default function InvestmentForm({ formData, updateField, requiredMissing }) {
  return (
    <div className="panel">
      <h3>Investment Needs</h3>
      <div className="form-grid">
        <label>Objective <Missing path="investment.objective" requiredMissing={requiredMissing} />
          <input className="input" value={formData.investment.objective} onChange={(e) => updateField("investment.objective", e.target.value)} />
        </label>
        <label>Investment Horizon <Missing path="investment.horizon" requiredMissing={requiredMissing} />
          <select className={`input ${requiredMissing.includes("investment.horizon") ? "missing-field" : ""}`} value={formData.investment.horizon} onChange={(e) => updateField("investment.horizon", e.target.value)}>
            <option value="">Select horizon</option>
            <option value="0-2 years">0-2 years</option>
            <option value="3-5 years">3-5 years</option>
            <option value="5-10 years">5-10 years</option>
            <option value="10+ years">10+ years</option>
          </select>
        </label>
        <label>Risk Appetite <Missing path="investment.riskAppetite" requiredMissing={requiredMissing} />
          <select className={`input ${requiredMissing.includes("investment.riskAppetite") ? "missing-field" : ""}`} value={formData.investment.riskAppetite} onChange={(e) => updateField("investment.riskAppetite", e.target.value)}>
            <option value="">Select risk profile</option>
            <option value="Conservative">Conservative</option>
            <option value="Moderate">Moderate</option>
            <option value="Balanced">Balanced</option>
            <option value="Growth">Growth</option>
            <option value="Aggressive">Aggressive</option>
          </select>
        </label>
        <label>Monthly Contribution
          <input className="input" value={formData.investment.monthlyContribution} onChange={(e) => updateField("investment.monthlyContribution", e.target.value)} />
        </label>
        <label>Lump Sum
          <input className="input" value={formData.investment.lumpSum} onChange={(e) => updateField("investment.lumpSum", e.target.value)} />
        </label>
      </div>
    </div>
  );
}
