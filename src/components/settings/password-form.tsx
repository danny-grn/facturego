"use client";

import * as React from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input, Label, FieldError } from "@/components/ui/input";
import { changePasswordAction } from "@/app/dashboard/settings/actions";

export function PasswordForm() {
  const [password, setPassword] = React.useState("");
  const [confirm, setConfirm] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [submitting, setSubmitting] = React.useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password.length < 8) return setError("8 caractères minimum.");
    if (password !== confirm) return setError("Les mots de passe ne correspondent pas.");

    setSubmitting(true);
    const result = await changePasswordAction(password);
    setSubmitting(false);

    if (result?.error) {
      toast.error(result.error);
      setError(result.error);
      return;
    }
    toast.success("Mot de passe mis à jour");
    setPassword("");
    setConfirm("");
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="new_password">Nouveau mot de passe</Label>
          <Input
            id="new_password"
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
          />
        </div>
        <div>
          <Label htmlFor="confirm_password">Confirmer le mot de passe</Label>
          <Input
            id="confirm_password"
            type="password"
            autoComplete="new-password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder="••••••••"
          />
        </div>
      </div>
      <FieldError>{error}</FieldError>
      <Button type="submit" loading={submitting}>
        Mettre à jour le mot de passe
      </Button>
    </form>
  );
}
