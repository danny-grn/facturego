import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { SignClient } from "@/components/sign/sign-client";
import { Logo } from "@/components/logo";

export const metadata: Metadata = { title: "Signature électronique — FactureGO" };

export default async function SignPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const supabase = await createClient();
  const { data } = await supabase.rpc("get_signable_by_token", { p_token: token });

  return (
    <div className="min-h-screen bg-paper-dim">
      <header className="border-b border-line bg-surface px-6 py-4">
        <div className="mx-auto flex max-w-3xl items-center justify-between">
          <Logo />
          <span className="text-xs font-medium text-ink-500">Espace de signature sécurisé</span>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <SignClient token={token} payload={data as unknown as Parameters<typeof SignClient>[0]["payload"]} />
      </main>
    </div>
  );
}
