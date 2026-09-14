import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getClients, getProfile } from "@/lib/queries";
import { PageHeader } from "@/components/layout/page-header";
import { InvoiceForm } from "@/components/invoices/invoice-form";

export const metadata: Metadata = { title: "Nouvelle facture — FactureGO" };

export default async function NewInvoicePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const [clients, profile] = await Promise.all([getClients(supabase, user.id), getProfile(supabase, user.id)]);

  return (
    <div>
      <Link href="/dashboard/invoices" className="mb-4 inline-flex items-center gap-1.5 text-sm text-ink-500 hover:text-ink-900">
        <ArrowLeft className="h-3.5 w-3.5" /> Retour aux factures
      </Link>
      <PageHeader title="Nouvelle facture" description="Renseignez les informations de votre prestation." />
      <InvoiceForm clients={clients} profile={profile} />
    </div>
  );
}
