"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient as createSupabaseServerClient } from "@/lib/supabase/server";
import { documentUploadSchema } from "@/lib/validation";

const MAX_BASE64_LENGTH = 8_000_000; // ~6 Mo de fichier binaire

export async function uploadDocumentAction(input: {
  title: string;
  client_id?: string;
  fileName: string;
  fileMime: string;
  fileBase64: string;
}) {
  const parsed = documentUploadSchema.safeParse({ title: input.title, client_id: input.client_id });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Formulaire invalide" };

  if (!input.fileBase64) return { error: "Sélectionnez un fichier PDF." };
  if (input.fileMime !== "application/pdf") return { error: "Seuls les fichiers PDF sont acceptés." };
  if (input.fileBase64.length > MAX_BASE64_LENGTH) return { error: "Le fichier est trop volumineux (8 Mo max)." };

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Session expirée, reconnectez-vous." };

  const { data: document, error } = await supabase
    .from("documents")
    .insert({
      user_id: user.id,
      client_id: parsed.data.client_id || null,
      title: parsed.data.title,
      file_name: input.fileName,
      file_mime: input.fileMime,
      file_data_base64: input.fileBase64,
    })
    .select("id")
    .single();

  if (error || !document) return { error: "Impossible d'enregistrer le document." };

  await supabase.rpc("log_document_activity", { p_document_id: document.id, p_event_type: "created", p_metadata: {} });

  revalidatePath("/dashboard/documents");
  redirect(`/dashboard/documents/${document.id}`);
}

export async function sendDocumentAction(id: string) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("documents")
    .update({ status: "sent", sent_at: new Date().toISOString() })
    .eq("id", id)
    .select("share_token")
    .single();
  if (error || !data) return { error: "Impossible d'envoyer le document." };

  await supabase.rpc("log_document_activity", { p_document_id: id, p_event_type: "sent", p_metadata: {} });

  revalidatePath(`/dashboard/documents/${id}`);
  revalidatePath("/dashboard/documents");
  return { success: true, shareToken: data.share_token };
}

export async function cancelDocumentAction(id: string) {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("documents").update({ status: "cancelled" }).eq("id", id);
  if (error) return { error: "Impossible d'annuler le document." };

  await supabase.rpc("log_document_activity", { p_document_id: id, p_event_type: "cancelled", p_metadata: {} });

  revalidatePath(`/dashboard/documents/${id}`);
  revalidatePath("/dashboard/documents");
  return { success: true };
}

export async function deleteDocumentAction(id: string) {
  const supabase = await createSupabaseServerClient();
  const { data: existing } = await supabase.from("documents").select("status").eq("id", id).maybeSingle();
  if (existing && existing.status !== "draft") {
    return { error: "Seuls les documents en brouillon peuvent être supprimés." };
  }

  const { error } = await supabase.from("documents").delete().eq("id", id);
  if (error) return { error: "Impossible de supprimer le document." };

  revalidatePath("/dashboard/documents");
  return { success: true };
}
