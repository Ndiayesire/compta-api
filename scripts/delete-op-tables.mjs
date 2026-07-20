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
  const results = await prisma.$transaction([
    prisma.opTurnoverStamp.deleteMany(),
    prisma.opTurnover.deleteMany(),
    prisma.opLocalPurchase.deleteMany(),
    prisma.opSuspension.deleteMany(),
    prisma.opImportation.deleteMany(),
    prisma.opExportation.deleteMany(),
    prisma.opRetain.deleteMany(),
    prisma.opRoyalty.deleteMany(),
    prisma.opExemption.deleteMany(),
  ]);

  const tables = [
    'op_turnover_stamps', 'op_turnovers', 'op_local_purchases',
    'op_suspensions', 'op_importations', 'op_exportations',
    'op_retains', 'op_royalties', 'op_exemptions',
  ];

  results.forEach((r, i) => console.log(`  ${tables[i].padEnd(22)}: ${r.count} ligne(s) supprimée(s)`));
  console.log('\nToutes les tables op_* vidées.');
  await prisma.$disconnect();
}

main().catch(async e => { console.error(e.message); await prisma.$disconnect(); process.exit(1); });
