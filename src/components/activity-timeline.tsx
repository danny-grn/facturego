import { FileEdit, Send, Eye, PenLine, CircleDollarSign, XCircle, Circle } from "lucide-react";
import { formatDateTime } from "@/lib/format";
import type { ActivityLogEntry } from "@/lib/database.types";

const EVENT_META: Record<string, { label: string; icon: typeof Circle }> = {
  created: { label: "Création", icon: FileEdit },
  sent: { label: "Envoyé au client", icon: Send },
  viewed: { label: "Consulté par le client", icon: Eye },
  signed: { label: "Signé électroniquement", icon: PenLine },
  paid: { label: "Marqué comme payé", icon: CircleDollarSign },
  cancelled: { label: "Annulé", icon: XCircle },
};

export function ActivityTimeline({ entries }: { entries: ActivityLogEntry[] }) {
  if (entries.length === 0) {
    return <p className="text-sm text-ink-500">Aucune activité pour l&apos;instant.</p>;
  }

  return (
    <ol className="space-y-4">
      {entries.map((entry) => {
        const meta = EVENT_META[entry.event_type] ?? { label: entry.event_type, icon: Circle };
        const Icon = meta.icon;
        return (
          <li key={entry.id} className="flex gap-3">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-ink-100 text-ink-600">
              <Icon className="h-3.5 w-3.5" />
            </span>
            <div>
              <p className="text-sm font-medium text-ink-900">{meta.label}</p>
              <p className="text-xs text-ink-500">{formatDateTime(entry.created_at)}</p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
