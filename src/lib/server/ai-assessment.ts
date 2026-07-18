import "server-only";

import { createHash } from "node:crypto";

import { z } from "zod";

import {
  assessmentSystemPrompt,
  buildAssessmentUserPrompt,
} from "@/lib/server/ai/assessment-prompt";
import type {
  AiAssessmentContent,
  ClientAssessmentInput,
  CurrentAiAssessmentContent,
} from "@/types/client-onboarding";

const aiAssessmentSchema = z.object({
  workoutAdvice: z.string().trim().min(1),
  nutritionAdvice: z.string().trim().min(1),
  healthAdvice: z.string().trim().min(1),
});

const aiAssessmentJsonSchema = {
  name: "fitness_assessment_three_sections",
  strict: true,
  schema: {
    type: "object",
    additionalProperties: false,
    required: ["workoutAdvice", "nutritionAdvice", "healthAdvice"],
    properties: {
      workoutAdvice: { type: "string" },
      nutritionAdvice: { type: "string" },
      healthAdvice: { type: "string" },
    },
  },
} as const;

function normalizeScalarText(value: string | null | undefined) {
  const trimmed = (value ?? "").trim();
  return trimmed ? trimmed : null;
}

function normalizeArray(values: string[] | null | undefined) {
  return [...new Set((values ?? []).map((value) => value.trim()).filter(Boolean))].sort(
    (left, right) => left.localeCompare(right),
  );
}

function normalizeNumber(value: string | number | null | undefined) {
  if (value === null || value === undefined) {
    return null;
  }

  const trimmed = String(value).trim();

  if (!trimmed) {
    return null;
  }

  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? String(parsed) : trimmed;
}

export function normalizeAssessmentInput(input: ClientAssessmentInput): ClientAssessmentInput {
  return {
    age:
      input.age === null || Number.isNaN(Number(input.age))
        ? null
        : Number(input.age),
    gender: normalizeScalarText(input.gender),
    experienceLevel: normalizeScalarText(input.experienceLevel),
    measurements: {
      heightCm: normalizeNumber(input.measurements.heightCm),
      weightKg: normalizeNumber(input.measurements.weightKg),
      waistCm: normalizeNumber(input.measurements.waistCm),
      chestCm: normalizeNumber(input.measurements.chestCm),
      hipCm: normalizeNumber(input.measurements.hipCm),
      armCm: normalizeNumber(input.measurements.armCm),
      thighCm: normalizeNumber(input.measurements.thighCm),
      bodyFatPercent: normalizeNumber(input.measurements.bodyFatPercent),
    },
    bodyGoal: {
      id:
        input.bodyGoal.id === null || Number.isNaN(Number(input.bodyGoal.id))
          ? null
          : Number(input.bodyGoal.id),
      label: normalizeScalarText(input.bodyGoal.label),
      description: normalizeScalarText(input.bodyGoal.description),
    },
    medicalConditions: normalizeArray(input.medicalConditions),
    otherHealthCondition: normalizeScalarText(input.otherHealthCondition),
    dislikedExercises: normalizeArray(input.dislikedExercises),
    foodAllergies: normalizeArray(input.foodAllergies),
    foodRestrictions: normalizeArray(input.foodRestrictions),
    dislikedFoods: normalizeArray(input.dislikedFoods),
  };
}

export function createAssessmentInputHash(input: ClientAssessmentInput) {
  const normalized = normalizeAssessmentInput(input);
  const json = JSON.stringify(normalized);
  const hash = createHash("sha256").update(json).digest("hex");

  return {
    normalizedInput: normalized,
    inputHash: hash,
  };
}

function getRequiredEnv(name: string) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`${name} is not configured.`);
  }

  return value;
}

function extractMessageContent(content: unknown) {
  if (typeof content === "string") {
    return content;
  }

  if (Array.isArray(content)) {
    return content
      .map((part) => {
        if (typeof part === "string") {
          return part;
        }

        if (
          part &&
          typeof part === "object" &&
          "type" in part &&
          (part as { type?: string }).type === "text" &&
          "text" in part &&
          typeof (part as { text?: unknown }).text === "string"
        ) {
          return (part as { text: string }).text;
        }

        return "";
      })
      .join("");
  }

  return "";
}

async function callOpenRouterOnce(input: ClientAssessmentInput) {
  const apiKey = getRequiredEnv("OPENROUTER_API_KEY");
  const modelName = getRequiredEnv("OPENROUTER_MODEL");
  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: modelName,
      stream: false,
      temperature: 0.2,
      response_format: {
        type: "json_schema",
        json_schema: aiAssessmentJsonSchema,
      },
      messages: [
        {
          role: "system",
          content: assessmentSystemPrompt,
        },
        {
          role: "user",
          content: buildAssessmentUserPrompt(input),
        },
      ],
    }),
    signal: AbortSignal.timeout(30000),
  });

  if (!response.ok) {
    throw new Error("OPENROUTER_REQUEST_FAILED");
  }

  const payload = (await response.json()) as {
    choices?: Array<{
      message?: {
        content?: unknown;
      };
    }>;
  };
  const content = extractMessageContent(payload.choices?.[0]?.message?.content);

  if (!content.trim()) {
    throw new Error("OPENROUTER_EMPTY_RESPONSE");
  }

  const parsed = JSON.parse(content);
  return {
    modelName,
    assessment: aiAssessmentSchema.parse(parsed),
  };
}

export async function generateAiAssessment(
  input: ClientAssessmentInput,
): Promise<{ modelName: string; assessment: CurrentAiAssessmentContent }> {
  let lastError: unknown;

  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      return await callOpenRouterOnce(input);
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError ?? new Error("OPENROUTER_UNKNOWN_ERROR");
}

export function isLegacyAssessmentContent(
  assessment: AiAssessmentContent | null | undefined,
) {
  return Boolean(
    assessment &&
      typeof assessment === "object" &&
      "coachingAdvice" in assessment &&
      !("workoutAdvice" in assessment),
  );
}

export const assessmentResponseSchema = aiAssessmentSchema;
export const assessmentResponseJsonSchema = aiAssessmentJsonSchema;

export const __testing__ = {
  createAssessmentInputHash,
  isLegacyAssessmentContent,
  normalizeAssessmentInput,
};
