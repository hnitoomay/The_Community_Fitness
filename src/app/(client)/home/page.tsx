import { HomeScreen } from "@/components/client/screens/home-screen";
import { getTodayDateOnly } from "@/lib/date-only";
import { requireAuthenticatedUser } from "@/lib/server/auth";
import {
  getHomeSetupStateForUser,
  getHomeWorkoutPlanPreviewForUser,
} from "@/lib/server/repositories/home-workout-repository";

export default async function HomePage() {
  const authUser = await requireAuthenticatedUser();
  const today = getTodayDateOnly("Asia/Rangoon");
  const homeState = await getHomeSetupStateForUser(authUser.userId);
  const workoutPlanPreview =
    homeState.kind === "active_plan"
      ? await getHomeWorkoutPlanPreviewForUser(authUser.userId)
      : null;

  return (
    <HomeScreen
      firstName={authUser.session.user.name?.trim().split(" ")[0] || "Athlete"}
      homeState={homeState}
      activePlanPreview={workoutPlanPreview}
      todayDateOnly={today}
    />
  );
}
