---
track: crumbs-14
status: open            # open -> handed-off; deleted in the merge commit that integrates it
cut: "f1bf741d"            # the launch-prep SHA the branch was cut from
board: none
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/components/app/event-feed/event-cards-row.tsx
  - src/components/app/event-feed/edge-fade-scroller.tsx
  - src/components/app/event-feed/event-hub.test.tsx
  - src/components/ui/popup.tsx
  - src/lib/auth/admin-context.ts
  - src/lib/auth/return-path.ts
  - src/lib/auth/return-path.test.ts
  - src/app/(auth)/actions.ts
  - src/app/(auth)/actions.test.ts
  - src/components/marketing/sections/home/pricing-teaser.tsx
  - src/components/marketing/sections/home/price-pop.tsx
  - src/components/marketing/mdx/spec-shared.tsx
reads:                  # single-sources you depend on: never duplicate, never edit
  - docs/systems/host-app.md
  - docs/systems/auth-accounts.md
  - docs/systems/design-system.md
---

# lp/crumbs-14

**Goal.** Six fixes: the hub's cards row looping at its stick threshold, the screen popup's truncated back label, the admin sign-in forgetting the asked page, a device Sign out ignoring a refusal, the pricing teaser's broken price, and a lowercase help bullet.

## The brief

Six findings from milestone 30's production pass (`../partyreel-wt/_scratch/prod-m30/ledger.txt`), the claims walk on build 21 (`../partyreel-wt/_scratch/claims-walk/ledger.txt`) and ROADMAP.

**1. The hub's cards row loops at its stick threshold** (medium; phones, Android Chrome most). At 375, jump the page into the band where the row meets the bar (`scrollTo` 220 to 284; the app itself does it through `masonry.tsx`'s `returnTo()`, whose `scrollIntoView({ block: "center" })` runs when the viewer closes): the row flips between the 2x2 grid and the pills for ever and `scrollY` swings 99 px (250 to 151 and back, still going after 5 s); at 768 and 1440 a jump to 222 to 240 flips 1 to 7 times; a jump past the band lands short by the height the row loses. During the loop the fades go stale both ways. The cause: scroll anchoring compensates the row's condensation (156 to 57 px at 375) when the anchor sits below the row, which moves the row off the bar; the IntersectionObserver un-sticks it, it expands, and anchoring compensates back. Continuous scrolling and a reload's restoration were stable. Fix it so the row's footprint and its stuck state can never feed each other (a held footprint, the observer's hysteresis, or anchoring kept out of the change: your call, with its reason), never by turning scroll anchoring off for the album. A test drives the jump into the band and asserts one settle; the fades read true afterwards.

**2. The claims review's back label truncates at 375**: "Dashboard" shows as "Dashbo…" (its span 60.9 px against 63 needed, squeezed by the centred title's grid column in `src/components/ui/popup.tsx`'s screen header). Fix it at the header's grid so every screen popup's back label fits.

**3. `/admin/reports` signed out returns to `/admin`**: the admin gate writes `/login?next=/admin` whatever was asked (`src/lib/auth/admin-context.ts:117`). Carry the asked admin path through the sign-in, on the admin host alone and through the exact allow-list the sign-in return path already runs (`src/lib/auth/return-path.ts`, crumbs-11: never an open redirect, never the apex from the admin host, the callback kept bare). Tests for the admin sections and a refused hostile path.

**4. A device Sign out ignores a refused GoTrue call** (ROADMAP): `signOutAction` still leaves for `/login` when the network or the auth server refuses, which sends a still-signed-in host back to `/dashboard` as if nothing happened; Sign out everywhere answers the same refusal already (`src/app/(auth)/actions.ts`). Answer it the same way.

**5. The home's pricing teaser breaks Pro's price after its 9 at 1440** ("from $9" over "/mo"): its digits are inline-blocks in a column about 200 px wide (`pricing-teaser.tsx`, `price-pop.tsx`). Keep the price on one line at every width. Whether a unit beside a price wears the heading face stays a board idea (leave it).

**6. The free-plan help article's first bullet renders lowercase** ("one event at a time.", `src/components/marketing/mdx/spec-shared.tsx:203`).

Retire the ROADMAP lines these answer (4, 5, 6) in your Handoff's Deferred by their words.

**Not yours:** `settings-wiring` owns the settings, the doors, the Guests room and the hub's card data (`room-card.ts`, the hub page); `triage-r2-wiring` owns the admin portal's pages and components. If a fix needs one of their paths, name it as a relay in your Handoff instead.

**Paths:** your owns are a start. A path you need beyond them: add it to `owns` in your manifest before editing, or name a one-line exception.

**Starts from.** CLAUDE.md's working loop, the bible's ten and production as it is; the tests say what has to keep
working.

**Verify on.** The gate on the synced tree (CLAUDE.md's four steps), each step on its own exit code; `pnpm lab:smoke --base http://localhost:<port>` whole when the lane changes anything under `src/` but tests (the Library renders the product's components); and the surfaces the Handoff is judged on, local and live.

## Questions (a recommended answer each; the Orchestrator relays them)

- none yet

## System-doc edits (in place, owned facts only)

- none yet

## Deferred (ROADMAP one-liners, bucket named)

- none yet

## Handoff (replaces the chat report)

- The work commit and the sync commit, pushed (or: launch-prep had not moved); the head is in the chat line
- Every claim names its artifact (a commit, a log line, a path), so the Orchestrator checks rather than believes.
- Gates on the synced tree, each on its own exit code, and the sha they ran on
- Lane check: `git diff --name-only origin/launch-prep...HEAD` = owned paths + this file (exceptions and why)
- The items, one line each
- Assets requested from Will: none, or one per line: `what · spec (size, grade, count, format) · replaces <stand-in id>`
- Board ideas: an improvement you saw beyond your lane, one line each (the Orchestrator may open a board for it)
- Proposed migrations / Worker / Vercel / Stripe / env changes: none
- Calls his to overrule, one line each
- Look at first: ...
