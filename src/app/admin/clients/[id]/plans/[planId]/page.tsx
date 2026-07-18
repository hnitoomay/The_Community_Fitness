import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { requireAdminUser } from "@/lib/server/auth";
import { getAdminClientPlanView } from "@/lib/server/repositories/admin-client-repository";

interface AdminClientPlanPageProps {
  params: Promise<{ id: string; planId: string }>;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeZone: "Asia/Yangon",
  }).format(new Date(value));
}

function getStatusVariant(status: string) {
  if (status === "active") {
    return "success";
  }

  if (status === "failed") {
    return "error";
  }

  if (status === "archived") {
    return "outline";
  }

  return "warning";
}

export default async function AdminClientPlanPage(props: AdminClientPlanPageProps) {
  await requireAdminUser();
  const { id, planId } = await props.params;
  const data = await getAdminClientPlanView(id, Number(planId));

  if (!data) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        eyebrow="Clients"
        title={`Plan #${data.planId}`}
        description="Read-only admin view of the selected client plan."
        action={
          <Link
            href={`/admin/clients/${id}`}
            className="inline-flex items-center gap-2 rounded-2xl border border-[var(--color-border)] px-4 py-3 text-sm font-medium text-[var(--color-text)] transition hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]"
          >
            <ArrowLeft className="size-4" />
            Back to Client
          </Link>
        }
      />
      <section className="grid gap-6 xl:grid-cols-3">
        <Card className="rounded-[1.5rem] xl:col-span-2">
          <CardContent className="space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <Badge variant={getStatusVariant(data.status)}>{data.status}</Badge>
              <p className="text-sm text-[var(--color-text-secondary)]">
                Created {formatDate(data.createdAt)}
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-text-secondary)]">
                  Date Range
                </p>
                <p className="text-sm text-[var(--color-text)]">
                  {formatDate(data.startDate)} to {formatDate(data.endDate)}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-text-secondary)]">
                  Body Goal
                </p>
                <p className="text-sm text-[var(--color-text)]">{data.bodyGoal}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-text-secondary)]">
                  Workout Template
                </p>
                <p className="text-sm text-[var(--color-text)]">{data.workoutTemplate}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-text-secondary)]">
                  Nutrition Template
                </p>
                <p className="text-sm text-[var(--color-text)]">{data.nutritionTemplate}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-[1.5rem]">
          <CardContent className="space-y-3">
            <h2 className="text-lg font-semibold text-[var(--color-text)]">Workout Progress</h2>
            <p className="text-sm text-[var(--color-text-secondary)]">
              Completed {data.workoutProgress.completed}
            </p>
            <p className="text-sm text-[var(--color-text-secondary)]">
              Skipped {data.workoutProgress.skipped}
            </p>
            <p className="text-sm text-[var(--color-text-secondary)]">
              In Progress {data.workoutProgress.inProgress}
            </p>
          </CardContent>
        </Card>
      </section>
      <Card className="rounded-[1.5rem]">
        <CardContent className="space-y-4">
          <h2 className="text-lg font-semibold text-[var(--color-text)]">Plan Days</h2>
          <div className="space-y-3">
            {data.days.map((day) => (
              <div
                key={day.planDate}
                className="grid gap-3 rounded-2xl border border-[var(--color-border)] bg-white px-4 py-3 md:grid-cols-5"
              >
                <div className="space-y-1">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-text-secondary)]">
                    Date
                  </p>
                  <p className="text-sm text-[var(--color-text)]">{formatDate(day.planDate)}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-text-secondary)]">
                    Schedule
                  </p>
                  <p className="text-sm text-[var(--color-text)]">
                    Week {day.weekNumber}, Day {day.dayNumber}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-text-secondary)]">
                    Type
                  </p>
                  <p className="text-sm text-[var(--color-text)]">
                    {day.dayType} {day.focusCategory ? `· ${day.focusCategory}` : ""}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-text-secondary)]">
                    Exercises
                  </p>
                  <p className="text-sm text-[var(--color-text)]">{day.exerciseCount}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-text-secondary)]">
                    Meals
                  </p>
                  <p className="text-sm text-[var(--color-text)]">
                    {day.mealItemCount}
                    {day.estimatedDurationMinutes ? ` · ${day.estimatedDurationMinutes} min` : ""}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
