/**
 * Extrait les lignes vectorielles (paths) du PDF pour trouver les bordures du tableau.
 * Utilise pdf-lib pour lire la page et repère les coordonnées x des traits verticaux.
 */
import { createRequire } from 'module';
import { readFileSync } from 'fs';
const require = createRequire(import.meta.url);
const { getDocument } = require('../node_modules/pdfjs-dist/legacy/build/pdf.mjs');

const data = new Uint8Array(readFileSync('src/assets/pdf/declaration-tva-template.pdf'));
const doc  = await getDocument({ data, useSystemFonts: true }).promise;
const page = await doc.getPage(1);

// On opérateur code : m = moveto, l = lineto, re = rectangle
// On cherche les opérations dans le flux de contenu
const ops = await page.getOperatorList();

const PAGE_H = 842;
const vLines = new Set();  // x des lignes verticales
const hLines = new Set();  // y des lignes horizontales
const rects  = [];

let cursor = { x: 0, y: 0 };
for (let i = 0; i < ops.fnArray.length; i++) {
  const fn   = ops.fnArray[i];
  const args = ops.argsArray[i];

  // 'm' = moveto (79), 'l' = lineto (80), 're' = rectangle (91), 'S' = stroke (68)
  if (fn === 79 && args) { // moveto
    cursor = { x: Math.round(args[0]), y: Math.round(PAGE_H - args[1]) };
  } else if (fn === 80 && args) { // lineto
    const x2 = Math.round(args[0]);
    const y2 = Math.round(PAGE_H - args[1]);
    if (cursor.x === x2) vLines.add(cursor.x);          // vertical line
    if (cursor.y === y2) hLines.add(cursor.y);           // horizontal line
    cursor = { x: x2, y: y2 };
  } else if (fn === 91 && args) { // rectangle
    const rx = Math.round(args[0]);
    const ry = Math.round(PAGE_H - args[1] - args[3]);
    const rw = Math.round(args[2]);
    const rh = Math.round(args[3]);
    rects.push({ x: rx, y: ry, w: rw, h: rh });
    // Add border lines
    vLines.add(rx);
    vLines.add(rx + rw);
  }
}

const sortedVLines = [...vLines].sort((a, b) => a - b);
const sortedHLines = [...hLines].sort((a, b) => a - b);

console.log('Lignes verticales (x) :', sortedVLines.join(', '));
console.log('Lignes horizontales (y) :', sortedHLines.join(', '));
console.log(`\nRectangles trouvés : ${rects.length}`);
rects.slice(0, 20).forEach(r => console.log(` rect x=${r.x} y=${r.y} w=${r.w} h=${r.h}`));
