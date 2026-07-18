import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";

const projectRoot = process.cwd();

function readProjectFile(relativePath: string) {
  return readFileSync(path.join(projectRoot, relativePath), "utf8");
}

test("first exercise update creates one session with conflict protection", () => {
  const source = readProjectFile("src/lib/server/repositories/workout-tracking-repository.ts");

  assert.match(source, /INSERT INTO workout_sessions/);
  assert.match(source, /ON CONFLICT \(user_id, plan_day_id\)/);
});

test("refresh preserves completion state by loading saved tracking for the authenticated user", () => {
  const workoutPage = readProjectFile("src/app/(client)/workout/[date]/page.tsx");

  assert.match(
    workoutPage,
    /getWorkoutSessionTrackingForUser\(authUser\.userId, date, parsedPlanId \?\? undefined\)/,
  );
  assert.match(workoutPage, /initialTracking=\{tracking\}/);
});

test("repeated exercise clicks do not create duplicate sessions", () => {
  const source = readProjectFile("src/lib/server/repositories/workout-tracking-repository.ts");

  assert.match(source, /ON CONFLICT \(user_id, plan_day_id\)/);
});

test("one user cannot update another user's workout session", () => {
  const source = readProjectFile("src/lib/server/repositories/workout-tracking-repository.ts");

  assert.match(source, /WHERE gp\.user_id = \$1/);
  assert.match(source, /AND gp\.status = 'active'/);
});

test("invalid generated exercise ids are rejected for the selected plan day", () => {
  const source = readProjectFile("src/lib/server/repositories/workout-tracking-repository.ts");

  assert.match(source, /WHERE gpe\.id = \$1/);
  assert.match(source, /AND gpe\.plan_day_id = \$2/);
  assert.match(source, /throw new Error\("INVALID_GENERATED_PLAN_EXERCISE"\)/);
});

test("exercise toggles automatically promote workout status to completed and set completed_at", () => {
  const source = readProjectFile("src/lib/server/repositories/workout-tracking-repository.ts");

  assert.match(source, /await syncWorkoutSessionStatus\(client, \{/);
  assert.match(source, /WHEN \$2 = \$3 AND \$3 > 0 THEN 'completed'/);
  assert.match(source, /WHEN \$2 = \$3 AND \$3 > 0 THEN CURRENT_TIMESTAMP/);
});

test("unticking an exercise after completion returns the saved session state to in progress", () => {
  const source = readProjectFile("src/lib/server/repositories/workout-tracking-repository.ts");

  assert.match(source, /ELSE 'in_progress'/);
  assert.match(source, /ELSE NULL/);
});

test("manual workout completion button is no longer required by the daily workout screen", () => {
  const source = readProjectFile("src/components/client/screens/workout-day-screen.tsx");

  assert.doesNotMatch(source, />\s*Mark Workout Complete\s*</);
});

test("undo skip restores an editable workout session without deleting generated plan data", () => {
  const source = readProjectFile("src/lib/server/repositories/workout-tracking-repository.ts");

  assert.match(source, /export async function undoSkipWorkoutForUser/);
  assert.match(source, /session\.status !== "skipped"/);
  assert.doesNotMatch(source, /DELETE FROM generated_plan/);
  assert.match(source, /status = 'completed'/);
  assert.match(source, /completed_at = COALESCE\(completed_at, CURRENT_TIMESTAMP\)/);
});

test("skipped workout sessions remain queryable in workout history", () => {
  const source = readProjectFile("src/lib/server/repositories/workout-tracking-repository.ts");

  assert.match(source, /FROM workout_sessions AS ws/);
  assert.match(source, /ws\.status/);
  assert.match(source, /ORDER BY gpd\.plan_date DESC/);
});

test("home page reflects the real workout status for the authenticated user", () => {
  const homePage = readProjectFile("src/app/(client)/home/page.tsx");
  const homeScreen = readProjectFile("src/components/client/screens/home-screen.tsx");

  assert.match(homePage, /getHomeWorkoutPlanPreviewForUser\(authUser\.userId\)/);
  assert.match(homeScreen, /Not Started/);
  assert.match(homeScreen, /In Progress/);
  assert.match(homeScreen, /Completed/);
  assert.match(homeScreen, /Skipped/);
});

test("history page uses real workout session data from the server repository", () => {
  const historyPage = readProjectFile("src/app/(client)/history/page.tsx");
  const historyScreen = readProjectFile("src/components/client/screens/history-screen.tsx");

  assert.match(historyPage, /listWorkoutHistoryForUser\(authUser\.userId\)/);
  assert.match(historyScreen, /workoutHistory\.map/);
  assert.match(historyScreen, /record\.completedExercises/);
  assert.match(historyScreen, /record\.difficultyRating/);
});

test("rest days cannot create workout sessions", () => {
  const repositorySource = readProjectFile("src/lib/server/repositories/workout-tracking-repository.ts");
  const actionSource = readProjectFile("src/app/(client)/workout/[date]/actions.ts");

  assert.match(repositorySource, /if \(context\.day_type === "rest"\)/);
  assert.match(repositorySource, /throw new Error\("REST_DAY_NOT_TRACKABLE"\)/);
  assert.match(actionSource, /Rest days cannot create workout sessions\./);
});

test("workout tracking helper logic remains implemented in the repository", () => {
  const source = readProjectFile("src/lib/server/repositories/workout-tracking-repository.ts");

  assert.match(source, /function calculateCompletionPercent/);
  assert.match(source, /return Math\.round\(\(completedExercises \/ totalExercises\) \* 100\)/);
  assert.match(source, /return sessionStatus \?\? "not_started"/);
  assert.match(source, /const completedExercises = input\.logs\.filter\(\(log\) => log\.completed\)\.length/);
});
