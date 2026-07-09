export function ReusableInput({ label, error, ...props }) {
  return (
    <label className="grid gap-2 text-sm font-semibold text-slate-100">
      {label}
      <input className="apex-input" aria-invalid={Boolean(error)} {...props} />
      {error && <span className="text-xs text-red-300">{error}</span>}
    </label>
  );
}
