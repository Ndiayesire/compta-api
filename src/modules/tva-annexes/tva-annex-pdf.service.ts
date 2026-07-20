import PDFDocument from 'pdfkit';
import type { TvaAnnexResult } from './tva-annex.compute';

export type TvaAnnexPdfMeta = {
  ninea: string;
  companyName: string;
  centreFiscal: string;
  month: number;
  year: number;
};

const MONTHS_FR = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
];

function fmt(amount: number): string {
  return new Intl.NumberFormat('fr-FR').format(amount);
}

function zeroDash(amount: number): string {
  return amount === 0 ? '—' : fmt(amount);
}

/** Retourne les jours du mois (1-indexed) */
function daysInMonth(month: number, year: number): number {
  return new Date(year, month, 0).getDate();
}

const ROWS: Array<{
  label: string;
  tag?: string;
  line: number;
  key: string;
  bold?: boolean;
}> = [
  { label: 'Montant des opérations', line: 5, key: 'L5' },
  { label: "Affaires \u00e0 l'exportation", tag: 'EXPORTATIONS', line: 10, key: 'L10' },
  { label: "Affaires r\u00e9alis\u00e9es \u00e0 l'int\u00e9rieur non tax\u00e9es", tag: 'EXONERATIONS', line: 15, key: 'L15' },
  { label: 'Affaires réalisées en suspension de la TVA', tag: 'SUSPENSIONS', line: 20, key: 'L20' },
  { label: 'Total affaires non soumises à la TVA (L10+L15+L20)', line: 25, key: 'L25', bold: true },
  { label: 'Pr\u00e9l\u00e8vements et livraisons ou prestations \u00e0 soi-m\u00eame', line: 30, key: 'L30' },
  { label: 'Montant Total Taxable (L5-L25)', line: 35, key: 'L35', bold: true },
  { label: 'Montant taxable — Taux réduit', line: 40, key: 'L40' },
  { label: 'Montant taxable — Taux Normal (L35-L40)', line: 45, key: 'L45' },
  { label: 'Montant de la TVA — Taux Réduit (L40×10%)', line: 50, key: 'L50' },
  { label: 'Montant de la TVA — Taux Normal (L45×18%)', line: 55, key: 'L55' },
  { label: 'Montant de la TVA Brute (L50+L55)', line: 60, key: 'L60', bold: true },
  { label: 'Affaires soumises au précompte', line: 65, key: 'L65' },
  { label: 'Précompte de TVA', tag: 'TVA PRECOMPTEE', line: 70, key: 'L70' },
  { label: 'Imputation de chèques DDI', line: 75, key: 'L75' },
  { label: 'Total des avances (L70+L75)', line: 76, key: 'L76', bold: true },
  { label: 'Montant des importations du mois', line: 80, key: 'L80' },
  { label: 'TVA acquittée sur les importations du mois', tag: 'IMPORTATIONS', line: 85, key: 'L85' },
  { label: 'TVA acquittée sur les achats intérieurs du mois', tag: 'ACHATS LOCAUX', line: 90, key: 'L90' },
  { label: 'Déductions sur achats (L85+L90)', line: 91, key: 'L91', bold: true },
  { label: 'Total déductions pour le mois (L76+L91)', line: 92, key: 'L92', bold: true },
  { label: 'Solde total exigible pour la période', line: 93, key: 'L93' },
  { label: 'Montant des remboursements demandés et accordés', line: 95, key: 'L95' },
  { label: 'Crédit de TVA du mois précédent', line: 100, key: 'L100' },
  { label: 'Montant total déductible pour le mois (L70+L75+L85+L90+L100)', line: 105, key: 'L105', bold: true },
  { label: 'Solde Total Exigible (L60-L105 si positif)', line: 110, key: 'L110', bold: true },
  { label: 'Crédit de TVA à reporter (L105-L60 si positif)', line: 115, key: 'L115', bold: true },
  { label: 'Montant des remboursements demandés et en instruction', line: 120, key: 'L120' },
];

export function buildTvaAnnexPdf(
  meta: TvaAnnexPdfMeta,
  annex: TvaAnnexResult,
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 36, info: { Title: 'Déclaration TVA' } });
    const chunks: Buffer[] = [];

    doc.on('data', (c: Buffer) => chunks.push(c));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const W = doc.page.width - 72;
    const MONTH_FR = MONTHS_FR[meta.month - 1];
    const lastDay = daysInMonth(meta.month, meta.year);
    const monthPad = String(meta.month).padStart(2, '0');
    const periodLabel = `${MONTH_FR.toUpperCase()} ${meta.year}`;
    const lines = annex.lines;

    /* ── En-tête ── */
    doc.fontSize(9).font('Helvetica');

    doc.text('REPUBLIQUE DU SENEGAL', { align: 'center' });
    doc.text('Un Peuple - Un But - Une Foi', { align: 'center' });
    doc.text('DGID - Ministère des Finances et du Budget', { align: 'center' });
    doc.moveDown(0.4);

    doc.font('Helvetica-Bold').fontSize(13)
      .text('TAXE SUR LA VALEUR AJOUTÉE', { align: 'center' });
    doc.font('Helvetica').fontSize(9);
    doc.moveDown(0.5);

    /* ── Bloc renseignements ── */
    const boxTop = doc.y;
    doc.rect(36, boxTop, W, 100).stroke();

    const col1 = 36, col2 = 260, col3 = 450;
    const rowH = 16;
    let ry = boxTop + 6;

    function infoRow(
      leftLabel: string, leftVal: string,
      rightLabel?: string, rightVal?: string,
    ) {
      doc.font('Helvetica-Bold').text(leftLabel, col1 + 4, ry, { width: 120 });
      doc.font('Helvetica').text(leftVal, col2, ry, { width: 180 });
      if (rightLabel) {
        doc.font('Helvetica-Bold').text(rightLabel, col3, ry, { width: 80 });
        doc.font('Helvetica').text(rightVal ?? '', col3 + 85, ry, { width: 100 });
      }
      ry += rowH;
    }

    infoRow("P\u00c9RIODE D'IMPOSITION", periodLabel);
    infoRow('NINEA', meta.ninea, 'NOM DU CONTRIBUABLE', meta.companyName);
    infoRow('CENTRE FISCAL', meta.centreFiscal);
    infoRow('DÉBUT DE LA PÉRIODE', `01 ${MONTH_FR} ${meta.year}`, 'FIN DE LA PÉRIODE', `${lastDay} ${MONTH_FR} ${meta.year}`);
    infoRow(
      'DATE LIMITE DE DÉPÔT',
      `15 ${MONTHS_FR[meta.month % 12]} ${meta.month === 12 ? meta.year + 1 : meta.year}`,
      'DATE LIMITE DE PAIEMENT',
      `15 ${MONTHS_FR[meta.month % 12]} ${meta.month === 12 ? meta.year + 1 : meta.year}`,
    );

    doc.y = boxTop + 104;
    doc.moveDown(0.4);

    /* ── Tableau lignes ── */
    const COL_LABEL = 36;
    const COL_TAG   = 290;
    const COL_LINE  = 390;
    const COL_AMT   = 430;
    const ROW_H     = 17;
    const AMT_W     = 120;

    // En-tête tableau
    doc.font('Helvetica-Bold').fontSize(8);
    const tableTop = doc.y;
    doc.rect(36, tableTop, W, ROW_H).fillAndStroke('#dce6f1', '#aaa');
    doc.fillColor('black')
      .text('Annexe fiscale', COL_LABEL + 2, tableTop + 4, { width: 250 })
      .text('Ligne', COL_LINE, tableTop + 4, { width: 35, align: 'center' })
      .text('Montant', COL_AMT, tableTop + 4, { width: AMT_W, align: 'right' });

    let curY = tableTop + ROW_H;

    ROWS.forEach((row, i) => {
      const isShaded = i % 2 === 1;
      const bg = isShaded ? '#f5f8fc' : 'white';
      doc.rect(36, curY, W, ROW_H).fillAndStroke(bg, '#ccc');

      const amount = (lines as Record<string, { amount: number }>)[row.key]?.amount ?? 0;
      const amtStr = zeroDash(amount);

      doc.fillColor('black');

      if (row.bold) {
        doc.font('Helvetica-Bold').fontSize(7.5);
      } else {
        doc.font('Helvetica').fontSize(7.5);
      }

      doc.text(row.label, COL_LABEL + 2, curY + 4, { width: 250, lineBreak: false });
      if (row.tag) {
        doc.font('Helvetica-Oblique').fontSize(6.5)
          .text(row.tag, COL_TAG, curY + 5, { width: 90, lineBreak: false });
      }

      doc.font('Helvetica').fontSize(7.5)
        .text(String(row.line), COL_LINE, curY + 4, { width: 35, align: 'center', lineBreak: false });

      if (row.bold) {
        doc.font('Helvetica-Bold');
      }
      doc.text(amtStr, COL_AMT, curY + 4, { width: AMT_W, align: 'right', lineBreak: false });

      curY += ROW_H;
    });

    // Trait bas
    doc.rect(36, curY, W, 1).fill('#aaa');
    curY += 6;

    /* ── Pied de page ── */
    doc.font('Helvetica').fontSize(7).fillColor('#555')
      .text(
        `NINEA ${meta.ninea}  —  Période ${monthPad}/${meta.year}  —  Généré par Insta Compta`,
        36,
        doc.page.height - 36,
        { width: W, align: 'center' },
      );

    doc.end();
  });
}
