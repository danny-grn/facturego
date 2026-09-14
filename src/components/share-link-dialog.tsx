"use client";

import * as React from "react";
import { Copy, Check, Mail } from "lucide-react";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function ShareLinkDialog({
  open,
  onClose,
  link,
  title = "Lien de signature",
  subject = "Un document à consulter et signer",
  recipientEmail,
}: {
  open: boolean;
  onClose: () => void;
  link: string;
  title?: string;
  subject?: string;
  recipientEmail?: string | null;
}) {
  const [copied, setCopied] = React.useState(false);

  async function copy() {
    await navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }

  const mailBody = `Bonjour,%0D%0A%0D%0AVeuillez consulter et signer ce document via le lien suivant :%0D%0A${encodeURIComponent(
    link
  )}%0D%0A%0D%0AMerci,`;
  const mailto = `mailto:${recipientEmail ?? ""}?subject=${encodeURIComponent(subject)}&body=${mailBody}`;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={title}
      description="Partagez ce lien avec votre client : il pourra consulter le document et le signer en ligne, sans créer de compte."
    >
      <div className="flex gap-2">
        <Input readOnly value={link} className="font-mono text-xs" onFocus={(e) => e.target.select()} />
        <Button type="button" variant="outline" onClick={copy}>
          {copied ? <Check className="h-4 w-4 text-success-600" /> : <Copy className="h-4 w-4" />}
        </Button>
      </div>
      <a href={mailto} className="mt-4 block">
        <Button type="button" variant="secondary" className="w-full">
          <Mail className="h-4 w-4" /> Envoyer par email
        </Button>
      </a>
    </Dialog>
  );
}
