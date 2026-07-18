"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { saveMeasurementSnapshotAction } from "@/app/(client)/measurements/new/actions";
import {
  initialMeasurementUpdateActionState,
  type MeasurementUpdateActionState,
} from "@/app/(client)/measurements/new/action-state";
import { ClientAuthGate } from "@/components/client/client-auth-gate";
import { ClientFormSection } from "@/components/client/client-form-section";
import { ClientPage } from "@/components/client/client-page";
import { ClientShell } from "@/components/client/client-shell";
import { MobileFormField } from "@/components/client/mobile-form-field";
import { PrimaryMobileButton } from "@/components/client/primary-mobile-button";
import { Input } from "@/components/ui/input";
import type { BodyMeasurementsDraft } from "@/types/client-journey";
import type { MeasurementSnapshotPageData } from "@/types/profile-settings";

type MeasurementErrorMap = Partial<Record<string, string>>;

interface MeasurementUpdateScreenProps {
  initialData: MeasurementSnapshotPageData;
}

function isPositiveNumber(value: string) {
  return Number.isFinite(Number(value)) && Number(value) > 0;
}

function normalizeComparableNumber(value: string) {
  const trimmed = value.trim();

  if (!trimmed) {
    return "";
  }

  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? String(parsed) : trimmed;
}

function hasMeasurementChanges(current: BodyMeasurementsDraft, initial: BodyMeasurementsDraft) {
  return (
    normalizeComparableNumber(current.heightCm) !== normalizeComparableNumber(initial.heightCm) ||
    normalizeComparableNumber(current.weightKg) !== normalizeComparableNumber(initial.weightKg) ||
    normalizeComparableNumber(current.waistCm) !== normalizeComparableNumber(initial.waistCm) ||
    normalizeComparableNumber(current.chestCm) !== normalizeComparableNumber(initial.chestCm) ||
    normalizeComparableNumber(current.hipCm) !== normalizeComparableNumber(initial.hipCm) ||
    normalizeComparableNumber(current.armCm) !== normalizeComparableNumber(initial.armCm) ||
    normalizeComparableNumber(current.thighCm) !== normalizeComparableNumber(initial.thighCm) ||
    normalizeComparableNumber(current.bodyFatPercentage) !==
      normalizeComparableNumber(initial.bodyFatPercentage)
  );
}

export function MeasurementUpdateScreen({ initialData }: MeasurementUpdateScreenProps) {
  const router = useRouter();
  const [measurements, setMeasurements] = useState(initialData.measurements);
  const [errors, setErrors] = useState<MeasurementErrorMap>({});
  const [actionState, setActionState] = useState<MeasurementUpdateActionState>(
    initialMeasurementUpdateActionState,
  );
  const [isPending, startTransition] = useTransition();
  const hasChanges = useMemo(
    () => hasMeasurementChanges(measurements, initialData.measurements),
    [initialData.measurements, measurements],
  );
  const fields = useMemo(
    () => [
      { key: "heightCm", label: "Height (cm)", optional: false },
      { key: "weightKg", label: "Weight (kg)", optional: false },
      { key: "waistCm", label: "Waist (cm)", optional: false },
      { key: "chestCm", label: "Chest (cm)", optional: false },
      { key: "hipCm", label: "Hip (cm)", optional: false },
      { key: "armCm", label: "Arm (cm)", optional: false },
      { key: "thighCm", label: "Thigh (cm)", optional: false },
      { key: "bodyFatPercentage", label: "Body Fat (%)", optional: true },
    ] as const,
    [],
  );

  const validate = () => {
    const nextErrors: MeasurementErrorMap = {};

    fields.forEach((field) => {
      const value = measurements[field.key];

      if (!field.optional && !isPositiveNumber(value)) {
        nextErrors[field.key] = `Enter a valid ${field.label.toLowerCase()}.`;
      }

      if (field.optional && value.trim() && !isPositiveNumber(value)) {
        nextErrors[field.key] = `Enter a valid ${field.label.toLowerCase()}.`;
      }
    });

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSave = () => {
    if (!validate()) {
      return;
    }

    setActionState(initialMeasurementUpdateActionState);

    startTransition(async () => {
      const result = await saveMeasurementSnapshotAction(measurements);
      setActionState(result);
    });
  };

  return (
    <ClientAuthGate>
      <ClientShell
        title="Update Measurements"
        subtitle=""
        backHref="/history"
      >
        <ClientPage className="space-y-4 pb-24">
          {actionState.errors.form ? (
            <p className="rounded-2xl border border-[rgba(214,31,44,0.18)] bg-[rgba(214,31,44,0.06)] px-4 py-3 text-sm text-[var(--color-primary)]">
              {actionState.errors.form}
            </p>
          ) : null}
          {actionState.message ? (
            <p className="rounded-2xl border border-[rgba(21,128,61,0.18)] bg-[rgba(21,128,61,0.08)] px-4 py-3 text-sm text-[var(--color-success)]">
              {actionState.message}
            </p>
          ) : null}

          <ClientFormSection
            title="Measurement Snapshot"
            description=""
          >
            <div className="space-y-3">
              <p className="text-sm leading-6 text-[var(--color-text-secondary)]">
                {initialData.latestMeasuredAt
                  ? `Latest saved snapshot: ${new Date(initialData.latestMeasuredAt).toLocaleDateString(
                      "en-US",
                      {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      },
                    )}.`
                  : "No previous measurement snapshot is saved yet."}
              </p>
              <div className="grid grid-cols-2 gap-3">
                {fields.map((field) => (
                  <MobileFormField
                    key={field.key}
                    label={field.label}
                    hint={field.optional ? "Optional" : undefined}
                    error={errors[field.key] ?? actionState.errors[field.key]}
                  >
                    <Input
                      value={measurements[field.key]}
                      onChange={(event) =>
                        setMeasurements((current) => ({
                          ...current,
                          [field.key]: event.target.value,
                        }))
                      }
                      inputMode="decimal"
                      placeholder={field.label}
                      disabled={isPending}
                    />
                  </MobileFormField>
                ))}
              </div>
            </div>
          </ClientFormSection>

          {actionState.success && actionState.didInsertMeasurement ? (
            <PrimaryMobileButton onClick={() => router.push("/assessment")}>
              AI Assessment ကို ပြန်လည်စစ်ဆေးမည်
            </PrimaryMobileButton>
          ) : (
            <PrimaryMobileButton onClick={handleSave} loading={isPending}>
              {isPending ? "Saving..." : hasChanges ? "Save Measurements" : "Save Measurements"}
            </PrimaryMobileButton>
          )}
        </ClientPage>
      </ClientShell>
    </ClientAuthGate>
  );
}
