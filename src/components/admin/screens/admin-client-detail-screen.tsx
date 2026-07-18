import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import type { AdminClientDetailData } from "@/types/admin-clients";

function formatDate(value: string | null) {
  if (!value) {
    return "-";
  }

  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeZone: "Asia/Yangon",
  }).format(new Date(value));
}

function renderList(values: string[]) {
  return values.length ? values.join(", ") : "None recorded";
}

function getStatusVariant(status: string) {
  if (status === "Complete" || status === "Current" || status === "Active") {
    return "success";
  }

  if (status === "Incomplete" || status === "Outdated") {
    return "warning";
  }

  return "outline";
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-1">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-text-secondary)]">
        {label}
      </p>
      <p className="text-sm text-[var(--color-text)]">{value}</p>
    </div>
  );
}

export function AdminClientDetailScreen({
  data,
}: {
  data: AdminClientDetailData | null;
}) {
  if (!data) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        eyebrow="Clients"
        title={data.fullName}
        description="Read-only client profile, setup status, measurements, health preferences, and plan progress."
        action={
          <Link
            href="/admin/clients"
            className="inline-flex items-center gap-2 rounded-2xl border border-[var(--color-border)] px-4 py-3 text-sm font-medium text-[var(--color-text)] transition hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]"
          >
            <ArrowLeft className="size-4" />
            Back to Clients
          </Link>
        }
      />
      <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <Card className="rounded-[1.5rem]">
          <CardContent className="space-y-5">
            <h2 className="text-lg font-semibold text-[var(--color-text)]">Account Summary</h2>
            <div className="flex items-center gap-4">
              <div
                className="flex size-16 items-center justify-center overflow-hidden rounded-full bg-[rgba(214,31,44,0.12)] text-lg font-semibold text-[var(--color-primary)]"
                style={
                  data.profileImageUrl
                    ? {
                        backgroundImage: `url("${data.profileImageUrl}")`,
                        backgroundPosition: "center",
                        backgroundSize: "cover",
                      }
                    : undefined
                }
                aria-label={data.profileImageUrl ? "Profile image" : "Profile placeholder"}
              >
                {data.profileImageUrl ? null : data.fullName.slice(0, 1).toUpperCase()}
              </div>
              <div className="space-y-1">
                <p className="text-lg font-semibold text-[var(--color-text)]">{data.fullName}</p>
                <p className="text-sm text-[var(--color-text-secondary)]">{data.email}</p>
                <p className="text-sm text-[var(--color-text-secondary)]">
                  Joined {formatDate(data.joinedAt)}
                </p>
                {data.profileImageUrl ? (
                  <p className="text-sm text-[var(--color-text-secondary)]">Profile image on file</p>
                ) : null}
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <SummaryRow label="Gender" value={data.gender ?? "-"} />
              <SummaryRow label="Age" value={data.age === null ? "-" : `${data.age} years`} />
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-[1.5rem]">
          <CardContent className="space-y-4">
            <h2 className="text-lg font-semibold text-[var(--color-text)]">Fitness Profile</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <SummaryRow label="Body Goal" value={data.bodyGoal ?? "Not selected"} />
              <SummaryRow label="Latest Measurement" value={formatDate(data.latestMeasurementAt)} />
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge variant={data.onboardingCompleted ? "success" : "warning"}>
                {data.onboardingCompleted ? "Complete" : "Incomplete"}
              </Badge>
              <Badge variant={getStatusVariant(data.aiAssessment.status)}>
                {data.aiAssessment.status}
              </Badge>
              <Badge variant={getStatusVariant(data.currentPlan.status)}>
                {data.currentPlan.status}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </section>
      <section className="grid gap-6 xl:grid-cols-2">
        <Card className="rounded-[1.5rem]">
          <CardContent className="space-y-4">
            <h2 className="text-lg font-semibold text-[var(--color-text)]">Latest Measurements</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <SummaryRow label="Height" value={data.latestMeasurements.heightCm ? `${data.latestMeasurements.heightCm} cm` : "-"} />
              <SummaryRow label="Weight" value={data.latestMeasurements.weightKg ? `${data.latestMeasurements.weightKg} kg` : "-"} />
              <SummaryRow label="Waist" value={data.latestMeasurements.waistCm ? `${data.latestMeasurements.waistCm} cm` : "-"} />
              <SummaryRow label="Chest" value={data.latestMeasurements.chestCm ? `${data.latestMeasurements.chestCm} cm` : "-"} />
              <SummaryRow label="Hip" value={data.latestMeasurements.hipCm ? `${data.latestMeasurements.hipCm} cm` : "-"} />
              <SummaryRow label="Arm" value={data.latestMeasurements.armCm ? `${data.latestMeasurements.armCm} cm` : "-"} />
              <SummaryRow label="Thigh" value={data.latestMeasurements.thighCm ? `${data.latestMeasurements.thighCm} cm` : "-"} />
              <SummaryRow label="Body Fat" value={data.latestMeasurements.bodyFatPercent ? `${data.latestMeasurements.bodyFatPercent}%` : "-"} />
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-[1.5rem]">
          <CardContent className="space-y-4">
            <h2 className="text-lg font-semibold text-[var(--color-text)]">
              Preferences and Health Information
            </h2>
            <div className="grid gap-4">
              <SummaryRow label="Medical Conditions" value={renderList(data.preferences.medicalConditions)} />
              <SummaryRow label="Other Health Condition" value={data.preferences.otherHealthCondition ?? "None recorded"} />
              <SummaryRow label="Disliked Exercises" value={renderList(data.preferences.dislikedExercises)} />
              <SummaryRow label="Food Allergies" value={renderList(data.preferences.foodAllergies)} />
              <SummaryRow label="Food Restrictions" value={renderList(data.preferences.foodRestrictions)} />
              <SummaryRow label="Disliked Foods" value={renderList(data.preferences.dislikedFoods)} />
            </div>
          </CardContent>
        </Card>
      </section>
      <section className="grid gap-6 xl:grid-cols-3">
        <Card className="rounded-[1.5rem]">
          <CardContent className="space-y-3">
            <h2 className="text-lg font-semibold text-[var(--color-text)]">AI Assessment</h2>
            <Badge variant={getStatusVariant(data.aiAssessment.status)}>{data.aiAssessment.status}</Badge>
            <SummaryRow label="Generated" value={formatDate(data.aiAssessment.generatedAt)} />
          </CardContent>
        </Card>
        <Card className="rounded-[1.5rem]">
          <CardContent className="space-y-3">
            <h2 className="text-lg font-semibold text-[var(--color-text)]">Current Plan</h2>
            <Badge variant={getStatusVariant(data.currentPlan.status)}>{data.currentPlan.status}</Badge>
            <SummaryRow
              label="Date Range"
              value={
                data.currentPlan.startDate && data.currentPlan.endDate
                  ? `${formatDate(data.currentPlan.startDate)} to ${formatDate(data.currentPlan.endDate)}`
                  : "No active plan"
              }
            />
            {data.currentPlan.planId ? (
              <Link
                href={`/admin/clients/${data.userId}/plans/${data.currentPlan.planId}`}
                className="inline-flex items-center rounded-xl border border-[var(--color-border)] px-3 py-2 text-sm font-medium text-[var(--color-text)] transition hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]"
              >
                View Plan
              </Link>
            ) : null}
          </CardContent>
        </Card>
        <Card className="rounded-[1.5rem]">
          <CardContent className="space-y-3">
            <h2 className="text-lg font-semibold text-[var(--color-text)]">Workout Progress</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              <SummaryRow label="Completed" value={String(data.workoutProgress.completed)} />
              <SummaryRow label="Skipped" value={String(data.workoutProgress.skipped)} />
              <SummaryRow label="In Progress" value={String(data.workoutProgress.inProgress)} />
              <SummaryRow
                label="Completion"
                value={
                  data.workoutProgress.completionPercentage === null
                    ? "-"
                    : `${data.workoutProgress.completionPercentage}%`
                }
              />
            </div>
          </CardContent>
        </Card>
      </section>
      <Card className="rounded-[1.5rem]">
        <CardContent className="space-y-4">
          <h2 className="text-lg font-semibold text-[var(--color-text)]">Measurement History</h2>
          {data.measurementHistory.length ? (
            <div className="space-y-3">
              {data.measurementHistory.map((entry) => (
                <div
                  key={entry.measuredAt}
                  className="grid gap-3 rounded-2xl border border-[var(--color-border)] bg-white px-4 py-3 md:grid-cols-4"
                >
                  <SummaryRow label="Date" value={formatDate(entry.measuredAt)} />
                  <SummaryRow label="Weight" value={`${entry.weightKg} kg`} />
                  <SummaryRow label="Waist" value={`${entry.waistCm} cm`} />
                  <SummaryRow label="Body Fat" value={entry.bodyFatPercent ? `${entry.bodyFatPercent}%` : "-"} />
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-[var(--color-text-secondary)]">
              No measurement history has been recorded yet.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
