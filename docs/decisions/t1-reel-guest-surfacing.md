# T1 options-doc: Reel guest surfacing (Slice B's 5 questions)

> ROLE: a decision options-doc for Will's T1 Ruling Day. Covers the 5 product questions in
> `docs/specs/reel-v1.md` "Slice B", re-derived for the client-render architecture (Plan A in the
> program plan). The ruling becomes an ADR (0019+); R3 (Reel Experience) builds on it.
> Reply "yes, your recommendation" and this is settled.

## 1. The decision, and why it is a one-way door

**What guests see, where, and what they can take away when they open `/e/[qr_token]` for an event
that has a highlight reel.** Four product calls plus one security confirmation:

1. Is the reel guest-visible always, or behind a host publish switch?
2. Where does it live on the guest page?
3. Can guests download the mp4, or only watch the live player?
4. What is the download source: the host's rendered artifact, or a guest-triggered render?
5. Confirm the anon surface leaks no host-only metadata (enumerated below).

Why one-way: the reel is the shareable "wow" and core-loop step 5. Whatever guests can see and save
on day one becomes the expectation; **taking a capability away later (a reel guests could always
watch, a download that existed) is a visible downgrade**, while granting one later is a feature.
The publish-switch default and the download grant are the two genuinely hard-to-walk-back calls.
Placement (question 2) is mostly reversible UI; question 5 is an invariant, not a choice.

**The architecture update that changes the math (2026-07-03):** renders are moving CLIENT-side
(canvas engine + WebCodecs on the user's own device, mp4 uploaded by the host; pending the device
spike, fallback = tuned Lambda at ~$0.006-0.024/render). Under Plan A a "guest-triggered render" is
a **$0 encode on the guest's own CPU**: no server cost, no shared quota, no abuse surface beyond
their own battery. That flips question 4 from "cost control problem" to "capability by default",
and it demotes the host-uploaded mp4 from a requirement to an optimization.

## 2. Context and constraints (codebase + product)

- **Settled, do not relitigate:** 1 reel per event · generation FREE all tiers · free tier carries
  the corner watermark (drawn in-engine, all 14 styles) · paid (Pro AND Event Pass) = no watermark
  + longer + video · no music · style catalog (8 moods + 6 treatments) + portrait/landscape ·
  deterministic seed, no shuffle.
- **The reel is host-only today.** Guests reach the album at `/e/[qr_token]` but never see the reel
  (`docs/systems/host-app.md` "Reel curation": host-only + host-private is the shipped R1 state,
  explicitly awaiting this ruling).
- **The guest page is access-gated** (`docs/systems/guest-flow.md`): visibility `private | password
  | open`, gallery access `none | teaser | full`. Two invariants bind the reel surface: (a) anon
  RPCs gate on `visibility = 'open'` ONLY; a password event's media serves via the server admin
  read behind the signed unlock cookie, never through an anon RPC; (b) the teaser withholds all but
  9 photos server-side, so **the reel must be a `full`-access surface** or it becomes a teaser
  bypass (it replays the withheld gallery in motion).
- **The mp4 lives at a stable key** `events/<id>/reel/reel.mp4` (`reelOutputKey`), lazily rendered
  and cached against `rendered_hash` (config-change invalidation). Raw R2 keys never reach the
  browser (ADR-0003); everything presigns server-side.
- **The live player is $0 per view** on any architecture: today `@remotion/player` from previews,
  under Plan A the same canvas engine that produces the mp4 (WYSIWYG gets stronger).
- **Growth loop:** every QR exposes Partyreel to future hosts; the reel is the strongest asset in
  that loop. A watermarked free-tier reel saved to a guest's camera roll and posted to
  Reels/TikTok is free acquisition. Every guest view is a host-acquisition moment.
- **Reel membership is host-curated approved media**, but membership can include items the host
  later hid (the reorder grid dims them). The guest surface must re-filter to approved + visible at
  read time.

## 3. Options per question

### Q1: Always visible vs a host publish switch

| | Option | Consequences | Reversibility |
|---|---|---|---|
| A | **Always visible** once the reel has items | Max growth-loop exposure, zero host friction. But guests watch half-finished drafts mid-curation; a bad first take embarrasses the host at their own party; no way to opt out without deleting the reel. | Hard. Adding a switch later yanks reels guests could already see. |
| B | **Publish switch, default OFF** ("Share with guests", one tap in the composer) | The host decides when the reel is ready; the publish tap becomes a product moment (pairs with the R1 reveal work); a `guest_visible` boolean on `highlight_reels`, trivially cheap. Costs some exposure: hosts who never tap it never feed the loop. | Easy in the good direction: the default can flip to ON later, or nudges can be strengthened, once real usage data exists. |
| C | Publish switch, **default ON** (auto-publishes when the reel first has enough items; host can unpublish) | Exposure of A with an escape hatch. But "your guests have been watching this the whole time" is a trust surprise, the same class of silent leak the product carefully avoids elsewhere (teaser, redacted locked pages). | Medium: flipping the default OFF later is quiet, but the surprise already happened. |

### Q2: Where on `/e/[qr_token]`

| | Option | Consequences | Reversibility |
|---|---|---|---|
| A | **Hero at the top** (autoplaying player above everything) | Maximum wow, but it hijacks the page's primary job DURING the event (get guests uploading in seconds from a QR scan) and puts a heavy animated surface ahead of the action block on old devices. | Easy (layout). |
| B | **A reel card in the page flow** (a cinematic banner under the action block, above the masonry; tapping it opens a full-bleed player overlay, the "dedicated moment") | Upload stays primary; the reel gets real presence; the full-bleed overlay is the wow AND the share/download surface; masonry untouched. | Easy (layout). |
| C | **Lifecycle-adaptive: B during, hero after.** The card placement while `accepting_uploads`; when the host closes uploads (the existing view-only state), the reel is promoted to the top, because the link's job has changed from "contribute" to "relive". | Matches the page's own state machine (the view-only state already reflows the page); the album-as-artifact phase gets the hero without ever competing with upload. Slightly more build than B. | Easy (it is B plus one conditional). |

### Q3: Guest download, or watch-only

| | Option | Consequences | Reversibility |
|---|---|---|---|
| A | **Watch-only** | "Protects" nothing (guests screen-record anyway, minus quality, minus clean watermark) and throttles the loop at its strongest link: the saved, posted, watermarked mp4. | Granting download later is easy but forfeits launch-window growth. |
| B | **Guests can download the mp4** | The watermark does its double duty at guest scale; the reel travels to the platforms it was designed for. Free: watermarked. A paid host's reel: clean, still branded by the event link it came from. | Hard to revoke once granted (visible downgrade). But there is no scenario where we would want to: the host already published (Q1) and the album itself is already downloadable (the shipped zip export). |

### Q4: Download source (re-derived for client render)

| | Option | Consequences | Reversibility |
|---|---|---|---|
| A | **Host artifact only**: serve the last host-rendered mp4; "not ready yet" if the host never exported | The old recommendation, correct under Lambda economics. Under Plan A it is needlessly stingy: it makes the host's export tap a gate on the guest loop, and staleness is visible (guests download yesterday's cut of today's reel). | Easy to upgrade later. |
| B | **Guest self-encode always**: every download is a fresh client-side encode on the guest's device | Always current, $0, infinitely concurrent. But it wastes the cached artifact (instant download beats a 30-60s encode), and it strands weak/old devices (no WebCodecs = no download), exactly the "everyone tool" audience. | Easy to add caching later. |
| C | **Hybrid, artifact-preferred**: serve the cached mp4 when `rendered_hash` matches the current config (instant, works on any device); otherwise the guest self-encodes on their own device; if their device cannot encode, fall back to the newest artifact even if stale, else "ask the host to share the video". | Best of both: instant when possible, always possible when the device allows, never a server cost, no abuse surface. The host-uploaded artifact becomes exactly what the program plan calls it: an optimization, not a requirement. | Fully composable; each leg can be tuned independently. |

Security line that holds in every option: **guests never get a write path.** Self-encode output
stays on the guest's device (a local file save); only the HOST's authed session can PUT to
`reelOutputKey`. A tampered guest client can only strip the watermark off its own local encode,
the same accepted pre-launch risk as the host path, worth a line in the security round.

Plan B contingency: if the device spike fails and renders stay on Lambda, question 4 reverts to
the old economics and the answer collapses to option A (host artifact only, "not ready yet"
otherwise), with a guest-triggered Lambda render explicitly NOT offered (anon + costed + quota 10
is the abuse surface the spec warned about). The ruling below is written to survive both worlds.

### Q5: The anon surface, field by field (the confirmation, not a choice)

`highlight_reels` today: `id, event_id, style_id, orientation, seed, length_seconds,
cover_media_id, status, output_key, render_id, render_started_at, rendered_at, rendered_hash,
render_cost_usd, render_error, theme (legacy), created_at, updated_at` (from
`src/lib/db/types.ts`).

The guest read (anon capability-token RPC for `open` events, mirroring
`get_event_media_by_qr_token`; the unlock-cookie server admin read for `password` events) returns
ONLY:

- `style_id`, `orientation`, `seed`, `length_seconds`, `cover_media_id`: the render inputs; all
  host-chosen presentation, nothing personal.
- `mp4_ready` (derived boolean: `status = 'ready'` AND `rendered_hash` matches the current
  config): drives the download path without exposing render internals.
- `watermark` (derived server-side from the host's tier): the mp4 shows it anyway.
- The ordered reel items: `media_id`, `type`, presigned preview URL (+ poster for video),
  `width`/`height`. **Re-filtered at read time to approved AND currently visible** (hidden in-reel
  members drop out; if `cover_media_id` points at a now-hidden item, fall back to the first item).
  No uploader identity: no guest_id, no email, no display name (the reel needs none).

Never returned: `output_key` (raw R2 key, ADR-0003; the download is a presigned server route),
`render_id`, `render_started_at`, `rendered_at`, `rendered_hash`, `render_cost_usd`,
`render_error`, `theme`, `created_at`, `updated_at`, the host's tier itself, and any `reel_items`
timestamps. Two structural guards: the RPC gates on `visibility = 'open'` internally (password
events never touch the anon path), and the reel renders ONLY at gallery access `full` (a teaser or
locked viewer sees no reel, or the section becomes another "sign in to see" nudge; it must never
replay the withheld gallery).

Verdict: with that column allow-list and the approved-and-visible re-filter, nothing host-only
leaks. The reel is the host-approved album subset plus presentation config.

## 4. RECOMMENDATION

**Q1: B, the publish switch, default OFF, made loud.** A `guest_visible` boolean; the composer
gets a prominent one-tap "Share with guests" (and the empty/"reel looks good" states nudge toward
it). The reel then stays live and auto-updates as the host curates. Reasoning: the reel is the
host's artifact of their own party; a silent draft leak is the one outcome that damages trust, and
the deliberate publish tap is a better product moment than ambient exposure. The growth cost is
recoverable (flip the default or strengthen nudges later, a two-way door), while option A's cost
is not.

**Q2: C, lifecycle-adaptive.** A cinematic reel card under the action block while uploads are
open, opening a full-bleed player overlay; promoted to the top of the page once the host closes
uploads and the link becomes the keepsake album. Reasoning: never compete with upload during the
event, own the page after it; it rides the page's existing state machine and stays a layout-level
(reversible) choice.

**Q3: B, guests download.** Watch-only throttles the growth loop at its strongest link and
protects nothing a screen recorder does not already defeat. The free-tier watermark was designed
for exactly this distribution.

**Q4: C, hybrid, artifact-preferred.** Serve the cached host mp4 when it matches the current
config (instant, universal); otherwise the guest self-encodes on their own device at $0; weak
devices fall back to the newest artifact, then to "ask the host". Guests never upload; only the
host writes to `reelOutputKey`. If the Plan A spike fails, this ruling degrades gracefully to
"host artifact only" with no product re-litigation.

**Q5: confirmed safe under the allow-list above**; treat the field list and the two structural
guards (open-only anon RPC, full-access-only rendering, approved-and-visible re-filter) as the
build spec for the RPC contract test.

One growth extra, flagged as ITS OWN call (deliberately NOT covered by "yes, your
recommendation"): the guest full-bleed player could end on a quiet "Made with Partyreel" end-card
with the create-event link (in the PLAYER surface only, never baked into the mp4; the mp4 already
carries the watermark on free). Cheap and it converts the view-moment, not just the download; but
it puts Partyreel brand surface on a PAID host's event page, which cuts against the "guest pages
are the host's event, minimal branding" principle, so it needs Will's explicit yes/no, and
per-tier treatment (free-only end-card?) is a valid middle answer.

## 5. What we build meanwhile / what waits

**Meanwhile (ruling-independent, already in flight or unblocked):**
- The WebCodecs + canvas engine spike (R2-A, in progress): question 4's hybrid hinges on its
  verdict, but every option survives either outcome.
- The render-source variant (~2400px `render_key`): serves both Plan A and Plan B.
- The guest reel plumbing that no ruling changes: the anon capability-token RPC + contract test to
  the Q5 allow-list, the access resolution reuse, the presigned mp4 download route gated on
  publish + access, the `guest_visible` column (harmless if Q1 lands differently, it just defaults
  differently).
- The guest player component on the engine (R3), built against the full-bleed overlay shape, which
  every Q2 option shares.

**Waits on this ruling:** the publish switch default + composer copy (Q1), the guest-page
placement and the lifecycle promotion (Q2), exposing the download button (Q3/Q4 wiring order), and
the ADR (0019+) recording the ruling.

**Waits on other T1 rulings:** free/Pro reel length caps (the pricing ruling) feed
`length_seconds` bounds; the reveal-moment lab pick shapes the host publish moment, not the guest
surface.
