/* eslint-disable react/prop-types */
export default function CompliancePanel({ report }) {
  if (!report) return null;

  const sections = [
    { title: "Issues", key: "issues" },
    { title: "Risks", key: "risks" },
    { title: "Missing Info", key: "missingInfo" },
    { title: "Suggested Fixes", key: "suggestedFixes" },
  ];

  return (
    <div className="panel">
      <h3>Compliance Check</h3>
      {sections.map((section) => (
        <div key={section.key} className="compliance-block">
          <h4>{section.title}</h4>
          <ul>
            {(report[section.key] || []).map((item, index) => (
              <li key={`${section.key}-${index}`}>{item}</li>
            ))}
            {(!report[section.key] || report[section.key].length === 0) && <li>None detected.</li>}
          </ul>
        </div>
      ))}
    </div>
  );
}
