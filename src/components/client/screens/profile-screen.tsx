"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { saveClientProfileAction } from "@/app/(client)/profile/actions";
import {
  initialClientProfileActionState,
  type ClientProfileActionState,
} from "@/app/(client)/profile/action-state";
import { ClientFormSection } from "@/components/client/client-form-section";
import { ClientPage } from "@/components/client/client-page";
import { ClientShell } from "@/components/client/client-shell";
import { MobileFormField } from "@/components/client/mobile-form-field";
import { PrimaryMobileButton } from "@/components/client/primary-mobile-button";
import { Input } from "@/components/ui/input";
import type { BodyMeasurementsDraft } from "@/types/client-journey";
import type { ClientProfilePageData } from "@/types/client-onboarding";

type ProfileErrorMap = Partial<Record<string, string>>;

interface ProfileScreenProps {
  initialData: ClientProfilePageData;
  loadError?: string;
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

function hasMeasurementChanges(
  current: BodyMeasurementsDraft,
  initial: BodyMeasurementsDraft,
) {
  return (
    normalizeComparableNumber(current.heightCm) !==
      normalizeComparableNumber(initial.heightCm) ||
    normalizeComparableNumber(current.weightKg) !==
      normalizeComparableNumber(initial.weightKg) ||
    normalizeComparableNumber(current.waistCm) !==
      normalizeComparableNumber(initial.waistCm) ||
    normalizeComparableNumber(current.chestCm) !==
      normalizeComparableNumber(initial.chestCm) ||
    normalizeComparableNumber(current.hipCm) !==
      normalizeComparableNumber(initial.hipCm) ||
    normalizeComparableNumber(current.armCm) !==
      normalizeComparableNumber(initial.armCm) ||
    normalizeComparableNumber(current.thighCm) !==
      normalizeComparableNumber(initial.thighCm) ||
    normalizeComparableNumber(current.bodyFatPercentage) !==
      normalizeComparableNumber(initial.bodyFatPercentage)
  );
}

function formatSummaryValue(value: string) {
  return value.trim() ? value : "Not added yet";
}

function formatGenderValue(value: ClientProfilePageData["basicProfile"]["gender"]) {
  return value ? `${value.charAt(0).toUpperCase()}${value.slice(1)}` : "Not added yet";
}

export function ProfileScreen({ initialData, loadError }: ProfileScreenProps) {
  const router = useRouter();
  const [measurements, setMeasurements] = useState(initialData.measurements);
  const [errors, setErrors] = useState<ProfileErrorMap>({});
  const [actionState, setActionState] = useState<ClientProfileActionState>(
    initialClientProfileActionState,
  );
  const [isPending, startTransition] = useTransition();
  const hasChanges = useMemo(
    () => hasMeasurementChanges(measurements, initialData.measurements),
    [initialData.measurements, measurements],
  );
  const hasCompleteStableProfile = Boolean(
    initialData.basicProfile.fullName.trim() &&
      initialData.basicProfile.dateOfBirth.trim() &&
      initialData.basicProfile.gender,
  );
  const ageLabel =
    initialData.basicProfile.currentAge === null
      ? "Not added yet"
      : `${initialData.basicProfile.currentAge} years`;

  const measurementFields = useMemo(
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
    const nextErrors: ProfileErrorMap = {};

    measurementFields.forEach((field) => {
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

  const handleNext = () => {
    if (!validate()) {
      return;
    }

    if (!hasCompleteStableProfile) {
      setActionState({
        success: false,
        didInsertMeasurement: false,
        message: "",
        errors: {
          form: "Complete your basic profile in Account Settings before continuing.",
        },
      });
      return;
    }

    setActionState(initialClientProfileActionState);

    startTransition(async () => {
      const result = await saveClientProfileAction(measurements);

      setActionState(result);

      if (result.success) {
        const destination = result.didInsertMeasurement
          ? "/profile/body-goal?saved=measurements"
          : "/profile/body-goal";
        router.push(destination);
      }
    });
  };

  return (
    <ClientShell
      title="Profile"
      subtitle="Review your saved profile and keep your measurements current."
      currentPath="/profile"
    >
      <ClientPage className="space-y-4">
        {loadError ? (
          <p className="rounded-2xl border border-[rgba(214,31,44,0.18)] bg-[rgba(214,31,44,0.06)] px-4 py-3 text-sm text-[var(--color-primary)]">
            {loadError}
          </p>
        ) : null}
        {actionState.errors.form ? (
          <p className="rounded-2xl border border-[rgba(214,31,44,0.18)] bg-[rgba(214,31,44,0.06)] px-4 py-3 text-sm text-[var(--color-primary)]">
            {actionState.errors.form}
          </p>
        ) : null}
        <ClientFormSection title="" description="">
          <div className="space-y-4">
            <dl className="space-y-4">
              <div className="space-y-1">
                <dt className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-text-secondary)]">
                  Full Name
                </dt>
                <dd className="text-base font-semibold text-[var(--color-text)]">
                  {formatSummaryValue(initialData.basicProfile.fullName)}
                </dd>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <dt className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-text-secondary)]">
                    Age
                  </dt>
                  <dd className="text-base font-semibold text-[var(--color-text)]">
                    {ageLabel}
                  </dd>
                </div>
                <div className="space-y-1">
                  <dt className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-text-secondary)]">
                    Gender
                  </dt>
                  <dd className="text-base font-semibold text-[var(--color-text)]">
                    {formatGenderValue(initialData.basicProfile.gender)}
                  </dd>
                </div>
              </div>
            </dl>

            {initialData.basicProfile.usesLegacyAgeFallback ? (
              <p className="rounded-2xl bg-[var(--color-muted-bg)] px-4 py-3 text-sm text-[var(--color-text-secondary)]">
                Add your date of birth in Account Settings.
              </p>
            ) : null}

            {!hasCompleteStableProfile ? (
              <p className="rounded-2xl border border-dashed border-[var(--color-border)] px-4 py-3 text-sm text-[var(--color-text-secondary)]">
                Complete your full name, date of birth, and gender in Account Settings before continuing.
              </p>
            ) : null}

            <Link
              href="/settings/profile"
              className="inline-flex items-center text-sm font-medium text-[var(--color-primary)]"
            >
              Edit in Account Settings
            </Link>
          </div>
        </ClientFormSection>
        <ClientFormSection
          title="Body Measurements"
          description=""
        >
          <div className="grid grid-cols-2 gap-3">
            {measurementFields.map((field) => (
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
                  aria-invalid={errors[field.key] ? true : undefined}
                  disabled={isPending}
                />
              </MobileFormField>
            ))}
          </div>
        </ClientFormSection>
        <PrimaryMobileButton onClick={handleNext} loading={isPending}>
          {isPending
            ? "Saving..."
            : hasChanges
              ? "Save Measurements & Continue"
              : "Continue"}
        </PrimaryMobileButton>
      </ClientPage>
    </ClientShell>
  );
}
