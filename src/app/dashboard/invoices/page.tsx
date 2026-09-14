import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { getInvoices } from "@/lib/queries";
import { InvoicesView } from "@/components/invoices/invoices-view";

export const metadata: Metadata = { title: "Factures — FactureGO" };

export default async function InvoicesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const invoices = await getInvoices(supabase, user.id);

  return <InvoicesView invoices={invoices as unknown as Parameters<typeof InvoicesView>[0]["invoices"]} />;
}
