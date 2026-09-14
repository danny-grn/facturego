import Link from "next/link";
import { AlertTriangle, MailWarning, UserCheck, UserPlus } from "lucide-react";
import { createClient } from "@/lib/supabase/server";

type Access = { email: string | null; has_account: boolean };

const TONES = {
  ok: "border-success-100 bg-success-100/40 text-success-600",
  info: "border-info-100 bg-info-100/40 text-info-600",
  warn: "border-warning-100 bg-warning-100/40 text-warning-600",
} as const;

/**
 * Rend visible ce qui se joue en coulisses : le destinataire retrouve ses
 * documents dans l'espace client si — et seulement si — il possède un compte
 * portant l'adresse email de sa fiche.
 */
export async function ClientPortalNotice({ clientId }: { clientId: string | null }) {
  if (!clientId) return null;

  const supabase = await createClient();
  const { data } = await supabase.rpc("client_portal_access", { p_client_id: clientId });
  const access = data as unknown as Access | null;
  if (!access) return null;

  const { tone, icon, message } = describe(access);

  return (
    <div
      className={`flex items-start gap-3 rounded-xl border px-4 py-3 text-sm ${TONES[tone]}`}
    >
      <span className="mt-0.5 shrink-0">{icon}</span>
      <p className="text-ink-700">
        {message}{" "}
        <Link href="/dashboard/clients" className="font-medium text-accent-600 hover:underline">
          Modifier la fiche client
        </Link>
      </p>
    </div>
  );
}

function describe(access: Access) {
  if (!access.email) {
    return {
      tone: "warn" as const,
      icon: <MailWarning className="h-4 w-4" />,
      message:
        "Aucune adresse email sur la fiche client : la facture ne peut pas être envoyée par email, et le client ne la verra pas dans son espace. Seul le partage manuel du lien de signature reste possible.",
    };
  }

  if (access.has_account) {
    return {
      tone: "ok" as const,
      icon: <UserCheck className="h-4 w-4" />,
      message: `Espace client : un compte existe pour ${access.email}. Une fois la facture envoyée, le client la retrouvera dans son espace.`,
    };
  }

  return {
    tone: "info" as const,
    icon: <UserPlus className="h-4 w-4" />,
    message: `Espace client : aucun compte n'existe encore pour ${access.email}. Le client peut signer via le lien reçu par email, et la facture apparaîtra dans son espace dès qu'il créera un compte avec cette adresse.`,
  };
}

/** Affiché quand la facture n'a aucun client rattaché. */
export function NoClientNotice() {
  return (
    <div className={`flex items-start gap-3 rounded-xl border px-4 py-3 text-sm ${TONES.warn}`}>
      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
      <p className="text-ink-700">
        Aucun client n&apos;est rattaché à cette facture : ni envoi par email, ni espace client.
      </p>
    </div>
  );
}
