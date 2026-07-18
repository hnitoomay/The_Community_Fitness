import type { ReactNode } from "react";

interface AuthFormPanelProps {
  title: string;
  subtitle: string;
  children: ReactNode;
}

export function AuthFormPanel({
  title,
  subtitle,
  children,
}: AuthFormPanelProps) {
  return (
    <section className="relative z-10 -mt-8 flex flex-1 flex-col rounded-t-[2.5rem] bg-white px-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-8 shadow-[0_-18px_40px_rgba(17,17,17,0.08)]">
      <div className="mx-auto flex w-full max-w-[24rem] flex-1 flex-col">
        <div className="space-y-2 text-center">
          <h1 className="text-[2rem] font-semibold tracking-tight text-[var(--color-text)]">
            {title}
          </h1>
          <p className="text-sm leading-6 text-[var(--color-text-secondary)]">
            {subtitle}
          </p>
        </div>
        <div className="mt-8 flex flex-1 flex-col gap-5">{children}</div>
      </div>
    </section>
  );
}
