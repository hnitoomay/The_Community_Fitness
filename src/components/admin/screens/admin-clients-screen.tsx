import { Search } from "lucide-react";
import Link from "next/link";
import { AdminDatabaseErrorState } from "@/components/admin/admin-database-error-state";
import { AdminEmptyState } from "@/components/admin/admin-empty-state";
import { AdminFilterBar } from "@/components/admin/admin-filter-bar";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminTable } from "@/components/admin/admin-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import type { AdminClientListResult } from "@/types/admin-clients";

const headers = [
  "Client",
  "Email",
  "Gender",
  "Age",
  "Body Goal",
  "Onboarding",
  "AI Assessment",
  "Plan Status",
  "Latest Measurement",
  "Joined",
  "Actions",
] as const;

function formatDate(value: string | null) {
  if (!value) {
    return "-";
  }

  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeZone: "Asia/Yangon",
  }).format(new Date(value));
}

function getStatusBadgeVariant(status: string) {
  if (status === "Complete" || status === "Current" || status === "Active") {
    return "success";
  }

  if (status === "Incomplete" || status === "Outdated") {
    return "warning";
  }

  return "outline";
}

function buildPageHref(data: AdminClientListResult, page: number) {
  const params = new URLSearchParams();

  if (data.filters.query) {
    params.set("q", data.filters.query);
  }

  if (data.filters.onboarding !== "all") {
    params.set("onboarding", data.filters.onboarding);
  }

  if (data.filters.bodyGoalId) {
    params.set("bodyGoalId", data.filters.bodyGoalId);
  }

  if (data.filters.assessment !== "all") {
    params.set("assessment", data.filters.assessment);
  }

  if (data.filters.plan !== "all") {
    params.set("plan", data.filters.plan);
  }

  if (page > 1) {
    params.set("page", String(page));
  }

  const queryString = params.toString();
  return queryString ? `/admin/clients?${queryString}` : "/admin/clients";
}

export function AdminClientsScreen({
  data,
  error,
}: {
  data: AdminClientListResult | null;
  error?: string | null;
}) {
  if (error) {
    return (
      <div className="space-y-6">
        <AdminPageHeader
          eyebrow="Clients"
          title="Client Directory"
          description="Search and review client setup status, assessments, plans, and recent measurements."
        />
        <AdminDatabaseErrorState
          title="Client data is unavailable"
          description={error}
        />
      </div>
    );
  }

  if (!data) {
    return null;
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        eyebrow="Clients"
        title="Client Directory"
        description="Search and review client setup status, assessments, plans, and recent measurements."
      />
      <AdminFilterBar>
        <form action="/admin/clients" method="get" className="grid flex-1 gap-3 xl:grid-cols-5">
          <div className="relative xl:col-span-2">
            <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-[var(--color-text-secondary)]" />
            <Input
              name="q"
              defaultValue={data.filters.query}
              placeholder="Search name or email"
              className="pl-10"
            />
          </div>
          <Select
            name="onboarding"
            defaultValue={data.filters.onboarding}
            options={[
              { label: "All Onboarding", value: "all" },
              { label: "Complete", value: "complete" },
              { label: "Incomplete", value: "incomplete" },
            ]}
          />
          <Select
            name="bodyGoalId"
            defaultValue={data.filters.bodyGoalId}
            placeholder="All Body Goals"
            options={data.availableBodyGoals.map((item) => ({
              label: item.label,
              value: item.id,
            }))}
          />
          <Select
            name="assessment"
            defaultValue={data.filters.assessment}
            options={[
              { label: "All Assessments", value: "all" },
              { label: "Current", value: "current" },
              { label: "Outdated", value: "outdated" },
              { label: "Not Generated", value: "not_generated" },
            ]}
          />
          <Select
            name="plan"
            defaultValue={data.filters.plan}
            options={[
              { label: "All Plans", value: "all" },
              { label: "Active", value: "active" },
              { label: "Outdated", value: "outdated" },
              { label: "No Plan", value: "no_plan" },
            ]}
          />
          <div className="flex flex-wrap justify-end gap-3 xl:col-span-5">
            <Button type="submit" variant="secondary">
              Apply Filters
            </Button>
            <Link
              href="/admin/clients"
              className="inline-flex h-11 items-center justify-center rounded-2xl px-5 text-sm font-medium text-[var(--color-text-secondary)] transition hover:bg-zinc-100 hover:text-[var(--color-text)]"
            >
              Clear
            </Link>
          </div>
        </form>
      </AdminFilterBar>
      {data.items.length ? (
        <AdminTable
          headers={[...headers]}
          footer={
            data.totalPages > 1 ? (
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm text-[var(--color-text-secondary)]">
                  Page {data.currentPage} of {data.totalPages} · {data.totalCount} clients
                </p>
                <div className="flex gap-2">
                  <Link
                    href={buildPageHref(data, Math.max(1, data.currentPage - 1))}
                    aria-disabled={data.currentPage === 1}
                    className="inline-flex h-10 items-center justify-center rounded-xl border border-[var(--color-border)] px-3 text-sm font-medium text-[var(--color-text)] transition aria-disabled:pointer-events-none aria-disabled:opacity-50"
                  >
                    Previous
                  </Link>
                  <Link
                    href={buildPageHref(data, Math.min(data.totalPages, data.currentPage + 1))}
                    aria-disabled={data.currentPage === data.totalPages}
                    className="inline-flex h-10 items-center justify-center rounded-xl border border-[var(--color-border)] px-3 text-sm font-medium text-[var(--color-text)] transition aria-disabled:pointer-events-none aria-disabled:opacity-50"
                  >
                    Next
                  </Link>
                </div>
              </div>
            ) : (
              <p className="text-sm text-[var(--color-text-secondary)]">
                {data.totalCount} clients
              </p>
            )
          }
        >
          {data.items.map((item) => (
            <tr key={item.userId}>
              <td className="px-5 py-4">
                <div className="space-y-1">
                  <p className="font-medium text-[var(--color-text)]">{item.fullName}</p>
                  <p className="text-sm text-[var(--color-text-secondary)]">
                    {item.profileImageUrl ? "Profile image" : "No profile image"}
                  </p>
                </div>
              </td>
              <td className="px-5 py-4 text-sm text-[var(--color-text-secondary)]">{item.email}</td>
              <td className="px-5 py-4 text-sm text-[var(--color-text-secondary)]">{item.gender ?? "-"}</td>
              <td className="px-5 py-4 text-sm text-[var(--color-text-secondary)]">{item.age ?? "-"}</td>
              <td className="px-5 py-4 text-sm text-[var(--color-text-secondary)]">{item.bodyGoal ?? "-"}</td>
              <td className="px-5 py-4"><Badge variant={getStatusBadgeVariant(item.statuses.onboarding)}>{item.statuses.onboarding}</Badge></td>
              <td className="px-5 py-4"><Badge variant={getStatusBadgeVariant(item.statuses.assessment)}>{item.statuses.assessment}</Badge></td>
              <td className="px-5 py-4"><Badge variant={getStatusBadgeVariant(item.statuses.plan)}>{item.statuses.plan}</Badge></td>
              <td className="px-5 py-4 text-sm text-[var(--color-text-secondary)]">{formatDate(item.latestMeasurementAt)}</td>
              <td className="px-5 py-4 text-sm text-[var(--color-text-secondary)]">{formatDate(item.joinedAt)}</td>
              <td className="px-5 py-4">
                <Link
                  href={`/admin/clients/${item.userId}`}
                  className="inline-flex items-center rounded-xl border border-[var(--color-border)] px-3 py-2 text-sm font-medium text-[var(--color-text)] transition hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]"
                >
                  View Client
                </Link>
              </td>
            </tr>
          ))}
        </AdminTable>
      ) : (
        <AdminEmptyState
          title="No clients match these filters"
          description="Adjust the search or filter values to find another client."
        />
      )}
    </div>
  );
}
