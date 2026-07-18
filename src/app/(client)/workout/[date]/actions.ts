"use server";

import { revalidatePath } from "next/cache";

import type { WorkoutTrackingActionState } from "@/app/(client)/workout/[date]/action-state";
import { requireAuthenticatedUser } from "@/lib/server/auth";
import {
  saveWorkoutFeedbackForUser,
  skipWorkoutForUser,
  toggleWorkoutExerciseCompletionForUser,
  undoSkipWorkoutForUser,
  updateWorkoutExercisePerformanceForUser,
} from "@/lib/server/repositories/workout-tracking-repository";

function revalidateWorkoutTrackingPaths(date: string) {
  revalidatePath("/home");
  revalidatePath("/calendar");
  revalidatePath(`/workout/${date}`);
  revalidatePath("/history");
}

function mapTrackingError(error: unknown) {
  if (!(error instanceof Error)) {
    return "Unable to save workout progress right now.";
  }

  switch (error.message) {
    case "WORKOUT_DAY_NOT_FOUND":
      return "This workout day could not be found for your account.";
    case "REST_DAY_NOT_TRACKABLE":
      return "Rest days cannot create workout sessions.";
    case "WORKOUT_DAY_HAS_NO_EXERCISES":
      return "This workout day has no planned exercises to track.";
    case "INVALID_GENERATED_PLAN_EXERCISE":
      return "That exercise does not belong to this workout day.";
    case "WORKOUT_ALREADY_COMPLETED":
      return "This workout status changed and needs a refresh.";
    case "WORKOUT_ALREADY_SKIPPED":
      return "This workout was skipped and can only be viewed.";
    case "WORKOUT_DAY_NOT_SKIPPED":
      return "This workout is not currently skipped.";
    case "WORKOUT_HAS_INCOMPLETE_EXERCISES":
      return "Complete all planned exercises before marking the workout complete.";
    default:
      return "Unable to save workout progress right now.";
  }
}

export async function toggleWorkoutExerciseCompletionAction(input: {
  date: string;
  generatedPlanExerciseId: number;
  completed: boolean;
}): Promise<WorkoutTrackingActionState> {
  try {
    const authUser = await requireAuthenticatedUser();
    const tracking = await toggleWorkoutExerciseCompletionForUser({
      userId: authUser.userId,
      date: input.date,
      generatedPlanExerciseId: input.generatedPlanExerciseId,
      completed: input.completed,
    });

    revalidateWorkoutTrackingPaths(input.date);

    return {
      success: true,
      message: input.completed ? "Exercise marked complete." : "Exercise marked incomplete.",
      tracking,
    };
  } catch (error) {
    return {
      success: false,
      message: mapTrackingError(error),
      tracking: null,
    };
  }
}

export async function updateWorkoutExercisePerformanceAction(input: {
  date: string;
  generatedPlanExerciseId: number;
  completedSets: number | null;
  actualRepetitions: string | null;
}): Promise<WorkoutTrackingActionState> {
  try {
    const authUser = await requireAuthenticatedUser();
    const tracking = await updateWorkoutExercisePerformanceForUser({
      userId: authUser.userId,
      date: input.date,
      generatedPlanExerciseId: input.generatedPlanExerciseId,
      completedSets: input.completedSets,
      actualRepetitions: input.actualRepetitions,
    });

    revalidateWorkoutTrackingPaths(input.date);

    return {
      success: true,
      message: "Exercise progress saved.",
      tracking,
    };
  } catch (error) {
    return {
      success: false,
      message: mapTrackingError(error),
      tracking: null,
    };
  }
}

export async function skipWorkoutAction(input: {
  date: string;
}): Promise<WorkoutTrackingActionState> {
  try {
    const authUser = await requireAuthenticatedUser();
    const tracking = await skipWorkoutForUser({
      userId: authUser.userId,
      date: input.date,
    });

    revalidateWorkoutTrackingPaths(input.date);

    return {
      success: true,
      message: "Workout skipped for today.",
      tracking,
    };
  } catch (error) {
    return {
      success: false,
      message: mapTrackingError(error),
      tracking: null,
    };
  }
}

export async function undoSkipWorkoutAction(input: {
  date: string;
}): Promise<WorkoutTrackingActionState> {
  try {
    const authUser = await requireAuthenticatedUser();
    const tracking = await undoSkipWorkoutForUser({
      userId: authUser.userId,
      date: input.date,
    });

    revalidateWorkoutTrackingPaths(input.date);

    return {
      success: true,
      message: "Workout skip removed.",
      tracking,
    };
  } catch (error) {
    return {
      success: false,
      message: mapTrackingError(error),
      tracking: null,
    };
  }
}

export async function saveWorkoutFeedbackAction(input: {
  date: string;
  difficultyRating: number | null;
  painReported: boolean;
  feedbackNote: string | null;
}): Promise<WorkoutTrackingActionState> {
  try {
    const authUser = await requireAuthenticatedUser();
    const tracking = await saveWorkoutFeedbackForUser({
      userId: authUser.userId,
      date: input.date,
      difficultyRating: input.difficultyRating,
      painReported: input.painReported,
      feedbackNote: input.feedbackNote,
    });

    revalidateWorkoutTrackingPaths(input.date);

    return {
      success: true,
      message: "Workout feedback saved.",
      tracking,
    };
  } catch (error) {
    return {
      success: false,
      message: mapTrackingError(error),
      tracking: null,
    };
  }
}
