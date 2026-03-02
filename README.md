<div align="center">

<img src="https://img.shields.io/badge/VQS-Virtual%20Queue%20System-0D2B55?style=for-the-badge&logoColor=white" alt="VQS"/>

# VQS — Virtual Queue System
### Système Intelligent de File d'Attente Virtuelle

**Géolocalisation · Temps Réel · Microservices · SaaS**

[![Flutter](https://img.shields.io/badge/Flutter-3.x-02569B?style=flat-square&logo=flutter)](https://flutter.dev)
[![React](https://img.shields.io/badge/React.js-18.x-61DAFB?style=flat-square&logo=react)](https://reactjs.org)
[![Node.js](https://img.shields.io/badge/Node.js-20.x%20LTS-339933?style=flat-square&logo=node.js)](https://nodejs.org)
[![Laravel](https://img.shields.io/badge/Laravel-11.x-FF2D20?style=flat-square&logo=laravel)](https://laravel.com)
[![MySQL](https://img.shields.io/badge/MySQL-8.x-4479A1?style=flat-square&logo=mysql)](https://mysql.com)
[![Supabase](https://img.shields.io/badge/Supabase-Latest-3ECF8E?style=flat-square&logo=supabase)](https://supabase.com)
[![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?style=flat-square&logo=docker)](https://docker.com)

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](LICENSE)
[![Version](https://img.shields.io/badge/Version-1.0.0--MVP-blue?style=flat-square)]()
[![Status](https://img.shields.io/badge/Status-En%20développement%20%7C%20backend%20dockerisé-orange?style=flat-square)]()

---

> **VQS** permet à n'importe quel usager de prendre un ticket à distance, de suivre sa position en temps réel,  
> et d'être alerté automatiquement quand son tour approche — sans rester une seconde dans la salle d'attente.

---

## 🔄 État actuel du projet

- **Statut général** : en développement continu — plusieurs services en POC.
- **Backend Laravel** : containerisé avec Docker, aperçu fonctionnel sur le port 8000 dans Compose.
- **Base de données** : MySQL 8 et Redis inclus dans la configuration Docker Compose.
- **Front-ends (mobile/web)** : code existant mais non intégré dans cet exercice.
- **Prochaines étapes** : ajout de services supplémentaires (gateway, queue, ticket), tests automatisés et déploiement prod.

---

</div>

---

## Table des matières

- [Pourquoi VQS ?](#-pourquoi-vqs-)
- [Fonctionnalités](#-fonctionnalités)
- [Architecture](#-architecture)
- [Stack technique](#-stack-technique)
- [Structure du projet](#-structure-du-projet)
- [Démarrage rapide](#-démarrage-rapide)
- [Configuration](#-configuration)
- [API Reference](#-api-reference)
- [Modèle de données](#-modèle-de-données)
- [Tests](#-tests)
- [Déploiement](#-déploiement)
- [Roadmap](#-roadmap)
- [Contribuer](#-contribuer)
- [Licence](#-licence)

---

## 💡 Pourquoi VQS ?

Dans les hôpitaux, mairies, banques et commerces, les files d'attente physiques volent chaque jour des millions d'heures aux gens. Certains se réveillent à 4h du matin juste pour décrocher le premier ticket d'une consultation médicale. Ce n'est pas une fatalité — c'est un problème d'ingénierie.

**VQS** est une plateforme SaaS complète qui digitalise entièrement ce processus. Elle s'adresse à trois types d'acteurs :

- **L'usager** qui veut prendre son ticket depuis son canapé et revenir exactement au bon moment.
- **L'agent** qui veut gérer sa file sereinement depuis un tableau de bord clair.
- **L'établissement** qui veut analyser ses flux, optimiser ses ressources et améliorer l'expérience de ses usagers.

Et pour ceux qui n'ont pas de smartphone ? VQS propose également une borne physique, une notification SMS simple, et un écran d'affichage en salle — **personne n'est exclu**.

---

## ✨ Fonctionnalités

### Côté usager (App Flutter + Web React.js)

- **Prise de ticket à distance** — réservation en ligne ou scan de QR code à l'entrée
- **Suivi en temps réel** — position dans la file mise à jour à la seconde près via WebSocket
- **Notifications intelligentes** — push (FCM) ou SMS (Twilio) déclenchées selon votre ETA géolocalisé
- **Statut d'affluence** — indicateur vert / orange / rouge par établissement
- **Suggestions d'horaires creux** — basées sur l'historique de fréquentation
- **Carte géolocalisée** — établissements proches triés par distance et affluence
- **Accessibilité multi-canal** — app mobile, web, borne physique, SMS simple

### Côté agent (Dashboard Web React.js)

- **Appel du ticket suivant** en un clic
- **Gestion des absences** — rappel, suspension ou annulation de ticket
- **File prioritaire dédiée** — VIP, urgences, personnes handicapées
- **Ouverture / fermeture de guichet** à la volée
- **Vue temps réel de la file** complète avec statuts

### Côté administrateur établissement

- **Création et paramétrage de files** — capacité, durée moyenne, priorités
- **Tableau de bord analytique** — temps moyen, taux d'abandon, performance par guichet
- **Export CSV et PDF** des rapports d'activité
- **Gestion multi-services** — une plateforme pour tous les guichets

### Côté super-administrateur (SaaS)

- Gestion des établissements clients et de leurs abonnements
- Monitoring global de la plateforme
- Facturation et gestion des plans (Basic / Pro / Enterprise)

---

## 🏗 Architecture

VQS repose sur une **architecture microservices distribuée**, où chaque fonctionnalité est encapsulée dans un service indépendant, déployé dans son propre conteneur Docker. Cette approche permet de mettre à l'échelle uniquement le service sous pression, sans toucher au reste du système.

```
┌──────────────────────────────────────────────────────────────────────┐
│                         COUCHE CLIENT                                │
│  ┌────────────────────────┐      ┌──────────────────────────────┐   │
│  │   App Mobile (Flutter) │      │  Interface Web (React.js)    │   │
│  │   iOS & Android        │      │  Dashboard usager + Admin    │   │
│  └───────────┬────────────┘      └──────────────┬───────────────┘   │
└──────────────┼───────────────────────────────────┼───────────────────┘
               │ HTTPS + JWT                        │ HTTPS + JWT
               ▼                                    ▼
┌──────────────────────────────────────────────────────────────────────┐
│                   API GATEWAY  (Node.js / Express)                   │
│          Routage · Auth JWT · Rate Limiting · Load Balancing         │
└──────┬──────────┬──────────┬──────────┬──────────┬───────────────────┘
       │          │          │          │          │
       ▼          ▼          ▼          ▼          ▼
  ┌─────────┐ ┌───────┐ ┌────────┐ ┌───────┐ ┌──────────┐
  │  Auth   │ │ Queue │ │Ticket  │ │Notif. │ │Analytics │
  │Service  │ │Service│ │Service │ │Service│ │ Service  │
  │(Laravel)│ │(Node) │ │(Node)  │ │(Node) │ │(Laravel) │
  └────┬────┘ └───┬───┘ └───┬────┘ └───┬───┘ └────┬─────┘
       │          │          │          │           │
       └──────────┴──────────┴──────────┴───────────┘
                             │
              ┌──────────────▼──────────────┐
              │    MySQL 8 + Supabase        │
              │  (BDD principale + Realtime  │
              │   + Auth + Storage)          │
              └─────────────────────────────┘
                             │
              ┌──────────────▼──────────────┐
              │   Geolocation Service        │
              │   Notification FCM + Twilio  │
              └─────────────────────────────┘

  ╔══════════════════════════════════════════════════════════════╗
  ║  Docker Compose — chaque service = un conteneur isolé        ║
  ╚══════════════════════════════════════════════════════════════╝
```

### Flux temps réel (WebSocket)

Le canal WebSocket est maintenu en permanence entre le client (app ou navigateur) et le Ticket Service. Chaque fois qu'un agent appelle un ticket, tous les clients connectés à cette file reçoivent une mise à jour de position en moins d'une seconde, sans aucun rechargement.

---

## 🛠 Stack technique

| Couche | Technologie | Rôle |
|--------|------------|------|
| Mobile | **Flutter 3.x** | Application iOS & Android (un seul code source) |
| Web front-end | **React.js 18** | Dashboard usager, agent et admin |
| API Gateway | **Node.js + Express** | Point d'entrée, routage, auth middleware |
| Auth Service | **Laravel 11** | JWT, OAuth2, gestion des rôles, RGPD |
| Queue/Ticket Service | **Node.js + Socket.io** | Gestion des files, WebSocket temps réel |
| Analytics Service | **Laravel 11** | Statistiques, exports CSV/PDF |
| Base de données | **MySQL 8** | Stockage principal relationnel |
| BaaS | **Supabase** | Auth, Realtime, Storage, API auto-générée |
| Push notifications | **Firebase Cloud Messaging** | Alertes push iOS & Android |
| SMS | **Twilio** | Notifications SMS pour téléphones basiques |
| Conteneurisation | **Docker + Docker Compose** | Isolation et déploiement reproductible |
| Sécurité | **JWT + Refresh Token + HTTPS** | Auth stateless, protection des échanges |

---

## 📁 Structure du projet

```
vqs/
│
├── gateway/                    # API Gateway (Node.js / Express)
│   ├── src/
│   │   ├── middleware/         # Auth JWT, rate limiting, logging
│   │   └── routes/             # Routage vers les microservices
│   └── Dockerfile
│
├── services/
│   ├── auth/                   # Auth Service (Laravel)
│   │   ├── app/
│   │   │   ├── Http/Controllers/
│   │   │   └── Models/
│   │   ├── database/migrations/
│   │   └── Dockerfile
│   │
│   ├── queue/                  # Queue Service (Node.js)
│   │   ├── src/
│   │   │   ├── controllers/
│   │   │   ├── models/
│   │   │   └── routes/
│   │   └── Dockerfile
│   │
│   ├── ticket/                 # Ticket Service (Node.js + Socket.io)
│   │   ├── src/
│   │   │   ├── controllers/
│   │   │   ├── websocket/      # Gestion WebSocket
│   │   │   └── qrcode/         # Génération QR codes
│   │   └── Dockerfile
│   │
│   ├── notification/           # Notification Service (Node.js)
│   │   ├── src/
│   │   │   ├── providers/
│   │   │   │   ├── fcm.js      # Firebase Cloud Messaging
│   │   │   │   └── twilio.js   # SMS
│   │   │   └── handlers/
│   │   └── Dockerfile
│   │
│   ├── geolocation/            # Geolocation Service (Node.js)
│   │   ├── src/
│   │   │   ├── eta.js          # Calcul ETA
│   │   │   └── proximity.js    # Détection proximité
│   │   └── Dockerfile
│   │
│   └── analytics/              # Analytics Service (Laravel)
│       ├── app/
│       │   └── Reports/        # Génération rapports PDF/CSV
│       └── Dockerfile
│
├── client/
│   ├── web/                    # Interface React.js
│   │   ├── src/
│   │   │   ├── pages/
│   │   │   │   ├── user/       # Espace usager
│   │   │   │   ├── agent/      # Tableau de bord agent
│   │   │   │   └── admin/      # Dashboard administrateur
│   │   │   ├── components/
│   │   │   └── hooks/          # useQueue, useWebSocket, useGeo...
│   │   └── package.json
│   │
│   └── mobile/                 # Application Flutter
│       ├── lib/
│       │   ├── screens/
│       │   ├── widgets/
│       │   ├── services/       # API, WebSocket, FCM
│       │   └── models/
│       └── pubspec.yaml
│
├── database/
│   ├── migrations/             # Scripts SQL versionnés
│   └── seeds/                  # Données de test
│
├── docs/
│   ├── api/                    # Documentation Swagger
│   ├── architecture/           # Diagrammes (PNG/SVG)
│   └── cahier-des-charges.pdf
│
├── docker-compose.yml          # Orchestration locale complète
├── docker-compose.prod.yml     # Configuration production
├── .env.example                # Variables d'environnement (template)
└── README.md                   # Ce fichier
```

---

## 🚀 Démarrage rapide

### Prérequis

Avant de commencer, assurez-vous d'avoir installé sur votre machine les outils suivants. Docker et Docker Compose sont les seuls vraiment indispensables pour lancer l'ensemble du projet en local.

- [Docker](https://docs.docker.com/get-docker/) ≥ 24.x
- [Docker Compose](https://docs.docker.com/compose/) ≥ 2.x
- [Git](https://git-scm.com/)
- (Optionnel) [Node.js 20](https://nodejs.org/) si vous souhaitez lancer un service individuellement sans Docker

### Installation en 4 étapes

**Étape 1 — Cloner le repository**

```bash
git clone https://github.com/votre-org/vqs.git
cd vqs
```

**Étape 2 — Configurer les variables d'environnement**

Le fichier `.env.example` contient tous les paramètres nécessaires avec des valeurs par défaut pour le développement local. Copiez-le et remplissez les clés API manquantes (Supabase, Firebase, Twilio).

```bash
cp .env.example .env
# Ouvrez .env dans votre éditeur et renseignez les clés manquantes
```

**Étape 3 — Lancer tous les services**

Cette commande démarre l'intégralité de la plateforme : API Gateway, 6 microservices, base de données MySQL, et crée automatiquement le réseau Docker interne entre les services.

```bash
docker compose up --build
```

> ⏱ Le premier lancement prend 3 à 5 minutes le temps de construire les images. Les suivants démarrent en quelques secondes.

**Étape 4 — Lancer les migrations et les seeds**

```bash
# Migrations MySQL (créer toutes les tables)
docker compose exec auth-service php artisan migrate

# Seed avec des données de test (facultatif mais recommandé)
docker compose exec auth-service php artisan db:seed
```

### Accès aux interfaces

Une fois tous les conteneurs démarrés, les interfaces sont accessibles aux adresses suivantes :

| Interface | URL | Description |
|-----------|-----|-------------|
| Dashboard Web (React.js) | http://localhost:3001 | Interface usager, agent, admin |
| API Gateway | http://localhost:3000 | Point d'entrée de l'API REST |
| Documentation Swagger | http://localhost:3000/api-docs | Documentation interactive de l'API |
| Supabase Studio | http://localhost:54323 | Interface de gestion de la BDD |

---

## ⚙ Configuration

### Variables d'environnement

Le tableau ci-dessous explique chaque variable d'environnement. La colonne "Requis" indique les variables sans lesquelles le service ne peut pas démarrer.

```env
# ── Base de données ──────────────────────────────────────────────────────
DB_HOST=mysql                        # Hôte MySQL (nom du service Docker)
DB_PORT=3306                         # Port MySQL
DB_DATABASE=vqs_db                   # Nom de la base de données
DB_USERNAME=vqs_user                 # Utilisateur MySQL
DB_PASSWORD=vqs_secret               # Mot de passe MySQL

# ── Supabase ─────────────────────────────────────────────────────────────
SUPABASE_URL=https://xxx.supabase.co # URL de votre projet Supabase
SUPABASE_ANON_KEY=eyJ...             # Clé publique Supabase (safe côté client)
SUPABASE_SERVICE_KEY=eyJ...          # Clé privée Supabase (back-end uniquement)

# ── Authentification JWT ──────────────────────────────────────────────────
JWT_SECRET=votre-secret-tres-long-et-aleatoire
JWT_EXPIRY=15m                       # Durée de vie du token d'accès
JWT_REFRESH_EXPIRY=7d                # Durée de vie du refresh token

# ── Firebase (notifications push) ────────────────────────────────────────
FIREBASE_PROJECT_ID=vqs-app
FIREBASE_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----\n...
FIREBASE_CLIENT_EMAIL=firebase-adminsdk@vqs-app.iam.gserviceaccount.com

# ── Twilio (SMS) ─────────────────────────────────────────────────────────
TWILIO_ACCOUNT_SID=ACxxxx
TWILIO_AUTH_TOKEN=xxxx
TWILIO_PHONE_NUMBER=+1234567890

# ── URLs internes (Docker) ────────────────────────────────────────────────
AUTH_SERVICE_URL=http://auth-service:8000
QUEUE_SERVICE_URL=http://queue-service:3002
TICKET_SERVICE_URL=http://ticket-service:3003
NOTIFICATION_SERVICE_URL=http://notification-service:3004
GEO_SERVICE_URL=http://geo-service:3005
ANALYTICS_SERVICE_URL=http://analytics-service:8001
```

---

## 📡 API Reference

L'ensemble de l'API REST est documentée via Swagger et accessible à `/api-docs` une fois le projet lancé. Voici un aperçu des endpoints principaux.

### Authentification

```
POST   /api/auth/register          Inscription d'un nouvel usager
POST   /api/auth/login             Connexion (retourne JWT + refresh token)
POST   /api/auth/refresh           Renouveler le token d'accès
POST   /api/auth/logout            Déconnexion (invalide le refresh token)
```

### Files d'attente

```
GET    /api/queues                 Lister les files d'un établissement
POST   /api/queues                 Créer une nouvelle file (admin)
GET    /api/queues/:id             Détail d'une file + position temps réel
PATCH  /api/queues/:id/status      Ouvrir, mettre en pause ou fermer une file
```

### Tickets

```
POST   /api/tickets                Créer un ticket (rejoindre une file)
GET    /api/tickets/:id            Statut et position d'un ticket
PATCH  /api/tickets/:id/next       Appeler le ticket suivant (agent)
PATCH  /api/tickets/:id/status     Mettre à jour le statut (présent, absent...)
DELETE /api/tickets/:id            Annuler un ticket
```

### Établissements & Géolocalisation

```
GET    /api/establishments         Lister les établissements proches
       ?lat=5.35&lng=2.35&radius=5000
GET    /api/establishments/:id     Détail + statut d'affluence en direct
```

### Analytics

```
GET    /api/analytics/queues       Statistiques par file (jour / semaine / mois)
GET    /api/analytics/export       Export CSV ou PDF
       ?format=pdf&from=2025-01-01&to=2025-01-31
```

### WebSocket Events

Le client se connecte au WebSocket via Socket.io sur `ws://localhost:3000`. Voici les événements disponibles :

```javascript
// S'abonner aux mises à jour d'une file
socket.emit('join:queue', { queueId: 'uuid-de-la-file' })

// Recevoir les mises à jour de position
socket.on('queue:updated', (data) => {
  // data.position   → nouvelle position de l'usager dans la file
  // data.totalWait  → temps d'attente estimé en minutes
  // data.called     → true si c'est le tour de l'usager
})

// Recevoir un appel direct (c'est votre tour !)
socket.on('ticket:called', (data) => {
  // data.guichet    → numéro du guichet assigné
  // data.ticketId   → identifiant du ticket appelé
})
```

---

## 🗄 Modèle de données

Les tables principales du schéma MySQL et leurs relations essentielles sont décrites ci-dessous. Chaque identifiant est un UUID v4 pour garantir l'absence de collision entre établissements.

```sql
-- Un usager peut avoir plusieurs tickets (un par service)
users (id UUID PK, name, email UNIQUE, phone, role ENUM, fcm_token, created_at)

-- Un établissement regroupe plusieurs services
establishments (id UUID PK, name, address, lat, lng, plan ENUM, admin_id FK)

-- Un service appartient à un établissement et possède une ou plusieurs files
services (id UUID PK, name, avg_duration_min, max_capacity, establishment_id FK)

-- Une file est ouverte sur un service à un instant donné
queues (id UUID PK, service_id FK, status ENUM, current_number, avg_wait_min, opened_at, closed_at)

-- Un ticket lie un usager à une file à un instant précis
tickets (id UUID PK, number, qr_code, status ENUM, position,
         user_id FK, queue_id FK, created_at, called_at, closed_at, lat, lng)

-- Traçabilité de toutes les notifications envoyées
notifications (id PK, user_id FK, ticket_id FK, channel ENUM, content, sent_at)

-- Statistiques agrégées par file et par jour (pour l'analytics)
queue_stats (id PK, queue_id FK, date, total_tickets, avg_wait_min, abandon_rate)
```

### Statuts d'un ticket

Un ticket traverse les états suivants au fil de son cycle de vie :

```
waiting → called → present → processed
                ↘ absent → (rappelé → called) ou cancelled
```

---

## 🧪 Tests

### Lancer les tests

```bash
# Tests unitaires et d'intégration — services Node.js (Jest)
docker compose exec queue-service npm test
docker compose exec ticket-service npm test

# Tests unitaires et d'intégration — services Laravel (PHPUnit)
docker compose exec auth-service php artisan test
docker compose exec analytics-service php artisan test

# Tests End-to-End sur l'interface web (Cypress)
cd client/web
npx cypress open
```

### Couverture de code

```bash
# Rapport de couverture Node.js
docker compose exec ticket-service npm run test:coverage

# Rapport de couverture Laravel
docker compose exec auth-service php artisan test --coverage
```

L'objectif de couverture cible est **70% minimum** sur l'ensemble des services. Les chemins critiques (création de ticket, appel WebSocket, envoi de notification) visent **90%**.

---

## 🚢 Déploiement

### Environnement de production

Pour un déploiement en production, le fichier `docker-compose.prod.yml` remplace le fichier de développement. Il désactive les volumes de rechargement à chaud, active les variables d'environnement de production, et configure les limites de ressources par conteneur.

```bash
# Déploiement production
docker compose -f docker-compose.prod.yml up -d --build
```

### Variables à changer absolument en production

Avant tout déploiement en production, vérifiez impérativement ces points. Un JWT_SECRET faible est la vulnérabilité la plus courante sur les APIs Node.js.

```bash
JWT_SECRET=<générer avec : openssl rand -hex 64>
DB_PASSWORD=<mot de passe fort>
NODE_ENV=production
APP_ENV=production
APP_DEBUG=false
```

### Checklist de déploiement

- [ ] Variables d'environnement de production configurées
- [ ] HTTPS activé (certificat SSL via Let's Encrypt ou équivalent)
- [ ] Migrations exécutées sur la base de production
- [ ] Tests de charge passés (objectif : 10 000 utilisateurs simultanés)
- [ ] Monitoring activé (logs centralisés recommandés)
- [ ] Sauvegardes MySQL automatiques configurées
- [ ] Rate limiting activé sur l'API Gateway

---

## 🗺 Roadmap

Ce tableau présente l'évolution prévue du projet selon les phases de développement. Les fonctionnalités marquées ✅ sont disponibles dans la version actuelle, 🔄 sont en cours, et 📋 sont planifiées.

| Statut | Fonctionnalité | Version cible |
|--------|---------------|--------------|
| 🔄 | Auth Service complet (JWT, rôles, OAuth2) | v1.0 MVP |
| 🔄 | Queue Service + Ticket Service | v1.0 MVP |
| 🔄 | WebSocket temps réel | v1.0 MVP |
| 🔄 | App Flutter v1 | v1.0 MVP |
| 🔄 | Interface React.js usager + agent | v1.0 MVP |
| 📋 | Notifications FCM + Twilio SMS | v1.0 MVP |
| 📋 | Géolocalisation et calcul ETA | v1.1 |
| 📋 | Analytics Service + exports PDF/CSV | v1.1 |
| 📋 | Borne physique (tablette kiosque) | v1.2 |
| 📋 | Module prédictif Machine Learning (affluence) | v2.0 |
| 📋 | Intégration IoT (écrans connectés, bornes intelligentes) | v2.0 |
| 📋 | Marketplace d'extensions tierces | v3.0 |
| 📋 | Intégration Smart City | v3.0 |

---

## 🤝 Contribuer

Les contributions sont les bienvenues ! Voici comment participer au projet de façon organisée.

**Avant de commencer**, prenez connaissance de la structure du projet et des conventions de code. Chaque microservice suit ses propres conventions de nommage (camelCase pour Node.js, snake_case pour Laravel), documentées dans les README individuels de chaque service.

```bash
# 1. Forker le projet, puis cloner votre fork
git clone https://github.com/votre-username/vqs.git

# 2. Créer une branche descriptive
git checkout -b feature/geolocation-eta-calculation
# ou
git checkout -b fix/websocket-reconnection-bug

# 3. Développer avec des commits atomiques et bien nommés
git commit -m "feat(geo): add ETA calculation based on Haversine formula"

# 4. Pousser et ouvrir une Pull Request vers main
git push origin feature/geolocation-eta-calculation
```

**Conventions de commit** — ce projet suit [Conventional Commits](https://www.conventionalcommits.org/) :
`feat:`, `fix:`, `docs:`, `test:`, `chore:`, `refactor:`

**Avant de soumettre une PR**, assurez-vous que les tests passent, que le code est formatté (ESLint pour Node.js, PHP CS Fixer pour Laravel), et que la documentation est à jour si nécessaire.

---

## 📄 Licence

Ce projet est distribué sous licence **MIT**. Voir le fichier [LICENSE](LICENSE) pour les détails.

Le modèle économique **Open-Core** signifie que le noyau (gestion de file de base, tickets, interface usager) est et restera open source. Les modules avancés (analytics poussés, ML prédictif, intégrations IoT) feront l'objet d'une offre commerciale séparée.

---

<div align="center">

**VQS — Parce que le temps de chacun a de la valeur.**

Fait avec ❤️ · Rapport de bug ? [Ouvrir une issue](https://github.com/votre-org/vqs/issues) · Documentation complète : [docs/](docs/)

</div>
