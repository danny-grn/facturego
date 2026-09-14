"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/cn";

export function Table({ className, ...props }: React.TableHTMLAttributes<HTMLTableElement>) {
  return (
    <div className="w-full overflow-x-auto rounded-xl border border-line bg-surface">
      <table className={cn("w-full min-w-[640px] border-collapse text-sm", className)} {...props} />
    </div>
  );
}

export function THead({ className, ...props }: React.HTMLAttributes<HTMLTableSectionElement>) {
  return <thead className={cn("border-b border-line bg-paper-dim/60", className)} {...props} />;
}

export function TBody({ className, ...props }: React.HTMLAttributes<HTMLTableSectionElement>) {
  return <tbody className={cn("divide-y divide-line", className)} {...props} />;
}

export function TR({
  className,
  clickable,
  href,
  onClick,
  ...props
}: React.HTMLAttributes<HTMLTableRowElement> & { clickable?: boolean; href?: string }) {
  const router = useRouter();
  const interactive = clickable || Boolean(href);

  // Toute la ligne navigue, pas seulement le lien de la première colonne.
  // On laisse passer les clics sur un lien ou un bouton internes, ainsi que
  // les clics modifiés (nouvel onglet) que le navigateur gère déjà.
  function handleClick(event: React.MouseEvent<HTMLTableRowElement>) {
    onClick?.(event);
    if (!href || event.defaultPrevented) return;
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0) return;
    if ((event.target as HTMLElement).closest("a, button, input, label, select")) return;
    router.push(href);
  }

  return (
    <tr
      className={cn(interactive && "cursor-pointer transition-colors hover:bg-paper-dim/70", className)}
      onClick={handleClick}
      {...props}
    />
  );
}

export function TH({ className, ...props }: React.ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th
      className={cn(
        "px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-ink-500",
        className
      )}
      {...props}
    />
  );
}

export function TD({ className, ...props }: React.TdHTMLAttributes<HTMLTableCellElement>) {
  return <td className={cn("px-4 py-3 align-middle text-ink-800", className)} {...props} />;
}
