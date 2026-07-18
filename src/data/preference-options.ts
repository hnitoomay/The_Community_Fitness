import type { ChoiceOption } from "@/types/client-journey";

export const yesNoneOptions: ChoiceOption[] = [
  { label: "Yes", value: "yes" },
  { label: "မရှိ", value: "none" },
];

export const yesNoOptions: ChoiceOption[] = [
  { label: "Yes", value: "yes" },
  { label: "No", value: "no" },
];

export const homePreviewModes: ChoiceOption[] = [
  { label: "Incomplete Profile", value: "incomplete" },
  { label: "Active Plan Preview", value: "active" },
];
