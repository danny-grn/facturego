import { Badge } from "@/components/ui/badge";
import {
  INVOICE_STATUS_META,
  DOCUMENT_STATUS_META,
  getEffectiveInvoiceStatus,
} from "@/lib/invoice-utils";
import type { DocumentStatus, Invoice, InvoiceStatus } from "@/lib/database.types";

export function InvoiceStatusBadge({ invoice }: { invoice: Pick<Invoice, "status" | "due_date"> }) {
  const status = getEffectiveInvoiceStatus(invoice) as InvoiceStatus;
  const meta = INVOICE_STATUS_META[status];
  return <Badge tone={meta.tone}>{meta.label}</Badge>;
}

export function DocumentStatusBadge({ status }: { status: DocumentStatus }) {
  const meta = DOCUMENT_STATUS_META[status];
  return <Badge tone={meta.tone}>{meta.label}</Badge>;
}
