import assert from "node:assert/strict";
import test from "node:test";

import { __testing__ } from "@/lib/client-navigation-state";

const {
  buildDailyPlanHref,
  extractWorkoutRouteDate,
  getClientNavigationState,
  normalizeDailyPlanTab,
} = __testing__;

test("/workout/2026-07-15 defaults to Workout", () => {
  const state = getClientNavigationState({
    pathname: "/workout/2026-07-15",
    tab: null,
  });

  assert.equal(state.normalizedTab, "workout");
  assert.equal(state.activeDestination, "workout");
});

test("?tab=workout shows Workout", () => {
  const state = getClientNavigationState({
    pathname: "/workout/2026-07-15",
    tab: "workout",
  });

  assert.equal(state.normalizedTab, "workout");
  assert.equal(state.activeDestination, "workout");
});

test("?tab=nutrition shows Nutrition", () => {
  const state = getClientNavigationState({
    pathname: "/workout/2026-07-15",
    tab: "nutrition",
  });

  assert.equal(state.normalizedTab, "nutrition");
  assert.equal(state.activeDestination, "nutrition");
});

test("invalid tab defaults to Workout", () => {
  assert.equal(normalizeDailyPlanTab("invalid"), "workout");
});

test("only one bottom-navigation destination is active", () => {
  const workoutState = getClientNavigationState({
    pathname: "/workout/2026-07-15",
    tab: "workout",
  });
  const nutritionState = getClientNavigationState({
    pathname: "/workout/2026-07-15",
    tab: "nutrition",
  });

  assert.equal(workoutState.activeDestination, "workout");
  assert.notEqual(workoutState.activeDestination, "nutrition");
  assert.equal(nutritionState.activeDestination, "nutrition");
  assert.notEqual(nutritionState.activeDestination, "workout");
});

test("date-only values do not shift when workout hrefs are built", () => {
  assert.equal(
    buildDailyPlanHref("2026-07-15", "nutrition"),
    "/workout/2026-07-15?tab=nutrition",
  );
  assert.equal(extractWorkoutRouteDate("/workout/2026-07-15"), "2026-07-15");
});
