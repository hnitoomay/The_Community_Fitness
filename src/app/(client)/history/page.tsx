import { HistoryScreen } from "@/components/client/screens/history-screen";
import { requireAuthenticatedUser } from "@/lib/server/auth";
import {
  getMeasurementHistoryForUser,
  listGeneratedPlanHistoryForUser,
} from "@/lib/server/repositories/progress-history-repository";
import { listWorkoutHistoryForUser } from "@/lib/server/repositories/workout-tracking-repository";

export default async function HistoryPage() {
  const authUser = await requireAuthenticatedUser();
  const [workoutHistory, measurementHistory, planHistory] = await Promise.all([
    listWorkoutHistoryForUser(authUser.userId),
    getMeasurementHistoryForUser(authUser.userId),
    listGeneratedPlanHistoryForUser(authUser.userId, { includeFailed: true }),
  ]);

  return (
    <HistoryScreen
      workoutHistory={workoutHistory}
      measurementHistory={measurementHistory}
      planHistory={planHistory}
    />
  );
}
