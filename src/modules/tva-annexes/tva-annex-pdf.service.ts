import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { readFileSync } from 'fs';
import { join } from 'path';
import type { TvaAnnexResult } from './tva-annex.compute';

// ─── Types ──────────────────────────────────────────────────────────────────

export type TvaAnnexPdfMeta = {
  ninea: string;
  companyName: string;
  centreFiscal: string;
  month: number;
  year: number;
};

// ─── Constants ───────────────────────────────────────────────────────────────

const MONTHS_FR = [
  'Janvier', 'Fevrier', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Aout', 'Septembre', 'Octobre', 'Novembre', 'Decembre',
];

const PAGE_H = 842;

/** Convert viewport-top y (pdfjs) to pdf-lib bottom-origin y (baseline). */
const pdfY = (yTop: number) => PAGE_H - yTop;

/**
 * Amount column: values are right-aligned up to this x.
 * Based on extracted layout: right margin ~15pt, page width 595pt.
 */
const AMT_RIGHT = 578;

/** Mapping: line key → yTop (from page top, as extracted by pdfjs). */
const ROW_Y: Record<string, number> = {
  L5:   376,
  L10:  387,
  L15:  397,
  L20:  407,
  L25:  418,
  L30:  428,
  L35:  439,
  L40:  449,
  L45:  459,
  L50:  470,
  L55:  480,
  L60:  490,
  L65:  501,
  L70:  511,
  L75:  521,
  L76:  532,
  L80:  542,
  L85:  553,
  L90:  563,
  L91:  573,
  L92:  584,
  L93:  594,
  L95:  604,
  L100: 615,
  L105: 625,
  L110: 636,
  L115: 646,
  L120: 656,
};

/**
 * Header fields to overwrite.
 * clearBox: white rectangle drawn first (x, yTop, w, h in viewport coords).
 * textX/textYTop: baseline where the new value is drawn.
 */
type HeaderField = {
  key: string;
  clearBox: { x: number; yTop: number; w: number; h: number };
  textX: number;
  textYTop: number;
};

const HEADER_FIELDS: HeaderField[] = [
  {
    key: 'period',
    clearBox: { x: 430, yTop: 168, w: 150, h: 10 },
    textX: 436, textYTop: 174,
  },
  {
    key: 'ninea',
    clearBox: { x: 140, yTop: 180, w: 130, h: 10 },
    textX: 149, textYTop: 186,
  },
  {
    key: 'name',
    clearBox: { x: 410, yTop: 180, w: 175, h: 10 },
    textX: 416, textYTop: 186,
  },
  {
    key: 'centreFiscal',
    clearBox: { x: 140, yTop: 204, w: 130, h: 10 },
    textX: 149, textYTop: 210,
  },
  {
    key: 'dateDebut',
    clearBox: { x: 140, yTop: 227, w: 130, h: 10 },
    textX: 149, textYTop: 233,
  },
  {
    key: 'dateFin',
    clearBox: { x: 410, yTop: 227, w: 130, h: 10 },
    textX: 416, textYTop: 233,
  },
  {
    key: 'dateLimiteDep',
    clearBox: { x: 140, yTop: 239, w: 130, h: 10 },
    textX: 149, textYTop: 245,
  },
  {
    key: 'dateLimitePay',
    clearBox: { x: 410, yTop: 239, w: 130, h: 10 },
    textX: 416, textYTop: 245,
  },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmt(amount: number): string {
  // Replace narrow no-break space (U+202F) used by fr-FR locale with regular space
  // because WinAnsi (standard PDF fonts) cannot encode U+202F.
  return new Intl.NumberFormat('fr-FR').format(amount).replace(/\u202f/g, '\u0020');
}

function daysInMonth(month: number, year: number): number {
  return new Date(year, month, 0).getDate();
}

function nextMonth(month: number, year: number): { m: string; y: number } {
  const d = new Date(year, month, 1); // month is 1-indexed, so this gives next month
  return { m: MONTHS_FR[d.getMonth()], y: d.getFullYear() };
}

// ─── Main export ─────────────────────────────────────────────────────────────

export async function buildTvaAnnexPdf(
  meta: TvaAnnexPdfMeta,
  annex: TvaAnnexResult,
): Promise<Buffer> {
  // Load the template
  const templatePath = join(__dirname, '..', '..', 'assets', 'pdf', 'declaration-tva-template.pdf');
  const templateBytes = readFileSync(templatePath);
  const pdfDoc = await PDFDocument.load(templateBytes);

  const page = pdfDoc.getPages()[0];
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const FONT_SIZE = 8;
  const FONT_SIZE_HDR = 7.5;

  // ── Compute header string values ──────────────────────────────────────────

  const monthName = MONTHS_FR[meta.month - 1];
  const lastDay   = daysInMonth(meta.month, meta.year);
  const next      = nextMonth(meta.month, meta.year);

  const headerValues: Record<string, string> = {
    period:       `${monthName.toUpperCase()} ${meta.year}`,
    ninea:        meta.ninea,
    name:         meta.companyName,
    centreFiscal: meta.centreFiscal,
    dateDebut:    `01 ${monthName} ${meta.year}`,
    dateFin:      `${lastDay} ${monthName} ${meta.year}`,
    dateLimiteDep: `15 ${next.m} ${next.y}`,
    dateLimitePay: `15 ${next.m} ${next.y}`,
  };

  // ── Overwrite header fields ───────────────────────────────────────────────

  for (const field of HEADER_FIELDS) {
    const value = headerValues[field.key] ?? '';

    // 1. Draw white rectangle to cover existing text
    const { x: bx, yTop: by, w: bw, h: bh } = field.clearBox;
    page.drawRectangle({
      x:      bx,
      y:      pdfY(by + bh), // bottom-left corner in pdf coords
      width:  bw,
      height: bh,
      color:  rgb(1, 1, 1),
    });

    // 2. Draw new value
    page.drawText(value, {
      x:    field.textX,
      y:    pdfY(field.textYTop),
      font,
      size: FONT_SIZE_HDR,
      color: rgb(0, 0, 0),
    });
  }

  // ── Write amounts in the Montant column ──────────────────────────────────

  const lines = annex.lines;

  for (const [key, yTop] of Object.entries(ROW_Y)) {
    const line = (lines as Record<string, { amount: number; type: string }>)[key];
    if (!line) continue;

    const amountStr = fmt(line.amount);
    const isBalance = line.type === 'balance';
    const usedFont  = isBalance ? fontBold : font;
    const textWidth = usedFont.widthOfTextAtSize(amountStr, FONT_SIZE);
    const textX     = AMT_RIGHT - textWidth;

    page.drawText(amountStr, {
      x:    textX,
      y:    pdfY(yTop),
      font: usedFont,
      size: FONT_SIZE,
      color: rgb(0, 0, 0),
    });
  }

  // ── Footer: date & NINEA ─────────────────────────────────────────────────

  // Cover existing footer
  page.drawRectangle({ x: 14, y: pdfY(835), width: 567, height: 11, color: rgb(1, 1, 1) });

  const now     = new Date();
  const nowStr  = now.toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });
  const footerL = `Imprime le ${nowStr}`;
  const footerR = `NINEA ${meta.ninea}`;
  const footerRW = font.widthOfTextAtSize(footerR, 7);

  page.drawText(footerL, { x: 14, y: pdfY(832), font, size: 7, color: rgb(0.4, 0.4, 0.4) });
  page.drawText(footerR, { x: 581 - footerRW, y: pdfY(832), font, size: 7, color: rgb(0.4, 0.4, 0.4) });

  const pdfBytes = await pdfDoc.save();
  return Buffer.from(pdfBytes);
}
