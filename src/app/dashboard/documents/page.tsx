import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { getDocuments } from "@/lib/queries";
import { DocumentsView } from "@/components/documents/documents-view";

export const metadata: Metadata = { title: "Documents — FactureGO" };

export default async function DocumentsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const documents = await getDocuments(supabase, user.id);

  return <DocumentsView documents={documents as unknown as Parameters<typeof DocumentsView>[0]["documents"]} />;
}
