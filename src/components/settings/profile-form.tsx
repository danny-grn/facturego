"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input, Label, FieldError, FieldHint } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LogoUploader } from "@/components/settings/logo-uploader";
import { profileSchema, type ProfileInput } from "@/lib/validation";
import { updateProfileAction } from "@/app/dashboard/settings/actions";
import type { Profile } from "@/lib/database.types";

export function ProfileForm({ profile }: { profile: Profile | null }) {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ProfileInput>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      company_name: profile?.company_name ?? "",
      legal_form: profile?.legal_form ?? "",
      siret: profile?.siret ?? "",
      vat_number: profile?.vat_number ?? "",
      address: profile?.address ?? "",
      postal_code: profile?.postal_code ?? "",
      city: profile?.city ?? "",
      country: profile?.country ?? "France",
      phone: profile?.phone ?? "",
      email: profile?.email ?? "",
      iban: profile?.iban ?? "",
      bic: profile?.bic ?? "",
      invoice_prefix: profile?.invoice_prefix ?? "FAC",
      default_tax_rate: profile?.default_tax_rate ?? 20,
      default_payment_terms: profile?.default_payment_terms ?? 30,
    },
  });

  async function onSubmit(values: ProfileInput) {
    const result = await updateProfileAction(values);
    if (result?.error) {
      toast.error(result.error);
      return;
    }
    toast.success("Informations enregistrées");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Entreprise</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div>
            <Label>Logo</Label>
            <LogoUploader initialLogo={profile?.logo_data_url ?? null} />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="company_name">Nom de l&apos;entreprise</Label>
              <Input id="company_name" {...register("company_name")} placeholder="Atelier Dupont" />
              <FieldError>{errors.company_name?.message}</FieldError>
            </div>
            <div>
              <Label htmlFor="legal_form">Forme juridique</Label>
              <Input id="legal_form" {...register("legal_form")} placeholder="Auto-entrepreneur, SASU…" />
            </div>
            <div>
              <Label htmlFor="siret">SIRET</Label>
              <Input id="siret" {...register("siret")} placeholder="123 456 789 00012" />
            </div>
            <div>
              <Label htmlFor="vat_number">N° TVA intracommunautaire</Label>
              <Input id="vat_number" {...register("vat_number")} placeholder="FR12345678900" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Adresse</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
            <Label htmlFor="country">Pays</Label>
            <Input id="country" {...register("country")} placeholder="France" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Contact</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="phone">Téléphone</Label>
            <Input id="phone" {...register("phone")} placeholder="06 12 34 56 78" />
          </div>
          <div>
            <Label htmlFor="email">Email affiché sur les factures</Label>
            <Input id="email" type="email" {...register("email")} placeholder="contact@entreprise.fr" />
            <FieldError>{errors.email?.message}</FieldError>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Facturation</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <Label htmlFor="invoice_prefix">Préfixe des factures</Label>
            <Input id="invoice_prefix" {...register("invoice_prefix")} placeholder="FAC" />
            <FieldHint>Ex. FAC-2026-0001</FieldHint>
          </div>
          <div>
            <Label htmlFor="default_tax_rate">TVA par défaut (%)</Label>
            <Input
              id="default_tax_rate"
              type="number"
              step="0.1"
              min="0"
              max="100"
              {...register("default_tax_rate", { valueAsNumber: true })}
            />
          </div>
          <div>
            <Label htmlFor="default_payment_terms">Délai de paiement par défaut (jours)</Label>
            <Input
              id="default_payment_terms"
              type="number"
              min="0"
              max="365"
              {...register("default_payment_terms", { valueAsNumber: true })}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Coordonnées bancaires</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="iban">IBAN</Label>
            <Input id="iban" {...register("iban")} placeholder="FR76 3000 6000 0112 3456 7890 189" />
          </div>
          <div>
            <Label htmlFor="bic">BIC</Label>
            <Input id="bic" {...register("bic")} placeholder="BNPAFRPPXXX" />
          </div>
        </CardContent>
      </Card>

      <Button type="submit" loading={isSubmitting}>
        Enregistrer les modifications
      </Button>
    </form>
  );
}
