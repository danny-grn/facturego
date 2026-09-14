import Link from "next/link";
import type { Metadata } from "next";
import { SignupForm } from "./signup-form";

export const metadata: Metadata = { title: "Créer un compte — FactureGO" };

export default function SignupPage() {
  return (
    <div>
      <h1 className="font-display text-2xl font-medium text-ink-900">Créez votre espace</h1>
      <p className="mt-2 text-sm text-ink-500">
        Commencez à facturer et faire signer vos documents en quelques minutes.
      </p>

      <div className="mt-8">
        <SignupForm />
      </div>

      <p className="mt-6 text-sm text-ink-500">
        Déjà un compte ?{" "}
        <Link href="/login" className="font-medium text-accent-600 hover:text-accent-700">
          Se connecter
        </Link>
      </p>
    </div>
  );
}
