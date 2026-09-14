import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { getClients } from "@/lib/queries";
import { ClientsView } from "@/components/clients/clients-view";

export const metadata: Metadata = { title: "Clients — FactureGO" };

export default async function ClientsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const clients = await getClients(supabase, user.id);

  return <ClientsView clients={clients} />;
}
