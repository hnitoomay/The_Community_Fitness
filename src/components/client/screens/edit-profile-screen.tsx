"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";

import { saveEditableProfileAction } from "@/app/(client)/settings/profile/actions";
import {
  initialEditProfileActionState,
  type EditProfileActionState,
} from "@/app/(client)/settings/profile/action-state";
import { ClientAuthGate } from "@/components/client/client-auth-gate";
import { ClientFormSection } from "@/components/client/client-form-section";
import { ClientPage } from "@/components/client/client-page";
import { ClientShell } from "@/components/client/client-shell";
import { MobileFormField } from "@/components/client/mobile-form-field";
import { ProfileAvatarPlaceholder } from "@/components/client/profile-avatar-placeholder";
import { PrimaryMobileButton } from "@/components/client/primary-mobile-button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { genderOptions } from "@/data/health-condition-options";
import { getTodayDateOnly } from "@/lib/date-only";
import { calculateAgeFromDateOfBirth } from "@/lib/date-of-birth";
import type { EditableProfilePageData } from "@/types/profile-settings";

type EditProfileErrorMap = Partial<Record<string, string>>;

interface EditProfileScreenProps {
  initialData: EditableProfilePageData;
}

function hasProfileChanges(
  current: EditableProfilePageData["profile"],
  initial: EditableProfilePageData["profile"],
) {
  return (
    current.fullName.trim() !== initial.fullName.trim() ||
    current.dateOfBirth !== initial.dateOfBirth ||
    current.gender !== initial.gender
  );
}

export function EditProfileScreen({ initialData }: EditProfileScreenProps) {
  const [profile, setProfile] = useState(initialData.profile);
  const [errors, setErrors] = useState<EditProfileErrorMap>({});
  const [actionState, setActionState] = useState<EditProfileActionState>(
    initialEditProfileActionState,
  );
  const [isPending, startTransition] = useTransition();
  const hasChanges = useMemo(
    () => hasProfileChanges(profile, initialData.profile),
    [initialData.profile, profile],
  );
  const avatarImageUrl = initialData.avatarUrl ?? initialData.providerImageUrl;
  const todayDateOnly = getTodayDateOnly("Asia/Yangon");
  const currentAge =
    profile.dateOfBirth.trim()
      ? calculateAgeFromDateOfBirth(profile.dateOfBirth, todayDateOnly)
      : initialData.currentAge;

  const validate = () => {
    const nextErrors: EditProfileErrorMap = {};

    if (!profile.fullName.trim()) {
      nextErrors.fullName = "Enter your full name.";
    }

    if (!profile.gender) {
      nextErrors.gender = "Choose a gender.";
    }

    if (profile.dateOfBirth.trim()) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(profile.dateOfBirth)) {
        nextErrors.dateOfBirth = "Enter a valid date of birth.";
      } else if (profile.dateOfBirth > todayDateOnly) {
        nextErrors.dateOfBirth = "Date of birth cannot be in the future.";
      }
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSave = () => {
    if (!validate()) {
      return;
    }

    setActionState(initialEditProfileActionState);

    startTransition(async () => {
      const result = await saveEditableProfileAction(profile);
      setActionState(result);
    });
  };

  return (
    <ClientAuthGate>
      <ClientShell
        title="Edit Profile"
        subtitle=""
        backHref="/settings"
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
            title=""
            description=""
          >
            <div className="space-y-4">
              <ProfileAvatarPlaceholder
                imageUrl={avatarImageUrl}
                name={profile.fullName || initialData.profile.email}
                showUploadButton={false}
              />
              <div className="rounded-2xl bg-[var(--color-muted-bg)] px-4 py-3 text-sm text-[var(--color-text-secondary)]">
                {initialData.uploadStorageConfigured
                  ? "Custom profile photo uploads are available."
                  : "Custom photo upload is a later production-storage feature."}
              </div>
            </div>
          </ClientFormSection>

          <ClientFormSection
            title="Personal Information"
            description=""
          >
            <div className="space-y-4">
              <MobileFormField
                label="Full Name"
                error={errors.fullName ?? actionState.errors.fullName}
              >
                <Input
                  value={profile.fullName}
                  onChange={(event) =>
                    setProfile((current) => ({ ...current, fullName: event.target.value }))
                  }
                  placeholder="Enter your full name"
                  disabled={isPending}
                />
              </MobileFormField>

              <MobileFormField
                label="Email Address"
                hint=""
              >
                <Input value={profile.email} readOnly disabled aria-readonly="true" />
              </MobileFormField>

              <MobileFormField
                label="Date of Birth"
                hint={
                  currentAge === null
                    ? "Use a calendar date. Age is derived from this value when needed."
                    : `Current age: ${currentAge}`
                }
                error={errors.dateOfBirth ?? actionState.errors.dateOfBirth}
              >
                <Input
                  type="date"
                  value={profile.dateOfBirth}
                  onChange={(event) =>
                    setProfile((current) => ({ ...current, dateOfBirth: event.target.value }))
                  }
                  max={todayDateOnly}
                  disabled={isPending}
                />
              </MobileFormField>

              <MobileFormField
                label="Gender"
                error={errors.gender ?? actionState.errors.gender}
              >
                <Select
                  value={profile.gender}
                  onChange={(event) =>
                    setProfile((current) => ({
                      ...current,
                      gender: event.target.value as "" | "male" | "female" | "other",
                    }))
                  }
                  options={genderOptions}
                  placeholder="Select gender"
                  disabled={isPending}
                />
              </MobileFormField>
            </div>
          </ClientFormSection>

          <ClientFormSection
            title="Measurements"
            description="Recurring body measurements are stored as progress snapshots."
          >
            <div className="space-y-3">
              <p className="text-sm leading-6 text-[var(--color-text-secondary)]">
                {initialData.latestMeasurementRecordedAt
                  ? `Latest recorded measurement: ${new Date(
                      initialData.latestMeasurementRecordedAt,
                    ).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}.`
                  : "No body measurement snapshot has been recorded yet."}
              </p>
              <Link
                href="/measurements/new"
                className="inline-flex items-center text-sm font-medium text-[var(--color-primary)]"
              >
                Update Measurements
              </Link>
            </div>
          </ClientFormSection>

          <PrimaryMobileButton onClick={handleSave} loading={isPending}>
            {isPending ? "Saving..." : hasChanges ? "Save Profile" : "Save Profile"}
          </PrimaryMobileButton>
        </ClientPage>
      </ClientShell>
    </ClientAuthGate>
  );
}
