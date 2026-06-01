# PCT Frontend — Next.js 14 App Router (Complet)

## Stack
- **Next.js 14** App Router + TypeScript
- **TanStack Query v5** — cache & mutations
- **Axios** — HTTP + token Bearer auto + redirect 401
- **Recharts** — graphiques dashboard
- **React Hot Toast** — notifications
- **Lucide React** — icônes

## Installation & lancement

```bash
npm install
npm run dev   # → http://localhost:3000
```

Backend Laravel sur `localhost:8000` (configurable dans `.env.local`).

## Comptes de démo

| Login | Mot de passe | Rôle |
|---|---|---|
| admin@uvci.ci | Admin@2025 | Administrateur |
| secretaire@uvci.ci | Secretaire@2025 | Secrétaire |
| j.kouame@uvci.ci | Enseignant@2025 | Enseignant |

## Pages implémentées

### Admin & Secrétaire
| Page | Route | Description |
|---|---|---|
| Tableau de bord | `/dashboard` | Stats globales + graphiques Recharts |
| Activités | `/activites` | CRUD + validation + calcul Vhtc temps réel |
| Enseignants | `/enseignants` | CRUD complet avec département |
| Cours | `/cours` | CRUD cours (ECUE) |
| Séquences | `/sequences` | CRUD séquences groupées par cours |
| Ressources | `/ressources` | CRUD ressources avec barème Vhtc |
| Attributions | `/attributions` | CRUD + avancement par volume horaire |
| Volumes horaires | `/volumes` | Suivi avec barre de progression |
| Rapports | `/rapports` | Export PDF + Excel + barème Annexe 1 |

### Admin uniquement
| Page | Route | Description |
|---|---|---|
| Départements | `/departements` | CRUD en grille de cartes |
| Années académiques | `/annees` | CRUD + activation |
| Paramètres Vhtc | `/parametres` | Édition inline du barème + reset |
| Utilisateurs | `/utilisateurs` | CRUD comptes + rôles |

### Enseignant
| Page | Route | Description |
|---|---|---|
| Mon espace | `/mon-espace` | Dashboard personnel (flux F8) |
| Mes activités | `/mes-activites` | Déclaration + suivi |
| Simulateur | `/simuler` | Calcul Vhtc interactif |

## Architecture

```
src/
├── middleware.ts            ← Protection routes côté serveur (cookies)
├── app/
│   ├── layout.tsx           ← Root layout + Providers
│   ├── login/page.tsx
│   ├── dashboard/page.tsx
│   ├── activites/page.tsx
│   ├── enseignants/page.tsx
│   ├── cours/page.tsx
│   ├── sequences/page.tsx   ← Groupées par cours
│   ├── ressources/page.tsx  ← Avec preview Vhtc
│   ├── attributions/page.tsx
│   ├── volumes/page.tsx
│   ├── rapports/page.tsx
│   ├── parametres/page.tsx  ← Édition inline barème
│   ├── utilisateurs/page.tsx
│   ├── departements/page.tsx← Grille de cartes
│   ├── annees/page.tsx
│   ├── mon-espace/page.tsx
│   ├── mes-activites/page.tsx
│   └── simuler/page.tsx
├── components/
│   ├── Providers.tsx
│   ├── ui/index.tsx         ← Tous les composants UI
│   └── layout/
│       ├── Sidebar.tsx      ← Nav complète par rôle
│       └── DashboardLayout.tsx ← Guard + layout
├── lib/
│   ├── api.ts               ← Axios + toutes les routes
│   └── helpers.ts           ← Barème Annexe 1 + computeVhtc()
├── hooks/
│   └── useApi.ts            ← Hook mutation avec erreurs Laravel
└── store/
    └── authStore.tsx        ← Auth Context (localStorage + cookies)
```

## Sécurité — Double protection

1. **Middleware Next.js** (`src/middleware.ts`) — côté serveur, lit les cookies pour protéger les routes avant le rendu
2. **DashboardLayout** (`src/components/layout/DashboardLayout.tsx`) — côté client, redirige si le rôle ne correspond pas

Le `authStore` persiste le token dans `localStorage` (pour Axios) ET dans les cookies (pour le middleware).
