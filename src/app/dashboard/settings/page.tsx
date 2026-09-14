import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { getProfile } from "@/lib/queries";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProfileForm } from "@/components/settings/profile-form";
import { PasswordForm } from "@/components/settings/password-form";

export const metadata: Metadata = { title: "Paramètres — FactureGO" };

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const profile = await getProfile(supabase, user.id);

  return (
    <div>
      <PageHeader title="Paramètres" description="Gérez les informations de votre entreprise et votre compte." />

      <div className="space-y-6">
        <ProfileForm profile={profile} />

        <Card>
          <CardHeader>
            <CardTitle>Sécurité</CardTitle>
          </CardHeader>
          <CardContent>
            <PasswordForm />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Compte</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-ink-500">Adresse email de connexion</p>
            <p className="mt-1 font-medium text-ink-900">{user.email}</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
