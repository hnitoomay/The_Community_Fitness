import Image from "next/image";
import { cn } from "@/lib/utils";

interface BrandMarkProps {
  compact?: boolean;
  className?: string;
}

export function BrandMark({ compact = false, className }: BrandMarkProps) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <div className="flex size-11 items-center justify-center">
        <Image
          src="/gym-final-logo.png"
          alt="Community Fitness Logo"
          width={44}
          height={44}
          className="h-full w-full object-cover"
        />
      </div>
      <div className={compact ? "hidden sm:block" : ""}>
        <p className="text-sm font-semibold uppercase tracking-[0.28em] text-[var(--color-primary)]">
          Community Fitness
        </p>
        <p className="text-xs font-semibold text-[var(--color-text)]">by Strategy First</p>
      </div>
    </div>
  );
}
