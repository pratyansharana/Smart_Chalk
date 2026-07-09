export function FormError({ message }) {
  if (!message) return null;
  return <p className="rounded-xl border border-red-400/20 bg-red-500/10 px-3 py-2 text-sm text-red-200">{message}</p>;
}
