import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface AdminTableProps {
  headers: string[];
  children: ReactNode;
  className?: string;
  footer?: ReactNode;
}

export function AdminTable({ headers, children, className, footer }: AdminTableProps) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-[1.5rem] border border-[var(--color-border)] bg-white shadow-[var(--shadow-soft)]",
        className,
      )}
    >
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-[var(--color-border)]">
          <thead className="bg-zinc-50">
            <tr>
              {headers.map((header) => (
                <th
                  key={header}
                  className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-text-secondary)]"
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--color-border)]">{children}</tbody>
        </table>
      </div>
      {footer ? <div className="border-t border-[var(--color-border)] p-4">{footer}</div> : null}
    </div>
  );
}

export { AdminTable as AdminDataTable };
