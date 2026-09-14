import Link from "next/link";
import type { Metadata } from "next";
import { Wallet, Clock, AlertTriangle, Users, ArrowUpRight } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getDashboardData } from "@/lib/queries";
import { PageHeader } from "@/components/layout/page-header";
import { StatCard } from "@/components/dashboard/stat-card";
import { RevenueChart, type RevenuePoint } from "@/components/dashboard/revenue-chart";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table";
import { EmptyState } from "@/components/ui/empty-state";
import { InvoiceStatusBadge } from "@/components/status-badge";
import { formatCurrency, formatDateShort } from "@/lib/format";
import { getEffectiveInvoiceStatus } from "@/lib/invoice-utils";

export const metadata: Metadata = { title: "Tableau de bord — FactureGO" };

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { invoices, clientCount, documents } = await getDashboardData(supabase, user.id);

  const paid = invoices.filter((i) => i.status === "paid");
  const paidTotal = paid.reduce((s, i) => s + i.total, 0);

  const outstanding = invoices.filter((i) => ["sent", "viewed", "signed"].includes(i.status));
  const outstandingTotal = outstanding.reduce((s, i) => s + i.total, 0);

  const overdue = invoices.filter((i) => getEffectiveInvoiceStatus(i) === "overdue");
  const overdueTotal = overdue.reduce((s, i) => s + i.total, 0);

  const signedDocuments = documents.filter((d) => d.status === "signed").length;

  const now = new Date();
  const months: RevenuePoint[] = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
    return { month: d.toLocaleDateString("fr-FR", { month: "short" }), key: `${d.getFullYear()}-${d.getMonth()}`, total: 0 };
  }) as (RevenuePoint & { key: string })[];

  for (const invoice of paid) {
    const ref = invoice.paid_at ?? invoice.issue_date;
    if (!ref) continue;
    const d = new Date(ref);
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    const point = months.find((m) => (m as RevenuePoint & { key: string }).key === key);
    if (point) point.total += invoice.total;
  }

  const recentInvoices = invoices.slice(0, 6);

  return (
    <div>
      <PageHeader
        title="Tableau de bord"
        description="Vue d'ensemble de votre activité et du suivi de vos factures."
        actions={
          <Link
            href="/dashboard/invoices/new"
            className="inline-flex h-10 items-center gap-1.5 rounded-lg bg-accent-600 px-4 text-sm font-medium text-paper hover:bg-accent-700"
          >
            Nouvelle facture
          </Link>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Encaissé"
          value={formatCurrency(paidTotal)}
          hint={`${paid.length} facture${paid.length > 1 ? "s" : ""} payée${paid.length > 1 ? "s" : ""}`}
          icon={<Wallet className="h-5 w-5" />}
          tone="success"
        />
        <StatCard
          label="En attente de paiement"
          value={formatCurrency(outstandingTotal)}
          hint={`${outstanding.length} facture${outstanding.length > 1 ? "s" : ""} en cours`}
          icon={<Clock className="h-5 w-5" />}
          tone="accent"
        />
        <StatCard
          label="En retard"
          value={formatCurrency(overdueTotal)}
          hint={`${overdue.length} facture${overdue.length > 1 ? "s" : ""} échue${overdue.length > 1 ? "s" : ""}`}
          icon={<AlertTriangle className="h-5 w-5" />}
          tone="danger"
        />
        <StatCard
          label="Clients"
          value={String(clientCount)}
          hint={`${signedDocuments} document${signedDocuments > 1 ? "s" : ""} signé${signedDocuments > 1 ? "s" : ""}`}
          icon={<Users className="h-5 w-5" />}
          tone="neutral"
        />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <div>
              <CardTitle>Encaissements des 6 derniers mois</CardTitle>
            </div>
          </CardHeader>
          <div className="px-2 pb-4">
            <RevenueChart data={months} />
          </div>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Répartition</CardTitle>
          </CardHeader>
          <div className="space-y-4 px-5 pb-5">
            <DistributionRow label="Brouillons" count={invoices.filter((i) => i.status === "draft").length} />
            <DistributionRow label="Envoyées" count={invoices.filter((i) => i.status === "sent").length} />
            <DistributionRow label="Consultées" count={invoices.filter((i) => i.status === "viewed").length} />
            <DistributionRow label="Signées" count={invoices.filter((i) => i.status === "signed").length} />
            <DistributionRow label="Payées" count={paid.length} />
            <DistributionRow label="En retard" count={overdue.length} />
          </div>
        </Card>
      </div>

      <div className="mt-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-lg font-medium text-ink-900">Factures récentes</h2>
          <Link
            href="/dashboard/invoices"
            className="inline-flex items-center gap-1 text-sm font-medium text-accent-600 hover:text-accent-700"
          >
            Tout voir <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {recentInvoices.length === 0 ? (
          <EmptyState
            title="Aucune facture pour l'instant"
            description="Créez votre première facture pour commencer à suivre vos encaissements."
            action={
              <Link
                href="/dashboard/invoices/new"
                className="inline-flex h-9 items-center rounded-lg bg-accent-600 px-4 text-sm font-medium text-paper hover:bg-accent-700"
              >
                Créer une facture
              </Link>
            }
          />
        ) : (
          <Table>
            <THead>
              <tr>
                <TH>Facture</TH>
                <TH>Client</TH>
                <TH>Date</TH>
                <TH>Statut</TH>
                <TH className="text-right">Montant</TH>
              </tr>
            </THead>
            <TBody>
              {recentInvoices.map((invoice) => (
                <TR key={invoice.id} href={`/dashboard/invoices/${invoice.id}`}>
                  <TD>
                    <Link href={`/dashboard/invoices/${invoice.id}`} className="font-medium text-ink-900 hover:text-accent-600">
                      {invoice.invoice_number}
                    </Link>
                  </TD>
                  <TD>{invoice.client?.name ?? "—"}</TD>
                  <TD>{formatDateShort(invoice.issue_date)}</TD>
                  <TD>
                    <InvoiceStatusBadge invoice={invoice} />
                  </TD>
                  <TD className="text-right font-medium">{formatCurrency(invoice.total)}</TD>
                </TR>
              ))}
            </TBody>
          </Table>
        )}
      </div>
    </div>
  );
}

function DistributionRow({ label, count }: { label: string; count: number }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-ink-700">{label}</span>
      <span className="font-medium text-ink-900">{count}</span>
    </div>
  );
}
