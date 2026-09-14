import Link from "next/link";
import type { Metadata } from "next";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Connexion — FactureGO" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;

  return (
    <div>
      <h1 className="font-display text-2xl font-medium text-ink-900">Bon retour parmi nous</h1>
      <p className="mt-2 text-sm text-ink-500">Connectez-vous pour retrouver votre espace.</p>

      <div className="mt-8">
        <LoginForm next={next} />
      </div>

      <p className="mt-6 text-sm text-ink-500">
        Pas encore de compte ?{" "}
        <Link href="/signup" className="font-medium text-accent-600 hover:text-accent-700">
          Créer un compte
        </Link>
      </p>
    </div>
  );
}
