import type { MeasurementHistoryEntry } from "@/types/progress-history";

function roundToSingleDecimal(value: number) {
  return Math.round(value * 10) / 10;
}

export function calculateNumericDifference(
  current: number | null,
  previous: number | null,
) {
  if (current === null || previous === null) {
    return null;
  }

  return roundToSingleDecimal(current - previous);
}

export function formatSignedDifference(
  value: number | null,
  unit: string,
) {
  if (value === null) {
    return null;
  }

  const prefix = value > 0 ? "+" : "";
  return `${prefix}${value} ${unit}`;
}

type ProgressTone = "positive" | "negative" | "neutral";

function normalizeGoalText(goalLabel: string | null | undefined) {
  return (goalLabel ?? "").trim().toLocaleLowerCase("en-US");
}

export function getMeasurementProgressTone(input: {
  goalLabel: string | null | undefined;
  metric: "weight" | "waist" | "bodyFat";
  change: number | null;
}): ProgressTone {
  if (input.change === null || input.change === 0) {
    return "neutral";
  }

  const goalText = normalizeGoalText(input.goalLabel);
  const isWeightLossGoal =
    goalText.includes("weight loss") ||
    goalText.includes("fat loss") ||
    goalText.includes("slim") ||
    goalText.includes("lean");
  const isMuscleGainGoal =
    goalText.includes("muscle") ||
    goalText.includes("gain") ||
    goalText.includes("bulk") ||
    goalText.includes("strength");

  if (input.metric === "weight") {
    if (isWeightLossGoal) {
      return input.change < 0 ? "positive" : "negative";
    }

    if (isMuscleGainGoal) {
      return input.change > 0 ? "positive" : "negative";
    }

    return "neutral";
  }

  if (input.metric === "waist" || input.metric === "bodyFat") {
    if (isWeightLossGoal) {
      return input.change < 0 ? "positive" : "negative";
    }

    return "neutral";
  }

  return "neutral";
}

export function buildMeasurementHistoryWithProgress(
  entries: Array<{
    id: number;
    measuredAt: string;
    weightKg: number;
    waistCm: number;
    chestCm: number;
    hipCm: number;
    armCm: number;
    thighCm: number;
    bodyFatPercentage: number | null;
  }>,
): MeasurementHistoryEntry[] {
  return entries.map((entry, index) => {
    const previousEntry = entries[index + 1] ?? null;

    return {
      ...entry,
      weightChangeKg: calculateNumericDifference(
        entry.weightKg,
        previousEntry?.weightKg ?? null,
      ),
      waistChangeCm: calculateNumericDifference(
        entry.waistCm,
        previousEntry?.waistCm ?? null,
      ),
      bodyFatChangePercent: calculateNumericDifference(
        entry.bodyFatPercentage,
        previousEntry?.bodyFatPercentage ?? null,
      ),
    };
  });
}

export const __testing__ = {
  buildMeasurementHistoryWithProgress,
  calculateNumericDifference,
  formatSignedDifference,
  getMeasurementProgressTone,
};
