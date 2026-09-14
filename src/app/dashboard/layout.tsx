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

  return (
    <DashboardShell companyName={profile?.company_name ?? ""} email={user.email ?? ""}>
      {children}
    </DashboardShell>
  );
}
