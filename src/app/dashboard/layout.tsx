import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getProfile } from "@/lib/queries";
import { DashboardShell } from "@/components/layout/dashboard-shell";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const profile = await getProfile(supabase, user.id);

  // Un même compte peut émettre des factures et en recevoir : l'entrée vers
  // l'espace client n'apparaît que s'il y a effectivement quelque chose dedans.
  const { data: portal } = await supabase.rpc("get_client_portal");
  const p = portal as unknown as { invoices?: unknown[]; documents?: unknown[] } | null;
  const showClientPortal = Boolean(p?.invoices?.length || p?.documents?.length);

  return (
    <DashboardShell
      companyName={profile?.company_name ?? ""}
      email={user.email ?? ""}
      showClientPortal={showClientPortal}
    >
      {children}
    </DashboardShell>
  );
}
