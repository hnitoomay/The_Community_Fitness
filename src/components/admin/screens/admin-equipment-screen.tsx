"use client";

import {
  startTransition,
  useRef,
  useState,
} from "react";
import { usePathname } from "next/navigation";
import { PencilLine, Plus, Search, Slash } from "lucide-react";

import {
  saveEquipmentAction,
  updateEquipmentAvailabilityAction,
} from "@/app/admin/equipment/actions";
import {
  initialEquipmentActionState,
  type EquipmentActionState,
} from "@/app/admin/equipment/action-state";
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
import { Textarea } from "@/components/ui/textarea";
import type {
  AdminEquipmentItem,
  EquipmentAvailability,
} from "@/types/admin-data";
import {
  equipmentAvailabilityOptions,
  equipmentCategoryOptions,
  equipmentUnitOptions,
} from "@/types/admin-data";

const headers = [
  "Source No.",
  "Equipment Name",
  "Category",
  "Quantity",
  "Unit",
  "Plan Selectable",
  "Availability",
  "Actions",
];

const pageSize = 6;

const emptyDraft: AdminEquipmentItem = {
  id: "",
  sourceNo: undefined,
  equipmentName: "",
  category: "Cardio Machine",
  quantity: 0,
  unit: "Unit",
  planSelectable: true,
  availability: "Available",
  notes: "",
  updatedDate: "",
};

export interface AdminEquipmentScreenProps {
  equipment: AdminEquipmentItem[];
  filters: {
    search: string;
    category: string;
    availability: string;
    planSelectable: string;
  };
}

export function AdminEquipmentScreen({
  equipment,
  filters,
}: AdminEquipmentScreenProps) {
  const pathname = usePathname();
  const formRef = useRef<HTMLFormElement>(null);

  const [page, setPage] = useState(1);
  const [formOpen, setFormOpen] = useState(false);
  const [confirmTarget, setConfirmTarget] = useState<AdminEquipmentItem | null>(
    null,
  );
  const [draft, setDraft] = useState<AdminEquipmentItem>(emptyDraft);
  const [feedbackMessage, setFeedbackMessage] = useState("");
  const [isAvailabilityPending, setIsAvailabilityPending] = useState(false);
  const [isFormPending, setIsFormPending] = useState(false);
  const [formState, setFormState] = useState<EquipmentActionState>(
    initialEquipmentActionState,
  );

  const totalPages = Math.max(1, Math.ceil(equipment.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const pagedRows = equipment.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );

  const openCreate = () => {
    setDraft(emptyDraft);
    setFeedbackMessage("");
    setFormState(initialEquipmentActionState);
    setFormOpen(true);
  };

  const openEdit = (item: AdminEquipmentItem) => {
    setDraft(item);
    setFeedbackMessage("");
    setFormState(initialEquipmentActionState);
    setFormOpen(true);
  };

  const nextAvailability =
    confirmTarget?.availability === "Available" ? "Unavailable" : "Available";

  const confirmLabel =
    nextAvailability === "Unavailable" ? "Mark Unavailable" : "Mark Available";

  const confirmDescription = confirmTarget
    ? `This will mark ${confirmTarget.equipmentName} as ${nextAvailability.toLowerCase()}.`
    : "";

  const handleAvailabilityChange = () => {
    if (!confirmTarget) {
      return;
    }

    setIsAvailabilityPending(true);

    startTransition(async () => {
      const result = await updateEquipmentAvailabilityAction({
        id: Number(confirmTarget.id),
        availability: nextAvailability,
      });

      setIsAvailabilityPending(false);
      setConfirmTarget(null);
      setFeedbackMessage(result.message);
    });
  };

  const formErrors = formState.errors;
  const savingLabel = draft.id ? "Edit Equipment" : "Add Equipment";

  const handleFormSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    setIsFormPending(true);

    startTransition(async () => {
      const result = await saveEquipmentAction(initialEquipmentActionState, formData);
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

  return (
    <div className="space-y-6">
      <AdminPageHeader
        eyebrow="Equipment"
        title="Gym Equipment Inventory"
        description="Manage the actual equipment available in the gym. Equipment is not the same as an exercise."
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
              placeholder="Search equipment name"
              className="pl-10"
            />
          </div>
          <Select
            name="category"
            defaultValue={filters.category}
            options={[
              { label: "All Categories", value: "All" },
              ...equipmentCategoryOptions.map((item) => ({
                label: item,
                value: item,
              })),
            ]}
          />
          <Select
            name="availability"
            defaultValue={filters.availability}
            options={[
              { label: "All Availability", value: "All" },
              ...equipmentAvailabilityOptions.map((item) => ({
                label: item,
                value: item,
              })),
            ]}
          />
          <Select
            name="planSelectable"
            defaultValue={filters.planSelectable}
            options={[
              { label: "All Plan Selectable", value: "All" },
              { label: "Yes", value: "Yes" },
              { label: "No", value: "No" },
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
      {equipment.length ? (
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
              <td className="px-5 py-4 text-sm text-[var(--color-text-secondary)]">
                {item.sourceNo ?? "-"}
              </td>
              <td className="px-5 py-4">
                <div className="space-y-1">
                  <p className="font-medium text-[var(--color-text)]">
                    {item.equipmentName}
                  </p>
                  {!item.planSelectable ? (
                    <p className="text-sm text-[var(--color-text-secondary)]">
                      Not selectable for workout generation.
                    </p>
                  ) : null}
                </div>
              </td>
              <td className="px-5 py-4 text-sm text-[var(--color-text-secondary)]">
                {item.category}
              </td>
              <td className="px-5 py-4 text-sm text-[var(--color-text-secondary)]">
                {item.quantity}
              </td>
              <td className="px-5 py-4 text-sm text-[var(--color-text-secondary)]">
                {item.unit}
              </td>
              <td className="px-5 py-4">
                <AdminStatusBadge status={item.planSelectable ? "Yes" : "No"} />
              </td>
              <td className="px-5 py-4">
                <AdminStatusBadge status={item.availability} />
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
                    {item.availability === "Available" ? "Mark Unavailable" : "Mark Available"}
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </AdminDataTable>
      ) : (
        <AdminEmptyState
          title="No equipment matches these filters"
          description="Adjust the search or filter values, or add a new equipment record."
        />
      )}
      <AdminFormModal
        open={formOpen}
        title={savingLabel}
        description="Create or edit gym equipment records stored in PostgreSQL."
        onClose={() => setFormOpen(false)}
      >
        <form ref={formRef} className="space-y-4" onSubmit={handleFormSubmit}>
          <input type="hidden" name="id" value={draft.id} />
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium text-[var(--color-text)]">
                Source Number
              </label>
              <Input
                name="sourceNumber"
                type="number"
                min={0}
                value={draft.sourceNo ?? ""}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    sourceNo: event.target.value
                      ? Number(event.target.value)
                      : undefined,
                  }))
                }
                aria-invalid={formErrors.sourceNumber ? true : undefined}
              />
              {formErrors.sourceNumber ? (
                <p className="text-sm text-[var(--color-error)]">
                  {formErrors.sourceNumber}
                </p>
              ) : null}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-[var(--color-text)]">
                Equipment Name
              </label>
              <Input
                name="name"
                value={draft.equipmentName}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    equipmentName: event.target.value,
                  }))
                }
                aria-invalid={formErrors.equipmentName ? true : undefined}
              />
              {formErrors.equipmentName ? (
                <p className="text-sm text-[var(--color-error)]">
                  {formErrors.equipmentName}
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
                    category: event.target.value as AdminEquipmentItem["category"],
                  }))
                }
                options={equipmentCategoryOptions.map((item) => ({
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
                Quantity
              </label>
              <Input
                name="quantity"
                type="number"
                min={0}
                value={draft.quantity}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    quantity: Number(event.target.value),
                  }))
                }
                aria-invalid={formErrors.quantity ? true : undefined}
              />
              {formErrors.quantity ? (
                <p className="text-sm text-[var(--color-error)]">
                  {formErrors.quantity}
                </p>
              ) : null}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-[var(--color-text)]">
                Unit
              </label>
              <Select
                name="unit"
                value={draft.unit}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    unit: event.target.value as AdminEquipmentItem["unit"],
                  }))
                }
                options={equipmentUnitOptions.map((item) => ({
                  label: item,
                  value: item,
                }))}
                aria-invalid={formErrors.unit ? true : undefined}
              />
              {formErrors.unit ? (
                <p className="text-sm text-[var(--color-error)]">{formErrors.unit}</p>
              ) : null}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-[var(--color-text)]">
                Plan Selectable
              </label>
              <Select
                name="planSelectable"
                value={draft.planSelectable ? "true" : "false"}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    planSelectable: event.target.value === "true",
                  }))
                }
                options={[
                  { label: "Yes", value: "true" },
                  { label: "No", value: "false" },
                ]}
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium text-[var(--color-text)]">
                Availability
              </label>
              <Select
                name="availability"
                value={draft.availability}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    availability: event.target.value as EquipmentAvailability,
                  }))
                }
                options={equipmentAvailabilityOptions.map((item) => ({
                  label: item,
                  value: item,
                }))}
                aria-invalid={formErrors.availability ? true : undefined}
              />
              {formErrors.availability ? (
                <p className="text-sm text-[var(--color-error)]">
                  {formErrors.availability}
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
        title="Update equipment availability"
        description={confirmDescription}
        confirmLabel={confirmLabel}
        confirmLoading={isAvailabilityPending}
        onCancel={() => setConfirmTarget(null)}
        onConfirm={handleAvailabilityChange}
      />
    </div>
  );
}
