---
track: crumbs-64
status: handed-off      # open -> handed-off; deleted in the merge commit that integrates it
cut: "ee0629d7"            # the launch-prep SHA the branch was cut from
board: none
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/components/marketing/sections/pricing/
  - src/components/app/pricing/
  - src/lib/billing/storage-guard
  - src/components/guest/reel/
  - src/app/admin/accounts/
  - src/lib/jobs/spend-watch
  - src/lib/constants/tiers
  - content/help/how-long-an-event-pass-lasts.mdx
  - src/app/(app)/account/page.tsx
  - src/app/llms.txt
  - src/app/llms-full.txt
  - docs/systems/billing-caps.md
  - docs/systems/admin-observability.md
  - docs/systems/reel.md
reads:                  # single-sources you depend on: never duplicate, never edit
  - CLAUDE.md
---

# lp/crumbs-64

**Goal.** Red-team 52's findings before milestone 36: the pricing matrix's row explainers readable by a finger (the MEDIUM), its three LOWs and its NITs.

## The brief

**The round's direction (Will, standing since round 13, carried by every lane):** never dev-tool-ish (the viewfinder's corners survive only as a focus mark, never a style, and so does nothing of their loading state); a host of 1 to about 10 events first, scaling to hundreds; "all work no play is a boring consumer product": delight where it costs nothing in clarity; nothing depends on a timeline (undated, morning-only and multi-day events all read well); "everything should feel as immediate/responsive/snappy, and anything taking longer should provide clear state feedback and potential interruptibility"; Partyreel runs with no AI managing it (every operator fix ships its `/admin` control); cost is designed like the architecture (every image and video action multiplies at scale). Production is the working version: a pick is the best of what was drawn, never a rule.

**Red-team 52** (build 52, `e8d11584`, Ladder A on `/pricing`, the plan sheet, the reel's tap): every number matched and the walks passed, with one MEDIUM, three LOWs and NITs. Its ledger is `../partyreel-wt/_scratch/redteam-52/ledger.txt` (read the MEDIUM, LOW and NIT lines whole; each names its file and line).
- **MEDIUM:** `/pricing`'s comparison matrix (`comparison-table.tsx`, `#compare`) opens its 17 dotted-underlined row explainers on a mouse's hover and a keyboard's focus, but never by a finger: a tap focuses the label and the trigger stays closed. The subhead tells readers to hover them, so Uploads and Deleted are unreadable on a phone. A tap must open one, and another tap or a tap outside close it, at 375 with touch, without breaking hover and keyboard. The subhead's words must hold for touch too. Then check the 375 tooltip's edge (a NIT: it sits too close to the screen's edge).
- **LOW, the plan sheet and a Pro size switch are blind to the uploads allowance:** each size's card names its storage and estimate but never its uploads a month (100 / 200 / 500 GB), and `checkPlanChange` (`src/lib/billing/storage-guard.ts`) checks storage only, so a downgrade below this month's uploads passes silently. Say each size's uploads on its card, and give a switch below this month's uploads its honest words. Never block what the webhook allows; the Stripe webhook stays the sole writer of the tier (`billing-caps.md`).
- **LOW, the reel at a desk:** a click aimed with a moving mouse hides the controls the move just raised (the move wakes the dock at +15 ms, the click toggles it away). A click within a beat of the move's wake must keep it up. The NIT beside it: a finger's press on Play or Pause wakes the dock on the pointer's 2.4 s rest instead of the finger's 4.2 s (`onTogglePlay` calls `wake()` with no touch flag).
- **LOW, `/admin/accounts`' Cap column** reads a null `storage_cap_bytes` as "Unlimited" for every account, Free included: say each account's real cap from its tier (`tier_limits`, `src/lib/constants/tiers.ts`).
- **NITs:**
  - the pass article's doubled phrase ("50 GB over its year of uploads for about a year", from `tiers.ts`' words, wherever it lands: the help and `llms.txt`);
  - `/account#plan`'s "paid once" where the sheet, the pricing page and its FAQ say "one payment, no subscription";
  - the plan sheet's first open, before `/api/stripe/plan-facts` answers, titled "Your Pro plan" with Switch on her own size (a quiet loading state until the facts land);
  - admin's Spend watch still calling the uploads meter "ingress" (`spend-watch.ts`).
- **And identity r4's finding:** the live reel dock's Style and Hold keys never show their open fill (`data-state="closed"` with `aria-expanded="true"` while the menu is open).
- Never touch Stripe objects or the TEST key; nothing here needs a migration (if one seems to, it is a question).

**Starts from.** CLAUDE.md's working loop, the bible's ten and production as it is; the tests say what has to keep
working.

**Verify on.** The gate on the synced tree (CLAUDE.md's four steps), each step on its own exit code; `pnpm lab:smoke --base http://localhost:<port>` when the lane changes anything under `src/` but tests (it crawls what the change reaches: the Library, and every board whose drawings import a changed file); and the surfaces the Handoff is judged on, local and live.

## Questions (a recommended answer each; the Orchestrator relays them)

Each is built as recommended and is Will's to overrule.

1. **Scope: the plan sheet's honest words need a fact the sheet does not have, so four files outside `owns` carry it.** A switch below this month's uploads cannot be told without this month's uploads, and nothing the app reads holds them (`uploads_used` is granted to the service role alone; the ledger is deny-all to clients). Recommended, and built: `PlanFacts.monthUploadedBytes` (optional; `src/lib/billing/plan-facts.ts`), read by the plan-facts route (`src/app/api/stripe/plan-facts/route.ts` + its test) through a new `src/lib/db/queries/month-uploads.ts` (+ test) on the admin client with the id `getUser()` proved; a failed read is said aloud and answered null, so the sheet omits one sentence and never fails. No migration, and no route's check changes (the webhook allows the switch; nothing blocks it). They sit in their own commit, `ae7d69783`, with the one line outside `owns` the pass NIT needed: `/llms.txt`'s words live in `src/lib/content/llms.ts` (+ its test), which my two route prefixes only serve. Read-only against the real database: the RT44 host reads 114,917,094 for 'pro' and 'free' alike, an unknown host 0, and the anon role is refused 42501.
2. **The words for a switch below this month's uploads.** Recommended, and built, on the size's own card and never a block or a confirm: "You've uploaded 150 GB this month. At 100 GB a month, new uploads, yours and your guests', would pause until November 1." (the allowance counts the UTC calendar month; the date is the first of the next, hours either side of a host's own clock; it names the month the facts were read in, never the month a long-lived page loaded in). It shows only where a Switch is offered and the allowance really changes (never on her own size at the other billing, never on a size too small for what she stores). A pass holder moving to Pro reads it on the Pro card she is offered. Left out: switching from `/pricing`'s hop (the checkout button's `already_subscribed` re-post carries no such line; Deferred), and the sheet's one-line Event Pass door ("$29 for 25 GB") keeps its one line without the pass's 50 GB over its year: the matrix and the help carry it.
3. **A tap on a matrix row name opens its fine print; a second tap, a tap outside, a scroll, Escape or a tap on the words puts it away.** Built as the glyph count's own press model (a finger toggles, a key toggles, a cursor's click keeps the words open and, new, no longer blinks them shut at the press). The tooltip primitive is untouched (`ui/` is another lane's; its "a tap never opens a tooltip" scar stands for icon controls), so the matrix's row label is its own small client atom (`row-tip.tsx`). The subhead reads "Hover or tap a row name for the fine print in plain words.", the words keep a 16 px gutter (`collisionPadding`), and the label's finger target reaches past its text.
4. **The reel's "beat" is 600 ms**: the dock's grow takes 280 ms (`live-reel.css`) and a person needs about 250 ms more to answer a change on screen, so a click that lands before then was aimed with the move that raised the dock, never a decision about it. Only a pointer's click is held (a finger's tap and a key's press never are), only the move that raised the dock from rest starts one, and the held click restarts the pointer's 2.4 s rest.
5. **The plan sheet's first open for a Pro host is quiet until her plan is known**: her three sizes draw with a placeholder where Switch will stand and no "Your plan" mark, until the read lands, fails, or has not answered in 6 s (`READ_PATIENCE_MS`); then the old list with its Switches (change-plan re-checks everything). Free and pass hosts keep the door's first paint. A second open reuses the facts and is never quiet.
6. **`/admin/accounts`' Cap column reads `effectiveStorageCap`, the one function the over-capacity sweep and the account's own page read**: a Free or pass profile's null is its tier's cap and the row's over-tint follows it; only a Pro with no cap on record reads "Unlimited", as the account's page says it.
7. **The pass article and `/llms.txt` say the pass's year once**: the term leads ("for about a year from the purchase") and the allowance's "over its year" refers back to it, so `tiers.ts`' words (`uploadsLabel`) stay the single source and no bare-bytes component was needed (`spec-shared.tsx` is the Orchestrator's).

## System-doc edits (in place, owned facts only)

- `docs/systems/billing-caps.md`: a Free or pass profile's null cap is its tier's (`effectiveStorageCap`, the operator's list included); a smaller Pro size's smaller uploads allowance is words, never a refusal (`uploadsPauseNote`, `monthUploadedBytes`); the Pro list names each size's uploads and is quiet until her plan is read.
- `docs/systems/reel.md`: a pointer's click within 600 ms of the move that raised the dock keeps it up (`AIMED_CLICK_MS`); a menu key's open fill reads `aria-expanded`, since the tooltip around its trigger overrides `data-state`.
- `docs/systems/admin-observability.md`: unchanged (its Spend watch lines already say "uploads meter"; the Accounts list's cap rule has one home, billing-caps.md).

## Deferred (ROADMAP one-liners, bucket named)

- Now: a Pro host's switch from `/pricing`'s hop (the checkout button's `already_subscribed` re-post to change-plan) carries no uploads sentence (`uploadsPauseNote`); the change-plan route could answer a notice the hop shows before it redirects.
- Now: nowhere in the app says a host's uploads this month against her plan's allowance (Free's 300 MB a month is stated nowhere in-app; the admin side is the line above in ROADMAP); the storage ring's popover or the Plan card could say it beside the plan's number.
- Now: one press model for taps on words: the code's corner mark (`event-code-door.tsx`), `ui/glyph-count.tsx` and the pricing matrix's `RowTip` each carry the same tap-toggles / cursor-keeps / key-toggles logic beside a primitive that refuses a finger; promote one `TapTooltip` into `ui/tooltip.tsx` (graphite-wiring owns `ui/`) and refine design-system.md's "A tap never opens a tooltip" with it.

## Handoff (replaces the chat report)

- **Commits, pushed to `origin/lp/crumbs-64`:** `ae7d69783` (the facts' plumbing and `/llms.txt`'s line, the only paths outside `owns`), `685ad1098` (the lane's own work), `d9129f92b` (the quiet state's patience), then this manifest alone. `launch-prep` had not moved since the cut (`00ad38e31`): no sync commit.
- **Gates on `d9129f92b`, each on its own exit code** (logs in `../partyreel-wt/_scratch/crumbs-64/g-*.log`): typecheck 0; lint 0; test 0 (893 files, 10,806 tests); `zsh scripts/build-lock.sh pnpm build` 0; `pnpm lab:smoke --base http://localhost:3131` 0 (168 checks, 0 failing; scope: create-wizard, drive-export, event-header, host-dashboard, identity, the-wait, the Library, because they import `tiers.ts`, `storage-guard.ts` or `plan-card.tsx`). The smoke's PREMISE line: drive-export's nine open asks describe `src/app/(app)/account/page.tsx`, which this lane touched (the pass line's words only): re-read them before his next sitting.
- **Lane check** (`git diff --name-only origin/launch-prep...HEAD`) = owned paths + this file, except these, each listed with why (Question 1): `src/lib/billing/plan-facts.ts`, `src/app/api/stripe/plan-facts/route.ts` and `route.test.ts`, `src/lib/db/queries/month-uploads.ts` and `month-uploads.test.ts` (the one extra fact the sheet's honest words need), `src/lib/content/llms.ts` and `llms.test.ts` (the one home of `/llms.txt`'s words).
- **The items, one line each** (the behavioural fixes were each mutation-checked: the fix removed once, its test went red):
  - MEDIUM, the matrix by a finger: `src/components/marketing/sections/pricing/row-tip.tsx` (+ `row-tip.test.tsx`, 10 cases). Driven with REAL touch events (`Input.dispatchTouchEvent`, 375x812, `(hover: hover)` false) in my own headless Chrome against my dev server: 17/17 row labels open on a tap, a second tap, a tap outside, a scroll and a tap on the words close them, one at a time, the words' left edge at x 16 (the 375 NIT: it was 0), 0 console errors or warnings, no hydration mismatch, `scrollWidth` 375 (shot: `_scratch/crumbs-64/shots/matrix-375-uploads-open.png`). At 1440 a real mouse's hover opens, its click keeps the same node (no blink), Tab opens and Escape closes.
  - LOW, the plan sheet: `uploadsPhrase` (`tiers.ts`), `uploadsPauseNote` and `nextMonthStart` (`storage-guard.ts`), the cards' uploads line and the pause sentence (`plan-card.tsx`, `pro-price-list.tsx`, `pricing-sheet.tsx`). Seen in a real browser through a scratch harness (deleted, never committed) at 375 and 1440: a Pro 1 TB host with 150 GB uploaded reads the sentence on Pro 50 GB only, with its Switch still pressable; a pass holder with 120 GB reads it on the offered Pro card; the Library's composition draws the three uploads lines.
  - NIT, the first open: a Pro host's sizes draw quiet (placeholders, no Switch, no "Your plan", `aria-busy`) until the read lands, fails or passes 6 s (`use-plan-facts.ts`, `READ_PATIENCE_MS`); seen at 375 with the read held 1.8 s.
  - LOW + NIT, the reel (`live-reel-view.tsx`, 10 new cases in `live-reel-view.test.tsx`), driven on the local demo album with a real mouse and real touch: a click 150 ms after the move that raised the dock keeps it up and it rests 2431 ms after the CLICK (red-team 52 saw it fold at +216..257 ms); a click 900 ms after the move still folds; a still mouse's click shows and the next hides; a finger's Play rests 4213 ms later (it was 2.46 s). The Style and Hold keys' open fill: computed background `oklab(... / 0.18)` while `aria-expanded="true"` and `data-state="closed"` (shot: `shots/reel-style-open.png`). One existing test was reshaped on purpose (its second press followed the movement in the same instant, which is the aimed click now), its scar kept and said in its comment.
  - LOW, `/admin/accounts`: `cap.ts` (+ `cap.test.ts`, `page.test.tsx` rendering the real page: a Free account over 100 MB reads "100 MB" with the warning tone, a pass "25 GB", only an unwritten Pro "Unlimited"); the account's own page reads the same label. Not driven live (the admin portal needs its AAL2 session): the page test is the proof here.
  - NITs: the pass article reads "one more event slot for about a year from the purchase, with 25 GB of storage and an uploads allowance of 50 GB over its year" and `/llms.txt` the same shape (checked on the dev server's rendered text; `llms.test.ts` pins it); `/account#plan` says "one event, one payment, no subscription"; the Spend watch says "uploads meter" (`spend-watch.test.ts` pins it).
- **Assets requested from Will:** none.
- **Board ideas:** a host-facing uploads meter beside the storage one (this month's used against the plan's number: Deferred); the identity lab's account view (`sandbox/identity/views/account.tsx:135`) mirrors the account page's old "covers one event, paid once", for identity's wiring to carry.
- **Proposed migrations / Worker / Vercel / Stripe / env changes:** none. (No Stripe object or key touched; `uploads_used` is read through the existing service-role grant.)
- **Calls his to overrule, one line each:** the sentence's words and "until November 1" (Q2); the 600 ms beat (Q4); the 6 s patience and a placeholder rather than a spinner (Q5); "Hover or tap" (Q3); the pass door's line left without its uploads (Q2); an unwritten Pro still reads "Unlimited" on the operator's list (Q6).
- **Look at first:** the real signed-in plan sheet on the alias (a Pro host's first open, and a Pro 1 TB host with a month past 100 GB, which no test account can reach: the red-team has to seed or read the sentence off the code); `/pricing#compare` on a phone; the reel at a desk (move onto the picture and click); `/admin/accounts` (the RT44 Free host should now read 100 MB with the warning tone).
