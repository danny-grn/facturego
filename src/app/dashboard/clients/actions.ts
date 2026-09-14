"use server";

import { revalidatePath } from "next/cache";
import { createClient as createSupabaseServerClient } from "@/lib/supabase/server";
import { clientSchema, type ClientInput } from "@/lib/validation";

function clean(input: ClientInput) {
  return {
    name: input.name,
    email: input.email || null,
    phone: input.phone || null,
    address: input.address || null,
    postal_code: input.postal_code || null,
    city: input.city || null,
    country: input.country || "France",
    siret: input.siret || null,
    vat_number: input.vat_number || null,
    notes: input.notes || null,
  };
}

export async function createClientAction(input: ClientInput) {
  const parsed = clientSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Formulaire invalide" };

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Session expirée, reconnectez-vous." };

  const { data, error } = await supabase
    .from("clients")
    .insert({ user_id: user.id, ...clean(parsed.data) })
    .select("*")
    .single();

  if (error) return { error: "Impossible de créer le client." };

  revalidatePath("/dashboard/clients");
  return { success: true, client: data };
}

export async function updateClientAction(id: string, input: ClientInput) {
  const parsed = clientSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Formulaire invalide" };

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("clients").update(clean(parsed.data)).eq("id", id);

  if (error) return { error: "Impossible de mettre à jour le client." };

  revalidatePath("/dashboard/clients");
  revalidatePath(`/dashboard/clients/${id}`);
  return { success: true };
}

export async function deleteClientAction(id: string) {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("clients").delete().eq("id", id);
  if (error) return { error: "Impossible de supprimer ce client (il est peut-être lié à des factures)." };

  revalidatePath("/dashboard/clients");
  return { success: true };
}
