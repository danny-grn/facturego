import { PDFDocument, StandardFonts, type Color } from "pdf-lib";
import { PDF_COLORS } from "./colors";
import { embedImageAuto, wrapText } from "./utils";
import { addSignatureCertificatePage } from "./signature-certificate";
import { formatCurrency, formatDate } from "@/lib/format";
import { INVOICE_STATUS_META } from "@/lib/invoice-utils";
import type { Client, Invoice, InvoiceItem, Profile, Signature } from "@/lib/database.types";

const PAGE_W = 595.28;
const PAGE_H = 841.89;
const MARGIN = 50;

export async function buildInvoicePdf({
  invoice,
  items,
  client,
  profile,
  signature,
}: {
  invoice: Invoice;
  items: InvoiceItem[];
  client: Client | null;
  profile: Profile | null;
  signature: Signature | null;
}): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  pdfDoc.setTitle(`Facture ${invoice.invoice_number}`);
  pdfDoc.setProducer("FactureGO");

  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const bold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  let page = pdfDoc.addPage([PAGE_W, PAGE_H]);
  let y = PAGE_H - MARGIN;

  const drawText = (
    text: string,
    x: number,
    yy: number,
    opts: { size?: number; f?: typeof font; color?: Color } = {}
  ) => {
    page.drawText(text, {
      x,
      y: yy,
      size: opts.size ?? 10,
      font: opts.f ?? font,
      color: opts.color ?? PDF_COLORS.ink700,
    });
  };

  // --- En-tête ---------------------------------------------------------
  let logoHeight = 0;
  if (profile?.logo_data_url) {
    try {
      const logoImage = await embedImageAuto(pdfDoc, profile.logo_data_url);
      const maxW = 130;
      const maxH = 50;
      const scale = Math.min(maxW / logoImage.width, maxH / logoImage.height, 1);
      const w = logoImage.width * scale;
      const h = logoImage.height * scale;
      page.drawImage(logoImage, { x: PAGE_W - MARGIN - w, y: y - h, width: w, height: h });
      logoHeight = h;
    } catch {
      // logo illisible : on ignore silencieusement
    }
  }

  drawText(profile?.company_name || "Votre entreprise", MARGIN, y - 4, { size: 15, f: bold, color: PDF_COLORS.ink900 });
  let leftY = y - 20;
  const companyLines = [
    profile?.address,
    [profile?.postal_code, profile?.city].filter(Boolean).join(" "),
    profile?.country,
    profile?.siret ? `SIRET ${profile.siret}` : null,
    profile?.vat_number ? `TVA ${profile.vat_number}` : null,
    profile?.email,
    profile?.phone,
  ].filter(Boolean) as string[];
  for (const line of companyLines) {
    drawText(line, MARGIN, leftY, { size: 9 });
    leftY -= 12;
  }

  drawText("FACTURE", PAGE_W - MARGIN - 130, y - Math.max(20, logoHeight + 14), {
    size: 18,
    f: bold,
    color: PDF_COLORS.accent600,
  });
  const metaTop = y - Math.max(20, logoHeight + 14) - 18;
  const metaLines = [
    `N° ${invoice.invoice_number}`,
    `Émise le ${formatDate(invoice.issue_date)}`,
    invoice.due_date ? `Échéance le ${formatDate(invoice.due_date)}` : null,
    `Statut : ${INVOICE_STATUS_META[invoice.status].label}`,
  ].filter(Boolean) as string[];
  let metaY = metaTop;
  for (const line of metaLines) {
    const w = font.widthOfTextAtSize(line, 9.5);
    drawText(line, PAGE_W - MARGIN - w, metaY, { size: 9.5 });
    metaY -= 13;
  }

  y = Math.min(leftY, metaY) - 24;

  // --- Facturé à ---------------------------------------------------------
  drawText("FACTURÉ À", MARGIN, y, { size: 8.5, f: bold, color: PDF_COLORS.ink500 });
  y -= 16;
  if (client) {
    drawText(client.name, MARGIN, y, { size: 11, f: bold, color: PDF_COLORS.ink900 });
    y -= 14;
    const clientLines = [
      client.address,
      [client.postal_code, client.city].filter(Boolean).join(" "),
      client.email,
      client.vat_number ? `TVA ${client.vat_number}` : null,
    ].filter(Boolean) as string[];
    for (const line of clientLines) {
      drawText(line, MARGIN, y, { size: 9.5 });
      y -= 12;
    }
  }

  y -= 18;

  // --- Tableau des lignes -------------------------------------------------
  const cols = [
    { key: "description", label: "Description", x: MARGIN, w: 245 },
    { key: "qty", label: "Qté", x: MARGIN + 245, w: 45, align: "right" as const },
    { key: "price", label: "Prix unit.", x: MARGIN + 290, w: 75, align: "right" as const },
    { key: "tax", label: "TVA", x: MARGIN + 365, w: 40, align: "right" as const },
    { key: "total", label: "Total", x: MARGIN + 405, w: PAGE_W - MARGIN - (MARGIN + 405), align: "right" as const },
  ];

  const drawRow = (cells: string[], opts: { bold?: boolean; color?: Color } = {}) => {
    cols.forEach((col, i) => {
      const text = cells[i];
      const f = opts.bold ? bold : font;
      const size = 9.5;
      const width = f.widthOfTextAtSize(text, size);
      const x = col.align === "right" ? col.x + col.w - width : col.x;
      page.drawText(text, { x, y, size, font: f, color: opts.color ?? PDF_COLORS.ink700 });
    });
  };

  page.drawRectangle({ x: MARGIN, y: y - 6, width: PAGE_W - 2 * MARGIN, height: 20, color: PDF_COLORS.paperDim });
  drawRow(
    cols.map((c) => c.label),
    { bold: true, color: PDF_COLORS.ink900 }
  );
  y -= 24;

  const ensureSpace = (needed: number) => {
    if (y - needed < MARGIN + 80) {
      page = pdfDoc.addPage([PAGE_W, PAGE_H]);
      y = PAGE_H - MARGIN;
    }
  };

  for (const item of items) {
    const lines = wrapText(item.description, font, 9.5, cols[0].w - 4);
    ensureSpace(lines.length * 13 + 6);
    const rowTop = y;
    lines.forEach((line, i) => {
      page.drawText(line, { x: cols[0].x, y: rowTop - i * 13, size: 9.5, font, color: PDF_COLORS.ink700 });
    });
    const lineTotal = item.quantity * item.unit_price;
    const rightCells = [
      String(item.quantity),
      formatCurrency(item.unit_price, invoice.currency),
      `${item.tax_rate}%`,
      formatCurrency(lineTotal, invoice.currency),
    ];
    cols.slice(1).forEach((col, i) => {
      const text = rightCells[i];
      const width = font.widthOfTextAtSize(text, 9.5);
      page.drawText(text, { x: col.x + col.w - width, y: rowTop, size: 9.5, font, color: PDF_COLORS.ink700 });
    });
    y = rowTop - lines.length * 13 - 6;
    page.drawLine({
      start: { x: MARGIN, y: y + 4 },
      end: { x: PAGE_W - MARGIN, y: y + 4 },
      thickness: 0.5,
      color: PDF_COLORS.line,
    });
  }

  y -= 12;
  ensureSpace(90);

  // --- Totaux ---------------------------------------------------------
  const totalsX = PAGE_W - MARGIN - 200;
  const totalsW = 200;
  const totalRow = (label: string, value: string, opts: { bold?: boolean } = {}) => {
    const f = opts.bold ? bold : font;
    const size = opts.bold ? 12 : 10;
    drawText(label, totalsX, y, { size, f, color: opts.bold ? PDF_COLORS.ink900 : PDF_COLORS.ink500 });
    const w = f.widthOfTextAtSize(value, size);
    page.drawText(value, { x: totalsX + totalsW - w, y, size, font: f, color: opts.bold ? PDF_COLORS.accent600 : PDF_COLORS.ink900 });
    y -= opts.bold ? 20 : 16;
  };
  totalRow("Sous-total", formatCurrency(invoice.subtotal, invoice.currency));
  totalRow("TVA", formatCurrency(invoice.tax_total, invoice.currency));
  page.drawLine({
    start: { x: totalsX, y: y + 8 },
    end: { x: totalsX + totalsW, y: y + 8 },
    thickness: 0.75,
    color: PDF_COLORS.line,
  });
  y -= 6;
  totalRow("Total à payer", formatCurrency(invoice.total, invoice.currency), { bold: true });

  // --- Conditions / IBAN ------------------------------------------------
  y -= 20;
  ensureSpace(80);
  if (invoice.payment_terms) {
    drawText(invoice.payment_terms, MARGIN, y, { size: 9.5 });
    y -= 14;
  }
  if (invoice.notes) {
    const lines = wrapText(invoice.notes, font, 9.5, PAGE_W - 2 * MARGIN);
    for (const line of lines) {
      drawText(line, MARGIN, y, { size: 9.5 });
      y -= 13;
    }
    y -= 4;
  }
  if (profile?.iban) {
    drawText(`IBAN ${profile.iban}${profile.bic ? `  ·  BIC ${profile.bic}` : ""}`, MARGIN, y, {
      size: 9,
      color: PDF_COLORS.ink500,
    });
    y -= 13;
  }

  // --- Certificat de signature -------------------------------------------
  if (signature) {
    await addSignatureCertificatePage(pdfDoc, {
      font,
      bold,
      subjectLabel: `Facture ${invoice.invoice_number}`,
      signature,
    });
  }

  return pdfDoc.save();
}
