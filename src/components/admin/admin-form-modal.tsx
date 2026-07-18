"use client";

import { Modal } from "@/components/ui/modal";

interface AdminFormModalProps {
  open: boolean;
  title: string;
  description?: string;
  onClose: () => void;
  children: React.ReactNode;
}

export function AdminFormModal({
  open,
  title,
  description,
  onClose,
  children,
}: AdminFormModalProps) {
  return (
    <Modal open={open} title={title} description={description} onClose={onClose}>
      <div className="max-h-[70vh] overflow-y-auto pr-1">{children}</div>
    </Modal>
  );
}
