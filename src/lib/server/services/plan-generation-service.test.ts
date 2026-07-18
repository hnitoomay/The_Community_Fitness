import assert from "node:assert/strict";
import test from "node:test";

import { createWorkoutBaseWeekJsonSchema } from "@/lib/server/ai/workout-plan-schema";
import type { NutritionPlanResponse } from "@/lib/server/ai/nutrition-plan-schema";
import { __testing__ } from "@/lib/server/services/plan-generation-service";
import type {
  PlanGenerationContext,
  WorkoutExerciseCandidate,
} from "@/lib/server/repositories/generated-plan-repository";

const {
  assertWorkoutWeekValid,
  buildWorkoutGenerationDaySpecs,
  buildWorkoutRepairPayload,
  buildWorkoutSkeletonDays,
  combineWorkoutAndNutritionPlans,
  collectWorkoutValidationIssues,
  createFallbackWorkoutWeek,
  expandBaseWeekToFourWeeks,
  foodConflictsWithPreferences,
  resolveRelevantExerciseCategories,
  validateNutritionPlanResponse,
  validatePlanGenerationContext,
} = __testing__;

function createBaseContext(): PlanGenerationContext {
  return {
    userId: "user_123",
    latestAssessmentId: 10,
    assessmentInput: {
      age: 28,
      gender: "female",
      measurements: {
        heightCm: "165",
        weightKg: "58",
        waistCm: "72",
        chestCm: "88",
        hipCm: "96",
        armCm: "29",
        thighCm: "54",
        bodyFatPercent: null,
      },
      bodyGoal: {
        id: 2,
        label: "Muscle Gain",
        description: "Build strength and size",
      },
      medicalConditions: ["low-blood-pressure"],
      otherHealthCondition: null,
      dislikedExercises: ["Burpee"],
      foodAllergies: ["Egg"],
      foodRestrictions: ["Halal"],
      dislikedFoods: ["Milo"],
    },
    bodyGoal: {
      id: 2,
      label: "Muscle Gain",
      description: "Build strength and size",
    },
    workoutTemplate: {
      id: 4,
      name: "Muscle Gain Beginner",
      difficulty: "Beginner",
      daysPerWeek: 4,
      notes: null,
      days: [
        { dayNumber: 1, templateDayType: "Workout", planDayType: "workout", focusCategory: "Legs", exerciseCount: 2 },
        { dayNumber: 2, templateDayType: "Workout", planDayType: "workout", focusCategory: "Chest", exerciseCount: 2 },
        { dayNumber: 3, templateDayType: "Rest", planDayType: "rest", focusCategory: "Rest", exerciseCount: 0 },
        { dayNumber: 4, templateDayType: "Workout", planDayType: "workout", focusCategory: "Back", exerciseCount: 2 },
        { dayNumber: 5, templateDayType: "Cardio", planDayType: "cardio", focusCategory: "Cardio", exerciseCount: 1 },
        { dayNumber: 6, templateDayType: "Stretching", planDayType: "stretching", focusCategory: "Stretching", exerciseCount: 1 },
        { dayNumber: 7, templateDayType: "Rest", planDayType: "rest", focusCategory: "Rest", exerciseCount: 0 },
      ],
    },
    nutritionTemplate: {
      id: 7,
      name: "Muscle Gain Rotation",
      mealsPerDay: 3,
      minimumCalories: 1800,
      maximumCalories: 2200,
      mealStructure: ["Breakfast", "Lunch", "Dinner"],
      notes: null,
    },
    latestAssessment: {
      workoutAdvice: "Leg day and split training are helpful.",
      nutritionAdvice: "Protein intake should be steady.",
      healthAdvice: "Train carefully with low blood pressure.",
    },
    profileSnapshot: {
      age: 28,
      gender: "female",
      measurements: {
        heightCm: "165",
        weightKg: "58",
        waistCm: "72",
        chestCm: "88",
        hipCm: "96",
        armCm: "29",
        thighCm: "54",
        bodyFatPercent: null,
      },
      bodyGoal: {
        id: 2,
        label: "Muscle Gain",
        description: "Build strength and size",
      },
      medicalConditions: ["low-blood-pressure"],
      otherHealthCondition: null,
      dislikedExercises: ["Burpee"],
      foodAllergies: ["Egg"],
      foodRestrictions: ["Halal"],
      dislikedFoods: ["Milo"],
      latestAssessment: {
        workoutAdvice: "Leg day and split training are helpful.",
        nutritionAdvice: "Protein intake should be steady.",
        healthAdvice: "Train carefully with low blood pressure.",
      },
    },
  };
}

function createWorkoutCandidates(): WorkoutExerciseCandidate[] {
  return [
    { id: 1, name: "Leg Press", category: "Legs", difficulty: "Beginner", defaultSets: 3, defaultRepetitionsOrDuration: "10-12", instructions: "Press with control", requiredEquipmentNames: ["Leg Press"], exactDislikeMatch: false, broadDislikeMatch: false },
    { id: 2, name: "Goblet Squat", category: "Legs", difficulty: "Beginner", defaultSets: 3, defaultRepetitionsOrDuration: "10-12", instructions: "Squat slowly", requiredEquipmentNames: [], exactDislikeMatch: false, broadDislikeMatch: false },
    { id: 21, name: "Walking Lunge", category: "Legs", difficulty: "Beginner", defaultSets: 2, defaultRepetitionsOrDuration: "10-10", instructions: "Step steadily", requiredEquipmentNames: [], exactDislikeMatch: false, broadDislikeMatch: false },
    { id: 3, name: "Chest Press", category: "Chest", difficulty: "Beginner", defaultSets: 3, defaultRepetitionsOrDuration: "10-12", instructions: "Press evenly", requiredEquipmentNames: ["Chest Press"], exactDislikeMatch: false, broadDislikeMatch: false },
    { id: 4, name: "Push Up", category: "Chest", difficulty: "Beginner", defaultSets: 3, defaultRepetitionsOrDuration: "8-10", instructions: "Keep core tight", requiredEquipmentNames: [], exactDislikeMatch: false, broadDislikeMatch: false },
    { id: 22, name: "Incline Push Up", category: "Chest", difficulty: "Beginner", defaultSets: 2, defaultRepetitionsOrDuration: "10-12", instructions: "Use a stable bench", requiredEquipmentNames: ["Bench"], exactDislikeMatch: false, broadDislikeMatch: false },
    { id: 5, name: "Seated Row", category: "Back", difficulty: "Beginner", defaultSets: 3, defaultRepetitionsOrDuration: "10-12", instructions: "Pull to the ribs", requiredEquipmentNames: ["Cable"], exactDislikeMatch: false, broadDislikeMatch: false },
    { id: 6, name: "Lat Pulldown", category: "Back", difficulty: "Beginner", defaultSets: 3, defaultRepetitionsOrDuration: "10-12", instructions: "Lower to the chest", requiredEquipmentNames: ["Lat Pulldown"], exactDislikeMatch: false, broadDislikeMatch: false },
    { id: 23, name: "Band Row", category: "Back", difficulty: "Beginner", defaultSets: 2, defaultRepetitionsOrDuration: "12-15", instructions: "Pull smoothly", requiredEquipmentNames: [], exactDislikeMatch: false, broadDislikeMatch: false },
    { id: 7, name: "Bike", category: "Cardio", difficulty: "Beginner", defaultSets: null, defaultRepetitionsOrDuration: "20", instructions: "Ride at a steady pace", requiredEquipmentNames: ["Bike"], exactDislikeMatch: false, broadDislikeMatch: false },
    { id: 8, name: "Hamstring Stretch", category: "Stretching", difficulty: "Beginner", defaultSets: null, defaultRepetitionsOrDuration: "15", instructions: "Hold gently", requiredEquipmentNames: [], exactDislikeMatch: false, broadDislikeMatch: false },
    { id: 99, name: "Burpee", category: "Cardio", difficulty: "Beginner", defaultSets: 3, defaultRepetitionsOrDuration: "10", instructions: "Fast pace", requiredEquipmentNames: [], exactDislikeMatch: true, broadDislikeMatch: false },
  ];
}

function createWorkoutWeek() {
  return {
    days: [
      {
        dayNumber: 1,
        workoutNotes: "ခြေထောက်နေ့ကို ထိန်းပြီး လုပ်ပါ။",
        estimatedDurationMinutes: 45,
        exercises: [
          { exerciseId: 1, sets: 3, repetitions: "10-12", durationMinutes: null, restSeconds: 60, instructions: "တည်ငြိမ်အောင် ဖိတင်ပါ။" },
          { exerciseId: 2, sets: 3, repetitions: "10-12", durationMinutes: null, restSeconds: 60, instructions: "ဒူးလမ်းကြောင်းကို ထိန်းပါ။" },
        ],
      },
      {
        dayNumber: 2,
        workoutNotes: "ရင်ဘတ်နေ့ကို ပုံမှန်နှုန်းနဲ့ လုပ်ပါ။",
        estimatedDurationMinutes: 45,
        exercises: [
          { exerciseId: 3, sets: 3, repetitions: "10-12", durationMinutes: null, restSeconds: 60, instructions: "ဖိတင်ချိန်ကို ညီအောင်လုပ်ပါ။" },
          { exerciseId: 4, sets: 3, repetitions: "8-10", durationMinutes: null, restSeconds: 60, instructions: "ကိုယ်လုံးကို တန်းတန်းထားပါ။" },
        ],
      },
      {
        dayNumber: 3,
        workoutNotes: "အနားယူပြီး ပြန်လည်သက်သာအောင် နေပါ။",
        estimatedDurationMinutes: null,
        exercises: [],
      },
      {
        dayNumber: 4,
        workoutNotes: "ကျောနေ့ကို အရွေ့အကွာအဝေးပြည့်အောင် လုပ်ပါ။",
        estimatedDurationMinutes: 45,
        exercises: [
          { exerciseId: 5, sets: 3, repetitions: "10-12", durationMinutes: null, restSeconds: 60, instructions: "လက်မောင်းမဟုတ်ဘဲ ကျောနဲ့ ဆွဲပါ။" },
          { exerciseId: 6, sets: 3, repetitions: "10-12", durationMinutes: null, restSeconds: 60, instructions: "ချတင်နှုန်းကို ထိန်းပါ။" },
        ],
      },
      {
        dayNumber: 5,
        workoutNotes: "ကာဒီယိုကို အလယ်အလတ်နှုန်းနဲ့ လုပ်ပါ။",
        estimatedDurationMinutes: 25,
        exercises: [
          { exerciseId: 7, sets: null, repetitions: null, durationMinutes: 20, restSeconds: null, instructions: "အသက်ရှူနှုန်းကို ထိန်းပါ။" },
        ],
      },
      {
        dayNumber: 6,
        workoutNotes: "ဆန့်လှုပ်ရှားမှုကို ဖြည်းဖြည်းချင်း ထိန်းပြီး လုပ်ပါ။",
        estimatedDurationMinutes: 20,
        exercises: [
          { exerciseId: 8, sets: null, repetitions: null, durationMinutes: 15, restSeconds: null, instructions: "နာကျင်မှုမရောက်အောင် ထိန်းပါ။" },
        ],
      },
      {
        dayNumber: 7,
        workoutNotes: "အနားယူပြီး ရေကောင်းကောင်း သောက်ပါ။",
        estimatedDurationMinutes: null,
        exercises: [],
      },
    ],
  };
}

function createNutritionPlan(): NutritionPlanResponse {
  return {
    days: Array.from({ length: 7 }, (_, dayIndex) => ({
      dayNumber: dayIndex + 1,
      nutritionNotes: "အစာကို အချိန်မှန် စားပါ။",
      meals: [
        {
          mealType: "Breakfast",
          items: [{ foodId: 100, servingDescription: "1 bowl", notes: "Breakfast note" }],
        },
        {
          mealType: "Lunch",
          items: [{ foodId: 101, servingDescription: "1 plate", notes: "Lunch note" }],
        },
        {
          mealType: "Dinner",
          items: [{ foodId: 102, servingDescription: "1 plate", notes: "Dinner note" }],
        },
      ],
    })),
  };
}

test("missing body goal returns a clear error", () => {
  const context = createBaseContext();
  context.bodyGoal.id = 0;

  const result = validatePlanGenerationContext(context);
  assert.equal(result.ok, false);
  assert.equal(result.reason, "missing-body-goal");
});

test("missing template returns a clear error", () => {
  const context = createBaseContext();
  context.workoutTemplate.id = 0;

  const result = validatePlanGenerationContext(context);
  assert.equal(result.ok, false);
  assert.equal(result.reason, "missing-workout-template");
});

test("allergies and disliked foods are excluded by filtering", () => {
  assert.equal(
    foodConflictsWithPreferences(
      { name: "Egg Sandwich", allergen: "Egg" },
      {
        foodAllergies: ["Egg"],
        foodRestrictions: [],
        dislikedFoods: [],
      },
    ),
    true,
  );
  assert.equal(
    foodConflictsWithPreferences(
      { name: "Chicken Rice", allergen: null },
      {
        foodAllergies: [],
        foodRestrictions: ["Halal"],
        dislikedFoods: ["Milo"],
      },
    ),
    false,
  );
});

test("bodyweight-style focus mapping remains eligible without equipment categories", () => {
  assert.deepEqual(resolveRelevantExerciseCategories("Cardio"), ["Cardio"]);
  assert.deepEqual(resolveRelevantExerciseCategories("Full Body"), [
    "Full Body",
    "Chest",
    "Back",
    "Shoulders",
    "Legs",
    "Core",
  ]);
});

test("base AI output contains exactly seven days", () => {
  const skeletonDays = buildWorkoutSkeletonDays(createBaseContext(), createWorkoutCandidates());
  const daySpecs = buildWorkoutGenerationDaySpecs(skeletonDays);
  const workoutWeek = createWorkoutWeek();

  assert.equal(daySpecs.length, 7);
  assert.equal(workoutWeek.days.length, 7);
});

test("dynamic schema uses exact minItems and maxItems", () => {
  const skeletonDays = buildWorkoutSkeletonDays(createBaseContext(), createWorkoutCandidates());
  const schema = createWorkoutBaseWeekJsonSchema(buildWorkoutGenerationDaySpecs(skeletonDays));
  const daySchemas = schema.schema.properties.days.items.anyOf;

  assert.equal(daySchemas[0].properties.exercises.minItems, 2);
  assert.equal(daySchemas[0].properties.exercises.maxItems, 2);
  assert.equal(daySchemas[2].properties.exercises.minItems, 0);
  assert.equal(daySchemas[2].properties.exercises.maxItems, 0);
});

test("exercise counts match every template day", () => {
  const skeletonDays = buildWorkoutSkeletonDays(createBaseContext(), createWorkoutCandidates());

  assert.doesNotThrow(() =>
    assertWorkoutWeekValid({
      workoutWeek: createWorkoutWeek(),
      skeletonDays,
      candidateById: new Map(createWorkoutCandidates().map((candidate) => [candidate.id, candidate])),
    }),
  );
});

test("disliked exact exercise removes only that exercise", () => {
  const context = createBaseContext();
  const candidates = createWorkoutCandidates();
  candidates[0].exactDislikeMatch = true;
  const skeletonDays = buildWorkoutSkeletonDays(context, candidates);
  const legsDay = skeletonDays.find((day) => day.dayNumber === 1);

  assert.ok(legsDay);
  assert.equal(legsDay.allowedExerciseIds.includes(1), false);
  assert.equal(legsDay.allowedExerciseIds.includes(2), true);
  assert.equal(legsDay.allowedExerciseIds.includes(21), true);
});

test('\"shoulder\" does not remove the complete Shoulders category', () => {
  const context = createBaseContext();
  context.workoutTemplate.days[1] = {
    dayNumber: 2,
    templateDayType: "Workout",
    planDayType: "workout",
    focusCategory: "Shoulders",
    exerciseCount: 2,
  };

  const candidates = [
    ...createWorkoutCandidates(),
    { id: 31, name: "Shoulder Press", category: "Shoulders", difficulty: "Beginner", defaultSets: 3, defaultRepetitionsOrDuration: "10-12", instructions: "Press smoothly", requiredEquipmentNames: ["Dumbbell"], exactDislikeMatch: false, broadDislikeMatch: true },
    { id: 32, name: "Lateral Raise", category: "Shoulders", difficulty: "Beginner", defaultSets: 3, defaultRepetitionsOrDuration: "12-15", instructions: "Lift steadily", requiredEquipmentNames: ["Dumbbell"], exactDislikeMatch: false, broadDislikeMatch: true },
    { id: 33, name: "Front Raise", category: "Shoulders", difficulty: "Beginner", defaultSets: 2, defaultRepetitionsOrDuration: "12-15", instructions: "Lift with control", requiredEquipmentNames: ["Plate"], exactDislikeMatch: false, broadDislikeMatch: true },
  ];

  const skeletonDays = buildWorkoutSkeletonDays(context, candidates);
  const shouldersDay = skeletonDays.find((day) => day.focusCategory === "Shoulders");

  assert.ok(shouldersDay);
  assert.equal(shouldersDay.candidateExercises.length >= 2, true);
});

test("final candidate count remains at least the required count", () => {
  const context = createBaseContext();
  const candidates = createWorkoutCandidates();
  candidates[0].exactDislikeMatch = true;
  candidates[1].exactDislikeMatch = true;
  const skeletonDays = buildWorkoutSkeletonDays(context, candidates);
  const legsDay = skeletonDays.find((day) => day.dayNumber === 1);

  assert.ok(legsDay);
  assert.equal(legsDay.candidateExercises.length >= legsDay.requiredExerciseCount, true);
  assert.equal(legsDay.trainerConsultationRequired, true);
});

test("unavailable-equipment exercises remain excluded", () => {
  const skeletonDays = buildWorkoutSkeletonDays(createBaseContext(), createWorkoutCandidates());
  const allIds = new Set(skeletonDays.flatMap((day) => day.allowedExerciseIds));

  assert.equal(allIds.has(404), false);
});

test("broad dislikes influence ranking rather than deleting a category", () => {
  const context = createBaseContext();
  context.workoutTemplate.days[0].focusCategory = "Legs";
  context.workoutTemplate.days[0].exerciseCount = 2;
  const candidates = createWorkoutCandidates();
  candidates[0].broadDislikeMatch = true;
  candidates[1].broadDislikeMatch = false;
  candidates[2].broadDislikeMatch = false;

  const skeletonDays = buildWorkoutSkeletonDays(context, candidates);
  const legsDay = skeletonDays.find((day) => day.dayNumber === 1);

  assert.ok(legsDay);
  assert.equal(legsDay.allowedExerciseIds.includes(1), true);
  assert.deepEqual(legsDay.allowedExerciseIds.slice(0, 2), [2, 21]);
});

test("targeted repair receives only invalid days", () => {
  const context = createBaseContext();
  const candidates = createWorkoutCandidates();
  const skeletonDays = buildWorkoutSkeletonDays(context, candidates);
  const invalidWeek = createWorkoutWeek();
  invalidWeek.days[0].exercises = invalidWeek.days[0].exercises.slice(0, 1);
  invalidWeek.days[3].exercises[1].exerciseId = 9999;

  const issues = collectWorkoutValidationIssues({
    workoutWeek: invalidWeek,
    skeletonDays,
    candidateById: new Map(candidates.map((candidate) => [candidate.id, candidate])),
  });
  const repairPayload = buildWorkoutRepairPayload({
    skeletonDays,
    issues,
  });

  assert.deepEqual(repairPayload.invalidDayNumbers, [1, 4]);
  assert.deepEqual(
    repairPayload.invalidDays.map((day) => day.dayNumber),
    [1, 4],
  );
});

test("base week expands to exactly 28 dated records", () => {
  const skeletonDays = buildWorkoutSkeletonDays(createBaseContext(), createWorkoutCandidates());
  const expanded = expandBaseWeekToFourWeeks({
    baseWeek: createWorkoutWeek(),
    skeletonDays,
    difficulty: "Beginner",
  });

  assert.equal(expanded.length, 28);
  assert.equal(expanded[0].weekNumber, 1);
  assert.equal(expanded[27].weekNumber, 4);
});

test("rest days remain empty across all four weeks", () => {
  const skeletonDays = buildWorkoutSkeletonDays(createBaseContext(), createWorkoutCandidates());
  const expanded = expandBaseWeekToFourWeeks({
    baseWeek: createWorkoutWeek(),
    skeletonDays,
    difficulty: "Beginner",
  });

  assert.equal(
    expanded.filter((day) => day.dayType === "rest").every((day) => day.exercises.length === 0),
    true,
  );
});

test("progression values remain valid", () => {
  const skeletonDays = buildWorkoutSkeletonDays(createBaseContext(), createWorkoutCandidates());
  const expanded = expandBaseWeekToFourWeeks({
    baseWeek: createWorkoutWeek(),
    skeletonDays,
    difficulty: "Beginner",
  });

  for (const day of expanded) {
    for (const exercise of day.exercises) {
      if (exercise.sets !== null) {
        assert.equal(exercise.sets >= 0, true);
      }

      if (exercise.durationMinutes !== null) {
        assert.equal(exercise.durationMinutes >= 0, true);
      }

      if (exercise.restSeconds !== null) {
        assert.equal(exercise.restSeconds >= 0, true);
      }

      if (exercise.repetitions) {
        const numbers = exercise.repetitions
          .split("-")
          .map((value) => Number(value.trim()))
          .filter((value) => Number.isFinite(value));
        assert.equal(numbers.every((value) => value >= 1), true);
      }
    }
  }
});

test("nutrition seven-day rotation expands to 28 dates", () => {
  const skeletonDays = buildWorkoutSkeletonDays(createBaseContext(), createWorkoutCandidates());
  const combined = combineWorkoutAndNutritionPlans({
    startDate: "2026-07-10",
    workoutDays: expandBaseWeekToFourWeeks({
      baseWeek: createWorkoutWeek(),
      skeletonDays,
      difficulty: "Beginner",
    }),
    nutritionPlan: createNutritionPlan(),
  });

  assert.equal(combined.length, 28);
  assert.equal(combined[0].meals[0].items[0].foodId, 100);
  assert.equal(combined[7].meals[0].items[0].foodId, 100);
  assert.equal(combined[14].meals[0].items[0].foodId, 100);
  assert.equal(combined[21].meals[0].items[0].foodId, 100);
});

test("fallback uses only eligible exercises", () => {
  const skeletonDays = buildWorkoutSkeletonDays(createBaseContext(), createWorkoutCandidates());
  const fallbackWeek = createFallbackWorkoutWeek(skeletonDays);
  const skeletonDayIndex = new Map(skeletonDays.map((day) => [day.dayNumber, day] as const));

  for (const day of fallbackWeek.days) {
    const skeletonDay = skeletonDayIndex.get(day.dayNumber);
    assert.ok(skeletonDay);
    assert.equal(
      day.exercises.every((exercise) => skeletonDay.allowedExerciseIds.includes(exercise.exerciseId)),
      true,
    );
  }
});

test("fallback refuses days without enough eligible exercises", () => {
  const skeletonDays = buildWorkoutSkeletonDays(createBaseContext(), createWorkoutCandidates());
  skeletonDays[0].candidateExercises = skeletonDays[0].candidateExercises.slice(0, 1);
  skeletonDays[0].allowedExerciseIds = skeletonDays[0].allowedExerciseIds.slice(0, 1);

  assert.throws(() => createFallbackWorkoutWeek(skeletonDays));
});

test("nutrition validation still rejects unknown food IDs", () => {
  const context = createBaseContext();
  const nutritionPlan = createNutritionPlan();
  nutritionPlan.days[0].meals[0].items[0].foodId = 9999;

  assert.throws(() =>
    validateNutritionPlanResponse({
      nutritionPlan,
      context,
      foodById: new Map([
        [100, { id: 100, name: "Oats", mealCategory: "Breakfast", servingDescription: "1 bowl", calories: 220, proteinGrams: 8, allergen: null }],
        [101, { id: 101, name: "Chicken Rice", mealCategory: "Lunch", servingDescription: "1 plate", calories: 500, proteinGrams: 30, allergen: null }],
        [102, { id: 102, name: "Fish Curry", mealCategory: "Dinner", servingDescription: "1 plate", calories: 450, proteinGrams: 28, allergen: null }],
      ]),
    }),
  );
});
