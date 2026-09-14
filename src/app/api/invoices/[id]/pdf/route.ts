import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getInvoiceWithItems, getProfile } from "@/lib/queries";
import { buildInvoicePdf } from "@/lib/pdf/invoice-pdf";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const result = await getInvoiceWithItems(supabase, id);
  if (!result?.invoice || result.invoice.user_id !== user.id) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const profile = await getProfile(supabase, user.id);
  const client = result.invoice.client ?? null;

  const bytes = await buildInvoicePdf({
    invoice: result.invoice,
    items: result.items,
    client,
    profile,
    signature: result.signature,
  });

  return new NextResponse(Buffer.from(bytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${result.invoice.invoice_number}.pdf"`,
    },
  });
}
