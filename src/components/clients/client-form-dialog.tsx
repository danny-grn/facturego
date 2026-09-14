"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input, Textarea, Label, FieldError } from "@/components/ui/input";
import { clientSchema, type ClientInput } from "@/lib/validation";
import { createClientAction, updateClientAction } from "@/app/dashboard/clients/actions";
import type { Client } from "@/lib/database.types";

export function ClientFormDialog({
  open,
  onClose,
  client,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  client?: Client | null;
  onCreated?: (client: Client) => void;
}) {
  const router = useRouter();
  const isEdit = Boolean(client);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ClientInput>({
    resolver: zodResolver(clientSchema),
    defaultValues: emptyValues(client),
  });

  React.useEffect(() => {
    if (open) reset(emptyValues(client));
  }, [open, client, reset]);

  async function onSubmit(values: ClientInput) {
    const result = isEdit ? await updateClientAction(client!.id, values) : await createClientAction(values);
    if (result?.error) {
      toast.error(result.error);
      return;
    }
    toast.success(isEdit ? "Client mis à jour" : "Client créé");
    if (!isEdit && "client" in result && result.client) {
      onCreated?.(result.client as Client);
    }
    router.refresh();
    onClose();
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={isEdit ? "Modifier le client" : "Nouveau client"}
      description="Ces informations apparaîtront sur vos factures et documents."
      className="max-w-2xl"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Label htmlFor="name">Nom / raison sociale</Label>
            <Input id="name" {...register("name")} placeholder="Studio Martin" />
            <FieldError>{errors.name?.message}</FieldError>
          </div>
          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" {...register("email")} placeholder="contact@client.fr" />
            <FieldError>{errors.email?.message}</FieldError>
          </div>
          <div>
            <Label htmlFor="phone">Téléphone</Label>
            <Input id="phone" {...register("phone")} placeholder="06 12 34 56 78" />
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="address">Adresse</Label>
            <Input id="address" {...register("address")} placeholder="12 rue des Lilas" />
          </div>
          <div>
            <Label htmlFor="postal_code">Code postal</Label>
            <Input id="postal_code" {...register("postal_code")} placeholder="75011" />
          </div>
          <div>
            <Label htmlFor="city">Ville</Label>
            <Input id="city" {...register("city")} placeholder="Paris" />
          </div>
          <div>
            <Label htmlFor="siret">SIRET</Label>
            <Input id="siret" {...register("siret")} placeholder="123 456 789 00012" />
          </div>
          <div>
            <Label htmlFor="vat_number">N° TVA</Label>
            <Input id="vat_number" {...register("vat_number")} placeholder="FR12345678900" />
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="notes">Notes internes</Label>
            <Textarea id="notes" {...register("notes")} placeholder="Informations complémentaires…" />
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            Annuler
          </Button>
          <Button type="submit" loading={isSubmitting}>
            {isEdit ? "Enregistrer" : "Créer le client"}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}

function emptyValues(client?: Client | null): ClientInput {
  return {
    name: client?.name ?? "",
    email: client?.email ?? "",
    phone: client?.phone ?? "",
    address: client?.address ?? "",
    postal_code: client?.postal_code ?? "",
    city: client?.city ?? "",
    country: client?.country ?? "France",
    siret: client?.siret ?? "",
    vat_number: client?.vat_number ?? "",
    notes: client?.notes ?? "",
  };
}
