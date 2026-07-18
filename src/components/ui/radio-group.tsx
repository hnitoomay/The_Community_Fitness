import { cn } from "@/lib/utils";

interface RadioOption {
  label: string;
  value: string;
  description?: string;
}

interface RadioGroupProps {
  name: string;
  options: RadioOption[];
  defaultValue?: string;
  className?: string;
}

export function RadioGroup({
  name,
  options,
  defaultValue,
  className,
}: RadioGroupProps) {
  return (
    <div className={cn("space-y-3", className)}>
      {options.map((option) => {
        const defaultChecked = defaultValue === option.value;

        return (
          <label
            key={option.value}
            className="flex items-start gap-3 rounded-2xl border border-[var(--color-border)] bg-white p-4 transition hover:border-[var(--color-primary)]"
          >
            <input
              type="radio"
              name={name}
              value={option.value}
              defaultChecked={defaultChecked}
              className="mt-0.5 size-4 border-[var(--color-border)] text-[var(--color-primary)] focus-visible:ring-[rgba(214,31,44,0.16)]"
            />
            <span className="space-y-1">
              <span className="block text-sm font-medium text-[var(--color-text)]">
                {option.label}
              </span>
              {option.description ? (
                <span className="block text-sm text-[var(--color-text-secondary)]">
                  {option.description}
                </span>
              ) : null}
            </span>
          </label>
        );
      })}
    </div>
  );
}
