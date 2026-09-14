import Link from "next/link";
import { FileText, PenLine, LayoutDashboard, Users, ArrowRight, CheckCircle2 } from "lucide-react";
import { Logo } from "@/components/logo";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/cn";

const FEATURES = [
  {
    icon: FileText,
    title: "Facturation professionnelle",
    description:
      "Créez des factures conformes en quelques minutes : numérotation automatique, TVA, échéances et export PDF soigné.",
  },
  {
    icon: PenLine,
    title: "Signature électronique",
    description:
      "Envoyez un lien sécurisé à vos clients pour qu'ils consultent et signent vos factures et documents en ligne, sans compte à créer.",
  },
  {
    icon: LayoutDashboard,
    title: "Suivi en temps réel",
    description:
      "Un tableau de bord clair pour voir d'un coup d'œil ce qui est encaissé, en attente ou en retard, mois après mois.",
  },
  {
    icon: Users,
    title: "Clients & documents centralisés",
    description:
      "Votre carnet de clients, vos devis, contrats et factures rassemblés au même endroit, avec l'historique complet de chaque échange.",
  },
];

const STEPS = [
  {
    n: "01",
    title: "Créez votre facture",
    description: "Renseignez vos prestations, FactureGO calcule automatiquement les totaux et la TVA.",
  },
  {
    n: "02",
    title: "Envoyez le lien de signature",
    description: "Votre client reçoit un lien unique pour consulter et signer le document en un instant.",
  },
  {
    n: "03",
    title: "Suivez le statut en temps réel",
    description: "Consultée, signée, payée : chaque étape est journalisée et visible dans votre tableau de bord.",
  },
];

export default function LandingPage() {
  return (
    <div className="flex-1 bg-paper">
      <header className="sticky top-0 z-20 border-b border-line bg-paper/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Logo />
          <nav className="hidden items-center gap-8 text-sm font-medium text-ink-700 md:flex">
            <a href="#fonctionnalites" className="hover:text-ink-900">
              Fonctionnalités
            </a>
            <a href="#comment-ca-marche" className="hover:text-ink-900">
              Comment ça marche
            </a>
          </nav>
          <div className="flex items-center gap-3">
            <Link href="/login" className={buttonVariants({ variant: "ghost", size: "sm" })}>
              Connexion
            </Link>
            <Link href="/signup" className={buttonVariants({ variant: "primary", size: "sm" })}>
              Créer un compte
            </Link>
          </div>
        </div>
      </header>

      <main>
        {/* Hero */}
        <section className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-12 px-6 py-20 lg:grid-cols-2 lg:py-28">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-accent-600">
              Facturation & signature électronique
            </p>
            <h1 className="mt-4 font-display text-4xl font-medium leading-tight text-ink-900 sm:text-5xl">
              Vos factures partent signées, <br className="hidden sm:block" />
              pas juste envoyées.
            </h1>
            <p className="mt-5 max-w-md text-base leading-relaxed text-ink-700">
              FactureGO réunit la facturation, la signature électronique de vos documents et le suivi de
              votre activité dans un seul espace, pensé pour les indépendants et petites entreprises.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link href="/signup" className={buttonVariants({ variant: "primary", size: "lg" })}>
                Créer mon compte <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/login" className={buttonVariants({ variant: "outline", size: "lg" })}>
                Se connecter
              </Link>
            </div>
            <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-ink-500">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-success-600" /> Sans engagement
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-success-600" /> Vos données restent chez vous
              </span>
            </div>
          </div>

          <InvoiceMockup />
        </section>

        {/* Fonctionnalités */}
        <section id="fonctionnalites" className="border-t border-line bg-paper-dim/50 py-20">
          <div className="mx-auto max-w-6xl px-6">
            <h2 className="font-display text-2xl font-medium text-ink-900 sm:text-3xl">
              Tout ce qu&apos;il faut pour facturer sereinement
            </h2>
            <p className="mt-3 max-w-xl text-sm text-ink-600">
              De la création du document à l&apos;encaissement, chaque étape est suivie et documentée.
            </p>

            <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {FEATURES.map((f) => (
                <div key={f.title} className="rounded-xl border border-line bg-surface p-5">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent-100 text-accent-600">
                    <f.icon className="h-5 w-5" />
                  </div>
                  <h3 className="mt-4 font-medium text-ink-900">{f.title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-ink-600">{f.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Comment ça marche */}
        <section id="comment-ca-marche" className="py-20">
          <div className="mx-auto max-w-6xl px-6">
            <h2 className="font-display text-2xl font-medium text-ink-900 sm:text-3xl">Comment ça marche</h2>
            <div className="mt-10 grid grid-cols-1 gap-8 md:grid-cols-3">
              {STEPS.map((s, i) => (
                <div key={s.n} className="relative">
                  <span className="font-display text-4xl text-accent-100">{s.n}</span>
                  <h3 className="mt-2 font-medium text-ink-900">{s.title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-ink-600">{s.description}</p>
                  {i < STEPS.length - 1 && (
                    <ArrowRight className="absolute -right-6 top-3 hidden h-4 w-4 text-ink-200 md:block" />
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA final */}
        <section className="border-t border-line bg-ink-900 py-16">
          <div className="mx-auto flex max-w-6xl flex-col items-center gap-6 px-6 text-center">
            <h2 className="font-display text-2xl font-medium text-paper sm:text-3xl">
              Prêt à envoyer votre prochaine facture ?
            </h2>
            <p className="max-w-md text-sm text-ink-300">
              Créez votre compte gratuitement et commencez à facturer en quelques minutes.
            </p>
            <Link href="/signup" className={cn(buttonVariants({ variant: "primary", size: "lg" }))}>
              Créer mon compte <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-line py-10">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 sm:flex-row">
          <Logo />
          <div className="flex items-center gap-6 text-sm text-ink-500">
            <Link href="/login" className="hover:text-ink-900">
              Connexion
            </Link>
            <Link href="/signup" className="hover:text-ink-900">
              Créer un compte
            </Link>
          </div>
          <p className="text-xs text-ink-400">© {new Date().getFullYear()} FactureGO</p>
        </div>
      </footer>
    </div>
  );
}

function InvoiceMockup() {
  return (
    <div className="relative mx-auto w-full max-w-sm">
      <div className="absolute -right-4 -top-4 h-full w-full rounded-2xl border border-line bg-paper-dim" />
      <div className="relative rounded-2xl border border-line bg-surface p-6 shadow-[var(--shadow-pop)]">
        <div className="flex items-center justify-between border-b border-line pb-4">
          <div>
            <p className="text-xs text-ink-500">Facture</p>
            <p className="font-display text-lg text-ink-900">FAC-2026-0032</p>
          </div>
          <span className="rounded-full bg-success-100 px-2.5 py-1 text-xs font-medium text-success-600">
            Signée
          </span>
        </div>
        <div className="mt-4 space-y-2.5">
          {[
            ["Développement site vitrine", "1 400,00 €"],
            ["Maintenance mensuelle", "120,00 €"],
            ["Hébergement", "60,00 €"],
          ].map(([label, amount]) => (
            <div key={label} className="flex items-center justify-between text-sm">
              <span className="text-ink-600">{label}</span>
              <span className="font-medium text-ink-900">{amount}</span>
            </div>
          ))}
        </div>
        <div className="mt-4 flex items-center justify-between border-t border-line pt-4">
          <span className="text-sm font-medium text-ink-900">Total TTC</span>
          <span className="font-display text-lg text-accent-600">1 892,00 €</span>
        </div>
        <div className="mt-5 rounded-lg bg-paper-dim/70 p-3">
          <svg viewBox="0 0 160 48" className="h-10 w-32" aria-hidden>
            <path
              d="M6 34C16 12 24 12 32 26C40 40 46 18 56 22C66 26 70 40 82 30C94 20 100 14 112 24C124 34 130 20 140 26"
              fill="none"
              stroke="#6e2430"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <p className="mt-1 text-[11px] text-ink-500">Signé électroniquement · 14 août 2026</p>
        </div>
      </div>
    </div>
  );
}
