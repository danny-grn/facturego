import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table";
import { InvoiceStatusBadge } from "@/components/status-badge";
import { ActivityTimeline } from "@/components/activity-timeline";
import { InvoiceActions } from "@/components/invoices/invoice-actions";
import { formatCurrency, formatDate, formatDateTime } from "@/lib/format";
import type { ActivityLogEntry, Client, Invoice, InvoiceItem, Signature } from "@/lib/database.types";

export function InvoiceDetail({
  invoice,
  items,
  client,
  signature,
  activity,
}: {
  invoice: Invoice;
  items: InvoiceItem[];
  client: Client | null;
  signature: Signature | null;
  activity: ActivityLogEntry[];
}) {
  return (
    <div>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="font-display text-2xl font-medium text-ink-900">{invoice.invoice_number}</h1>
            <InvoiceStatusBadge invoice={invoice} />
          </div>
          <p className="mt-1.5 text-sm text-ink-500">
            Émise le {formatDate(invoice.issue_date)}
            {invoice.due_date && ` · Échéance le ${formatDate(invoice.due_date)}`}
          </p>
        </div>
        <InvoiceActions invoice={invoice} clientEmail={client?.email} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Facturé à</CardTitle>
            </CardHeader>
            <CardContent>
              {client ? (
                <div className="text-sm text-ink-700">
                  <p className="font-medium text-ink-900">{client.name}</p>
                  {client.address && <p>{client.address}</p>}
                  {(client.postal_code || client.city) && (
                    <p>
                      {client.postal_code} {client.city}
                    </p>
                  )}
                  {client.email && <p className="mt-1 text-ink-500">{client.email}</p>}
                  {client.vat_number && <p className="text-ink-500">TVA {client.vat_number}</p>}
                </div>
              ) : (
                <p className="text-sm text-ink-500">Client supprimé</p>
              )}
            </CardContent>
          </Card>

          <Table>
            <THead>
              <tr>
                <TH>Description</TH>
                <TH className="text-right">Qté</TH>
                <TH className="text-right">Prix unitaire</TH>
                <TH className="text-right">TVA</TH>
                <TH className="text-right">Total</TH>
              </tr>
            </THead>
            <TBody>
              {items.map((item) => (
                <TR key={item.id}>
                  <TD>{item.description}</TD>
                  <TD className="text-right">{item.quantity}</TD>
                  <TD className="text-right">{formatCurrency(item.unit_price, invoice.currency)}</TD>
                  <TD className="text-right">{item.tax_rate}%</TD>
                  <TD className="text-right font-medium">
                    {formatCurrency(item.quantity * item.unit_price, invoice.currency)}
                  </TD>
                </TR>
              ))}
            </TBody>
          </Table>

          <div className="ml-auto max-w-xs space-y-2 rounded-xl border border-line bg-surface p-5 text-sm">
            <div className="flex justify-between">
              <span className="text-ink-500">Sous-total</span>
              <span className="text-ink-900">{formatCurrency(invoice.subtotal, invoice.currency)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-ink-500">TVA</span>
              <span className="text-ink-900">{formatCurrency(invoice.tax_total, invoice.currency)}</span>
            </div>
            <div className="flex justify-between border-t border-line pt-2 text-base font-medium">
              <span className="text-ink-900">Total</span>
              <span className="text-accent-600">{formatCurrency(invoice.total, invoice.currency)}</span>
            </div>
          </div>

          {invoice.notes && (
            <Card>
              <CardHeader>
                <CardTitle>Notes</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-ink-700">{invoice.notes}</CardContent>
            </Card>
          )}

          {signature && (
            <Card>
              <CardHeader>
                <CardTitle>Signature électronique</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
                  <div className="rounded-lg border border-line bg-paper-dim/40 p-3">
                    <Image
                      src={signature.signature_data_url}
                      alt={`Signature de ${signature.signer_name}`}
                      width={200}
                      height={90}
                      unoptimized
                      className="h-[70px] w-auto"
                    />
                  </div>
                  <div className="text-sm">
                    <p className="font-medium text-ink-900">{signature.signer_name}</p>
                    {signature.signer_email && <p className="text-ink-500">{signature.signer_email}</p>}
                    <p className="mt-1 text-xs text-ink-500">Signé le {formatDateTime(signature.signed_at)}</p>
                    <p className="mt-0.5 font-mono text-[11px] text-ink-300">
                      Empreinte {signature.signature_hash.slice(0, 16)}…
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Historique</CardTitle>
          </CardHeader>
          <CardContent>
            <ActivityTimeline entries={activity} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
