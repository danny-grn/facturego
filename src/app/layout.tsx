import type { Metadata } from "next";
import { Fraunces, Manrope } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";

const fraunces = Fraunces({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

const manrope = Manrope({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "FactureGO — Facturation et signature électronique",
  description:
    "FactureGO centralise vos factures, devis et documents à signer électroniquement, avec un suivi complet en temps réel.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={`${fraunces.variable} ${manrope.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-paper text-ink-900 font-sans">
        {children}
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: "var(--color-ink-900)",
              color: "var(--color-paper)",
              border: "1px solid var(--color-ink-700)",
              borderRadius: "10px",
              fontFamily: "var(--font-sans)",
            },
          }}
        />
      </body>
    </html>
  );
}
