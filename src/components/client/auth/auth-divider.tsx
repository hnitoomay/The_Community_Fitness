export function AuthDivider() {
  return (
    <div className="flex items-center gap-3">
      <div className="h-px flex-1 bg-[var(--color-border)]" />
      <p className="text-xs font-semibold tracking-[0.22em] text-[var(--color-text-secondary)]">
        OR CONTINUE WITH
      </p>
      <div className="h-px flex-1 bg-[var(--color-border)]" />
    </div>
  );
}
