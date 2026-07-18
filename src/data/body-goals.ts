import type { BodyGoalRecord } from "@/types/client-journey";

export const bodyGoals: BodyGoalRecord[] = [
  {
    id: "weight-loss",
    label: "Weight Loss",
    description: "Reduce body weight with steady cardio, strength work, and nutrition structure.",
    genderGroup: "all",
    imagePlaceholder: "Cut silhouette",
  },
  {
    id: "lean-toned",
    label: "Lean and Toned",
    description: "Build a leaner shape with balanced strength, posture, and conditioning.",
    genderGroup: "female",
    imagePlaceholder: "Lean outline",
  },
  {
    id: "general-fitness",
    label: "General Fitness",
    description: "Improve daily energy, baseline strength, and consistency across the week.",
    genderGroup: "all",
    imagePlaceholder: "Everyday athlete",
  },
  {
    id: "athletic-body",
    label: "Athletic Body",
    description: "Develop speed, agility, and a sharper performance-focused physique.",
    genderGroup: "all",
    imagePlaceholder: "Athletic stance",
  },
  {
    id: "muscle-gain",
    label: "Muscle Gain",
    description: "Prioritize hypertrophy with progressive overload and recovery support.",
    genderGroup: "male",
    imagePlaceholder: "Muscle mass frame",
  },
  {
    id: "strength-focus",
    label: "Strength Focus",
    description: "Increase overall force output with compound patterns and strength blocks.",
    genderGroup: "all",
    imagePlaceholder: "Strength pose",
  },
];
