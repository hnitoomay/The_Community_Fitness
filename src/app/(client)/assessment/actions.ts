"use server";

import { revalidatePath } from "next/cache";

import type {
  GenerateAssessmentActionState,
  GeneratePlanActionState,
} from "@/app/(client)/assessment/action-state";
import { createAssessmentInputHash } from "@/lib/server/ai-assessment";
import { generateAndStoreAssessment } from "@/lib/server/assessment-generation";
import { requireAuthenticatedUser } from "@/lib/server/auth";
import {
  getAssessmentInputForUser,
  getLatestAiAssessmentForUser,
} from "@/lib/server/repositories/ai-assessment-repository";
import { generateFourWeekPlanForUser } from "@/lib/server/services/plan-generation-service";

export async function generateAssessmentAction(): Promise<GenerateAssessmentActionState> {
  let userId: string;

  try {
    const authUser = await requireAuthenticatedUser();
    userId = authUser.userId;
  } catch {
    return {
      success: false,
      message: "အကောင့်ဝင်ပြီးမှ ပြုလုပ်ပါ။",
    };
  }

  try {
    const result = await generateAndStoreAssessment(userId);

    if (!result.ok) {
      return {
        success: false,
        message: "Profile အချက်အလက် မပြည့်စုံသေးပါ။",
      };
    }
  } catch {
    return {
      success: false,
      message: "AI failed to generate, try again",
    };
  }

  revalidatePath("/assessment");

  return {
    success: true,
    message: "AI အကြံပြုချက်ကို သိမ်းဆည်းပြီးပါပြီ။",
  };
}

export async function generatePlanAction(): Promise<GeneratePlanActionState> {
  let userId: string;

  try {
    const authUser = await requireAuthenticatedUser();
    userId = authUser.userId;
  } catch {
    return {
      success: false,
      message: "အကောင့်ဝင်ပြီးမှ ပြုလုပ်ပါ။",
    };
  }

  const [assessmentInput, latestAssessment] = await Promise.all([
    getAssessmentInputForUser(userId),
    getLatestAiAssessmentForUser(userId),
  ]);

  const currentInputHash = assessmentInput
    ? createAssessmentInputHash(assessmentInput).inputHash
    : null;

  if (!currentInputHash || !latestAssessment || latestAssessment.inputHash !== currentInputHash) {
    return {
      success: false,
      message:
        "Profile နှင့် Measurement အချက်အလက်များ ပြောင်းလဲထားသောကြောင့် AI အကြံပြုချက်အသစ် ရယူရန် လိုအပ်ပါသည်။",
    };
  }

  const result = await generateFourWeekPlanForUser(userId);

  if (!result.ok) {
    return {
      success: false,
      message: result.message,
    };
  }

  revalidatePath("/assessment");
  revalidatePath("/home");
  revalidatePath("/calendar");
  revalidatePath("/history");

  return {
    success: true,
    message: "",
  };
}
