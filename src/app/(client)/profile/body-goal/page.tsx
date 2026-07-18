import { Suspense } from "react";

import { BodyGoalPreferencesScreen } from "@/components/client/screens/body-goal-preferences-screen";
import { bodyGoals } from "@/data/body-goals";
import { profileDefaults } from "@/data/profile-defaults";
import { requireAuthenticatedUserOrRedirect } from "@/lib/server/auth";
import {
  getClientOnboardingSnapshot,
  listActiveClientBodyGoals,
} from "@/lib/server/repositories/client-onboarding-repository";

export default async function BodyGoalPage() {
  const authUser = await requireAuthenticatedUserOrRedirect("/profile/body-goal");
  let availableGoals = bodyGoals;
  let initialSelectedGoalId = profileDefaults.selectedBodyGoalId;
  let initialPreferences = profileDefaults.preferences;
  let profileGender = profileDefaults.profile.gender;
  let loadError: string | undefined;

  try {
    const [snapshot, activeGoals] = await Promise.all([
      getClientOnboardingSnapshot(authUser.userId),
      listActiveClientBodyGoals(),
    ]);

    availableGoals = activeGoals;
    initialSelectedGoalId = snapshot.selectedBodyGoalId;
    initialPreferences = snapshot.preferences;
    profileGender = snapshot.profile.gender;
  } catch {
    loadError = "Unable to load your saved body-goal preferences right now.";
  }

  return (
    <Suspense fallback={<div className="px-4 py-6 text-sm text-zinc-500">Loading...</div>}>
      <BodyGoalPreferencesScreen
        availableGoals={availableGoals}
        initialSelectedGoalId={initialSelectedGoalId}
        initialPreferences={initialPreferences}
        profileGender={profileGender}
        loadError={loadError}
      />
    </Suspense>
  );
}
