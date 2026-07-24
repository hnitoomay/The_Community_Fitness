import assert from "node:assert/strict";
import test from "node:test";

import { formatExercisePrescription } from "@/lib/format-exercise-prescription";

test("formats strength prescriptions as sets by reps", () => {
  assert.equal(formatExercisePrescription(3, "12 reps"), "3 sets \u00d7 12 reps");
  assert.equal(
    formatExercisePrescription(4, "10 reps per side"),
    "4 sets \u00d7 10 reps per side",
  );
});

test("formats interval prescriptions as rounds by duration", () => {
  assert.equal(
    formatExercisePrescription(4, "45 seconds"),
    "4 rounds \u00d7 45 seconds",
  );
  assert.equal(formatExercisePrescription(5, "1 minute"), "5 rounds \u00d7 1 minute");
});

test("formats continuous cardio with a single set as duration only", () => {
  assert.equal(formatExercisePrescription(1, "15-20 minutes"), "15-20 minutes");
});

test("removes duplicate rounds wording from stored values", () => {
  assert.equal(formatExercisePrescription(5, "1 minute rounds"), "5 rounds \u00d7 1 minute");
});
