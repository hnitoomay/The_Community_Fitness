import "server-only";

import { z } from "zod";

export interface WorkoutGenerationDaySpec {
  dayNumber: number;
  requiredExerciseCount: number;
}

const workoutExerciseSchema = z.object({
  exerciseId: z.number().int().positive(),
  sets: z.number().int().min(0).nullable(),
  repetitions: z.string().trim().min(1).nullable(),
  durationMinutes: z.number().int().min(0).nullable(),
  restSeconds: z.number().int().min(0).nullable(),
  instructions: z.string().trim().min(1),
});

function createWorkoutDaySchema(day: WorkoutGenerationDaySpec) {
  return z.object({
    dayNumber: z.literal(day.dayNumber),
    workoutNotes: z.string().trim().min(1),
    estimatedDurationMinutes: z.number().int().min(0).nullable(),
    exercises: z.array(workoutExerciseSchema).length(day.requiredExerciseCount),
  });
}

export function createWorkoutBaseWeekSchema(days: WorkoutGenerationDaySpec[]) {
  return z.object({
    days: z
      .array(
        z.object({
          dayNumber: z.number().int().min(1).max(7),
          workoutNotes: z.string().trim().min(1),
          estimatedDurationMinutes: z.number().int().min(0).nullable(),
          exercises: z.array(workoutExerciseSchema),
        }),
      )
      .length(days.length),
  }).superRefine((value, ctx) => {
    const dayIndex = new Map(days.map((day) => [day.dayNumber, day] as const));
    const seenDayNumbers = new Set<number>();

    for (const [index, day] of value.days.entries()) {
      const expectedDay = dayIndex.get(day.dayNumber);

      if (!expectedDay) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["days", index, "dayNumber"],
          message: "Unexpected day number.",
        });
        continue;
      }

      if (seenDayNumbers.has(day.dayNumber)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["days", index, "dayNumber"],
          message: "Duplicate day number.",
        });
      }

      seenDayNumbers.add(day.dayNumber);

      if (day.exercises.length !== expectedDay.requiredExerciseCount) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["days", index, "exercises"],
          message: `Expected exactly ${expectedDay.requiredExerciseCount} exercises.`,
        });
      }
    }
  });
}

export type WorkoutBaseWeekResponse = z.infer<
  ReturnType<typeof createWorkoutBaseWeekSchema>
>;

function createWorkoutDayJsonSchema(day: WorkoutGenerationDaySpec) {
  return {
    type: "object",
    additionalProperties: false,
    required: [
      "dayNumber",
      "workoutNotes",
      "estimatedDurationMinutes",
      "exercises",
    ],
    properties: {
      dayNumber: {
        type: "integer",
        enum: [day.dayNumber],
      },
      workoutNotes: {
        type: "string",
      },
      estimatedDurationMinutes: {
        type: ["integer", "null"],
        minimum: 0,
      },
      exercises: {
        type: "array",
        minItems: day.requiredExerciseCount,
        maxItems: day.requiredExerciseCount,
        items: {
          type: "object",
          additionalProperties: false,
          required: [
            "exerciseId",
            "sets",
            "repetitions",
            "durationMinutes",
            "restSeconds",
            "instructions",
          ],
          properties: {
            exerciseId: {
              type: "integer",
              minimum: 1,
            },
            sets: {
              type: ["integer", "null"],
              minimum: 0,
            },
            repetitions: {
              type: ["string", "null"],
            },
            durationMinutes: {
              type: ["integer", "null"],
              minimum: 0,
            },
            restSeconds: {
              type: ["integer", "null"],
              minimum: 0,
            },
            instructions: {
              type: "string",
            },
          },
        },
      },
    },
  } as const;
}

export function createWorkoutBaseWeekJsonSchema(
  days: WorkoutGenerationDaySpec[],
  schemaName = "seven_day_workout_base_week",
) {
  return {
    name: schemaName,
    strict: true,
    schema: {
      type: "object",
      additionalProperties: false,
      required: ["days"],
      properties: {
        days: {
          type: "array",
          minItems: days.length,
          maxItems: days.length,
          items: {
            anyOf: days.map(createWorkoutDayJsonSchema),
          },
        },
      },
    },
  } as const;
}

export const __testing__ = {
  createWorkoutDayJsonSchema,
  createWorkoutDaySchema,
};
