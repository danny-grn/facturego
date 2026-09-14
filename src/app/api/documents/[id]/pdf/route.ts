import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getDocumentWithFile } from "@/lib/queries";
import { buildDocumentPdf } from "@/lib/pdf/document-pdf";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const result = await getDocumentWithFile(supabase, id);
  if (!result?.document || result.document.user_id !== user.id) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const bytes = await buildDocumentPdf({
    title: result.document.title,
    fileDataBase64: result.document.file_data_base64,
    signature: result.signature,
  });

  return new NextResponse(Buffer.from(bytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${result.document.file_name}"`,
    },
  });
}
