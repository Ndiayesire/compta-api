const fs = require('fs');
const path = require('path');

const PROJECT = path.join(__dirname, '..');
const ROOT = path.join(PROJECT, 'src', 'modules');

const FOLDER_MODELS = {
  'src/app': [],
  'src/modules/auth': ['User'],
  'src/modules/users': ['User', 'Role'],
  'src/modules/company': ['Company'],
  'src/modules/clients': ['Client'],
  'src/modules/employees': ['Employee'],
  'src/modules/employee-contracts': ['EmployeeContractType'],
  'src/modules/tiers': ['Tier'],
  'src/modules/tiers-transactions': ['TiersTransaction'],
  'src/modules/balances': ['Balance', 'BalanceLine'],
  'src/modules/rentals': ['Rental'],
  'src/modules/rental-usages': ['RentalUsage'],
  'src/modules/documents': ['Document'],
  'src/modules/accounting-years': ['AccountingYear'],
  'src/modules/accounting-quarters': ['AccountingQuarter'],
  'src/modules/op-turnovers': ['OpTurnover', 'OpTurnoverStamp'],
  'src/modules/op-local-purchases': ['OpLocalPurchase'],
  'src/modules/op-suspensions': ['OpSuspension'],
  'src/modules/op-importations': ['OpImportation'],
  'src/modules/op-exportations': ['OpExportation'],
  'src/modules/op-retains': ['OpRetain'],
  'src/modules/op-royalties': ['OpRoyalty'],
  'src/modules/op-exemptions': ['OpExemption'],
  'src/modules/activities': ['Activity'],
  'src/modules/notifications': ['Notification'],
  'src/modules/app-meta': ['AppMeta'],
  'src/modules/settings/countries': ['Country'],
  'src/modules/settings/regions': ['Region'],
  'src/modules/settings/currency': ['Currency'],
  'src/modules/settings/legal-forms': ['LegalForm'],
  'src/modules/settings/genders': ['Gender'],
  'src/modules/settings/languages': ['Language'],
  'src/modules/settings/payment-methods': ['PaymentMethod'],
  'src/modules/settings/contract-types': ['ContractType'],
  'src/modules/settings/identification-types': ['IdentificationType'],
  'src/modules/settings/tier-types': ['TierType'],
  'src/modules/settings/document-categories': ['DocumentCategory'],
  'src/modules/settings/permissions': ['Permission'],
  'src/modules/settings/roles': ['Role'],
  'src/modules/settings/deduction-types': ['DeductionType'],
  'src/modules/settings/property-nature-types': ['PropertyNatureType'],
  'src/modules/excel-reports': [],
};

function readRoute(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const m = content.match(/@Controller\(\s*['"]([^'"]+)['"]\s*\)/);
  if (!m) return null;
  const r = m[1].startsWith('/') ? m[1] : `/${m[1]}`;
  return r.replace(/\/+/g, '/');
}

function toPascal(kebab) {
  return kebab
    .split('-')
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join('');
}

function rel(p) {
  return path.relative(PROJECT, p).replace(/\\/g, '/');
}

function stripImports(code) {
  return code.replace(/^import\s+.+;\s*\r?\n/gm, '').trim();
}

function readTsFiles(dir, suffix) {
  const found = [];
  function walk(d) {
    if (!fs.existsSync(d)) return;
    for (const f of fs.readdirSync(d, { withFileTypes: true })) {
      const p = path.join(d, f.name);
      if (f.isDirectory()) walk(p);
      else if (f.name.endsWith(suffix) && !f.name.endsWith('.spec.ts')) found.push(p);
    }
  }
  walk(dir);
  return found;
}

function moduleDir(folder) {
  if (folder === 'src/app') return path.join(PROJECT, 'src');
  return path.join(PROJECT, folder);
}

function extractHttpRoutes(ctrlCode, routePrefix) {
  const lines = [];
  const re = /@(Get|Post|Patch|Delete|Put)\(\s*['"]?([^'")]*)['"]?\s*\)/g;
  let m;
  while ((m = re.exec(ctrlCode))) {
    const part = m[2] ? (m[2].startsWith('/') ? m[2] : `/${m[2]}`) : '';
    lines.push(`${m[1].toUpperCase()} ${routePrefix}${part}`);
  }
  return lines.length ? lines.join('\n') : `// Route de base\n${routePrefix}`;
}

function extractPrismaLines(serviceCode) {
  const lines = serviceCode.split(/\r?\n/).filter((line) =>
    /(?:this\.)?prisma\.|prisma\.\$|\btx\.\w+\./.test(line),
  );
  return lines.length ? lines.join('\n') : '// Aucun appel Prisma détecté';
}

function extractModelsFromSchema(modelNames) {
  if (!modelNames.length) return '// Pas de modèle Prisma associé';
  const schema = fs.readFileSync(path.join(PROJECT, 'prisma', 'schema.prisma'), 'utf8');
  const blocks = [];
  for (const model of modelNames) {
    const re = new RegExp(`model\\s+${model}\\s*\\{([^}]+)\\}`, 's');
    const m = schema.match(re);
    if (m) blocks.push(`model ${model} {\n${m[1].trim()}\n}`);
  }
  return blocks.length ? blocks.join('\n\n') : `// Modèles : ${modelNames.join(', ')}`;
}

function extractOutputPattern(ctrlCode) {
  const samples = [];
  const re = /return\s*\{\s*success:\s*true[\s\S]*?\};/g;
  let m;
  while ((m = re.exec(ctrlCode))) samples.push(m[0]);
  return samples.length ? samples.join('\n\n') : `return {\n  success: true,\n  message: '…',\n  data,\n};`;
}

function buildSnippets(mod) {
  const dir = moduleDir(mod.folder);
  const ctrlFiles = readTsFiles(dir, '.controller.ts');
  const svcFiles = readTsFiles(dir, '.service.ts');
  const ctrlFile = ctrlFiles.find((f) => mod.controllers.some((c) => f.includes(c.replace(/Controller$/, '').toLowerCase().replace(/([A-Z])/g, '-$1').replace(/^-/, '')))) || ctrlFiles[0];
  const svcFile = svcFiles[0];
  const dtoDir = path.join(dir, 'dto');

  const ctrlCode = ctrlFile && fs.existsSync(ctrlFile) ? fs.readFileSync(ctrlFile, 'utf8') : '';
  const svcCode = svcFiles.map((f) => fs.readFileSync(f, 'utf8')).join('\n\n// ---\n\n');
  const routePrefix = mod.route === '(interne)' ? '(interne)' : mod.route;

  const dtoCode = fs.existsSync(dtoDir)
    ? fs
        .readdirSync(dtoDir)
        .filter((f) => f.endsWith('.dto.ts'))
        .map((f) => `// ${f}\n${stripImports(fs.readFileSync(path.join(dtoDir, f), 'utf8'))}`)
        .join('\n\n')
    : '';

  const models = FOLDER_MODELS[mod.folder] || [];

  return {
    entry: {
      file: ctrlFile ? rel(ctrlFile) : mod.route,
      code: mod.route === '(interne)' ? '// Module interne — pas de route HTTP\n// Injecté dans TiersModule' : extractHttpRoutes(ctrlCode, routePrefix),
    },
    controller: {
      file: ctrlFile ? rel(ctrlFile) : '—',
      code: ctrlCode ? stripImports(ctrlCode) : '// Pas de controller',
    },
    dto: {
      file: fs.existsSync(dtoDir) ? `${mod.folder}/dto/` : '—',
      code: dtoCode || '// Pas de DTO',
    },
    service: {
      file: svcFiles.map(rel).join(', ') || '—',
      code: svcCode ? stripImports(svcCode) : '// Pas de service',
    },
    prisma: {
      file: svcFiles[0] ? rel(svcFiles[0]) : '—',
      code: extractPrismaLines(svcCode),
    },
    mysql: {
      file: 'prisma/schema.prisma',
      code: extractModelsFromSchema(models),
    },
    output: {
      file: ctrlFile ? rel(ctrlFile) : '—',
      code: extractOutputPattern(ctrlCode),
    },
  };
}

function serviceNames(moduleDir) {
  const found = [];
  function walk(dir) {
    for (const f of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, f.name);
      if (f.isDirectory()) walk(p);
      else if (f.name.endsWith('.service.ts') && !f.name.endsWith('.spec.ts')) {
        found.push(toPascal(f.name.replace('.service.ts', '')) + 'Service');
      }
    }
  }
  walk(moduleDir);
  return found;
}

function dtoNames(moduleDir) {
  const dtoDir = path.join(moduleDir, 'dto');
  if (!fs.existsSync(dtoDir)) return [];
  return fs
    .readdirSync(dtoDir)
    .filter((f) => f.endsWith('.dto.ts'))
    .map((f) => {
      const base = toPascal(f.replace('.dto.ts', ''));
      return base.endsWith('Dto') ? base : `${base}Dto`;
    });
}

function zoneFor(folder) {
  if (['auth', 'users', 'company', 'clients'].includes(folder)) return 'core';
  if (['activities', 'notifications'].includes(folder)) return 'perso';
  if (['op-turnovers', 'op-local-purchases', 'op-suspensions', 'op-importations', 'op-exportations', 'op-retains', 'op-royalties', 'op-exemptions'].includes(folder)) return 'fiscal';
  if (['deduction-types', 'property-nature-types'].includes(folder)) return 'fiscal';
  if (['app-meta'].includes(folder)) return 'app';
  if (folder.startsWith('settings/')) return 'settings';
  return 'metier';
}

const modules = [];

const appRoute = readRoute(path.join(PROJECT, 'src', 'app.controller.ts'));
modules.push({
  zone: 'app',
  folder: 'src/app',
  route: appRoute || '/health',
  controllers: ['AppController'],
  services: ['AppService'],
  dtos: [],
  notes: '@Public() health check',
});

function scanModule(moduleDirPath, folder) {
  const controllers = fs.readdirSync(moduleDirPath).filter((f) => f.endsWith('.controller.ts') && !f.endsWith('.spec.ts'));
  if (!controllers.length) return;
  for (const cf of controllers) {
    const route = readRoute(path.join(moduleDirPath, cf));
    const ctrlBase = cf.replace('.controller.ts', '');
    const ctrlName = `${toPascal(ctrlBase)}Controller`;
    modules.push({
      zone: folder.startsWith('settings/') ? 'settings' : zoneFor(ctrlBase === 'currency' ? 'currency' : folder.split('/').pop()),
      folder: `src/modules/${folder}`,
      route: route || `/${ctrlBase}`,
      controllers: [ctrlName],
      services: serviceNames(moduleDirPath),
      dtos: dtoNames(moduleDirPath),
    });
  }
}

for (const entry of fs.readdirSync(ROOT, { withFileTypes: true })) {
  if (!entry.isDirectory() || entry.name === 'mailer') continue;
  if (entry.name === 'settings') {
    for (const sub of fs.readdirSync(path.join(ROOT, 'settings'), { withFileTypes: true })) {
      if (sub.isDirectory()) scanModule(path.join(ROOT, 'settings', sub.name), `settings/${sub.name}`);
    }
    continue;
  }
  if (entry.name === 'excel-reports') {
    modules.push({
      zone: 'metier',
      folder: 'src/modules/excel-reports',
      route: '(interne)',
      controllers: [],
      services: serviceNames(path.join(ROOT, 'excel-reports')),
      dtos: [],
      notes: 'Injecté dans TiersModule — exports Excel DGID',
    });
    continue;
  }
  scanModule(path.join(ROOT, entry.name), entry.name);
}

modules.forEach((m) => {
  if (m.folder.includes('/settings/deduction-types') || m.folder.includes('/settings/property-nature-types')) {
    m.zone = 'fiscal';
  }
  m.snippets = buildSnippets(m);
});

modules.sort((a, b) => a.route.localeCompare(b.route));
const out = { generated: new Date().toISOString(), count: modules.length, modules };
fs.writeFileSync(path.join(PROJECT, 'public', 'architecture-data.json'), JSON.stringify(out, null, 2));
console.log('OK', modules.length, 'modules');
