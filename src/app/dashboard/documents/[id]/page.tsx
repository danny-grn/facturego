import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getDocumentWithFile } from "@/lib/queries";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DocumentStatusBadge } from "@/components/status-badge";
import { ActivityTimeline } from "@/components/activity-timeline";
import { DocumentActions } from "@/components/documents/document-actions";
import { formatDateTime } from "@/lib/format";
import type { DocumentStatus } from "@/lib/database.types";

export default async function DocumentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const result = await getDocumentWithFile(supabase, id);
  if (!result?.document || result.document.user_id !== user.id) notFound();

  const { document, signature, activity } = result;
  const client = document.client ?? null;

  return (
    <div>
      <Link href="/dashboard/documents" className="mb-4 inline-flex items-center gap-1.5 text-sm text-ink-500 hover:text-ink-900">
        <ArrowLeft className="h-3.5 w-3.5" /> Retour aux documents
      </Link>

      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="font-display text-2xl font-medium text-ink-900">{document.title}</h1>
            <DocumentStatusBadge status={document.status as DocumentStatus} />
          </div>
          {client && <p className="mt-1.5 text-sm text-ink-500">Pour {client.name}</p>}
        </div>
        <DocumentActions document={document} clientEmail={client?.email} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="overflow-hidden lg:col-span-2">
          <iframe src={`/api/documents/${document.id}/pdf`} title={document.title} className="h-[640px] w-full" />
        </Card>

        <div className="space-y-6">
          {signature && (
            <Card>
              <CardHeader>
                <CardTitle>Signature électronique</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="rounded-lg border border-line bg-paper-dim/40 p-3">
                  <Image
                    src={signature.signature_data_url}
                    alt={`Signature de ${signature.signer_name}`}
                    width={200}
                    height={90}
                    unoptimized
                    className="h-[70px] w-auto"
                  />
                </div>
                <p className="mt-3 text-sm font-medium text-ink-900">{signature.signer_name}</p>
                {signature.signer_email && <p className="text-sm text-ink-500">{signature.signer_email}</p>}
                <p className="mt-1 text-xs text-ink-500">Signé le {formatDateTime(signature.signed_at)}</p>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Historique</CardTitle>
            </CardHeader>
            <CardContent>
              <ActivityTimeline entries={activity} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
