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

async function main() {
  // Doublon = même (tierId ou clientId, month, year, + champs métier clés)
  // Pour opTurnover : même (clientId, date, net, tax, total)
  // Pour les autres : même (tierId, month, year, + montants)

  const queries = [
    {
      name: 'op_turnovers',
      sql: `SELECT client_id, DATE_FORMAT(op_turnover_date,'%Y-%m') as periode,
                   op_turnover_net as net, op_turnover_tax as tax, op_turnover_total as total,
                   COUNT(*) as cnt
            FROM op_turnovers
            WHERE op_turnover_deleted_at IS NULL
            GROUP BY client_id, DATE_FORMAT(op_turnover_date,'%Y-%m'), op_turnover_net, op_turnover_tax, op_turnover_total
            HAVING cnt > 1
            ORDER BY cnt DESC LIMIT 20`,
    },
    {
      name: 'op_exportations',
      sql: `SELECT tier_id, op_exportation_month as month, op_exportation_year as year,
                   op_exportation_net as net, op_exportation_tax as tax, op_exportation_total as total,
                   COUNT(*) as cnt
            FROM op_exportations
            WHERE op_exportation_deleted_at IS NULL
            GROUP BY tier_id, op_exportation_month, op_exportation_year, op_exportation_net, op_exportation_tax, op_exportation_total
            HAVING cnt > 1
            ORDER BY cnt DESC LIMIT 20`,
    },
    {
      name: 'op_local_purchases',
      sql: `SELECT tier_id, op_local_purchase_month as month, op_local_purchase_year as year,
                   op_local_purchase_net as net, op_local_purchase_tax as tax, op_local_purchase_total as total,
                   COUNT(*) as cnt
            FROM op_local_purchases
            WHERE op_local_purchase_deleted_at IS NULL
            GROUP BY tier_id, op_local_purchase_month, op_local_purchase_year, op_local_purchase_net, op_local_purchase_tax, op_local_purchase_total
            HAVING cnt > 1
            ORDER BY cnt DESC LIMIT 20`,
    },
    {
      name: 'op_suspensions',
      sql: `SELECT tier_id, op_suspension_month as month, op_suspension_year as year,
                   op_suspension_net as net, op_suspension_tax as tax, op_suspension_total as total,
                   COUNT(*) as cnt
            FROM op_suspensions
            WHERE op_suspension_deleted_at IS NULL
            GROUP BY tier_id, op_suspension_month, op_suspension_year, op_suspension_net, op_suspension_tax, op_suspension_total
            HAVING cnt > 1
            ORDER BY cnt DESC LIMIT 20`,
    },
    {
      name: 'op_importations',
      sql: `SELECT tier_id, op_importation_month as month, op_importation_year as year,
                   op_importation_net as net, op_importation_tax as tax, op_importation_total as total,
                   COUNT(*) as cnt
            FROM op_importations
            WHERE op_importation_deleted_at IS NULL
            GROUP BY tier_id, op_importation_month, op_importation_year, op_importation_net, op_importation_tax, op_importation_total
            HAVING cnt > 1
            ORDER BY cnt DESC LIMIT 20`,
    },
    {
      name: 'op_retains',
      sql: `SELECT tier_id, op_retain_month as month, op_retain_year as year,
                   op_retain_amount as amount, op_retain_base as base, op_retain_rate as rate,
                   COUNT(*) as cnt
            FROM op_retains
            WHERE op_retain_deleted_at IS NULL
            GROUP BY tier_id, op_retain_month, op_retain_year, op_retain_amount, op_retain_base, op_retain_rate
            HAVING cnt > 1
            ORDER BY cnt DESC LIMIT 20`,
    },
    {
      name: 'op_exemptions',
      sql: `SELECT tier_id, op_exemption_month as month, op_exemption_year as year,
                   op_exemption_amount as amount,
                   COUNT(*) as cnt
            FROM op_exemptions
            WHERE op_exemption_deleted_at IS NULL
            GROUP BY tier_id, op_exemption_month, op_exemption_year, op_exemption_amount
            HAVING cnt > 1
            ORDER BY cnt DESC LIMIT 20`,
    },
    {
      name: 'op_royalties',
      sql: `SELECT tier_id, op_royalty_month as month, op_royalty_year as year,
                   op_royalty_base as base, op_royalty_rate as rate, op_royalty_amount as amount,
                   COUNT(*) as cnt
            FROM op_royalties
            WHERE op_royalty_deleted_at IS NULL
            GROUP BY tier_id, op_royalty_month, op_royalty_year, op_royalty_base, op_royalty_rate, op_royalty_amount
            HAVING cnt > 1
            ORDER BY cnt DESC LIMIT 20`,
    },
    {
      name: 'op_turnover_stamps',
      sql: `SELECT op_turnover_id, COUNT(*) as cnt
            FROM op_turnover_stamps
            WHERE op_turnover_stamp_deleted_at IS NULL
            GROUP BY op_turnover_id
            HAVING cnt > 1
            ORDER BY cnt DESC LIMIT 20`,
    },
  ];

  let totalDuplicates = 0;

  for (const q of queries) {
    const rows = await prisma.$queryRawUnsafe(q.sql);
    if (rows.length === 0) {
      console.log(`  ✅  ${q.name.padEnd(22)} — aucun doublon`);
    } else {
      console.log(`  ⚠️  ${q.name.padEnd(22)} — ${rows.length} groupe(s) de doublons :`);
      rows.forEach(r => console.log('      ', JSON.stringify(r, (_, v) => typeof v === 'bigint' ? v.toString() : v)));
      totalDuplicates += rows.length;
    }
  }

  console.log(`\nTotal groupes en doublon : ${totalDuplicates}`);
  await prisma.$disconnect();
}

main().catch(async e => { console.error(e.message); await prisma.$disconnect(); process.exit(1); });
