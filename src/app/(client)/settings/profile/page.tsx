import { EditProfileScreen } from "@/components/client/screens/edit-profile-screen";
import { requireAuthenticatedUser } from "@/lib/server/auth";
import { getEditableProfileForUser } from "@/lib/server/repositories/profile-settings-repository";
import { redirect } from "next/navigation";

export default async function SettingsProfilePage() {
  const authUser = await requireAuthenticatedUser();
  const profileData = await getEditableProfileForUser(authUser.userId);

  if (!profileData) {
    redirect("/settings");
  }

  return <EditProfileScreen initialData={profileData} />;
}
