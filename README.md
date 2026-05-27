# OmniDesk

**Système de communication agentique multi-canal · Code source vendable · Licence commerciale**

OmniDesk est une plateforme complète de gestion de communications unifiées (Email + WhatsApp) avec des agents humains et une IA configurable. Le client reçoit le code complet, l'installe sur son propre serveur, et l'utilise pour gérer toutes ses communications.

## 🚀 Fonctionnalités

### Canaux de communication
- **WhatsApp Baileys** - Connexion via QR code, support complet des médias
- **WhatsApp Cloud API** - Intégration officielle Meta avec webhooks
- **Email** - IMAP/SMTP avec OAuth2 Gmail et Outlook

### Intelligence Artificielle (Multi-LLM)
- **Anthropic Claude** - claude-sonnet-4-20250514, claude-haiku-4-5
- **OpenAI** - GPT-4o, GPT-4o-mini, GPT-3.5-turbo
- **Google Gemini** - gemini-1.5-pro, gemini-1.5-flash
- **Groq** - llama-3.3-70b-versatile, mixtral-8x7b-32768
- **Mistral AI** - mistral-large-latest, mistral-small-latest
- **Ollama** - Modèles locaux (llama3, mistral, gemma2)

### Interface Agent
- Conversations unifiées tous canaux
- Chat UI avancé type WhatsApp
- Support tous types de médias (images, vidéos, audio, documents)
- Suggestions de réponses par IA
- Notes internes entre agents
- Transfert de conversations

### Dashboard Admin
- Gestion des agents et rôles personnalisés
- Configuration des canaux
- Configuration IA multi-fournisseurs
- Automatisations et workflows
- Analytics et rapports
- Système de licence

### Multi-langue (i18n)
- 🇫🇷 Français (par défaut)
- 🇬🇧 English
- 🇪🇸 Español
- 🇧🇷 Português
- 🇸🇦 العربية (avec support RTL)
- 🇨🇳 中文

## 🏗️ Architecture

```
omnidesk/
├── backend/                        # Node.js + Fastify + Prisma
│   ├── src/
│   │   ├── channels/               # Connecteurs WhatsApp, Email
│   │   ├── ai/                     # LLM Router multi-fournisseurs
│   │   ├── routes/                 # API REST endpoints
│   │   ├── plugins/                # Plugins Fastify
│   │   └── middlewares/            # Auth & permissions
│   └── prisma/schema.prisma        # Schéma de base de données
├── frontend/                       # React + Vite + TailwindCSS
│   └── src/
│       ├── pages/                  # Pages agent et admin
│       ├── components/             # Composants UI
│       └── i18n/locales/           # Traductions
├── docker-compose.yml              # Déploiement one-command
├── brand.config.js                 # Configuration white-label
└── LICENSE.md                      # Licence commerciale
```

## 📋 Prérequis

- **Node.js** >= 18.0.0
- **PostgreSQL** >= 14
- **Redis** >= 7
- **Docker** & **Docker Compose** (pour déploiement facile)

## 🚀 Installation Rapide (Docker)

### 1. Cloner le repository

```bash
git clone <repository-url> omnidesk
cd omnidesk
```

### 2. Configurer les variables d'environnement

```bash
cp .env.example .env
# Éditer .env avec vos valeurs
```

### 3. Démarrer avec Docker Compose

```bash
docker-compose up -d
```

### 4. Accéder à l'application

- Frontend: http://localhost
- Backend API: http://localhost:3000
- Health check: http://localhost:3000/health

## 🛠️ Installation Manuelle (Développement)

### Backend

```bash
cd backend
npm install
cp .env.example .env
# Éditer .env
npx prisma generate
npx prisma migrate dev
npm run dev
```

### Frontend

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

## 📖 Documentation

Pour la documentation complète, consultez [docs.omnidesk.app](https://docs.omnidesk.app)

### Guides disponibles
- Installation et configuration
- Configuration des canaux WhatsApp
- Configuration Email (IMAP/SMTP/OAuth)
- Configuration des fournisseurs IA
- Gestion des utilisateurs et rôles
- Création d'automatisations
- API Reference

## 🔑 Système de Licence

OmniDesk utilise un système de clé de licence pour les installations commerciales.

### Plans disponibles

| Plan | Agents max | Canaux | Prix |
|------|------------|--------|------|
| Starter | 5 | 2 | Contactez-nous |
| Pro | 20 | 10 | Contactez-nous |
| Agency | Illimité | Illimité | Contactez-nous |

### Générer une clé de licence

```bash
node tools/generate-license.js --plan PRO --agents 20 --expires 2025-12-31
```

## 🔒 Sécurité

- Authentification JWT avec refresh tokens
- Hachage des mots de passe avec bcrypt
- Chiffrement des clés API en base de données
- Middleware de permissions granulaires
- Rate limiting sur les endpoints API
- Protection CORS configurée
- Logs d'audit complets

## 📦 Technologies Utilisées

### Backend
- **Fastify** - Framework HTTP rapide
- **Prisma** - ORM moderne
- **Socket.io** - Communication temps réel
- **BullMQ** - File d'attente de tâches
- **Winston** - Logging structuré

### Frontend
- **React 18** - Bibliothèque UI
- **Vite** - Build tool ultra-rapide
- **TailwindCSS** - CSS utility-first
- **Zustand** - State management
- **React Query** - Data fetching
- **react-i18next** - Internationalisation

### Infrastructure
- **PostgreSQL** - Base de données principale
- **Redis** - Cache et queues
- **Docker** - Conteneurisation

## 🤝 Support

- **Email**: support@omnidesk.app
- **Documentation**: https://docs.omnidesk.app
- **Site web**: https://omnidesk.app

## 📄 Licence

Ce code source est vendu sous **licence commerciale**. 

L'achat d'une licence est requis pour toute utilisation en production. Consultez notre site web pour les tarifs et conditions.

---

**OmniDesk** — Votre centre de communication intelligent  
Build: Node.js + React + PostgreSQL + Redis + Socket.io  
© 2024 OmniDesk. Tous droits réservés.
