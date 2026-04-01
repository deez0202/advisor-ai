/* eslint-disable react/prop-types */
export default function CheckboxRow({ label, checked }) {
  return (
    <div className="roa-checkbox-row">
      <span
        className={`roa-checkbox ${checked ? "roa-checkbox--on" : "roa-checkbox--off"}`}
        aria-hidden="true"
      >
        {checked ? "✓" : ""}
      </span>
      <span className="roa-checkbox-label">{label}</span>
    </div>
  );
}
