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
  - Stockage documents : système de fichiers local ou stockage selon configuration
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
- Validation : `ValidationPipe` (souvent `transform: true`, `whitelist: true` sur les routes avec DTOs imbriqués)
- Guard global : `JwtAuthGuard` (`AppModule`) — les routes publiques utilisent `@Public()` si nécessaire
- Pas d’accès direct à Prisma dans les controllers — passer par les services.

### Sécurité
- Clés sensibles uniquement via variables d’environnement.
- RBAC : à affiner par endpoint selon les rôles.
- Désactivation de l’accès en clair : pas de JWT dans URL, pas d’exposition en log.

## Modules montés dans `AppModule` (référence)
```
modules/
├── auth/              # login, refresh JWT
├── users/             # CRUD utilisateurs
├── company/           # entreprises (création avec utilisateur propriétaire imbriqué)
├── clients/           # clients par société ; création avec contact utilisateur optionnel (voir ci-dessous)
├── employees/         # salariés rattachés à un client
├── settings/
│   ├── countries/
│   ├── regions/
│   ├── currency/
│   ├── legal-forms/
│   ├── payment-methods/
│   ├── roles/
│   ├── permissions/
│   ├── contract-types/
│   ├── genders/       # CRUD → table `settings_genders`
│   └── languages/     # CRUD → table `settings_languages` (FK `country_id`)
└── (non montés ici)   # invoices, tax, documents dédiés — selon évolutions futures
```

### Clients : création et `user_id`
- **Sans** objet `user` dans le body : le client est lié à l’utilisateur authentifié (`clients.user_id` = JWT).
- **Avec** `user` imbriqué (même forme que l’utilisateur à la création d’entreprise) : création transactionnelle d’un nouvel utilisateur puis `clients.user_id` = cet utilisateur. Email déjà utilisé → `409 Conflict`.

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
- Swagger : `GET /` (configuré dans `src/main.ts`), auth Bearer JWT
- Collection Postman : `postman/Insta-Compta-API.postman_collection.json` (`baseUrl`, tokens)

## Chronologie des versions
### 2026-03-24
- Création du fichier `claude.md`
- Initialisation du squelette API et des modules `settings` / `company`
- Auth JWT + Prisma + MySQL
- Ajout module `users` (CRUD)
- Swagger : registration de la tag `users` dans `src/main.ts`
- Swagger docs pour `users` endpoints avec Responses et schemas (GET /users + GET /users/:id, plus create/update/delete)
- Standardisation des réponses API `success/message/data` pour users

### 2026-03-25
- Refactoring modèle utilisateur : passage de many-to-many (UserRole) à one-to-many (User.roleId)
- Suppression du modèle UserRole
- Mise à jour des DTOs : CreateUserDto et UpdateUserDto utilisent roleId au lieu de roleIds
- Modification des endpoints roles : PATCH /users/:id/role (set) et DELETE /users/:id/role (unset)
- Mise à jour des services, contrôleurs, guards et types AuthUser pour supporter un seul rôle par utilisateur
- Migration Prisma appliquée
- Suppression de l'entité UserRoleEntity inutilisée

### 2026-04
- Alignement schéma Prisma sur le DDL MySQL (référentiel settings, users, companies, clients, employees, documents, etc.)
- Migrations + seed par défaut (`npm run seed`) ; compte démo documenté dans le script de seed
- Module **clients** : création avec objet **`user` optionnel** (miroir de la création **company** + utilisateur) pour renseigner `clients.user_id`
- Paramètres : CRUD **genres** (`/genders`, table `settings_genders`) et **langues** (`/languages`, table `settings_languages`, avec `countryId`)
- Collection Postman mise à jour pour les routes exposées

### À venir (piste)
- Modules facturation / tax / documents en flux complet si hors squelette actuel
- Automatisation reporting (PDF, notifications)
- Intégration RBAC fine par permission sur chaque route

## Notes générales
- À compléter à chaque mise à jour majeure du projet.
- Documenter détails métier spécifiques, décision d’architecture, breaking changes.
