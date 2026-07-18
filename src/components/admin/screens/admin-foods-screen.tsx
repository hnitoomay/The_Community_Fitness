"use client";

import { startTransition, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { PencilLine, Plus, Search, Slash } from "lucide-react";

import {
  saveFoodAction,
  updateFoodStatusAction,
} from "@/app/admin/foods/actions";
import {
  initialFoodActionState,
  type FoodActionState,
} from "@/app/admin/foods/action-state";
import { AdminConfirmDialog } from "@/components/admin/admin-confirm-dialog";
import { AdminFilterBar } from "@/components/admin/admin-filter-bar";
import { AdminFormModal } from "@/components/admin/admin-form-modal";
import { AdminEmptyState } from "@/components/admin/admin-empty-state";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminPagination } from "@/components/admin/admin-pagination";
import { AdminStatusBadge } from "@/components/admin/admin-status-badge";
import { AdminDataTable } from "@/components/admin/admin-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { mealCategoryOptions, type AdminFoodItem } from "@/types/admin-data";

const headers = [
  "Food Name",
  "Meal Category",
  "Calories",
  "Protein",
  "Allergen",
  "Status",
  "Actions",
];
const pageSize = 6;

const emptyDraft: AdminFoodItem = {
  id: "",
  foodName: "",
  mealCategory: "Breakfast",
  servingDescription: "",
  calories: 0,
  proteinGrams: undefined,
  allergen: "",
  status: "Active",
};

export interface AdminFoodsScreenProps {
  foods: AdminFoodItem[];
  allergens: string[];
  filters: {
    search: string;
    mealCategory: string;
    allergen: string;
    status: string;
  };
}

export function AdminFoodsScreen({
  foods,
  allergens,
  filters,
}: AdminFoodsScreenProps) {
  const pathname = usePathname();
  const formRef = useRef<HTMLFormElement>(null);

  const [page, setPage] = useState(1);
  const [formOpen, setFormOpen] = useState(false);
  const [confirmTarget, setConfirmTarget] = useState<AdminFoodItem | null>(null);
  const [draft, setDraft] = useState<AdminFoodItem>(emptyDraft);
  const [feedbackMessage, setFeedbackMessage] = useState("");
  const [isStatusPending, setIsStatusPending] = useState(false);
  const [isFormPending, setIsFormPending] = useState(false);
  const [formState, setFormState] = useState<FoodActionState>(
    initialFoodActionState,
  );

  const totalPages = Math.max(1, Math.ceil(foods.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const pagedRows = foods.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );

  const openCreate = () => {
    setDraft(emptyDraft);
    setFeedbackMessage("");
    setFormState(initialFoodActionState);
    setFormOpen(true);
  };

  const openEdit = (item: AdminFoodItem) => {
    setDraft(item);
    setFeedbackMessage("");
    setFormState(initialFoodActionState);
    setFormOpen(true);
  };

  const nextStatus = confirmTarget?.status === "Active" ? "Inactive" : "Active";

  const handleStatusChange = () => {
    if (!confirmTarget) {
      return;
    }

    setIsStatusPending(true);

    startTransition(async () => {
      const result = await updateFoodStatusAction({
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
      const result = await saveFoodAction(initialFoodActionState, formData);
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
        eyebrow="Foods"
        title="Food Management"
        description="Approved foods that later nutrition planning will be allowed to use."
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
              placeholder="Search food name"
              className="pl-10"
            />
          </div>
          <Select
            name="mealCategory"
            defaultValue={filters.mealCategory}
            options={[
              { label: "All Meal Categories", value: "All" },
              ...mealCategoryOptions.map((item) => ({ label: item, value: item })),
            ]}
          />
          <Select
            name="allergen"
            defaultValue={filters.allergen}
            options={[
              { label: "All Allergens", value: "All" },
              ...allergens.map((item) => ({ label: item, value: item })),
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
      {foods.length ? (
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
                  <p className="font-medium text-[var(--color-text)]">{item.foodName}</p>
                  <p className="text-sm text-[var(--color-text-secondary)]">
                    {item.servingDescription}
                  </p>
                </div>
              </td>
              <td className="px-5 py-4 text-sm text-[var(--color-text-secondary)]">
                {item.mealCategory}
              </td>
              <td className="px-5 py-4 text-sm text-[var(--color-text-secondary)]">
                {item.calories}
              </td>
              <td className="px-5 py-4 text-sm text-[var(--color-text-secondary)]">
                {item.proteinGrams ?? "-"}
              </td>
              <td className="px-5 py-4 text-sm text-[var(--color-text-secondary)]">
                {item.allergen || "None"}
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
          title="No foods match these filters"
          description="Adjust the filter set or create a new approved food item."
        />
      )}
      <AdminFormModal
        open={formOpen}
        title={draft.id ? "Edit Food" : "Add Food"}
        description="Keep the approved food list simple and practical."
        onClose={() => setFormOpen(false)}
      >
        <form ref={formRef} className="space-y-4" onSubmit={handleFormSubmit}>
          <input type="hidden" name="id" value={draft.id} />
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium text-[var(--color-text)]">
                Food Name
              </label>
              <Input
                name="name"
                value={draft.foodName}
                onChange={(event) =>
                  setDraft((current) => ({ ...current, foodName: event.target.value }))
                }
                aria-invalid={formErrors.foodName ? true : undefined}
              />
              {formErrors.foodName ? (
                <p className="text-sm text-[var(--color-error)]">{formErrors.foodName}</p>
              ) : null}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-[var(--color-text)]">
                Meal Category
              </label>
              <Select
                name="mealCategory"
                value={draft.mealCategory}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    mealCategory: event.target.value as AdminFoodItem["mealCategory"],
                  }))
                }
                options={mealCategoryOptions.map((item) => ({
                  label: item,
                  value: item,
                }))}
                aria-invalid={formErrors.mealCategory ? true : undefined}
              />
              {formErrors.mealCategory ? (
                <p className="text-sm text-[var(--color-error)]">
                  {formErrors.mealCategory}
                </p>
              ) : null}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-[var(--color-text)]">
                Serving Description
              </label>
              <Input
                name="servingDescription"
                value={draft.servingDescription}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    servingDescription: event.target.value,
                  }))
                }
                aria-invalid={formErrors.servingDescription ? true : undefined}
              />
              {formErrors.servingDescription ? (
                <p className="text-sm text-[var(--color-error)]">
                  {formErrors.servingDescription}
                </p>
              ) : null}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-[var(--color-text)]">
                Calories
              </label>
              <Input
                name="calories"
                type="number"
                min={0}
                value={draft.calories}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    calories: Number(event.target.value),
                  }))
                }
                aria-invalid={formErrors.calories ? true : undefined}
              />
              {formErrors.calories ? (
                <p className="text-sm text-[var(--color-error)]">{formErrors.calories}</p>
              ) : null}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-[var(--color-text)]">
                Protein in grams
              </label>
              <Input
                name="proteinGrams"
                type="number"
                min={0}
                step="0.01"
                value={draft.proteinGrams ?? ""}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    proteinGrams: event.target.value
                      ? Number(event.target.value)
                      : undefined,
                  }))
                }
                aria-invalid={formErrors.proteinGrams ? true : undefined}
              />
              {formErrors.proteinGrams ? (
                <p className="text-sm text-[var(--color-error)]">
                  {formErrors.proteinGrams}
                </p>
              ) : null}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-[var(--color-text)]">
                Allergen
              </label>
              <Input
                name="allergen"
                value={draft.allergen}
                onChange={(event) =>
                  setDraft((current) => ({ ...current, allergen: event.target.value }))
                }
                placeholder="None"
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
                    status: event.target.value as AdminFoodItem["status"],
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
        title="Update food status"
        description={
          confirmTarget
            ? `This will mark ${confirmTarget.foodName} as ${nextStatus.toLowerCase()}.`
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
