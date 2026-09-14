"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Send, Download, XCircle, Trash2, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { ShareLinkDialog } from "@/components/share-link-dialog";
import { sendDocumentAction, cancelDocumentAction, deleteDocumentAction } from "@/app/dashboard/documents/actions";
import type { AppDocument } from "@/lib/database.types";

export function DocumentActions({ document, clientEmail }: { document: AppDocument; clientEmail?: string | null }) {
  const router = useRouter();
  const [sending, setSending] = React.useState(false);
  const [shareOpen, setShareOpen] = React.useState(false);
  const [cancelOpen, setCancelOpen] = React.useState(false);
  const [deleteOpen, setDeleteOpen] = React.useState(false);

  const appUrl = typeof window !== "undefined" ? window.location.origin : "";
  const shareLink = `${appUrl}/sign/${document.share_token}`;

  async function handleSend() {
    setSending(true);
    const result = await sendDocumentAction(document.id);
    setSending(false);
    if (result?.error) {
      toast.error(result.error);
      return;
    }
    toast.success("Document envoyé");
    setShareOpen(true);
    router.refresh();
  }

  async function handleCancel() {
    const result = await cancelDocumentAction(document.id);
    if (result?.error) {
      toast.error(result.error);
      return;
    }
    toast.success("Document annulé");
    setCancelOpen(false);
    router.refresh();
  }

  async function handleDelete() {
    const result = await deleteDocumentAction(document.id);
    if (result?.error) {
      toast.error(result.error);
      return;
    }
    toast.success("Document supprimé");
    router.push("/dashboard/documents");
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {document.status === "draft" && (
        <Button onClick={handleSend} loading={sending}>
          <Send className="h-4 w-4" /> Envoyer au client
        </Button>
      )}

      {["sent", "viewed"].includes(document.status) && (
        <Button variant="outline" onClick={() => setShareOpen(true)}>
          <Share2 className="h-4 w-4" /> Lien de signature
        </Button>
      )}

      <a href={`/api/documents/${document.id}/pdf`} target="_blank" rel="noreferrer">
        <Button variant="outline">
          <Download className="h-4 w-4" /> PDF
        </Button>
      </a>

      {document.status === "draft" && (
        <Button variant="ghost" onClick={() => setDeleteOpen(true)}>
          <Trash2 className="h-4 w-4" /> Supprimer
        </Button>
      )}

      {["sent", "viewed"].includes(document.status) && (
        <Button variant="ghost" onClick={() => setCancelOpen(true)}>
          <XCircle className="h-4 w-4" /> Annuler
        </Button>
      )}

      <ShareLinkDialog
        open={shareOpen}
        onClose={() => setShareOpen(false)}
        link={shareLink}
        title="Lien de signature du document"
        subject={document.title}
        recipientEmail={clientEmail}
      />
      <ConfirmDialog
        open={cancelOpen}
        onClose={() => setCancelOpen(false)}
        onConfirm={handleCancel}
        title="Annuler ce document ?"
        description="Le client ne pourra plus le consulter ni le signer."
        confirmLabel="Annuler le document"
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
