La documentation projet est dans **[`CLAUDE.md`](./CLAUDE.md)** (fichier canonique à la racine pour les assistants et l’équipe).

**Contexte** : plateforme pour cabinets d’expertise comptable en Afrique francophone. Trois acteurs principaux : Admin/Comptable, Client entreprise, Utilisateur interne (consultant).

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

### Prisma : colonnes SQL vs champs API
- Les modèles Prisma utilisent du camelCase côté code ; les colonnes MySQL sont explicites via `@map("...")`.
- Après la migration `20260417160000_shorten_fk_column_names`, plusieurs clés étrangères ont des noms de colonnes courts en base (`country_id`, `region_id`, `legal_form_id`, `identification_type_id`, `category_id`, `type_id` sur `permissions`, `tier_type_id`, etc.).
- Les **DTOs NestJS et le JSON des requêtes/réponses HTTP** restent en **camelCase** (`countryId`, `categoryId`, `identificationTypeId`, `typeId`, …) : aucun changement pour les clients API — seule la couche Prisma ↔ MySQL reflète les noms de colonnes.

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
| Métier | `clients` | `/clients` — création avec `user` optionnel ; **`meta`** JSON (ex. **`bp`** boîte postale — Swagger / Postman) |
| Métier | `employees` | `/employees` — import Excel `POST /employees/import?clientId=` (multipart `file`) |
| Métier | `employee-contracts` | `/employee-contracts` — contrats salarié (`employee_contract_types`), scope société |
| Métier | `tiers` | `/tiers` — scope société via client ; **`meta`** (ex. **`beneficiaryAddress`**) ; exports Excel **DGID** (`/tiers/:clientId/...`, jobs async) |
| Métier | `tiers-transactions` | `/tiers-transactions` — filtre `tierId` |
| Métier | `balances` | `/balances` — client + exercice ; **`POST /balances/:balanceId/balance-lines/import`** (`.xlsx`, `balanceId` en URL uniquement) |
| Métier | (lignes) | `/balance-lines` — query **`balanceId`** obligatoire pour la liste |
| Métier | `tva-annexes` | `/tva-annexes` — **`GET /tva-annexes/compute?clientId=&month=&year=`** annexe fiscale TVA (L5–L115) |
| Métier | `documents` | `/documents` — métadonnées ; `companyId` = JWT |
| Métier | `rental-usages` | `/rental-usages` |
| Métier | `rentals` | `/rentals` |
| Perso | `activities` | `/activities` — scope **utilisateur** JWT |
| Perso | `notifications` | `/notifications` — scope **utilisateur** ; `GET .../unread` avant `:id` |
| Réf. | `accounting-years` | `/accounting-years` |
| Réf. | `accounting-quarters` | `/accounting-quarters` |
| App | `app-meta` | `/app-meta` |
| Settings | `countries`, `regions`, `currency` | `/countries`, `/regions`, `/currencies` |
| Settings | `legal-forms` | `/legal-forms` |
| Settings | `document-categories` | `/document-categories` |
| Settings | `identification-types` | `/identification-types` — types de pièce d’identité (salariés) |
| Settings | `payment-methods` | `/payment-methods` (+ `/payment-methods/types`) |
| Settings | `permissions`, `roles` | `/permissions`, `/roles` |
| Settings | `contract-types` | `/contract-types` |
| Settings | `genders`, `languages` | `/genders`, `/languages` |
| Settings | `tier-types` | `/tier-types` |
| App | `AppController` | `/health` |

### Clients : création et `user_id`
- **Sans** objet `user` : `clients.user_id` = utilisateur JWT.
- **Avec** `user` imbriqué : création utilisateur + lien — email déjà pris → conflit (`409` / message métier).
- **`meta`** (JSON optionnel) : ex. **`bp`** (`"BP 12500 Dakar"`) pour boîte postale sur impressions / formulaires (DGID, etc.) — voir Swagger et Postman.

### Tiers : `meta`
- JSON libre ; clé courante **`beneficiaryAddress`** pour les états / formulaires (exports Excel DGID côté module `tiers`) — exemples Swagger + Postman.

### Balances : import Excel des lignes
- **8 colonnes** obligatoires en ligne 1 (ordre libre, synonymes FR ou abréviations type `cpte` / `MVT DEB`) : compte, libellé, débit/crédit N-1, mouvements débit/crédit, débit/crédit N.
- **`balanceId` uniquement dans l’URL** (`POST /balances/:balanceId/balance-lines/import`) — pas de colonne balance dans le fichier.
- Montants : espaces milliers, virgule décimale ; max **500** lignes utiles (cf. `balance-line-excel-import.ts`).
- **Modèle** : `src/assets/xlsx/balance-lines-import-example.xlsx` — régénération : `node scripts/generate-balance-lines-import-example.cjs` (infobulles Excel sur les en-têtes, pas une colonne importée).
- **Tests** : `balance-line-excel-import.spec.ts` ; smoke e2e « balances & lignes » dans `test/api-smoke.e2e-spec.ts`.

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
- Exemple import lignes de balance : `node scripts/generate-balance-lines-import-example.cjs` → `src/assets/xlsx/balance-lines-import-example.xlsx`

## API / outillage
- **Swagger** : UI sur `GET /` (voir `src/main.ts`), schéma Bearer JWT.
- **Postman** : `postman/Insta-Compta-API.postman_collection.json`
  - Variables : `baseUrl`, `accessToken`, `refreshToken`, IDs seed (`clientId`, `accountingYearId`, …), **`balanceId`**, **`balanceLineId`** (après création / import), `exportJobId` (jobs export tiers).
  - Auth collection : Bearer `{{accessToken}}`
  - Dossiers alignés sur les routes (dont **Balances**, **Financial Report** / DGID) — descriptions dans la collection.

## Chronologie des versions
### 2026-03-24
- Ajout du fichier de contexte à la racine (`CLAUDE.md` ; ancien nom `claude.md`)
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
- Settings : genres, langues, types de tiers, catégories document, types d’identification, etc.
- Tiers, contrats salarié (`employee-contracts`), documents, activities, notifications
- Collection Postman et `CLAUDE.md` tenus à jour avec l’inventaire des routes montées

### 2026-04-16
- Migration Prisma `20260417160000_shorten_fk_column_names` : renommage des colonnes FK en MySQL (chemins data-safe), alignées sur `schema.prisma` (`@map`).
- Documentation : distinction explicite colonnes SQL vs propriétés JSON API ; module `identification-types` listé dans l’inventaire des routes.

### 2026-05
- **Balances** : tables `balances`, `balance_lines` ; API + **import `.xlsx`** (8 colonnes, `balanceId` en URL) ; script + fichier d’exemple avec infobulles sur les en-têtes ; tests unitaires + smoke e2e.
- **Locations** : `rental_usages`, `rentals` (CRUD API).
- **Exercices / trimestres** : modules `accounting-years`, `accounting-quarters` ; **app-meta** ; **tiers-transactions**.
- **Clients / tiers** : exemples **`meta`** (`bp`, `beneficiaryAddress`) dans Swagger et Postman.
- **Postman** : dossier Balances, variables `balanceId` / `balanceLineId`, `_postman_id` sur les requêtes concernées.

### À venir (piste)
- Facturation / tax en flux complet si besoin
- Reporting PDF, files d’attente
- RBAC fin par permission sur chaque route

## Notes générales
- À compléter à chaque mise à jour majeure du projet.
- Documenter breaking changes et décisions d’architecture.
