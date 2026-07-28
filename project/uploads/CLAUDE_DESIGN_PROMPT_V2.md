# Claude Design prompt — bobprod brand/design system (v2, improved)

Copy everything below the line into Claude Design (claude.ai/design) as one prompt. It asks for a **brand foundation deliverable** — palette, typography, logo system, tokens, and a motion/interaction language — independent of the React codebase already built, so it doesn't try to regenerate the site itself.

---

Design a complete brand/design system for **bobprod**, a house & techno DJ and music producer (real profile: soundcloud.com/bobby-prod). This is a **brand foundation deliverable** — palette, typography, logo system, design tokens, and a motion language — not a website mockup or code. The visual direction is already set by a mood-board of vinyl records, turntables, and red/gold product photography on black backgrounds; formalize and extend that direction rather than replacing it.

## 1. Palette

Formalize and extend these already-chosen colors:
- Base: near-black `#0a0a0a`
- Primary accent — warm red: `#d1382a` (vinyl label / turntable-mat red)
- Secondary accent — gold: `#f0a91f` (from yellow record/turntable product shots)

Deliver:
- A full palette built around these three: supporting neutrals (grays for text/borders on black), semantic colors (success/error/warning) that stay in-family with the red/gold direction, and documented usage rules (e.g. gold for hover/secondary emphasis, red for primary CTAs).
- Both a "high contrast" and a "muted" variant of each accent for use in different densities (large headlines vs. small UI text).

## 2. Typography

Already-chosen typefaces (Google Fonts): **Righteous** (display/headlines — bold, rounded, energetic, fits "music/entertainment/performer" mood) and **Poppins** (body/UI text). Build a complete type scale around them:
- Display/H1–H4 hierarchy using Righteous, with tracked-out uppercase treatment for eyebrow/label text
- Body/UI sizes using Poppins (300–700 weights), including a comfortable long-form reading size for bio/press-kit copy
- Line-height and letter-spacing rules for both at small and large sizes

## 3. Logo system

Evolve this existing bespoke mark into a full logo system — it's a vinyl-record disc silhouette (black disc, colored center label) fused with a music-note flag, not a generic icon:

```svg
<svg width="22" height="22" viewBox="0 0 256 256" fill="none">
  <circle cx="96" cy="160" r="80" fill="#0a0a0a" stroke="#fff" stroke-width="6" />
  <circle cx="96" cy="160" r="26" fill="#d1382a" />
  <circle cx="96" cy="160" r="6" fill="#0a0a0a" />
  <circle cx="96" cy="160" r="80" fill="none" stroke="#ffffff33" stroke-width="2" stroke-dasharray="2 6" />
  <path d="M176 160 V48 C176 40 182 36 190 40 L214 52 C220 55 224 61 224 68 V72"
        stroke="#f0a91f" stroke-width="10" stroke-linecap="round" fill="none" />
</svg>
```

Deliver:
- Primary mark (as above, refined)
- Wordmark lockup: mark + "bobprod" in Righteous, horizontal and stacked variants
- Icon-only variant simplified for favicon/app-icon sizes (down to 16×16)
- Monochrome (all-white, all-black) variants for use on photos/video
- Clear-space and minimum-size rules

## 4. Design tokens

Consistent with the "liquid glass" aesthetic already used across the site (frosted, low-opacity panels with a subtle gradient border):
- Spacing scale (4/8px-based)
- Corner-radius scale (the site currently uses `rounded-xl`/`rounded-2xl`-equivalent — formalize as named tokens: sm/md/lg/xl)
- Elevation/shadow rules for cards and the liquid-glass panels (currently: `backdrop-filter: blur(4px)`, `background: rgba(255,255,255,0.01)`, inset highlight border — extend this into a documented "glass" token family rather than one-off values)

## 5. Motion & animation language

The site is built on GSAP (industry-standard animation engine) — document these as **brand-level motion rules** Claude Design should apply to any motion-adjacent deliverable (how the logo animates in a sting, transition specs for video/social assets), not literal code:

- **Easing vocabulary**: `power3.out` (fast start, gentle settle) for anything entering the screen — text, cards, the logo; `power1.inOut` for continuous/looping motion — the vinyl disc, ambient particle drift. Avoid bouncy/elastic eases — they read as playful-casual, not club/performer-grade.
- **Timing bands**: micro (~150ms) for hover/press feedback; standard (~400–700ms) for content entering the viewport (matches the site's existing staggered fade-up: 100ms/250ms/400ms/550ms/750ms delay steps); dramatic (800ms+) reserved for hero-level reveals only — don't overuse it.
- **Stagger direction**: group reveals (e.g. a row of tracks, event cards) animate in reading order (left-to-right / top-to-bottom), never randomized — randomized stagger reads as noisy against this brand's otherwise controlled, precise aesthetic.
- **One continuous move principle**: when choreographing a multi-step sequence (e.g. a launch video, a page transition), how an element *exits* one state should visually set up how the *next* element *enters* — the whole sequence should read as one continuous camera move, not a stack of independently-timed animations. This is the single most important rule for anything beyond a static logo/palette handoff.

## 6. Playlist / vinyl-record visual spec

The site's Music page centers on a **spinning vinyl record player widget** (audio-reactive, beat-synced) — define its brand-level look, independent of implementation:

- **At rest**: disc rotates slowly and continuously (~15–20s per rotation) even when nothing is playing — implies "always ready," not static/dead.
- **While playing**: rotation speed increases subtly and a soft red/gold glow pulses in sync with playback — the pulse should read as a heartbeat, not a strobe (slow attack, slower release, never harsh on/off).
- **Center label**: uses the same red-disc-gold-ring treatment as the logo mark's center dot — the playlist widget and the logo should visually rhyme, not look like two unrelated systems.
- **Visualizer** (if included): a minimal dot-grid or bar-grid, gold at rest, shifting toward red at peak amplitude — same base→hot color logic as the particle field below, so the two signature visuals share one color-mapping rule across the whole brand.

## 7. 3D particle field — signature interaction

The site's hero uses an interactive particle field (a grid of points that magnetically repel from the cursor, gold at idle, shifting to red near the cursor, with slow ambient drift when untouched) — document this as the brand's **signature interaction pattern**, reusable in spirit anywhere a moment of delight is warranted (a loading screen, an EPK page accent, a social video intro):

- **Color mapping**: gold = idle/ambient state, red = "activated"/near-attention state — this idle→hot color shift is the same logic used in the playlist visualizer above; keep it consistent everywhere motion responds to attention or interaction.
- **Motion quality**: particles should never move mechanically/linearly — always eased, with a touch of independent per-particle randomness (via a per-particle phase offset) so the field never looks like a single rigid object, but also never so random it looks chaotic.
- **Restraint**: this pattern reads as premium specifically because it's used sparingly — one hero, maybe one accent moment elsewhere — not on every page/asset. Document this as a usage guideline, not just a visual spec.

## Constraints

- Do not generate website page layouts or React/HTML code — this is a brand system only, to be handed to a separate coding effort already in progress.
- Keep the palette dark-mode-only (no light-mode variant needed) — the brand is intentionally night/club-oriented.
- Everything must work at both large-scale (hero headlines, print) and small-scale (favicon, mobile UI) sizes.
- The motion/playlist/particle sections are **brand-level rules and visual specs**, not implementation requests — Claude Design should describe/illustrate the look and behavior, not produce animation code.
