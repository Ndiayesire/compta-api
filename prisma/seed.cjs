/* eslint-disable @typescript-eslint/no-require-imports */
/**
 * Seeds all Prisma models (reference data + one demo chain: company → client → employee → contract → tier).
 * Inclut exercices/trimestres comptables (`accounting_years`, `accounting_quarters`), `meta`, ligne `tiers_transactions` démo.
 * Référence inclut notamment les types de pièce d'identité (`settings_identification_type`).
 * Idempotent: fixed UUIDs + upsert.
 *
 *   SEED_ADMIN_PASSWORD — admin bcrypt (default: Admin123!dev)
 *   SEED_SKIP_ADMIN=1   — no demo admin; skips transactional demo rows if no user exists
 */
const { PrismaClient } = require('@prisma/client');
const { PrismaMariaDb } = require('@prisma/adapter-mariadb');
const bcrypt = require('bcrypt');

require('dotenv/config');

function parseDatabaseUrl(url) {
  const parsed = new URL(url);
  return {
    host: parsed.hostname,
    port: parseInt(parsed.port, 10) || 3306,
    user: decodeURIComponent(parsed.username),
    password: decodeURIComponent(parsed.password),
    database: parsed.pathname.replace(/^\//, ''),
    connectionLimit: 5,
    idleTimeout: 60,
    connectTimeout: 30000,
  };
}

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL is not set.');
  process.exit(1);
}

const adapter = new PrismaMariaDb(parseDatabaseUrl(process.env.DATABASE_URL));
const prisma = new PrismaClient({ adapter });

/** Stable UUIDs */
const I = {
  currencyXof: 'a0000001-0000-4000-8000-000000000001',
  currencyEur: 'a0000028-0000-4000-8000-000000000001',
  countrySn: 'a0000002-0000-4000-8000-000000000001',
  regionDakar: 'a0000003-0000-4000-8000-000000000001',
  langFr: 'a0000004-0000-4000-8000-000000000001',
  genderM: 'a0000005-0000-4000-8000-000000000001',
  genderF: 'a0000006-0000-4000-8000-000000000001',
  genderO: 'a0000007-0000-4000-8000-000000000001',
  legalSarl: 'a0000008-0000-4000-8000-000000000001',
  tierTypeCustomer: 'a0000009-0000-4000-8000-000000000001',
  tierTypeSupplier: 'a000000a-0000-4000-8000-000000000001',
  contractCdi: 'a000000b-0000-4000-8000-000000000001',
  contractCdd: 'a000000c-0000-4000-8000-000000000001',
  contractStage: 'a000000d-0000-4000-8000-000000000001',
  pmTypeMobile: 'a000000e-0000-4000-8000-000000000001',
  pmTypeBank: 'a000000f-0000-4000-8000-000000000001',
  pmOm: 'a0000010-0000-4000-8000-000000000001',
  pmWave: 'a0000011-0000-4000-8000-000000000001',
  pmBank: 'a0000012-0000-4000-8000-000000000001',
  permTypeCore: 'a0000013-0000-4000-8000-000000000001',
  permAll: 'a0000014-0000-4000-8000-000000000001',
  roleAdmin: 'a0000015-0000-4000-8000-000000000001',
  roleUser: 'a0000016-0000-4000-8000-000000000001',
  adminUser: 'a0000017-0000-4000-8000-000000000001',
  docCatInvoice: 'a000001c-0000-4000-8000-000000000001',
  docCatProof: 'a000001d-0000-4000-8000-000000000001',
  companyDemo: 'a0000020-0000-4000-8000-000000000001',
  clientDemo: 'a0000021-0000-4000-8000-000000000001',
  employeeDemo: 'a0000022-0000-4000-8000-000000000001',
  empContractDemo: 'a0000023-0000-4000-8000-000000000001',
  tierDemo: 'a0000024-0000-4000-8000-000000000001',
  documentDemo: 'a0000025-0000-4000-8000-000000000001',
  activityDemo: 'a0000026-0000-4000-8000-000000000001',
  notificationDemo: 'a0000027-0000-4000-8000-000000000001',
  /** Types de pièce d'identité (`settings_identification_type`) */
  idTypeCni: 'a0000029-0000-4000-8000-000000000001',
  idTypePassport: 'a000002a-0000-4000-8000-000000000001',
  accountingYearDemo: 'a000002b-0000-4000-8000-000000000001',
  accountingQ1: 'a000002c-0000-4000-8000-000000000001',
  accountingQ2: 'a000002d-0000-4000-8000-000000000001',
  accountingQ3: 'a000002e-0000-4000-8000-000000000001',
  accountingQ4: 'a000002f-0000-4000-8000-000000000001',
  tiersTxDemo: 'a0000030-0000-4000-8000-000000000001',
};

const DEFAULT_ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD || 'Admin123!dev';

async function seedReferenceData() {
  await prisma.currency.upsert({
    where: { id: I.currencyXof },
    create: {
      id: I.currencyXof,
      code: 'XOF',
      name: 'Franc CFA (BCEAO)',
      isActive: true,
    },
    update: { name: 'Franc CFA (BCEAO)', isActive: true },
  });
  await prisma.currency.upsert({
    where: { id: I.currencyEur },
    create: {
      id: I.currencyEur,
      code: 'EUR',
      name: 'Euro',
      isActive: true,
    },
    update: { isActive: true },
  });

  await prisma.country.upsert({
    where: { id: I.countrySn },
    create: {
      id: I.countrySn,
      currencyId: I.currencyXof,
      name: 'Sénégal',
      code: 'SN',
      tva: 18,
      callingCode: '+221',
      isActive: true,
    },
    update: {
      currencyId: I.currencyXof,
      tva: 18,
      callingCode: '+221',
      isActive: true,
    },
  });

  await prisma.region.upsert({
    where: { id: I.regionDakar },
    create: {
      id: I.regionDakar,
      countryId: I.countrySn,
      name: 'Dakar',
      code: 'DK',
      isActive: true,
    },
    update: { isActive: true },
  });

  await prisma.language.upsert({
    where: { id: I.langFr },
    create: {
      id: I.langFr,
      countryId: I.countrySn,
      name: 'Français',
      code: 'fr-SN',
      isActive: true,
    },
    update: { isActive: true },
  });

  for (const g of [
    { id: I.genderM, name: 'Masculin', code: 'M' },
    { id: I.genderF, name: 'Féminin', code: 'F' },
    { id: I.genderO, name: 'Autre', code: 'O' },
  ]) {
    await prisma.gender.upsert({
      where: { id: g.id },
      create: { ...g, isActive: true },
      update: { name: g.name, isActive: true },
    });
  }

  const legalForms = [
    { id: I.legalSarl, name: 'SARL', code: 'SARL' },
    { id: 'a0000018-0000-4000-8000-000000000001', name: 'SA', code: 'SA' },
    { id: 'a0000019-0000-4000-8000-000000000001', name: 'SAS', code: 'SAS' },
    { id: 'a000001a-0000-4000-8000-000000000001', name: 'EI', code: 'EI' },
    { id: 'a000001b-0000-4000-8000-000000000001', name: 'GIE', code: 'GIE' },
  ];
  for (const lf of legalForms) {
    await prisma.legalForm.upsert({
      where: { id: lf.id },
      create: { ...lf, isActive: true },
      update: { name: lf.name, isActive: true },
    });
  }

  await prisma.tierType.upsert({
    where: { id: I.tierTypeCustomer },
    create: {
      id: I.tierTypeCustomer,
      name: 'Client',
      code: 'CUSTOMER',
      isActive: true,
    },
    update: { isActive: true },
  });
  await prisma.tierType.upsert({
    where: { id: I.tierTypeSupplier },
    create: {
      id: I.tierTypeSupplier,
      name: 'Fournisseur',
      code: 'SUPPLIER',
      isActive: true,
    },
    update: { isActive: true },
  });

  const contracts = [
    { id: I.contractCdi, name: 'CDI', code: 'CDI' },
    { id: I.contractCdd, name: 'CDD', code: 'CDD' },
    { id: I.contractStage, name: 'Stage', code: 'STAGE' },
  ];
  for (const c of contracts) {
    await prisma.contractType.upsert({
      where: { id: c.id },
      create: { ...c, isActive: true },
      update: { name: c.name, isActive: true },
    });
  }

  await prisma.paymentMethodType.upsert({
    where: { id: I.pmTypeMobile },
    create: {
      id: I.pmTypeMobile,
      name: 'Mobile money',
      code: 'MOBILE_MONEY',
      isActive: true,
    },
    update: { isActive: true },
  });
  await prisma.paymentMethodType.upsert({
    where: { id: I.pmTypeBank },
    create: {
      id: I.pmTypeBank,
      name: 'Banque / virement',
      code: 'BANK',
      isActive: true,
    },
    update: { isActive: true },
  });

  await prisma.paymentMethod.upsert({
    where: { id: I.pmOm },
    create: {
      id: I.pmOm,
      typeId: I.pmTypeMobile,
      name: 'Orange Money',
      code: 'OM',
      avatar: '/icons/orange-money.svg',
      isActive: true,
    },
    update: { isActive: true },
  });
  await prisma.paymentMethod.upsert({
    where: { id: I.pmWave },
    create: {
      id: I.pmWave,
      typeId: I.pmTypeMobile,
      name: 'Wave',
      code: 'WAVE',
      avatar: '/icons/wave.svg',
      isActive: true,
    },
    update: { isActive: true },
  });
  await prisma.paymentMethod.upsert({
    where: { id: I.pmBank },
    create: {
      id: I.pmBank,
      typeId: I.pmTypeBank,
      name: 'Virement bancaire',
      code: 'WIRE',
      avatar: '/icons/bank.svg',
      isActive: true,
    },
    update: { isActive: true },
  });

  await prisma.permissionType.upsert({
    where: { id: I.permTypeCore },
    create: {
      id: I.permTypeCore,
      name: 'Core',
      code: 'core',
      isActive: true,
    },
    update: { isActive: true },
  });

  await prisma.permission.upsert({
    where: { id: I.permAll },
    create: {
      id: I.permAll,
      typeId: I.permTypeCore,
      name: 'Tout accès',
      code: '*:*',
      isActive: true,
    },
    update: { isActive: true },
  });

  await prisma.role.upsert({
    where: { id: I.roleAdmin },
    create: {
      id: I.roleAdmin,
      name: 'Administrateur',
      code: 'ADMIN',
      isActive: true,
    },
    update: { isActive: true },
  });
  await prisma.role.upsert({
    where: { id: I.roleUser },
    create: {
      id: I.roleUser,
      name: 'Utilisateur',
      code: 'USER',
      isActive: true,
    },
    update: { isActive: true },
  });

  await prisma.rolePermission.upsert({
    where: {
      roleId_permissionId: { roleId: I.roleAdmin, permissionId: I.permAll },
    },
    create: {
      roleId: I.roleAdmin,
      permissionId: I.permAll,
      isActive: true,
    },
    update: { isActive: true },
  });

  await prisma.documentCategory.upsert({
    where: { id: I.docCatInvoice },
    create: {
      id: I.docCatInvoice,
      name: 'Factures',
      code: 'INVOICE',
      isActive: true,
    },
    update: { isActive: true },
  });
  await prisma.documentCategory.upsert({
    where: { id: I.docCatProof },
    create: {
      id: I.docCatProof,
      name: 'Justificatifs',
      code: 'PROOF',
      isActive: true,
    },
    update: { isActive: true },
  });

  const identificationTypes = [
    { id: I.idTypeCni, name: "Carte nationale d'identité", code: 'CNI' },
    { id: I.idTypePassport, name: 'Passeport', code: 'PASSPORT' },
  ];
  for (const it of identificationTypes) {
    await prisma.identificationType.upsert({
      where: { id: it.id },
      create: { ...it, isActive: true },
      update: { name: it.name, code: it.code, isActive: true },
    });
  }
}

/**
 * Méta (bornes trimestres / année) + exercice 2025 + 4 trimestres — idempotent (upsert).
 */
async function seedAccountingCatalog() {
  const metaRows = [
    {
      key: 'accounting_quarter_1',
      value: '{"start_date":"01-01","end_date":"03-31"}',
    },
    {
      key: 'accounting_quarter_2',
      value: '{"start_date":"04-01","end_date":"06-30"}',
    },
    {
      key: 'accounting_quarter_3',
      value: '{"start_date":"07-01","end_date":"09-30"}',
    },
    {
      key: 'accounting_quarter_4',
      value: '{"start_date":"10-01","end_date":"12-31"}',
    },
    {
      key: 'accounting_year',
      value: '{"start_date":"01-01","end_date":"12-31"}',
    },
  ];
  for (const row of metaRows) {
    await prisma.appMeta.upsert({
      where: { key: row.key },
      create: { key: row.key, value: row.value },
      update: { value: row.value, deletedAt: null },
    });
  }

  await prisma.accountingYear.upsert({
    where: { id: I.accountingYearDemo },
    create: {
      id: I.accountingYearDemo,
      name: 'Exercice 2025 (seed)',
      startDate: new Date('2025-01-01T00:00:00.000Z'),
      endDate: new Date('2025-12-31T00:00:00.000Z'),
      isActive: true,
    },
    update: {
      name: 'Exercice 2025 (seed)',
      startDate: new Date('2025-01-01T00:00:00.000Z'),
      endDate: new Date('2025-12-31T00:00:00.000Z'),
      isActive: true,
      deletedAt: null,
    },
  });

  const quarters = [
    {
      id: I.accountingQ1,
      name: 'T1 2025',
      monthStart: '2025-01-01',
      end: '2025-03-31',
    },
    {
      id: I.accountingQ2,
      name: 'T2 2025',
      monthStart: '2025-04-01',
      end: '2025-06-30',
    },
    {
      id: I.accountingQ3,
      name: 'T3 2025',
      monthStart: '2025-07-01',
      end: '2025-09-30',
    },
    {
      id: I.accountingQ4,
      name: 'T4 2025',
      monthStart: '2025-10-01',
      end: '2025-12-31',
    },
  ];
  for (const q of quarters) {
    await prisma.accountingQuarter.upsert({
      where: { id: q.id },
      create: {
        id: q.id,
        accountingYearId: I.accountingYearDemo,
        name: q.name,
        monthStartDate: new Date(`${q.monthStart}T00:00:00.000Z`),
        endDate: new Date(`${q.end}T00:00:00.000Z`),
        isActive: true,
      },
      update: {
        accountingYearId: I.accountingYearDemo,
        name: q.name,
        monthStartDate: new Date(`${q.monthStart}T00:00:00.000Z`),
        endDate: new Date(`${q.end}T00:00:00.000Z`),
        isActive: true,
        deletedAt: null,
      },
    });
  }
}

async function seedAdminUser() {
  const hash = await bcrypt.hash(DEFAULT_ADMIN_PASSWORD, 10);
  await prisma.user.upsert({
    where: { email: 'admin@localhost.dev' },
    create: {
      id: I.adminUser,
      email: 'admin@localhost.dev',
      password: hash,
      firstName: 'Admin',
      lastName: 'Système',
      phone: '+221000000000',
      address: 'Dakar',
      avatar: '',
      roleId: I.roleAdmin,
      countryId: I.countrySn,
      regionId: I.regionDakar,
      languageId: I.langFr,
      genderId: I.genderO,
      isActive: true,
    },
    update: {
      roleId: I.roleAdmin,
      countryId: I.countrySn,
      regionId: I.regionDakar,
      languageId: I.langFr,
      genderId: I.genderO,
      isActive: true,
    },
  });
}

/**
 * company → client → employee + contract → tier → document → activity → notification
 */
async function seedDemoChain(seedUserId) {
  await prisma.company.upsert({
    where: { id: I.companyDemo },
    create: {
      id: I.companyDemo,
      userId: seedUserId,
      countryId: I.countrySn,
      regionId: I.regionDakar,
      legalFormId: I.legalSarl,
      name: 'Entreprise démo SARL',
      email: 'contact@demo.local',
      phone: '+221330000000',
      address: 'Plateau, Dakar',
      ninea: 'SN123456789',
      useTva: true,
      reference: 'REF-DEMO-001',
      meta: { seeded: true },
    },
    update: {
      userId: seedUserId,
      meta: { seeded: true },
    },
  });

  await prisma.client.upsert({
    where: { id: I.clientDemo },
    create: {
      id: I.clientDemo,
      userId: seedUserId,
      companyId: I.companyDemo,
      countryId: I.countrySn,
      regionId: I.regionDakar,
      legalFormId: I.legalSarl,
      name: 'Client démo',
      address: 'Almadies, Dakar',
      postalCode: '12500',
      ninea: 'SN987654321',
      useTva: true,
      meta: { seeded: true },
    },
    update: {
      companyId: I.companyDemo,
      postalCode: '12500',
      meta: { seeded: true },
    },
  });

  await prisma.employee.upsert({
    where: { id: I.employeeDemo },
    create: {
      id: I.employeeDemo,
      clientId: I.clientDemo,
      identificationTypeId: I.idTypeCni,
      firstName: 'Amadou',
      lastName: 'Diallo',
      email: 'amadou.diallo@demo.client',
      phone: '+221771112233',
      address: 'Dakar',
      isActive: true,
      socialInsuranceNumber: '1 85 01 75 123 456 78',
      identityNumber: 'SN-DEMO-CNI-001',
    },
    update: {
      identificationTypeId: I.idTypeCni,
      socialInsuranceNumber: '1 85 01 75 123 456 78',
      identityNumber: 'SN-DEMO-CNI-001',
      isActive: true,
    },
  });

  const start = new Date('2024-01-01T00:00:00.000Z');
  const end = new Date('2025-12-31T23:59:59.000Z');
  await prisma.employeeContractType.upsert({
    where: { id: I.empContractDemo },
    create: {
      id: I.empContractDemo,
      employeeId: I.employeeDemo,
      contractTypeId: I.contractCdi,
      startDate: start,
      endDate: end,
      jobTitle: 'Comptable',
      salary: 450000,
      isManager: false,
      isActive: true,
    },
    update: {
      contractTypeId: I.contractCdi,
      jobTitle: 'Comptable',
      salary: 450000,
      isManager: false,
      isActive: true,
    },
  });

  await prisma.tier.upsert({
    where: { id: I.tierDemo },
    create: {
      id: I.tierDemo,
      tierTypeId: I.tierTypeCustomer,
      clientId: I.clientDemo,
      name: 'Tier démo (client)',
      ninea: 'SN111222333',
      useTva: true,
      reference: 'TIER-DEMO-1',
      meta: { seeded: true },
      isActive: true,
    },
    update: {
      meta: { seeded: true },
      isActive: true,
    },
  });

  await prisma.tiersTransaction.upsert({
    where: { id: I.tiersTxDemo },
    create: {
      id: I.tiersTxDemo,
      tierId: I.tierDemo,
      transactionId: 'SEED-TX-001',
      net: 100000,
      tax: 18000,
      total: 118000,
      date: new Date('2025-04-15T00:00:00.000Z'),
    },
    update: {
      tierId: I.tierDemo,
      transactionId: 'SEED-TX-001',
      net: 100000,
      tax: 18000,
      total: 118000,
      date: new Date('2025-04-15T00:00:00.000Z'),
      deletedAt: null,
    },
  });

  await prisma.document.upsert({
    where: { id: I.documentDemo },
    create: {
      id: I.documentDemo,
      categoryId: I.docCatInvoice,
      companyId: I.companyDemo,
      name: 'facture-demo.pdf',
      path: '/uploads/seed/facture-demo.pdf',
      mimeType: 'application/pdf',
      size: 1024,
      meta: { seeded: true },
    },
    update: {
      categoryId: I.docCatInvoice,
      companyId: I.companyDemo,
      meta: { seeded: true },
    },
  });

  await prisma.activity.upsert({
    where: { id: I.activityDemo },
    create: {
      id: I.activityDemo,
      userId: seedUserId,
      title: 'Seed — base initialisée',
      styleClass: 'info',
      icon: 'check',
      desc: 'Données de démonstration chargées.',
      meta: { seeded: true },
    },
    update: {
      title: 'Seed — base initialisée',
      meta: { seeded: true },
    },
  });

  await prisma.notification.upsert({
    where: { id: I.notificationDemo },
    create: {
      id: I.notificationDemo,
      userId: seedUserId,
      title: 'Bienvenue',
      desc: 'Compta-api : jeu de données de démonstration actif.',
      styleClass: 'success',
      icon: 'bell',
      isRead: false,
      link: '/dashboard',
      meta: { seeded: true },
    },
    update: {
      meta: { seeded: true },
    },
  });
}

async function main() {
  await seedReferenceData();
  await seedAccountingCatalog();

  if (process.env.SEED_SKIP_ADMIN === '1') {
    const anyUser = await prisma.user.findFirst();
    if (anyUser) {
      await seedDemoChain(anyUser.id);
    } else {
      console.log('Seed: reference OK; demo chain skipped (no user).');
    }
    console.log('Seed completed (admin skipped).');
    return;
  }

  await seedAdminUser();
  const admin = await prisma.user.findUnique({
    where: { email: 'admin@localhost.dev' },
  });
  if (!admin) {
    throw new Error('Admin user missing after seedAdminUser');
  }
  await seedDemoChain(admin.id);

  console.log('Seed completed (all tables).');
  console.log('  Demo admin: admin@localhost.dev /', DEFAULT_ADMIN_PASSWORD);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
