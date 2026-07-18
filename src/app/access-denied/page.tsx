import Link from "next/link";

import { BrandMark } from "@/components/shared/brand-mark";

export default function AccessDeniedPage() {
  return (
    <main className="flex min-h-svh items-center justify-center bg-[var(--color-muted-bg)] px-4 py-8">
      <section className="w-full max-w-xl rounded-[2rem] border border-[var(--color-border)] bg-white p-8 shadow-[var(--shadow-card)]">
        <div className="space-y-6">
          <BrandMark />
          <div className="space-y-2">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--color-primary)]">
              Access Denied
            </p>
            <h1 className="text-3xl font-semibold tracking-tight text-[var(--color-text)]">
              You do not have permission to view that page.
            </h1>
            <p className="text-sm leading-6 text-[var(--color-text-secondary)]">
              Admin pages require an authenticated account with the admin role.
              Sign in with the correct account or return to the client app.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              href="/login"
              className="inline-flex h-11 items-center justify-center rounded-2xl bg-[var(--color-primary)] px-5 text-sm font-medium text-white shadow-[var(--shadow-soft)] transition-all duration-200 hover:bg-[var(--color-primary-dark)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[rgba(214,31,44,0.16)] sm:flex-1"
            >
              Go to Sign In
            </Link>
            <Link
              href="/home"
              className="inline-flex h-11 items-center justify-center rounded-2xl border border-[var(--color-border)] bg-white px-5 text-sm font-medium text-[var(--color-text)] transition-all duration-200 hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[rgba(214,31,44,0.16)] sm:flex-1"
            >
              Return Home
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
