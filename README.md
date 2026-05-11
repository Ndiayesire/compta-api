# ComptaHub API

API backend NestJS pour la gestion comptable et fiscale de cabinets et entreprises (contexte Afrique francophone).

## Description

Le projet fournit une API modulaire avec authentification JWT, gestion multi-modules metier et generation d'etats Excel (DGID).

Fonctionnalites principales:

- Authentification JWT (access + refresh)
- Gestion des utilisateurs, societes, clients, tiers, employes et contrats
- Modules settings (pays, regions, roles, permissions, devises, etc.)
- Gestion documentaire (metadonnees)
- Exports Excel trimestriels et annuels des sommes versees
- Notifications et activites utilisateur

Note: l'export PDF des tiers n'est plus actif dans le code.

## Stack technique

- NestJS
- TypeScript (strict)
- Prisma ORM
- MySQL / MariaDB
- Swagger
- Jest / Supertest

## Structure (resume)

```txt
src/
  common/
  modules/
    auth/
    users/
    company/
    clients/
    tiers/
    employees/
    employee-contracts/
    documents/
    activities/
    notifications/
    accounting-years/
    accounting-quarters/
    excel-reports/
    settings/
  main.ts
prisma/
```

## Installation

```bash
# 1) Installer les dependances
npm install

# 2) Generer Prisma
npx prisma generate

# 3) Appliquer les migrations
npx prisma migrate dev

# 4) Lancer l'API en dev
npm run start:dev
```

API: `http://localhost:4230` (ou selon `PORT`).

## Variables d'environnement

Copier `.env.example` vers `.env`, puis renseigner au minimum:

```env
DATABASE_URL=
JWT_SECRET=
JWT_REFRESH_SECRET=
NODE_ENV=development
PORT=4230
SWAGGER_ENABLED=true
```

## Scripts utiles

```bash
npm run start:dev
npm run build
npm run test
npm run test:e2e
npm run seed
```

## Documentation API

Swagger est expose sur la racine de l'application (voir `src/main.ts`):

- `GET /`

## Tests

- Unitaires: `npm test`
- End-to-end: `npm run test:e2e`

La suite unitaire passe actuellement dans ce repo.