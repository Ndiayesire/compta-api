# CLAUDE.md — compta-api

## Vision du Projet
Plateforme SaaS de gestion comptable et déclarations fiscales, ciblant les PME et cabinets d’expertise comptable en Afrique francophone. Trois acteurs principaux : Admin/Comptable, Client entreprise, Utilisateur interne (consultant).

## Stack Technique
- Langage : TypeScript strict partout
- Backend (app/api)
  - NestJS 10+ (modules, guards, intercepteurs)
  - Prisma ORM + MySQL / MariaDB
  - Auth : JWT Access + Refresh
  - Queue : (à venir selon besoin notifications asynchrones)
  - PDF : modules facturation + génération PDF
  - Stockage documents : métadonnées en base (`documents.path`) ; fichier binaire hors API ou flux dédié
- Frontend : (non inclus dans ce repo / à venir)
- Données & config
  - `prisma/` : `schema.prisma`, migrations, `seed.cjs`, `prisma.config.ts` (Prisma 7)
  - `src/common` : utilitaires, guards, decorators, pipes

## Règles de Développement
### Devise et Localisation
- Montants affichés en monnaie locale (XOF recommandé) via Intl.NumberFormat.
- Montants stockés en `Decimal(12,2)` via Prisma — jamais float.
- Numéros de téléphone : format international +221XXXXXXXXX (pour Sénégal).
- Validation des contacts par `libphonenumber-js` ou équivalent.
- Dates stockées en UTC, converties côté client.

### Architecture NestJS
- Une fonctionnalité = un module dans `src/modules/`
- Réponses API : convention courante `{ success, message, data }` sur les contrôleurs métier
- Validation : `ValidationPipe` (`transform: true`, `whitelist: true` souvent sur POST/PATCH avec DTOs imbriqués)
- Guard global : `JwtAuthGuard` (`AppModule`) — routes publiques avec `@Public()` (ex. `POST /auth/login`, `GET /health`)
- Pas d’accès direct à Prisma dans les controllers — passer par les services.

### Sécurité
- Clés sensibles uniquement via variables d’environnement.
- RBAC : à affiner par endpoint selon les rôles.
- Désactivation de l’accès en clair : pas de JWT dans URL, pas d’exposition en log.

## Modules montés dans `AppModule` (référence à jour)

| Zone | Module | Base URL / notes |
|------|--------|-------------------|
| Core | `auth` | `/auth` — login public ; **register protégé JWT** |
| Core | `users` | `/users` |
| Core | `company` | `/company` |
| Métier | `clients` | `/clients` — création avec `user` optionnel |
| Métier | `employees` | `/employees` |
| Métier | `employee-contracts` | `/employee-contracts` — contrats salarié (`employee_contract_types`), scope société |
| Métier | `tiers` | `/tiers` — scope société via client |
| Métier | `documents` | `/documents` — métadonnées ; `companyId` = JWT |
| Perso | `activities` | `/activities` — scope **utilisateur** JWT |
| Perso | `notifications` | `/notifications` — scope **utilisateur** ; `GET .../unread` avant `:id` |
| Settings | `countries`, `regions`, `currency` | `/countries`, `/regions`, `/currencies` |
| Settings | `legal-forms` | `/legal-forms` |
| Settings | `document-categories` | `/document-categories` |
| Settings | `payment-methods` | `/payment-methods` (+ `/payment-methods/types`) |
| Settings | `permissions`, `roles` | `/permissions`, `/roles` |
| Settings | `contract-types` | `/contract-types` |
| Settings | `genders`, `languages` | `/genders`, `/languages` |
| Settings | `tier-types` | `/tier-types` |
| App | `AppController` | `/health` |

**Présents dans le repo mais non montés** : `client-types`, `client-flags` (contrôleurs existants, non importés dans `app.module.ts`).

### Clients : création et `user_id`
- **Sans** objet `user` : `clients.user_id` = utilisateur JWT.
- **Avec** `user` imbriqué : création utilisateur + lien — email déjà pris → conflit (`409` / message métier).

### Documents
- Enregistrement des champs fichier : `name`, `path`, `mimeType`, `size`, `meta` ; pas d’upload multipart dans ce module par défaut.

## Pipeline Fonctions / Statuts
Pour la comptabilité, la pipeline est centrée sur :
- Devis/Facture → Validation → Paiement → Clôture
- Déclaration fiscale : brouillard → révision → validation → transmission

## Variables d'Environnement (à compléter pour contexte)
.env
- DATABASE_URL=
- JWT_SECRET=
- JWT_REFRESH_SECRET=
- NODE_ENV=development
- PORT=4230
- SWAGGER_ENABLED=true
- (seed) `SEED_ADMIN_PASSWORD`, `SEED_SKIP_ADMIN` si besoin

## Déploiement
- Backend : Docker + Docker Compose ou Railway/Render
- Base de données : MySQL / Cloud (PlanetScale, RDS)
- Migration : `npx prisma migrate deploy`
- CI : Test + lint + build + migration + e2e sur chaque PR

## Commandes Utiles
- `npm install`
- `npx prisma generate`
- `npx prisma migrate dev`
- `npm run seed` — jeu de données de démo (`prisma/seed.cjs`)
- `npm run start:dev`
- `npm run build`
- `npm run test`
- `npm run test:e2e`
- `npm run lint`

## API / outillage
- **Swagger** : UI sur `GET /` (voir `src/main.ts`), schéma Bearer JWT.
- **Postman** : `postman/Insta-Compta-API.postman_collection.json`
  - Variables : `baseUrl`, `accessToken`, `refreshToken`
  - Auth collection : Bearer `{{accessToken}}`
  - Dossiers alignés sur les routes montées (voir description intégrée dans la collection).

## Chronologie des versions
### 2026-03-24
- Création du fichier `claude.md`
- Initialisation du squelette API et des modules `settings` / `company`
- Auth JWT + Prisma + MySQL
- Ajout module `users` (CRUD)
- Swagger : registration de la tag `users` dans `src/main.ts`
- Standardisation des réponses API `success/message/data` pour users

### 2026-03-25
- Refactoring modèle utilisateur : passage de many-to-many (UserRole) à one-to-many (User.roleId)
- Suppression du modèle UserRole
- Mise à jour des DTOs : CreateUserDto et UpdateUserDto utilisent roleId au lieu de roleIds
- Endpoints rôles utilisateur : PATCH /users/:id/role et DELETE /users/:id/role
- Migration Prisma appliquée

### 2026-04
- Schéma Prisma aligné DDL MySQL ; migrations + `npm run seed`
- Clients avec `user` optionnel à la création
- Settings : genres, langues, types de tiers, catégories document, etc.
- Tiers, contrats salarié (`employee-contracts`), documents, activities, notifications
- Collection Postman et `CLAUDE.md` tenus à jour avec l’inventaire des routes montées

### À venir (piste)
- Facturation / tax en flux complet si besoin
- Reporting PDF, files d’attente
- RBAC fin par permission sur chaque route
- Réactivation des modules `client-types` / `client-flags` dans `AppModule` si produit

## Notes générales
- À compléter à chaque mise à jour majeure du projet.
- Documenter breaking changes et décisions d’architecture.
