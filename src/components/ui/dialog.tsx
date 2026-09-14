"use client";

import * as React from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/cn";

interface DialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}

export function Dialog({ open, onClose, title, description, children, className }: DialogProps) {
  const ref = React.useRef<HTMLDialogElement>(null);

  React.useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onCancel={onClose}
      onClick={(e) => {
        if (e.target === ref.current) onClose();
      }}
      className={cn(
        "m-auto w-full max-w-lg rounded-2xl border border-line bg-surface p-0 shadow-[var(--shadow-pop)] backdrop:bg-ink-900/40 backdrop:backdrop-blur-[2px]",
        "open:animate-[dialog-in_0.15s_ease-out]",
        className
      )}
    >
      <div className="flex items-start justify-between gap-4 border-b border-line p-5">
        <div>
          <h2 className="font-display text-lg font-medium text-ink-900">{title}</h2>
          {description && <p className="mt-1 text-sm text-ink-500">{description}</p>}
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Fermer"
          className="rounded-md p-1 text-ink-500 hover:bg-ink-100 hover:text-ink-900"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      <div className="p-5">{children}</div>
    </dialog>
  );
}
