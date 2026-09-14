"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input, Label, FieldHint } from "@/components/ui/input";
import { signupAction, type AuthFormState } from "../actions";

const initialState: AuthFormState = {};

export function SignupForm() {
  const [state, formAction, pending] = useActionState(signupAction, initialState);

  if (state.success) {
    return (
      <div className="rounded-lg bg-success-100 px-4 py-3 text-sm text-success-600">
        {state.message}
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <Label htmlFor="companyName">Nom de l&apos;entreprise</Label>
        <Input id="companyName" name="companyName" required placeholder="Atelier Dupont" />
      </div>
      <div>
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" autoComplete="email" required placeholder="vous@entreprise.fr" />
      </div>
      <div>
        <Label htmlFor="password">Mot de passe</Label>
        <Input id="password" name="password" type="password" autoComplete="new-password" required placeholder="••••••••" />
        <FieldHint>8 caractères minimum.</FieldHint>
      </div>

      {state.error && (
        <p className="rounded-lg bg-danger-100 px-3 py-2 text-sm text-danger-600">{state.error}</p>
      )}

      <Button type="submit" className="w-full" loading={pending}>
        Créer mon compte
      </Button>

      <p className="text-xs text-ink-500">
        En créant un compte, vous acceptez que vos données soient utilisées pour générer vos
        factures et documents.
      </p>
    </form>
  );
}
