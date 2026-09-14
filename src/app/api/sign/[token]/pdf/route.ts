import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { buildInvoicePdf } from "@/lib/pdf/invoice-pdf";
import { buildDocumentPdf } from "@/lib/pdf/document-pdf";
import type { Client, Invoice, InvoiceItem, Profile, Signature } from "@/lib/database.types";

interface SignablePayload {
  kind: "invoice" | "document";
  invoice?: Invoice;
  items?: InvoiceItem[];
  document?: { title: string; file_name: string; file_data_base64: string };
  client?: Client | null;
  profile?: Profile | null;
  signature?: Signature | null;
}

export async function GET(_request: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const supabase = await createClient();

  const { data, error } = await supabase.rpc("get_signable_by_token", { p_token: token });
  if (error || !data) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const payload = data as unknown as SignablePayload;

  if (payload.kind === "invoice" && payload.invoice) {
    const bytes = await buildInvoicePdf({
      invoice: payload.invoice,
      items: payload.items ?? [],
      client: payload.client ?? null,
      profile: payload.profile ?? null,
      signature: payload.signature ?? null,
    });
    return new NextResponse(Buffer.from(bytes), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${payload.invoice.invoice_number}.pdf"`,
      },
    });
  }

  if (payload.kind === "document" && payload.document) {
    const bytes = await buildDocumentPdf({
      title: payload.document.title,
      fileDataBase64: payload.document.file_data_base64,
      signature: payload.signature ?? null,
    });
    return new NextResponse(Buffer.from(bytes), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${payload.document.file_name}"`,
      },
    });
  }

  return NextResponse.json({ error: "not_found" }, { status: 404 });
}
