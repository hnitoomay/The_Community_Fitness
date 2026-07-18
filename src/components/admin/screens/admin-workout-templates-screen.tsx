"use client";

import { startTransition, useMemo, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { PencilLine, Plus, Search, Slash } from "lucide-react";

import {
  initialWorkoutTemplateActionState,
  type WorkoutTemplateActionState,
} from "@/app/admin/workout-templates/action-state";
import {
  saveWorkoutTemplateAction,
  updateWorkoutTemplateStatusAction,
} from "@/app/admin/workout-templates/actions";
import { AdminConfirmDialog } from "@/components/admin/admin-confirm-dialog";
import { AdminEmptyState } from "@/components/admin/admin-empty-state";
import { AdminFilterBar } from "@/components/admin/admin-filter-bar";
import { AdminFormModal } from "@/components/admin/admin-form-modal";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminPagination } from "@/components/admin/admin-pagination";
import { AdminStatusBadge } from "@/components/admin/admin-status-badge";
import { AdminDataTable } from "@/components/admin/admin-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  difficultyOptions,
  focusCategoryOptions,
  templateDayTypeOptions,
  workoutTemplateDaysPerWeekOptions,
  type AdminWorkoutTemplateItem,
  type WorkoutTemplateDayRow,
} from "@/types/admin-data";

const headers = [
  "Template Name",
  "Goal",
  "Days per Week",
  "Weekly Structure",
  "Status",
  "Actions",
];

const pageSize = 6;

interface BodyGoalOption {
  id: number;
  label: string;
}

interface WorkoutTemplateItem extends AdminWorkoutTemplateItem {
  bodyGoalLabel: string;
}

export interface AdminWorkoutTemplatesScreenProps {
  workoutTemplates: WorkoutTemplateItem[];
  bodyGoals: BodyGoalOption[];
  filters: {
    search: string;
    bodyGoalId: string;
    difficulty: string;
    status: string;
  };
}

function buildWeeklyRows(
  daysPerWeek: 3 | 4 | 5 | 6,
  existingRows?: WorkoutTemplateDayRow[],
) {
  const rowMap = new Map(
    (existingRows ?? []).map((row) => [row.dayNumber, row] as const),
  );

  return Array.from({ length: 7 }, (_, index) => {
    const dayNumber = index + 1;
    const existingRow = rowMap.get(dayNumber);

    if (existingRow) {
      return {
        ...existingRow,
        id: existingRow.id || `day-${dayNumber}`,
      };
    }

    const activeDay = dayNumber <= daysPerWeek;

    return {
      id: `day-${dayNumber}`,
      dayNumber,
      dayType: activeDay ? "Workout" : "Rest",
      focusCategory: activeDay ? "Full Body" : "Rest",
      exerciseCount: activeDay ? 5 : 0,
    } satisfies WorkoutTemplateDayRow;
  });
}

const emptyDraft: AdminWorkoutTemplateItem = {
  id: "",
  templateName: "",
  bodyGoalId: "",
  daysPerWeek: 3,
  difficulty: "Beginner",
  weeklyDayStructure: buildWeeklyRows(3),
  notes: "",
  status: "Active",
};

export function AdminWorkoutTemplatesScreen({
  workoutTemplates,
  bodyGoals,
  filters,
}: AdminWorkoutTemplatesScreenProps) {
  const pathname = usePathname();
  const formRef = useRef<HTMLFormElement>(null);

  const [page, setPage] = useState(1);
  const [formOpen, setFormOpen] = useState(false);
  const [confirmTarget, setConfirmTarget] = useState<WorkoutTemplateItem | null>(
    null,
  );
  const [draft, setDraft] = useState<AdminWorkoutTemplateItem>(emptyDraft);
  const [feedbackMessage, setFeedbackMessage] = useState("");
  const [isStatusPending, setIsStatusPending] = useState(false);
  const [isFormPending, setIsFormPending] = useState(false);
  const [formState, setFormState] = useState<WorkoutTemplateActionState>(
    initialWorkoutTemplateActionState,
  );

  const totalPages = Math.max(1, Math.ceil(workoutTemplates.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const pagedRows = workoutTemplates.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );

  const goalOptions = bodyGoals.map((item) => ({
    label: item.label,
    value: String(item.id),
  }));

  const weeklyPreview = useMemo(
    () =>
      [...draft.weeklyDayStructure]
        .sort((left, right) => left.dayNumber - right.dayNumber)
        .map((row) => ({
          ...row,
          summary:
            row.dayType === "Rest"
              ? "Rest - Rest - 0 exercises"
              : `${row.dayType} - ${row.focusCategory} - ${row.exerciseCount} exercises`,
        })),
    [draft.weeklyDayStructure],
  );

  const openCreate = () => {
    setDraft(emptyDraft);
    setFeedbackMessage("");
    setFormState(initialWorkoutTemplateActionState);
    setFormOpen(true);
  };

  const openEdit = (item: WorkoutTemplateItem) => {
    setDraft({
      id: item.id,
      templateName: item.templateName,
      bodyGoalId: item.bodyGoalId,
      daysPerWeek: item.daysPerWeek,
      difficulty: item.difficulty,
      weeklyDayStructure: buildWeeklyRows(item.daysPerWeek, item.weeklyDayStructure),
      notes: item.notes,
      status: item.status,
    });
    setFeedbackMessage("");
    setFormState(initialWorkoutTemplateActionState);
    setFormOpen(true);
  };

  const updateDaysPerWeek = (daysPerWeek: 3 | 4 | 5 | 6) => {
    setDraft((current) => ({
      ...current,
      daysPerWeek,
      weeklyDayStructure: buildWeeklyRows(daysPerWeek, current.weeklyDayStructure),
    }));
  };

  const updateRow = (
    rowId: string,
    patch: Partial<Omit<WorkoutTemplateDayRow, "dayNumber">>,
  ) => {
    setDraft((current) => ({
      ...current,
      weeklyDayStructure: current.weeklyDayStructure.map((row) => {
        if (row.id !== rowId) {
          return row;
        }

        const nextRow = { ...row, ...patch };

        if (patch.dayType === "Rest") {
          nextRow.focusCategory = "Rest";
          nextRow.exerciseCount = 0;
        }

        return nextRow;
      }),
    }));
  };

  const nextStatus = confirmTarget?.status === "Active" ? "Inactive" : "Active";

  const handleStatusChange = () => {
    if (!confirmTarget) {
      return;
    }

    setIsStatusPending(true);

    startTransition(async () => {
      const result = await updateWorkoutTemplateStatusAction({
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
      const result = await saveWorkoutTemplateAction(
        initialWorkoutTemplateActionState,
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
        eyebrow="Templates"
        title="Workout Templates"
        description="Create repeatable weekly workout structures that can later be personalized."
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
          className="grid flex-1 gap-3 xl:grid-cols-4"
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
              ...goalOptions,
            ]}
          />
          <Select
            name="difficulty"
            defaultValue={filters.difficulty}
            options={[
              { label: "All Difficulty", value: "All" },
              ...difficultyOptions.map((item) => ({ label: item, value: item })),
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
          <div className="xl:col-span-4 flex flex-wrap justify-end gap-3">
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
      {workoutTemplates.length ? (
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
                    {item.difficulty}
                  </p>
                </div>
              </td>
              <td className="px-5 py-4 text-sm text-[var(--color-text-secondary)]">
                {item.bodyGoalLabel}
              </td>
              <td className="px-5 py-4 text-sm text-[var(--color-text-secondary)]">
                {item.daysPerWeek}
              </td>
              <td className="px-5 py-4">
                <div className="grid gap-2 md:grid-cols-2">
                  {item.weeklyDayStructure
                    .slice()
                    .sort((left, right) => left.dayNumber - right.dayNumber)
                    .map((row) => (
                      <div
                        key={row.id}
                        className="rounded-xl bg-[var(--color-muted-bg)] px-3 py-2"
                      >
                        <p className="text-sm font-semibold text-[var(--color-text)]">
                          Day {row.dayNumber}
                        </p>
                        <p className="text-xs text-[var(--color-text-secondary)]">
                          {row.dayType} - {row.focusCategory} - {row.exerciseCount}
                        </p>
                      </div>
                    ))}
                </div>
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
          title="No workout templates match these filters"
          description="Adjust the search or filters, or create a new workout template."
        />
      )}
      <AdminFormModal
        open={formOpen}
        title={draft.id ? "Edit Workout Template" : "Add Workout Template"}
        description="Define a reusable seven-day weekly structure without creating a full monthly plan."
        onClose={() => setFormOpen(false)}
      >
        <form ref={formRef} className="space-y-5" onSubmit={handleFormSubmit}>
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
                options={goalOptions}
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
                Days per Week
              </label>
              <Select
                name="daysPerWeek"
                value={String(draft.daysPerWeek)}
                onChange={(event) =>
                  updateDaysPerWeek(Number(event.target.value) as 3 | 4 | 5 | 6)
                }
                options={workoutTemplateDaysPerWeekOptions.map((item) => ({
                  label: String(item),
                  value: String(item),
                }))}
                aria-invalid={formErrors.daysPerWeek ? true : undefined}
              />
              {formErrors.daysPerWeek ? (
                <p className="text-sm text-[var(--color-error)]">
                  {formErrors.daysPerWeek}
                </p>
              ) : null}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-[var(--color-text)]">
                Difficulty
              </label>
              <Select
                name="difficulty"
                value={draft.difficulty}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    difficulty:
                      event.target.value as AdminWorkoutTemplateItem["difficulty"],
                  }))
                }
                options={difficultyOptions.map((item) => ({
                  label: item,
                  value: item,
                }))}
                aria-invalid={formErrors.difficulty ? true : undefined}
              />
              {formErrors.difficulty ? (
                <p className="text-sm text-[var(--color-error)]">
                  {formErrors.difficulty}
                </p>
              ) : null}
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-[var(--color-text)]">
                Weekly Day Structure
              </p>
              <p className="text-sm text-[var(--color-text-secondary)]">
                Submit exactly seven rows with unique day numbers.
              </p>
            </div>
            {draft.weeklyDayStructure
              .slice()
              .sort((left, right) => left.dayNumber - right.dayNumber)
              .map((row) => (
                <div
                  key={row.id}
                  className="grid gap-3 rounded-2xl border border-[var(--color-border)] p-4 xl:grid-cols-4"
                >
                  <input type="hidden" name="dayNumbers" value={row.dayNumber} />
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-[var(--color-text)]">
                      Day Number
                    </label>
                    <Input value={row.dayNumber} readOnly />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-[var(--color-text)]">
                      Day Type
                    </label>
                    <Select
                      name="dayTypes"
                      value={row.dayType}
                      onChange={(event) =>
                        updateRow(row.id, {
                          dayType: event.target.value as WorkoutTemplateDayRow["dayType"],
                        })
                      }
                      options={templateDayTypeOptions.map((item) => ({
                        label: item,
                        value: item,
                      }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-[var(--color-text)]">
                      Focus Category
                    </label>
                    <input
                      type="hidden"
                      name="focusCategories"
                      value={row.focusCategory}
                    />
                    <Select
                      value={row.focusCategory}
                      onChange={(event) =>
                        updateRow(row.id, {
                          focusCategory:
                            event.target.value as WorkoutTemplateDayRow["focusCategory"],
                        })
                      }
                      options={focusCategoryOptions.map((item) => ({
                        label: item,
                        value: item,
                      }))}
                      disabled={row.dayType === "Rest"}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-[var(--color-text)]">
                      Exercise Count
                    </label>
                    <Input
                      name="exerciseCounts"
                      type="number"
                      min={0}
                      value={row.exerciseCount}
                      onChange={(event) =>
                        updateRow(row.id, {
                          exerciseCount: Number(event.target.value),
                        })
                      }
                      readOnly={row.dayType === "Rest"}
                    />
                  </div>
                </div>
              ))}
            {formErrors.weeklyDayStructure ? (
              <p className="text-sm text-[var(--color-error)]">
                {formErrors.weeklyDayStructure}
              </p>
            ) : null}
          </div>
          <div className="space-y-2">
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
          <div className="space-y-3 rounded-2xl border border-dashed border-[var(--color-border)] p-4">
            <p className="text-sm font-medium text-[var(--color-text)]">
              Weekly Preview
            </p>
            <div className="grid gap-2 md:grid-cols-2">
              {weeklyPreview.map((row) => (
                <div
                  key={`${row.id}-preview`}
                  className="rounded-xl bg-[var(--color-muted-bg)] p-3"
                >
                  <p className="text-sm font-semibold text-[var(--color-text)]">
                    Day {row.dayNumber}
                  </p>
                  <p className="text-sm text-[var(--color-text-secondary)]">
                    {row.summary}
                  </p>
                </div>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-[var(--color-text)]">
              Status
            </label>
            <Select
              name="status"
              value={draft.status}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  status: event.target.value as AdminWorkoutTemplateItem["status"],
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
        title="Update workout template status"
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
