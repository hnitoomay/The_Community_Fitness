"use client";

import { startTransition, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { PencilLine, Plus, Search, Slash } from "lucide-react";

import {
  initialNutritionTemplateActionState,
  type NutritionTemplateActionState,
} from "@/app/admin/nutrition-templates/action-state";
import {
  saveNutritionTemplateAction,
  updateNutritionTemplateStatusAction,
} from "@/app/admin/nutrition-templates/actions";
import { AdminConfirmDialog } from "@/components/admin/admin-confirm-dialog";
import { AdminEmptyState } from "@/components/admin/admin-empty-state";
import { AdminFilterBar } from "@/components/admin/admin-filter-bar";
import { AdminFormModal } from "@/components/admin/admin-form-modal";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminPagination } from "@/components/admin/admin-pagination";
import { AdminStatusBadge } from "@/components/admin/admin-status-badge";
import { AdminDataTable } from "@/components/admin/admin-table";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  mealCategoryOptions,
  mealsPerDayOptions,
  type AdminNutritionTemplateItem,
} from "@/types/admin-data";

const headers = [
  "Template Name",
  "Goal",
  "Meals per Day",
  "Calorie Range",
  "Meal Structure",
  "Status",
  "Actions",
];

const pageSize = 6;

interface BodyGoalOption {
  id: number;
  label: string;
}

interface NutritionTemplateItem extends AdminNutritionTemplateItem {
  bodyGoalLabel: string;
}

export interface AdminNutritionTemplatesScreenProps {
  nutritionTemplates: NutritionTemplateItem[];
  bodyGoals: BodyGoalOption[];
  filters: {
    search: string;
    bodyGoalId: string;
    status: string;
  };
}

const emptyDraft: AdminNutritionTemplateItem = {
  id: "",
  templateName: "",
  bodyGoalId: "",
  mealsPerDay: 3,
  minimumDailyCalories: 0,
  maximumDailyCalories: 0,
  mealStructure: [],
  notes: "",
  status: "Active",
};

export function AdminNutritionTemplatesScreen({
  nutritionTemplates,
  bodyGoals,
  filters,
}: AdminNutritionTemplatesScreenProps) {
  const pathname = usePathname();
  const formRef = useRef<HTMLFormElement>(null);

  const [page, setPage] = useState(1);
  const [formOpen, setFormOpen] = useState(false);
  const [confirmTarget, setConfirmTarget] = useState<NutritionTemplateItem | null>(
    null,
  );
  const [draft, setDraft] = useState<AdminNutritionTemplateItem>(emptyDraft);
  const [feedbackMessage, setFeedbackMessage] = useState("");
  const [isStatusPending, setIsStatusPending] = useState(false);
  const [isFormPending, setIsFormPending] = useState(false);
  const [formState, setFormState] = useState<NutritionTemplateActionState>(
    initialNutritionTemplateActionState,
  );

  const totalPages = Math.max(1, Math.ceil(nutritionTemplates.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const pagedRows = nutritionTemplates.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );

  const bodyGoalOptions = bodyGoals.map((item) => ({
    label: item.label,
    value: String(item.id),
  }));

  const openCreate = () => {
    setDraft(emptyDraft);
    setFeedbackMessage("");
    setFormState(initialNutritionTemplateActionState);
    setFormOpen(true);
  };

  const openEdit = (item: NutritionTemplateItem) => {
    setDraft({
      id: item.id,
      templateName: item.templateName,
      bodyGoalId: item.bodyGoalId,
      mealsPerDay: item.mealsPerDay,
      minimumDailyCalories: item.minimumDailyCalories,
      maximumDailyCalories: item.maximumDailyCalories,
      mealStructure: item.mealStructure,
      notes: item.notes,
      status: item.status,
    });
    setFeedbackMessage("");
    setFormState(initialNutritionTemplateActionState);
    setFormOpen(true);
  };

  const toggleMealStructure = (
    meal: AdminNutritionTemplateItem["mealStructure"][number],
  ) => {
    setDraft((current) => ({
      ...current,
      mealStructure: current.mealStructure.includes(meal)
        ? current.mealStructure.filter((item) => item !== meal)
        : [...current.mealStructure, meal],
    }));
  };

  const nextStatus = confirmTarget?.status === "Active" ? "Inactive" : "Active";

  const handleStatusChange = () => {
    if (!confirmTarget) {
      return;
    }

    setIsStatusPending(true);

    startTransition(async () => {
      const result = await updateNutritionTemplateStatusAction({
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
      const result = await saveNutritionTemplateAction(
        initialNutritionTemplateActionState,
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

  return (
    <div className="space-y-6">
      <AdminPageHeader
        eyebrow="Nutrition"
        title="Nutrition Templates"
        description="Define reusable meal structures and calorie ranges without creating daily meal-plan rows."
        action={
          <Button leadingIcon={<Plus className="size-4" />} onClick={openCreate}>
            Add New
          </Button>
        }
      />
      <AdminFilterBar>
        <form
          action={pathname}
          method="get"
          className="grid flex-1 gap-3 xl:grid-cols-3"
        >
          <div className="relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-[var(--color-text-secondary)]" />
            <Input
              name="q"
              defaultValue={filters.search}
              placeholder="Search template name"
              className="pl-10"
            />
          </div>
          <Select
            name="bodyGoalId"
            defaultValue={filters.bodyGoalId}
            options={[
              { label: "All Goals", value: "All" },
              ...bodyGoalOptions,
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
          <div className="xl:col-span-3 flex flex-wrap justify-end gap-3">
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
      {nutritionTemplates.length ? (
        <AdminDataTable
          headers={headers}
          footer={
            <AdminPagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPrevious={() => setPage((current) => Math.max(1, current - 1))}
              onNext={() => setPage((current) => Math.min(totalPages, current + 1))}
            />
          }
        >
          {pagedRows.map((item) => (
            <tr key={item.id}>
              <td className="px-5 py-4">
                <div className="space-y-1">
                  <p className="font-medium text-[var(--color-text)]">
                    {item.templateName}
                  </p>
                  <p className="text-sm text-[var(--color-text-secondary)]">
                    {item.notes || "No notes"}
                  </p>
                </div>
              </td>
              <td className="px-5 py-4 text-sm text-[var(--color-text-secondary)]">
                {item.bodyGoalLabel}
              </td>
              <td className="px-5 py-4 text-sm text-[var(--color-text-secondary)]">
                {item.mealsPerDay}
              </td>
              <td className="px-5 py-4 text-sm text-[var(--color-text-secondary)]">
                {item.minimumDailyCalories} - {item.maximumDailyCalories}
              </td>
              <td className="px-5 py-4 text-sm text-[var(--color-text-secondary)]">
                {item.mealStructure.join(", ")}
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
          title="No nutrition templates match these filters"
          description="Adjust the filters or create a new nutrition template."
        />
      )}
      <AdminFormModal
        open={formOpen}
        title={draft.id ? "Edit Nutrition Template" : "Add Nutrition Template"}
        description="Keep the calorie range and meal structure practical for later personalization."
        onClose={() => setFormOpen(false)}
      >
        <form ref={formRef} className="space-y-4" onSubmit={handleFormSubmit}>
          <input type="hidden" name="id" value={draft.id} />
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium text-[var(--color-text)]">
                Template Name
              </label>
              <Input
                name="name"
                value={draft.templateName}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    templateName: event.target.value,
                  }))
                }
                aria-invalid={formErrors.templateName ? true : undefined}
              />
              {formErrors.templateName ? (
                <p className="text-sm text-[var(--color-error)]">
                  {formErrors.templateName}
                </p>
              ) : null}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-[var(--color-text)]">
                Body Goal
              </label>
              <Select
                name="bodyGoalId"
                value={draft.bodyGoalId}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    bodyGoalId: event.target.value,
                  }))
                }
                placeholder={bodyGoals.length ? "Select body goal" : "No body goals available"}
                options={bodyGoalOptions}
                aria-invalid={formErrors.bodyGoalId ? true : undefined}
              />
              {formErrors.bodyGoalId ? (
                <p className="text-sm text-[var(--color-error)]">
                  {formErrors.bodyGoalId}
                </p>
              ) : null}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-[var(--color-text)]">
                Meals per Day
              </label>
              <Select
                name="mealsPerDay"
                value={String(draft.mealsPerDay)}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    mealsPerDay: Number(event.target.value) as 3 | 4 | 5,
                  }))
                }
                options={mealsPerDayOptions.map((item) => ({
                  label: String(item),
                  value: String(item),
                }))}
                aria-invalid={formErrors.mealsPerDay ? true : undefined}
              />
              {formErrors.mealsPerDay ? (
                <p className="text-sm text-[var(--color-error)]">
                  {formErrors.mealsPerDay}
                </p>
              ) : null}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-[var(--color-text)]">
                Minimum Daily Calories
              </label>
              <Input
                name="minimumCalories"
                type="number"
                min={0}
                value={draft.minimumDailyCalories}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    minimumDailyCalories: Number(event.target.value),
                  }))
                }
                aria-invalid={formErrors.minimumDailyCalories ? true : undefined}
              />
              {formErrors.minimumDailyCalories ? (
                <p className="text-sm text-[var(--color-error)]">
                  {formErrors.minimumDailyCalories}
                </p>
              ) : null}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-[var(--color-text)]">
                Maximum Daily Calories
              </label>
              <Input
                name="maximumCalories"
                type="number"
                min={0}
                value={draft.maximumDailyCalories}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    maximumDailyCalories: Number(event.target.value),
                  }))
                }
                aria-invalid={formErrors.maximumDailyCalories ? true : undefined}
              />
              {formErrors.maximumDailyCalories ? (
                <p className="text-sm text-[var(--color-error)]">
                  {formErrors.maximumDailyCalories}
                </p>
              ) : null}
            </div>
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium text-[var(--color-text)]">
                Meal Structure
              </label>
              <div className="grid gap-3 rounded-2xl border border-[var(--color-border)] p-4 md:grid-cols-2">
                {mealCategoryOptions.map((meal) => {
                  const checked = draft.mealStructure.includes(meal);

                  return (
                    <Checkbox
                      key={meal}
                      name="mealStructure"
                      value={meal}
                      checked={checked}
                      onChange={() => toggleMealStructure(meal)}
                      label={meal}
                      description="Included in the template structure."
                    />
                  );
                })}
              </div>
              {formErrors.mealStructure ? (
                <p className="text-sm text-[var(--color-error)]">
                  {formErrors.mealStructure}
                </p>
              ) : null}
            </div>
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium text-[var(--color-text)]">
                Notes
              </label>
              <Textarea
                name="notes"
                value={draft.notes}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    notes: event.target.value,
                  }))
                }
                className="min-h-24"
              />
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
                    status: event.target.value as AdminNutritionTemplateItem["status"],
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
        title="Update nutrition template status"
        description={
          confirmTarget
            ? `This will mark ${confirmTarget.templateName} as ${nextStatus.toLowerCase()}.`
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
