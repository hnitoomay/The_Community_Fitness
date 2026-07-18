import type { ReactNode } from "react";
import { SectionIntro } from "@/components/shared/section-intro";

interface AdminPageHeaderProps {
  title: string;
  description: string;
  eyebrow?: string;
  action?: ReactNode;
}

export function AdminPageHeader({
  title,
  description,
  eyebrow,
  action,
}: AdminPageHeaderProps) {
  return (
    <div className="flex flex-col gap-4 border-b border-[var(--color-border)] pb-6 md:flex-row md:items-end md:justify-between">
      <SectionIntro eyebrow={eyebrow} title={title} description={description} />
      {action ? <div>{action}</div> : null}
    </div>
  );
}
