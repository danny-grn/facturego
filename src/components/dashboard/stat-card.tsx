import * as React from "react";
import { cn } from "@/lib/cn";
import { Card } from "@/components/ui/card";

export function StatCard({
  label,
  value,
  hint,
  icon,
  tone = "neutral",
}: {
  label: string;
  value: string;
  hint?: string;
  icon?: React.ReactNode;
  tone?: "neutral" | "accent" | "success" | "warning" | "danger";
}) {
  const iconTones: Record<string, string> = {
    neutral: "bg-ink-100 text-ink-700",
    accent: "bg-accent-100 text-accent-600",
    success: "bg-success-100 text-success-600",
    warning: "bg-warning-100 text-warning-600",
    danger: "bg-danger-100 text-danger-600",
  };

  return (
    <Card className="p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-ink-500">{label}</p>
          <p className="mt-2 font-display text-2xl font-medium text-ink-900">{value}</p>
          {hint && <p className="mt-1 text-xs text-ink-500">{hint}</p>}
        </div>
        {icon && (
          <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-full", iconTones[tone])}>
            {icon}
          </div>
        )}
      </div>
    </Card>
  );
}
