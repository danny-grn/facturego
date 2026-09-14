"use server";

import { revalidatePath } from "next/cache";
import { createClient as createSupabaseServerClient } from "@/lib/supabase/server";
import { profileSchema, type ProfileInput } from "@/lib/validation";
import { translateAuthError } from "@/lib/auth-errors";

async function requireUser() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { supabase, user };
}

export async function updateProfileAction(input: ProfileInput) {
  const parsed = profileSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Formulaire invalide" };

  const { supabase, user } = await requireUser();
  if (!user) return { error: "Session expirée, reconnectez-vous." };

  const { error } = await supabase
    .from("profiles")
    .upsert({
      id: user.id,
      company_name: parsed.data.company_name,
      legal_form: parsed.data.legal_form || null,
      siret: parsed.data.siret || null,
      vat_number: parsed.data.vat_number || null,
      address: parsed.data.address || null,
      postal_code: parsed.data.postal_code || null,
      city: parsed.data.city || null,
      country: parsed.data.country || "France",
      phone: parsed.data.phone || null,
      email: parsed.data.email || null,
      iban: parsed.data.iban || null,
      bic: parsed.data.bic || null,
      invoice_prefix: parsed.data.invoice_prefix,
      default_tax_rate: parsed.data.default_tax_rate,
      default_payment_terms: parsed.data.default_payment_terms,
      onboarded: true,
    });

  if (error) return { error: "Impossible d'enregistrer vos informations." };

  revalidatePath("/dashboard/settings");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function updateLogoAction(dataUrl: string | null) {
  const { supabase, user } = await requireUser();
  if (!user) return { error: "Session expirée, reconnectez-vous." };

  const { error } = await supabase.from("profiles").upsert({ id: user.id, logo_data_url: dataUrl });
  if (error) return { error: "Impossible de mettre à jour le logo." };

  revalidatePath("/dashboard/settings");
  return { success: true };
}

export async function changePasswordAction(newPassword: string) {
  if (newPassword.length < 8) return { error: "8 caractères minimum." };

  const { supabase } = await requireUser();
  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) return { error: translateAuthError(error.message) };

  return { success: true };
}
