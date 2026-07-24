import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";

const projectRoot = process.cwd();

function readProjectFile(relativePath: string) {
  return readFileSync(path.join(projectRoot, relativePath), "utf8");
}

test("daily workout cards use the top-right circle as the completion toggle", () => {
  const source = readProjectFile("src/components/client/screens/workout-day-screen.tsx");

  assert.match(source, /handleExerciseCompletionToggle\(exercise, !completed\)/);
  assert.match(source, /Mark \$\{exercise\.exerciseName\} complete/);
  assert.match(source, /Mark \$\{exercise\.exerciseName\} incomplete/);
  assert.match(source, /CircleDashed className="size-4"/);
  assert.match(source, /CheckCircle2 className="size-4"/);
  assert.match(source, /border-\[var\(--color-success\)\] bg-\[var\(--color-success\)\] text-white/);
});

test("daily workout cards remove the old action buttons and keep a separate instruction icon", () => {
  const source = readProjectFile("src/components/client/screens/workout-day-screen.tsx");

  assert.doesNotMatch(source, />\s*Mark Complete\s*</);
  assert.doesNotMatch(source, />\s*View Instructions\s*</);
  assert.doesNotMatch(source, />\s*Mark Workout Complete\s*</);
  assert.match(source, /aria-label={`View instructions for \$\{exercise\.exerciseName\}`}/);
  assert.match(source, /onClick=\{\(\) => setInstructionExercise\(exercise\)\}/);
});

test("instruction icon does not toggle completion", () => {
  const source = readProjectFile("src/components/client/screens/workout-day-screen.tsx");

  assert.doesNotMatch(
    source,
    /aria-label={`View instructions for \$\{exercise\.exerciseName\}`}[\s\S]*handleExerciseCompletionToggle/,
  );
});

test("exercise completion updates progress optimistically and rolls back on failure", () => {
  const source = readProjectFile("src/components/client/screens/workout-day-screen.tsx");

  assert.match(source, /const previousTracking = tracking/);
  assert.match(source, /const optimisticCompletedExercises = optimisticTracking\.exerciseLogs\.filter/);
  assert.match(source, /optimisticTracking\.completedExercises = optimisticCompletedExercises/);
  assert.match(source, /optimisticTracking\.completionPercent =/);
  assert.match(source, /setTracking\(optimisticTracking\)/);
  assert.match(source, /setTracking\(previousTracking\)/);
  assert.match(source, /LoaderCircle className="size-4 animate-spin"/);
  assert.match(source, /disabled=\{isReadOnly \|\| isExercisePending \|\| isPending\}/);
  assert.match(source, /optimisticCompletedExercises === tracking\.totalExercises/);
  assert.match(source, /Exercise controls are disabled until you undo skip\./);
});

test("exercise completion action revalidates workout progress surfaces", () => {
  const source = readProjectFile("src/app/(client)/workout/[date]/actions.ts");

  assert.match(source, /revalidatePath\("\/home"\)/);
  assert.match(source, /revalidatePath\("\/calendar"\)/);
  assert.match(source, /revalidatePath\(`\/workout\/\$\{date\}`\)/);
  assert.match(source, /revalidatePath\("\/history"\)/);
});

test("workout screen uses a compact skip action and removes the old header duration subtitle", () => {
  const source = readProjectFile("src/components/client/screens/workout-day-screen.tsx");

  assert.match(source, /Undo Skip/);
  assert.match(source, /Skip Today/);
  assert.match(source, /setSkipConfirmOpen\(true\)/);
  assert.doesNotMatch(source, /subtitle=\{/);
  assert.doesNotMatch(source, /estimatedDurationMinutes \?\? 0/);
  assert.doesNotMatch(source, /Duration not specified/);
});

test("exercise cards use shared prescription formatting and remove manual inputs", () => {
  const source = readProjectFile("src/components/client/screens/workout-day-screen.tsx");

  assert.match(source, /formatExercisePrescription/);
  assert.doesNotMatch(source, /Completed sets/);
  assert.doesNotMatch(source, /Actual reps/);
  assert.doesNotMatch(source, /updateWorkoutExercisePerformanceAction/);
  assert.doesNotMatch(source, /<Input/);
});

test("nutrition summary keeps the simplified reminder copy", () => {
  const source = readProjectFile("src/components/client/screens/workout-day-screen.tsx");

  assert.match(source, /DAILY_NUTRITION_SUMMARY/);
  assert.match(source, /ရှောင်ရန်:/);
  assert.doesNotMatch(source, /item\.notes/);
  assert.doesNotMatch(source, /Allergy \/ restriction note:/);
});
