import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";

const projectRoot = process.cwd();

function readProjectFile(relativePath: string) {
  return readFileSync(path.join(projectRoot, relativePath), "utf8");
}

test("today is selected by default when it belongs to the active plan", () => {
  const source = readProjectFile("src/components/client/screens/home-screen.tsx");

  assert.match(source, /const hasToday = activePlanPreview\.days\.some/);
  assert.match(source, /return todayDateOnly;/);
});

test("selecting another date updates the workout preview on the same home page", () => {
  const source = readProjectFile("src/components/client/screens/home-screen.tsx");

  assert.match(source, /const \[selectedDate, setSelectedDate\] = useState/);
  assert.match(source, /setSelectedDate\(item\.date\)/);
  assert.match(source, /const selectedDay = daysByDate\.get\(selectedDate\) \?\? null/);
});

test("date-only values are derived with date-only helpers and do not rely on toISOString", () => {
  const pageSource = readProjectFile("src/app/(client)/home/page.tsx");
  const screenSource = readProjectFile("src/components/client/screens/home-screen.tsx");

  assert.match(pageSource, /getTodayDateOnly\("Asia\/Rangoon"\)/);
  assert.match(screenSource, /addDaysDateOnly\(selectedDate, index - 3\)/);
  assert.doesNotMatch(screenSource, /toISOString\(/);
});

test("completely new users are routed to Personal Profile as the current setup step", () => {
  const repositorySource = readProjectFile("src/lib/server/repositories/home-workout-repository.ts");

  assert.match(repositorySource, /if \(!hasAnyAssessment && !hasAnyGeneratedPlan\) \{/);
  assert.match(repositorySource, /if \(!hasProfile\) \{/);
  assert.match(repositorySource, /const nextStepId: HomeSetupStepId = "personal_profile"/);
  assert.match(repositorySource, /primaryActionLabel: "Complete Personal Profile"/);
  assert.match(repositorySource, /primaryActionHref: "\/settings\/profile"/);
});

test("users with profile but no measurements are routed to Measurements and Goal", () => {
  const repositorySource = readProjectFile("src/lib/server/repositories/home-workout-repository.ts");

  assert.match(repositorySource, /if \(!hasMeasurementsAndGoal\) \{/);
  assert.match(repositorySource, /const nextStepId: HomeSetupStepId = "measurements_goal"/);
  assert.match(repositorySource, /primaryActionLabel: "Complete Measurements & Goal"/);
  assert.match(repositorySource, /primaryActionHref: "\/profile"/);
});

test("users with profile data but no current assessment are routed to AI Assessment", () => {
  const repositorySource = readProjectFile("src/lib/server/repositories/home-workout-repository.ts");

  assert.match(repositorySource, /const isAssessmentCurrent = Boolean\(/);
  assert.match(repositorySource, /kind: "first_time_setup"/);
  assert.match(repositorySource, /const nextStepId: HomeSetupStepId = "ai_assessment"/);
});

test("users with current assessment but no current plan are routed to One-Month Plan", () => {
  const repositorySource = readProjectFile("src/lib/server/repositories/home-workout-repository.ts");

  assert.match(repositorySource, /kind: "returning_assessment_only"/);
  assert.match(repositorySource, /primaryActionLabel: "Generate One-Month Plan"/);
  assert.match(repositorySource, /primaryActionHref: "\/assessment"/);
});

test("outdated assessments do not trigger onboarding and only create dashboard notices", () => {
  const repositorySource = readProjectFile("src/lib/server/repositories/home-workout-repository.ts");
  const screenSource = readProjectFile("src/components/client/screens/home-screen.tsx");

  assert.match(repositorySource, /input\.currentInputHash === input\.latestAssessmentInputHash/);
  assert.match(repositorySource, /actionLabel: "Update Assessment"/);
  assert.match(screenSource, /homeState\.dashboardNotice/);
});

test("outdated plans do not trigger onboarding and only create dashboard notices", () => {
  const repositorySource = readProjectFile("src/lib/server/repositories/home-workout-repository.ts");

  assert.match(repositorySource, /input\.currentInputHash === input\.activePlanSourceInputHash/);
  assert.match(repositorySource, /actionLabel: "Review Update"/);
  assert.match(repositorySource, /kind: "active_plan"/);
});

test("real generated exercises are loaded in sequence order with equipment labels", () => {
  const repositorySource = readProjectFile("src/lib/server/repositories/home-workout-repository.ts");

  assert.match(repositorySource, /ORDER BY gpd\.plan_date ASC, gpe\.sequence_number ASC, gpe\.id ASC/);
  assert.match(repositorySource, /equipmentNames\.length > 0 \? equipmentNames\.join\(", "\) : "Bodyweight"/);
});

test("all exercises are rendered and the +N more text is removed from the selected-day card", () => {
  const source = readProjectFile("src/components/client/screens/home-screen.tsx");

  assert.match(source, /selectedDay\.exercises\.map/);
  assert.doesNotMatch(source, /\+\s*\{hiddenExerciseCount\}\s*more exercises/);
  assert.doesNotMatch(source, /visibleExercises/);
  assert.doesNotMatch(source, /hiddenExerciseCount/);
});

test("the selected-day exercise list becomes vertically scrollable when it is long", () => {
  const source = readProjectFile("src/components/client/screens/home-screen.tsx");

  assert.match(source, /data-testid="selected-day-exercise-list"/);
  assert.match(source, /max-h-\[300px\]/);
  assert.match(source, /overflow-y-auto/);
  assert.match(source, /overflow-x-hidden/);
  assert.match(source, /aria-label="Exercises for selected workout"/);
});

test("the workout progress summary remains outside the exercise scroll area", () => {
  const source = readProjectFile("src/components/client/screens/home-screen.tsx");

  assert.match(source, /data-testid="selected-day-progress-summary"/);
  assert.match(source, /Workout progress/);
  assert.match(source, /selectedDay\.completedExercises} of \{selectedDay\.totalExercises} completed/);
});

test("status card and primary action reflect real workout tracking state", () => {
  const source = readProjectFile("src/components/client/screens/home-screen.tsx");

  assert.match(source, /This workout has not been started yet\./);
  assert.match(source, /This workout was completed\./);
  assert.match(source, /This workout was skipped\./);
  assert.match(source, /Continue Workout/);
  assert.match(source, /View Completed Workout/);
});

test("rest days hide the start workout button and do not create a workout action", () => {
  const source = readProjectFile("src/components/client/screens/home-screen.tsx");

  assert.match(source, /selectedDay\.dayType === "rest" \?/);
  assert.match(source, /selectedDay\.dayType !== "rest" \?/);
  assert.match(source, /This date is scheduled as recovery time\./);
  assert.match(source, /Take time to recover\./);
});

test("start workout links to the exact selected date", () => {
  const source = readProjectFile("src/components/client/screens/home-screen.tsx");

  assert.match(source, /href=\{buildDailyPlanHref\(selectedDay\.planDate, "workout"\)\}/);
});

test("the selected-day mobile layout avoids horizontal overflow in the exercise list", () => {
  const source = readProjectFile("src/components/client/screens/home-screen.tsx");

  assert.match(source, /min-w-0 flex-1/);
  assert.match(source, /overflow-x-hidden/);
  assert.match(source, /pr-2/);
});

test("new-user home shows the setup card, welcome heading, and benefit preview", () => {
  const screenSource = readProjectFile("src/components/client/screens/home-screen.tsx");
  const repositorySource = readProjectFile("src/lib/server/repositories/home-workout-repository.ts");

  assert.match(screenSource, /Welcome, \$\{firstName\}/);
  assert.match(screenSource, /Your Setup/);
  assert.match(repositorySource, /title: "Personal Profile"/);
  assert.match(repositorySource, /title: "Measurements & Goal"/);
  assert.match(repositorySource, /title: "AI Assessment"/);
  assert.match(repositorySource, /title: "One-Month Plan"/);
  assert.match(screenSource, /Personalized Workout/);
  assert.match(screenSource, /Nutrition Guidance/);
  assert.match(screenSource, /Progress Tracking/);
});

test("completed users keep the normal workout home page and do not see the setup card", () => {
  const pageSource = readProjectFile("src/app/(client)/home/page.tsx");
  const screenSource = readProjectFile("src/components/client/screens/home-screen.tsx");

  assert.match(pageSource, /const homeState = await getHomeSetupStateForUser\(authUser\.userId\)/);
  assert.match(pageSource, /homeState\.kind === "active_plan"/);
  assert.match(screenSource, /if \(homeState\.kind === "first_time_setup"\) \{/);
  assert.match(screenSource, /const title = `Good Morning, \$\{firstName\}`/);
  assert.match(screenSource, /data-testid="home-date-selector"/);
});

test("signing out and back in does not reset completed onboarding because home state is loaded from server data", () => {
  const pageSource = readProjectFile("src/app/(client)/home/page.tsx");
  const screenSource = readProjectFile("src/components/client/screens/home-screen.tsx");

  assert.match(pageSource, /requireAuthenticatedUser\(/);
  assert.match(pageSource, /getHomeSetupStateForUser\(authUser\.userId\)/);
  assert.doesNotMatch(screenSource, /sessionStorage|localStorage/);
});

test("assessment history without an active plan shows a compact returning Generate Plan state", () => {
  const screenSource = readProjectFile("src/components/client/screens/home-screen.tsx");
  const repositorySource = readProjectFile("src/lib/server/repositories/home-workout-repository.ts");

  assert.match(repositorySource, /kind: "returning_assessment_only"/);
  assert.match(screenSource, /ReturningStateHome/);
  assert.match(screenSource, /Generate One-Month Plan/);
});

test("archived plan history without an active plan shows a returning no-active-plan state", () => {
  const screenSource = readProjectFile("src/components/client/screens/home-screen.tsx");
  const repositorySource = readProjectFile("src/lib/server/repositories/home-workout-repository.ts");

  assert.match(repositorySource, /has_archived_plan/);
  assert.match(repositorySource, /kind: "returning_no_active_plan"/);
  assert.match(screenSource, /Create New One-Month Plan/);
  assert.match(screenSource, /View Plan History/);
});

test("measurement and preference changes no longer bring back the first-time setup card after history exists", () => {
  const repositorySource = readProjectFile("src/lib/server/repositories/home-workout-repository.ts");

  assert.doesNotMatch(repositorySource, /showSetup = !isAssessmentCurrent \|\| !isPlanCurrent/);
  assert.doesNotMatch(repositorySource, /showSetup = !activePlan/);
  assert.match(repositorySource, /if \(!hasAnyAssessment && !hasAnyGeneratedPlan\) \{/);
});

test("home page does not call OpenRouter and only loads the authenticated user's plan", () => {
  const pageSource = readProjectFile("src/app/(client)/home/page.tsx");
  const repositorySource = readProjectFile("src/lib/server/repositories/home-workout-repository.ts");

  assert.doesNotMatch(pageSource, /openrouter/i);
  assert.doesNotMatch(repositorySource, /openrouter/i);
  assert.match(pageSource, /requireAuthenticatedUser\(/);
  assert.match(repositorySource, /WHERE au\.id = \$1/);
  assert.match(repositorySource, /WHERE gp\.user_id = \$1/);
  assert.match(repositorySource, /AND gp\.status = 'active'/);
});
