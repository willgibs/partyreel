---
track: pricing-doors
status: handed-off      # open -> handed-off; deleted in the merge commit that integrates it
cut: "4c11a0ad"            # the launch-prep SHA the branch was cut from
board: none
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/lib/auth/return-path
  - src/components/app/checkout-button
  - src/components/app/manage-billing-button
  - src/components/app/pricing/
  - src/app/(dev)/design/(shell)/library/compositions/pricing-demos.tsx
  - src/app/(app)/account/page.tsx
  - src/components/app/dashboard/storage-meter.tsx
  - src/app/(marketing)/(cinema)/pricing/
reads:                  # single-sources you depend on: never duplicate, never edit
  - src/app/api/stripe/checkout/route.ts
  - src/components/ui/popup-back.ts
  - src/components/ui/popup-kinds.ts
  - src/components/ui/popup.tsx
  - docs/systems/billing-caps.md
---

# lp/pricing-doors

**Goal.** The doors to Stripe and back: a signed-out Get Pro returns to /pricing after sign-in, Back from Stripe is one press, and checkout and manage-billing go through PricingDoors' verbs.

## The brief

**The round's direction (Will, standing since round 13, carried by every lane):** never dev-tool-ish; a host of 1 to about 10 events first, scaling to hundreds; "all work no play is a boring consumer product": delight where it costs nothing in clarity; nothing depends on a timeline; "everything should feel as immediate/responsive/snappy, and anything taking longer should provide clear state feedback and potential interruptibility"; Partyreel runs with no AI managing it (every operator fix ships its `/admin` control, zero silent failures); cost is designed like the architecture. Production is the working version: a pick is the best of what was drawn, never a rule.

**Local only:** nothing of yours requests the Vercel alias, partyreel.com or any *.vercel.app, and nothing deploys. Port 3136 is yours; 3000 is Will's desk. Stripe is TEST mode: a checkout you open is never paid; the alias's Ladder walk stays Will's.

From ROADMAP "Now" (provenance in git). Each fix pinned by a test that fails on the old code:
1. **A signed-out Get Pro on `/pricing` lands on the dashboard after sign-in**, since the return allow-list (`APP_RETURNS`, `src/lib/auth/return-path.ts`) holds only app pages: return her to `/pricing` (with whatever mark reopens her Get Pro), keeping every open-redirect refusal (a foreign host, a protocol-relative path, an encoded slash, each a test). The pricing page changes only its plumbing; nothing visible moves there.
2. **On a phone, leaving the plan sheet for Stripe by `window.location.href` (Checkout, change-plan, the portal) leaves the sheet's same-URL entry behind, so Back from Stripe takes two presses:** leave without that entry (taking it first as `popup-back.ts` does, or replacing it), so one Back returns to the page.
3. **`checkout-button.tsx` and `manage-billing-button.tsx` fetch inline:** move both behind `PricingDoors`' verbs (`components/app/pricing/pricing-doors.tsx`) and delete the Library's two stand-in buttons (`library/compositions/pricing-demos.tsx`).

Wiring rigor: the whole gate; each door walked on your port signed out and in (the chooser, `willg97@gmail.com`), up to Stripe's TEST page and Back, at 375 and 1440.

**Starts from.** CLAUDE.md's working loop, the bible's ten and production as it is; the tests say what has to keep
working.

**Verify on.** The gate on the synced tree (CLAUDE.md's four steps), each step on its own exit code; `pnpm lab:smoke --base http://localhost:<port>` when the lane changes anything under `src/` but tests (it crawls what the change reaches: the Library, and every board whose drawings import a changed file); and the surfaces the Handoff is judged on, local and live.

## Questions (a recommended answer each; the Orchestrator relays them)

Each is built as its recommended answer, Will's to overrule.

- **Does the plan she pressed ride back with her after the sign-in?** Recommended and built: no. A signed-out Get Pro returns her to `/pricing`, the bare path (`APP_RETURNS`' one new shape, `/^\/pricing$/`), and she presses Get Pro again: the page opens on its plan pair, one press from where she was. The brief allowed "whatever mark reopens her Get Pro", and none is built: a mark in the URL is what the allow-list's rule (a path, never a query) exists to refuse, since a link could then start a purchase flow on arrival; what a mark would restore (the Pro card's size slider, the configurator's answer) lives in `components/marketing/sections/pricing/`, outside this lane; and the cheapest mark that is not a URL (the press kept in `sessionStorage`, claimed once by the page, with a time-to-live) still opens a checkout on arrival, which is a product call, so it is a Deferred line. Overrule: resume the checkout after the sign-in.
- **How does Back from Stripe become one press on a phone?** Recommended and built: the way out REPLACES the sheet's own history entry (`pricing/leave.ts`), never takes it first. Replacing keeps the sheet and its "Starting…" on screen until Stripe's page takes over; going Back first closes the sheet before the browser has started to leave, so the page sits under a dead button for as long as Stripe takes to answer. It replaces only while the sheet is open as a place (read off the sheet's own attributes, never the popup's history marker, which a router commit strips, as the size list stacked over the sheet does with each deletion): replacing the page's own entry would land Back on the page before it. Overrule: take the entry first, and say the wait another way (a toast).
- **Is the button held busy after it has assigned Stripe's address?** Recommended and built: no, as before. Checkout, Manage billing and Switch re-enable the moment the address is assigned, so a second tap while Stripe's page loads opens a second session. Holding "Starting…" until `pagehide` is a behaviour change beside the brief, and the Library's `leave` (which stays) would need to say it stayed: a Deferred line.

## System-doc edits (in place, owned facts only)

- `docs/systems/billing-caps.md` ("The in-app pricing surface"): the `PricingDoors` bullet now says every door is a verb (Checkout, the portal, change-plan, the way out `leave`) and the buttons are the app's own, which replaces its stale sentence that the two buttons "still fetch inline ... swapped as components"; and one new ★ bullet, leaving for Stripe from a phone's sheet (the entry it replaces, when it must not, the reload from the cache). The doc is in this manifest's `reads` and `billing-integrity` owns it: both edits sit in the doors' paragraph, a hunk its webhook and locking lines do not touch.

## Deferred (ROADMAP one-liners, bucket named)

- Now > Billing: the storage list's goal strip (`storage/storage-list-body.tsx`, `window.location.assign`) leaves for Stripe past `PricingDoors`' `leave`, so on a phone it still leaves over the list's own history entry (and the plan sheet's, when the list was opened from the sheet); `leave` takes the top entry only, so routing the strip through it also means taking every popup entry under the list.
- Now > Billing: Checkout, Manage billing and Switch re-enable the moment Stripe's address is assigned, so a second tap while Stripe's page loads opens a second session; hold "Starting…" until `pagehide`, and read `pageshow` from the cache (the Library's `leave` would answer that it stayed).
- Now > Marketing: a signed-out Get Pro comes back to `/pricing` as it opens, so the plan she pressed (the Pro card's slider, the configurator's answer) is lost; carry it in `sessionStorage` (never the URL) with a time-to-live and let the page resume that checkout once (a product call: it opens a checkout on arrival).
- Now > Billing (Will's hand): TEST's change-plan portal configuration `bpc_1UIhooPtjqmVkBwkcLe9YgYN` lists the six RETIRED prices (three old products), so every change-plan in TEST (a Switch, and a Pro host's Get Pro on `/pricing`) fails with a 500 and "Couldn't change your plan"; update its `features.subscription_update.products` to the current three products' six prices (`PRICING.md` "The Billing Portal": an API job).
- Now > Admin: the change-plan route has no health signal for that gap (a configuration that lacks a current price is a Sentry error and a generic toast); an `/admin` check that the tagged configuration lists every price `tiers.ts` sells would have caught it.

## Handoff (replaces the chat report)

- **Commits, pushed on `lp/pricing-doors`:** `6087e30de` the three items, their tests and the billing-caps.md edit; `d9cf85772` the way out reads the plans' sheet's own attributes instead of the popup's history marker (the marker is blind after a router commit, and importing it put the popup's history code into /pricing's JS: the first build's chunks for the page held `prPopup`, `useOwnedEntry` and `deskFocus`, the final build's hold none of them and the page's chunks weigh 152.1 KB gzipped against 153.5), with its parity test; then this manifest alone. launch-prep moved since the cut by two pickup records only (`077f24d89`, `43367ee17`, `docs/tracks/orchestrator.md`), none in my `reads`, so no sync commit.
- **Gates on `d9cf85772`, each on its own exit code** (logs in `/Users/gibby/local/ai/partyreel-wt/_scratch/pricing-doors/`; the manifest commit after it changes no code): `zsh scripts/build-lock.sh pnpm typecheck` 0 (`typecheck2.log`); `pnpm lint` 0 (`lint3.log`); `zsh scripts/build-lock.sh pnpm test` 1 failed of 12,321 tests, 990 of 991 files (`test-full2.log`), the known failure below; `NEXT_PUBLIC_SITE_URL=http://localhost:3000 zsh scripts/build-lock.sh pnpm build` 0 (`build2.log`; `/pricing` stays static); `pnpm lab:smoke --base http://localhost:3136 --production` 0, 181 checks (`lab-smoke2.log`, the key from `DESIGN_PREVIEW_KEY`, kept out of the log); `pnpm lab:demo --base http://localhost:3136` 0, 15 steps, 0 failing, "Every step draws its options" (`lab-demo2.log`: the boards the change reached, customize, event-header, host-dashboard and identity, which import `checkout-button.tsx`). On the first work commit `6087e30de` the same gate read typecheck 0, lint 0, tests 1 failed of 12,309 (the same one), build 0, smoke 175 checks and demo 15 steps, 0 failing (`typecheck.log`, `lint.log`, `test-full.log`, `build.log`, `lab-smoke.log`, `lab-demo.log`).
- **KNOWN AND PRE-EXISTING, not this lane's:** `pnpm test` in a worktree fails `src/lib/track-manifests.test.ts > drive-fixes.md is well-formed`: that manifest's `reads` name scratch paths (`../partyreel-wt/_scratch/drive-walk/ledger.txt` and `.../drive-wiring/wrangler-dev.log`) that resolve only from the primary checkout. The Orchestrator told this lane so mid-run: the drive-fixes lane is dropping those reads, and the merge gate runs from the primary checkout, where the test passes. The other 12,320 tests pass.
- **Lane check:** `git diff --name-only origin/launch-prep...HEAD` is every file under an `owns` prefix, this manifest, and three exceptions: `docs/systems/billing-caps.md` (System-doc edits above; it is in this manifest's `reads` and `billing-integrity` owns it, so a merge may need its hunk beside theirs: mine is the doors' paragraph and one new bullet under it); `src/lib/bare-login-policy.test.ts` (one comment line: it named the pricing page as the page with no return, which is no longer true); `src/app/(dev)/design/(shell)/library/compositions/pricing-demos.test.tsx` (one comment: stale once the Library's doors became verbs; no assertion changed, the test passes as it stood).

  ```
  docs/systems/billing-caps.md
  docs/tracks/pricing-doors.md
  src/app/(dev)/design/(shell)/library/compositions/pricing-demos.test.tsx
  src/app/(dev)/design/(shell)/library/compositions/pricing-demos.tsx
  src/components/app/checkout-button.tsx
  src/components/app/manage-billing-button.test.tsx
  src/components/app/manage-billing-button.tsx
  src/components/app/pricing/change-plan-button.test.tsx
  src/components/app/pricing/change-plan-button.tsx
  src/components/app/pricing/checkout-button.test.tsx
  src/components/app/pricing/checkout-request.test.ts
  src/components/app/pricing/checkout-request.ts
  src/components/app/pricing/leave.test.tsx
  src/components/app/pricing/leave.ts
  src/components/app/pricing/portal-request.test.ts
  src/components/app/pricing/portal-request.ts
  src/components/app/pricing/pricing-doors.test.tsx
  src/components/app/pricing/pricing-doors.tsx
  src/components/app/pricing/pricing-sheet.back.test.tsx
  src/components/app/pricing/pricing-sheet.tsx
  src/lib/auth/return-path.test.ts
  src/lib/auth/return-path.ts
  src/lib/bare-login-policy.test.ts
  ```
- **The items:**
  1. **A signed-out Get Pro returns to `/pricing`:** `src/lib/auth/return-path.ts` adds `/^\/pricing$/` to `APP_RETURNS` (a path, never a query or a fragment; the admin host still refuses it). Pinned by `return-path.test.ts` (four of its tests fail on the old list: the page accepted as itself, its round trip through a query, the sign-in's landing and its fragment dropped; and eighteen look-alikes are pinned refused whole: a trailing slash, a longer word, a query, a nested next, a fragment, `//host`, an absolute URL, an encoded slash and letter, traversals, a backslash, whitespace, a splice) and by `checkout-button.test.tsx` ("brings the pricing page's visitor back to the pricing page", which fails on the old code). The pricing page's own file is untouched: nothing visible moved there.
  2. **Back from Stripe is one press on a phone:** `src/components/app/pricing/leave.ts`, the doors' `leave`, replaces the sheet's own history entry while the sheet is open as a place, and pushes everywhere else; a replace asks for one reload if the browser restores the page from its back/forward cache. Pinned by `pricing-sheet.back.test.tsx` (the real sheet, popup and buttons over Next's history stand-in: Get Pro, Manage billing and a Switch at a phone, at a phone after a router refresh stripped the marker, and at a desk; six of its seven tests fail on the plain `href`, which I ran against the final `leave.ts`) and `leave.test.tsx` (each input, the reload from the cache, and the place shapes held to `isPlaceShape` over every shape).
  3. **Checkout and the portal go through `PricingDoors`' verbs:** `checkout-request.ts` and `portal-request.ts` (each route's one client, answering outcomes and never rejecting, 14 tests); `PricingDoors` takes `startCheckout`, `openPortal` and `leave` beside `changePlan` and `readFacts`; `CheckoutButton`, `ManageBillingButton` and `ChangePlanButton` press them (`pricing-doors.test.tsx` pins both halves with the real buttons). The Library's two stand-in buttons and `useInertPress` are deleted: its doors answer after a round trip with an address that cannot be followed, and its `leave` says it stops there (`/design/library/pricing-sheet`, the phone frame: Get Pro is "Starting…" and disabled, then the note, then at rest; no request).
- **ROADMAP lines this lane ships (the Orchestrator deletes them at the merge):** "Code hygiene: `src/components/app/checkout-button.tsx` and `manage-billing-button.tsx` fetch inline ...", "Billing: on a phone, leaving the plan sheet for Stripe by `window.location.href` ..." and "Auth: a signed-out Get Pro on `/pricing` lands on the dashboard after sign-in ..."; the Deferred section above adds its own five.
- **The walk** (`walk-ledger.txt`, beside the logs; `walk-signed-out.mjs`, `walk-google-start.mjs`, `walk-back-hydration.mjs` and `cdp.mjs` are the headless drivers, each in a Chrome of its own with a fresh profile, closed after): signed out at 375 (mobile emulation) and 1440, Get Pro lands on `/login?next=%2Fpricing`, and the login page's Google start carries `redirect_to=http://localhost:3000/auth/callback?next=%2Fpricing`; signed in as willg97 (the pane's Google session answered with no chooser step), `/login?next=%2Fpricing` redirects to `/pricing`; the portal from a button on a page pushes (history 5 to 6) and Back is one press, at 375 and 1440; from the phone's sheet it REPLACES: history 6 to 6 and 2 to 2 on the dev server, and on the production build of the final code (`next start -p 3136`) 10 to 10 with the popup's marker and 12 to 12 with it stripped by hand the way a router commit strips it, the Navigation API's same-origin entries reading `0:/account, 1:/account` with the sheet open and `0:/account` alone after one Back, marker null, sheet closed. The same press on the desk build at :3000 (the old code) measured 6 to 7, Back landing on `/account` carrying the stranded `prPopup-1`, and Back again on `/account`: the two presses.
- **Found beside the lane, urgent for the alias's Ladder walk:** TEST's change-plan portal configuration `bpc_1UIhooPtjqmVkBwkcLe9YgYN` (tagged `change_plan`) lists the six RETIRED prices (three old products) and none of the current Pro 50, 200 and 1 TB, so `POST /api/stripe/change-plan` answers 500 for every target ("...does not include the price in its `features[subscription_update][products]`"; read back with `GET /v1/billing_portal/configurations/<id>?expand[]=features.subscription_update.products`, TEST, livemode false) and a Pro host's Switch, and her Get Pro on `/pricing` (the hop), end in "Couldn't change your plan". The Switch's redirect is therefore walked by test only. Not this lane's to change (a Stripe write); the fix is in Proposed changes below.
- **Not walked, or not understood:** a Checkout session for a Free host (the pane's Google session is willg97 alone, a Pro host, so Get Pro hops to change-plan or refuses; the redirect is pinned by `checkout-request.test.ts` and `checkout-button.test.tsx`); the Google callback landing back on `/pricing` (Supabase allows the one localhost origin, :3000, whose desk build still has the old list, where the same sign-in landed on `/dashboard`: the bug, measured on the build that has it); the back/forward cache path after a replace (`leave.test.tsx` only: no page in the pane or in my headless runs was restored from it after one); one dev-server run of the final code read the history length 7 before the press and 6 at Stripe, which I could not explain, whose Back landed on the page as the others did, and which the production runs above (read through the Navigation API) did not repeat. In the Browser pane a page restored by Back, and sometimes a freshly loaded one, in more than one tab, stayed unhydrated for as long as I watched (the desk build at :3000 did it too after the old code's push, so it is not read as this lane's), while a Chrome of my own hydrated after Back on `/login` and `/pricing` with and without the cache.
- **Assets requested from Will:** none.
- **Board ideas:** (1) an `/admin` health check that the tagged change-plan configuration lists every price `tiers.ts` sells, the signal whose absence this lane met; (2) resume the checkout after the sign-in (Question 1); (3) the storage list's goal strip through the doors (Deferred).
- **Proposed migrations / Worker / Vercel / Stripe / env changes:** Stripe, TEST now and LIVE at the cutover (`PRICING.md` "The Billing Portal"): update `features.subscription_update.products` of the tagged change-plan configuration to the current three products and their six prices (an API job: `POST /v1/billing_portal/configurations/bpc_1UIhooPtjqmVkBwkcLe9YgYN`); nothing else: no migration, Worker, Vercel or env change.
- **Calls his to overrule:** the three Questions (no mark; replace, never take first; no busy hold); the Library says it stops at `leave` (the stand-in buttons are gone, per the brief); `leave.ts` names the place shapes by value and a test holds them to `isPlaceShape`, so `back-layers` (it owns `ui/popup*`) changing which shapes hold an entry fails `leave.test.tsx` at the merge and the fix is that one list; `/pricing` is now also an acceptable landing for Drive's connect (`lib/drive/oauth-cookie.ts` validates its return with `signInReturn`), which nothing sends.
- **Look at first:** at 375 signed in, `/account`, Change plan, Manage billing, Stripe's TEST page, Back once (the page, the sheet closed) and once more (the page before it), against the desk build at :3000 for the two presses; signed out, `/pricing`, Get Pro, the URL; then the Stripe configuration above before any Switch is walked on the alias.
