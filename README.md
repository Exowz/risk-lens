# RiskLens 🎯
> Plateforme de gestion de risque de portefeuille financier par IA

**Projet Bachelor Data & AI — ECE Paris 2025-2026**

---

## 🎯 Présentation

RiskLens est une plateforme full-stack qui démocratise l'analyse de risque
financier institutionnelle grâce à l'IA. Elle combine finance quantitative
(VaR, CVaR, Monte Carlo, Markowitz) avec Mistral AI pour rendre ces outils
accessibles à tous les profils d'investisseurs.

## ✨ Features principales

- **Analyse de risque** — VaR historique + paramétrique, CVaR, Monte Carlo GBM
- **Optimisation Markowitz** — Frontière efficiente D3.js interactive
- **Stress testing** — Crises 2008, COVID-19, hausses de taux 2022
- **Rapport IA** — Analyse narrative générée par Mistral
- **Mode Débutant/Expert** — Interface adaptée à chaque profil
- **Explications IA** — Chaque métrique expliquée en langage naturel

## 🛠 Stack technique

| Couche | Technologie |
|--------|-------------|
| Frontend | Next.js 16.2 · TypeScript · Tailwind · shadcn/ui · Aceternity UI |
| Backend | FastAPI · Python 3.12 · SQLAlchemy 2.0 async |
| Base de données | PostgreSQL 16 (Docker) |
| IA | Mistral API (mistral-small-latest) |
| Auth | BetterAuth (sessions opaques) |
| Package managers | bun (frontend) · uv (backend) |

## 📋 Prérequis

- [Docker Desktop](https://www.docker.com/products/docker-desktop/)
- [Node.js 20+](https://nodejs.org/)
- [Bun](https://bun.sh/) — `curl -fsSL https://bun.sh/install | bash`
- [Python 3.12+](https://www.python.org/)
- [uv](https://docs.astral.sh/uv/) — `curl -LsSf https://astral.sh/uv/install.sh | sh`
- Clé API Mistral — [mistral.ai](https://mistral.ai/)

## 🚀 Installation

### 1. Cloner le projet
```bash
git clone <repo-url>
cd risklens
```

### 2. Variables d'environnement

**backend/.env**
```env
DATABASE_URL=postgresql+asyncpg://postgres:password@localhost:5432/risklens
MISTRAL_API_KEY=your_mistral_api_key_here
SECRET_KEY=your_secret_key_here
```

**frontend/.env.local**
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
BETTER_AUTH_SECRET=your_better_auth_secret_here
BETTER_AUTH_URL=http://localhost:3000
DATABASE_URL=postgresql://postgres:password@localhost:5432/risklens
```

### 3. Base de données
```bash
docker compose up -d
```

### 4. Backend
```bash
cd backend
uv sync
uv run alembic upgrade head
uv run uvicorn app.main:app --reload --port 8000
```

### 5. Frontend
```bash
cd frontend
bun install
bun dev
```

### 6. Accès
- **Application** : http://localhost:3000
- **API Swagger** : http://localhost:8000/docs

## 🏗 Architecture

```
risklens/
├── frontend/          # Next.js 16 app
│   └── src/
│       ├── app/       # Routes (auth + dashboard)
│       ├── components/ # UI components
│       └── lib/       # API hooks + Zustand stores
└── backend/           # FastAPI app
    └── app/
        ├── api/v1/    # REST endpoints
        ├── services/  # Business logic
        └── models/    # Database models
```

## 📊 Portefeuille de démonstration

Lors de la première connexion, créer un portefeuille avec :
- AAPL (Apple) — 40%
- MSFT (Microsoft) — 30%
- NVDA (NVIDIA) — 30%

## ⚠️ Avertissement

Les données sont fournies par Yahoo Finance à titre éducatif.
RiskLens ne constitue pas un conseil en investissement.
