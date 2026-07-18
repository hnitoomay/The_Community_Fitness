import type { ChoiceOption, HealthConditionOption } from "@/types/client-journey";

export const healthConditionOptions: HealthConditionOption[] = [
  { id: "heart-condition", label: "Heart condition" },
  { id: "high-blood-pressure", label: "High blood pressure" },
  { id: "low-blood-pressure", label: "Low blood pressure" },
  { id: "diabetes", label: "Diabetes" },
  { id: "asthma", label: "Asthma" },
  { id: "current-injury", label: "Current injury" },
  { id: "other-condition", label: "Other health condition" },
  { id: "none", label: "မရှိ" },
];

export const genderOptions: ChoiceOption[] = [
  { label: "Male", value: "male" },
  { label: "Female", value: "female" },
  { label: "Other", value: "other" },
];
