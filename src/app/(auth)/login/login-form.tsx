"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { loginAction, type AuthFormState } from "../actions";

const initialState: AuthFormState = {};

export function LoginForm({ next }: { next?: string }) {
  const [state, formAction, pending] = useActionState(loginAction, initialState);

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="next" value={next ?? ""} />
      <div>
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" autoComplete="email" required placeholder="vous@entreprise.fr" />
      </div>
      <div>
        <Label htmlFor="password">Mot de passe</Label>
        <Input id="password" name="password" type="password" autoComplete="current-password" required placeholder="••••••••" />
      </div>

      {state.error && (
        <p className="rounded-lg bg-danger-100 px-3 py-2 text-sm text-danger-600">{state.error}</p>
      )}

      <Button type="submit" className="w-full" loading={pending}>
        Se connecter
      </Button>
    </form>
  );
}
