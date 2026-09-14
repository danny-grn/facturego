"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient as createSupabaseServerClient } from "@/lib/supabase/server";
import { invoiceSchema, type InvoiceInput } from "@/lib/validation";
import { computeInvoiceTotals } from "@/lib/invoice-utils";
import { getInvoiceWithItems, getProfile } from "@/lib/queries";
import { buildInvoicePdf } from "@/lib/pdf/invoice-pdf";
import { buildSignatureEmailHtml, isEmailConfigured, sendEmail } from "@/lib/email";
import { formatCurrency } from "@/lib/format";

function fail(scope: string, error: unknown, message: string) {
  const e = error as { code?: string; message?: string; details?: string; hint?: string } | null;
  console.error(`[invoices] ${scope}`, {
    code: e?.code,
    message: e?.message,
    details: e?.details,
    hint: e?.hint,
  });
  return { error: e?.code ? `${message} (${e.code}: ${e.message})` : message };
}

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
    return fail(
      "next_invoice_number",
      numberError,
      "Impossible de générer le numéro de facture. Vérifiez que votre profil existe (Paramètres)."
    );
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

  if (error || !invoice) return fail("createInvoice", error, "Impossible de créer la facture.");

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
  if (itemsError) return fail("createInvoiceItems", itemsError, "Impossible d'enregistrer les lignes de la facture.");

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

export type InvoiceEmailOutcome =
  | { status: "sent"; to: string }
  | { status: "no_recipient" }
  | { status: "not_configured" }
  | { status: "failed"; error: string };

export async function sendInvoiceAction(id: string) {
  const { supabase, user } = await requireUser();
  if (!user) return { error: "Session expirée, reconnectez-vous." };

  const { data, error } = await supabase
    .from("invoices")
    .update({ status: "sent", sent_at: new Date().toISOString() })
    .eq("id", id)
    .select("share_token")
    .single();
  if (error || !data) return fail("sendInvoice", error, "Impossible d'envoyer la facture.");

  const email = await emailInvoiceToClient(supabase, user.id, id);

  await supabase.rpc("log_invoice_activity", {
    p_invoice_id: id,
    p_event_type: "sent",
    p_metadata: email.status === "sent" ? { email_to: email.to } : { email: email.status },
  });

  revalidatePath(`/dashboard/invoices/${id}`);
  revalidatePath("/dashboard/invoices");
  return { success: true, shareToken: data.share_token, email };
}

/**
 * Envoie au client le lien de signature et le PDF de la facture.
 * L'échec n'annule pas l'envoi : la facture reste au statut « envoyée » et le
 * lien peut toujours être partagé à la main depuis le détail de la facture.
 */
async function emailInvoiceToClient(
  supabase: Awaited<ReturnType<typeof requireUser>>["supabase"],
  userId: string,
  invoiceId: string
): Promise<InvoiceEmailOutcome> {
  const result = await getInvoiceWithItems(supabase, invoiceId);
  // Filet supplémentaire : la RLS filtre déjà, mais une action est un point
  // d'entrée public, on revérifie la propriété avant d'envoyer quoi que ce soit.
  if (!result?.invoice || result.invoice.user_id !== userId) {
    return { status: "failed", error: "Facture introuvable." };
  }

  const client = result.invoice.client ?? null;
  const recipient = client?.email?.trim();
  if (!recipient) return { status: "no_recipient" };
  if (!isEmailConfigured()) return { status: "not_configured" };

  const profile = await getProfile(supabase, userId);
  const senderName = profile?.company_name?.trim() || "FactureGO";
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";
  const link = `${appUrl}/sign/${result.invoice.share_token}`;

  let attachments;
  try {
    const bytes = await buildInvoicePdf({
      invoice: result.invoice,
      items: result.items,
      client,
      profile,
      signature: result.signature,
    });
    attachments = [
      {
        filename: `${result.invoice.invoice_number}.pdf`,
        content: Buffer.from(bytes).toString("base64"),
      },
    ];
  } catch (pdfError) {
    // Le PDF est un confort : on envoie le lien même si sa génération échoue.
    console.error("[invoices] génération du PDF pour l'email", pdfError);
  }

  const amount = formatCurrency(result.invoice.total, result.invoice.currency);
  const sent = await sendEmail({
    to: recipient,
    subject: `Facture ${result.invoice.invoice_number} — ${senderName}`,
    replyTo: profile?.email ?? null,
    html: buildSignatureEmailHtml({
      recipientName: client?.name ?? null,
      senderName,
      intro: `Vous trouverez ci-joint la facture ${result.invoice.invoice_number} d'un montant de ${amount}. Vous pouvez la consulter et la signer en ligne via le lien ci-dessous.`,
      link,
      buttonLabel: "Consulter et signer la facture",
      portalUrl: appUrl ? `${appUrl}/espace` : null,
    }),
    attachments,
  });

  if (!sent.ok) return { status: "failed", error: sent.error };
  return { status: "sent", to: recipient };
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
