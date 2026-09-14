import type { PDFFont } from "pdf-lib";

export function dataUrlToBytes(dataUrl: string): Uint8Array {
  const base64 = dataUrl.includes(",") ? dataUrl.split(",")[1] : dataUrl;
  return Uint8Array.from(Buffer.from(base64, "base64"));
}

export function dataUrlMime(dataUrl: string): string {
  const match = /^data:([^;]+);base64,/.exec(dataUrl);
  return match?.[1] ?? "image/png";
}

export function wrapText(text: string, font: PDFFont, size: number, maxWidth: number): string[] {
  const words = text.replace(/\s+/g, " ").trim().split(" ");
  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (font.widthOfTextAtSize(candidate, size) > maxWidth && current) {
      lines.push(current);
      current = word;
    } else {
      current = candidate;
    }
  }
  if (current) lines.push(current);
  return lines.length > 0 ? lines : [""];
}

export async function embedImageAuto(pdfDoc: import("pdf-lib").PDFDocument, dataUrl: string) {
  const bytes = dataUrlToBytes(dataUrl);
  const mime = dataUrlMime(dataUrl);
  if (mime.includes("png")) return pdfDoc.embedPng(bytes);
  return pdfDoc.embedJpg(bytes);
}
