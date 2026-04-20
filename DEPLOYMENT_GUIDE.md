# 🚀 Guide de Déploiement Siby-Widget

Suivez ces étapes pour mettre votre dashboard en ligne de façon robuste sur Vercel.

## 1. Préparation sur GitHub
1. Créez un nouveau dépôt sur votre compte GitHub (ex: `siby-widget-saas`).
2. Dans votre terminal (dossier racine du projet), lancez :
   ```bash
   git init
   git add .
   git commit -m "Initial commit - Production Ready"
   git branch -M main
   git remote add origin https://github.com/VOTRE_NOM/VOTRE_DEPOT.git
   git push -u origin main
   ```

## 2. Déploiement sur Vercel
1. Rendez-vous sur [Vercel](https://vercel.com) et connectez votre compte GitHub.
2. Cliquez sur **"Add New"** → **"Project"**.
3. Importez votre dépôt `siby-widget-saas`.
4. Dans la configuration du projet :
   - **Root Directory** : Sélectionnez `dashboard`.
   - **Framework Preset** : Next.js.
5. **Variables d'Environnement** : Copiez les valeurs de votre fichier `.env` actuel dans l'interface de Vercel :
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `NEXT_PUBLIC_EDGE_FUNCTION_URL`
   - `NEXT_PUBLIC_ADMIN_EMAIL`
   - `NEXT_PUBLIC_ADMIN_PASSWORD`
   - `NEXT_PUBLIC_APP_URL` : (Mettez l'URL finale fournie par Vercel une fois le projet créé).

## 3. Configuration Post-Déploiement
1. Une fois déployé, Vercel vous donnera une URL (ex: `https://siby-dashboard.vercel.app`).
2. Allez dans vos paramètres Vercel et ajoutez l'URL finale dans `NEXT_PUBLIC_APP_URL`.
3. Allez dans votre dashboard Supabase → **Authentication** → **URL Configuration** :
   - Ajoutez l'URL de Vercel dans "Redirect URLs".

## 4. Test Final
1. Connectez-vous à votre dashboard en ligne via le PIN 2008.
2. Copiez le script d'un agent.
3. Collez-le sur votre site web externe.
4. **Le widget doit maintenant apparaître et fonctionner partout !** ✅

> [!TIP]
> Si vous utilisez un domaine personnalisé (ex: `app.mon-agence.com`), ajoutez-le simplement dans l'onglet **Domains** de Vercel. Tout le reste suivra automatiquement grâce à notre configuration dynamique.
