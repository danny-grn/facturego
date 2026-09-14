"use client";

import * as React from "react";
import Link from "next/link";
import { Menu, Plus, LogOut, ChevronDown } from "lucide-react";
import { Sidebar } from "./sidebar";
import { signOutAction } from "@/app/(auth)/actions";
import { initials } from "@/lib/format";

export function DashboardShell({
  companyName,
  email,
  children,
}: {
  companyName: string;
  email: string;
  children: React.ReactNode;
}) {
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [menuOpen, setMenuOpen] = React.useState(false);
  const menuRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    function onClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const displayName = companyName || email;

  return (
    <div className="flex min-h-screen bg-paper">
      <aside className="hidden w-64 shrink-0 lg:block">
        <div className="fixed h-screen w-64">
          <Sidebar />
        </div>
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-ink-900/50" onClick={() => setMobileOpen(false)} />
          <div className="absolute inset-y-0 left-0 w-64">
            <Sidebar onNavigate={() => setMobileOpen(false)} />
          </div>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-line bg-paper/90 px-4 backdrop-blur sm:px-6">
          <button
            type="button"
            className="rounded-md p-2 text-ink-700 hover:bg-ink-100 lg:hidden"
            onClick={() => setMobileOpen(true)}
            aria-label="Ouvrir le menu"
          >
            <Menu className="h-5 w-5" />
          </button>

          <div className="hidden lg:block" />

          <div className="flex items-center gap-3">
            <Link
              href="/dashboard/invoices/new"
              className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-accent-600 px-3 text-sm font-medium text-paper hover:bg-accent-700"
            >
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Nouvelle facture</span>
            </Link>

            <div className="relative" ref={menuRef}>
              <button
                type="button"
                onClick={() => setMenuOpen((v) => !v)}
                className="flex items-center gap-2 rounded-lg py-1.5 pl-1.5 pr-2 text-sm hover:bg-ink-100"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-accent-100 text-xs font-semibold text-accent-700">
                  {initials(displayName)}
                </span>
                <span className="hidden max-w-[140px] truncate font-medium text-ink-800 sm:inline">
                  {displayName}
                </span>
                <ChevronDown className="hidden h-3.5 w-3.5 text-ink-500 sm:inline" />
              </button>

              {menuOpen && (
                <div className="absolute right-0 mt-2 w-56 overflow-hidden rounded-lg border border-line bg-surface shadow-[var(--shadow-pop)]">
                  <div className="border-b border-line px-4 py-3">
                    <p className="truncate text-sm font-medium text-ink-900">{displayName}</p>
                    <p className="truncate text-xs text-ink-500">{email}</p>
                  </div>
                  <Link
                    href="/dashboard/settings"
                    className="block px-4 py-2.5 text-sm text-ink-700 hover:bg-ink-100"
                    onClick={() => setMenuOpen(false)}
                  >
                    Paramètres
                  </Link>
                  <form action={signOutAction}>
                    <button
                      type="submit"
                      className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-danger-600 hover:bg-danger-100"
                    >
                      <LogOut className="h-3.5 w-3.5" />
                      Se déconnecter
                    </button>
                  </form>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="flex-1 px-4 py-8 sm:px-6 lg:px-10">
          <div className="mx-auto max-w-6xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
