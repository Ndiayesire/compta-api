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
  const [turnovers, exportations, retains, importations, localPurchases] = await Promise.all([
    prisma.opTurnover.findMany({ take: 10, select: { clientId: true, date: true, net: true, tax: true, total: true }, orderBy: { date: 'desc' } }),
    prisma.opExportation.findMany({ take: 10, select: { tier: { select: { clientId: true } }, month: true, year: true, net: true }, orderBy: { year: 'desc' } }),
    prisma.opRetain.findMany({ take: 10, select: { tier: { select: { clientId: true } }, month: true, year: true, amount: true }, orderBy: { year: 'desc' } }),
    prisma.opImportation.findMany({ take: 10, select: { tier: { select: { clientId: true } }, month: true, year: true, net: true, tax: true }, orderBy: { year: 'desc' } }),
    prisma.opLocalPurchase.findMany({ take: 10, select: { tier: { select: { clientId: true } }, month: true, year: true, net: true, tax: true }, orderBy: { year: 'desc' } }),
  ]);

  console.log('=== opTurnovers ===');
  turnovers.forEach(r => console.log(JSON.stringify({ clientId: r.clientId, date: r.date?.toISOString().slice(0,7), net: r.net, tax: r.tax, total: r.total })));

  console.log('\n=== opExportations ===');
  exportations.forEach(r => console.log(JSON.stringify({ clientId: r.tier?.clientId, month: r.month, year: r.year, net: r.net })));

  console.log('\n=== opRetains ===');
  retains.forEach(r => console.log(JSON.stringify({ clientId: r.tier?.clientId, month: r.month, year: r.year, amount: r.amount })));

  console.log('\n=== opImportations ===');
  importations.forEach(r => console.log(JSON.stringify({ clientId: r.tier?.clientId, month: r.month, year: r.year, net: r.net, tax: r.tax })));

  console.log('\n=== opLocalPurchases ===');
  localPurchases.forEach(r => console.log(JSON.stringify({ clientId: r.tier?.clientId, month: r.month, year: r.year, net: r.net, tax: r.tax })));

  await prisma.$disconnect();
}
main().catch(async e => { console.error(e.message); await prisma.$disconnect(); });
