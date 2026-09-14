import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { FileText, Inbox, PenLine } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { signOutAction } from "@/app/(auth)/actions";
import { Logo } from "@/components/logo";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { formatCurrency, formatDate } from "@/lib/format";
import { DOCUMENT_STATUS_META, INVOICE_STATUS_META } from "@/lib/invoice-utils";
import type { DocumentStatus, InvoiceStatus } from "@/lib/database.types";

export const metadata: Metadata = { title: "Mon espace — FactureGO" };

type PortalInvoice = {
  id: string;
  invoice_number: string;
  status: InvoiceStatus;
  issue_date: string;
  due_date: string | null;
  currency: string;
  total: number;
  share_token: string;
  issuer: string;
};

type PortalDocument = {
  id: string;
  title: string;
  status: DocumentStatus;
  created_at: string;
  share_token: string;
  issuer: string;
};

type Portal = {
  email: string | null;
  invoices: PortalInvoice[];
  documents: PortalDocument[];
};

/** Une facture déjà signée ou payée se consulte, elle ne se signe plus. */
const SIGNABLE: InvoiceStatus[] = ["sent", "viewed", "overdue"];

export default async function EspacePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/espace");

  const { data } = await supabase.rpc("get_client_portal");
  const portal = (data as unknown as Portal | null) ?? { email: null, invoices: [], documents: [] };
  const isEmpty = portal.invoices.length === 0 && portal.documents.length === 0;

  return (
    <div className="min-h-screen bg-paper-dim">
      <header className="border-b border-line bg-surface px-6 py-4">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-4">
          <Logo />
          <div className="flex items-center gap-4">
            <span className="hidden text-xs text-ink-500 sm:inline">{user.email}</span>
            <form action={signOutAction}>
              <button type="submit" className="text-xs font-medium text-ink-500 hover:text-ink-900">
                Se déconnecter
              </button>
            </form>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <h1 className="font-display text-2xl text-ink-900">Mon espace</h1>
        <p className="mt-1.5 text-sm text-ink-500">
          Les factures et documents qui vous ont été adressés à l&apos;adresse {user.email}.
        </p>

        {isEmpty ? (
          <EmptyState
            className="mt-8"
            icon={<Inbox className="h-6 w-6" />}
            title="Rien à afficher pour le moment"
            description="Dès qu'un émetteur vous enverra une facture ou un document à cette adresse email, il apparaîtra ici."
          />
        ) : (
          <div className="mt-8 space-y-10">
            {portal.invoices.length > 0 && (
              <section>
                <h2 className="mb-3 text-sm font-semibold text-ink-700">Factures</h2>
                <div className="space-y-3">
                  {portal.invoices.map((invoice) => {
                    const meta = INVOICE_STATUS_META[invoice.status];
                    const signable = SIGNABLE.includes(invoice.status);
                    return (
                      <Card key={invoice.id} className="flex flex-wrap items-center gap-4 p-5">
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-medium text-ink-900">{invoice.invoice_number}</span>
                            <Badge tone={meta?.tone ?? "neutral"}>{meta?.label ?? invoice.status}</Badge>
                          </div>
                          <p className="mt-1 text-sm text-ink-500">
                            {invoice.issuer} · émise le {formatDate(invoice.issue_date)}
                            {invoice.due_date ? ` · échéance ${formatDate(invoice.due_date)}` : ""}
                          </p>
                        </div>
                        <span className="font-medium text-ink-900">
                          {formatCurrency(invoice.total, invoice.currency)}
                        </span>
                        <Link
                          href={`/sign/${invoice.share_token}`}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-accent-600 px-3.5 py-2 text-sm font-medium text-white hover:bg-accent-700"
                        >
                          {signable ? <PenLine className="h-4 w-4" /> : <FileText className="h-4 w-4" />}
                          {signable ? "Consulter et signer" : "Consulter"}
                        </Link>
                      </Card>
                    );
                  })}
                </div>
              </section>
            )}

            {portal.documents.length > 0 && (
              <section>
                <h2 className="mb-3 text-sm font-semibold text-ink-700">Documents</h2>
                <div className="space-y-3">
                  {portal.documents.map((doc) => {
                    const meta = DOCUMENT_STATUS_META[doc.status];
                    const signable = doc.status === "sent" || doc.status === "viewed";
                    return (
                      <Card key={doc.id} className="flex flex-wrap items-center gap-4 p-5">
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-medium text-ink-900">{doc.title}</span>
                            <Badge tone={meta?.tone ?? "neutral"}>{meta?.label ?? doc.status}</Badge>
                          </div>
                          <p className="mt-1 text-sm text-ink-500">
                            {doc.issuer} · reçu le {formatDate(doc.created_at)}
                          </p>
                        </div>
                        <Link
                          href={`/sign/${doc.share_token}`}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-accent-600 px-3.5 py-2 text-sm font-medium text-white hover:bg-accent-700"
                        >
                          {signable ? <PenLine className="h-4 w-4" /> : <FileText className="h-4 w-4" />}
                          {signable ? "Consulter et signer" : "Consulter"}
                        </Link>
                      </Card>
                    );
                  })}
                </div>
              </section>
            )}
          </div>
        )}

        <p className="mt-10 text-center text-xs text-ink-500">
          Vous émettez aussi des factures ?{" "}
          <Link href="/dashboard" className="font-medium text-accent-600 hover:underline">
            Accéder à mon tableau de bord
          </Link>
        </p>
      </main>
    </div>
  );
}
