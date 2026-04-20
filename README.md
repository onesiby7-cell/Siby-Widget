# ⚡ SIBY-WIDGET — SaaS d'Agents IA

> Plateforme complète pour déployer des agents IA personnalisés sur n'importe quel site web avec une seule ligne de code.

---

## 🚀 Démarrage rapide

### 1. Installer les dépendances
```bash
cd dashboard
npm install
```

### 2. Configurer les variables d'environnement
```bash
cp .env.example .env.local
# Puis éditez .env.local avec vos vraies valeurs
```

### 3. Lancer le dashboard
```bash
npm run dev
# → http://localhost:3000
```

---

## ⚙️ Configuration complète

### A. Supabase (Base de données)

1. Créez un projet sur [supabase.com](https://supabase.com)
2. Allez dans **SQL Editor** et exécutez le fichier :
   ```
   supabase/migrations/001_init.sql
   ```
3. Copiez votre **URL** et **anon key** → `.env.local`

### B. Supabase Edge Function

1. Installez le CLI Supabase :
   ```bash
   npm install -g supabase
   supabase login
   supabase link --project-ref YOUR_PROJECT_REF
   ```

2. Définissez les secrets :
   ```bash
   supabase secrets set GROQ_API_KEY=gsk_votre_clé_groq
   ```

3. Déployez la fonction :
   ```bash
   supabase functions deploy chat-agent
   ```

4. Récupérez l'URL de la fonction :
   ```
   https://YOUR_PROJECT.supabase.co/functions/v1/chat-agent
   ```
   → Ajoutez-la dans `.env.local` → `NEXT_PUBLIC_EDGE_FUNCTION_URL`

### C. Groq API

1. Créez un compte sur [console.groq.com](https://console.groq.com)
2. Générez une clé API
3. Option 1 : Clé globale → `supabase secrets set GROQ_API_KEY=gsk_...`
4. Option 2 : Clé par agent → Dans le dashboard, onglet "IA & Prompt" de chaque agent

### D. EmailJS (Notifications leads)

1. Créez un compte sur [emailjs.com](https://emailjs.com)
2. Créez un **Service** (Gmail, Outlook, etc.)
3. Créez un **Template** avec les variables :
   - `{{agent_name}}`, `{{lead_name}}`, `{{lead_email}}`
   - `{{lead_phone}}`, `{{conversation}}`, `{{date}}`
4. Copiez Service ID, Template ID, Public Key → Dashboard agent → Onglet "EmailJS"

---

## 📁 Structure du projet

```
siby-widget/
├── dashboard/                    # Next.js 14 App Router
│   ├── app/
│   │   ├── page.tsx              # Landing page
│   │   ├── auth/
│   │   │   ├── login/            # Connexion
│   │   │   └── register/         # Inscription
│   │   └── dashboard/
│   │       ├── layout.tsx        # Sidebar navigation
│   │       ├── page.tsx          # Vue d'ensemble
│   │       ├── agents/           # Gestion agents
│   │       │   ├── page.tsx      # Liste
│   │       │   ├── new/          # Création
│   │       │   └── [id]/         # Édition
│   │       ├── leads/            # CRM leads
│   │       ├── analytics/        # Graphiques
│   │       ├── playground/       # Test agents
│   │       ├── templates/        # Templates IA
│   │       ├── webhooks/         # Logs webhooks
│   │       ├── notifications/    # Notifications
│   │       ├── team/             # Gestion équipe
│   │       ├── billing/          # Plans & facturation
│   │       └── settings/         # Paramètres compte
│   ├── lib/
│   │   └── supabase.ts           # Client + types
│   └── globals.css               # Design system métal
│
├── widget/
│   └── widget.js                 # Widget universel (Vanilla JS)
│
└── supabase/
    ├── functions/
    │   └── chat-agent/
    │       └── index.ts          # Edge Function sécurisée
    └── migrations/
        └── 001_init.sql          # Schema complet + RLS
```

---

## 🎯 Fonctionnalités Dashboard (10+)

| # | Feature | Description |
|---|---------|-------------|
| 1 | **Multi-agents** | Créez et gérez autant d'agents que votre plan le permet |
| 2 | **Vue d'ensemble** | Stats temps réel + graphiques d'activité |
| 3 | **CRM Leads** | Gestion leads avec statuts Kanban + export CSV |
| 4 | **Analytics** | Métriques détaillées : sessions, tokens, latence, devices |
| 5 | **Playground** | Testez vos agents en temps réel avec latence/tokens visible |
| 6 | **Templates** | 5 templates pré-configurés par industrie |
| 7 | **Webhooks** | Logs complets + payload viewer + HMAC-SHA256 |
| 8 | **Notifications** | Centre de notifications avec badge compteur |
| 9 | **Gestion équipe** | Invitations avec rôles Admin/Éditeur/Viewer |
| 10 | **Facturation** | Plans Free/Starter/Pro/Enterprise + barre quota |
| 11 | **Aperçu widget** | Preview live lors de la configuration design |
| 12 | **Sidebar collapsible** | Navigation compacte ou étendue |

---

## ⚡ Fonctionnalités Système (10+)

| # | Feature | Description |
|---|---------|-------------|
| 1 | **Isolation totale** | RLS Supabase — chaque client isolé |
| 2 | **Clé Groq sécurisée** | Jamais exposée côté client |
| 3 | **Détection lead IA** | Extraction email/tél/nom automatique |
| 4 | **Rate limiting** | Configurable par agent (N messages/heure) |
| 5 | **Filtrage domaines** | Whitelist de domaines autorisés |
| 6 | **Mots bloqués** | Blacklist configurable par agent |
| 7 | **Webhooks signés** | HMAC-SHA256 pour sécurité maximale |
| 8 | **Historique session** | localStorage + persistance server-side |
| 9 | **Multi-modèles Groq** | Llama3 8B/70B, Mixtral, Gemma |
| 10 | **Analytics temps réel** | Sessions, messages, tokens, latence |
| 11 | **Quick replies** | Boutons de réponse rapide configurables |
| 12 | **CSS custom** | Override CSS complet par agent |
| 13 | **Auto-resize textarea** | Widget adaptatif |
| 14 | **Responsive widget** | Mobile-first, bottom sheet sur mobile |

---

## 🔌 Intégration client (1 ligne)

```html
<!-- Collez avant </body> -->
<script
  src="https://YOUR_CDN/widget.js"
  data-agent-id="VOTRE_AGENT_ID"
  async
></script>
```

---

## 🎨 Design System

- **Palette** : Métal profond `#050505` → Argent `#C0C0C0` → Blanc `#F0F0F0`
- **Police** : DM Sans (display) + DM Mono (code)
- **Effets** : Glass morphism, gradients métal, grain noise, glow
- **Animations** : CSS keyframes, spring physics

---

## 📡 API REST (avec clé API)

```bash
# Lister vos agents
GET /api/agents
Authorization: Bearer sw_votre_clé_api

# Statistiques
GET /api/agents/:id/stats
```

---

## 🔒 Sécurité

- ✅ Row Level Security (RLS) sur toutes les tables
- ✅ Clés API Groq jamais exposées côté client
- ✅ Edge Function valide origin + rate limit
- ✅ Signatures webhook HMAC-SHA256
- ✅ Sessions visiteur avec fingerprint anonyme

---

## 📬 Contact

**One Siby Agency** — Conakry, Guinea  
Construit avec ❤️ pour l'écosystème tech africain 🌍
