import "server-only";

import { z } from "zod";

const nutritionMealItemSchema = z.object({
  foodId: z.number().int().positive(),
  servingDescription: z.string().trim().min(1).nullable(),
});

const nutritionMealSchema = z.object({
  mealType: z.enum(["Breakfast", "Lunch", "Dinner", "Snack", "Drink"]),
  items: z.array(nutritionMealItemSchema).min(1),
});

const nutritionDaySchema = z.object({
  dayNumber: z.number().int().min(1).max(7),
  nutritionNotes: z.string().trim().min(1),
  meals: z.array(nutritionMealSchema).min(1),
});

export const nutritionPlanSchema = z.object({
  days: z.array(nutritionDaySchema).length(7),
});

export type NutritionPlanResponse = z.infer<typeof nutritionPlanSchema>;

export const nutritionPlanJsonSchema = {
  name: "seven_day_nutrition_rotation",
  strict: true,
  schema: {
    type: "object",
    additionalProperties: false,
    required: ["days"],
    properties: {
      days: {
        type: "array",
        minItems: 7,
        maxItems: 7,
        items: {
          type: "object",
          additionalProperties: false,
          required: ["dayNumber", "nutritionNotes", "meals"],
          properties: {
            dayNumber: {
              type: "integer",
              minimum: 1,
              maximum: 7,
            },
            nutritionNotes: {
              type: "string",
            },
            meals: {
              type: "array",
              minItems: 1,
              items: {
                type: "object",
                additionalProperties: false,
                required: ["mealType", "items"],
                properties: {
                  mealType: {
                    type: "string",
                    enum: ["Breakfast", "Lunch", "Dinner", "Snack", "Drink"],
                  },
                  items: {
                    type: "array",
                    minItems: 1,
                    items: {
                      type: "object",
                      additionalProperties: false,
                      required: ["foodId", "servingDescription"],
                      properties: {
                        foodId: {
                          type: "integer",
                          minimum: 1,
                        },
                        servingDescription: {
                          type: ["string", "null"],
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  },
} as const;
