# 🧾 Application de Gestion des Déclarations Fiscales

![NestJS](https://img.shields.io/badge/NestJS-Backend-E0234E?logo=nestjs&logoColor=white)
![MySQL](https://img.shields.io/badge/MySQL-Database-4479A1?logo=mysql&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-ORM-2D3748?logo=prisma&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-green.svg)

---

## 📌 Description

Application **SaaS** moderne permettant aux entreprises de gérer facilement leurs déclarations fiscales (TVA, BRS, IS, etc.).

Elle automatise le calcul des impôts, la génération des déclarations et la gestion des documents comptables, tout en offrant une interface sécurisée et intuitive.

### ✨ Fonctionnalités principales

- Gestion complète des clients, fournisseurs et employés
- Calcul automatique des taxes et impôts
- Génération automatique des déclarations fiscales
- Création et téléchargement de PDF professionnels
- Gestion centralisée des documents comptables
- Système de notifications en temps réel
- Authentification sécurisée (JWT Access + Refresh Tokens)
- Architecture modulaire et hautement scalable

---

## 🏗️ Stack Technique

### Backend
- **NestJS** (Framework Node.js progressif)
- **MySQL** (Base de données relationnelle)
- **Prisma ORM** (Type-safe)
- **TypeScript**
- **JWT Authentication**
- **Swagger** (Documentation API interactive)
- **Docker** (optionnel)

### Frontend (en cours de développement)
- Vue.js **ou** React (choix à finaliser)

---

## 🗂️ Structure du projet


src/
├── common/              # Guards, decorators, filters, interceptors, utils
├── modules/
│   ├── auth/
│   ├── users/
│   ├── roles/
│   ├── permissions/
│   ├── countries/
│   ├── payment-types/
│   ├── company/
│   ├── clients/
│   ├── invoices/
│   ├── tax/                    # Module déclarations fiscales
│   ├── documents/
│   ├── notifications/
│   └── settings/
├── prisma/                     # Schema Prisma et migrations
└── main.ts

---

## 🚀 Installation

Bash# 1. Cloner le projet
git clone <url-du-repo>
cd <nom-du-repo>

# 2. Installer les dépendances
npm install

# 3. Configurer Prisma et la base de données
npx prisma generate
npx prisma migrate dev

# 4. Lancer le serveur en mode développement
npm run start:dev
L’API sera accessible sur : http://localhost:{{PORT}}

## 🔐 Variables d’environnement
Crée un fichier .env à la racine du projet :
envDATABASE_URL="mysql://utilisateur:motdepasse@localhost:3306/nom_de_la_base"

JWT_SECRET=votre_clé_secrète_jwt_très_longue_et_complexe
JWT_REFRESH_SECRET=votre_clé_secrète_refresh_très_longue_et_complexe
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

PORT= ex: 4230
SWAGGER_ENABLED=true

## 📜 Scripts npm
Bashnpm run start:dev      # Démarrage en développement (avec hot reload)
npm run start          # Démarrage en mode production
npm run build          # Compilation du projet
npm run test           # Tests unitaires
npm run test:e2e       # Tests end-to-end
npm run prisma:generate # Générer le client Prisma
npm run prisma:migrate  # Appliquer les migrations

## 📚 Documentation API
Une fois le serveur lancé, accédez à la documentation interactive Swagger :
→ http://localhost:{{PORT}}/api/docs

## 👨‍💻 Auteur
Ndiaye Sire KANE
Backend Developer – Spécialiste NestJS
