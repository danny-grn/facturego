import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getClients } from "@/lib/queries";
import { PageHeader } from "@/components/layout/page-header";
import { DocumentUploadForm } from "@/components/documents/document-upload-form";

export const metadata: Metadata = { title: "Nouveau document — FactureGO" };

export default async function NewDocumentPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const clients = await getClients(supabase, user.id);

  return (
    <div>
      <Link href="/dashboard/documents" className="mb-4 inline-flex items-center gap-1.5 text-sm text-ink-500 hover:text-ink-900">
        <ArrowLeft className="h-3.5 w-3.5" /> Retour aux documents
      </Link>
      <PageHeader title="Nouveau document" description="Importez un devis, contrat ou tout autre document PDF à faire signer." />
      <DocumentUploadForm clients={clients} />
    </div>
  );
}
