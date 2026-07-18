interface ClientStatusRowProps {
  label: string;
  value: string;
}

export function ClientStatusRow({ label, value }: ClientStatusRowProps) {
  return (
    <div className="flex items-start justify-between gap-4">
      <span className="text-sm text-[var(--color-text-secondary)]">{label}</span>
      <span className="max-w-[58%] text-right text-sm font-medium text-[var(--color-text)]">
        {value}
      </span>
    </div>
  );
}
