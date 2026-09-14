"use client";

import * as React from "react";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = "Confirmer",
  danger = true,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title: string;
  description?: string;
  confirmLabel?: string;
  danger?: boolean;
}) {
  const [loading, setLoading] = React.useState(false);

  async function handleConfirm() {
    setLoading(true);
    try {
      await onConfirm();
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onClose={onClose} title={title} description={description} className="max-w-md">
      <div className="flex justify-end gap-3">
        <Button type="button" variant="ghost" onClick={onClose}>
          Annuler
        </Button>
        <Button type="button" variant={danger ? "danger" : "primary"} loading={loading} onClick={handleConfirm}>
          {confirmLabel}
        </Button>
      </div>
    </Dialog>
  );
}
