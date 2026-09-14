import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";

type Client = SupabaseClient<Database>;

export async function getProfile(supabase: Client, userId: string) {
  const { data } = await supabase.from("profiles").select("*").eq("id", userId).maybeSingle();
  return data;
}

export async function getClients(supabase: Client, userId: string) {
  const { data } = await supabase
    .from("clients")
    .select("*")
    .eq("user_id", userId)
    .order("name", { ascending: true });
  return data ?? [];
}

export async function getClient(supabase: Client, id: string) {
  const { data } = await supabase.from("clients").select("*").eq("id", id).maybeSingle();
  return data;
}

export async function getInvoices(supabase: Client, userId: string) {
  const { data } = await supabase
    .from("invoices")
    .select("*, client:clients(id, name, email)")
    .eq("user_id", userId)
    .order("issue_date", { ascending: false });
  return data ?? [];
}

export async function getInvoiceWithItems(supabase: Client, id: string) {
  const { data: invoice } = await supabase
    .from("invoices")
    .select("*, client:clients(*)")
    .eq("id", id)
    .maybeSingle();
  if (!invoice) return null;

  const { data: items } = await supabase
    .from("invoice_items")
    .select("*")
    .eq("invoice_id", id)
    .order("position", { ascending: true });

  const { data: signature } = await supabase
    .from("signatures")
    .select("*")
    .eq("invoice_id", id)
    .maybeSingle();

  const { data: activity } = await supabase
    .from("activity_log")
    .select("*")
    .eq("invoice_id", id)
    .order("created_at", { ascending: false });

  return { invoice, items: items ?? [], signature, activity: activity ?? [] };
}

export async function getDocuments(supabase: Client, userId: string) {
  const { data } = await supabase
    .from("documents")
    .select("id, user_id, client_id, title, file_name, file_mime, status, share_token, sent_at, viewed_at, created_at, updated_at, client:clients(id, name, email)")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  return data ?? [];
}

export async function getDocumentWithFile(supabase: Client, id: string) {
  const { data: document } = await supabase
    .from("documents")
    .select("*, client:clients(*)")
    .eq("id", id)
    .maybeSingle();
  if (!document) return null;

  const { data: signature } = await supabase
    .from("signatures")
    .select("*")
    .eq("document_id", id)
    .maybeSingle();

  const { data: activity } = await supabase
    .from("activity_log")
    .select("*")
    .eq("document_id", id)
    .order("created_at", { ascending: false });

  return { document, signature, activity: activity ?? [] };
}

export async function getDashboardData(supabase: Client, userId: string) {
  const [invoicesRes, clientsRes, documentsRes] = await Promise.all([
    supabase
      .from("invoices")
      .select("id, status, total, issue_date, due_date, paid_at, invoice_number, client:clients(name)")
      .eq("user_id", userId)
      .order("issue_date", { ascending: false }),
    supabase.from("clients").select("id", { count: "exact", head: true }).eq("user_id", userId),
    supabase
      .from("documents")
      .select("id, status")
      .eq("user_id", userId),
  ]);

  return {
    invoices: invoicesRes.data ?? [],
    clientCount: clientsRes.count ?? 0,
    documents: documentsRes.data ?? [],
  };
}
