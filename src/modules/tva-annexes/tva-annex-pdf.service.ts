import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import type { TvaAnnexResult } from './tva-annex.compute';

// ─── Constants ───────────────────────────────────────────────────────────────

const PAGE_H = 842;

/** Convert viewport-top y (pdfjs baseline coords) → pdf-lib bottom-origin y. */
const pdfY = (yTop: number) => PAGE_H - yTop;

/** Right edge of the "Montant" column (extracted from the DGID template). */
const AMT_RIGHT = 578;

const FONT_SIZE = 8;

/**
 * Mapping: L-line key → yTop of its row (from page top, as extracted by pdfjs).
 * Coordinates come from `scripts/extract-pdf-positions.mjs` run on the DGID template.
 */
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

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmt(amount: number): string {
  // Replace narrow no-break space (U+202F) used by fr-FR locale — not encodable in WinAnsi.
  return new Intl.NumberFormat('fr-FR').format(amount).replace(/\u202f/g, '\u0020');
}

// ─── Main export ─────────────────────────────────────────────────────────────

/**
 * Fills the amounts column (L5–L120) in the provided PDF template bytes.
 * The header (NINEA, contribuable, period, etc.) is left untouched.
 *
 * @param templateBuffer - Raw bytes of the uploaded DGID PDF template.
 * @param annex          - Computed TVA annex result.
 * @returns Buffer of the filled PDF.
 */
export async function fillTvaAnnexPdf(
  templateBuffer: Buffer,
  annex: TvaAnnexResult,
): Promise<Buffer> {
  const pdfDoc = await PDFDocument.load(templateBuffer);

  const page     = pdfDoc.getPages()[0];
  const font     = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const lines = annex.lines as Record<string, { amount: number; type: string }>;

  for (const [key, yTop] of Object.entries(ROW_Y)) {
    const line = lines[key];
    if (!line) continue;

    const amountStr = fmt(line.amount);
    const usedFont  = line.type === 'balance' ? fontBold : font;
    const textWidth = usedFont.widthOfTextAtSize(amountStr, FONT_SIZE);

    page.drawText(amountStr, {
      x:     AMT_RIGHT - textWidth,
      y:     pdfY(yTop),
      font:  usedFont,
      size:  FONT_SIZE,
      color: rgb(0, 0, 0),
    });
  }

  return Buffer.from(await pdfDoc.save());
}
