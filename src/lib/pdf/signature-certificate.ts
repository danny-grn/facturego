import type { PDFDocument, PDFFont } from "pdf-lib";
import { PDF_COLORS } from "./colors";
import { embedImageAuto, wrapText } from "./utils";
import { formatDateTime } from "@/lib/format";
import type { Signature } from "@/lib/database.types";

const PAGE_W = 595.28;
const PAGE_H = 841.89;
const MARGIN = 50;

export async function addSignatureCertificatePage(
  pdfDoc: PDFDocument,
  { font, bold, subjectLabel, signature }: { font: PDFFont; bold: PDFFont; subjectLabel: string; signature: Signature }
) {
  const page = pdfDoc.addPage([PAGE_W, PAGE_H]);
  let y = PAGE_H - MARGIN;

  page.drawText("Certificat de signature électronique", { x: MARGIN, y, size: 15, font: bold, color: PDF_COLORS.ink900 });
  y -= 28;
  page.drawText(`Document : ${subjectLabel}`, { x: MARGIN, y, size: 10, font, color: PDF_COLORS.ink700 });
  y -= 30;

  try {
    const sigImage = await embedImageAuto(pdfDoc, signature.signature_data_url);
    const maxW = 220;
    const maxH = 100;
    const scale = Math.min(maxW / sigImage.width, maxH / sigImage.height, 1);
    const w = sigImage.width * scale;
    const h = sigImage.height * scale;
    page.drawRectangle({ x: MARGIN, y: y - h - 12, width: w + 24, height: h + 24, color: PDF_COLORS.paperDim });
    page.drawImage(sigImage, { x: MARGIN + 12, y: y - h, width: w, height: h });
    y -= h + 36;
  } catch {
    y -= 12;
  }

  const details: [string, string][] = [
    ["Signataire", signature.signer_name],
    ["Email", signature.signer_email || "—"],
    ["Date et heure", formatDateTime(signature.signed_at)],
    ["Adresse IP", signature.ip_address || "—"],
    ["Empreinte (SHA-256)", signature.signature_hash],
  ];
  for (const [label, value] of details) {
    page.drawText(label, { x: MARGIN, y, size: 9, font: bold, color: PDF_COLORS.ink500 });
    const lines = wrapText(value, font, 9.5, PAGE_W - 2 * MARGIN - 150);
    lines.forEach((line, i) => {
      page.drawText(line, { x: MARGIN + 150, y: y - i * 12, size: 9.5, font, color: PDF_COLORS.ink900 });
    });
    y -= Math.max(16, lines.length * 12 + 4);
  }

  y -= 10;
  const disclaimer = wrapText(
    "Ce certificat atteste que le document ci-joint a été consulté puis signé électroniquement par le signataire mentionné ci-dessus, via un lien sécurisé et unique généré par FactureGO. L'empreinte numérique garantit l'intégrité du contenu signé.",
    font,
    8.5,
    PAGE_W - 2 * MARGIN
  );
  for (const line of disclaimer) {
    page.drawText(line, { x: MARGIN, y, size: 8.5, font, color: PDF_COLORS.ink500 });
    y -= 12;
  }
}
