/**
 * Test : génère un PDF rempli à partir d'un client réel de la base.
 * Usage: node scripts/test-pdf-real.mjs [clientId] [month] [year]
 *
 * Ex:   node scripts/test-pdf-real.mjs              → 1er client trouvé, mois courant
 *       node scripts/test-pdf-real.mjs <uuid> 3 2025
 */
import { createRequire } from 'module';
import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const require   = createRequire(import.meta.url);
const __dirname = dirname(fileURLToPath(import.meta.url));

const { PrismaClient }                    = require('@prisma/client');
const { PrismaMariaDb }                   = require('@prisma/adapter-mariadb');
const { PDFDocument, rgb, StandardFonts } = require('pdf-lib');

// Load .env
const dotenv = require('dotenv');
dotenv.config();

// ── CLI args ─────────────────────────────────────────────────────────────────
const [,, argClientId, argMonth, argYear] = process.argv;
const now   = new Date();
const MONTH = argMonth ? parseInt(argMonth) : now.getMonth() + 1;
const YEAR  = argYear  ? parseInt(argYear)  : now.getFullYear();

// ── Prisma ───────────────────────────────────────────────────────────────────
function parseDatabaseUrl(url) {
  const parsed = new URL(url);
  return {
    host:            parsed.hostname,
    port:            parseInt(parsed.port, 10) || 3306,
    user:            parsed.username,
    password:        parsed.password,
    database:        parsed.pathname.replace('/', ''),
    connectionLimit: 5,
    idleTimeout:     60,
    connectTimeout:  30000,
  };
}
const adapter = new PrismaMariaDb(parseDatabaseUrl(process.env.DATABASE_URL));
const prisma   = new PrismaClient({ adapter });

async function main() {
  // 1. Trouver le client
  const client = argClientId
    ? await prisma.client.findFirst({ where: { id: argClientId, deletedAt: null }, include: { country: true } })
    : await prisma.client.findFirst({ where: { deletedAt: null }, include: { country: true } });

  if (!client) {
    console.error('Aucun client trouvé en base.');
    process.exit(1);
  }

  console.log(`Client  : ${client.name} (${client.id})`);
  console.log(`NINEA   : ${client.ninea}`);
  console.log(`Pays    : ${client.country?.name ?? '—'}  TVA=${client.country?.tva ?? 18}%`);
  console.log(`Période : ${String(MONTH).padStart(2,'0')}/${YEAR}`);

  // 2. Charger les opérations du mois
  const periodStart = new Date(Date.UTC(YEAR, MONTH - 1, 1));
  const periodEnd   = new Date(Date.UTC(YEAR, MONTH,     1));
  const tierScope   = { deletedAt: null, clientId: client.id, client: { companyId: client.companyId, deletedAt: null } };

  const [turnovers, exportations, exemptions, suspensions, retains, importations, localPurchases] =
    await Promise.all([
      prisma.opTurnover.findMany({
        where: { deletedAt: null, clientId: client.id, client: { companyId: client.companyId, deletedAt: null }, date: { gte: periodStart, lt: periodEnd } },
        select: { net: true, tax: true, total: true },
      }),
      prisma.opExportation.findMany({ where: { deletedAt: null, month: MONTH, year: YEAR, tier: tierScope }, select: { net: true, tax: true, total: true } }),
      prisma.opExemption.findMany(  { where: { deletedAt: null, month: MONTH, year: YEAR, tier: tierScope }, select: { amount: true } }),
      prisma.opSuspension.findMany( { where: { deletedAt: null, month: MONTH, year: YEAR, tier: tierScope }, select: { net: true, tax: true, total: true } }),
      prisma.opRetain.findMany(     { where: { deletedAt: null, month: MONTH, year: YEAR, tier: tierScope }, select: { amount: true, base: true, rate: true } }),
      prisma.opImportation.findMany({ where: { deletedAt: null, month: MONTH, year: YEAR, tier: tierScope }, select: { net: true, tax: true, total: true, taxDeduction: true } }),
      prisma.opLocalPurchase.findMany({ where: { deletedAt: null, month: MONTH, year: YEAR, tier: tierScope }, select: { net: true, tax: true, total: true, taxDeduction: true } }),
    ]);

  console.log(`\nOpérations trouvées :`);
  console.log(`  Chiffres d'affaires : ${turnovers.length}`);
  console.log(`  Exportations        : ${exportations.length}`);
  console.log(`  Exonérations        : ${exemptions.length}`);
  console.log(`  Suspensions         : ${suspensions.length}`);
  console.log(`  Retenues            : ${retains.length}`);
  console.log(`  Importations        : ${importations.length}`);
  console.log(`  Achats locaux       : ${localPurchases.length}`);

  // 3. Complétion triplet + agrégation (inline)
  function toNum(v) { return v === null || v === undefined ? null : Number(v); }

  function completeRow(row) {
    let net = toNum(row.net), tax = toNum(row.tax), total = toNum(row.total);
    const k = (net !== null ? 1 : 0) + (tax !== null ? 1 : 0) + (total !== null ? 1 : 0);
    if (k >= 2) {
      if (net   === null) net   = total - tax;
      if (tax   === null) tax   = total - net;
      if (total === null) total = net + tax;
    }
    return { net: net ?? 0, tax: tax ?? 0, total: total ?? 0 };
  }

  const sumNet = rows => rows.reduce((s, r) => s + (completeRow(r).net), 0);
  const sumTaxDedOrTax = rows => rows.reduce((s, r) => {
    const taxDed = toNum(r.taxDeduction);
    if (taxDed !== null) return s + taxDed;
    return s + completeRow(r).tax;
  }, 0);
  const sumRetain = rows => rows.reduce((s, r) => {
    const amt = toNum(r.amount);
    if (amt !== null) return s + amt;
    const base = toNum(r.base), rate = toNum(r.rate);
    if (base !== null && rate !== null) return s + Math.round(base * rate / 100);
    return s;
  }, 0);

  const l5  = Math.round(sumNet(turnovers));
  const l10 = Math.round(sumNet(exportations));
  const l15 = Math.round(exemptions.reduce((s, r) => s + (toNum(r.amount) ?? 0), 0));
  const l20 = Math.round(sumNet(suspensions));
  const l70 = Math.round(sumRetain(retains));
  const l80 = Math.round(sumNet(importations));
  const l85 = Math.round(sumTaxDedOrTax(importations));
  const l90 = Math.round(sumTaxDedOrTax(localPurchases));

  const normalRate  = client.country?.tva ?? 18;
  const reducedRate = 10;

  const l25  = l10 + l15 + l20;
  const l35  = l5 - l25;
  const l40  = 0; // pas de base réduite manuelle
  const l45  = l35 - l40;
  const l50  = Math.round(l40 * reducedRate / 100);
  const l55  = Math.round(l45 * normalRate  / 100);
  const l60  = l50 + l55;
  const l65  = 0;
  const l75  = 0;
  const l76  = l70 + l75;
  const l91  = l85 + l90;
  const l92  = l76 + l91;
  const l93  = l60 - l92;
  const l95  = 0;
  const l100 = 0;
  const l105 = l70 + l75 + l85 + l90 + l100;
  const l110 = Math.max(0, l60 - l105);
  const l115 = Math.max(0, l105 - l60);
  const l120 = 0;

  const amounts = {
    L5: l5,  L10: l10, L15: l15, L20: l20, L25: l25,
    L30: 0,  L35: l35, L40: l40, L45: l45, L50: l50,
    L55: l55, L60: l60, L65: l65, L70: l70, L75: l75,
    L76: l76, L80: l80, L85: l85, L90: l90, L91: l91,
    L92: l92, L93: l93, L95: l95, L100: l100, L105: l105,
    L110: l110, L115: l115, L120: l120,
  };

  console.log('\nLignes calculées :');
  for (const [k, v] of Object.entries(amounts)) {
    if (v !== 0) console.log(`  ${k.padEnd(5)}: ${new Intl.NumberFormat('fr-FR').format(v)} FCFA`);
  }

  // 4. Remplir le PDF
  const PAGE_H   = 842;
  const pdfY     = yTop => PAGE_H - yTop;
  const AMT_RIGHT = 511;
  const FONT_SIZE = 8;
  const fmt = n => new Intl.NumberFormat('fr-FR').format(n).replace(/\u202f/g, ' ');

  const ROW_Y = {
    L5: 376,  L10: 387,  L15: 397,  L20: 407,  L25: 418,
    L30: 428, L35: 439,  L40: 449,  L45: 459,  L50: 470,
    L55: 480, L60: 490,  L65: 501,  L70: 511,  L75: 521,
    L76: 532, L80: 542,  L85: 553,  L90: 563,  L91: 573,
    L92: 584, L93: 594,  L95: 604,  L100: 615, L105: 625,
    L110: 636, L115: 646, L120: 656,
  };

  const BALANCE_LINES = new Set(['L110', 'L115']);

  const templatePath = join(__dirname, '..', 'src', 'assets', 'pdf', 'declaration-tva-template.pdf');
  const templateBytes = readFileSync(templatePath);
  const pdfDoc = await PDFDocument.load(templateBytes);
  const page   = pdfDoc.getPages()[0];
  const font     = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  for (const [key, yTop] of Object.entries(ROW_Y)) {
    const amount = amounts[key] ?? 0;
    const amountStr = fmt(amount);
    const usedFont  = BALANCE_LINES.has(key) ? fontBold : font;
    const textWidth = usedFont.widthOfTextAtSize(amountStr, FONT_SIZE);
    page.drawText(amountStr, {
      x:    AMT_RIGHT - textWidth,
      y:    pdfY(yTop),
      font: usedFont,
      size: FONT_SIZE,
      color: rgb(0, 0, 0),
    });
  }

  const outPath = join('C:/Users/lenovo/Desktop', `declaration-tva-${client.name.replace(/[^a-zA-Z0-9]/g,'-')}-${String(MONTH).padStart(2,'0')}-${YEAR}.pdf`);
  writeFileSync(outPath, await pdfDoc.save());
  console.log(`\nPDF généré : ${outPath}`);
  console.log(`TVA payable (L110) : ${fmt(l110)} FCFA`);
  console.log(`Crédit à reporter (L115) : ${fmt(l115)} FCFA`);

  await prisma.$disconnect();
}

main().catch(async e => { console.error(e); await prisma.$disconnect(); process.exit(1); });
