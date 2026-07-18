import type {
  AiAssessmentContent,
  ClientAssessmentInput,
  CurrentAiAssessmentContent,
} from "@/types/client-onboarding";

export interface AssessmentProfileSummaryRow {
  label: string;
  value: string;
}

export type AssessmentAddressTerm = "အစ်ကို" | "အစ်မ" | "သင်";

const EMPTY_VALUE_LABEL = "မရှိ";

const healthConditionLabels: Record<string, string> = {
  "heart-condition": "နှလုံးနှင့်ဆိုင်သော ပြဿနာ",
  "high-blood-pressure": "သွေးတိုး",
  "low-blood-pressure": "သွေးပေါင်ကျ",
  diabetes: "ဆီးချို",
  asthma: "ပန်းနာရင်ကျပ်",
  "current-injury": "လက်ရှိ ဒဏ်ရာ",
  "other-condition": "အခြား ကျန်းမာရေးအခြေအနေ",
};

function normalizeValue(value: string | null | undefined) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function normalizeList(values: string[]) {
  return values
    .map((value) => value.trim())
    .filter(Boolean);
}

function formatMeasurementValue(value: string | null) {
  return normalizeValue(value) ?? EMPTY_VALUE_LABEL;
}

function joinOrEmpty(values: string[]) {
  return values.length > 0 ? values.join("၊ ") : EMPTY_VALUE_LABEL;
}

function mapHealthConditions(input: ClientAssessmentInput) {
  const mappedConditions = normalizeList(input.medicalConditions)
    .filter((value) => value !== "none")
    .map((value) => healthConditionLabels[value] ?? value);
  const otherCondition = normalizeValue(input.otherHealthCondition);

  if (otherCondition) {
    mappedConditions.push(otherCondition);
  }

  return joinOrEmpty(mappedConditions);
}

export function buildAssessmentProfileSummary(
  input: ClientAssessmentInput,
): AssessmentProfileSummaryRow[] {
  const rows: AssessmentProfileSummaryRow[] = [
    {
      label: "အရပ်နှင့် ကိုယ်အလေးချိန်",
      value: `အရပ် ${formatMeasurementValue(input.measurements.heightCm)} cm / ကိုယ်အလေးချိန် ${formatMeasurementValue(input.measurements.weightKg)} kg`,
    },
    {
      label: "Your Body Goal",
      value: normalizeValue(input.bodyGoal.label) ?? EMPTY_VALUE_LABEL,
    },
    {
      label: "ကျန်းမာရေးအခြေအနေ",
      value: mapHealthConditions(input),
    },
    {
      label: "မကြိုက်သော လေ့ကျင့်ခန်းများ",
      value: joinOrEmpty(normalizeList(input.dislikedExercises)),
    },
    {
      label: "အစားအသောက်ဓာတ်မတည့်မှု",
      value: joinOrEmpty(normalizeList(input.foodAllergies)),
    },
    {
      label: "အစားအသောက်ကန့်သတ်ချက်",
      value: joinOrEmpty(normalizeList(input.foodRestrictions)),
    },
    {
      label: "မကြိုက်သောအစားအစာများ",
      value: joinOrEmpty(normalizeList(input.dislikedFoods)),
    },
  ];

  const bodyFatPercent = normalizeValue(input.measurements.bodyFatPercent);

  if (bodyFatPercent) {
    rows.splice(1, 0, {
      label: "Body Fat Percentage",
      value: `${bodyFatPercent}%`,
    });
  }

  return rows;
}

export function getAssessmentPrimaryActionLabel(
  hasAssessment: boolean,
  isOutdated: boolean,
) {
  if (!hasAssessment) {
    return "AI အကြံပြုချက် ရယူမည်";
  }

  if (isOutdated) {
    return "AI အကြံပြုချက် ပြန်လည်ရယူမည်";
  }

  return "AI အကြံပြုချက် ထပ်မံရယူမည်";
}

export function isAssessmentOutdated(
  latestInputHash: string | null | undefined,
  currentInputHash: string | null | undefined,
) {
  if (!latestInputHash || !currentInputHash) {
    return false;
  }

  return latestInputHash !== currentInputHash;
}

export function getAssessmentAddressTerm(
  gender: string | null | undefined,
): AssessmentAddressTerm {
  switch (gender?.trim().toLowerCase()) {
    case "male":
      return "အစ်ကို";
    case "female":
      return "အစ်မ";
    default:
      return "သင်";
  }
}

export function isCurrentAssessmentContent(
  content: AiAssessmentContent | null | undefined,
): content is CurrentAiAssessmentContent {
  return Boolean(
    content &&
      typeof content === "object" &&
      "workoutAdvice" in content &&
      "nutritionAdvice" in content &&
      "healthAdvice" in content,
  );
}

export const __testing__ = {
  EMPTY_VALUE_LABEL,
  buildAssessmentProfileSummary,
  getAssessmentPrimaryActionLabel,
  isAssessmentOutdated,
  getAssessmentAddressTerm,
  isCurrentAssessmentContent,
};
