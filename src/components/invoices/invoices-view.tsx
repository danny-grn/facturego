"use client";

import * as React from "react";
import Link from "next/link";
import { Plus, Search, FileText } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table";
import { EmptyState } from "@/components/ui/empty-state";
import { InvoiceStatusBadge } from "@/components/status-badge";
import { formatCurrency, formatDateShort } from "@/lib/format";
import { getEffectiveInvoiceStatus } from "@/lib/invoice-utils";
import { cn } from "@/lib/cn";
import type { Invoice } from "@/lib/database.types";

type InvoiceRow = Invoice & { client: { id: string; name: string; email: string | null } | null };

const TABS = [
  { key: "all", label: "Toutes" },
  { key: "draft", label: "Brouillons" },
  { key: "sent", label: "Envoyées" },
  { key: "signed", label: "Signées" },
  { key: "paid", label: "Payées" },
  { key: "overdue", label: "En retard" },
] as const;

export function InvoicesView({ invoices }: { invoices: InvoiceRow[] }) {
  const [tab, setTab] = React.useState<(typeof TABS)[number]["key"]>("all");
  const [query, setQuery] = React.useState("");

  const filtered = invoices.filter((invoice) => {
    const effective = getEffectiveInvoiceStatus(invoice);
    const matchesTab = tab === "all" || effective === tab || invoice.status === tab;
    const matchesQuery = `${invoice.invoice_number} ${invoice.client?.name ?? ""}`
      .toLowerCase()
      .includes(query.toLowerCase());
    return matchesTab && matchesQuery;
  });

  return (
    <div>
      <PageHeader
        title="Factures"
        description="Créez, envoyez et suivez le statut de vos factures."
        actions={
          <Link href="/dashboard/invoices/new">
            <Button>
              <Plus className="h-4 w-4" /> Nouvelle facture
            </Button>
          </Link>
        }
      />

      {invoices.length === 0 ? (
        <EmptyState
          icon={<FileText className="h-5 w-5" />}
          title="Aucune facture pour l'instant"
          description="Créez votre première facture pour commencer à suivre vos encaissements."
          action={
            <Link href="/dashboard/invoices/new">
              <Button>
                <Plus className="h-4 w-4" /> Créer une facture
              </Button>
            </Link>
          }
        />
      ) : (
        <>
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap gap-1.5">
              {TABS.map((t) => (
                <button
                  key={t.key}
                  onClick={() => setTab(t.key)}
                  className={cn(
                    "rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
                    tab === t.key ? "bg-ink-900 text-paper" : "bg-ink-100 text-ink-700 hover:bg-ink-200"
                  )}
                >
                  {t.label}
                </button>
              ))}
            </div>
            <div className="relative w-full max-w-xs">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-300" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Rechercher…"
                className="pl-9"
              />
            </div>
          </div>

          {filtered.length === 0 ? (
            <EmptyState title="Aucun résultat" description="Modifiez vos filtres ou votre recherche." />
          ) : (
            <Table>
              <THead>
                <tr>
                  <TH>Facture</TH>
                  <TH>Client</TH>
                  <TH>Émise le</TH>
                  <TH>Échéance</TH>
                  <TH>Statut</TH>
                  <TH className="text-right">Montant</TH>
                </tr>
              </THead>
              <TBody>
                {filtered.map((invoice) => (
                  <TR key={invoice.id} clickable>
                    <TD>
                      <Link
                        href={`/dashboard/invoices/${invoice.id}`}
                        className="font-medium text-ink-900 hover:text-accent-600"
                      >
                        {invoice.invoice_number}
                      </Link>
                    </TD>
                    <TD>{invoice.client?.name ?? "—"}</TD>
                    <TD>{formatDateShort(invoice.issue_date)}</TD>
                    <TD>{formatDateShort(invoice.due_date)}</TD>
                    <TD>
                      <InvoiceStatusBadge invoice={invoice} />
                    </TD>
                    <TD className="text-right font-medium">{formatCurrency(invoice.total, invoice.currency)}</TD>
                  </TR>
                ))}
              </TBody>
            </Table>
          )}
        </>
      )}
    </div>
  );
}
