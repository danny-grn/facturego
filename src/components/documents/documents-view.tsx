"use client";

import * as React from "react";
import Link from "next/link";
import { Plus, Search, FileSignature } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table";
import { EmptyState } from "@/components/ui/empty-state";
import { DocumentStatusBadge } from "@/components/status-badge";
import { formatDateShort } from "@/lib/format";
import type { AppDocument, DocumentStatus } from "@/lib/database.types";

type DocumentRow = AppDocument & { client: { id: string; name: string } | null };

export function DocumentsView({ documents }: { documents: DocumentRow[] }) {
  const [query, setQuery] = React.useState("");

  const filtered = documents.filter((d) =>
    `${d.title} ${d.client?.name ?? ""}`.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div>
      <PageHeader
        title="Documents à signer"
        description="Devis, contrats et autres documents PDF à faire signer électroniquement."
        actions={
          <Link href="/dashboard/documents/new">
            <Button>
              <Plus className="h-4 w-4" /> Nouveau document
            </Button>
          </Link>
        }
      />

      {documents.length === 0 ? (
        <EmptyState
          icon={<FileSignature className="h-5 w-5" />}
          title="Aucun document pour l'instant"
          description="Importez un devis ou un contrat au format PDF pour le faire signer en ligne."
          action={
            <Link href="/dashboard/documents/new">
              <Button>
                <Plus className="h-4 w-4" /> Importer un document
              </Button>
            </Link>
          }
        />
      ) : (
        <>
          <div className="mb-4 max-w-sm">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-300" />
              <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Rechercher…" className="pl-9" />
            </div>
          </div>

          <Table>
            <THead>
              <tr>
                <TH>Document</TH>
                <TH>Client</TH>
                <TH>Créé le</TH>
                <TH>Statut</TH>
              </tr>
            </THead>
            <TBody>
              {filtered.map((doc) => (
                <TR key={doc.id} href={`/dashboard/documents/${doc.id}`}>
                  <TD>
                    <Link href={`/dashboard/documents/${doc.id}`} className="font-medium text-ink-900 hover:text-accent-600">
                      {doc.title}
                    </Link>
                  </TD>
                  <TD>{doc.client?.name ?? "—"}</TD>
                  <TD>{formatDateShort(doc.created_at)}</TD>
                  <TD>
                    <DocumentStatusBadge status={doc.status as DocumentStatus} />
                  </TD>
                </TR>
              ))}
            </TBody>
          </Table>
        </>
      )}
    </div>
  );
}
