import { getDocument } from '../node_modules/pdfjs-dist/legacy/build/pdf.mjs';
import { readFileSync } from 'fs';

const data = new Uint8Array(readFileSync('C:/Users/lenovo/Desktop/declaration TVA.pdf'));
const doc = await getDocument({ data, useSystemFonts: true }).promise;
const page = await doc.getPage(1);
const { width, height } = page.getViewport({ scale: 1 });
const content = await page.getTextContent();

console.log(`Viewport: ${Math.round(width)} x ${Math.round(height)}`);
content.items.forEach(item => {
  if (!item.str || item.str.trim() === '') return;
  const [, , , , x, y] = item.transform;
  const yTop = Math.round(height - y);
  console.log(JSON.stringify({ x: Math.round(x), yTop, w: Math.round(item.width), str: item.str.trim() }));
});
