"use client";

import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";

interface AdminConfirmDialogProps {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  confirmLoading?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export function AdminConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Confirm",
  confirmLoading = false,
  onCancel,
  onConfirm,
}: AdminConfirmDialogProps) {
  return (
    <Modal
      open={open}
      title={title}
      description={description}
      onClose={onCancel}
      footer={
        <div className="flex gap-3">
          <Button variant="secondary" className="flex-1" onClick={onCancel}>
            Cancel
          </Button>
          <Button
            variant="danger"
            className="flex-1"
            onClick={onConfirm}
            loading={confirmLoading}
          >
            {confirmLabel}
          </Button>
        </div>
      }
    >
      <p className="text-sm leading-6 text-[var(--color-text-secondary)]">
        This change updates the saved admin record.
      </p>
    </Modal>
  );
}
