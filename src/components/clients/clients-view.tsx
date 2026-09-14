"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, Search, Pencil, Trash2, Mail, Phone, Users } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table";
import { EmptyState } from "@/components/ui/empty-state";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { ClientFormDialog } from "@/components/clients/client-form-dialog";
import { deleteClientAction } from "@/app/dashboard/clients/actions";
import type { Client } from "@/lib/database.types";

export function ClientsView({ clients }: { clients: Client[] }) {
  const router = useRouter();
  const [query, setQuery] = React.useState("");
  const [formOpen, setFormOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<Client | null>(null);
  const [deleting, setDeleting] = React.useState<Client | null>(null);

  const filtered = clients.filter((c) =>
    `${c.name} ${c.email ?? ""} ${c.city ?? ""}`.toLowerCase().includes(query.toLowerCase())
  );

  function openCreate() {
    setEditing(null);
    setFormOpen(true);
  }

  function openEdit(client: Client) {
    setEditing(client);
    setFormOpen(true);
  }

  async function handleDelete() {
    if (!deleting) return;
    const result = await deleteClientAction(deleting.id);
    if (result?.error) {
      toast.error(result.error);
      return;
    }
    toast.success("Client supprimé");
    setDeleting(null);
    router.refresh();
  }

  return (
    <div>
      <PageHeader
        title="Clients"
        description="Votre carnet de clients, réutilisé pour vos factures et documents."
        actions={
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4" /> Nouveau client
          </Button>
        }
      />

      {clients.length === 0 ? (
        <EmptyState
          icon={<Users className="h-5 w-5" />}
          title="Aucun client enregistré"
          description="Ajoutez votre premier client pour pouvoir créer des factures."
          action={
            <Button onClick={openCreate}>
              <Plus className="h-4 w-4" /> Ajouter un client
            </Button>
          }
        />
      ) : (
        <>
          <div className="mb-4 max-w-sm">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-300" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Rechercher un client…"
                className="pl-9"
              />
            </div>
          </div>

          <Table>
            <THead>
              <tr>
                <TH>Client</TH>
                <TH>Contact</TH>
                <TH>Ville</TH>
                <TH className="text-right">Actions</TH>
              </tr>
            </THead>
            <TBody>
              {filtered.map((client) => (
                <TR key={client.id}>
                  <TD>
                    <p className="font-medium text-ink-900">{client.name}</p>
                    {client.siret && <p className="text-xs text-ink-500">SIRET {client.siret}</p>}
                  </TD>
                  <TD>
                    <div className="space-y-0.5 text-xs text-ink-500">
                      {client.email && (
                        <p className="flex items-center gap-1.5">
                          <Mail className="h-3 w-3" /> {client.email}
                        </p>
                      )}
                      {client.phone && (
                        <p className="flex items-center gap-1.5">
                          <Phone className="h-3 w-3" /> {client.phone}
                        </p>
                      )}
                    </div>
                  </TD>
                  <TD>{client.city ?? "—"}</TD>
                  <TD>
                    <div className="flex justify-end gap-1">
                      <button
                        onClick={() => openEdit(client)}
                        className="rounded-md p-2 text-ink-500 hover:bg-ink-100 hover:text-ink-900"
                        aria-label="Modifier"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => setDeleting(client)}
                        className="rounded-md p-2 text-ink-500 hover:bg-danger-100 hover:text-danger-600"
                        aria-label="Supprimer"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </TD>
                </TR>
              ))}
            </TBody>
          </Table>
        </>
      )}

      <ClientFormDialog open={formOpen} onClose={() => setFormOpen(false)} client={editing} />
      <ConfirmDialog
        open={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        onConfirm={handleDelete}
        title="Supprimer ce client ?"
        description={`« ${deleting?.name} » sera définitivement supprimé. Les factures déjà émises pour ce client seront conservées.`}
        confirmLabel="Supprimer"
      />
    </div>
  );
}
