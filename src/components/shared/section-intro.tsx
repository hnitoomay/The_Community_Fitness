import { cn } from "@/lib/utils";

interface SectionIntroProps {
  eyebrow?: string;
  title: string;
  description?: string;
  className?: string;
}

export function SectionIntro({
  eyebrow,
  title,
  description,
  className,
}: SectionIntroProps) {
  return (
    <div className={cn("space-y-2", className)}>
      {eyebrow ? (
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[var(--color-primary)]">
          {eyebrow}
        </p>
      ) : null}
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight text-[var(--color-text)]">
          {title}
        </h1>
        {description ? (
          <p className="text-sm leading-6 text-[var(--color-text-secondary)]">
            {description}
          </p>
        ) : null}
      </div>
    </div>
  );
}
