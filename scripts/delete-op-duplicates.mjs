/**
 * Supprime les doublons dans les tables op_turnovers, op_local_purchases, op_turnover_stamps.
 * Stratégie : garder la ligne la plus ancienne (createdAt MIN) de chaque groupe, soft-delete les autres.
 * Pour op_turnover_stamps avec op_turnover_id NULL : soft-delete toutes.
 */
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const dotenv = require('dotenv'); dotenv.config();
const { PrismaClient } = require('@prisma/client');
const { PrismaMariaDb } = require('@prisma/adapter-mariadb');

function parseUrl(url) {
  const p = new URL(url);
  return { host: p.hostname, port: parseInt(p.port)||3306, user: p.username, password: p.password, database: p.pathname.replace('/',''), connectionLimit:5, idleTimeout:60, connectTimeout:30000 };
}
const prisma = new PrismaClient({ adapter: new PrismaMariaDb(parseUrl(process.env.DATABASE_URL)) });
const now = new Date();

async function main() {
  let total = 0;

  // ── 1. op_turnovers ───────────────────────────────────────────────────────
  // Garder le min(op_turnover_id) par groupe (client_id, date, net, tax, total)
  const dupTurnovers = await prisma.$queryRawUnsafe(`
    SELECT GROUP_CONCAT(op_turnover_id ORDER BY op_turnover_created_at ASC) as ids, COUNT(*) as cnt
    FROM op_turnovers
    WHERE op_turnover_deleted_at IS NULL
    GROUP BY client_id, DATE(op_turnover_date), op_turnover_net, op_turnover_tax, op_turnover_total
    HAVING cnt > 1
  `);

  const idsToDeleteTurnovers = [];
  for (const row of dupTurnovers) {
    const ids = row.ids.split(',');
    ids.shift(); // garder le 1er (le plus ancien)
    idsToDeleteTurnovers.push(...ids);
  }

  if (idsToDeleteTurnovers.length > 0) {
    // Soft-delete en batch
    const res = await prisma.opTurnover.updateMany({
      where: { id: { in: idsToDeleteTurnovers }, deletedAt: null },
      data:  { deletedAt: now },
    });
    console.log(`  op_turnovers       : ${res.count} doublon(s) supprimé(s) (${dupTurnovers.length} groupe(s))`);
    total += res.count;
  } else {
    console.log(`  op_turnovers       : aucun doublon`);
  }

  // ── 2. op_local_purchases ────────────────────────────────────────────────
  const dupLocal = await prisma.$queryRawUnsafe(`
    SELECT GROUP_CONCAT(op_local_purchase_id ORDER BY op_local_purchase_created_at ASC) as ids, COUNT(*) as cnt
    FROM op_local_purchases
    WHERE op_local_purchase_deleted_at IS NULL
    GROUP BY tier_id, op_local_purchase_month, op_local_purchase_year,
             op_local_purchase_net, op_local_purchase_tax, op_local_purchase_total
    HAVING cnt > 1
  `);

  const idsToDeleteLocal = [];
  for (const row of dupLocal) {
    const ids = row.ids.split(',');
    ids.shift();
    idsToDeleteLocal.push(...ids);
  }

  if (idsToDeleteLocal.length > 0) {
    const res = await prisma.opLocalPurchase.updateMany({
      where: { id: { in: idsToDeleteLocal }, deletedAt: null },
      data:  { deletedAt: now },
    });
    console.log(`  op_local_purchases : ${res.count} doublon(s) supprimé(s) (${dupLocal.length} groupe(s))`);
    total += res.count;
  } else {
    console.log(`  op_local_purchases : aucun doublon`);
  }

  // ── 3. op_turnover_stamps (op_turnover_id NULL) ───────────────────────────
  const resStamps = await prisma.opTurnoverStamp.updateMany({
    where: { opTurnoverId: null, deletedAt: null },
    data:  { deletedAt: now },
  });
  if (resStamps.count > 0) {
    console.log(`  op_turnover_stamps : ${resStamps.count} orphelin(s) (op_turnover_id NULL) supprimé(s)`);
    total += resStamps.count;
  } else {
    console.log(`  op_turnover_stamps : aucun orphelin`);
  }

  console.log(`\nTotal supprimé (soft-delete) : ${total} ligne(s)`);

  // ── Vérification finale ───────────────────────────────────────────────────
  console.log('\nVérification post-suppression :');
  const checks = await Promise.all([
    prisma.$queryRawUnsafe(`
      SELECT COUNT(*) as cnt FROM (
        SELECT 1 FROM op_turnovers WHERE op_turnover_deleted_at IS NULL
        GROUP BY client_id, DATE(op_turnover_date), op_turnover_net, op_turnover_tax, op_turnover_total
        HAVING COUNT(*) > 1
      ) t`),
    prisma.$queryRawUnsafe(`
      SELECT COUNT(*) as cnt FROM (
        SELECT 1 FROM op_local_purchases WHERE op_local_purchase_deleted_at IS NULL
        GROUP BY tier_id, op_local_purchase_month, op_local_purchase_year,
                 op_local_purchase_net, op_local_purchase_tax, op_local_purchase_total
        HAVING COUNT(*) > 1
      ) t`),
    prisma.$queryRawUnsafe(`
      SELECT COUNT(*) as cnt FROM op_turnover_stamps
      WHERE op_turnover_stamp_deleted_at IS NULL AND op_turnover_id IS NULL`),
  ]);

  const s = (r) => String(r[0]?.cnt ?? '0');
  console.log(`  op_turnovers groupes restants     : ${s(checks[0])}`);
  console.log(`  op_local_purchases groupes restants : ${s(checks[1])}`);
  console.log(`  op_turnover_stamps NULL restants  : ${s(checks[2])}`);

  await prisma.$disconnect();
}

main().catch(async e => { console.error(e.message); await prisma.$disconnect(); process.exit(1); });
