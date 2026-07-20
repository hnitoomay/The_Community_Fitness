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
import { ImageUpload } from "@/components/admin/image-upload";
import { AdminEmptyState } from "@/components/admin/admin-empty-state";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminStatusBadge } from "@/components/admin/admin-status-badge";
import { AdminDataTable } from "@/components/admin/admin-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { uploadAdminImage } from "@/lib/admin-image-upload";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  type AdminBodyGoalItem,
} from "@/types/admin-data";

const headers = [
  "Images",
  "Goal Label",
  "Workout Template",
  "Nutrition Template",
  "Status",
  "Actions",
];

const emptyDraft: AdminBodyGoalItem = {
  id: "",
  goalLabel: "",
  shortDescription: "",
  maleImageUrl: "",
  femaleImageUrl: "",
  unisexImageUrl: "",
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

interface OriginalImageUrls {
  maleImageUrl: string;
  femaleImageUrl: string;
  unisexImageUrl: string;
}

export interface AdminBodyGoalsScreenProps {
  bodyGoals: BodyGoalItem[];
  workoutTemplates: TemplateOption[];
  nutritionTemplates: TemplateOption[];
  filters: {
    search: string;
    status: string;
  };
}

function BodyGoalImagePreview({
  label,
  imageUrl,
}: {
  label: string;
  imageUrl: string;
}) {
  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-text-secondary)]">
        {label}
      </p>
      <div className="flex h-20 w-16 items-center justify-center overflow-hidden rounded-2xl bg-[var(--color-muted-bg)]">
        {imageUrl ? (
          <div
            className="h-full w-full bg-cover bg-center"
            style={{ backgroundImage: `url(${imageUrl})` }}
          />
        ) : (
          <ImageIcon className="size-5 text-[var(--color-primary)]" />
        )}
      </div>
    </div>
  );
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
  const [selectedMaleImageFile, setSelectedMaleImageFile] = useState<File | null>(null);
  const [selectedFemaleImageFile, setSelectedFemaleImageFile] =
    useState<File | null>(null);
  const [selectedUnisexImageFile, setSelectedUnisexImageFile] =
    useState<File | null>(null);
  const [previewMaleImageUrl, setPreviewMaleImageUrl] = useState("");
  const [previewFemaleImageUrl, setPreviewFemaleImageUrl] = useState("");
  const [previewUnisexImageUrl, setPreviewUnisexImageUrl] = useState("");
  const [originalImageUrls, setOriginalImageUrls] = useState<OriginalImageUrls>({
    maleImageUrl: "",
    femaleImageUrl: "",
    unisexImageUrl: "",
  });
  const [formState, setFormState] = useState<BodyGoalActionState>(
    initialBodyGoalActionState,
  );

  const openCreate = () => {
    setDraft(emptyDraft);
    setSelectedMaleImageFile(null);
    setSelectedFemaleImageFile(null);
    setSelectedUnisexImageFile(null);
    setPreviewMaleImageUrl("");
    setPreviewFemaleImageUrl("");
    setPreviewUnisexImageUrl("");
    setOriginalImageUrls({
      maleImageUrl: "",
      femaleImageUrl: "",
      unisexImageUrl: "",
    });
    setFeedbackMessage("");
    setFormState(initialBodyGoalActionState);
    setFormOpen(true);
  };

  const openEdit = (item: BodyGoalItem) => {
    setDraft({
      id: item.id,
      goalLabel: item.goalLabel,
      shortDescription: item.shortDescription,
      maleImageUrl: item.maleImageUrl,
      femaleImageUrl: item.femaleImageUrl,
      unisexImageUrl: item.unisexImageUrl,
      workoutTemplateId: item.workoutTemplateId ?? "",
      nutritionTemplateId: item.nutritionTemplateId ?? "",
      status: item.status,
    });
    setSelectedMaleImageFile(null);
    setSelectedFemaleImageFile(null);
    setSelectedUnisexImageFile(null);
    setPreviewMaleImageUrl(item.maleImageUrl);
    setPreviewFemaleImageUrl(item.femaleImageUrl);
    setPreviewUnisexImageUrl(item.unisexImageUrl);
    setOriginalImageUrls({
      maleImageUrl: item.maleImageUrl,
      femaleImageUrl: item.femaleImageUrl,
      unisexImageUrl: item.unisexImageUrl,
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

  const handleFormSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    setIsFormPending(true);

    try {
      if (selectedMaleImageFile) {
        const uploadedImageUrl = await uploadAdminImage({
          file: selectedMaleImageFile,
          type: "body-goals",
          existingImagePath: draft.maleImageUrl || null,
        });

        formData.set("maleImageUrl", uploadedImageUrl);
      }

      if (selectedFemaleImageFile) {
        const uploadedImageUrl = await uploadAdminImage({
          file: selectedFemaleImageFile,
          type: "body-goals",
          existingImagePath: draft.femaleImageUrl || null,
        });

        formData.set("femaleImageUrl", uploadedImageUrl);
      }

      if (selectedUnisexImageFile) {
        const uploadedImageUrl = await uploadAdminImage({
          file: selectedUnisexImageFile,
          type: "body-goals",
          existingImagePath: draft.unisexImageUrl || null,
        });

        formData.set("unisexImageUrl", uploadedImageUrl);
      }
    } catch (error) {
      setIsFormPending(false);
      setFormState({
        success: false,
        message: "",
        errors: {
          form:
            error instanceof Error
              ? error.message
              : "Unable to upload image right now.",
        },
      });
      return;
    }

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
        setSelectedMaleImageFile(null);
        setSelectedFemaleImageFile(null);
        setSelectedUnisexImageFile(null);
        setPreviewMaleImageUrl("");
        setPreviewFemaleImageUrl("");
        setPreviewUnisexImageUrl("");
        setOriginalImageUrls({
          maleImageUrl: "",
          femaleImageUrl: "",
          unisexImageUrl: "",
        });
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
        <form action={pathname} method="get" className="grid flex-1 gap-3 lg:grid-cols-2">
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
            name="status"
            defaultValue={filters.status}
            options={[
              { label: "All Status", value: "All" },
              { label: "Active", value: "Active" },
              { label: "Inactive", value: "Inactive" },
            ]}
            />
          <div className="flex flex-wrap justify-end gap-3 lg:col-span-2">
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
                <div className="flex gap-2">
                  <BodyGoalImagePreview label="M" imageUrl={item.maleImageUrl} />
                  <BodyGoalImagePreview label="F" imageUrl={item.femaleImageUrl} />
                  <BodyGoalImagePreview label="U" imageUrl={item.unisexImageUrl} />
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
          <input type="hidden" name="maleImageUrl" value={draft.maleImageUrl} />
          <input type="hidden" name="femaleImageUrl" value={draft.femaleImageUrl} />
          <input type="hidden" name="unisexImageUrl" value={draft.unisexImageUrl} />
          <input
            type="hidden"
            name="previousMaleImageUrl"
            value={originalImageUrls.maleImageUrl}
          />
          <input
            type="hidden"
            name="previousFemaleImageUrl"
            value={originalImageUrls.femaleImageUrl}
          />
          <input
            type="hidden"
            name="previousUnisexImageUrl"
            value={originalImageUrls.unisexImageUrl}
          />
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
                Image Management
              </label>
              <div className="grid gap-4">
                <ImageUpload
                  type="body-goals"
                  value={draft.maleImageUrl}
                  selectedFile={selectedMaleImageFile}
                  onFileChange={setSelectedMaleImageFile}
                  onRemoveCurrent={() =>
                    setDraft((current) => ({ ...current, maleImageUrl: "" }))
                  }
                  onPreviewUrlChange={setPreviewMaleImageUrl}
                  error={formErrors.maleImageUrl}
                  helperText="Male image shown to male users when available."
                />
                <ImageUpload
                  type="body-goals"
                  value={draft.femaleImageUrl}
                  selectedFile={selectedFemaleImageFile}
                  onFileChange={setSelectedFemaleImageFile}
                  onRemoveCurrent={() =>
                    setDraft((current) => ({ ...current, femaleImageUrl: "" }))
                  }
                  onPreviewUrlChange={setPreviewFemaleImageUrl}
                  error={formErrors.femaleImageUrl}
                  helperText="Female image shown to female users when available."
                />
                <ImageUpload
                  type="body-goals"
                  value={draft.unisexImageUrl}
                  selectedFile={selectedUnisexImageFile}
                  onFileChange={setSelectedUnisexImageFile}
                  onRemoveCurrent={() =>
                    setDraft((current) => ({ ...current, unisexImageUrl: "" }))
                  }
                  onPreviewUrlChange={setPreviewUnisexImageUrl}
                  error={formErrors.unisexImageUrl}
                  helperText="Optional fallback image when no gender-specific image exists."
                />
              </div>
            </div>
            <div className="rounded-[1.5rem] border border-dashed border-[var(--color-border)] p-4 md:col-span-2">
              <p className="text-sm font-medium text-[var(--color-text)]">Image Preview</p>
              <div className="mt-3 grid gap-4 sm:grid-cols-3">
                <BodyGoalImagePreview
                  label="Male"
                  imageUrl={previewMaleImageUrl || draft.maleImageUrl}
                />
                <BodyGoalImagePreview
                  label="Female"
                  imageUrl={previewFemaleImageUrl || draft.femaleImageUrl}
                />
                <BodyGoalImagePreview
                  label="Unisex"
                  imageUrl={previewUnisexImageUrl || draft.unisexImageUrl}
                />
              </div>
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
            <div className="mt-3 grid gap-4 lg:grid-cols-3">
              {[
                {
                  label: "Male Preview",
                  imageUrl: previewMaleImageUrl || draft.maleImageUrl,
                },
                {
                  label: "Female Preview",
                  imageUrl: previewFemaleImageUrl || draft.femaleImageUrl,
                },
                {
                  label: "Unisex Preview",
                  imageUrl: previewUnisexImageUrl || draft.unisexImageUrl,
                },
              ].map((preview) => (
                <div
                  key={preview.label}
                  className="rounded-[1.5rem] border border-[var(--color-border)] bg-white p-3"
                >
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-text-secondary)]">
                    {preview.label}
                  </p>
                  <div className="mt-3 flex aspect-[4/5] items-center justify-center rounded-[1rem] bg-[var(--color-muted-bg)]">
                    {preview.imageUrl ? (
                      <div
                        className="h-full w-full rounded-[1rem] bg-cover bg-center"
                        style={{
                          backgroundImage: `url(${preview.imageUrl})`,
                        }}
                      />
                    ) : (
                      <div className="text-center">
                        <ImageIcon className="mx-auto size-8 text-[var(--color-primary)]" />
                        <p className="mt-2 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-text-secondary)]">
                          Image placeholder
                        </p>
                      </div>
                    )}
                  </div>
                  <p className="mt-3 text-sm font-semibold text-[var(--color-text)]">
                    {draft.goalLabel || "Goal Label"}
                  </p>
                  <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
                    {draft.shortDescription || "Short description preview"}
                  </p>
                </div>
              ))}
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
