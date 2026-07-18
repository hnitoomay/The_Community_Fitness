"use client";

import { useEffect } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface ModalProps {
  open: boolean;
  title: string;
  description?: string;
  onClose: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

export function Modal({
  open,
  title,
  description,
  onClose,
  children,
  footer,
}: ModalProps) {
  useEffect(() => {
    if (!open) {
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-lg rounded-[1.5rem] bg-white shadow-[var(--shadow-card)]">
        <div className="flex items-start justify-between gap-4 border-b border-[var(--color-border)] px-6 py-5">
          <div className="space-y-1">
            <h2 className="text-lg font-semibold text-[var(--color-text)]">{title}</h2>
            {description ? (
              <p className="text-sm text-[var(--color-text-secondary)]">{description}</p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            className={cn(
              "rounded-full p-2 text-[var(--color-text-secondary)] transition hover:bg-zinc-100 hover:text-[var(--color-text)]",
              "focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[rgba(214,31,44,0.16)]",
            )}
            aria-label="Close modal"
          >
            <X className="size-4" />
          </button>
        </div>
        <div className="px-6 py-5">{children}</div>
        {footer ? (
          <div className="border-t border-[var(--color-border)] px-6 py-4">{footer}</div>
        ) : null}
      </div>
    </div>
  );
}
