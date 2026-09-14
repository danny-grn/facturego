"use server";

import { createHash } from "node:crypto";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { signatureSubmitSchema, type SignatureSubmitInput } from "@/lib/validation";

export async function submitSignatureAction(token: string, input: SignatureSubmitInput) {
  const parsed = signatureSubmitSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Formulaire invalide" };
  }

  const headerList = await headers();
  const ip = headerList.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;
  const userAgent = headerList.get("user-agent");

  const hash = createHash("sha256")
    .update(`${token}|${parsed.data.signatureDataUrl}|${parsed.data.signerEmail ?? ""}|${parsed.data.signerName}`)
    .digest("hex");

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("submit_signature_by_token", {
    p_token: token,
    p_signer_name: parsed.data.signerName,
    p_signer_email: parsed.data.signerEmail || null,
    p_signature_data_url: parsed.data.signatureDataUrl,
    p_signature_hash: hash,
    p_ip_address: ip,
    p_user_agent: userAgent,
  });

  if (error) {
    const message =
      error.message?.includes("already_signed")
        ? "Ce document a déjà été signé."
        : error.message?.includes("cancelled")
          ? "Ce document a été annulé par son émetteur."
          : "Impossible d'enregistrer la signature. Réessayez.";
    return { error: message };
  }

  revalidatePath(`/sign/${token}`);
  return { success: true, data };
}
