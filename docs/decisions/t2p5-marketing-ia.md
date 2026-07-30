# T2.5 marketing IA and content architecture proposal

> **ROLE:** the T2.5 collaborative-checkpoint proposal (ruling 5's binding gate). It converges the full-site
> information architecture + content architecture with Will BEFORE any Track B production pages are built.
> **BELONGS HERE:** the site-map call, the home-page narrative arc, theme posture, per-route strategy, voice
> rules, asset dependencies, build phasing, non-goals, and the decision clusters that drive the walk with Will.
> **NOT HERE:** production code, final copy decks, or launch-switch execution.
> **LIFECYCLE:** after ratification the ratified decisions graduate to `docs/systems/marketing-content.md` +
> an ADR, and this doc prunes to a one-line pointer (the T1 options-doc lifecycle). Until then this file is the
> working proposal, not current truth.
> **STATUS (2026-07-08): the T2.5 walk is COMPLETE.** Ratified: the site map (Shape 1 + `/reel`), the hero
> substrate (pre-rendered engine mp4s), the MADE-FROM home arc (Call 2), the theme split, the secondary-route
> plan, and interim license-free media sourcing. OPEN: the leading-copy VOICE, spun into a dedicated
> exploration round (cluster 4). Track B's structural build is unblocked; its production copy waits on the
> voice round.

---

## Context: why this round exists

Ruling 5 (Will, 2026-07-05) approved the B+C hybrid for the marketing rebuild, then attached a binding caveat.
Quoted verbatim:

> "T1 ruling (Will, 2026-07-05): B+C HYBRID. B's cinema hero leads (the desired visual language, the most
> design magic) with B's how-it-works reel animation kept, and C's animated product-demo as a close follow-up
> section visualizing the how. A rejected as too templated. BINDING CAVEAT: these wow sections are the FLOOR,
> not the site: the build is gated on a full-site IA/content-architecture round (core loop + supporting
> features) done collaboratively with Will (T2.5) before any production pages."

So the wow pieces are settled and this round does NOT relitigate them. What is settled:

- **The cinema hero (Direction B):** the kinetic-word montage, the hard film cut on the headline word, the
  story-style progress segments, and the mono timecode chrome.
- **The how-it-works film strip (Direction B):** the sprocket conveyor and the three Scan / Shoot / Screen
  scene cards that land as hard cuts on scroll.
- **The live product demo (Direction C):** the QR pulse, scan beam, tiles-fly, live toasts, and reel-card
  payoff phase machine, re-skinned to B's always-dark language.
- **The cinema close (Direction B):** "Roll credits on the group chat." and the mono credit line.

**What "wow is the floor" means here.** These three sections are the ceiling of the *lab's* ambition but the
FLOOR of the *site*. A cinema hero over an empty site is a demo, not a product page. This round's job is to
build the whole information architecture around and beneath those pieces: where every route lives, what the
home page says section by section, how the supporting features (the album, trust, pricing, the reel) earn
their place, and which claims we are allowed to make. The wow carries the top of the funnel; the IA has to
carry the visitor from "that looks incredible" to "I understand exactly what this is and I am starting a free
event."

---

## Deployment-state note (the as-if-complete house rule and its hard fence)

The marketing site presents shipped features in present-tense, confident voice per the standing house rule.
The corrected deployment states (orchestrator, 2026-07-08) matter because the IA must know which pieces are
LIVE today versus which ship inside the Track B timeframe.

**LIVE on partyreel.com today** (safe to present as fully real): the whole core loop; the 14-style canvas
composer and the $0 on-device .mp4 export (milestone-1, prod-verified); EXIF/GPS stripping, backfilled
(milestone-0); the ADR-0021 pricing (30s free / 60s paid, storage caps, ingress backstop applied); the QR
designer (4 presets); moderation + review/triage; bulk select; drag-reorder; client thumbnails; the stacked
event-feed; the require-accounts gate (free, default-on); Download-all zip; the 30-day recovery bin; saved
events; real-time second-region durability replication plus nightly off-site DB backups.

**Preview-only until milestone-2** (do NOT build a marketing surface yet): profiles + social (`/u/[slug]`,
follows, guest lists). One roadmap line only, no page, no nav item.

**Ships within the Track B timeframe, not live yet:** guest-facing reel viewing + download (ADR-0022 spec,
R3 builds it). The IA may present the reel as a guest-shareable artifact per the house rule, but the /reel
copy and the home reel section must lean on the HOST download + the growth angle rather than promising a
guest a download button that is not yet wired. Treat this as "arriving with the rebuild," not "live now."

**The hard "must not claim" fence** (the only non-negotiable limits on as-if-complete copy):

1. Stripe is in TEST mode. No "join thousands of hosts," no paying-customer counts, no testimonials.
2. `/privacy` is a stub. Do not link it as a complete policy or cite specific legal commitments from it.
3. NCMEC ESP registration is NOT done (pre-launch). Do not headline CSAM / law-enforcement process.
4. Counsel has NOT signed the forensic / retention language. Do not quote retention as a legal promise.
5. Demo-event media is placeholder pending the pre-launch swap. Do not screenshot it as a real event.
6. Do not market the ingress backstop numbers (they exist to bound abuse, not as a feature).
7. Do not build any marketing on preview URLs (program infra is temporary).

Everything outside this fence is fair game in confident present tense.

---

## Call 1 (RECOMMENDED): site map Shape 1, "Keep the spine, add /reel"

**Recommendation: keep the existing route inventory intact, rebuild the HOME as the cinema narrative, re-skin
all product-narrative routes to the ruled dark-mono identity, and ADD exactly one route: `/reel`.**

The as-built site is content-complete, and its content architecture is the single strongest asset we have:
`/events/[slug]` pages are statically generated with per-type layouts and per-type OG images; `/help` runs
MDX with live-value spec tags (`<UploadSize/>`, `<ProPrice/>`) sourced from `tiers.ts` / `limits.ts` so the
numbers cannot drift; the FAQ is dual-purpose (renders + emits `FaqPage` JSON-LD); nav is a single source in
`src/lib/constants/marketing-nav.ts`. Throwing that away to chase a one-page site would burn real SEO equity
and a maintenance model that already works. So Shape 1 rebuilds the *presentation* and *copy* while preserving
the *route graph* and the *single-source content plumbing*.

**The one addition: `/reel`, the flagship product page.** The reel is the North Star feature (core-loop step
5) and it now genuinely ships. It deserves its own shareable, indexable URL: the search intent "event
highlight reel maker" / "party video maker from guest photos" has no home today, and the ruling's wow pieces
(the 14-style catalog, the WYSIWYG story, the $0 render) supply more than enough content to fill a dedicated
page. A home *section* teases it; the `/reel` route sells it in full.

### The two alternatives (honest case for each, and why each loses)

**Shape 2, one-page cinema.** Collapse everything into a single scrolling home and drop the sub-routes. The
honest case: it is the purest expression of the ruling (the cinema hero is the whole experience, no
navigation to break the spell), it is the least to build, and a single narrative can be tuned to perfection.
Why it loses: it destroys the `/events/[slug]` SEO equity (four statically generated, separately-ranking
landing pages for the four highest-intent event types) and the `/help` + `/blog` content surfaces, and it
gives paid search / social ads nowhere specific to land. We would be trading durable acquisition
infrastructure for a prettier scroll. The ruling wants the wow at the *top* of the funnel, not the *whole*
funnel.

**Shape 3, product-led split (thin marketing home + a separate `/product` presentation).** Put a short
value-prop home up front and move the full cinema presentation to a `/product` page. The honest case: it
keeps the home fast and conversion-focused, and it lets the heavy motion live on a page visitors opt into.
Why it loses: it moves the full presentation *away from where visitors land*, and the ruling is explicit that
the HOME carries the cinema narrative ("B's cinema hero leads"). A visitor who lands on a thin home and never
clicks through never sees the magic that is the entire differentiator. Shape 3 hedges the exact bet the
ruling told us to make.

### Nav and footer spec

- **Primary nav (`PRIMARY_NAV` in `marketing-nav.ts`):** `Features` · `Reel` · `Events` (dropdown: Weddings,
  Parties, Conferences, Trips) · `Pricing` · `Resources` (dropdown: Help center, Blog, Contact). Primary CTA
  button: **"Start free"** (replacing the current "Get started"). A secondary text link **"Log in"** stays.
  `Reel` is the one new top-level item; it slots between Features and Events. The Events children already
  mirror `EVENT_TYPE_SLUGS` (Vitest-guarded) so that pairing is unchanged.
- **Footer (`FOOTER_NAV`):** keep the five columns. **Product** (Features, How it works `/#how-it-works`,
  Reel `/reel`, Pricing, FAQ `/#faq`) gains the Reel link. **Events**, **Resources**, **Company** (Careers),
  **Legal** (Privacy, Terms) are unchanged in shape.
- **Profiles / social:** no nav or footer surface now. One roadmap line: "Public profiles, follows, and guest
  lists arrive with milestone-2." Do not add `/u` anything to the marketing graph until M2 ships it.

---

## Call 2 (RATIFIED 2026-07-08): the "made-from" home arc

**Will's T2.5 rulings on this call:** the home is designed BLANK-SLATE from the final product vision, not
lifted from the current page. Of the blank-slate spines offered, Will chose the **made-from decomposition**:
open on the reel (the ending, the artifact no competitor has), then decompose it backwards into everything
that made it. His reasoning, recorded: it keeps the feature-focused storytelling but "doesn't lock us too
tightly to showing how one event type (like a wedding) works vs any event." The premiere-rewind alternative
(one night narrated start to finish) was declined for exactly that event-type lock-in; the sectioned arc was
retired as section-inventory thinking.

**The through-line: "What is a Partyreel made of?"** Every section is one ingredient of the reel the visitor
just watched: the photos (no-app upload), the people (no-account guests), the pour-in (the live album), the
editor (host control), the quiet parts (privacy), the styles (the 14-style catalog), the deal (pricing). The
made-from grammar can echo in section eyebrows as a motif ("Made by everyone" / "Made live" / "Made safe" /
"Made yours" / "Made in 14 styles" / "Made free"); the copy pass decides how literal to run it, and it must
not become a tic.

Each section below states its JOB, its CONTENT (with proposed headline-grade copy in quotes), the MOTION
mechanic it inherits, the SOURCE it builds from, and the ASSETS it needs. Proposed copy is a starting point
for the Call 5 voice pass, not final; all of it is em-dash-free by construction.

### 1. Cinema hero (Direction B)

- **Job:** land the thesis and the visual language in the first three seconds.
- **Content:** eyebrow "Shot by everyone. Edited by no one." H1 with the kinetic word: "Every {wedding /
  birthday / festival / send-off} ends with a reel." Subcopy: "Guests scan one QR and the photos pour in. You
  get a cinematic highlight reel, built automatically, ready to share." CTAs: solid "Start free" + outline
  "Watch a sample reel" (Play icon, opens a real reel overlay) + the live-demo text link "Try the live demo".
- **Motion:** the kinetic-word montage with the HARD FILM CUT on the headline word (a cut, not a fade), story-
  style progress segments (one thin bar per shot, `scaleX` 0 to 1 over the hold), and the mono timecode
  "00:{shot x 6} / 00:24". Reduced motion falls back to the universal word "event" with no cycling.
- **Source:** `CinemaHero` in `marketing-cinema-direction.tsx`. Substrate is the cluster-1 decision below.
- **Assets:** hero loop source (pre-rendered engine mp4s recommended), a real sample reel for the overlay, the
  real logo asset.

### 2. Trust strip

- **Job:** answer the instant "what is the catch" without fabricating social proof.
- **Content:** the four honest claims, restyled to dark-mono: "No app, no account" / "Private by default" /
  "Yours until you delete it" / "No watermarks." Pre-launch honest: NO testimonials, NO logos, NO counts
  (Stripe is TEST). Note: "No watermarks" stays scoped to photos and the album (true on every tier); the free
  REEL's small mark is explained at `/reel`, and the copy pass must keep the two claims from colliding.
- **Motion:** low. A quiet staggered reveal on scroll; these are anchors, not theater.
- **Source:** `trust-strip.tsx` (keep the four-claim pattern, re-skin).
- **Assets:** none (type + hairlines only).

### 3. The decomposition (the page's signature move, NEW)

- **Job:** answer "what is this?" in one gesture: the reel the visitor just watched comes apart into what
  made it. This is the made-from spine's anchor beat and the one genuinely new mechanic.
- **Content:** the hero's reel frame decomposes into its source tiles with three counters landing as facts:
  "Built from 214 photos." / "Shot by 23 guests." / "Edited by no one." One closing line: "Partyreel turns
  everyone's camera roll into the film of the night." Event-type-agnostic by construction: numbers and
  tiles, no single narrated event.
- **Motion:** the reverse of the demo's tiles-fly vocabulary: tiles burst OUT of the reel card toward the
  edges (the same pop ease family), counters count up in Geist Mono tabular. Reduced motion: the three facts
  fade in over the still tile field.
- **Source:** new composition built from the C demo's fly/counter mechanics + `ReelFrame`; prototyped in the
  lab (Marketing sandbox) before Track B builds it, per the lab-first gate.
- **Assets:** the same curated media set as the hero; one reel cover.

### 4. How-it-works film strip (Direction B, ruled)

- **Job:** tell the three-beat core loop as a single cinematic gesture.
- **Content:** section heading "From two hundred phones to one cut." Three scene cards: Scene 01 Scan, Scene
  02 Shoot, Scene 03 Screen, each with one line of body ("Scan the QR, no app" / "Shoot from any phone" /
  "Screen the cut, you curate").
- **Motion:** the film-strip CONVEYOR (`[data-mkt-marquee]`, 32s linear, two copies back-to-back, sprocket
  holes inside each copy, linear easing because ambient motion stays linear) with the three scene cards
  landing as HARD FILM CUTS (`[data-mkt-cut]`, staggered 120ms, deliberately not a soft fade).
- **Source:** `FilmStripSection` in `marketing-cinema-direction.tsx`.
- **Assets:** film-strip frames from the curated media set; the three scene stills.

### 5. Live product demo (Direction C, re-skinned dark)

- **Job:** act out the how live, so "the album builds itself" is shown, not asserted. Placed AFTER how-it-works
  per the ruling ("visualizing the how": the three-beat story, then the story acted out live).
- **Content:** phone + QR ("Maya & Jay's Wedding"), scan beam, nine tiles fly from the phone, live toasts
  ("Maya added 3 photos" / "Jay is in" / "12 more from the dance floor"), the reel-card payoff ("Reel ready /
  0:47 · Built from tonight") with count-up counters (128 photos · 23 guests · 1 reel) and a green LiveDot
  "Filling live right now." Section lead: "Watch the night pour in." + Replay control.
- **Motion:** the C phase machine (idle to scan at 400ms to tiles at 1600ms to reel at 3600ms), timeout-
  scheduled once in view (`useInView(0.35)`); Replay bumps `runId` for a clean re-run. Reduced motion jumps
  straight to the reel phase (the story still lands, without theater). RE-SKIN from C's light paper to B's
  always-dark.
- **Source:** `marketing-live-direction.tsx` (adopt the demo mechanic only, not C's chrome).
- **Assets:** art-directed demo fixtures (display names, event name, ~9 stills, reel duration + cover,
  counters) that are NOT real PII.

### 6. The album (product depth 1, the core-loop artifact)

- **Job:** show the thing guests actually fill and hosts actually curate, in real product chrome.
- **Content:** heading "You're always the editor." Show a live-feeling gallery with the curation story: approve
  a whole event in one scroll, hide with one tap (hidden dims to 30% host-side), bulk select "dozens in one
  tap," and the review queue for hold-for-approval events. Host-control language.
- **Motion:** standard-frequency reveals; the album tiles settle in with a gentle stagger. This section is
  product-real, not cinema-abstract, so it stays calmer than the hero.
- **Source:** the `frames/` library (`AlbumFrame`, `GalleryFrame`, `BrowserFrame`); curation facts from the
  capability inventory.
- **Assets:** curated event media for the frames; a poster of the review/triage state.

### 7. The reel (product depth 2, the North Star)

- **Job:** make the reel concrete and route the interested visitor to `/reel`.
- **Content:** heading "Every event ends with a reel." A 14-style catalog teaser shown as a named cover
  filmstrip (see the /reel section for the full 14). Framing lines: "14 cinematic styles, one tap." /
  "Rendered on your phone, free, in seconds." / "30 seconds free, 60 on Pro, and no watermark when you
  upgrade." Growth angle: "Every guest can take the reel home." CTA: "See all 14 styles" to `/reel`.
- **Motion:** the cover filmstrip uses the same conveyor vocabulary as section 3 at a smaller scale; a real
  reel plays inline (poster-first) as the payoff.
- **Source:** `reel-teaser.tsx` (re-skin), the style registry (`STYLE_CATALOG`), `ReelFrame`.
- **Assets:** 14 style cover frames, 1 to 3 inline sample reels across orientations.

### 8. Trust and privacy (product depth 3, the unused ammunition)

- **Job:** convert the shipped-but-invisible safety features into named, specific, believable claims. This is
  the section the audit flagged as the biggest missed opportunity.
- **Content:** heading "Private means actually private." Named claims: "Your location data never leaves your
  phone" (client-side EXIF/GPS stripping before upload). "Three ways to share, including truly private" (Open /
  Password on Pro / Private; a locked event leaks only its name and a count). "Require a verified email to
  upload" (the guest gate, free on every tier). "Deleted by accident? You have 30 days" (recovery bin).
  "Backed up twice, automatically" (second-region replication). SPECIFICS over adjectives throughout. Do NOT
  headline forensic / CSAM / law-enforcement language (counsel + NCMEC pending).
- **Motion:** low; these claims want to read as facts, so quiet reveals only.
- **Source:** capability inventory section 4; the trust/privacy system docs.
- **Assets:** small diagrammatic icons (mono, hairline); no photography required.

### 9. Events directory teaser

- **Job:** internal SEO linking to the four high-intent event landing pages.
- **Content:** the four type cards (Weddings, Parties, Conferences, Trips) with the per-type one-liners; each
  links to its `/events/[slug]` page.
- **Motion:** low; a hover lift on the cards (press feedback per the design system).
- **Source:** `events.tsx` + `event-frame-cards.tsx`; `EVENT_TYPES` in `events.ts`.
- **Assets:** one representative still per event type from the curated set.

### 10. Pricing teaser

- **Job:** set expectations and pull qualified visitors to `/pricing`.
- **Content:** the three cards driven live from `tiers.ts` (Free $0 / Pro from $9 / Event Pass $24). Add the
  "why" framing, not just the numbers: "Free covers your whole first event." / "Pro unlocks video, unlimited
  events, and the 60-second cut with no watermark." Keep "Most popular" on Pro.
- **Motion:** low; card reveal on scroll.
- **Source:** `pricing-teaser.tsx` reading `PLANS` from `tiers.ts`.
- **Assets:** none.

### 11. FAQ

- **Job:** clear the last objections and emit `FaqPage` JSON-LD.
- **Content:** the 8 items, restyled. FIX the account-gate understatement (see the help corrections batch):
  the honest answer is that guests upload with no app and no account, and hosts can *require* a verified email
  when they want it (default-on), which is stronger than today's copy admits.
- **Motion:** the accordion's existing expand; no cinema.
- **Source:** `faq.tsx` / `faq-data.ts` / `faq-jsonld.tsx` (dual-purpose, keep the pattern).
- **Assets:** none.

### 12. Cinema close (Direction B)

- **Job:** the emotional out and the final CTA.
- **Content:** "Roll credits on the group chat." + "Free to host. Guests join with one scan. The reel builds
  itself." + solid "Start free" + the mono credit line "A Partyreel production · partyreel.com."
- **Motion:** the `CinemaClose` reveal; mono credit typographic treatment.
- **Source:** `CinemaClose` in `marketing-cinema-direction.tsx` + `final-cta.tsx`.
- **Assets:** the real logo asset for the credit line.

**Cross-cutting: the live demo is a first-class recurring CTA.** Per audit risk #5, the demo is the
differentiated no-signup live trial and today it is reachable from only 2 of 15 routes. It becomes a recurring
call to action: in the hero (text link), at the album section, on `/pricing`, and near the final close.
The message is consistent: "Try the live demo, no signup." (`isDemoToken()` gates it; `QrFrame` renders the
real scannable QR when `NEXT_PUBLIC_DEMO_QR_TOKEN` is set.)

---

## Call 3: theme posture (product dark / resources light) [RECOMMENDED]

**Recommendation: product-narrative pages run the ruled ALWAYS-DARK cinema skin; reading and resource surfaces
stay theme-following light-default reading surfaces.**

- **Always-dark (media is the color):** `/` (home), `/reel`, `/features`, `/events` + the four `[slug]`
  pages, `/pricing`. These are the pages where media carries the color and the cinema language belongs. The
  root hardcodes dark (`oklch(0.11 0 0)`) as the design system's media surfaces already do.
- **Theme-following, light default (paper for reading):** `/help`, `/blog`, `/careers`, `/contact`, and the
  legal pages. These are long-form reading surfaces where reading comfort and scannability beat cinema.

The split is coherent, not arbitrary: **product is cinema, docs are paper.** It matches the design system's
existing rule that media surfaces are always dark while general UI follows the theme. Both modes stay
monochrome; the reading surfaces are not a second brand, just a lighter substrate for text.

**Alternative: whole-site dark.** Simpler (one skin, no mode boundary to manage) and arguably more dramatic.
Why it is not recommended: long-form help articles and blog posts are materially harder to read in a dark
reading column, and those pages exist to be *read*, not felt. The split costs a little consistency and buys a
lot of reading comfort where it matters.

---

## Call 4: per-route strategy

Each route expands the skeleton's one-liner. All routes preserve the single-source content plumbing (tiers,
events, features, MDX spec tags, FAQ JSON-LD); this table governs *presentation + copy*, not the route graph.

| Route | Keep / rebuild | Theme | Strategy |
|---|---|---|---|
| `/` (home) | rebuild presentation | dark | The 12-section made-from arc above. B1. |
| `/reel` (NEW) | new | dark | Flagship product page. Full section sketch below. B2. |
| `/features` | keep spine, re-skin | dark | Keep the 5-group structure + Spotlight layouts; re-skin; ADD the named missing features. B2. |
| `/events` + `[slug]` x4 | keep all, re-skin | dark | Keep the SEO equity + per-type layouts; re-skin; add a per-type reel angle + the demo CTA. B2. |
| `/pricing` | keep, re-skin | dark | Keep live cards + Stripe (TEST) buttons; add the why-framing; add `Product`/`Offer` JSON-LD at build time. B2. |
| `/help` | keep structure | light | Content corrections batch (checklist below); profiles articles WAIT for M2. B3. |
| `/blog` | keep, re-skin | light | Re-skin only; new posts deferred (not IA). B3. |
| `/careers` | REWRITE JD | light | Rewrite the Reels Engineer JD around the shipped reel. Highest-embarrassment fix. B3. |
| `/contact` | keep | light | Keep RHF + zod + honeypot + `help@partyreel.com`; add `ContactPage` JSON-LD (optional). B3. |
| `/terms` | keep stub | light | Unchanged (launch-gated). B3. |
| `/privacy` | keep stub | light | Stays a stub, but this IA RECORDS its required content (below). B3. |
| `404` / `error` | re-skin only | dark | Re-skin to the dark identity; no content change. B3. |

### /reel (NEW) full section sketch

The flagship page. Section arc:

1. **Reel hero.** "Every event ends with a reel." + subcopy "Your guests' photos, cut into a cinematic
   highlight video, automatically." A real reel plays (poster-first). CTA "Start free" + the demo link.
2. **The 14-style catalog.** A named visual grid, the actual catalog from `STYLE_CATALOG`. Eight moods:
   **Cinematic, Film, Pulse, Kinetic, Editorial, Sunset, Noir, Float.** Six treatments: **Polaroid stack,
   Film strip, Scattered prints, Framed gallery, Card deck, Layered parallax.** "14 cinematic styles. Pick a
   mood, pick a look, done."
3. **WYSIWYG claim.** "What you see is what you get." One line: the composer you preview in the browser is the
   exact composition that renders, the same pixels. (The live canvas player and the export share ONE draw
   function; the retired Remotion path is teardown-bound and must not be referenced.)
4. **$0 on-device render.** "Rendered on your phone, free, in seconds." Explain WebCodecs on-device export
   (~seconds, $0), with a graceful path for unsupported browsers (today the cloud fallback; if the R3 teardown
   lands, an honest modern-browser nudge instead: keep this copy line contingent). Do not expose the ingress
   numbers.
5. **Watermark and tier story.** A small table: Free = 30s, small `partyreel.com` mark, unspoofable (server-
   derived). Pro / Event Pass = 60s, no watermark. NO watermark on photos or the album, ever. Framing: "The
   free reel carries a small mark. Upgrade and it is gone."
6. **Guest download + reveal tease.** "Every guest can take the reel home." (House-rule present tense; the
   guest download UI arrives with the rebuild timeframe per ADR-0022, so lean on the growth angle and the
   host download, do not promise a live guest button.) Optional short reveal-moment tease.
7. **How-it-works reprise.** A compact restatement of Scan / Shoot / Screen framed as "how the reel gets
   made," linking back to the home film strip mechanic.
8. **Demo CTA.** "Try the live demo, no signup." + "Start free."

### /help content corrections batch (explicit checklist)

Structure stays; these are content fixes, B3. Each item is a factual correction the audit flagged:

- [ ] **Account gate accuracy.** `help/who-can-see-your-event.mdx` (and the FAQ item "Do guests need an
  account?") understate the gate. Correct to: guests upload with no app and no account by default, and a host
  can require a verified email (full OTP / magic-link account, default-on) when they choose.
- [ ] **Recovery bin reality.** `help/how-long-media-is-kept.mdx` says deletion is flatly "permanent." Correct
  to: deleting moves media to a 30-day recovery bin; it becomes permanent after 30 days (or on purge-now).
- [ ] **Download-all zip.** Help describes only single-item Save. Add the whole-album (and filtered-subset)
  zip export for both hosts and guests.
- [ ] **QR presets count.** Help says "a set of QR styles" with no number. State the 4 presets (classic, bold,
  rounded, dots) + brand-color corner tints.
- [ ] **14 styles.** Help copy only says "a highlight reel." Name the 14-style catalog (link to `/reel`).
- [ ] **Photos-only Free consistency.** The Free photos-only constraint is stated only on `/pricing`, which
  reads inconsistent against `/features` ("photos and videos"). Make it consistent: Free is photos-only, video
  is a Pro / Event Pass feature.
- [ ] **Bulk approve.** Help describes one-by-one approval. Add "approve a whole event in one scroll" / bulk
  select.
- [ ] **EXIF/GPS stripping.** Zero surface today. Add it as a named privacy behavior.
- [ ] **Profiles / social articles: DO NOT ADD.** They wait for M2.

### /privacy recorded content requirements (not built this round)

The stub stays (launch-gated), but the IA records what the real policy must cover so it is not rediscovered
later: client-side EXIF/GPS stripping; the storage / retention model (events persist until deleted, no end
date); the 30-day recovery window; the verified-email gate; and the forensic / law-enforcement disclosure
language (IP / device / timestamp capture), which is BLOCKED on counsel sign-off and NCMEC registration.

---

## Call 5: voice and copy rules (the MECHANICS below are binding; the LEADING-COPY VOICE is under the
dedicated exploration per cluster 4, and every proposed copy line in this doc is a placeholder until it rules)

- **The thesis:** "Every event ends with a reel." Site-wide hook. The hero owns the kinetic-word variant;
  other surfaces echo the plain form.
- **Confident cinema-plain.** Present-tense, shipped-feature voice (the as-if-complete rule, inside the hard
  fence above). Plain language, no jargon, no hype-adjective stacking.
- **Specifics over adjectives.** Name the numbers: 14 styles, 30 days, 2 GB free, ~500 photos, 30s / 60s, one
  QR. The trust and privacy section especially trades adjectives for facts.
- **NO em-dashes anywhere in site copy** (AST-guarded by `no-em-dash-policy.test.ts`). Recast with commas,
  colons, parentheses, or two sentences.
- **Typography (LOCKED identity).** Display = Urbanist 700 (-0.03em) via `font-heading`; card / section headings
  = Urbanist 600; labels / eyebrows = Inter 500; Geist Mono for counts and timecodes. Do NOT reference
  Instrument Serif (retired 2026-06-19). Reading copy 15 to 16px, ~70ch measure, on a 12-column grid.
- **Palette.** Monochrome both modes; `--brand` aliases ink; media is the ONLY color; feedback / action colors
  are state, not decoration. The rebuild STRIPS the retired `#FB4817` marketing accent. No pure white; dark
  surfaces use surface steps + borders + glass, no shadows.
- **Two-persona split.** HOSTS get control language ("you're the editor," "full editorial control," "you
  decide"). GUESTS get frictionless language ("no app, no account, no chasing"). Marketing is the one place
  the brand speaks at this volume; guest product surfaces stay the host's event.

---

## Call 6: asset requirements (the real dependency list)

Track B cannot ship the home or `/reel` without real media. The dependency list:

1. **A curated, licensed event-media set.** The Unsplash lab pack is dev-only. We need enough real-feeling
   event media (weddings, parties, conferences, trips) for: hero loops, the film-strip conveyor, the demo
   fixtures, the album frames, the events-directory stills, and the 14 style-catalog covers. **OPEN DECISION
   FOR WILL (source of media):** (a) Will's own test-media library, (b) a shot brief (someone shoots a real
   event to spec), or (c) a licensed stock pack. This same set can double as the pre-launch demo-event media
   swap (a launch-checklist item), so sourcing it once solves two problems.
2. **3 to 6 pre-rendered sample reels from the REAL engine**, across styles and orientations (portrait +
   landscape). These feed the hero loops, the "Watch a sample reel" overlay, and the inline reels on `/reel`
   and the home reel section. Rendering them through the real 14-style engine keeps the presentation honest
   (the substrate call, cluster 1).
3. **The real logo asset.** Needed for the cinema-close credit line and to unblock the watermark-badge
   re-grade (the free-reel mark).
4. **Art-directed demo fixtures for the C demo:** display names, an event name, ~9 stills, a reel duration +
   cover, and the counters. Art-directed, not real PII.

---

## Build phasing sketch (Track B, after ratification)

The lab-first gate applies to every phase: any NEW motion is prototyped in the `/design` Marketing sandbox
FIRST (the hero substrate and the C demo re-skin are the two big prototypes), held to the emil bar, and
live-verified on the launch-prep alias before it merges. Marketing is exempt from the 300ms UI ceiling
(cinematic reveals are explanatory, not workflow) but still governed by animate-by-frequency + reduced-motion
safety, and offscreen loops must pause (the `useInView` observer is the hook; the lab does not pause and
production must).

- **B1: the home.** Cinema hero (with the chosen substrate) + how-it-works film strip + the re-skinned demo +
  the four depth sections (album, reel teaser, trust/privacy) + the nav/footer changes + the theme posture.
  This is the ruling's wow floor made real, in its IA.
- **B2: the product routes.** `/reel` (the full section sketch) + the `/features`, `/events` + `[slug]`, and
  `/pricing` re-skins with their added named features and per-type reel angles.
- **B3: the reading surfaces + polish.** The `/help` corrections batch + the careers JD rewrite + the `/blog`
  re-skin + the `404` / `error` re-skin + the SEO schema additions (`Product` / `Offer` on pricing,
  `JobPosting` on careers, optional `ContactPage`).

---

## Non-goals (explicit)

- **No launch switches.** No flipping Stripe to live, no writing the real `/privacy`, no executing the demo-
  media swap. Those are launch-checklist items, tracked elsewhere.
- **No profiles / social marketing surface** until M2 ships the feature. One roadmap line only.
- **No testimonials or social-proof fabrication.** Pre-launch honesty; the trust-strip pattern (claims, not
  quotes) holds until we have real, permissioned proof.
- **No blog content program** inside Track B. The blog gets a re-skin; new posts are a separate effort.

---

## The 4 decision clusters for Will (Phase B of T2.5)

These drive the collaborative walk. Each has the question, the options, and a recommendation with rationale.

### Cluster 1: site map + hero substrate. RATIFIED (Will, 2026-07-08)

**Site map: Shape 1** (keep the spine, add `/reel`) as recommended. **Hero substrate: pre-rendered mp4 loops
from the real engine** as recommended (LCP-safe poster-first, battery-safe, honest because the loops come out
of the real 14-style engine). The alternatives and their honest cases are preserved in Call 1 for the record.

### Cluster 2: home arc + theme posture. RATIFIED (Will, 2026-07-08)

**Home arc: the blank-slate MADE-FROM DECOMPOSITION spine** (see Call 2, which records Will's reasoning: the
feature-focused storytelling without locking the page to one narrated event type). The original sectioned arc
was retired; the premiere-rewind narrative alternative was declined for event-type lock-in. **Theme posture:
product-dark / resources-light** as recommended (Call 3).

### Cluster 3: secondary routes. RATIFIED (Will, 2026-07-08)

**Adopt all as drafted:** the `/reel` eight-section sketch; all four `/events/[slug]` pages kept (each a
separately-ranking, statically-generated, high-intent landing page); the full nine-item help corrections
checklist; the careers Reels Engineer JD rewrite in B3.

### Cluster 4: voice. DIRECTION RULED (Will, 2026-07-08); the blend execution is the remaining eyeball

Will declined to ratify the leading copy by checklist ("this stage defines a lot of the high level concepts
and lower-level copy"), so four voice directions were drafted and presented. **His ruling on the draft: a
MIX of D2 (Warm host) and D4 (The big night)**, his words recorded: D2 "appeals to the ease for the host"
(though "and none of them are yours to chase" could be written better) and D4 "appeals to the importance of
the events"; BOTH thesis lines are "very strong" and set the tone ("Every event ends with a reel." + "The
whole night, in one place, forever."); and the blend should carry the virtue of the CURRENT site H1, "Every
photo from your party, in one place," which he called "beautiful in its concise clarity."

**The ruled voice, operationally: warm-host ease x big-night stakes, disciplined by concise clarity.** Every
line passes the clarity test (could it be shorter and plainer without losing the warmth or the stakes?).
Deadpan cinema (D1) is NOT the spine; Documentary-specific (D3) survives only as the factual register the
trust and pricing sections already require (facts in a warm frame). One open micro-choice flagged from
Will's own phrasing: he quoted D4's line as "The whole EVENT, in one place, forever" (the draft says
NIGHT); "event" avoids the same event-type lock-in he ruled against in the arc (conferences and trips are
not "nights"), so both forms go to the boards.

**Remaining step:** the lab type-boards present TWO blend executions (night-leaning vs warm-leaning) with
the pure D2 and D4 sources below as reference; Will confirms the execution, then Track B writes production
copy in the confirmed voice. The Call 5 mechanics stay binding throughout.

**Round 2 (Will, on the deployed boards, 2026-07-08): four further rulings.** (1) "Night" is OUT as
identity language: event/party everywhere ("more the big event" than the big night; his own forms: "The
whole event, in one place, forever" and "The whole event, cut down to the highlights"). (2) REBALANCE: the
groupings over-emphasized the reel; "a ton of our value lives in the easy media collection itself," so
collection value co-leads the copy (the made-from ARC stands: it already decomposes the reel INTO the
collection; this ruling governs the copy inside sections). (3) A GOLDEN SET of eight ratified lines now
anchors all groupings verbatim: "The whole event, in one place, forever" / "Every photo comes to you
first" / "The whole event, cut down to the highlights" / "Start free, upgrade when you host again" /
"Every event ends with a reel" / "Watch your album fill up" / "From the first scan to the final cut" /
"Every moment, and you decide what stays"; the QR/scan/share and privacy registers are also endorsed.
(4) The hard-cut kinetic word read "almost glitchy" on text-only boards: round 2 ships a word-animation
toggle (Roll vertical-swap default / Type / Cut) and the production hero's word-with-image-cut pairing is
decided at the Track B hero prototype. Round-2 boards: three fresh groupings (Collection-led / Arc-led /
Reel-led tempered) built on the golden set, on branch lp/voice-r2.

### Cluster 5 (asked in the same walk): site media sourcing. RATIFIED (Will, 2026-07-08)

**Curate a beautiful, LICENSE-FREE media set now** (public-domain / CC0-class); Will returns with final media
later. The curated set powers Track B's hero loops, film strip, demo fixtures, and style covers in the
meantime, and the swap to Will's final media is a contained asset replacement (the components read from one
fixture source). The pre-launch demo-event media swap still waits for the FINAL media, not this interim set.
