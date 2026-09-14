"use client";

import * as React from "react";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Plus, Trash2, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Textarea, Select, Label, FieldError } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ClientFormDialog } from "@/components/clients/client-form-dialog";
import { invoiceSchema, type InvoiceInput } from "@/lib/validation";
import { computeInvoiceTotals, computeLineTotal } from "@/lib/invoice-utils";
import { formatCurrency } from "@/lib/format";
import { createInvoiceAction, updateInvoiceAction } from "@/app/dashboard/invoices/actions";
import type { Client, Invoice, InvoiceItem, Profile } from "@/lib/database.types";

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function addDaysISO(days: number) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export function InvoiceForm({
  clients,
  profile,
  invoice,
  items,
}: {
  clients: Client[];
  profile: Profile | null;
  invoice?: Invoice;
  items?: InvoiceItem[];
}) {
  const isEdit = Boolean(invoice);
  const [clientList, setClientList] = React.useState(clients);
  const [clientDialogOpen, setClientDialogOpen] = React.useState(false);

  const defaultTaxRate = profile?.default_tax_rate ?? 20;

  const {
    register,
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<InvoiceInput>({
    resolver: zodResolver(invoiceSchema),
    defaultValues: invoice
      ? {
          client_id: invoice.client_id ?? "",
          issue_date: invoice.issue_date,
          due_date: invoice.due_date ?? "",
          currency: invoice.currency,
          notes: invoice.notes ?? "",
          payment_terms: invoice.payment_terms ?? "",
          items: (items ?? []).map((i) => ({
            description: i.description,
            quantity: i.quantity,
            unit_price: i.unit_price,
            tax_rate: i.tax_rate,
          })),
        }
      : {
          client_id: "",
          issue_date: todayISO(),
          due_date: addDaysISO(profile?.default_payment_terms ?? 30),
          currency: "EUR",
          notes: "",
          payment_terms: profile?.default_payment_terms
            ? `Paiement à ${profile.default_payment_terms} jours`
            : "Paiement à 30 jours",
          items: [{ description: "", quantity: 1, unit_price: 0, tax_rate: defaultTaxRate }],
        },
  });

  const { fields, append, remove } = useFieldArray({ control, name: "items" });
  const watchedItems = watch("items");
  const totals = computeInvoiceTotals(
    (watchedItems ?? []).map((i) => ({
      quantity: Number(i.quantity) || 0,
      unit_price: Number(i.unit_price) || 0,
      tax_rate: Number(i.tax_rate) || 0,
    }))
  );

  async function onSubmit(values: InvoiceInput) {
    const result = isEdit ? await updateInvoiceAction(invoice!.id, values) : await createInvoiceAction(values);
    if (result?.error) toast.error(result.error);
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Informations générales</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Label htmlFor="client_id">Client</Label>
              <div className="flex gap-2">
                <Controller
                  control={control}
                  name="client_id"
                  render={({ field }) => (
                    <Select id="client_id" {...field}>
                      <option value="">Sélectionner un client</option>
                      {clientList.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </Select>
                  )}
                />
                <Button type="button" variant="outline" onClick={() => setClientDialogOpen(true)}>
                  <UserPlus className="h-4 w-4" />
                </Button>
              </div>
              <FieldError>{errors.client_id?.message}</FieldError>
            </div>

            <div>
              <Label htmlFor="issue_date">Date d&apos;émission</Label>
              <Input id="issue_date" type="date" {...register("issue_date")} />
              <FieldError>{errors.issue_date?.message}</FieldError>
            </div>
            <div>
              <Label htmlFor="due_date">Date d&apos;échéance</Label>
              <Input id="due_date" type="date" {...register("due_date")} />
            </div>
            <div>
              <Label htmlFor="payment_terms">Conditions de paiement</Label>
              <Input id="payment_terms" {...register("payment_terms")} placeholder="Paiement à 30 jours" />
            </div>
            <div>
              <Label htmlFor="currency">Devise</Label>
              <Select id="currency" {...register("currency")}>
                <option value="EUR">EUR — Euro</option>
                <option value="USD">USD — Dollar</option>
                <option value="CHF">CHF — Franc suisse</option>
                <option value="GBP">GBP — Livre sterling</option>
              </Select>
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor="notes">Notes (visibles par le client)</Label>
              <Textarea id="notes" {...register("notes")} placeholder="Merci pour votre confiance." />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Récapitulatif</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-ink-500">Sous-total</span>
              <span className="font-medium text-ink-900">{formatCurrency(totals.subtotal, watch("currency"))}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-ink-500">TVA</span>
              <span className="font-medium text-ink-900">{formatCurrency(totals.taxTotal, watch("currency"))}</span>
            </div>
            <div className="flex justify-between border-t border-line pt-3 text-base">
              <span className="font-medium text-ink-900">Total</span>
              <span className="font-display font-medium text-accent-600">
                {formatCurrency(totals.total, watch("currency"))}
              </span>
            </div>
          </CardContent>
          <div className="flex flex-col gap-2 border-t border-line p-5">
            <Button type="submit" loading={isSubmitting}>
              {isEdit ? "Enregistrer les modifications" : "Créer la facture"}
            </Button>
            <p className="text-center text-xs text-ink-500">
              La facture sera enregistrée en brouillon. Vous pourrez l&apos;envoyer ensuite.
            </p>
          </div>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Prestations</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <FieldError>{errors.items?.message}</FieldError>

          <div className="hidden gap-3 px-1 text-xs font-semibold uppercase tracking-wide text-ink-500 sm:grid sm:grid-cols-[1fr_90px_120px_90px_110px_36px]">
            <span>Description</span>
            <span>Qté</span>
            <span>Prix unitaire</span>
            <span>TVA %</span>
            <span className="text-right">Total</span>
            <span />
          </div>

          {fields.map((field, index) => {
            const item = watchedItems?.[index];
            const lineTotal = item
              ? computeLineTotal({
                  quantity: Number(item.quantity) || 0,
                  unit_price: Number(item.unit_price) || 0,
                  tax_rate: Number(item.tax_rate) || 0,
                })
              : 0;
            return (
              <div
                key={field.id}
                className="grid grid-cols-2 gap-3 rounded-lg border border-line p-3 sm:grid-cols-[1fr_90px_120px_90px_110px_36px] sm:items-center sm:border-0 sm:p-0"
              >
                <div className="col-span-2 sm:col-span-1">
                  <Input placeholder="Développement site vitrine" {...register(`items.${index}.description` as const)} />
                  <FieldError>{errors.items?.[index]?.description?.message}</FieldError>
                </div>
                <Input
                  type="number"
                  step="1"
                  min="0"
                  {...register(`items.${index}.quantity` as const, { valueAsNumber: true })}
                />
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  {...register(`items.${index}.unit_price` as const, { valueAsNumber: true })}
                />
                <Input
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  {...register(`items.${index}.tax_rate` as const, { valueAsNumber: true })}
                />
                <div className="flex items-center justify-end text-sm font-medium text-ink-900">
                  {formatCurrency(lineTotal, watch("currency"))}
                </div>
                <button
                  type="button"
                  onClick={() => fields.length > 1 && remove(index)}
                  className="justify-self-end rounded-md p-2 text-ink-400 hover:bg-danger-100 hover:text-danger-600 disabled:opacity-30 sm:justify-self-center"
                  disabled={fields.length === 1}
                  aria-label="Supprimer la ligne"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            );
          })}

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => append({ description: "", quantity: 1, unit_price: 0, tax_rate: defaultTaxRate })}
          >
            <Plus className="h-4 w-4" /> Ajouter une ligne
          </Button>
        </CardContent>
      </Card>

      <ClientFormDialog
        open={clientDialogOpen}
        onClose={() => setClientDialogOpen(false)}
        onCreated={(client) => {
          setClientList((prev) => [...prev, client].sort((a, b) => a.name.localeCompare(b.name)));
          setValue("client_id", client.id, { shouldValidate: true });
        }}
      />
    </form>
  );
}
