import type { AiAssessmentRecord } from "@/types/client-onboarding";

const NO_ASSESSMENT_MESSAGE = "AI အကြံပြုချက် မရှိသေးပါ။";
const OUTDATED_ASSESSMENT_MESSAGE =
  "";

export type AssessmentViewState =
  | {
      kind: "none";
      message: typeof NO_ASSESSMENT_MESSAGE;
      actionLabel: "AI အကြံပြုချက် ရယူမည်";
      outdated: false;
    }
  | {
      kind: "current";
      message: null;
      actionLabel: null;
      outdated: false;
    }
  | {
      kind: "outdated" | "legacy";
      message: typeof OUTDATED_ASSESSMENT_MESSAGE;
      actionLabel: "AI အကြံပြုချက်အသစ် ရယူမည်";
      outdated: true;
    };

export type AssessmentPrimaryAction =
  | {
      kind: "assessment";
      label: "AI အကြံပြုချက် ရယူမည်" | "AI အကြံပြုချက်အသစ် ရယူမည်";
    }
  | {
      kind: "plan";
      label: "Generate new plan" | "Generate Updated One-Month Plan";
    }
  | {
      kind: "calendar";
      label: "View Current Plan";
    }
  | {
      kind: "none";
      label: null;
    };

export function resolveAssessmentViewState(input: {
  latestAssessment: AiAssessmentRecord | null;
  isOutdated: boolean;
  hasCurrentAssessment: boolean;
}): AssessmentViewState {
  if (!input.latestAssessment) {
    return {
      kind: "none",
      message: NO_ASSESSMENT_MESSAGE,
      actionLabel: "AI အကြံပြုချက် ရယူမည်",
      outdated: false,
    };
  }

  if (!input.hasCurrentAssessment) {
    return {
      kind: "legacy",
      message: OUTDATED_ASSESSMENT_MESSAGE,
      actionLabel: "AI အကြံပြုချက်အသစ် ရယူမည်",
      outdated: true,
    };
  }

  if (input.isOutdated) {
    return {
      kind: "outdated",
      message: OUTDATED_ASSESSMENT_MESSAGE,
      actionLabel: "AI အကြံပြုချက်အသစ် ရယူမည်",
      outdated: true,
    };
  }

  return {
    kind: "current",
    message: null,
    actionLabel: null,
    outdated: false,
  };
}

export function resolveAssessmentPrimaryAction(input: {
  viewState: AssessmentViewState;
  canGenerateAssessment: boolean;
  canGeneratePlan: boolean;
  hasCurrentPlan: boolean;
  isPlanOutdated: boolean;
}): AssessmentPrimaryAction {
  if (
    input.viewState.kind === "none" ||
    input.viewState.kind === "outdated" ||
    input.viewState.kind === "legacy"
  ) {
    if (!input.canGenerateAssessment || !input.viewState.actionLabel) {
      return { kind: "none", label: null };
    }

    return {
      kind: "assessment",
      label: input.viewState.actionLabel,
    };
  }

  if (input.hasCurrentPlan) {
    return {
      kind: "calendar",
      label: "View Current Plan",
    };
  }

  if (input.canGeneratePlan) {
    return {
      kind: "plan",
      label: input.isPlanOutdated
        ? "Generate Updated One-Month Plan"
        : "Generate new plan",
    };
  }

  return { kind: "none", label: null };
}

export const __testing__ = {
  NO_ASSESSMENT_MESSAGE,
  OUTDATED_ASSESSMENT_MESSAGE,
  resolveAssessmentPrimaryAction,
  resolveAssessmentViewState,
};
