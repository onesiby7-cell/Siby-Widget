# ⚡ SIBY-WIDGET — AgentIQ Platinum Suite v4.0

> La plateforme d'IA agentique la plus puissante, dotée d'un studio de design Canvas et d'une architecture SSR ultra-performante.

---

## 🌟 Nouveautés Platinum v4.0
- **🎨 Canvas Design Studio** : Éditeur visuel temps réel avec support d'upload de logo (Style WhatsApp/TikTok).
- **🧠 Intelligence AgentIQ** : IA proactive utilisant Llama 3.1 70B, capable de curiosité et de relance automatique.
- **🛡️ Architecture SSR (@supabase/ssr)** : Migration complète vers le standard moderne de Supabase pour une sécurité et une vitesse accrues.
- **📱 Connecteurs Réels** : Intégration Telegram et WhatsApp Twilio active pour des notifications leads instantanées.

---

## 🚀 Démarrage rapide

### 1. Installer les dépendances
```bash
cd dashboard
npm install
```

### 2. Configurer les variables d'environnement
Créez un fichier `.env` avec :
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (Key Anon Supabase)

### 3. Lancer le dashboard
```bash
npm run dev
# → http://localhost:3001
```

---

## ⚙️ Configuration complète

### A. Supabase (Base de données)
1. Exécutez le script SQL complet dans votre console Supabase.
2. Créez un Bucket de stockage nommé `agent-assets` (Public).

### B. Supabase Edge Functions
Déployez l'intelligence avec la commande :
```bash
npx supabase functions deploy chat-agent
```

### C. Groq API
Utilisez une clé `GROQ_API_KEY` dans vos secrets Supabase ou par agent dans le Dashboard.

---

## 🎯 Fonctionnalités Dashboard Platinum

| # | Feature | Description |
|---|---------|-------------|
| 1 | **Canvas Studio** | Aperçu live du widget avec personnalisation visuelle poussée |
| 2 | **Upload Assets** | Support des logos et avatars avec détection circulaire auto |
| 3 | **AgentIQ Brain** | Personnalité proactive et curieuse pour la capture de leads |
| 4 | **Connecteurs** | Formulaires Telegram/WhatsApp configurables par agent |
| 5 | **Typesafety** | Architecture Typescript intégrale avec gestion SSR |

---

## 🔌 Intégration client (1 ligne)

```html
<!-- Collez avant </body> -->
<script
  src="https://YOUR_DOMAIN/widget.js"
  data-agent-id="VOTRE_AGENT_ID"
  async
></script>
```

---

## 🔒 Sécurité & Performance

- ✅ **SSR Ready** : Gestion fluide des cookies et sessions serveur.
- ✅ **Privacy First** : Isolation totale des données via RLS.
- ✅ **Optimized Assets** : Utilisation de Supabase Storage pour des logos ultra-légers.

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
