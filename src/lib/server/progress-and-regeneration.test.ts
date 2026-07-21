import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";

const projectRoot = process.cwd();

function readProjectFile(relativePath: string) {
  return readFileSync(path.join(projectRoot, relativePath), "utf8");
}

test("measurement history loads newest first from PostgreSQL", () => {
  const source = readProjectFile("src/lib/server/repositories/progress-history-repository.ts");

  assert.match(source, /FROM body_measurements AS bm/);
  assert.match(source, /ORDER BY bm\.measured_at DESC NULLS LAST, bm\.created_at DESC, bm\.id DESC/);
});

test("measurement progress differences are calculated from the previous saved record", () => {
  const helperSource = readProjectFile("src/lib/measurement-progress.ts");

  assert.match(helperSource, /return Math\.round\(value \* 10\) \/ 10/);
  assert.match(helperSource, /current - previous/);
  assert.match(helperSource, /const previousEntry = entries\[index \+ 1\] \?\? null/);
});

test("nullable body-fat values are handled safely", () => {
  const helperSource = readProjectFile("src/lib/measurement-progress.ts");

  assert.match(helperSource, /if \(current === null \|\| previous === null\)/);
  assert.match(helperSource, /return null/);
});

test("unchanged measurements create no new row and changed measurements create one new row", () => {
  const source = readProjectFile("src/lib/server/repositories/client-onboarding-repository.ts");

  assert.match(source, /const shouldInsertMeasurement =/);
  assert.match(source, /!measurementsAreEqual\(normalizedInputMeasurement, normalizedLatestMeasurement\)/);
  assert.match(source, /if \(shouldInsertMeasurement\) \{\s*await insertBodyMeasurement/s);
});

test("profile changes mark the latest AI assessment as outdated", () => {
  const pageSource = readProjectFile("src/app/(client)/assessment/page.tsx");
  const viewStateSource = readProjectFile("src/lib/assessment-view-state.ts");

  assert.match(pageSource, /isAssessmentOutdated\(latestAssessment\?\.inputHash, inputHash\)/);
  assert.match(viewStateSource, /kind: "outdated" \| "legacy"/);
  assert.match(
    viewStateSource,
    /label: "AI အကြံပြုချက် ရယူမည်" \| "AI အကြံပြုချက်အသစ် ရယူမည်"/,
  );
});

test("profile changes mark the active plan as outdated on assessment, calendar, and home", () => {
  const assessmentPage = readProjectFile("src/app/(client)/assessment/page.tsx");
  const calendarPage = readProjectFile("src/app/(client)/calendar/page.tsx");
  const homeRepository = readProjectFile("src/lib/server/repositories/home-workout-repository.ts");

  assert.match(assessmentPage, /activePlan\.plan\.sourceInputHash !== inputHash/);
  assert.match(calendarPage, /planData\.plan\.sourceInputHash !== currentInputHash/);
  assert.match(homeRepository, /input\.currentInputHash === input\.activePlanSourceInputHash/);
  assert.match(homeRepository, /dashboardNotice: buildDashboardNotice/);
});

test("opening assessment and calendar does not call AI automatically", () => {
  const assessmentPage = readProjectFile("src/app/(client)/assessment/page.tsx");
  const calendarPage = readProjectFile("src/app/(client)/calendar/page.tsx");

  assert.doesNotMatch(assessmentPage, /generateAndStoreAssessment\(/);
  assert.doesNotMatch(assessmentPage, /fetch\(OPENROUTER/i);
  assert.doesNotMatch(calendarPage, /generatePlanAction\(/);
  assert.doesNotMatch(calendarPage, /fetch\(OPENROUTER/i);
});

test("calendar outdated state keeps the old plan visible and links users to assessment", () => {
  const calendarScreen = readProjectFile("src/components/client/screens/calendar-screen.tsx");

  assert.match(calendarScreen, /OUTDATED_PLAN_MESSAGE/);
  assert.match(calendarScreen, /Link href="\/assessment"/);
  assert.match(calendarScreen, />\s*Assessment\s*</);
});

test("calendar no longer asks the user to update measurements again", () => {
  const calendarScreen = readProjectFile("src/components/client/screens/calendar-screen.tsx");

  assert.doesNotMatch(calendarScreen, /Update Measurements/);
  assert.doesNotMatch(calendarScreen, /Generate a current AI assessment first/);
});

test("outdated assessment shows assessment regeneration as the next action", () => {
  const assessmentScreen = readProjectFile("src/components/client/screens/assessment-screen.tsx");
  const viewStateSource = readProjectFile("src/lib/assessment-view-state.ts");

  assert.match(assessmentScreen, /primaryAction\.kind === "assessment"/);
  assert.match(viewStateSource, /actionLabel: "AI အကြံပြုချက်အသစ် ရယူမည်"/);
  assert.doesNotMatch(assessmentScreen, /Generate AI Assessment Again/);
});

test("updated assessment enables exactly one plan-generation action", () => {
  const assessmentScreen = readProjectFile("src/components/client/screens/assessment-screen.tsx");
  const viewStateSource = readProjectFile("src/lib/assessment-view-state.ts");

  assert.match(viewStateSource, /label: "Generate new plan" \| "Generate Updated One-Month Plan"/);
  assert.match(assessmentScreen, /primaryAction\.kind === "plan"/);
  assert.doesNotMatch(assessmentScreen, /Generate Updated Plan/);
});

test("unavailable edit plan action is removed and current plans prefer view current plan", () => {
  const assessmentScreen = readProjectFile("src/components/client/screens/assessment-screen.tsx");
  const calendarScreen = readProjectFile("src/components/client/screens/calendar-screen.tsx");
  const viewStateSource = readProjectFile("src/lib/assessment-view-state.ts");

  assert.match(viewStateSource, /label: "View Current Plan"/);
  assert.match(assessmentScreen, /primaryAction\.kind === "calendar"/);
  assert.doesNotMatch(calendarScreen, /Edit Plan/);
});

test("measurement save success sends the user back to assessment review", () => {
  const measurementActions = readProjectFile("src/app/(client)/measurements/new/actions.ts");
  const measurementScreen = readProjectFile("src/components/client/screens/measurement-update-screen.tsx");

  assert.match(
    measurementActions,
    /message:\s*result\.didInsertMeasurement\s*\?\s*"Measurement updated"/,
  );
  assert.match(measurementScreen, /Assessment/);
  assert.match(measurementScreen, /router\.push\("\/assessment"\)/);
});

test("failed regeneration keeps the previous plan active and successful regeneration archives the old plan", () => {
  const serviceSource = readProjectFile("src/lib/server/services/plan-generation-service.ts");
  const repositorySource = readProjectFile("src/lib/server/repositories/generated-plan-repository.ts");

  assert.match(serviceSource, /markGeneratedPlanFailed/);
  assert.match(serviceSource, /activateGeneratedPlan\(/);
  assert.match(repositorySource, /SET status = 'archived'/);
  assert.match(repositorySource, /SET\s+status = 'active'/);
});

test("workout completion history remains linked to the old plan", () => {
  const migrationSource = readProjectFile("database/migrations/009_workout_tracking.sql");
  const repositorySource = readProjectFile("src/lib/server/repositories/generated-plan-repository.ts");

  assert.match(migrationSource, /REFERENCES generated_plans \(id\)/);
  assert.match(repositorySource, /WHERE user_id = \$1\s+AND status = 'active'\s+AND id <> \$2/s);
});

test("previous plans are read-only and one user cannot view another user's plan", () => {
  const workoutPage = readProjectFile("src/app/(client)/workout/[date]/page.tsx");
  const workoutScreen = readProjectFile("src/components/client/screens/workout-day-screen.tsx");
  const repositorySource = readProjectFile("src/lib/server/repositories/generated-plan-repository.ts");

  assert.match(workoutPage, /isPlanReadOnly=\{dayDetails\.plan\.status !== "active"\}/);
  assert.match(workoutScreen, /Previous plans are read-only/);
  assert.match(repositorySource, /WHERE gp\.user_id = \$1/);
  assert.match(repositorySource, /OR gp\.id = \$2/);
  assert.match(repositorySource, /OR gp\.id = \$3/);
});

test("plan history and measurement history are connected to real repositories", () => {
  const historyPage = readProjectFile("src/app/(client)/history/page.tsx");

  assert.match(historyPage, /getMeasurementHistoryForUser\(authUser\.userId\)/);
  assert.match(historyPage, /listGeneratedPlanHistoryForUser\(authUser\.userId, \{ includeFailed: true \}\)/);
});
