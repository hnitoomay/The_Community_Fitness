import { Activity, ChevronRight, ClipboardList, Target, Users } from "lucide-react";
import Link from "next/link";
import { AdminEmptyState } from "@/components/admin/admin-empty-state";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminStatCard } from "@/components/admin/admin-stat-card";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import type { AdminDashboardData } from "@/types/admin-clients";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeZone: "Asia/Yangon",
  }).format(new Date(value));
}

function getPlanBadgeVariant(status: "Active" | "Outdated" | "No Plan") {
  if (status === "Active") {
    return "success";
  }

  if (status === "Outdated") {
    return "warning";
  }

  return "outline";
}

function getActivityBadgeVariant(tone: "default" | "success" | "warning" | "error") {
  if (tone === "success") {
    return "success";
  }

  if (tone === "warning") {
    return "warning";
  }

  if (tone === "error") {
    return "error";
  }

  return "outline";
}

export function AdminDashboardScreen({ data }: { data: AdminDashboardData }) {
  return (
    <div className="space-y-6">
      <AdminPageHeader
        eyebrow="Overview"
        title="Community Fitness Admin"
        description="Live operations snapshot for clients, plans, workouts, and readiness of the gym reference data."
      />
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {data.metrics.map((metric) => (
          <div key={metric.label} className="relative">
            <AdminStatCard label={metric.label} value={metric.value} note={metric.note} />
            {metric.href ? (
              <Link href={metric.href} className="absolute inset-0 rounded-[1.5rem]">
                <span className="sr-only">Open {metric.label}</span>
              </Link>
            ) : null}
          </div>
        ))}
      </section>
      <section className="grid gap-6 xl:grid-cols-[1.35fr_1fr]">
        <Card className="rounded-[1.5rem]">
          <CardContent className="space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1">
                <h2 className="text-lg font-semibold text-[var(--color-text)]">Recent Clients</h2>
                <p className="text-sm text-[var(--color-text-secondary)]">
                  Latest five non-admin accounts joining the platform.
                </p>
              </div>
              <Link
                href="/admin/clients"
                className="inline-flex items-center gap-2 text-sm font-medium text-[var(--color-primary)]"
              >
                View all
                <ChevronRight className="size-4" />
              </Link>
            </div>
            {data.recentClients.length ? (
              <div className="space-y-3">
                {data.recentClients.map((client) => (
                  <div
                    key={client.userId}
                    className="flex flex-col gap-3 rounded-2xl border border-[var(--color-border)] bg-white p-4 lg:flex-row lg:items-center lg:justify-between"
                  >
                    <div className="space-y-1">
                      <p className="font-medium text-[var(--color-text)]">{client.fullName}</p>
                      <p className="text-sm text-[var(--color-text-secondary)]">{client.email}</p>
                      <p className="text-sm text-[var(--color-text-secondary)]">
                        {client.bodyGoal ?? "No body goal selected"} · Joined {formatDate(client.joinedAt)}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant={client.onboardingStatus === "Complete" ? "success" : "warning"}>
                        {client.onboardingStatus}
                      </Badge>
                      <Badge variant={getPlanBadgeVariant(client.activePlanStatus)}>
                        {client.activePlanStatus}
                      </Badge>
                      <Link
                        href={`/admin/clients/${client.userId}`}
                        className="inline-flex items-center gap-2 rounded-full border border-[var(--color-border)] px-3 py-2 text-sm font-medium text-[var(--color-text)] transition hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]"
                      >
                        View Client
                        <ChevronRight className="size-4" />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <AdminEmptyState
                title="No client accounts yet"
                description="Client accounts will appear here as soon as non-admin users register."
              />
            )}
          </CardContent>
        </Card>
        <Card className="rounded-[1.5rem]">
          <CardContent className="space-y-4">
            <div className="space-y-1">
              <h2 className="text-lg font-semibold text-[var(--color-text)]">
                Plan and Workout Activity
              </h2>
              <p className="text-sm text-[var(--color-text-secondary)]">
                Current plan health and weekly workout momentum.
              </p>
            </div>
            <div className="grid gap-3">
              {data.activity.map((item) => (
                <div
                  key={item.label}
                  className="flex items-center justify-between rounded-2xl border border-[var(--color-border)] bg-white px-4 py-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="rounded-full bg-[rgba(214,31,44,0.12)] p-2 text-[var(--color-primary)]">
                      <Activity className="size-4" />
                    </div>
                    <p className="text-sm font-medium text-[var(--color-text)]">{item.label}</p>
                  </div>
                  <Badge variant={getActivityBadgeVariant(item.tone)}>{item.value}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </section>
      <Card className="rounded-[1.5rem]">
        <CardContent className="space-y-4">
          <div className="space-y-1">
            <h2 className="text-lg font-semibold text-[var(--color-text)]">
              Reference Data Readiness
            </h2>
            <p className="text-sm text-[var(--color-text-secondary)]">
              Current inventory of the reference data that supports planning.
            </p>
          </div>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {data.referenceReadiness.map((item) => {
              const Icon = item.label === "Equipment" ? ClipboardList : item.label === "Body Goals" ? Target : Users;

              return (
                <Link
                  key={item.label}
                  href={item.href}
                  className="flex items-center justify-between rounded-2xl border border-[var(--color-border)] bg-white px-4 py-4 transition hover:border-[var(--color-primary)]"
                >
                  <div className="flex items-center gap-3">
                    <div className="rounded-full bg-[rgba(214,31,44,0.12)] p-2 text-[var(--color-primary)]">
                      <Icon className="size-4" />
                    </div>
                    <p className="text-sm font-medium text-[var(--color-text)]">{item.label}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-semibold text-[var(--color-text)]">{item.count}</span>
                    <ChevronRight className="size-4 text-[var(--color-text-secondary)]" />
                  </div>
                </Link>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
