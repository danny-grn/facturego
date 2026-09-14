# FactureGO

Application de facturation électronique avec signature en ligne et suivi en temps réel.
Next.js 16 (App Router) · TypeScript · Tailwind v4 · Supabase (auth + base de données) · pdf-lib.

## Fonctionnalités

- **Authentification** (email / mot de passe) via Supabase Auth.
- **Clients** : carnet de contacts (CRUD).
- **Factures** : création avec lignes multiples, calcul automatique de la TVA et des totaux,
  numérotation automatique, statuts (brouillon → envoyée → consultée → signée → payée / en retard /
  annulée), export PDF.
- **Documents génériques** : import de n'importe quel PDF (devis, contrat…) à faire signer.
- **Signature électronique** : lien public unique et sécurisé (`/sign/[token]`), signature manuscrite
  au doigt/souris, horodatage, adresse IP, empreinte, certificat de signature intégré au PDF.
- **Tableau de bord** : encaissements, montants en attente/en retard, graphique des 6 derniers mois,
  répartition par statut.
- **Paramètres** : informations d'entreprise, logo, coordonnées bancaires, préfixe de facturation,
  changement de mot de passe.

## Mise en route

### 1. Installer les dépendances

```bash
npm install
```

### 2. Créer la base Supabase

1. Créez un projet sur [supabase.com](https://supabase.com).
2. Ouvrez **SQL Editor** et exécutez l'intégralité du fichier [`supabase/schema.sql`](supabase/schema.sql).
   Ce script crée toutes les tables, active la sécurité au niveau des lignes (RLS) et met en place les
   fonctions nécessaires à la signature publique. Il est idempotent (relançable sans risque).
3. Dans **Project Settings → API**, récupérez l'URL du projet et la clé `anon public`.

### 3. Configurer les variables d'environnement

```bash
cp .env.local.example .env.local
```

Renseignez `NEXT_PUBLIC_SUPABASE_URL` et `NEXT_PUBLIC_SUPABASE_ANON_KEY`. Aucune clé de service (`service_role`)
n'est nécessaire : tout l'accès public (liens de signature) passe par des fonctions PostgreSQL
`SECURITY DEFINER` dédiées, pas par un contournement des règles RLS côté application.

### 4. Lancer l'application

```bash
npm run dev
```

Ouvrez [http://localhost:3000](http://localhost:3000). Créez un compte, puis renseignez vos informations
d'entreprise dans **Paramètres** avant de créer votre première facture.

## Scripts

```bash
npm run dev       # serveur de développement
npm run build     # build de production
npm run start     # démarrer le build de production
npm run lint      # ESLint
npm run test      # suite de tests Vitest
npm run test:watch
```

## Architecture

- `src/app` — routes (App Router) : marketing (`/`), auth (`/login`, `/signup`), espace protégé
  (`/dashboard/**`), signature publique (`/sign/[token]`), routes API de génération PDF.
- `src/components` — composants UI réutilisables (`ui/`) et composants métier par domaine.
- `src/lib` — accès Supabase, requêtes, validation (Zod), calculs de facturation, génération PDF (pdf-lib).
- `supabase/schema.sql` — schéma complet de la base (tables, RLS, fonctions RPC).

## Notes de sécurité

- Toutes les tables ont RLS activé : chaque utilisateur ne voit que ses propres données.
- Le flux de signature public ne passe par **aucune** policy RLS ouverte à `anon` : il transite
  exclusivement par les fonctions `get_signable_by_token` et `submit_signature_by_token`, qui vérifient
  le jeton de partage (UUID non devinable, généré côté base de données).
- Les fichiers PDF importés et les signatures manuscrites sont stockés encodés en base64 directement en
  base — suffisant pour un usage TPE/indépendant ; envisagez Supabase Storage si vous gérez de gros
  volumes de documents.
