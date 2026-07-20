/**
 * Script de test : génère un PDF rempli avec des données fictives
 * et l'enregistre sur le bureau.
 * Usage: node scripts/test-pdf-fill.mjs
 */
import { writeFileSync } from 'fs';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const { PDFDocument, rgb, StandardFonts } = require('pdf-lib');
const { readFileSync } = require('fs');
const { join } = require('path');

const PAGE_H = 842;
const pdfY = (yTop) => PAGE_H - yTop;
const AMT_RIGHT = 578;

const MONTHS_FR = [
  'Janvier', 'Fevrier', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Aout', 'Septembre', 'Octobre', 'Novembre', 'Decembre',
];

const ROW_Y = {
  L5: 376, L10: 387, L15: 397, L20: 407, L25: 418,
  L30: 428, L35: 439, L40: 449, L45: 459, L50: 470,
  L55: 480, L60: 490, L65: 501, L70: 511, L75: 521,
  L76: 532, L80: 542, L85: 553, L90: 563, L91: 573,
  L92: 584, L93: 594, L95: 604, L100: 615, L105: 625,
  L110: 636, L115: 646, L120: 656,
};

// Données de test (illustratif)
const testLines = {
  L5:   { amount: 15000000, type: 'input' },
  L10:  { amount: 2000000,  type: 'input' },
  L15:  { amount: 500000,   type: 'input' },
  L20:  { amount: 300000,   type: 'input' },
  L25:  { amount: 2800000,  type: 'calc' },
  L30:  { amount: 0,        type: 'input' },
  L35:  { amount: 12200000, type: 'calc' },
  L40:  { amount: 0,        type: 'input' },
  L45:  { amount: 12200000, type: 'calc' },
  L50:  { amount: 0,        type: 'calc' },
  L55:  { amount: 2196000,  type: 'calc' },
  L60:  { amount: 2196000,  type: 'calc' },
  L65:  { amount: 0,        type: 'input' },
  L70:  { amount: 150000,   type: 'input' },
  L75:  { amount: 0,        type: 'input' },
  L76:  { amount: 150000,   type: 'calc' },
  L80:  { amount: 800000,   type: 'input' },
  L85:  { amount: 144000,   type: 'input' },
  L90:  { amount: 200000,   type: 'input' },
  L91:  { amount: 344000,   type: 'calc' },
  L92:  { amount: 494000,   type: 'calc' },
  L93:  { amount: 1702000,  type: 'calc' },
  L95:  { amount: 0,        type: 'input' },
  L100: { amount: 0,        type: 'input' },
  L105: { amount: 494000,   type: 'calc' },
  L110: { amount: 1702000,  type: 'balance' },
  L115: { amount: 0,        type: 'balance' },
  L120: { amount: 0,        type: 'input' },
};

const meta = {
  ninea: 'SN-2025-123456',
  companyName: 'ACME SARL',
  centreFiscal: 'PLATEAU',
  month: 3,
  year: 2025,
};

const HEADER_FIELDS = [
  { key: 'period',       clearBox: { x: 430, yTop: 168, w: 150, h: 10 }, textX: 436, textYTop: 174 },
  { key: 'ninea',        clearBox: { x: 140, yTop: 180, w: 130, h: 10 }, textX: 149, textYTop: 186 },
  { key: 'name',         clearBox: { x: 410, yTop: 180, w: 175, h: 10 }, textX: 416, textYTop: 186 },
  { key: 'centreFiscal', clearBox: { x: 140, yTop: 204, w: 130, h: 10 }, textX: 149, textYTop: 210 },
  { key: 'dateDebut',    clearBox: { x: 140, yTop: 227, w: 130, h: 10 }, textX: 149, textYTop: 233 },
  { key: 'dateFin',      clearBox: { x: 410, yTop: 227, w: 130, h: 10 }, textX: 416, textYTop: 233 },
  { key: 'dateLimiteDep', clearBox: { x: 140, yTop: 239, w: 130, h: 10 }, textX: 149, textYTop: 245 },
  { key: 'dateLimitePay', clearBox: { x: 410, yTop: 239, w: 130, h: 10 }, textX: 416, textYTop: 245 },
];

function daysInMonth(m, y) { return new Date(y, m, 0).getDate(); }
function nextMonth(m, y) {
  const d = new Date(y, m, 1);
  return { m: MONTHS_FR[d.getMonth()], y: d.getFullYear() };
}
function fmt(n) { return new Intl.NumberFormat('fr-FR').format(n).replace(/\u202f/g, ' '); }

async function main() {
  const templatePath = join(process.cwd(), 'src/assets/pdf/declaration-tva-template.pdf');
  const templateBytes = readFileSync(templatePath);
  const pdfDoc = await PDFDocument.load(templateBytes);

  const page = pdfDoc.getPages()[0];
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const FONT_SIZE = 8;
  const FONT_SIZE_HDR = 7.5;

  const monthName = MONTHS_FR[meta.month - 1];
  const lastDay = daysInMonth(meta.month, meta.year);
  const next = nextMonth(meta.month, meta.year);

  const headerValues = {
    period: `${monthName.toUpperCase()} ${meta.year}`,
    ninea: meta.ninea,
    name: meta.companyName,
    centreFiscal: meta.centreFiscal,
    dateDebut: `01 ${monthName} ${meta.year}`,
    dateFin: `${lastDay} ${monthName} ${meta.year}`,
    dateLimiteDep: `15 ${next.m} ${next.y}`,
    dateLimitePay: `15 ${next.m} ${next.y}`,
  };

  for (const field of HEADER_FIELDS) {
    const value = headerValues[field.key] ?? '';
    const { x: bx, yTop: by, w: bw, h: bh } = field.clearBox;
    page.drawRectangle({ x: bx, y: pdfY(by + bh), width: bw, height: bh, color: rgb(1, 1, 1) });
    page.drawText(value, { x: field.textX, y: pdfY(field.textYTop), font, size: FONT_SIZE_HDR, color: rgb(0, 0, 0) });
  }

  for (const [key, yTop] of Object.entries(ROW_Y)) {
    const line = testLines[key];
    if (!line) continue;
    const amountStr = fmt(line.amount);
    const usedFont = line.type === 'balance' ? fontBold : font;
    const textWidth = usedFont.widthOfTextAtSize(amountStr, FONT_SIZE);
    const textX = AMT_RIGHT - textWidth;
    page.drawText(amountStr, { x: textX, y: pdfY(yTop), font: usedFont, size: FONT_SIZE, color: rgb(0, 0, 0) });
  }

  // Footer
  page.drawRectangle({ x: 14, y: pdfY(835), width: 567, height: 11, color: rgb(1, 1, 1) });
  const now = new Date();
  const nowStr = now.toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });
  const footerL = `Imprime le ${nowStr}`;
  const footerR = `NINEA ${meta.ninea}`;
  const footerRW = font.widthOfTextAtSize(footerR, 7);
  page.drawText(footerL, { x: 14, y: pdfY(832), font, size: 7, color: rgb(0.4, 0.4, 0.4) });
  page.drawText(footerR, { x: 581 - footerRW, y: pdfY(832), font, size: 7, color: rgb(0.4, 0.4, 0.4) });

  const pdfBytes = await pdfDoc.save();
  const outPath = join('C:/Users/lenovo/Desktop', 'declaration-tva-test.pdf');
  writeFileSync(outPath, pdfBytes);
  console.log('PDF genere:', outPath);
}

main().catch(console.error);
