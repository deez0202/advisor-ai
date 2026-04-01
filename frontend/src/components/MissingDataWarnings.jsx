/* eslint-disable react/prop-types */
export default function MissingDataWarnings({ warnings }) {
  if (!warnings.length) return null;

  return (
    <div className="panel warning-panel">
      <h3>Missing Data Warnings</h3>
      <ul>
        {warnings.map((warning) => (
          <li key={warning}>{warning}</li>
        ))}
      </ul>
    </div>
  );
}
