export const inputClass =
  "mt-2 min-h-12 w-full border-b border-line bg-transparent px-0 py-2 text-base outline-none transition-colors focus:border-ink";
export const labelClass = "block text-sm text-muted";
export const primaryButton =
  "btn-tactile inline-flex min-h-12 items-center justify-center bg-ink px-6 text-xs uppercase tracking-widest font-medium text-paper transition-all hover:bg-oxblood disabled:opacity-50 active:scale-[0.98]";
export const quietButton =
  "btn-tactile inline-flex min-h-12 items-center justify-center border border-ink/20 bg-paper px-5 text-xs uppercase tracking-wider text-ink transition-all hover:border-ink disabled:opacity-50 active:scale-[0.98]";

export function FormError({ error }: { error?: string }) {
  if (!error) return null;
  return (
    <div className="animate-fade-up mt-2 border-l-2 border-oxblood bg-card px-3 py-2 text-xs text-oxblood" role="alert">
      {error}
    </div>
  );
}
