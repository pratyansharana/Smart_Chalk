export function FileDropzone({ label = 'Upload file', ...props }) {
  return (
    <label className="glass-card grid cursor-pointer place-items-center gap-2 border-dashed p-6 text-sm text-slate-300">
      {label}
      <input className="sr-only" type="file" {...props} />
    </label>
  );
}
