# bobprod — plan stratégique UX/UI "quoi mettre / quoi ne pas mettre"

_Document de synchronisation entre sessions. Produit dans une session cloud après analyse
concurrentielle de 11 sites DJ/artistes (Awwwards) et lecture complète du vault Obsidian business
de l'utilisateur. Toute fenêtre/session qui reprend ce projet doit lire ce fichier en entier avant
de proposer de nouvelles fonctionnalités UI — il évite de redécouvrir ces arbitrages._

## Vue d'ensemble du système (confirmé via GitHub + vault Obsidian)

- **`bobprod/bobprod-web-app`** (ce dépôt) — le vrai webapp (Vite/React/Express/node:sqlite). Lire
  `BOBPROD_WEBSITE_STATUS.md` à la racine en entier en complément de ce fichier : il liste ce qui
  est fait/manque techniquement, ce fichier-ci tranche le quoi/pourquoi côté produit.
- **`bobprod/obsidian-vault`** — notes business de l'utilisateur (Obsidian), organisées par projet.
- **`bobprod/glow-logic`** — projet technique DMX lié à BobEvent (lecture seule, pas encore creusé
  en détail).
- **BobProd** (l'artiste) et **BobEvent** (prestations DJ + éclairage DMX — MyStrow, Akai APC mini,
  Glow Logic) sont **la même personne**, deux marques liées ("très lié à BobProd" selon les notes
  du vault). **BobEvent n'a aucun site construit à ce jour.** Services confirmés par l'utilisateur :
  sonorisation et lumière, création d'événement dédié, booking d'artistes, billetterie, promotion
  d'événement — donc un futur site "agence événementielle" (catalogue de services, portfolio
  d'événements, devis/booking, billetterie), structurellement différent d'un site d'artiste comme
  bobprod.com.
- **BobProm** est l'agence de promotion digitale de l'utilisateur (agents IA pour contenu/ads/SEO/
  web/email) qui traite **BobProd et BobEvent comme deux clients parmi d'autres** (aux côtés de
  3sformation, Firstimmob, Residence Saji). → Confirme que "template à dupliquer par client" est
  le modèle d'affaires réel de BobProm, pas une hypothèse. Voir Tier 4.
- **BobCam Multicam** est un projet produit séparé (app multicam DIY) référencé depuis BobProd et
  BobEvent (filmer sets/événements) — hors périmètre de ce plan.

### Décisions utilisateur déjà actées (ne pas redemander)
- **Identité visuelle : vrai visage / vraies photos.** La piste "anonymat façon Daft Punk" trouvée
  dans les notes de branding du vault était une inspiration, pas une décision prise. La Priorité 1
  de `BOBPROD_WEBSITE_STATUS.md` ("aucune vraie photo nulle part") reste valide telle quelle.
- **BobEvent aura son propre site** (projet distinct, à démarrer). La question de savoir si
  bobprod.com doit en parler (page dédiée / lien discret / aucun lien) **reste ouverte** — à
  trancher une fois que le site BobEvent existera concrètement.
- **Merch/Boutique** : garder une **petite vitrine légère** (pas d'e-commerce interne : pas de
  panier/paiement/stock) — lien externe vers une plateforme de vente (Printful/Bandcamp/Shopify).
- **Nouvelle section actée : Placement produit** — matériel/marques utilisées par bobprod
  (platines, casque, logiciels), cartes + lien affilié, même légèreté que le merch.

## Cadre de décision (4 lentilles)

Pour chaque fonctionnalité candidate :
1. **UX/UI** — clarifie ou encombre ? charge cognitive, mobile-first ?
2. **Marketing/croissance** — aide la découverte, la conversion (booking/streams/email), la rétention ?
3. **Business digital** — correspond à un vrai levier de revenu/carrière (booking, merch, streaming, presse) ou juste de la vanité ?
4. **Dev** — coût réaliste sur la stack Vite/React/Express/node:sqlite, build solo+agent IA.

Une fonctionnalité qui perd sur 3 lentilles sur 4 est exclue, peu importe son effet "waouh" visuel.

## Tier 0 — Hygiène non négociable (déjà scopé Stage 1)
Page 404 réelle, error boundary autour de `<Outlet/>`, rate limiting (`/api/admin/login`,
`/api/chat`, `/api/bookings`), page `/privacy` réelle. **INCLURE**, zéro débat.

## Tier 1 — Cœur métier (confirmé par 11/11 sites concurrents)
CRUD tracks/events/bookings/biolinks + câblage public (`/music`, `/events`, `/links`, `/contact`),
Music Player (vinyle + bras de lecture déjà maquetté), Event Card, Appointment Scheduler.
**INCLURE**, priorité absolue.

## Tier 1.5 — Sous-estimés dans le brief original, remontés en priorité
- **EPK / press kit réel** : outil de conversion programmateur → booking. Lien mort
  `/press-kit.pdf` à remplacer (Priorité 1 #3 du statut). Dev léger (contenu + une page).
- **Newsletter / direct-to-fan** : seul canal qui n'appartient pas à une plateforme tierce.
  Backend déjà en place selon le statut. Renforcé par les notes de branding de l'utilisateur lui-même
  ("système direct to fan : liste email, expériences, tunnel automatisé").

## Tier 2 — Quick wins UX/marketing à coût quasi nul
| Idée | Source | Pourquoi l'inclure |
|---|---|---|
| "3 façons de vivre bobprod" (Écouter / Booker / Voir en live) sous le hero | David Catá | Oriente vers l'action qui rapporte |
| CTA de marque répété au lieu de "S'abonner" générique | Openstate | Coût nul, identité renforcée |
| Aperçu audio inline par morceau (pas qu'un lecteur global) | Openstate | Extension naturelle du Music Player |
| GSAP + ScrollTrigger (gratuit depuis le rachat Webflow) à la place du hook `useRevealAnimations` maison | Veille 2026 | Standard du secteur, zéro coût licence |
| Transitions de route via l'API native View Transitions | Surya Aditya | Remplace "animated page transitions" du Stage "polish", coût quasi nul |
| Grain CSS en overlay (pas de version WebGL) | TY1 | Texture visuelle ~0 coût |

## Tier 3 — Conditionnels au contenu réel (pas bloqués par le dev)
- **Timeline de carrière** (page Bio) : composant trivial, mais ne pas le construire avant d'avoir
  le vrai contenu (la Bio est 100% placeholder aujourd'hui).
- **Certifications/presse** : scaffold le composant, le garder masqué/vide jusqu'à de vraies
  données (jamais de faux logos).

## Tier 4 — Décisions produit à trancher avant de coder
- **Merch/Boutique** : vitrine légère actée (voir Décisions ci-dessus).
- **Placement produit** : section actée (voir Décisions ci-dessus).
- **Template revendable à d'autres clients BobProm** : **confirmé**, pas hypothétique — commencer
  par documenter/paramétrer ce qui est spécifique à bobprod (couleurs, textes, logo, contenu) vs
  générique dans le code, sans construire un vrai "wizard" UI tant qu'il n'y a qu'un second client
  en vue (BobEvent).
- **Chat BYOK multi-provider (Stage 3)** : garder en Stage 3, derrière EPK/newsletter.
- **OAuth admin** : exclure, un seul admin, aucune valeur business actuelle.

## Exclu explicitement (validé sur 11 sites concurrents)
- Tout scroll-driven WebGL/Three.js lourd (Better Call Quang, Paaspop, galerie 3D TY1).
- Double-rendu DOM/WebGL façon Surya Aditya — semaines d'ingénierie, ROI nul pour ce projet.
- Intro vidéo plein écran bloquante permanente (TY1, Vevilos) — friction UX ; acceptable seulement
  en page de campagne ponctuelle (sortie d'un single).
- Mini-jeu / don à montant libre — à revisiter seulement si une vraie campagne de financement le
  justifie.
- CrowdSec / Cloudflare Turnstile — infra/ops, hors périmètre UI/UX (à traiter côté hébergement).

## Séquence recommandée
1. Tier 0 + Tier 1 (déjà scopé Stage 1)
2. Tier 1.5 (EPK réel, newsletter) — avant tout "polish"
3. Tier 2 (quick wins UX/marketing)
4. Tier 3 — dès que le contenu réel (photos/bio/presse) est disponible
5. Tier 4 — trancher merch/placement produit (fait) et template revendable (à paramétrer)

## Wireframes produits (canvas basse fidélité, 8 pages cliquables)
**https://claude.ai/artifact/BAGKXQr5LHX25fk4pUeqan**

Accueil, Musique, Bio, Événements, Booking, Links, EPK, Boutique & Gear — chaque section porte une
étiquette indiquant son Tier ci-dessus.

## Note de cohérence design ↔ code
Les maquettes Claude Design (`project/bobprod *.dc.html`) ont gardé Boutique/EPK par choix
explicite de l'utilisateur pendant l'exploration — pas une divergence à corriger automatiquement,
déjà résolue par les décisions Tier 4 ci-dessus.
