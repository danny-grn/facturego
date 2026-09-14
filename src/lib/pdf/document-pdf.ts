import { PDFDocument, StandardFonts } from "pdf-lib";
import { dataUrlToBytes } from "./utils";
import { addSignatureCertificatePage } from "./signature-certificate";
import type { Signature } from "@/lib/database.types";

export async function buildDocumentPdf({
  title,
  fileDataBase64,
  signature,
}: {
  title: string;
  fileDataBase64: string;
  signature: Signature | null;
}): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.load(dataUrlToBytes(fileDataBase64), { ignoreEncryption: true });
  pdfDoc.setProducer("FactureGO");

  if (signature) {
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const bold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    await addSignatureCertificatePage(pdfDoc, { font, bold, subjectLabel: title, signature });
  }

  return pdfDoc.save();
}
