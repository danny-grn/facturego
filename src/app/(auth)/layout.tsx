import Link from "next/link";
import { Logo } from "@/components/logo";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="hidden flex-col justify-between bg-ink-900 p-12 text-paper lg:flex">
        <Link href="/">
          <Logo mark="light" />
        </Link>
        <div className="max-w-md">
          <p className="font-display text-3xl leading-snug">
            « Vos factures partent signées, pas juste envoyées. »
          </p>
          <p className="mt-4 text-sm text-ink-300">
            Facturation, suivi et signature électronique réunis dans un seul espace, pensé pour
            les indépendants et petites entreprises.
          </p>
        </div>
        <p className="text-xs text-ink-500">© {new Date().getFullYear()} FactureGO</p>
      </div>
      <div className="flex flex-col items-center justify-center p-6 sm:p-12">
        <div className="mb-8 lg:hidden">
          <Link href="/">
            <Logo />
          </Link>
        </div>
        <div className="w-full max-w-sm">{children}</div>
      </div>
    </div>
  );
}
