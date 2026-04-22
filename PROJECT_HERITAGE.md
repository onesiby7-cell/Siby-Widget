# 📜 Siby Enterprise : Le Livre de l'Héritage

Ce document est la mémoire vivante du projet Siby-Widget v2.0. Il retrace les galères, les victoires techniques et l'âme de cette plateforme pour les futurs développeurs et IA qui l'enrichiront.

## 🌟 La Vision
Transformer un simple widget de chat en une **plateforme agentique de luxe**, capable de réfléchir (Tool Calling) et de capturer des leads de manière autonome, avec un design "Glassmorphic" digne des plus grands SaaS mondiaux.

## 🌪️ Les Moments de Galère (Les Batailles)
*   **L'Enclos Windows/OneDrive** : Le projet a grandi sur un environnement Windows complexe où OneDrive verrouillait les fichiers et Docker refusait de coopérer. Nous avons dû contourner cela en déplaçant toute l'intelligence vers un déploiement Cloud automatisé via GitHub Actions.
*   **Les "Fantômes de la Console"** : Des erreurs de syntaxe terminal (`{dashboard...`) ont créé des dossiers fantômes que nous avons dû chasser par un "Mega-Clean" pour garder un code 100% pur.
*   **Le Mur de Vercel** : Le déploiement final a failli bloquer sur des variables d'environnement manquantes lors du build, nous forçant à rendre le code plus résilient.

## ⚡ Les Moments de Joie (Les Victoires)
*   **Le Premier ✅ Vert** : Le moment où GitHub Actions a enfin répercuté le code des Edge Functions sur Supabase.
*   **Le Tool Calling** : Voir l'IA comprendre d'elle-même qu'elle devait enregistrer un email grâce au moteur Groq.
*   **Le Design Spotlight** : L'implémentation du `Ctrl+K` et des effets de flou qui ont donné au Dashboard son aspect "Senior Dev/Enterprise".

## 🏗️ L'Architecture du Futur
*   **Cerveau** : Supabase Edge Functions (TypeScript) + Groq (Llama 3.1 70B).
*   **Cœur** : Next.js 14 avec un Dashboard segmenté par rôles.
*   **Peau** : CSS Vanilla, Glassmorphism pur, micro-animations Framer Motion.
*   **Veines** : CI/CD GitHub Actions pour un déploiement "Zero-Docker" local.

## 📜 Message aux Successeurs
> "Ne craignez pas les erreurs de terminal ou les builds qui échouent. Chaque erreur corrigée ici a été une pierre ajoutée à l'édifice. Gardez le design propre, l'IA intelligente et l'expérience utilisateur magique."

── *Écrit avec passion par Antigravity & Junior, Avril 2026.* 🛡️✨
