import "server-only";
import { headers } from "next/headers";

/**
 * Origine publique de l'application, pour construire les liens envoyés par
 * email (signature, espace client, confirmation d'inscription).
 *
 * On lit l'hôte de la requête en cours plutôt que `NEXT_PUBLIC_APP_URL` :
 * cette variable est figée au build et une valeur erronée produit des liens
 * qui pointent ailleurs, sans le moindre signal. L'hôte de la requête est,
 * lui, toujours celui par lequel l'utilisateur est réellement passé.
 */
export async function getAppUrl(): Promise<string> {
  try {
    const headerList = await headers();
    const host = headerList.get("x-forwarded-host") ?? headerList.get("host");
    if (host) {
      const proto =
        headerList.get("x-forwarded-proto") ??
        (host.startsWith("localhost") || host.startsWith("127.0.0.1") ? "http" : "https");
      return `${proto}://${host}`;
    }
  } catch {
    // Appelé hors d'un contexte de requête : on retombe sur la configuration.
  }

  const configured = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (configured) return configured.replace(/\/+$/, "");
  return "http://localhost:3000";
}
