import { SettingsScreen } from "@/components/client/screens/settings-screen";
import { requireAuthenticatedUser } from "@/lib/server/auth";
import { getSettingsAccountStateForUser } from "@/lib/server/repositories/profile-settings-repository";

export default async function SettingsPage() {
  const authUser = await requireAuthenticatedUser();
  const accountState = await getSettingsAccountStateForUser(authUser.userId);

  return <SettingsScreen hasCredentialAccount={accountState.hasCredentialAccount} />;
}
