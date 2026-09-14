"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, FileText, Users, FileSignature, Settings, Inbox, X } from "lucide-react";
import { cn } from "@/lib/cn";
import { Logo } from "@/components/logo";

const NAV = [
  { href: "/dashboard", label: "Tableau de bord", icon: LayoutDashboard },
  { href: "/dashboard/invoices", label: "Factures", icon: FileText },
  { href: "/dashboard/documents", label: "Documents à signer", icon: FileSignature },
  { href: "/dashboard/clients", label: "Clients", icon: Users },
  { href: "/dashboard/settings", label: "Paramètres", icon: Settings },
];

export function Sidebar({
  onNavigate,
  showClientPortal = false,
}: {
  onNavigate?: () => void;
  /** N'apparaît que si des documents sont adressés à l'email du compte. */
  showClientPortal?: boolean;
}) {
  const pathname = usePathname();
  const nav = showClientPortal
    ? [...NAV, { href: "/espace", label: "Mon espace", icon: Inbox }]
    : NAV;

  return (
    <div className="flex h-full flex-col bg-ink-900 text-paper">
      <div className="flex items-center justify-between px-6 py-6">
        <Link href="/dashboard">
          <Logo mark="light" />
        </Link>
        <button
          type="button"
          onClick={onNavigate}
          className="rounded-md p-1 text-ink-300 hover:bg-ink-800 lg:hidden"
          aria-label="Fermer le menu"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <nav className="flex-1 space-y-1 px-3">
        {nav.map((item) => {
          const active =
            item.href === "/dashboard" ? pathname === "/dashboard" : pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                active ? "bg-accent-600 text-paper" : "text-ink-300 hover:bg-ink-800 hover:text-paper"
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-ink-800 px-6 py-5 text-xs text-ink-500">
        FactureGO — v1.0
      </div>
    </div>
  );
}
