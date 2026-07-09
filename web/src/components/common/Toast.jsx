export function Toast({ message, tone = 'success' }) {
  return (
    <div className="glass-card fixed bottom-5 right-5 z-50 max-w-sm px-4 py-3 text-sm text-slate-100" role="status">
      <span className={tone === 'success' ? 'text-emerald-400' : 'text-amber-400'}>{message}</span>
    </div>
  );
}
