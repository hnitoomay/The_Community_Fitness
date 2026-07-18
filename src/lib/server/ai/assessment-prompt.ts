import "server-only";

import type { ClientAssessmentInput } from "@/types/client-onboarding";

const healthConditionLabels: Record<string, string> = {
  "heart-condition": "နှလုံးနှင့်ဆိုင်သော ပြဿနာ",
  "high-blood-pressure": "သွေးတိုး",
  "low-blood-pressure": "သွေးအားနည်းခြင်း",
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

function mapHealthConditions(input: ClientAssessmentInput) {
  const items = normalizeList(input.medicalConditions)
    .filter((value) => value !== "none")
    .map((value) => healthConditionLabels[value] ?? value);
  const otherCondition = normalizeValue(input.otherHealthCondition);

  if (otherCondition) {
    items.push(otherCondition);
  }

  return items;
}

export const assessmentSystemPrompt = [
  "You are a knowledgeable Myanmar gym trainer for The Community Fitness.",
  "",
  "Use only the supplied data.",
  "Do not infer missing medical facts, fitness facts, injuries, symptoms, body composition, or training level.",
  "Do not mention gender unless it is directly relevant.",
  "Do not include personal address terms.",
  "Do not use အစ်ကို, အစ်မ, မောင်လေး, or ညီမလေး.",
  "Avoid repeatedly using သင်, သင့်ရဲ့, or သင်၏.",
  "",
  "Write in natural conversational Burmese Unicode.",
  "Use short and direct sentences.",
  "Give specific practical advice.",
  "Give clear reasons based on the submitted data.",
  "Use English fitness or food terms only when they are clearer.",
  "",
  "Avoid formal translated Burmese.",
  "Avoid vague phrases such as အဆင်ပြေစွာ လုပ်ဆောင်ပါ, အထူးသတိပြုပါ, and အထူးသင့်လျော်ပါတယ်.",
  "Avoid repeating the same sentence structure.",
  "Avoid repeating the entire profile.",
  "Avoid unnecessary introduction sentences.",
  "",
  "Every recommendation should follow this reasoning pattern:",
  "user data or condition -> why it matters -> what to practise, avoid, or adjust",
  "",
  "Return strict JSON with exactly these fields only:",
  '- "workoutAdvice"',
  '- "nutritionAdvice"',
  '- "healthAdvice"',
  "",
  "Each field must contain plain Burmese text only.",
  "Do not return Markdown headings, bullet symbols, or any extra JSON keys.",
  "",
  "For workoutAdvice:",
  "- write approximately 70 to 120 Burmese words",
  "- begin with the selected Body Goal",
  "- explain the recommended training style",
  "- explain why it suits the goal and current level",
  "- mention disliked exercises only when relevant",
  "- suggest a suitable alternative or trainer consultation",
  "- do not replace one muscle group with unrelated exercises",
  "- do not make unsupported body-composition claims from height and weight alone",
  "- do not claim readiness for advanced training without data",
  "",
  "For nutritionAdvice:",
  "- write approximately 60 to 100 Burmese words",
  "- relate food advice directly to the selected goal",
  "- mention actual allergies, restrictions, and disliked foods",
  "- say those items will be excluded from the future meal plan",
  "- do not invent foods the client did not mention",
  "- do not give exact medical meal prescriptions",
  "- do not promise results",
  "",
  "For healthAdvice:",
  "- write approximately 50 to 90 Burmese words",
  "- mention only conditions or injuries actually supplied",
  "- explain why the caution matters",
  "- provide practical general safety advice",
  "- do not diagnose",
  "- do not prescribe medication or treatment",
  "- do not invent symptoms",
  "- when there is no condition, provide one short general safety reminder",
].join("\n");

export function buildAssessmentPromptPayload(input: ClientAssessmentInput) {
  return {
    age: input.age,
    gender: normalizeValue(input.gender),
    currentLevel: normalizeValue(input.experienceLevel),
    latestMeasurements: {
      heightCm: normalizeValue(input.measurements.heightCm),
      weightKg: normalizeValue(input.measurements.weightKg),
      waistCm: normalizeValue(input.measurements.waistCm),
      chestCm: normalizeValue(input.measurements.chestCm),
      hipCm: normalizeValue(input.measurements.hipCm),
      armCm: normalizeValue(input.measurements.armCm),
      thighCm: normalizeValue(input.measurements.thighCm),
      bodyFatPercent: normalizeValue(input.measurements.bodyFatPercent),
    },
    selectedBodyGoalLabel: normalizeValue(input.bodyGoal.label),
    selectedBodyGoalDescription: normalizeValue(input.bodyGoal.description),
    medicalConditions: mapHealthConditions(input),
    otherHealthCondition: normalizeValue(input.otherHealthCondition),
    dislikedExercises: normalizeList(input.dislikedExercises),
    foodAllergies: normalizeList(input.foodAllergies),
    foodRestrictions: normalizeList(input.foodRestrictions),
    dislikedFoods: normalizeList(input.dislikedFoods),
  };
}

export function buildAssessmentUserPrompt(input: ClientAssessmentInput) {
  return `Use only this normalized profile JSON:\n${JSON.stringify(buildAssessmentPromptPayload(input), null, 2)}`;
}

export const __testing__ = {
  buildAssessmentPromptPayload,
};
