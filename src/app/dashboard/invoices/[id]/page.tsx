import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getInvoiceWithItems, getClients, getProfile } from "@/lib/queries";
import { InvoiceForm } from "@/components/invoices/invoice-form";
import { InvoiceDetail } from "@/components/invoices/invoice-detail";
import { InvoiceActions } from "@/components/invoices/invoice-actions";

export default async function InvoiceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const result = await getInvoiceWithItems(supabase, id);
  if (!result?.invoice || result.invoice.user_id !== user.id) notFound();

  const { invoice, items, signature, activity } = result;
  const client = invoice.client ?? null;

  if (invoice.status === "draft") {
    const [clients, profile] = await Promise.all([getClients(supabase, user.id), getProfile(supabase, user.id)]);
    return (
      <div>
        <Link
          href="/dashboard/invoices"
          className="mb-4 inline-flex items-center gap-1.5 text-sm text-ink-500 hover:text-ink-900"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Retour aux factures
        </Link>
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <h1 className="font-display text-2xl font-medium text-ink-900">Brouillon {invoice.invoice_number}</h1>
          <InvoiceActions invoice={invoice} clientEmail={client?.email} />
        </div>
        <InvoiceForm clients={clients} profile={profile} invoice={invoice} items={items} />
      </div>
    );
  }

  return (
    <div>
      <Link
        href="/dashboard/invoices"
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-ink-500 hover:text-ink-900"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Retour aux factures
      </Link>
      <InvoiceDetail invoice={invoice} items={items} client={client} signature={signature} activity={activity} />
    </div>
  );
}
