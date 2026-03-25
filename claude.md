# CLAUDE.md — compta-api

## Vision du Projet
Plateforme SaaS de gestion comptable et déclarations fiscales, ciblant les PME et cabinets d’expertise comptable en Afrique francophone. Trois acteurs principaux : Admin/Comptable, Client entreprise, Utilisateur interne (consultant).

## Stack Technique
- Langage : TypeScript strict partout
- Backend (app/api)
  - NestJS 10+ (modules, guards, intercepteurs)
  - Prisma ORM + MySQL
  - Auth : JWT Access + Refresh
  - Queue : (à venir selon besoin notifications asynchrones)
  - PDF : modules facturation + génération PDF
  - Stockage documents : système de fichiers local ou stockage selon configuration
- Frontend : (non inclus dans ce repo / à venir)
- Packages partagés
  - `src/prisma` : schema Prisma + migrations
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
- Réponses API enveloppées via un interceptor global (`TransformInterceptor`) : `{ data, meta }`
- Validation via Pipes (`ValidationPipe` class-validator ou Zod adapté)
- Guards : `JwtAuthGuard` → `RolesGuard` → `OwnershipGuard`
- Pas d’accès direct à Prisma dans controllers — use services.

### Sécurité
- Clés sensibles uniquement via variables d’environnement.
- RBAC appliqué sur chaque endpoint.
- Désactivation de l’accès en clair: pas de JWT dans URL, pas d’expo en log.

## Modules principaux (structure existante)
modules/
├── auth/         # JWT login/register/refresh
├── users/        # CRUD utilisateurs et profils
├── roles/        # gestion roles
├── permissions/  # gestion permissions
├── settings/     # countries, regions, payment-methods
├── company/      # info entreprise + paramètres comptables
├── clients/      # clients et fournisseurs
├── invoices/     # factures, états, PDF
├── tax/          # TVA, IS, BRS et déclarations
├── documents/    # upload/download de pièces
├── notifications/ # notifications et alertes. (placeholder)
└── (à venir)      # autres modules fonctionnels

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

## Déploiement
- Backend : Docker + Docker Compose ou Railway/Render
- Base de données : MySQL / Cloud (PlanetScale, RDS)
- Migration : `npx prisma migrate deploy`
- CI : Test + lint + build + migration + e2e sur chaque PR

## Commandes Utiles
- `npm install`
- `npx prisma generate`
- `npx prisma migrate dev`
- `npm run start:dev`
- `npm run build`
- `npm run test`
- `npm run test:e2e`
- `npm run lint`

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

### 2026-xx-xx (à compléter)
- Ajout module `clients`, `invoices`, `tax`
- Automatisation reporting (PDF, notifications)
- Intégration RBAC fine

## Notes générales
- À compléter à chaque mise à jour majeure du projet.
- Documenter détails métier spécifiques, décision d’architecture, breaking changes.
