# bobprod web site — status

Document de passation détaillé pour reprendre le développement dans une nouvelle session
(notamment une session locale qui va traiter de vraies photos/vidéos de l'artiste). Lis ce fichier
en entier avant de commencer — il évite de redécouvrir par le code ce qui est déjà décidé et
pourquoi.

## C'est quoi, ce projet

`bobprod` est un DJ/producteur house & techno. Le repo contient :

- `project/` — 4 prototypes statiques HTML/CSS/JS (Biolink, App mobile, Website, Booking), portés
  depuis des exports Claude Design. Direction visuelle "1b" : near-black `#0a0a0a`, rouge
  `#d1382a` / or `#f0a91f`, Righteous (titres) + Poppins (texte), panneaux glass
  (`backdrop-filter: blur`). Ce sont des maquettes de référence, **pas** l'app qui tourne en
  vrai — ne pas les confondre avec `webapp/`.
- `docs/architecture/` — spec DDD complète (9 bounded contexts, schéma SQL, référence API). Deux
  modules y sont documentés mais **pas encore codés** : `marketing.md` (tracking) et une partie de
  `content-blocks.md` a été implémentée, `assistant-llm.md` est implémenté.
- `webapp/` — **l'application réelle**, celle qui tourne. Vite + React 19 + TypeScript + React
  Router 7 + Tailwind v4 (front) / Express 5 + SQLite (back). C'est sur ça qu'il faut continuer à
  travailler.
- `PROJECT_STATUS.md` (ce fichier) — vue d'ensemble à jour.
- `webapp/README.md` — détails techniques/setup de l'app (déviations, install, structure).

## Stack technique (`webapp/`)

- **Front** : Vite, React 19, TypeScript, React Router 7, Tailwind v4, `react-helmet-async`
  (SEO), `dompurify` (sanitization côté client).
- **Back** : Express 5, `node:sqlite` (⚠️ pas `better-sqlite3` — voir "Déviations" plus bas),
  `bcryptjs`, `jsonwebtoken`, `multer`, `helmet`, `express-rate-limit`, `sanitize-html`.
- **Pas de build tool exotique** : `npm run dev` (Vite, :5173) + `npm run server` (Express, :3001,
  proxy `/api` et `/uploads` via Vite) ou `npm run dev:all` pour les deux ensemble.

## Setup rapide

```bash
cd webapp
npm install
cp server/.env.example server/.env
# éditer server/.env : générer JWT_SECRET et LLM_ENCRYPTION_KEY avec
# node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
# définir ADMIN_PASSWORD
npm run dev:all
```

Site public : `http://localhost:5173`. Admin : `http://localhost:5173/admin`.

## Ce qui est fait (par module)

### Pages publiques
Home, Music, Bio, Events, Links (biolink), Contact (formulaire booking → DB), Privacy, 404. Toutes
avec Helmet (title/description/OG/Twitter Card), design system cohérent, animations d'apparition
au scroll (`.reveal` + `useRevealAnimations`), contraste texte conforme WCAG AA.

### Admin (`/admin`, login JWT + bcrypt)
Tracks (CRUD + upload fichier réel audio/cover), Events (CRUD), Bookings (lecture +
confirm/decline, invariant `pending → confirmed|declined` sans réouverture), Biolinks (CRUD +
réordonnancement), Blocks (voir ci-dessous), Theme/Branding (couleurs + avatar upload), Assistant
(voir ci-dessous), Subscribers (lecture des inscriptions newsletter). Bundle admin code-splitté
(`React.lazy`) — ne charge jamais chez un visiteur public.

### Module Assistant / BYOK LLM (Stage 3, complet)
Providers OpenRouter/OpenAI/Anthropic avec clés chiffrées AES-256-GCM (jamais en clair côté
client, masquage `sk-••••1234`), un seul provider par défaut à la fois (bascule atomique en
transaction), garde-fou de suppression, `POST /api/chat` public rate-limité, widget de chat public
qui n'apparaît que si activé côté admin. **Jamais testé avec une vraie clé API** (sandbox cloud
bloquait les sorties réseau externes) — à valider en local avec une vraie clé OpenRouter/OpenAI.

### Module Content Blocks (activatable, par page)
6 types de blocs : `newsletter_signup`, `merch_grid`, `testimonials`, `press_quotes`,
`upcoming_shows`, `custom_html`. Admin par page (Home/Bio/Music/Events/Contact/Links) : ajouter,
configurer, activer/désactiver, réordonner, supprimer. `custom_html` passe par une double
sanitization (serveur `sanitize-html` + client `dompurify`), vérifié contre une injection
`<script>` réelle. **Déviation notée** : `merch_grid` utilise une config inline (`items[]`) au
lieu de référencer un catalogue produit — ce catalogue n'existe pas dans ce codebase.

### Newsletter (stockage interne)
`POST /api/newsletter` (public, rate-limité), table `subscribers`, doublons silencieusement
absorbés (pas d'énumération d'email), vue admin. **Pas de vrai ESP** (Mailchimp/Brevo/ConvertKit)
— décision explicite de l'utilisateur de rester sur du stockage interne pour l'instant.

### Sécurité (passe Critique + Haute complétée)
Upload filtré par MIME réel (plus de faille XSS via `.html`/`.svg` uploadé), `multer` à jour (3
CVE High corrigées), `helmet` actif (CSP volontairement désactivée — voir Déviations), validation
des CRUD tracks/events/biolinks + blocage des URLs `javascript:`, middleware d'erreur global (plus
de stack trace qui fuite), rate limiting sur login/bookings/chat/uploads/test-provider/newsletter,
`npm audit` → 0 vulnérabilité.

### SEO technique
`robots.txt`, `sitemap.xml` (statique), Open Graph + Twitter Card sur toutes les pages, JSON-LD
`MusicGroup` (site) + `MusicEvent` (par date de concert), champ SEO admin fonctionnel (titre/
description globaux appliqués en fallback sur toutes les pages).

### Biolink (`/links`) — refonte "smart link musical"
Vrai lecteur audio intégré (play/pause/progression réelle, pas un lien sortant), carte "prochain
concert" tirée de la vraie DB, photo réelle (upload ou URL, plus de placeholder vide), liens
groupés par intention (Listen/Watch/Follow/Shop).

## Ce qui manque — priorisé

### 🔴 Priorité 1 — le plus visible, bloquant pour un vrai lancement
1. **Aucune vraie photo/vidéo de l'artiste nulle part.** Avatar, cover de tracks, hero : tout est
   des placeholders en dégradé. C'est LE écart le plus visible par rapport aux sites DJ de
   référence (Carl Cox, Martin Garrix, etc. misent énormément sur la photo éditoriale). **C'est
   exactement ce que la session locale va traiter** — une fois les vraies photos/vidéos
   disponibles : les uploader via l'admin (Tracks pour les covers, Theme/Branding pour l'avatar),
   et évaluer si une vraie photo hero/vidéo de fond remplace ou complète le champ de particules
   actuel (`ParticleField.tsx`).
2. **Contenu 100% placeholder.** Bio.tsx a un texte fabriqué ("Tresor Club, Le Sucre, De School"),
   le tagline "Live from Warehouse 12" est un badge codé en dur sans état réel derrière, l'EP
   "Night Signal" est fictif. Tout ça doit être remplacé par du vrai contenu avant un lancement
   public.
3. **Pas de vrai EPK.** Le lien mort `/press-kit.pdf` a été supprimé sans être remplacé. Il
   faudrait soit une vraie page `/epk` générée depuis les données existantes (bio + photos +
   tracks + presse), soit un PDF téléchargeable réel.

### 🟠 Priorité 2 — fonctionnalités attendues sur un site DJ pro
4. **Pas de widgets streaming officiels** (Spotify/SoundCloud/Mixcloud embed) — seulement notre
   player custom sur fichiers uploadés. Aucune preuve sociale du vrai catalogue Spotify.
5. **Pas de vraie boutique merch.** Le bloc `merch_grid` n'affiche que des cartes statiques,
   aucun panier/paiement (pas de Stripe, pas de table `orders`).
6. **Pas de sélecteur de langue** (FR/EN/AR/ES évoqué depuis le début du projet, jamais tranché —
   l'arabe implique du RTL, impact réel sur le layout).
7. **Aucune stats/analytics admin** — pas de compteur de lectures, pas de clic-through sur les
   biolinks, pas de vue "quel titre performe le mieux".
8. **Module Marketing/Tracking jamais codé** (GTM, Meta Conversions API, TikTok Events, bandeau de
   consentement, génération SEO par IA) — entièrement spécifié dans
   `docs/architecture/marketing.md`, zéro ligne de code écrite. Décision explicite de
   l'utilisateur de le reporter.
9. **Pas de "Add to calendar" (.ics)** sur les dates de concert.
10. **Pas de transition de page/route** — React Router bascule instantanément entre les pages,
    aucune chorégraphie d'entrée/sortie.

### 🟡 Priorité 3 — sécurité/robustesse Medium (reportées volontairement lors de la dernière passe)
11. Pas de SSR/prerendering (SPA pure — un bot qui n'exécute pas JS voit une coquille vide malgré
    les balises OG/JSON-LD déjà en place côté client).
12. Poids Poppins 300 chargé mais jamais utilisé (police à trimmer).
13. Pas de `loading="lazy"` ni de tailles responsives sur les `<img>`.
14. `ParticleField` ignore `prefers-reduced-motion` et ne se met pas en pause hors écran/onglet
    caché.
15. Pas de révocation de session admin (un JWT volé reste valide jusqu'à 12h même après
    "déconnexion").
16. Pas de politique CORS ni de `trust proxy` configurés — dépend de l'hébergement final, à
    trancher une fois le déploiement choisi (VPS Hostinger/Contabo visé à l'origine, pas Vercel).
17. `rounded-[18px]` isolé sur les cartes de `/links` au lieu du standard `rounded-2xl` ailleurs.
18. Sidebar admin non responsive (pas grave, usage desktop uniquement en pratique).

### Décisions produit jamais tranchées
- Langues (voir #6 ci-dessus).
- PWA ou site classique pour le biolink ?
- Ticketing : liens externes (Dice/Eventbrite/RA) ou billetterie interne ?
- Faut-il une vraie intégration API streaming (Spotify for Artists, SoundCloud) pour tirer le
  catalogue automatiquement au lieu de saisie manuelle en admin ?

## Déviations techniques notables (pourquoi, pas juste quoi)

- **`node:sqlite` au lieu de `better-sqlite3`** — le sandbox cloud où ce projet a été développé
  bloque les compilations natives (pas d'accès réseau pour node-gyp). `node:sqlite` est natif à
  Node 22, API quasi identique (`prepare/run/get/all`). **En local, `better-sqlite3` a de bonnes
  chances de marcher directement** (binaire précompilé) — tester `npm install better-sqlite3` si
  tu veux revenir dessus ; sinon `node:sqlite` fonctionne très bien tel quel.
- **CSP désactivée dans `helmet`** (`contentSecurityPolicy: false`) — le module Content Blocks
  embarque des iframes YouTube/SoundCloud et une vraie CSP demande un allowlist précis, non fait
  par manque de temps lors de la dernière passe. Les autres headers helmet (nosniff, HSTS,
  frameguard, hide-powered-by) sont actifs.
- **Polices auto-hébergées** via `@fontsource/righteous`/`@fontsource/poppins`, pas de CDN Google
  Fonts (fiabilité + confidentialité + évite le blocage réseau du sandbox de dev).
- **`merch_grid` en config inline plutôt que `productIds`** — pas de module Catalog/produit dans ce
  codebase, inventer cette dépendance aurait été prématuré.
- **Réordonnancement en admin via boutons haut/bas**, pas de drag-and-drop — plus simple,
  accessible, suffisant pour un seul admin.

## Comment ce projet a été construit (contexte utile)

Développement itératif sur plusieurs longues sessions, avec plusieurs passes en **équipe
d'agents parallèles** (chacun dans son propre git worktree, sur un contrat d'API fixé à l'avance
pour éviter les conflits de fichiers) quand deux chantiers étaient indépendants — ex. upload de
fichiers + module Assistant en parallèle, ou backend/sécurité + frontend/SEO en parallèle. Chaque
passe a été vérifiée en conditions réelles (curl + navigateur headless Chromium, jamais juste "le
code compile") avant merge et push. Deux audits complets (sécurité/backend et frontend/design/SEO/
accessibilité) ont été menés avant la dernière grosse passe de correctifs — leurs résultats
détaillés (findings Medium/Low non traités) ne sont pas dans ce fichier mais peuvent être
redemandés/refaits si besoin, ce résumé ne garde que les conclusions actionnables.

## Prochaine étape recommandée

Vu que cette session va traiter de vraies photos/vidéos : commencer par le Priorité 1 complet
(uploader les vrais visuels, réécrire Bio.tsx avec du vrai contenu, décider du sort du hero —
garder les particules, les remplacer par une vidéo/photo, ou combiner les deux), puis rédiger un
vrai EPK. Une fois ça fait, le site aura l'air d'un vrai artiste et pas d'une maquette technique —
ce qui rendra aussi les captures d'écran/démos beaucoup plus convaincantes pour la suite (merch
store, streaming widgets, etc.).
