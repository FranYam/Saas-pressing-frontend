# PressNet — SaaS de gestion de pressing 🇧🇫

Application **Progressive Web App (PWA)** de gestion de pressing pour le marché burkinabè : commandes, clients, paiements mobile money, créances et livraisons, entièrement en français.

## Stack technique

- **React 18 + TypeScript** (Vite)
- **React Router v6** — navigation et protection par rôle
- **Tailwind CSS** — design system terracotta / sable chaud
- **Lucide React** — icônes
- **Recharts** — graphique CA du tableau de bord
- **React Hook Form + Zod** — validation des formulaires
- **Axios** — service API centralisé (mocks pour l'instant)
- **Zustand** (persist) — state management + cache offline
- **vite-plugin-pwa (Workbox)** — manifest, service worker, cache-first assets / network-first API

## Démarrage

```bash
npm install
npm run icons   # génère les icônes PWA dans public/icons (déjà commitées)
npm run dev     # http://localhost:5173
npm run build   # build de production
npm run preview # sert le build + PWA
```

## Comptes de démonstration

| Rôle     | Email                | Mot de passe        | Accès                                      |
| -------- | -------------------- | ------------------- | ------------------------------------------ |
| Gérant   | gerant@pressnet.bf   | n'importe lequel    | Toutes les routes                          |
| Employé  | employe@pressnet.bf  | n'importe lequel    | Tableau de bord (sans CA), Commandes, Clients |
| Coursier | coursier@pressnet.bf | n'importe lequel    | /courier/dashboard, /courier/missions, /courier/history |
| Client   | client@pressnet.bf   | n'importe lequel    | /client/dashboard, /client/collect, /client/history, /client/track/:id, /client/pay/:id |

> Démo sans backend : la connexion vérifie uniquement l'email. Aucun mot de passe réel n'est stocké dans le code.

## Architecture

```
src/
├── components/
│   ├── layout/        # Sidebar, Header, AppLayout, PortalLayout (client/coursier), Logo
│   ├── ui/            # StatusBadge, KPICard, DataTable (mode cartes mobile), Modal…
│   └── forms/         # TextField, SelectField, PhoneInput, DatePicker…
├── context/           # AuthContext (rôle, login/logout)
├── data/              # mocks.ts (données burkinabè réalistes)
├── lib/               # format.ts (FCFA, dates FR), pwa.ts (install/offline)
├── pages/
│   ├── auth/          # /login, /register (3 étapes)
│   ├── app/           # dashboard, orders, clients, payments, deliveries, team, settings
│   ├── client/        # /client/dashboard, /client/collect, /client/history, /client/track/:id, /client/pay/:id
│   └── courier/       # /courier/dashboard, /courier/missions, /courier/missions/:id, /courier/history
├── services/          # api.ts (service centralisé, mocks simulés)
├── store/             # useAppStore.ts (Zustand + persistance offline)
└── types/             # modèles TypeScript
```

## Points clés

- **Rôles** : `ProtectedRoute` redirige chaque rôle vers son espace (gérant/employé → app, coursier → portail coursier, client → portail client)
- **Portails web Client & Coursier** : layout responsive avec barre de navigation sur PC (≥ md) et menu hamburger sur mobile — tableaux de bord, historiques et vues détaillées adaptés aux deux formats
- **Responsive complet** : tableaux de l'application convertis automatiquement en cartes sur mobile, grilles multi-colonnes sur grand écran
- **Montants** : toujours en FCFA avec séparateur de milliers (`245 000 FCFA`)
- **Offline** : données mises en cache (Zustand persist) + service worker Workbox ; bandeau hors ligne automatique
- **Lazy loading** : chaque route est découpée (code-splitting) pour connexion lente
