import type { DocumentStatus, Invoice, InvoiceStatus } from "@/lib/database.types";
import type { Tone } from "@/components/ui/badge";

export interface InvoiceLineInput {
  quantity: number;
  unit_price: number;
  tax_rate: number;
}

export function round2(n: number) {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

export function computeLineTotal(item: InvoiceLineInput) {
  return round2(item.quantity * item.unit_price);
}

export function computeInvoiceTotals(items: InvoiceLineInput[]) {
  const subtotal = items.reduce((sum, item) => sum + item.quantity * item.unit_price, 0);
  const taxTotal = items.reduce(
    (sum, item) => sum + item.quantity * item.unit_price * (item.tax_rate / 100),
    0
  );
  return {
    subtotal: round2(subtotal),
    taxTotal: round2(taxTotal),
    total: round2(subtotal + taxTotal),
  };
}

/** Regroupe le montant de TVA par taux, pour l'affichage détaillé sur le PDF. */
export function groupTaxByRate(items: InvoiceLineInput[]) {
  const map = new Map<number, { base: number; tax: number }>();
  for (const item of items) {
    const base = item.quantity * item.unit_price;
    const tax = base * (item.tax_rate / 100);
    const existing = map.get(item.tax_rate) ?? { base: 0, tax: 0 };
    map.set(item.tax_rate, { base: existing.base + base, tax: existing.tax + tax });
  }
  return Array.from(map.entries())
    .sort((a, b) => a[0] - b[0])
    .map(([rate, { base, tax }]) => ({ rate, base: round2(base), tax: round2(tax) }));
}

/**
 * Statut "affiché" d'une facture : une facture envoyée/consultée dont la date
 * d'échéance est dépassée est présentée comme "en retard" sans que la valeur
 * stockée en base ne change (pas de tâche planifiée nécessaire).
 */
export function getEffectiveInvoiceStatus(invoice: Pick<Invoice, "status" | "due_date">): InvoiceStatus {
  if (
    (invoice.status === "sent" || invoice.status === "viewed") &&
    invoice.due_date &&
    new Date(invoice.due_date) < new Date(new Date().toDateString())
  ) {
    return "overdue";
  }
  return invoice.status;
}

export const INVOICE_STATUS_META: Record<InvoiceStatus, { label: string; tone: Tone }> = {
  draft: { label: "Brouillon", tone: "neutral" },
  sent: { label: "Envoyée", tone: "info" },
  viewed: { label: "Consultée", tone: "info" },
  signed: { label: "Signée", tone: "accent" },
  paid: { label: "Payée", tone: "success" },
  overdue: { label: "En retard", tone: "danger" },
  cancelled: { label: "Annulée", tone: "neutral" },
};

export const DOCUMENT_STATUS_META: Record<DocumentStatus, { label: string; tone: Tone }> = {
  draft: { label: "Brouillon", tone: "neutral" },
  sent: { label: "Envoyé", tone: "info" },
  viewed: { label: "Consulté", tone: "info" },
  signed: { label: "Signé", tone: "success" },
  cancelled: { label: "Annulé", tone: "neutral" },
};

export function statusLabel(status: string, kind: "invoice" | "document" = "invoice") {
  if (kind === "invoice") return INVOICE_STATUS_META[status as InvoiceStatus]?.label ?? status;
  return DOCUMENT_STATUS_META[status as DocumentStatus]?.label ?? status;
}
