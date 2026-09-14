"use client";

import * as React from "react";
import Image from "next/image";
import { toast } from "sonner";
import { FileX2, ShieldCheck, Download, Eraser } from "lucide-react";
import { SignaturePad, type SignaturePadHandle } from "@/components/sign/signature-pad";
import { Button } from "@/components/ui/button";
import { Input, Label, FieldError } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table";
import { formatCurrency, formatDate, formatDateTime } from "@/lib/format";
import { submitSignatureAction } from "@/app/sign/actions";
import type { Client, Invoice, InvoiceItem, Profile, Signature } from "@/lib/database.types";

interface DocumentPayload {
  id: string;
  title: string;
  file_name: string;
  status: string;
}

interface SignablePayload {
  kind: "invoice" | "document";
  invoice?: Invoice;
  items?: InvoiceItem[];
  document?: DocumentPayload;
  client?: Client | null;
  profile?: Profile | null;
  signature?: Signature | null;
}

export function SignClient({ token, payload }: { token: string; payload: SignablePayload | null }) {
  const [justSigned, setJustSigned] = React.useState<{ name: string; dataUrl: string; signedAt: string } | null>(
    null
  );

  if (!payload) {
    return (
      <Card className="p-10 text-center">
        <FileX2 className="mx-auto h-8 w-8 text-ink-300" />
        <p className="mt-4 font-display text-lg text-ink-900">Lien introuvable</p>
        <p className="mt-1.5 text-sm text-ink-500">
          Ce lien de signature n&apos;existe pas ou n&apos;est plus valide. Contactez l&apos;émetteur du document.
        </p>
      </Card>
    );
  }

  const status = payload.kind === "invoice" ? payload.invoice?.status : payload.document?.status;
  const pdfUrl = `/api/sign/${token}/pdf`;
  const companyName = payload.profile?.company_name || "Votre partenaire";

  if (status === "cancelled") {
    return (
      <Card className="p-10 text-center">
        <FileX2 className="mx-auto h-8 w-8 text-ink-300" />
        <p className="mt-4 font-display text-lg text-ink-900">Document annulé</p>
        <p className="mt-1.5 text-sm text-ink-500">
          {companyName} a annulé ce document. Il n&apos;est plus disponible à la signature.
        </p>
      </Card>
    );
  }

  const alreadySigned = Boolean(payload.signature) || status === "paid" || justSigned;

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-accent-600">
          {payload.kind === "invoice" ? "Facture" : "Document"} de {companyName}
        </p>
        <h1 className="mt-1 font-display text-2xl font-medium text-ink-900">
          {payload.kind === "invoice" ? payload.invoice?.invoice_number : payload.document?.title}
        </h1>
      </div>

      {payload.kind === "invoice" && payload.invoice ? (
        <InvoicePreview invoice={payload.invoice} items={payload.items ?? []} client={payload.client ?? null} profile={payload.profile ?? null} />
      ) : (
        <Card className="overflow-hidden">
          <iframe src={pdfUrl} title={payload.document?.title} className="h-[560px] w-full" />
        </Card>
      )}

      <div className="flex justify-center">
        <a href={pdfUrl} target="_blank" rel="noreferrer">
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4" /> Télécharger le PDF
          </Button>
        </a>
      </div>

      {alreadySigned ? (
        <SignedConfirmation
          signature={justSigned ? { signer_name: justSigned.name, signature_data_url: justSigned.dataUrl, signed_at: justSigned.signedAt } : payload.signature ?? null}
        />
      ) : (
        <SignatureForm token={token} onSigned={(name, dataUrl) => setJustSigned({ name, dataUrl, signedAt: new Date().toISOString() })} />
      )}
    </div>
  );
}

function InvoicePreview({
  invoice,
  items,
  client,
  profile,
}: {
  invoice: Invoice;
  items: InvoiceItem[];
  client: Client | null;
  profile: Profile | null;
}) {
  return (
    <Card>
      <CardContent className="space-y-6 pt-5">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-ink-500">Émetteur</p>
            <p className="mt-1 font-medium text-ink-900">{profile?.company_name}</p>
            <p className="text-sm text-ink-500">
              {[profile?.address, profile?.postal_code, profile?.city].filter(Boolean).join(", ")}
            </p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-ink-500">Facturé à</p>
            <p className="mt-1 font-medium text-ink-900">{client?.name}</p>
            <p className="text-sm text-ink-500">
              {[client?.address, client?.postal_code, client?.city].filter(Boolean).join(", ")}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-x-8 gap-y-2 text-sm text-ink-500">
          <span>Émise le {formatDate(invoice.issue_date)}</span>
          {invoice.due_date && <span>Échéance le {formatDate(invoice.due_date)}</span>}
        </div>

        <Table>
          <THead>
            <tr>
              <TH>Description</TH>
              <TH className="text-right">Qté</TH>
              <TH className="text-right">Prix unit.</TH>
              <TH className="text-right">Total</TH>
            </tr>
          </THead>
          <TBody>
            {items.map((item) => (
              <TR key={item.id}>
                <TD>{item.description}</TD>
                <TD className="text-right">{item.quantity}</TD>
                <TD className="text-right">{formatCurrency(item.unit_price, invoice.currency)}</TD>
                <TD className="text-right font-medium">{formatCurrency(item.quantity * item.unit_price, invoice.currency)}</TD>
              </TR>
            ))}
          </TBody>
        </Table>

        <div className="ml-auto max-w-xs space-y-1.5 text-sm">
          <div className="flex justify-between">
            <span className="text-ink-500">Sous-total</span>
            <span>{formatCurrency(invoice.subtotal, invoice.currency)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-ink-500">TVA</span>
            <span>{formatCurrency(invoice.tax_total, invoice.currency)}</span>
          </div>
          <div className="flex justify-between border-t border-line pt-1.5 text-base font-medium">
            <span>Total</span>
            <span className="text-accent-600">{formatCurrency(invoice.total, invoice.currency)}</span>
          </div>
        </div>

        {invoice.notes && <p className="rounded-lg bg-paper-dim/60 p-3 text-sm text-ink-700">{invoice.notes}</p>}
      </CardContent>
    </Card>
  );
}

function SignatureForm({ token, onSigned }: { token: string; onSigned: (name: string, dataUrl: string) => void }) {
  const padRef = React.useRef<SignaturePadHandle>(null);
  const [hasSignature, setHasSignature] = React.useState(false);
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [consent, setConsent] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const dataUrl = padRef.current?.toDataURL();
    if (!name.trim()) return setError("Votre nom est requis.");
    if (!dataUrl) return setError("Veuillez apposer votre signature.");
    if (!consent) return setError("Vous devez accepter les conditions de signature.");

    setSubmitting(true);
    const result = await submitSignatureAction(token, {
      signerName: name.trim(),
      signerEmail: email.trim(),
      signatureDataUrl: dataUrl,
      consent: true,
    });
    setSubmitting(false);

    if (result?.error) {
      toast.error(result.error);
      setError(result.error);
      return;
    }

    toast.success("Document signé avec succès");
    onSigned(name.trim(), dataUrl);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Signer ce document</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="signer_name">Nom complet</Label>
              <Input id="signer_name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Jeanne Dupont" required />
            </div>
            <div>
              <Label htmlFor="signer_email">Email (optionnel)</Label>
              <Input
                id="signer_email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="jeanne@exemple.fr"
              />
            </div>
          </div>

          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <Label className="mb-0">Votre signature</Label>
              <button
                type="button"
                onClick={() => {
                  padRef.current?.clear();
                  setHasSignature(false);
                }}
                className="flex items-center gap-1 text-xs text-ink-500 hover:text-ink-900"
              >
                <Eraser className="h-3 w-3" /> Effacer
              </button>
            </div>
            <SignaturePad ref={padRef} onChange={setHasSignature} />
          </div>

          <label className="flex items-start gap-2.5 text-sm text-ink-600">
            <input
              type="checkbox"
              checked={consent}
              onChange={(e) => setConsent(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-line-strong text-accent-600 focus:ring-accent-500"
            />
            <span>
              Je reconnais que cette signature électronique a la même valeur qu&apos;une signature manuscrite et
              qu&apos;elle m&apos;engage sur le contenu de ce document.
            </span>
          </label>

          <FieldError>{error}</FieldError>

          <Button type="submit" className="w-full" loading={submitting} disabled={!hasSignature}>
            <ShieldCheck className="h-4 w-4" /> Signer le document
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

function SignedConfirmation({
  signature,
}: {
  signature: { signer_name: string; signature_data_url: string; signed_at: string } | null;
}) {
  return (
    <Card className="border-success-100 bg-success-100/30 p-6 text-center">
      <ShieldCheck className="mx-auto h-8 w-8 text-success-600" />
      <p className="mt-3 font-display text-lg text-ink-900">Document signé</p>
      {signature && (
        <>
          <div className="mx-auto mt-4 w-fit rounded-lg border border-line bg-surface p-3">
            <Image
              src={signature.signature_data_url}
              alt={`Signature de ${signature.signer_name}`}
              width={200}
              height={90}
              unoptimized
              className="h-[70px] w-auto"
            />
          </div>
          <p className="mt-3 text-sm text-ink-700">
            Signé par <span className="font-medium">{signature.signer_name}</span> le{" "}
            {formatDateTime(signature.signed_at)}
          </p>
        </>
      )}
    </Card>
  );
}
