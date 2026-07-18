import { MeasurementUpdateScreen } from "@/components/client/screens/measurement-update-screen";
import { requireAuthenticatedUser } from "@/lib/server/auth";
import { getLatestMeasurementSnapshotForUser } from "@/lib/server/repositories/profile-settings-repository";

export default async function NewMeasurementPage() {
  const authUser = await requireAuthenticatedUser();
  const initialData = await getLatestMeasurementSnapshotForUser(authUser.userId);

  return <MeasurementUpdateScreen initialData={initialData} />;
}
