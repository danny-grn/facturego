"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Send, Download, CheckCircle2, XCircle, Trash2, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { ShareLinkDialog } from "@/components/share-link-dialog";
import {
  sendInvoiceAction,
  markInvoicePaidAction,
  cancelInvoiceAction,
  deleteInvoiceAction,
} from "@/app/dashboard/invoices/actions";
import type { Invoice } from "@/lib/database.types";

export function InvoiceActions({
  invoice,
  clientEmail,
}: {
  invoice: Invoice;
  clientEmail?: string | null;
}) {
  const router = useRouter();
  const [sending, setSending] = React.useState(false);
  const [marking, setMarking] = React.useState(false);
  const [shareOpen, setShareOpen] = React.useState(false);
  const [cancelOpen, setCancelOpen] = React.useState(false);
  const [deleteOpen, setDeleteOpen] = React.useState(false);

  const appUrl = typeof window !== "undefined" ? window.location.origin : "";
  const shareLink = `${appUrl}/sign/${invoice.share_token}`;

  async function handleSend() {
    setSending(true);
    const result = await sendInvoiceAction(invoice.id);
    setSending(false);
    if ("error" in result) {
      toast.error(result.error);
      return;
    }

    // La facture est envoyée dans tous les cas ; seul l'email peut manquer,
    // on ouvre alors le partage manuel du lien.
    switch (result.email.status) {
      case "sent":
        toast.success(`Facture envoyée à ${result.email.to}`);
        break;
      case "no_recipient":
        toast.warning("Facture envoyée. Aucun email sur la fiche client : partagez le lien.");
        setShareOpen(true);
        break;
      case "not_configured":
        toast.warning("Facture envoyée. L'envoi automatique d'email n'est pas configuré : partagez le lien.");
        setShareOpen(true);
        break;
      case "failed":
        toast.error(`Facture envoyée, mais l'email n'est pas parti : ${result.email.error}`);
        setShareOpen(true);
        break;
    }
    router.refresh();
  }

  async function handleMarkPaid() {
    setMarking(true);
    const result = await markInvoicePaidAction(invoice.id);
    setMarking(false);
    if (result?.error) {
      toast.error(result.error);
      return;
    }
    toast.success("Facture marquée comme payée");
    router.refresh();
  }

  async function handleCancel() {
    const result = await cancelInvoiceAction(invoice.id);
    if (result?.error) {
      toast.error(result.error);
      return;
    }
    toast.success("Facture annulée");
    setCancelOpen(false);
    router.refresh();
  }

  async function handleDelete() {
    const result = await deleteInvoiceAction(invoice.id);
    if (result?.error) {
      toast.error(result.error);
      return;
    }
    toast.success("Facture supprimée");
    router.push("/dashboard/invoices");
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {invoice.status === "draft" && (
        <Button onClick={handleSend} loading={sending}>
          <Send className="h-4 w-4" /> Envoyer au client
        </Button>
      )}

      {["sent", "viewed", "signed"].includes(invoice.status) && (
        <>
          <Button variant="outline" onClick={() => setShareOpen(true)}>
            <Share2 className="h-4 w-4" /> Lien de signature
          </Button>
          <Button onClick={handleMarkPaid} loading={marking}>
            <CheckCircle2 className="h-4 w-4" /> Marquer payée
          </Button>
        </>
      )}

      <a href={`/api/invoices/${invoice.id}/pdf`} target="_blank" rel="noreferrer">
        <Button variant="outline">
          <Download className="h-4 w-4" /> PDF
        </Button>
      </a>

      {invoice.status === "draft" && (
        <Button variant="ghost" onClick={() => setDeleteOpen(true)}>
          <Trash2 className="h-4 w-4" /> Supprimer
        </Button>
      )}

      {["sent", "viewed"].includes(invoice.status) && (
        <Button variant="ghost" onClick={() => setCancelOpen(true)}>
          <XCircle className="h-4 w-4" /> Annuler
        </Button>
      )}

      <ShareLinkDialog
        open={shareOpen}
        onClose={() => setShareOpen(false)}
        link={shareLink}
        title="Lien de signature de la facture"
        subject={`Facture ${invoice.invoice_number}`}
        recipientEmail={clientEmail}
      />
      <ConfirmDialog
        open={cancelOpen}
        onClose={() => setCancelOpen(false)}
        onConfirm={handleCancel}
        title="Annuler cette facture ?"
        description="Le client ne pourra plus la consulter ni la signer."
        confirmLabel="Annuler la facture"
      />
      <ConfirmDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleDelete}
        title="Supprimer ce brouillon ?"
        description="Cette action est irréversible."
        confirmLabel="Supprimer"
      />
    </div>
  );
}
