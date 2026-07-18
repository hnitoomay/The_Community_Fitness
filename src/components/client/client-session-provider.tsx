"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from "react";

import { profileDefaults } from "@/data/profile-defaults";
import { authClient } from "@/lib/auth-client";
import type {
  BodyMeasurementsDraft,
  ClientPreferencesDraft,
  ClientProfileDraft,
  HomePreviewMode,
  OnboardingSessionState,
} from "@/types/client-journey";

const STORAGE_KEY = "community-fitness-client-preview";
const sessionListeners = new Set<() => void>();
let sessionStateStore: OnboardingSessionState = profileDefaults;
let hasLoadedSessionState = false;

interface ClientSessionContextValue {
  hydrated: boolean;
  authLoading: boolean;
  isAuthenticated: boolean;
  state: OnboardingSessionState;
  profileComplete: boolean;
  logout: () => Promise<void>;
  setHomePreviewMode: (mode: HomePreviewMode) => void;
  updateProfile: (patch: Partial<ClientProfileDraft>) => void;
  updateMeasurements: (patch: Partial<BodyMeasurementsDraft>) => void;
  setSelectedBodyGoal: (goalId: string) => void;
  updatePreferences: (patch: Partial<ClientPreferencesDraft>) => void;
  toggleMedicalCondition: (conditionId: string) => void;
  setGeneratedPlan: (generated: boolean) => void;
  toggleExerciseCompletion: (date: string, exerciseId: string) => void;
  markWorkoutComplete: (date: string, exerciseIds: string[]) => void;
}

const ClientSessionContext = createContext<ClientSessionContextValue | null>(
  null,
);

function readSessionState() {
  if (typeof window === "undefined") {
    return profileDefaults;
  }

  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);

    if (!raw) {
      return profileDefaults;
    }

    const parsed = JSON.parse(raw) as OnboardingSessionState;

    return {
      ...profileDefaults,
      ...parsed,
      profile: {
        ...profileDefaults.profile,
        ...parsed.profile,
        measurements: {
          ...profileDefaults.profile.measurements,
          ...parsed.profile?.measurements,
        },
      },
      preferences: {
        ...profileDefaults.preferences,
        ...parsed.preferences,
      },
    };
  } catch {
    window.sessionStorage.removeItem(STORAGE_KEY);
    return profileDefaults;
  }
}

function emitSessionState() {
  sessionListeners.forEach((listener) => listener());
}

function subscribeToSessionState(listener: () => void) {
  sessionListeners.add(listener);

  return () => {
    sessionListeners.delete(listener);
  };
}

function writeSessionState(
  nextState:
    | OnboardingSessionState
    | ((current: OnboardingSessionState) => OnboardingSessionState),
) {
  sessionStateStore =
    typeof nextState === "function"
      ? nextState(sessionStateStore)
      : nextState;

  if (typeof window !== "undefined") {
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(sessionStateStore));
  }

  emitSessionState();
}

function loadSessionStateFromStorage() {
  if (typeof window === "undefined" || hasLoadedSessionState) {
    return;
  }

  hasLoadedSessionState = true;
  sessionStateStore = readSessionState();
  emitSessionState();
}

function isProfileComplete(state: OnboardingSessionState) {
  const { profile, selectedBodyGoalId } = state;
  const requiredMeasurementValues = [
    profile.measurements.heightCm,
    profile.measurements.weightKg,
    profile.measurements.waistCm,
    profile.measurements.chestCm,
    profile.measurements.hipCm,
    profile.measurements.armCm,
    profile.measurements.thighCm,
  ];

  return Boolean(
    profile.fullName.trim() &&
      profile.age.trim() &&
      profile.gender &&
      selectedBodyGoalId &&
      requiredMeasurementValues.every((value) => value.trim()),
  );
}

export function ClientSessionProvider({ children }: { children: ReactNode }) {
  const state = useSyncExternalStore(
    subscribeToSessionState,
    () => sessionStateStore,
    () => profileDefaults,
  );
  const { data: authSession, isPending: authLoading } = authClient.useSession();

  useEffect(() => {
    loadSessionStateFromStorage();
  }, []);

  const value = useMemo<ClientSessionContextValue>(() => {
    return {
      hydrated: true,
      authLoading,
      isAuthenticated: Boolean(authSession?.user),
      state,
      profileComplete: isProfileComplete(state),
      logout: async () => {
        const result = await authClient.signOut();

        if (result.error) {
          throw new Error(result.error.message || "Unable to sign out.");
        }

        writeSessionState((current) => ({
          ...profileDefaults,
          homePreviewMode: current.homePreviewMode,
        }));

        if (typeof window !== "undefined") {
          window.sessionStorage.removeItem(STORAGE_KEY);
        }
      },
      setHomePreviewMode: (mode) =>
        writeSessionState((current) => ({ ...current, homePreviewMode: mode })),
      updateProfile: (patch) =>
        writeSessionState((current) => ({
          ...current,
          profile: { ...current.profile, ...patch },
        })),
      updateMeasurements: (patch) =>
        writeSessionState((current) => ({
          ...current,
          profile: {
            ...current.profile,
            measurements: { ...current.profile.measurements, ...patch },
          },
        })),
      setSelectedBodyGoal: (goalId) =>
        writeSessionState((current) => ({ ...current, selectedBodyGoalId: goalId })),
      updatePreferences: (patch) =>
        writeSessionState((current) => ({
          ...current,
          preferences: { ...current.preferences, ...patch },
        })),
      setGeneratedPlan: (generated) =>
        writeSessionState((current) => ({ ...current, generatedPlan: generated })),
      toggleMedicalCondition: (conditionId) =>
        writeSessionState((current) => {
          const selections = current.preferences.medicalConditionIds;

          if (conditionId === "none") {
            return {
              ...current,
              preferences: {
                ...current.preferences,
                medicalConditionIds: ["none"],
                otherHealthConditionText: "",
              },
            };
          }

          const withoutNone = selections.filter((item) => item !== "none");
          const nextSelections = withoutNone.includes(conditionId)
            ? withoutNone.filter((item) => item !== conditionId)
            : [...withoutNone, conditionId];

          return {
            ...current,
            preferences: {
              ...current.preferences,
              medicalConditionIds: nextSelections,
              otherHealthConditionText: nextSelections.includes(
                "other-condition",
              )
                ? current.preferences.otherHealthConditionText
                : "",
            },
          };
        }),
      toggleExerciseCompletion: (date, exerciseId) =>
        writeSessionState((current) => {
          const key = `${date}:${exerciseId}`;
          const exists = current.completedExerciseKeys.includes(key);

          return {
            ...current,
            completedExerciseKeys: exists
              ? current.completedExerciseKeys.filter((item) => item !== key)
              : [...current.completedExerciseKeys, key],
          };
        }),
      markWorkoutComplete: (date, exerciseIds) =>
        writeSessionState((current) => {
          const keys = exerciseIds.map((exerciseId) => `${date}:${exerciseId}`);
          const nextCompletedDates = current.completedWorkoutDates.includes(date)
            ? current.completedWorkoutDates
            : [...current.completedWorkoutDates, date];
          const nextKeys = [
            ...new Set([...current.completedExerciseKeys, ...keys]),
          ];

          return {
            ...current,
            completedWorkoutDates: nextCompletedDates,
            completedExerciseKeys: nextKeys,
          };
        }),
    };
  }, [authLoading, authSession?.user, state]);

  return (
    <ClientSessionContext.Provider value={value}>
      {children}
    </ClientSessionContext.Provider>
  );
}

export function useClientSession() {
  const context = useContext(ClientSessionContext);

  if (!context) {
    throw new Error(
      "useClientSession must be used within ClientSessionProvider",
    );
  }

  return context;
}
