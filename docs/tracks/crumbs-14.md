---
track: crumbs-14
status: handed-off      # open -> handed-off; deleted in the merge commit that integrates it
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
  # added in flight (2026-09-29): the paths the admin sign-in's page and the refused sign-out reach
  - src/lib/auth/admin-context.test.ts
  - src/app/(auth)/login/page.tsx
  - src/app/(auth)/auth/callback/route.ts
  - src/app/(auth)/auth/callback/route.test.ts
  - src/components/auth/login-form.tsx
  - src/components/auth/login-form.test.tsx
  - src/components/auth/sign-out.ts
  - src/components/auth/sign-out.test.ts
  - src/components/app/user-menu.tsx
  - src/components/app/user-menu.test.tsx
  - docs/systems/auth-accounts.md
  # added after the sync (9371b6bd): settings-wiring and triage-r2-wiring merged, so their files are free
  - src/components/admin/admin-bar.tsx
  - content/help/what-the-free-plan-includes.mdx
  - content/help/pro-vs-event-pass.mdx
  - content/help/storage-plans-and-limits.mdx
  - content/help/AUTHORING.md
  - src/components/marketing/mdx/spec-shared.test.ts
  - docs/systems/host-app.md
  - docs/systems/admin-observability.md
reads:                  # single-sources you depend on: never duplicate, never edit
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

None is a one-way door; each is built as recommended and is his to overrule.
- **Q1, the teaser's width.** Built: the cards' row grows from `max-w-3xl` to `max-w-4xl` (cards 245 to 288 px at
  1440), the home's other object width, so every price holds its `section` step on one line. The other answer, a
  smaller price inside the teaser, is a one-off size his type-phone ruling refuses. Recommended: keep 4xl.
- **Q2, a refused device Sign out.** Built as the brief said: it stays signed in and says so (a toast, "Couldn't sign
  out. Check your connection and try again."), like Sign out everywhere. The other answer clears this device's cookies
  anyway and leaves for /login (the device is signed out; its server session lingers until it expires). Recommended:
  the toast, since it never claims what did not happen.
- **Q3, a long back label.** Built: the screen bar's back label keeps its own width up to 40vw, so a long event name
  still truncates (114 px of text at 375, was 108) and a long title beside it sits off centre. Recommended: as built.
- **Q4, the portal's pages return on the admin host alone.** So a local dev sign-in (no admin host configured) lands
  on the dashboard, where `next=/admin` used to land in the portal. Recommended: as built (auth does not complete on
  localhost anyway).
- **Q5, beyond the brief's bullet.** The same lowercase opening sat in two tables' cells beside sentence-case
  neighbours ("one event" beside "One per pass", "about a year per pass" beside "No end date"); built: `capitalized` on
  the three lowercase phrase inlines and a guard over every article. Recommended: keep.

## System-doc edits (in place, owned facts only)

- `auth-accounts.md` "A sign-in lands on the page that asked for it": the portal's gate carries its page too, and
  `next` is checked per host (the portal's pages on the admin host alone, the app's off it); the allow-list line: the
  admin host's bare callback and `pr_admin_return`; "Signing out": both sign-outs answer a refusal, through
  `signOutHere` in the menu and the admin bar.
- `admin-observability.md` "The seam": `requireAdmin()`'s login path carries the asked page; the bare-callback line
  points at the cookie; "Verifying": the admin host's sign-in plumbing walks locally under a dev admin host.
- `host-app.md` "The cards row": it condenses inside a footprint holding the resting height, and stuck is its top at
  the bar (the observer's root grown past the fold).
- `content/help/AUTHORING.md`: `<MaxEvents />` renders a phrase and takes `capitalized` where it opens one.

## Deferred (ROADMAP one-liners, bucket named)

- Now, retire (answered): "Auth: the device Sign out ignores a refused GoTrue call (the network, the auth server) and
  still leaves for `/login`, ... (from `crumbs-13`)."
- Now, retire (answered): "Help: the free-plan article's first bullet renders lowercase ("one event at a time.", ...)
  (from milestone 30's production pass)."
- Now, replace "Marketing: the home's pricing teaser breaks Pro's price after its 9 at 1440 (...); with it, whether a
  unit beside a price ... wears the heading face at all (from `crumbs-12`)." by its open half alone: "Marketing:
  whether a unit beside a price ("from", "one-time", a clip's count) wears the heading face at all (from `crumbs-12`)."
- Now, retire as stale (crumbs-11's return path answered it; milestone 30's J1/J2 walked it on production): "Emails: a
  signed-out host pressing a mail's button (Renew Event Pass, Manage storage) lands on the dashboard after sign-in, not
  the button's page: ... (from `emails-wiring`)."

## Handoff (replaces the chat report)

- **Commits, pushed** (head in the chat line): the work `ea8027c0` (the row), `330c04d0` (the popup, the admin page,
  the sign-out, the teaser, `capitalized`), `486508f6` (the help and the docs), `24c73f7a` (stuck at the bar, never the
  fold), `3f0c0be9` (the phrase inlines), `bfd8b325` (a docs line); the owns widened in `56462601`, `330c04d0` and this
  commit.
  **Sync** `9371b6bd`: `git merge origin/launch-prep` at `b55e038c` (settings-wiring `7c0fbcb1`, triage-r2-wiring
  `1b29be3a`), one conflict in `popup.tsx`, resolved onto settings-wiring's shared `arrow` (its `up` level kept whole).
  launch-prep has since moved to `2424e409` by records and the types regen `6c64d5c8` alone, none in this lane's paths
  or reads: no second sync.
- **Gates** on `3f0c0be9` (the synced tree), each on its own exit code, logs `../partyreel-wt/_scratch/crumbs-14/gate3-*.log`:
  `pnpm typecheck` 0, `pnpm lint` 0 (0 warnings), `pnpm test` 0 (600 files, 6949 tests), `zsh scripts/build-lock.sh
  pnpm build` 0, `pnpm lab:smoke --base http://localhost:3135` 0 (169 checks, 0 failing); `pnpm test` again on
  `bfd8b325` (docs only) 0 (`gate4-test.log`).
- **Lane check** (`git diff --name-only origin/launch-prep...HEAD`): only owned paths and this file. Named: the admin
  bar's two lines (its import and its form action) were forced, and made while triage-r2-wiring still ran, since the device
  sign-out's new return type made its plain `<form action={signOutAction}>` a type error; the file, the three help
  articles, `AUTHORING.md`, `host-app.md` and `admin-observability.md` joined `owns` once their lanes had merged.
  `settings-wiring` had claimed `popup.tsx` at its boot: its change merged first, and mine rides on it (the sync).
- **1, the hub row's stick loop:** the row sticks as a footprint whose floor is the resting band's height (read only
  while the band rests and no transition runs, so the tiles' own 200 ms height morph cannot move it), the band
  condenses inside it with its hairline present and clear at rest, and stuck is the footprint's top at the bar (the
  observer's root grown a screen past the fold); scroll anchoring stays on. `row-before.log` (the old row: 121 flips in
  2 s at 375, 118 at 768/1440, every jump past the band 99/59 px short) against `row-final.log` (every jump and
  viewer-style `scrollIntoView` one flip, landed where asked, fades true); `row-edges-final.log` (reduced motion; a
  phone turned while stuck; a press under the footprint's empty part reaches the album's tile); `short-before.log` /
  `short-after.log` (a phone on its side: stuck at rest at the top, now resting). `event-hub.test.tsx` drives the jump
  through a page model (layout, both observers, anchoring): one settle in and out, a jump past lands where sent, a short
  screen rests unstuck, and a control that loops when the footprint follows the band; it fails on the old row.
- **2, the popup's back label:** the screen bar's back side is `minmax(auto,1fr)` with the button capped at 40vw, so
  the label is reserved before the centred title grows: "Dashboard" beside "Photos waiting for you" whole at 320, 375,
  430 and 639 (was 60.9/63 at 375, 33.4/63 at 320), "Your plan" and "Album" whole, settings-wiring's "up" labels whole
  and centred (`popup-before.log`, `popup-after-sync.log`).
- **3, the admin sign-in's page:** `requireAdmin` sends `/login?next=<page>` from the proxy's `x-pr-path`;
  `return-path.ts` returns each host to its own pages (the portal's home, its twelve sections by name and the account
  and album row pages on the admin host only; the app's off it); the admin host's bare callback reads the page from
  `pr_admin_return` (ten minutes, `Path=/auth/callback`, SameSite Lax, Secure on https), which its login form writes and
  the callback re-checks and clears. Tests: `return-path.test.ts` (every NAV section and row page, 21 lookalikes, the
  cookie line), `admin-context.test.ts` (16), `login-form.test.tsx`, `callback/route.test.ts` (one reshaped with its
  scar: an app page asked on the admin host used to be followed to that deployment's 404). Walked locally on a dev
  admin host (`admin.localhost:3135`): the gate's 307s, the callback's answers to a kept, a hostile, an app and a
  download value (followed nowhere, cleared) and the apex ignoring it, and in Chrome the form's cookie and Google's
  `redirect_to` left bare, stopped before it left the machine (`admin-login.log`).
- **4, the refused device Sign out:** `signOutAction` returns `SignOutRefusal` when GoTrue refuses (the guest tickets
  still put down), and `signOutHere`, the menu's and the admin bar's form action, toasts it; `SignOutEverywhereResult`
  folded into the one type. Tests: `actions.test.ts`, `sign-out.test.ts`, `user-menu.test.tsx`.
- **5, the pricing teaser:** a price never breaks (`PricePop` nowrap: every edge of an inline-block digit was a wrap
  point) and the teaser's row is 4xl (Q1): one line inside its card at every width from 375 to 2560
  (`price-before.log`: Pro broke from 1280 and the Event Pass from 1366 too; `price-after.log`), `/pricing` unchanged
  (`price-pricing-after.log`), `teaser-1440.png`, `teaser-640.png`.
- **6, the lowercase bullet:** `<MaxEvents />`, `<EventPassTerm />` and `<InactivityMonths />` share one `phrase()`
  with `capitalized`; the free plan's first bullet reads "One event at a time." and two tables' cells sentence case
  (Q5), as served (`/help/what-the-free-plan-includes`, `/help/pro-vs-event-pass`, `/help/storage-plans-and-limits`);
  `spec-shared.test.ts` renders the bullet through MDX and holds every article's phrase inlines to it.
- **Assets requested from Will:** none.
- **Board ideas:** none beyond the lane.
- **Proposed migrations / Worker / Vercel / Stripe / env changes:** none.
- **Calls his to overrule:** Q1 the teaser's 4xl row; Q2 the refused sign-out's toast; Q3 the back label's 40vw cap;
  Q4 the portal's pages returning on the admin host alone; Q5 the tables' cells capitalized.
- **Look at first (the live walks, both aliases):** signed out, the admin alias's `/admin/reports` through the
  account chooser (partyr33l) and her second factor, landing on the reports (and `/admin/accounts/<uuid>`; the admin
  host's `/login?next=/dashboard` landing in the portal); the hub at 375 on the app alias, jumped into the band and
  a photo opened and closed in the viewer, the row settling once with true fades, and a phone on its side resting
  unstuck at the top; the claims review at 375 reading "Dashboard" whole; the home at 1440 with "from $9/mo" and "$24
  one-time" each on one line; "One event at a time." on the free plan's article. The refused sign-out needs GoTrue to
  fail, so its unit tests stand for it.
