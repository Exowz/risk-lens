<div align="center">

# RiskLens

### _Plateforme de Gestion de Risque de Portefeuille par IA_

<p><em>Démocratiser l'analyse de risque financier institutionnelle grâce à l'intelligence artificielle</em></p>

![Status](https://img.shields.io/badge/status-operational-success?style=flat)
![Version](https://img.shields.io/badge/version-1.0-blue?style=flat)
![License](https://img.shields.io/badge/license-MIT-brightgreen?style=flat)
![ECE Paris](https://img.shields.io/badge/ECE_Paris-Bachelor_Data_%26_AI-red?style=flat)

<p><em>Built with the tools and technologies:</em></p>

![Next.js](https://img.shields.io/badge/Next.js-16.2-000000?style=flat&logo=next.js&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688?style=flat&logo=fastapi&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=flat&logo=typescript&logoColor=white)
![Python](https://img.shields.io/badge/Python-3.12-3776AB?style=flat&logo=python&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791?style=flat&logo=postgresql&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/Tailwind-CSS-38B2AC?style=flat&logo=tailwind-css&logoColor=white)

![Mistral](https://img.shields.io/badge/Mistral-AI-000000?style=flat)
![D3.js](https://img.shields.io/badge/D3.js-7-F9A03C?style=flat&logo=d3.js&logoColor=white)
![Recharts](https://img.shields.io/badge/Recharts-2-8884d8?style=flat)
![Framer Motion](https://img.shields.io/badge/Framer-Motion-0055FF?style=flat&logo=framer&logoColor=white)
![BetterAuth](https://img.shields.io/badge/BetterAuth-Sessions-purple?style=flat)
![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?style=flat&logo=docker&logoColor=white)

---

### 🎓 Projet Bachelor Data & AI 2025-2026

**ECE Paris** | Électif Finance | Bachelor 3 Data & AI

**[📊 Live Demo](#) · [🎨 Architecture](#architecture-système)**

</div>

---

## Table des Matières

- [Objectif du Projet](#objectif-du-projet)
- [Fonctionnalités](#fonctionnalités)
  - [1. Analyse de Risque Quantitative](#1-analyse-de-risque-quantitative)
  - [2. Optimisation Markowitz](#2-optimisation-markowitz)
  - [3. Stress Testing Historique](#3-stress-testing-historique)
  - [4. Intelligence Artificielle Intégrée](#4-intelligence-artificielle-intégrée)
  - [5. Mode Débutant / Expert](#5-mode-débutant--expert)
  - [6. Internationalisation](#6-internationalisation)
  - [7. Profil Utilisateur & Alertes](#7-profil-utilisateur--alertes)
- [Architecture Technique](#architecture-technique)
- [Architecture Système](#architecture-système)
- [Modèles de Données](#modèles-de-données)
- [API REST](#api-rest)
- [Installation](#installation-et-démarrage)
- [Structure du Projet](#structure-du-projet)
- [Décisions Techniques](#décisions-techniques)
- [Contributeur](#contributeur)

---

## Objectif du Projet

RiskLens est une plateforme full-stack qui **démocratise l'analyse de risque financier institutionnelle** en combinant finance quantitative rigoureuse et intelligence artificielle générative.

Ce projet répond à un constat simple : les outils de gestion de risque de niveau institutionnel (VaR, CVaR, Monte Carlo, Markowitz) sont inaccessibles au grand public, soit par manque de connaissance technique, soit par manque d'outils adaptés. RiskLens résout ce problème avec deux innovations :

- **Mode Débutant / Expert** : une même interface s'adapte au profil de l'utilisateur — labels vulgarisés et explications IA pour le novice, métriques techniques complètes pour le quant.
- **IA explicative** : chaque métrique et chaque graphique peut être analysé par Mistral AI en langage naturel, à la demande, dans la langue de l'utilisateur.

---

## Fonctionnalités

### 1. Analyse de Risque Quantitative

#### Value at Risk (VaR)

Deux méthodes de calcul implémentées :

- **VaR Historique** : Quantile empirique de la distribution des rendements historiques
  ```
  VaR_α = -Q_α(R_t)
  ```
  où Q_α est le quantile à niveau de confiance α de la distribution empirique des rendements journaliers R_t.

- **VaR Paramétrique** : Hypothèse de normalité des rendements
  ```
  VaR_α = μ + σ × z_α
  ```
  où z_α est le quantile de la loi normale standard au niveau α.

Niveaux de confiance : 95% et 99%.

#### CVaR / Expected Shortfall

Mesure cohérente du risque de queue, moyenne des pertes au-delà de la VaR :
```
CVaR_α = E[R | R < VaR_α] = (1/(1-α)) × ∫_{-∞}^{VaR_α} R × f(R) dR
```

#### Simulation Monte Carlo (GBM)

10 000 trajectoires sur 252 jours de trading via Geometric Brownian Motion :
```
dS = μ·S·dt + σ·S·dW
S(t+Δt) = S(t) × exp((μ - σ²/2)Δt + σ·√Δt·ε)
```
où ε ~ N(0,1), μ est le rendement historique annualisé, σ la volatilité historique.

**Métriques calculées** :
- VaR 95% simulée
- P(Rp < 0) : probabilité de perte sur 1 an
- Distribution empirique des valeurs finales de portefeuille

### 2. Optimisation Markowitz

Implémentation de la théorie moderne du portefeuille via **PyPortfolioOpt** :

#### Frontière Efficiente

100 portefeuilles calculés sur la frontière, minimisant la variance pour chaque niveau de rendement cible :
```
min  w^T Σ w
s.t. w^T μ = μ_target
     Σ w_i = 1
     w_i ≥ 0
```

#### Portefeuilles Optimaux

- **Minimum Variance** : `min w^T Σ w` sous contrainte Σw_i = 1
- **Maximum Sharpe** : `max (w^T μ - r_f) / √(w^T Σ w)`

**Correction du look-ahead bias** : dans le stress testing, les poids Markowitz sont calculés exclusivement avec les données disponibles *avant* chaque période de crise.

#### Ratio de Sharpe

```
Sharpe = (Rp - Rf) / σp
```
Annualisé avec Rf = 0 (simplifié), σp = volatilité annualisée = σ_journalière × √252.

### 3. Stress Testing Historique

Trois scénarios de crise calibrés sur données réelles :

| Scénario | Période | Événement déclencheur |
|----------|---------|----------------------|
| Crise Financière 2008 | Sep 2008 → Mar 2009 | Faillite de Lehman Brothers |
| Pandémie COVID-19 | Fév 2020 → Avr 2020 | Choc de liquidité mondial |
| Hausse des taux Fed | Jan 2022 → Oct 2022 | Resserrement monétaire brutal |

**Métriques calculées par scénario** :
- `total_return` : rendement cumulé sur la période de stress
- `max_drawdown` : max(Peak - Trough) / Peak
- `recovery_days` : jours de trading entre le creux et le retour au niveau pré-crise (null si non récupéré)

**Comparaison** : chaque scénario compare le portefeuille actuel au portefeuille Max Sharpe Markowitz.

### 4. Intelligence Artificielle Intégrée

#### Moteur d'Explications (Mistral AI)

Chaque métrique et chaque graphique dispose d'une explication générée à la demande par `mistral-small-latest` :

- **Explication par métrique** : `POST /risk/explain-metric`
- **Explication Monte Carlo** : `POST /risk/explain-montecarlo`
- **Explication distribution** : `POST /risk/explain-distribution`
- **Portefeuille Bavard** : `POST /markowitz/explain` — analyse contextuelle d'un point sur la frontière efficiente
- **Explication stress test** : `POST /stress/explain-result`
- **Rapport narratif complet** : `POST /report/generate` — rapport 5 sections, ~2500 tokens

**Paramètres Mistral** : `temperature=0.3`, `max_tokens=300` (explications) / `2500` (rapport).

#### Risk Profiler Express

Onboarding IA en 4 questions (horizon, tolérance, objectif, expérience) → Mistral génère un profil d'investisseur personnalisé avec allocation suggérée.

### 5. Mode Débutant / Expert

Principe de démocratisation central du projet :

| Métrique | Mode Débutant | Mode Expert |
|----------|---------------|-------------|
| VaR 95% | "Perte max journalière (1 jour sur 20)" | "VaR 95%" |
| CVaR | "Perte moyenne dans les pires cas" | "CVaR 95% (Expected Shortfall)" |
| Sharpe | "Score rendement/risque" | "Sharpe Ratio" |
| Volatilité | "Variabilité du portefeuille" | "Volatilité annualisée (σ×√252)" |

En mode Expert, le **jargon financier reste en anglais** quelle que soit la langue — c'est le standard professionnel international.

### 6. Internationalisation

4 langues supportées via `next-intl` :

| Code | Langue | Jargon Expert |
|------|--------|---------------|
| `fr` | Français (défaut) | Termes EN |
| `en` | English | Termes EN |
| `es` | Español | Termes EN |
| `zh` | 中文 | Termes EN |

Mistral répond automatiquement dans la langue active de l'interface.
Pas de préfixe d'URL — locale stockée en cookie + base de données.

### 7. Profil Utilisateur & Alertes

- **Profil de risque** : résultat du Risk Profiler persisté en base
- **Préférences** : mode (débutant/expert), nb simulations Monte Carlo, locale
- **Alertes de seuil** : notifications automatiques si VaR dépasse un seuil défini
- **Historique** : timeline des rapports générés (Aceternity UI Timeline)

---

## Architecture Technique

```
┌─────────────────────────────────────────────────────────────┐
│                      FRONTEND                               │
│  Next.js 16.2 · TypeScript · Tailwind · Framer Motion       │
│                                                             │
│  UI Libraries:                                              │
│  • shadcn/ui (primitives)                                   │
│  • Aceternity UI (expandable cards, tracing beam...)        │
│  • Magic UI (number ticker, shimmer button, marquee...)     │
│  • Cult UI (dynamic island, direction-aware tabs...)        │
│  • ReactBits (blur text, particles...)                      │
│                                                             │
│  State: Zustand · TanStack Query v5                         │
│  Auth client: BetterAuth (opaque sessions)                  │
│  Charts: Recharts + D3.js                                   │
│  i18n: next-intl (cookie-based)                             │
└────────────────────┬────────────────────────────────────────┘
                     │ HTTP (proxy.ts)
┌────────────────────▼────────────────────────────────────────┐
│                      BACKEND                                │
│  FastAPI · Python 3.12 · uv · Pydantic v2                   │
│  SQLAlchemy 2.0 async · asyncpg · Alembic                   │
│                                                             │
│  Services:                                                  │
│  • risk_engine.py      (VaR, CVaR, Sharpe)                 │
│  • montecarlo_engine.py (GBM 10k trajectoires)             │
│  • markowitz_engine.py  (PyPortfolioOpt)                   │
│  • stress_engine.py     (3 scénarios historiques)          │
│  • mistral_service.py   (rapport narratif)                 │
│  • explain_service.py   (explications métriques)           │
│  • market_data.py       (yfinance + cache)                 │
└────────────────────┬────────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────────┐
│                    DATABASE                                 │
│  PostgreSQL 16 (Docker Compose)                             │
│  BetterAuth (sessions) · calculation_cache · portfolios    │
│  reports · user_risk_profile · user_preferences            │
│  user_alerts · user_notifications                          │
└─────────────────────────────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────────┐
│                  EXTERNAL APIs                              │
│  Mistral AI (mistral-small-latest)                          │
│  Yahoo Finance (yfinance, cours historiques + live)         │
└─────────────────────────────────────────────────────────────┘
```

---

## Architecture Système

```
risklens/
├── docker-compose.yml          # PostgreSQL 16
├── README.md
├── frontend/
│   ├── CLAUDE.md
│   ├── SKILL.md
│   ├── messages/               # Traductions i18n
│   │   ├── fr.json
│   │   ├── en.json
│   │   ├── es.json
│   │   └── zh.json
│   └── src/
│       ├── app/
│       │   ├── page.tsx        # Landing page (public)
│       │   ├── (auth)/         # login, register
│       │   └── (dashboard)/    # pages protégées
│       ├── components/
│       │   ├── layout/         # TopBar, SidebarContainer, CanvasHeader, AvatarZone
│       │   ├── shared/         # KpiExpandableCard, ChartExpandableCard, WhyExpandableCard...
│       │   ├── charts/         # Recharts + D3
│       │   └── ui/             # shadcn + Aceternity + Magic UI + Cult UI + ReactBits
│       └── lib/
│           ├── api/            # TanStack Query hooks
│           └── store/          # Zustand + ModeContext
└── backend/
    └── app/
        ├── api/v1/             # portfolios, risk, montecarlo, markowitz, stress, report, profile
        ├── core/               # config, database, security, cache
        ├── models/             # SQLAlchemy models
        ├── schemas/            # Pydantic v2
        └── services/           # engines + mistral + explain
```

---

## Modèles de Données

```sql
-- Géré par BetterAuth
user (id, email, name, created_at)
session (id, user_id, token, expires_at)

-- Portefeuilles
portfolio (id, user_id, name, assets JSON, created_at)
asset (id, portfolio_id, ticker, weight)

-- Cache de calculs (TTL 1h)
calculation_cache (cache_key PK, result_json, expires_at)

-- Rapports IA
report (id, portfolio_id, user_id, content, created_at)

-- Profil utilisateur
user_risk_profile (id, user_id, horizon, loss_tolerance, objective,
                   experience, profile_name, risk_score,
                   suggested_tickers JSON, created_at)

-- Préférences
user_preferences (id, user_id, mode, monte_carlo_simulations, locale)

-- Alertes
user_alerts (id, user_id, portfolio_id, metric, threshold,
             direction, active, created_at)
user_notifications (id, user_id, alert_id, message, read, created_at)
```

---

## API REST

### Authentification
Les endpoints protégés utilisent BetterAuth (sessions opaques).
Le token est automatiquement transmis via cookie.

### Portfolios
```
GET    /portfolios                    Liste des portefeuilles
POST   /portfolios                    Créer un portefeuille
PUT    /portfolios/{id}               Modifier un portefeuille
DELETE /portfolios/{id}               Supprimer un portefeuille
GET    /portfolios/{id}/performance   Performance historique
GET    /portfolios/{id}/live-prices   Prix temps réel (cache 5min)
```

### Analyse de Risque
```
GET    /risk/{portfolio_id}/summary       VaR, CVaR, Sharpe, volatilité
POST   /risk/simulate                     Simuler pondérations arbitraires
POST   /risk/explain-metric               Explication IA d'une métrique
POST   /risk/explain-montecarlo           Explication IA Monte Carlo
POST   /risk/explain-distribution         Explication IA distribution
```

### Monte Carlo
```
POST   /montecarlo/{portfolio_id}         Lancer simulation (10k, 252j)
```

### Markowitz
```
GET    /markowitz/{portfolio_id}/frontier  Frontière efficiente (100 pts)
POST   /markowitz/explain-position         Explication IA position actuelle
POST   /markowitz/explain                  Portefeuille Bavard (point clic)
```

### Stress Testing
```
GET    /stress/{portfolio_id}             Tous les scénarios
POST   /stress/explain-result             Explication IA résultat
```

### Rapport
```
POST   /report/generate                   Générer rapport Mistral
GET    /report/{portfolio_id}/latest      Dernier rapport
```

### Profil
```
POST   /profile/risk-profiler             Exécuter le Risk Profiler
GET    /profile/risk-profile              Profil de risque
GET    /profile/preferences               Préférences utilisateur
PUT    /profile/preferences               Mettre à jour préférences
GET    /alerts                            Alertes actives
POST   /alerts                            Créer une alerte
DELETE /alerts/{id}                       Supprimer une alerte
```

---

## Installation et Démarrage

### Prérequis

- [Docker Desktop](https://www.docker.com/products/docker-desktop/)
- [Node.js 20+](https://nodejs.org/) + [Bun](https://bun.sh/)
  ```bash
  curl -fsSL https://bun.sh/install | bash
  ```
- [Python 3.12+](https://www.python.org/) + [uv](https://docs.astral.sh/uv/)
  ```bash
  curl -LsSf https://astral.sh/uv/install.sh | sh
  ```
- Clé API Mistral : [console.mistral.ai](https://console.mistral.ai/)

### 1. Variables d'environnement

**backend/.env**
```env
DATABASE_URL=postgresql+asyncpg://postgres:password@localhost:5432/risklens
MISTRAL_API_KEY=your_mistral_api_key_here
SECRET_KEY=your_secret_key_32chars_minimum
```

**frontend/.env.local**
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
BETTER_AUTH_SECRET=your_better_auth_secret_here
BETTER_AUTH_URL=http://localhost:3000
DATABASE_URL=postgresql://postgres:password@localhost:5432/risklens
```

### 2. Base de données

```bash
docker compose up -d
```

### 3. Backend

```bash
cd backend
uv sync
uv run alembic upgrade head
uv run uvicorn app.main:app --reload --port 8000
```

### 4. Frontend

```bash
cd frontend
bun install
bun dev
```

### 5. Accès

| Service | URL |
|---------|-----|
| Application | http://localhost:3000 |
| API Swagger | http://localhost:8000/docs |
| PostgreSQL | localhost:5432 |

### 6. Premier lancement

1. Créer un compte sur http://localhost:3000/register
2. Le **Risk Profiler** se lance automatiquement (4 questions)
3. Créer un portefeuille (ex: AAPL 40%, MSFT 30%, NVDA 30%)
4. Explorer les analyses depuis le dashboard

---

## Décisions Techniques

### Pourquoi BetterAuth (sessions opaques) plutôt que JWT ?
Les sessions opaques stockées en PostgreSQL offrent une révocation immédiate et évitent les risques liés au stockage de JWT côté client. FastAPI vérifie les sessions par lookup en base, sans décodage de token.

### Pourquoi le cache SHA-256 pour les calculs ?
Monte Carlo (10k trajectoires) et Markowitz (frontière 100 points) sont coûteux en calcul. Un cache basé sur le SHA-256 des paramètres d'entrée avec TTL 1h évite les recalculs inutiles tout en garantissant la fraîcheur des données.

### Pourquoi yfinance côté backend uniquement ?
Les API keys ne doivent jamais être exposées au frontend. Tout passe par FastAPI qui maintient un cache mémoire de 1h pour les données historiques et 5min pour les prix live.

### Pourquoi next-intl sans préfixe d'URL ?
Une URL propre (localhost:3000/risk au lieu de /fr/risk) améliore l'UX et évite la complexité du routing i18n Next.js. La locale est stockée en cookie et en base de données.

### Pourquoi jspdf côté frontend pour le PDF ?
WeasyPrint (alternative Python) nécessite des librairies système (Pango, GLib) non installées sur toutes les machines. jspdf est pure JavaScript, fonctionne partout sans configuration.

---

## Contributeur

- **Mathew Kristoffer Ewan KAPOOR**
  - Bachelor Data & AI — ECE Paris 2025-2026

---

**Version** : 1.0
**Dernière mise à jour** : Mars 2026
**Statut** : ✅ Fonctionnel et opérationnel
