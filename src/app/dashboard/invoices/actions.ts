"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient as createSupabaseServerClient } from "@/lib/supabase/server";
import { invoiceSchema, type InvoiceInput } from "@/lib/validation";
import { computeInvoiceTotals } from "@/lib/invoice-utils";

async function requireUser() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { supabase, user };
}

export async function createInvoiceAction(input: InvoiceInput) {
  const parsed = invoiceSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Formulaire invalide" };

  const { supabase, user } = await requireUser();
  if (!user) return { error: "Session expirée, reconnectez-vous." };

  const { data: invoiceNumber, error: numberError } = await supabase.rpc("next_invoice_number", {
    p_user_id: user.id,
  });
  if (numberError || !invoiceNumber) {
    return { error: "Impossible de générer le numéro de facture." };
  }

  const totals = computeInvoiceTotals(parsed.data.items);

  const { data: invoice, error } = await supabase
    .from("invoices")
    .insert({
      user_id: user.id,
      client_id: parsed.data.client_id,
      invoice_number: invoiceNumber,
      issue_date: parsed.data.issue_date,
      due_date: parsed.data.due_date || null,
      currency: parsed.data.currency,
      notes: parsed.data.notes || null,
      payment_terms: parsed.data.payment_terms || null,
      subtotal: totals.subtotal,
      tax_total: totals.taxTotal,
      total: totals.total,
    })
    .select("id")
    .single();

  if (error || !invoice) return { error: "Impossible de créer la facture." };

  const { error: itemsError } = await supabase.from("invoice_items").insert(
    parsed.data.items.map((item, index) => ({
      invoice_id: invoice.id,
      description: item.description,
      quantity: item.quantity,
      unit_price: item.unit_price,
      tax_rate: item.tax_rate,
      position: index,
    }))
  );
  if (itemsError) return { error: "Impossible d'enregistrer les lignes de la facture." };

  await supabase.rpc("log_invoice_activity", {
    p_invoice_id: invoice.id,
    p_event_type: "created",
    p_metadata: {},
  });

  revalidatePath("/dashboard/invoices");
  redirect(`/dashboard/invoices/${invoice.id}`);
}

export async function updateInvoiceAction(id: string, input: InvoiceInput) {
  const parsed = invoiceSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Formulaire invalide" };

  const { supabase, user } = await requireUser();
  if (!user) return { error: "Session expirée, reconnectez-vous." };

  const { data: existing } = await supabase.from("invoices").select("status").eq("id", id).maybeSingle();
  if (!existing) return { error: "Facture introuvable." };
  if (existing.status !== "draft") return { error: "Seules les factures en brouillon peuvent être modifiées." };

  const totals = computeInvoiceTotals(parsed.data.items);

  const { error } = await supabase
    .from("invoices")
    .update({
      client_id: parsed.data.client_id,
      issue_date: parsed.data.issue_date,
      due_date: parsed.data.due_date || null,
      currency: parsed.data.currency,
      notes: parsed.data.notes || null,
      payment_terms: parsed.data.payment_terms || null,
      subtotal: totals.subtotal,
      tax_total: totals.taxTotal,
      total: totals.total,
    })
    .eq("id", id);
  if (error) return { error: "Impossible de mettre à jour la facture." };

  await supabase.from("invoice_items").delete().eq("invoice_id", id);
  const { error: itemsError } = await supabase.from("invoice_items").insert(
    parsed.data.items.map((item, index) => ({
      invoice_id: id,
      description: item.description,
      quantity: item.quantity,
      unit_price: item.unit_price,
      tax_rate: item.tax_rate,
      position: index,
    }))
  );
  if (itemsError) return { error: "Impossible d'enregistrer les lignes de la facture." };

  revalidatePath("/dashboard/invoices");
  revalidatePath(`/dashboard/invoices/${id}`);
  redirect(`/dashboard/invoices/${id}`);
}

export async function deleteInvoiceAction(id: string) {
  const { supabase } = await requireUser();
  const { data: existing } = await supabase.from("invoices").select("status").eq("id", id).maybeSingle();
  if (existing && existing.status !== "draft") {
    return { error: "Seules les factures en brouillon peuvent être supprimées." };
  }

  const { error } = await supabase.from("invoices").delete().eq("id", id);
  if (error) return { error: "Impossible de supprimer la facture." };

  revalidatePath("/dashboard/invoices");
  return { success: true };
}

export async function sendInvoiceAction(id: string) {
  const { supabase } = await requireUser();
  const { data, error } = await supabase
    .from("invoices")
    .update({ status: "sent", sent_at: new Date().toISOString() })
    .eq("id", id)
    .select("share_token")
    .single();
  if (error || !data) return { error: "Impossible d'envoyer la facture." };

  await supabase.rpc("log_invoice_activity", {
    p_invoice_id: id,
    p_event_type: "sent",
    p_metadata: {},
  });

  revalidatePath(`/dashboard/invoices/${id}`);
  revalidatePath("/dashboard/invoices");
  return { success: true, shareToken: data.share_token };
}

export async function markInvoicePaidAction(id: string) {
  const { supabase } = await requireUser();
  const { error } = await supabase
    .from("invoices")
    .update({ status: "paid", paid_at: new Date().toISOString() })
    .eq("id", id);
  if (error) return { error: "Impossible de marquer la facture comme payée." };

  await supabase.rpc("log_invoice_activity", { p_invoice_id: id, p_event_type: "paid", p_metadata: {} });

  revalidatePath(`/dashboard/invoices/${id}`);
  revalidatePath("/dashboard/invoices");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function cancelInvoiceAction(id: string) {
  const { supabase } = await requireUser();
  const { error } = await supabase.from("invoices").update({ status: "cancelled" }).eq("id", id);
  if (error) return { error: "Impossible d'annuler la facture." };

  await supabase.rpc("log_invoice_activity", { p_invoice_id: id, p_event_type: "cancelled", p_metadata: {} });

  revalidatePath(`/dashboard/invoices/${id}`);
  revalidatePath("/dashboard/invoices");
  return { success: true };
}
