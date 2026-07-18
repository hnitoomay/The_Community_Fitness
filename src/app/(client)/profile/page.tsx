import { ProfileScreen } from "@/components/client/screens/profile-screen";
import { requireAuthenticatedUserOrRedirect } from "@/lib/server/auth";
import { getClientProfilePageData } from "@/lib/server/repositories/client-onboarding-repository";
import type { ClientProfilePageData } from "@/types/client-onboarding";

function buildProfileKey(profileData: ClientProfilePageData) {
  return JSON.stringify(profileData);
}

export default async function ProfilePage() {
  const authUser = await requireAuthenticatedUserOrRedirect("/profile");
  let initialData: ClientProfilePageData = {
    basicProfile: {
      fullName: "",
      gender: "",
      dateOfBirth: "",
      currentAge: null,
      usesLegacyAgeFallback: false,
    },
    measurements: {
      heightCm: "",
      weightKg: "",
      waistCm: "",
      chestCm: "",
      hipCm: "",
      armCm: "",
      thighCm: "",
      bodyFatPercentage: "",
    },
  };
  let loadError: string | undefined;

  try {
    initialData = await getClientProfilePageData(authUser.userId);
  } catch {
    loadError = "Unable to load your saved profile right now.";
  }

  return (
    <ProfileScreen
      key={buildProfileKey(initialData)}
      initialData={initialData}
      loadError={loadError}
    />
  );
}
