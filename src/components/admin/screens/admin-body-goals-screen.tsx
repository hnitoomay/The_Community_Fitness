"use client";

import { startTransition, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { ImageIcon, PencilLine, Plus, Search, Slash } from "lucide-react";

import {
  saveBodyGoalAction,
  updateBodyGoalStatusAction,
} from "@/app/admin/body-goals/actions";
import {
  initialBodyGoalActionState,
  type BodyGoalActionState,
} from "@/app/admin/body-goals/action-state";
import { AdminConfirmDialog } from "@/components/admin/admin-confirm-dialog";
import { AdminFilterBar } from "@/components/admin/admin-filter-bar";
import { AdminFormModal } from "@/components/admin/admin-form-modal";
import { AdminEmptyState } from "@/components/admin/admin-empty-state";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminStatusBadge } from "@/components/admin/admin-status-badge";
import { AdminDataTable } from "@/components/admin/admin-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  genderDisplayOptions,
  type AdminBodyGoalItem,
  type GenderDisplay,
} from "@/types/admin-data";

const headers = [
  "Image",
  "Goal Label",
  "Gender",
  "Workout Template",
  "Nutrition Template",
  "Status",
  "Actions",
];

const emptyDraft: AdminBodyGoalItem = {
  id: "",
  goalLabel: "",
  shortDescription: "",
  genderDisplay: "All",
  image: "",
  workoutTemplateId: "",
  nutritionTemplateId: "",
  status: "Active",
};

interface BodyGoalItem extends AdminBodyGoalItem {
  workoutTemplateName?: string;
  nutritionTemplateName?: string;
}

interface TemplateOption {
  id: number;
  name: string;
}

export interface AdminBodyGoalsScreenProps {
  bodyGoals: BodyGoalItem[];
  workoutTemplates: TemplateOption[];
  nutritionTemplates: TemplateOption[];
  filters: {
    search: string;
    genderDisplay: string;
    status: string;
  };
}

export function AdminBodyGoalsScreen({
  bodyGoals,
  workoutTemplates,
  nutritionTemplates,
  filters,
}: AdminBodyGoalsScreenProps) {
  const pathname = usePathname();
  const formRef = useRef<HTMLFormElement>(null);

  const [formOpen, setFormOpen] = useState(false);
  const [confirmTarget, setConfirmTarget] = useState<BodyGoalItem | null>(null);
  const [draft, setDraft] = useState<AdminBodyGoalItem>(emptyDraft);
  const [feedbackMessage, setFeedbackMessage] = useState("");
  const [isStatusPending, setIsStatusPending] = useState(false);
  const [isFormPending, setIsFormPending] = useState(false);
  const [formState, setFormState] = useState<BodyGoalActionState>(
    initialBodyGoalActionState,
  );

  const openCreate = () => {
    setDraft(emptyDraft);
    setFeedbackMessage("");
    setFormState(initialBodyGoalActionState);
    setFormOpen(true);
  };

  const openEdit = (item: BodyGoalItem) => {
    setDraft({
      id: item.id,
      goalLabel: item.goalLabel,
      shortDescription: item.shortDescription,
      genderDisplay: item.genderDisplay,
      image: item.image,
      workoutTemplateId: item.workoutTemplateId ?? "",
      nutritionTemplateId: item.nutritionTemplateId ?? "",
      status: item.status,
    });
    setFeedbackMessage("");
    setFormState(initialBodyGoalActionState);
    setFormOpen(true);
  };

  const nextStatus = confirmTarget?.status === "Active" ? "Inactive" : "Active";

  const handleStatusChange = () => {
    if (!confirmTarget) {
      return;
    }

    setIsStatusPending(true);

    startTransition(async () => {
      const result = await updateBodyGoalStatusAction({
        id: Number(confirmTarget.id),
        status: nextStatus,
      });

      setIsStatusPending(false);
      setConfirmTarget(null);
      setFeedbackMessage(result.message);
    });
  };

  const handleFormSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    setIsFormPending(true);

    startTransition(async () => {
      const result = await saveBodyGoalAction(
        initialBodyGoalActionState,
        formData,
      );
      setFormState(result);
      setIsFormPending(false);

      if (result.success) {
        setFormOpen(false);
        setDraft(emptyDraft);
        setFeedbackMessage(result.message);
        formRef.current?.reset();
      }
    });
  };

  const formErrors = formState.errors;
  const workoutTemplateOptions = workoutTemplates.length
    ? workoutTemplates.map((item) => ({
        label: item.name,
        value: String(item.id),
      }))
    : [];
  const nutritionTemplateOptions = nutritionTemplates.length
    ? nutritionTemplates.map((item) => ({
        label: item.name,
        value: String(item.id),
      }))
    : [];

  return (
    <div className="space-y-6">
      <AdminPageHeader
        eyebrow="Goals"
        title="Body Goals"
        description="Manage the six client-facing body goals used later by plan generation."
        action={
          <Button leadingIcon={<Plus className="size-4" />} onClick={openCreate}>
            Add New
          </Button>
        }
      />
      <AdminFilterBar>
        <form action={pathname} method="get" className="grid flex-1 gap-3 lg:grid-cols-3">
          <div className="relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-[var(--color-text-secondary)]" />
            <Input
              name="q"
              defaultValue={filters.search}
              placeholder="Search goal label"
              className="pl-10"
            />
          </div>
          <Select
            name="genderDisplay"
            defaultValue={filters.genderDisplay}
            options={[
              { label: "All Gender Display", value: "All" },
              ...genderDisplayOptions.map((item) => ({ label: item, value: item })),
            ]}
          />
          <Select
            name="status"
            defaultValue={filters.status}
            options={[
              { label: "All Status", value: "All" },
              { label: "Active", value: "Active" },
              { label: "Inactive", value: "Inactive" },
            ]}
          />
          <div className="lg:col-span-3 flex flex-wrap justify-end gap-3">
            <Button type="submit" variant="secondary">
              Apply Filters
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                window.location.href = pathname;
              }}
            >
              Clear
            </Button>
          </div>
        </form>
      </AdminFilterBar>
      {feedbackMessage ? (
        <p className="text-sm text-[var(--color-text-secondary)]">{feedbackMessage}</p>
      ) : null}
      {bodyGoals.length ? (
        <AdminDataTable headers={headers}>
          {bodyGoals.map((item) => (
            <tr key={item.id}>
              <td className="px-5 py-4">
                <div className="flex size-14 items-center justify-center rounded-2xl bg-[var(--color-muted-bg)]">
                  <ImageIcon className="size-5 text-[var(--color-primary)]" />
                </div>
              </td>
              <td className="px-5 py-4">
                <div className="space-y-1">
                  <p className="font-medium text-[var(--color-text)]">{item.goalLabel}</p>
                  <p className="text-sm text-[var(--color-text-secondary)]">
                    {item.shortDescription}
                  </p>
                </div>
              </td>
              <td className="px-5 py-4 text-sm text-[var(--color-text-secondary)]">
                {item.genderDisplay}
              </td>
              <td className="px-5 py-4 text-sm text-[var(--color-text-secondary)]">
                {item.workoutTemplateName || "-"}
              </td>
              <td className="px-5 py-4 text-sm text-[var(--color-text-secondary)]">
                {item.nutritionTemplateName || "-"}
              </td>
              <td className="px-5 py-4">
                <AdminStatusBadge status={item.status} />
              </td>
              <td className="px-5 py-4">
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    leadingIcon={<PencilLine className="size-4" />}
                    onClick={() => openEdit(item)}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    leadingIcon={<Slash className="size-4" />}
                    onClick={() => setConfirmTarget(item)}
                  >
                    {item.status === "Active" ? "Deactivate" : "Activate"}
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </AdminDataTable>
      ) : (
        <AdminEmptyState
          title="No body goals match these filters"
          description="Adjust the filters or create a new body goal record."
        />
      )}
      <AdminFormModal
        open={formOpen}
        title={draft.id ? "Edit Body Goal" : "Add Body Goal"}
        description="The future AI will use the goal ID, label, and description. It will not inspect the image."
        onClose={() => setFormOpen(false)}
      >
        <form ref={formRef} className="space-y-5" onSubmit={handleFormSubmit}>
          <input type="hidden" name="id" value={draft.id} />
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium text-[var(--color-text)]">
                Goal Label
              </label>
              <Input
                name="label"
                value={draft.goalLabel}
                onChange={(event) =>
                  setDraft((current) => ({ ...current, goalLabel: event.target.value }))
                }
                aria-invalid={formErrors.goalLabel ? true : undefined}
              />
              {formErrors.goalLabel ? (
                <p className="text-sm text-[var(--color-error)]">{formErrors.goalLabel}</p>
              ) : null}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-[var(--color-text)]">
                Gender Display
              </label>
              <Select
                name="genderDisplay"
                value={draft.genderDisplay}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    genderDisplay: event.target.value as GenderDisplay,
                  }))
                }
                options={genderDisplayOptions.map((item) => ({
                  label: item,
                  value: item,
                }))}
                aria-invalid={formErrors.genderDisplay ? true : undefined}
              />
              {formErrors.genderDisplay ? (
                <p className="text-sm text-[var(--color-error)]">
                  {formErrors.genderDisplay}
                </p>
              ) : null}
            </div>
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium text-[var(--color-text)]">
                Short Description
              </label>
              <Textarea
                name="description"
                value={draft.shortDescription}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    shortDescription: event.target.value,
                  }))
                }
                aria-invalid={formErrors.shortDescription ? true : undefined}
                className="min-h-24"
              />
              {formErrors.shortDescription ? (
                <p className="text-sm text-[var(--color-error)]">
                  {formErrors.shortDescription}
                </p>
              ) : null}
            </div>
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium text-[var(--color-text)]">
                Image URL or mock image path
              </label>
              <Input
                name="imageUrl"
                value={draft.image}
                onChange={(event) =>
                  setDraft((current) => ({ ...current, image: event.target.value }))
                }
                placeholder="Leave empty to use placeholder"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-[var(--color-text)]">
                Workout Template
              </label>
              <Select
                name="workoutTemplateId"
                value={draft.workoutTemplateId || ""}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    workoutTemplateId: event.target.value,
                  }))
                }
                placeholder={
                  workoutTemplates.length ? "Optional" : "No templates available"
                }
                options={workoutTemplateOptions}
                aria-invalid={formErrors.workoutTemplateId ? true : undefined}
              />
              {formErrors.workoutTemplateId ? (
                <p className="text-sm text-[var(--color-error)]">
                  {formErrors.workoutTemplateId}
                </p>
              ) : null}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-[var(--color-text)]">
                Nutrition Template
              </label>
              <Select
                name="nutritionTemplateId"
                value={draft.nutritionTemplateId || ""}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    nutritionTemplateId: event.target.value,
                  }))
                }
                placeholder={
                  nutritionTemplates.length ? "Optional" : "No templates available"
                }
                options={nutritionTemplateOptions}
                aria-invalid={formErrors.nutritionTemplateId ? true : undefined}
              />
              {formErrors.nutritionTemplateId ? (
                <p className="text-sm text-[var(--color-error)]">
                  {formErrors.nutritionTemplateId}
                </p>
              ) : null}
            </div>
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium text-[var(--color-text)]">
                Status
              </label>
              <Select
                name="status"
                value={draft.status}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    status: event.target.value as AdminBodyGoalItem["status"],
                  }))
                }
                options={[
                  { label: "Active", value: "Active" },
                  { label: "Inactive", value: "Inactive" },
                ]}
                aria-invalid={formErrors.status ? true : undefined}
              />
              {formErrors.status ? (
                <p className="text-sm text-[var(--color-error)]">{formErrors.status}</p>
              ) : null}
            </div>
          </div>
          <div className="rounded-[1.5rem] border border-dashed border-[var(--color-border)] p-4">
            <p className="text-sm font-medium text-[var(--color-text)]">Card Preview</p>
            <div className="mt-3 max-w-xs rounded-[1.5rem] border border-[var(--color-border)] bg-white p-3">
              <div className="flex aspect-[4/5] items-center justify-center rounded-[1rem] bg-[var(--color-muted-bg)]">
                <div className="text-center">
                  <ImageIcon className="mx-auto size-8 text-[var(--color-primary)]" />
                  <p className="mt-2 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-text-secondary)]">
                    {draft.image || "Image placeholder"}
                  </p>
                </div>
              </div>
              <p className="mt-3 text-sm font-semibold text-[var(--color-text)]">
                {draft.goalLabel || "Goal Label"}
              </p>
              <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
                {draft.shortDescription || "Short description preview"}
              </p>
            </div>
          </div>
          {formErrors.form ? (
            <p className="text-sm text-[var(--color-error)]">{formErrors.form}</p>
          ) : null}
          <div className="flex justify-end gap-3">
            <Button type="button" variant="secondary" onClick={() => setFormOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={isFormPending}>
              Save
            </Button>
          </div>
        </form>
      </AdminFormModal>
      <AdminConfirmDialog
        open={Boolean(confirmTarget)}
        title="Update body goal status"
        description={
          confirmTarget
            ? `This will mark ${confirmTarget.goalLabel} as ${nextStatus.toLowerCase()}.`
            : ""
        }
        confirmLabel={nextStatus === "Active" ? "Activate" : "Deactivate"}
        confirmLoading={isStatusPending}
        onCancel={() => setConfirmTarget(null)}
        onConfirm={handleStatusChange}
      />
    </div>
  );
}
