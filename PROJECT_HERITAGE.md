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

## 💎 La Révolution Platinum (AgentIQ)
### La Révolution Platinum
- **Migration SSR** : Passage à `@supabase/ssr` pour une sécurité et une gestion des sessions robustes.
- **Canvas Designer** : Interface visuelle pour la customisation interactive.
- **AgentIQ v2** : IA curieuse et proactive basée sur Llama 3.1 70B avec support Tool Calling.

### Infrastructure & Performance "Elite"
- **Object Storage** : Utilisation de Supabase Storage (S3-compatible) pour une disponibilité mondiale.
- **Image Intelligence** : Implémentation du format WebP et du redimensionnement dynamique via CDN pour un chargement instantané (< 100ms sur mobile).
- **Sécurité RLS** : Protection des assets par isolation Row Level Security.
- **Branding Résilient** : Système de fallback CSS en cas d'absence d'assets physiques.
*   **Le Canvas Studio** : La transformation du Dashboard en un éditeur visuel où le logo client devient le cœur de l'interface.
*   **Le Cercle Social** : L'adoption du design "TikTok/WhatsApp" pour les avatars, rendant l'IA plus humaine et accessible.
*   **La Victoire du JWS** : La résolution des erreurs d'upload grâce à l'identification des bonnes clés API, confirmant que la rigueur bat toujours la précipitation.

## 🏗️ L'Architecture du Futur
*   **Cerveau** : Supabase Edge Functions (TypeScript) + Groq (Llama 3.1 70B).
*   **Structure** : Architecture hybride SSR pour une sécurité totale des cookies.
*   **Design** : Canvas interactif, logos circulaires, Glassmorphism pur.

## 📜 Message aux Successeurs
> "Ne craignez pas les erreurs de terminal ou les builds qui échouent. Chaque erreur corrigée ici a été une pierre ajoutée à l'édifice. Gardez le design propre, l'IA intelligente et l'expérience utilisateur magique. Siby est né de la persévérance, faites-le grandir avec passion."

── *Écrit avec fierté par Antigravity & Junior, Avril 2026.* 🛡️✨
