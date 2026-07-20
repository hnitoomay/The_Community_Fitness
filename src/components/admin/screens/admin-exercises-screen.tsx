"use client";

import {
  startTransition,
  useRef,
  useState,
} from "react";
import { usePathname } from "next/navigation";
import { ImageIcon, PencilLine, Plus, Search, Slash } from "lucide-react";

import {
  saveExerciseAction,
  updateExerciseStatusAction,
} from "@/app/admin/exercises/actions";
import {
  initialExerciseActionState,
  type ExerciseActionState,
} from "@/app/admin/exercises/action-state";
import { AdminConfirmDialog } from "@/components/admin/admin-confirm-dialog";
import { AdminFilterBar } from "@/components/admin/admin-filter-bar";
import { AdminFormModal } from "@/components/admin/admin-form-modal";
import { ImageUpload } from "@/components/admin/image-upload";
import { AdminEmptyState } from "@/components/admin/admin-empty-state";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminPagination } from "@/components/admin/admin-pagination";
import { AdminStatusBadge } from "@/components/admin/admin-status-badge";
import { AdminDataTable } from "@/components/admin/admin-table";
import { uploadAdminImage } from "@/lib/admin-image-upload";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  difficultyOptions,
  exerciseCategoryOptions,
  type AdminExerciseItem,
  type AdminRecordStatus,
} from "@/types/admin-data";

const headers = [
  "Image",
  "Exercise Name",
  "Category",
  "Difficulty",
  "Required Equipment",
  "Status",
  "Actions",
];

const pageSize = 6;

const emptyDraft: AdminExerciseItem = {
  id: "",
  exerciseName: "",
  imageUrl: "",
  category: "Chest",
  difficulty: "Beginner",
  requiredEquipmentIds: [],
  defaultSets: undefined,
  defaultRepetitionsOrDuration: "",
  shortInstructions: "",
  status: "Active",
};

interface SelectableEquipmentItem {
  id: number;
  name: string;
  category: string;
}

interface ExerciseItem extends AdminExerciseItem {
  requiredEquipmentNames: string[];
}

export interface AdminExercisesScreenProps {
  exercises: ExerciseItem[];
  selectableEquipment: SelectableEquipmentItem[];
  filters: {
    search: string;
    category: string;
    difficulty: string;
    status: string;
  };
}

export function AdminExercisesScreen({
  exercises,
  selectableEquipment,
  filters,
}: AdminExercisesScreenProps) {
  const pathname = usePathname();
  const formRef = useRef<HTMLFormElement>(null);

  const [page, setPage] = useState(1);
  const [formOpen, setFormOpen] = useState(false);
  const [confirmTarget, setConfirmTarget] = useState<ExerciseItem | null>(null);
  const [draft, setDraft] = useState<AdminExerciseItem>(emptyDraft);
  const [feedbackMessage, setFeedbackMessage] = useState("");
  const [isStatusPending, setIsStatusPending] = useState(false);
  const [isFormPending, setIsFormPending] = useState(false);
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
  const [previewImageUrl, setPreviewImageUrl] = useState("");
  const [formState, setFormState] = useState<ExerciseActionState>(
    initialExerciseActionState,
  );

  const totalPages = Math.max(1, Math.ceil(exercises.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const pagedRows = exercises.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );

  const openCreate = () => {
    setDraft(emptyDraft);
    setSelectedImageFile(null);
    setPreviewImageUrl("");
    setFeedbackMessage("");
    setFormState(initialExerciseActionState);
    setFormOpen(true);
  };

  const openEdit = (item: ExerciseItem) => {
    setDraft({
      id: item.id,
      exerciseName: item.exerciseName,
      imageUrl: item.imageUrl,
      category: item.category,
      difficulty: item.difficulty,
      requiredEquipmentIds: item.requiredEquipmentIds,
      defaultSets: item.defaultSets,
      defaultRepetitionsOrDuration: item.defaultRepetitionsOrDuration,
      shortInstructions: item.shortInstructions,
      status: item.status,
    });
    setSelectedImageFile(null);
    setPreviewImageUrl(item.imageUrl);
    setFeedbackMessage("");
    setFormState(initialExerciseActionState);
    setFormOpen(true);
  };

  const handleEquipmentToggle = (equipmentId: string) => {
    setDraft((current) => ({
      ...current,
      requiredEquipmentIds: current.requiredEquipmentIds.includes(equipmentId)
        ? current.requiredEquipmentIds.filter((item) => item !== equipmentId)
        : [...current.requiredEquipmentIds, equipmentId],
    }));
  };

  const nextStatus: AdminRecordStatus =
    confirmTarget?.status === "Active" ? "Inactive" : "Active";

  const handleStatusChange = () => {
    if (!confirmTarget) {
      return;
    }

    setIsStatusPending(true);

    startTransition(async () => {
      const result = await updateExerciseStatusAction({
        id: Number(confirmTarget.id),
        status: nextStatus,
      });

      setIsStatusPending(false);
      setConfirmTarget(null);
      setFeedbackMessage(result.message);
    });
  };

  const formErrors = formState.errors;

  const handleFormSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    setIsFormPending(true);

    try {
      if (selectedImageFile) {
        const uploadedImageUrl = await uploadAdminImage({
          file: selectedImageFile,
          type: "exercises",
          existingImagePath: draft.imageUrl || null,
        });

        formData.set("imageUrl", uploadedImageUrl);
      }
    } catch (error) {
      setIsFormPending(false);
      setFormState({
        success: false,
        message: "",
        errors: {
          imageUrl:
            error instanceof Error
              ? error.message
              : "Unable to upload image right now.",
        },
      });
      return;
    }

    startTransition(async () => {
      const result = await saveExerciseAction(initialExerciseActionState, formData);
      setFormState(result);
      setIsFormPending(false);

      if (result.success) {
        setFormOpen(false);
        setDraft(emptyDraft);
        setSelectedImageFile(null);
        setPreviewImageUrl("");
        setFeedbackMessage(result.message);
        formRef.current?.reset();
      }
    });
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader
        eyebrow="Exercises"
        title="Exercise Management"
        description="Exercises are client activities. They are distinct from the equipment inventory."
        action={
          <Button leadingIcon={<Plus className="size-4" />} onClick={openCreate}>
            Add New
          </Button>
        }
      />
      <AdminFilterBar>
        <form action={pathname} method="get" className="grid flex-1 gap-3 xl:grid-cols-4">
          <div className="relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-[var(--color-text-secondary)]" />
            <Input
              name="q"
              defaultValue={filters.search}
              placeholder="Search exercise name"
              className="pl-10"
            />
          </div>
          <Select
            name="category"
            defaultValue={filters.category}
            options={[
              { label: "All Categories", value: "All" },
              ...exerciseCategoryOptions.map((item) => ({
                label: item,
                value: item,
              })),
            ]}
          />
          <Select
            name="difficulty"
            defaultValue={filters.difficulty}
            options={[
              { label: "All Difficulty", value: "All" },
              ...difficultyOptions.map((item) => ({
                label: item,
                value: item,
              })),
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
      {exercises.length ? (
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
                <div className="flex size-14 items-center justify-center rounded-2xl bg-[var(--color-muted-bg)]">
                  {item.imageUrl ? (
                    <div
                      className="h-full w-full rounded-2xl bg-cover bg-center"
                      style={{ backgroundImage: `url(${item.imageUrl})` }}
                    />
                  ) : (
                    <ImageIcon className="size-5 text-[var(--color-primary)]" />
                  )}
                </div>
              </td>
              <td className="px-5 py-4">
                <div className="space-y-1">
                  <p className="font-medium text-[var(--color-text)]">
                    {item.exerciseName}
                  </p>
                  <p className="text-sm text-[var(--color-text-secondary)]">
                    {item.defaultSets ? `${item.defaultSets} sets - ` : ""}
                    {item.defaultRepetitionsOrDuration}
                  </p>
                </div>
              </td>
              <td className="px-5 py-4 text-sm text-[var(--color-text-secondary)]">
                {item.category}
              </td>
              <td className="px-5 py-4 text-sm text-[var(--color-text-secondary)]">
                {item.difficulty}
              </td>
              <td className="px-5 py-4 text-sm text-[var(--color-text-secondary)]">
                {item.requiredEquipmentNames.length
                  ? item.requiredEquipmentNames.join(", ")
                  : "Bodyweight"}
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
          title="No exercises match these filters"
          description="Adjust the filters or create a new exercise record."
        />
      )}
      <AdminFormModal
        open={formOpen}
        title={draft.id ? "Edit Exercise" : "Add Exercise"}
        description="Save exercises and required equipment mappings together."
        onClose={() => setFormOpen(false)}
      >
        <form ref={formRef} className="space-y-4" onSubmit={handleFormSubmit}>
          <input type="hidden" name="id" value={draft.id} />
          <input type="hidden" name="imageUrl" value={draft.imageUrl} />
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium text-[var(--color-text)]">
                Exercise Name
              </label>
              <Input
                name="name"
                value={draft.exerciseName}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    exerciseName: event.target.value,
                  }))
                }
                aria-invalid={formErrors.exerciseName ? true : undefined}
              />
              {formErrors.exerciseName ? (
                <p className="text-sm text-[var(--color-error)]">
                  {formErrors.exerciseName}
                </p>
              ) : null}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-[var(--color-text)]">
                Category
              </label>
              <Select
                name="category"
                value={draft.category}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    category: event.target.value as AdminExerciseItem["category"],
                  }))
                }
                options={exerciseCategoryOptions.map((item) => ({
                  label: item,
                  value: item,
                }))}
                aria-invalid={formErrors.category ? true : undefined}
              />
              {formErrors.category ? (
                <p className="text-sm text-[var(--color-error)]">
                  {formErrors.category}
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
                    difficulty: event.target.value as AdminExerciseItem["difficulty"],
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
            <div className="space-y-2">
              <label className="text-sm font-medium text-[var(--color-text)]">
                Default Sets
              </label>
              <Input
                name="defaultSets"
                type="number"
                min={0}
                value={draft.defaultSets ?? ""}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    defaultSets: event.target.value
                      ? Number(event.target.value)
                      : undefined,
                  }))
                }
                aria-invalid={formErrors.defaultSets ? true : undefined}
              />
              {formErrors.defaultSets ? (
                <p className="text-sm text-[var(--color-error)]">
                  {formErrors.defaultSets}
                </p>
              ) : null}
            </div>
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium text-[var(--color-text)]">
                Exercise Image
              </label>
              <ImageUpload
                type="exercises"
                value={draft.imageUrl}
                selectedFile={selectedImageFile}
                onFileChange={setSelectedImageFile}
                onPreviewUrlChange={setPreviewImageUrl}
                error={formErrors.imageUrl}
                helperText="Upload an exercise image from your computer."
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium text-[var(--color-text)]">
                Required Equipment
              </label>
              <div className="grid gap-3 rounded-2xl border border-[var(--color-border)] p-4 md:grid-cols-2">
                {selectableEquipment.map((item) => {
                  const checked = draft.requiredEquipmentIds.includes(String(item.id));

                  return (
                    <Checkbox
                      key={item.id}
                      name="equipmentIds"
                      value={String(item.id)}
                      checked={checked}
                      onChange={() => handleEquipmentToggle(String(item.id))}
                      label={item.name}
                      description={item.category}
                    />
                  );
                })}
              </div>
              <p className="text-sm text-[var(--color-text-secondary)]">
                Leave every item unchecked to store the exercise as Bodyweight.
              </p>
            </div>
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium text-[var(--color-text)]">
                Default Repetitions or Duration
              </label>
              <Input
                name="defaultRepetitionsOrDuration"
                value={draft.defaultRepetitionsOrDuration}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    defaultRepetitionsOrDuration: event.target.value,
                  }))
                }
                aria-invalid={
                  formErrors.defaultRepetitionsOrDuration ? true : undefined
                }
              />
              {formErrors.defaultRepetitionsOrDuration ? (
                <p className="text-sm text-[var(--color-error)]">
                  {formErrors.defaultRepetitionsOrDuration}
                </p>
              ) : null}
            </div>
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium text-[var(--color-text)]">
                Short Instructions
              </label>
              <Textarea
                name="instructions"
                value={draft.shortInstructions}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    shortInstructions: event.target.value,
                  }))
                }
                aria-invalid={formErrors.shortInstructions ? true : undefined}
                className="min-h-24"
              />
              {formErrors.shortInstructions ? (
                <p className="text-sm text-[var(--color-error)]">
                  {formErrors.shortInstructions}
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
                    status: event.target.value as AdminRecordStatus,
                  }))
                }
                options={[
                  { label: "Active", value: "Active" },
                  { label: "Inactive", value: "Inactive" },
                ]}
                aria-invalid={formErrors.status ? true : undefined}
              />
              {formErrors.status ? (
                <p className="text-sm text-[var(--color-error)]">
                  {formErrors.status}
                </p>
              ) : null}
            </div>
          </div>
          <div className="rounded-[1.5rem] border border-dashed border-[var(--color-border)] p-4">
            <p className="text-sm font-medium text-[var(--color-text)]">Image Preview</p>
            <div className="mt-3 max-w-xs rounded-[1.5rem] border border-[var(--color-border)] bg-white p-3">
              <div className="flex aspect-[4/5] items-center justify-center rounded-[1rem] bg-[var(--color-muted-bg)]">
                {previewImageUrl || draft.imageUrl ? (
                  <div
                    className="h-full w-full rounded-[1rem] bg-cover bg-center"
                    style={{
                      backgroundImage: `url(${previewImageUrl || draft.imageUrl})`,
                    }}
                  />
                ) : (
                  <ImageIcon className="size-8 text-[var(--color-primary)]" />
                )}
              </div>
              <p className="mt-3 text-sm font-semibold text-[var(--color-text)]">
                {draft.exerciseName || "Exercise name"}
              </p>
              <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
                {draft.shortInstructions || "Short instructions preview"}
              </p>
            </div>
          </div>
          {formErrors.form ? (
            <p className="text-sm text-[var(--color-error)]">{formErrors.form}</p>
          ) : null}
          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setFormOpen(false)}
            >
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
        title="Update exercise status"
        description={
          confirmTarget
            ? `This will mark ${confirmTarget.exerciseName} as ${nextStatus.toLowerCase()}.`
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
