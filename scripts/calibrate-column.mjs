/**
 * Génère un PDF de calibration pour trouver la bordure droite de la colonne "Montant".
 * Trace des lignes verticales à plusieurs positions x candidates.
 */
import { createRequire } from 'module';
import { readFileSync, writeFileSync } from 'fs';
const require = createRequire(import.meta.url);
const { PDFDocument, rgb, StandardFonts } = require('pdf-lib');

const template = readFileSync('src/assets/pdf/declaration-tva-template.pdf');
const pdfDoc   = await PDFDocument.load(template);
const page     = pdfDoc.getPages()[0];
const font     = await pdfDoc.embedFont(StandardFonts.Helvetica);

const PAGE_H = 842;
const pdfY = yTop => PAGE_H - yTop;

// Candidats pour le bord droit de la colonne "Montant"
const candidates = [490, 500, 505, 510, 515, 520, 525, 530];

for (const x of candidates) {
  // Ligne verticale rouge sur toute la hauteur du tableau
  page.drawLine({
    start: { x, y: pdfY(360) },
    end:   { x, y: pdfY(665) },
    thickness: 0.5,
    color: rgb(1, 0, 0),
    opacity: 0.6,
  });
  // Label
  page.drawText(`x=${x}`, { x: x - 10, y: pdfY(358), font, size: 5, color: rgb(1, 0, 0) });
}

// Écrire aussi "19 500 000" à chaque candidat pour voir lequel s'aligne
const testAmt = '19 500 000';
for (const x of candidates) {
  const w = font.widthOfTextAtSize(testAmt, 8);
  page.drawText(testAmt, { x: x - w, y: pdfY(376), font, size: 8, color: rgb(0, 0, 1), opacity: 0.4 });
}

writeFileSync('C:/Users/lenovo/Desktop/calibration-colonne.pdf', await pdfDoc.save());
console.log('PDF calibration généré : C:/Users/lenovo/Desktop/calibration-colonne.pdf');
console.log('Candidats testés :', candidates.join(', '));
