import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";

const projectRoot = process.cwd();

function readProjectFile(relativePath: string) {
  return readFileSync(path.join(projectRoot, relativePath), "utf8");
}

test("assessment, calendar, and daily pages require authenticated users", () => {
  const assessmentPage = readProjectFile("src/app/(client)/assessment/page.tsx");
  const calendarPage = readProjectFile("src/app/(client)/calendar/page.tsx");
  const workoutPage = readProjectFile("src/app/(client)/workout/[date]/page.tsx");

  assert.match(assessmentPage, /requireAuthenticatedUser\(/);
  assert.match(calendarPage, /requireAuthenticatedUser\(/);
  assert.match(workoutPage, /requireAuthenticatedUser\(/);
});

test("calendar and daily plan load authenticated user's generated plan data", () => {
  const calendarPage = readProjectFile("src/app/(client)/calendar/page.tsx");
  const workoutPage = readProjectFile("src/app/(client)/workout/[date]/page.tsx");

  assert.match(
    calendarPage,
    /getActiveGeneratedPlanCalendarForUser\(authUser\.userId,\s*parsedPlanId \?\? undefined\)/,
  );
  assert.match(
    workoutPage,
    /getGeneratedPlanDayDetailsForUser\(authUser\.userId, date, parsedPlanId \?\? undefined\)/,
  );
});

test("daily plan normalizes the tab query without 404ing on invalid values", () => {
  const workoutPage = readProjectFile("src/app/(client)/workout/[date]/page.tsx");

  assert.match(workoutPage, /normalizeDailyPlanTab\(tab\)/);
  assert.match(workoutPage, /initialTab=\{normalizedTab\}/);
});

test("opening or refreshing calendar does not call OpenRouter", () => {
  const calendarPage = readProjectFile("src/app/(client)/calendar/page.tsx");
  const calendarScreen = readProjectFile("src/components/client/screens/calendar-screen.tsx");

  assert.doesNotMatch(calendarPage, /openrouter/i);
  assert.doesNotMatch(calendarPage, /fetch\(OPENROUTER/i);
  assert.doesNotMatch(calendarScreen, /fetch\(OPENROUTER/i);
});

test("regeneration checks duplicate in-progress plans before creating another", () => {
  const serviceSource = readProjectFile("src/lib/server/services/plan-generation-service.ts");

  assert.match(serviceSource, /markStaleGeneratingPlansFailed/);
  assert.match(serviceSource, /findGeneratingPlanForUser/);
  assert.match(serviceSource, /duplicate-generation/);
});

test("failed generation keeps the current active plan untouched until activation succeeds", () => {
  const serviceSource = readProjectFile("src/lib/server/services/plan-generation-service.ts");
  const repositorySource = readProjectFile(
    "src/lib/server/repositories/generated-plan-repository.ts",
  );

  assert.match(serviceSource, /assertWorkoutWeekValid/);
  assert.match(serviceSource, /expandBaseWeekToFourWeeks/);
  assert.match(serviceSource, /validateNutritionPlanResponse/);
  assert.match(serviceSource, /activateGeneratedPlan/);
  assert.match(repositorySource, /SET status = 'archived'/);
  assert.match(repositorySource, /SET\s+status = 'active'/);
});

test("timeout or provider failure marks the new plan failed without partial day inserts", () => {
  const serviceSource = readProjectFile("src/lib/server/services/plan-generation-service.ts");
  const repositorySource = readProjectFile(
    "src/lib/server/repositories/generated-plan-repository.ts",
  );

  assert.match(serviceSource, /WORKOUT_REQUEST_TIMEOUT/);
  assert.match(serviceSource, /markGeneratedPlanFailed/);
  assert.match(serviceSource, /createFallbackWorkoutWeek/);
  assert.match(repositorySource, /INVALID_PLAN_DAY_INSERT_COUNT/);
});

test("successful generation still saves exactly 28 plan days and one active plan", () => {
  const repositorySource = readProjectFile(
    "src/lib/server/repositories/generated-plan-repository.ts",
  );

  assert.match(repositorySource, /if \(input\.days\.length !== 28\)/);
  assert.match(repositorySource, /if \(insertedPlanDayCount !== 28\)/);
  assert.match(repositorySource, /SET\s+status = 'active'/);
});

test("one user cannot access another user's plan by changing the URL", () => {
  const repositorySource = readProjectFile(
    "src/lib/server/repositories/generated-plan-repository.ts",
  );

  assert.match(repositorySource, /WHERE gp\.user_id = \$1/);
  assert.match(repositorySource, /AND gp\.status = 'active'/);
});

test("calendar view daily plan opens the workout tab explicitly", () => {
  const calendarScreen = readProjectFile("src/components/client/screens/calendar-screen.tsx");

  assert.match(calendarScreen, /buildDailyPlanHref\(planDate, "workout"/);
  assert.match(calendarScreen, /View Daily Plan/);
});

test("workout tab updates the url and nutrition tab updates the url without losing the date", () => {
  const workoutScreen = readProjectFile("src/components/client/screens/workout-day-screen.tsx");

  assert.match(workoutScreen, /router\.replace\(buildDayHref\(dayDetails\.day\.planDate, nextTab\)/);
  assert.match(workoutScreen, /buildDailyPlanHref\(planDate, tab, readOnlyPlanId\)/);
});

test("workout day header removes the back button and adds a direct calendar shortcut without tab query params", () => {
  const workoutScreen = readProjectFile("src/components/client/screens/workout-day-screen.tsx");
  const clientHeader = readProjectFile("src/components/client/client-header.tsx");

  assert.match(workoutScreen, /titleRowAction=\{calendarShortcut\}/);
  assert.match(workoutScreen, /headerTitleSize="compact"/);
  assert.match(workoutScreen, /href="\/calendar"/);
  assert.match(workoutScreen, /aria-label="Open workout calendar"/);
  assert.doesNotMatch(workoutScreen, /backHref=\{readOnlyPlanId \? `\/calendar\?planId=/);
  assert.match(clientHeader, /titleRowAction/);
  assert.match(clientHeader, /titleSize === "compact" \? "text-sm" : "text-xl"/);
});

test("nutrition bottom navigation never points to a nonexistent nutrition route", () => {
  const navigationData = readProjectFile("src/data/client.ts");
  const navigationComponent = readProjectFile("src/components/client/client-bottom-navigation.tsx");

  assert.doesNotMatch(navigationData, /\/nutrition/);
  assert.match(navigationComponent, /resolvedDailyPlanTargets\.nutritionHref/);
  assert.match(navigationComponent, /fetch\("\/api\/client-navigation\/daily-plan-target"/);
});

test("nutrition bottom navigation preserves the current workout date", () => {
  const navigationComponent = readProjectFile("src/components/client/client-bottom-navigation.tsx");

  assert.match(
    navigationComponent,
    /buildDailyPlanHref\(\s*navigationState\.workoutRouteDate,\s*"nutrition"/,
  );
  assert.match(
    navigationComponent,
    /buildDailyPlanHref\(\s*navigationState\.workoutRouteDate,\s*"workout"/,
  );
});

test("no active plan sends workout and nutrition bottom navigation to calendar", () => {
  const navigationRoute = readProjectFile(
    "src/app/api/client-navigation/daily-plan-target/route.ts",
  );

  assert.match(navigationRoute, /workoutHref: "\/calendar"/);
  assert.match(navigationRoute, /nutritionHref: "\/calendar"/);
});
