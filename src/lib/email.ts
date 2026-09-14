import "server-only";

const RESEND_ENDPOINT = "https://api.resend.com/emails";

export type EmailAttachment = {
  filename: string;
  /** Contenu encodé en base64. */
  content: string;
};

export type SendEmailResult = { ok: true } | { ok: false; error: string };

/**
 * L'envoi d'email est optionnel : sans clé configurée, l'app retombe sur le
 * partage manuel du lien de signature.
 */
export function isEmailConfigured() {
  return Boolean(process.env.RESEND_API_KEY && process.env.EMAIL_FROM);
}

export async function sendEmail({
  to,
  subject,
  html,
  replyTo,
  attachments,
}: {
  to: string;
  subject: string;
  html: string;
  replyTo?: string | null;
  attachments?: EmailAttachment[];
}): Promise<SendEmailResult> {
  if (!isEmailConfigured()) {
    return { ok: false, error: "Envoi d'email non configuré (RESEND_API_KEY / EMAIL_FROM)." };
  }

  try {
    const response = await fetch(RESEND_ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: process.env.EMAIL_FROM,
        to: [to],
        subject,
        html,
        ...(replyTo ? { reply_to: replyTo } : {}),
        ...(attachments?.length ? { attachments } : {}),
      }),
    });

    if (!response.ok) {
      const body = await response.text();
      console.error("[email] envoi refusé", { status: response.status, body });
      let detail = body;
      try {
        detail = (JSON.parse(body) as { message?: string }).message ?? body;
      } catch {
        // corps non JSON : on garde le texte brut
      }
      return { ok: false, error: `Envoi refusé (${response.status}) : ${detail}` };
    }

    return { ok: true };
  } catch (error) {
    console.error("[email] échec réseau", error);
    return { ok: false, error: "Le service d'envoi est injoignable." };
  }
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function buildSignatureEmailHtml({
  recipientName,
  senderName,
  intro,
  link,
  buttonLabel,
}: {
  recipientName: string | null;
  senderName: string;
  intro: string;
  link: string;
  buttonLabel: string;
}) {
  const greeting = recipientName ? `Bonjour ${escapeHtml(recipientName)},` : "Bonjour,";

  return `<!doctype html>
<html lang="fr">
  <body style="margin:0;padding:24px;background:#faf7f2;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;color:#1c1917;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:12px;padding:32px;">
      <tr><td>
        <p style="margin:0 0 16px;font-size:16px;">${greeting}</p>
        <p style="margin:0 0 24px;font-size:15px;line-height:1.6;">${escapeHtml(intro)}</p>
        <p style="margin:0 0 28px;">
          <a href="${encodeURI(link)}" style="display:inline-block;background:#7f1d1d;color:#ffffff;text-decoration:none;padding:12px 24px;border-radius:8px;font-size:15px;font-weight:600;">${escapeHtml(buttonLabel)}</a>
        </p>
        <p style="margin:0 0 8px;font-size:13px;color:#57534e;">Si le bouton ne fonctionne pas, copiez ce lien dans votre navigateur :</p>
        <p style="margin:0 0 24px;font-size:13px;word-break:break-all;color:#57534e;">${escapeHtml(link)}</p>
        <p style="margin:0;font-size:15px;">Cordialement,<br />${escapeHtml(senderName)}</p>
      </td></tr>
    </table>
  </body>
</html>`;
}
