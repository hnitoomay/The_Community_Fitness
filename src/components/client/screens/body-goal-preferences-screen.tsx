"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { saveClientPreferencesAction } from "@/app/(client)/profile/body-goal/actions";
import { BodyGoalCard } from "@/components/client/body-goal-card";
import { ClientAuthGate } from "@/components/client/client-auth-gate";
import { ClientChoiceCards } from "@/components/client/client-choice-cards";
import { ClientFormSection } from "@/components/client/client-form-section";
import { ClientPage } from "@/components/client/client-page";
import { useClientSession } from "@/components/client/client-session-provider";
import { ClientSelectionChip } from "@/components/client/client-selection-chip";
import { ClientShell } from "@/components/client/client-shell";
import { PrimaryMobileButton } from "@/components/client/primary-mobile-button";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { healthConditionOptions } from "@/data/health-condition-options";
import { yesNoOptions, yesNoneOptions } from "@/data/preference-options";
import type {
  BodyGoalRecord,
  ClientPreferencesDraft,
  GenderValue,
} from "@/types/client-journey";

type PreferenceErrors = Partial<Record<string, string>>;

interface BodyGoalPreferencesScreenProps {
  availableGoals: BodyGoalRecord[];
  initialSelectedGoalId: string;
  initialPreferences: ClientPreferencesDraft;
  profileGender: GenderValue;
  loadError?: string;
}

function clonePreferences(preferences: ClientPreferencesDraft): ClientPreferencesDraft {
  return {
    medicalConditionIds: [...preferences.medicalConditionIds],
    otherHealthConditionText: preferences.otherHealthConditionText,
    exerciseDislikeChoice: preferences.exerciseDislikeChoice,
    dislikedExercises: preferences.dislikedExercises,
    foodAllergyChoice: preferences.foodAllergyChoice,
    foodAllergies: preferences.foodAllergies,
    foodRestrictionChoice: preferences.foodRestrictionChoice,
    foodRestrictions: preferences.foodRestrictions,
    dislikedFoodChoice: preferences.dislikedFoodChoice,
    dislikedFoods: preferences.dislikedFoods,
  };
}

export function BodyGoalPreferencesScreen({
  availableGoals,
  initialSelectedGoalId,
  initialPreferences,
  profileGender,
  loadError,
}: BodyGoalPreferencesScreenProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setSelectedBodyGoal, updatePreferences } = useClientSession();
  const [selectedGoalId, setSelectedGoalId] = useState(initialSelectedGoalId);
  const [preferences, setPreferences] = useState<ClientPreferencesDraft>(() =>
    clonePreferences(initialPreferences),
  );
  const [errors, setErrors] = useState<PreferenceErrors>({});
  const [isSaving, setIsSaving] = useState(false);

  const savedState = searchParams.get("saved");
  const savedProfileMessage =
    savedState === "measurements"
      ? "Measurement progress was recorded successfully."
      : savedState === "profile"
        ? "Your profile and measurements were saved successfully."
        : null;

  const filteredGoals = useMemo(() => {
    if (!profileGender || profileGender === "other") {
      return availableGoals;
    }

    return availableGoals.filter(
      (goal) => goal.genderGroup === "all" || goal.genderGroup === profileGender,
    );
  }, [availableGoals, profileGender]);

  const validate = () => {
    const nextErrors: PreferenceErrors = {};

    if (!selectedGoalId) {
      nextErrors.goal = "Select a body goal before submitting.";
    }

    if (
      preferences.medicalConditionIds.includes("other-condition") &&
      !preferences.otherHealthConditionText.trim()
    ) {
      nextErrors.otherHealthConditionText = "Describe the other health condition.";
    }

    if (
      preferences.exerciseDislikeChoice === "yes" &&
      !preferences.dislikedExercises.trim()
    ) {
      nextErrors.dislikedExercises = "List the exercises you want to avoid.";
    }

    if (preferences.foodAllergyChoice === "yes" && !preferences.foodAllergies.trim()) {
      nextErrors.foodAllergies = "List the food allergies.";
    }

    if (
      preferences.foodRestrictionChoice === "yes" &&
      !preferences.foodRestrictions.trim()
    ) {
      nextErrors.foodRestrictions = "Describe the food restrictions.";
    }

    if (preferences.dislikedFoodChoice === "yes" && !preferences.dislikedFoods.trim()) {
      nextErrors.dislikedFoods = "List the foods you dislike.";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const toggleCondition = (conditionId: string) => {
    setPreferences((current) => {
      const selections = current.medicalConditionIds;

      if (conditionId === "none") {
        return {
          ...current,
          medicalConditionIds: ["none"],
          otherHealthConditionText: "",
        };
      }

      const withoutNone = selections.filter((item) => item !== "none");
      const nextSelections = withoutNone.includes(conditionId)
        ? withoutNone.filter((item) => item !== conditionId)
        : [...withoutNone, conditionId];

      return {
        ...current,
        medicalConditionIds: nextSelections,
        otherHealthConditionText: nextSelections.includes("other-condition")
          ? current.otherHealthConditionText
          : "",
      };
    });
  };

  const handleSubmit = async () => {
    if (isSaving) {
      return;
    }

    if (!validate()) {
      return;
    }

    setIsSaving(true);

    try {
      const result = await saveClientPreferencesAction({
        selectedBodyGoalId: selectedGoalId,
        preferences,
      });

      if (!result.success) {
        setErrors(result.errors);
        return;
      }

      setErrors({});
      setSelectedBodyGoal(selectedGoalId);
      updatePreferences(preferences);
      router.push("/assessment");
    } catch {
      setErrors({
        form: "Unable to save your preferences right now. Please try again.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <ClientAuthGate>
      <ClientShell
        title="Choose Your Body Goal"
        subtitle="Goal ID, label, and description will drive future AI planning, not the image."
        backHref="/profile"
      >
        <ClientPage className="space-y-4">
          {savedProfileMessage ? (
            <p className="rounded-2xl border border-[rgba(22,163,74,0.18)] bg-[rgba(22,163,74,0.08)] px-4 py-3 text-sm text-[var(--color-success)]">
              {savedProfileMessage}
            </p>
          ) : null}
          {loadError ? (
            <p className="rounded-2xl border border-[rgba(214,31,44,0.18)] bg-[rgba(214,31,44,0.06)] px-4 py-3 text-sm text-[var(--color-primary)]">
              {loadError}
            </p>
          ) : null}
          {errors.form ? (
            <p className="rounded-2xl border border-[rgba(214,31,44,0.18)] bg-[rgba(214,31,44,0.06)] px-4 py-3 text-sm text-[var(--color-primary)]">
              {errors.form}
            </p>
          ) : null}
          <ClientFormSection
            title="Choose Your Body Goal"
            description="Select the result you want the future plan generator to target."
          >
            {errors.goal ? (
              <p className="text-sm text-[var(--color-error)]">{errors.goal}</p>
            ) : null}
            <div className="grid grid-cols-2 gap-3">
              {filteredGoals.map((goal) => (
                <BodyGoalCard
                  key={goal.id}
                  goal={goal}
                  selected={selectedGoalId === goal.id}
                  onSelect={() => setSelectedGoalId(goal.id)}
                />
              ))}
            </div>
          </ClientFormSection>
          <ClientFormSection
            title="Medical and Injury Conditions"
            description="Select all that apply. Choosing None clears the rest."
          >
            <div className="grid gap-3">
              {healthConditionOptions.map((option) => (
                <ClientSelectionChip
                  key={option.id}
                  label={option.label}
                  selected={preferences.medicalConditionIds.includes(option.id)}
                  onClick={() => toggleCondition(option.id)}
                />
              ))}
            </div>
            {preferences.medicalConditionIds.includes("other-condition") ? (
              <div className="pt-2">
                <Textarea
                  value={preferences.otherHealthConditionText}
                  onChange={(event) =>
                    setPreferences({
                      ...preferences,
                      otherHealthConditionText: event.target.value,
                    })
                  }
                  placeholder="Describe the other health condition"
                  aria-invalid={errors.otherHealthConditionText ? true : undefined}
                  disabled={isSaving}
                />
                {errors.otherHealthConditionText ? (
                  <p className="mt-2 text-sm text-[var(--color-error)]">
                    {errors.otherHealthConditionText}
                  </p>
                ) : null}
              </div>
            ) : null}
          </ClientFormSection>
          <ClientFormSection title="Exercises Disliked">
            <ClientChoiceCards
              options={yesNoneOptions}
              value={preferences.exerciseDislikeChoice}
              onChange={(value) =>
                setPreferences({
                  ...preferences,
                  exerciseDislikeChoice: value as "yes" | "none",
                  dislikedExercises: value === "yes" ? preferences.dislikedExercises : "",
                })
              }
            />
            {preferences.exerciseDislikeChoice === "yes" ? (
              <div className="pt-2">
                <Textarea
                  value={preferences.dislikedExercises}
                  onChange={(event) =>
                    setPreferences({
                      ...preferences,
                      dislikedExercises: event.target.value,
                    })
                  }
                  placeholder="List the exercises you dislike"
                  aria-invalid={errors.dislikedExercises ? true : undefined}
                  disabled={isSaving}
                />
                {errors.dislikedExercises ? (
                  <p className="mt-2 text-sm text-[var(--color-error)]">
                    {errors.dislikedExercises}
                  </p>
                ) : null}
              </div>
            ) : null}
          </ClientFormSection>
          <ClientFormSection title="Food Allergies">
            <ClientChoiceCards
              options={yesNoneOptions}
              value={preferences.foodAllergyChoice}
              onChange={(value) =>
                setPreferences({
                  ...preferences,
                  foodAllergyChoice: value as "yes" | "none",
                  foodAllergies: value === "yes" ? preferences.foodAllergies : "",
                })
              }
            />
            {preferences.foodAllergyChoice === "yes" ? (
              <div className="pt-2">
                <Textarea
                  value={preferences.foodAllergies}
                  onChange={(event) =>
                    setPreferences({
                      ...preferences,
                      foodAllergies: event.target.value,
                    })
                  }
                  placeholder="List the food allergies"
                  aria-invalid={errors.foodAllergies ? true : undefined}
                  disabled={isSaving}
                />
                {errors.foodAllergies ? (
                  <p className="mt-2 text-sm text-[var(--color-error)]">
                    {errors.foodAllergies}
                  </p>
                ) : null}
              </div>
            ) : null}
          </ClientFormSection>
          <ClientFormSection title="Food Restrictions">
            <ClientChoiceCards
              options={yesNoOptions}
              value={preferences.foodRestrictionChoice}
              onChange={(value) =>
                setPreferences({
                  ...preferences,
                  foodRestrictionChoice: value as "yes" | "no",
                  foodRestrictions: value === "yes" ? preferences.foodRestrictions : "",
                })
              }
            />
            {preferences.foodRestrictionChoice === "yes" ? (
              <div className="pt-2">
                <Textarea
                  value={preferences.foodRestrictions}
                  onChange={(event) =>
                    setPreferences({
                      ...preferences,
                      foodRestrictions: event.target.value,
                    })
                  }
                  placeholder="Describe the food restrictions"
                  aria-invalid={errors.foodRestrictions ? true : undefined}
                  disabled={isSaving}
                />
                {errors.foodRestrictions ? (
                  <p className="mt-2 text-sm text-[var(--color-error)]">
                    {errors.foodRestrictions}
                  </p>
                ) : null}
              </div>
            ) : null}
          </ClientFormSection>
          <ClientFormSection title="Foods Disliked">
            <ClientChoiceCards
              options={yesNoOptions}
              value={preferences.dislikedFoodChoice}
              onChange={(value) =>
                setPreferences({
                  ...preferences,
                  dislikedFoodChoice: value as "yes" | "no",
                  dislikedFoods: value === "yes" ? preferences.dislikedFoods : "",
                })
              }
            />
            {preferences.dislikedFoodChoice === "yes" ? (
              <div className="pt-2">
                <Textarea
                  value={preferences.dislikedFoods}
                  onChange={(event) =>
                    setPreferences({
                      ...preferences,
                      dislikedFoods: event.target.value,
                    })
                  }
                  placeholder="List the foods you dislike"
                  aria-invalid={errors.dislikedFoods ? true : undefined}
                  disabled={isSaving}
                />
                {errors.dislikedFoods ? (
                  <p className="mt-2 text-sm text-[var(--color-error)]">
                    {errors.dislikedFoods}
                  </p>
                ) : null}
              </div>
            ) : null}
          </ClientFormSection>
          <div className="grid grid-cols-2 gap-3">
            <Button
              variant="secondary"
              size="lg"
              onClick={() => router.push("/profile")}
              disabled={isSaving}
            >
              Back
            </Button>
            <PrimaryMobileButton
              onClick={handleSubmit}
              loading={isSaving}
              disabled={isSaving}
            >
              {isSaving ? "Saving..." : "Submit"}
            </PrimaryMobileButton>
          </div>
        </ClientPage>
      </ClientShell>
    </ClientAuthGate>
  );
}
