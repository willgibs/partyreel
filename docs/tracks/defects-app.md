---
track: defects-app
status: handed-off      # open -> handed-off; deleted in the merge commit that integrates it
cut: "da64829f"            # the launch-prep SHA the branch was cut from
board: none
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/lib/dashboard/
  - src/lib/events/
  - src/components/guest/
  - src/components/shared/
  - src/components/app/
  - src/components/auth/
  - src/app/(app)/
  - src/app/(print)/
  - src/app/(guest)/
reads:                  # single-sources you depend on: never duplicate, never edit
  - docs/ROADMAP.md
  - docs/systems/host-app.md
  - docs/systems/guest-flow.md
  - src/lib/constants/tiers.ts
---

# lp/defects-app

**Goal.** The app's defects the ROADMAP names are fixed at their source: the storage step's exit to /pricing, the album skeleton's tile size, the masonry gap read, the claimed slug shown on a path with no route, the two confirm paths that never save the event, and the app's word for the bin.

## The brief

**Why now:** these are open ROADMAP "Now" lines that state a defect against a rule already on record (the bible, the identity model, the shipped product), not a product decision. Each line is quoted below with its file references; check every one against the code before you change anything (a line can be stale), fix it at its source, and list in the Handoff the exact ROADMAP line each fix closes so the Orchestrator retires it. Where a fix would need a product or copy decision the line does not make, take the recommended answer given here, build it, and list it as his to overrule; never invent a decision the brief does not give. Everything is unprotected (Rising Tides), but this lane fixes defects: it does not redesign.

**The lines (from `docs/ROADMAP.md`'s Now list):**
1. The dashboard's storage step leaves the app for `/pricing` (`src/lib/dashboard/next-step.ts:139`) instead of the in-app plan sheet (every other pricing door in the app opens the sheet; the marketing page is a click away inside it); `gated-sites.test.ts` does not cover it: route it to the sheet and cover it.
2. The guest album's skeleton takes no tile size (`src/components/guest/event-experience.tsx:1005-1010`), so it lays 8 columns at 1920 before the album lands at 7: the skeleton reads the same tile size the album uses.
3. Check `src/components/shared/masonry.tsx:363`: it reads `--gap-gallery` unresolved (`max(3px, 4px)`), so the JS column count may parse no gap. Confirm it in a browser at 375 and 1440 before fixing; if it is real, resolve the computed value.
4. The hub link row, the code mini-modal and the print sheet DISPLAY a claimed slug as `<site>/<slug>`, a path with no route (they copy and encode the permanent link); build the displayed link with the uncalled `preferredEventUrl` (`src/lib/events/share-urls.ts`; `dashboard/[eventId]/page.tsx:123`, `(print)/dashboard/[eventId]/print/page.tsx:59`), so what a host reads is what works.
5. Confirming from the Unverified mark (`unverified-mark.tsx`) or the guest name menu (`guest-name-menu.tsx`) claims the uploads but never saves the event, so it lands in the account (Events you joined) and not on the dashboard, unlike the offer card's door (`SaveEventButton`): save it on those two paths too.
6. The bin's word in the app's own strings: the delete-event dialog says "It moves to Trash" (`danger-zone-section.tsx:78`), the create wizard "the bin" (`create-event-wizard.tsx`): use "Deleted", the app's filters' and emails' word. The marketing and help copy is `defects-copy`'s.

Verify each fix in a browser at 375 and 1440 where it is visible (local first; the sign-in-gated ones on what you can reach locally, and say which you could not).

**Binds.** The bible and the policies (`/design/library`), the contracts of every component under a path you own, and
CLAUDE.md's working loop. `DESIGN_PREVIEW_KEY` rides the environment, never a command line or a log you print. A record doc
(`docs/STATUS.md`, `docs/ROADMAP.md`, `docs/PROGRAM.md`, `CLAUDE.md`, `docs/ASSETS.md`, `docs/tracks/orchestrator.md`,
`docs/reviews/`) is edited only when your `owns` names it. Stage explicitly; never `--no-verify` or force-push; every commit ends
with the `Co-Authored-By` line naming the model you actually run on.

**Verify on.** The gate on the synced tree, each step on its own exit code: `pnpm design:rules`, `node "src/app/(dev)/design/gallery/collect-specimens.mjs"`, `pnpm typecheck`, `pnpm lint`, `pnpm test`, `pnpm build`, `pnpm lab:smoke --base http://localhost:<port>`; the surfaces the Handoff is judged on, local at 1440 and 375.

## Questions (a recommended answer each; the Orchestrator relays them)

- The name menu's **Sign in** row claims the guest's uploads but does not save the event: its wear promises only that
  "the photos you added here join everything else you have added", which the claim already does, and the brief names
  the confirm path. Should signing in from an album a guest added to keep the event too? Recommended: yes (one
  `saveEvent` call on that path, and the `signin` wear's reason line saying the event stays in their account), since a
  guest signing in there is keeping the album; it changes a promise's words, so it is his.

## System-doc edits (in place, owned facts only)

- None made: `docs/systems/host-app.md` and `docs/systems/guest-flow.md` are this lane's `reads`. Four sentences there
  are now false or incomplete, the Orchestrator's to refine:
  - host-app.md "Custom event link (slug)", its last sentence ("The hub's link row, the code mini-modal and the print
    sheet nevertheless DISPLAY a claimed slug as `<site>/<slug>`..."): they now SHOW `<site>/e/<slug>` through
    `preferredEventUrl`; what they copy and encode is still the permanent link.
  - guest-flow.md "Masonry gallery": "220px where no ancestor sets it, as in the skeleton" is stale: the skeleton lays
    out on the album's own tile size (`GallerySkeleton`'s `tileSize`, the page's resolved `pr_tile_size`). A ★ worth
    stating there: the JS column count reads the box's resolved `column-gap`, never the `--gap-gallery` token (a custom
    property computes to its `max()` text, which parsed as no gap).
  - guest-flow.md, the capture flow (the offer-card paragraphs): the Unverified mark's door and the header name menu's
    Confirm your email now claim THEN save the event, as the offer card does (`lib/events/save-event.ts`); every such
    door writes `pr_pending_save_<eventId>` when it opens, and `CompletePendingSave` (mounted by `EventExperience`)
    finishes the save after a Google or magic-link return.
  - guest-flow.md, "the slot consumes and deletes it on the next mount, so in-page and full-reload returns land the SAME
    beat": false for the full-reload return (the Deferred line below).

## Deferred (ROADMAP one-liners, bucket named)

- Now (Guest): the follow moment never plays after a Google or magic-link confirm: `ClaimHandlePrompt` consumes
  `pr_pending_offer_<qr_token>` only inside the post-upload slot, which needs an upload this visit (`guest-upload.tsx`'s
  `doneCount > 0`), so a full-reload return shows nothing until the guest's next upload, against guest-flow.md's "same
  beat" (the SAVE that return owes now lands: `CompletePendingSave`).
- Now (Code hygiene, with the unmounted-components line): `dashboard/trash-section.tsx` has no importer and its empty
  state still says "Nothing in your trash."; it retires with the others.

## Handoff (replaces the chat report)

- **Commits:** work `f1c79839`; `origin/launch-prep` moved during the lane (guests-grant-tidy merged at `39aa374b`, the
  record `647b781c`; no file in common), merged in at sync `41b0fad4`. Both pushed; the head is in the chat line.
- **Gates on the synced tree (`41b0fad4`), each on its own exit code** (logs in the lane's scratch `synced/`):
  `pnpm design:rules` 0 (regenerated, no drift: 0 changed files after it and the collector) ·
  `node "src/app/(dev)/design/gallery/collect-specimens.mjs"` 0 · `pnpm typecheck` 0 · `pnpm lint` 0 (9 warnings, all
  pre-existing, none in a file this lane touched) · `pnpm test` 0 (352 files, 3876 passed, 1 skipped) · `pnpm build` 0 ·
  `pnpm lab:smoke --base http://localhost:3134` 0 (483 checks, 0 failing; a dummy key in the environment). No
  `lab:demo`: the lane has no board.
- **Lane check** (`git diff --name-only origin/launch-prep...HEAD`): 28 owned paths under `src/lib/dashboard/`,
  `src/lib/events/`, `src/components/{app,guest,shared}/`, `src/app/(app)/` and `src/app/(print)/`, plus this file,
  plus TWO exceptions, both build output of the mandated `pnpm design:rules` step: `src/app/(dev)/design/rules/rules.generated.json`
  and `docs/design/library.md` (ten new contract titles: the storage step's door, the gap the count reads, the two
  confirm paths' save; and the line numbers they shift).
- **Items** (each closes the ROADMAP Now line quoted; retire it):
  1. "The dashboard's storage step leaves the app for `/pricing` ... `gated-sites.test.ts` does not cover it." →
     `next-step.ts` gives the storage step no route (`href: null`); `NextStepBand` draws it as the plan sheet's
     trigger (`room`, the bytes in use, `returnTo=/dashboard`, the dashboard passing the server-derived plan facts).
     `gated-sites.test.ts` scans the band and the rule and reads an href in any spelling; both new pins were run
     against the old `href: "/pricing"` and failed.
  2. "The guest album's skeleton takes no tile size ... 8 columns at 1920 before the album lands at 7." →
     `GallerySkeleton` takes the album's `tileSize` (one resolution in `EventExperience` for both boxes). Browser
     (same-origin iframes over the real server HTML, `guest-view-menu QA`): before 8 columns (232px) at 1920 and 6 at
     1440 under an album of 7 and 5; after 7 = 7, 5 = 5, 2 = 2 at 375; curl shows the skeleton and the album carry
     one `--album-column` for cookies 180, 300 and a malformed 999 (→ 240).
  3. "Check `src/components/shared/masonry.tsx:363`: it reads `--gap-gallery` unresolved" → real, confirmed in the
     browser BEFORE the fix: the token computes to `max(3px, 4px)` (parseFloat NaN, read as 0) while the box's
     `column-gap` is `4px`; at 375 the phone rule never reads it (2), at 1440 the count coincides (5), at 1490 the
     album laid 6 columns of 238px where the CSS rule and the skeleton lay 5. `columnsFor` now reads the resolved
     `column-gap`; remeasured: 5 at 1490, 5 at 1440, 2 at 375, 7 at 1920. Its new contract fails on the old read.
  4. "Host: the hub link row, the code mini-modal and the print sheet DISPLAY a claimed slug as `<site>/<slug>` ..."
     → the hub page and the print page build the readable link with `preferredEventUrl` (`<site>/e/<slug>`); the
     copied and encoded permanent link is untouched (the print contract's pinned template kept). A source pin in
     `share-urls.test.ts` refuses a hand-built `${siteUrl}/${...custom_slug}` on either page.
  5. "Guest: confirming from the Unverified mark ... or the guest name menu ... never saves the event ... save it on
     those two paths too." → both now claim, THEN save through `lib/events/save-event.ts` (the offer card's key,
     RPC and words, now single-sourced), writing the save intent before the door opens; `CompletePendingSave` on the
     event page finishes it after a Google or magic-link return, which also lands the offer card's own redirect save
     (its only reader was the button, never on the page by then). Browser (local, signed out): the menu's "Add your
     email" → "Confirm it now instead" opens the save wear and writes `pr_pending_save_<eventId>` = 1; a signed-out
     reload keeps it and sends no `save_event`. The contracts pin the order (intent, claim, save) on both doors.
  6. "Copy: one word for the bin ..." (the app's half; the marketing and posts half is `defects-copy`'s, legal's
     "recovery bin" stays) → the delete-event dialog says "It moves to Deleted", the create wizard's cap door "It
     waits in Deleted", reading `RECENTLY_DELETED_WINDOW_DAYS` where it typed 30.
  - In passing: `share-urls.ts`'s "database-security.md0" (one clause of the housekeeping "comments that state retired
    facts" line; its other items stay).
- **Not verifiable locally (sign-in gated), pinned by tests, owed a look on the alias after merge:** the storage chip
  and its sheet (needs a host over 85% storage), the hub's link row and mini-modal and the print sheet with a claimed
  slug, the delete dialog and the cap door, and both confirm doors' full round trip (code, Google) ending with the
  event under Saved on the dashboard.
- **Assets requested from Will:** none.
- **Proposed migrations / Worker / Vercel / Stripe / env changes:** none.
- **Calls his to overrule:**
  - The storage step's sheet opens on `room` with the bytes in use, the storage meter's own "Need more?" framing
    ("You are out of room" from 85%); the neutral `plan` trigger is the alternative.
  - Without plan facts the band says the storage step as a plain line, never a dead control (a fallback only; the
    dashboard always passes them).
  - The mark's and the menu's confirm use the offer card's toasts ("Saved to your dashboard." / "Couldn't save this
    event."), and a redirect return toasts the first once the save lands (the page's claim stays silent, as its
    comment already expected).
  - A door opened and then abandoned keeps its intent, so the guest's next signed-in visit to that event saves it
    (how the offer card's marker already behaved whenever its button was mounted).
  - The cap door reads the lifecycle window constant rather than a typed 30 (the sentence was already open).
- **Look at first:** `src/lib/events/save-event.ts` with `CompletePendingSave` (`save-event-button.tsx`) and the
  `UnverifiedMarkEvent` provider (`unverified-mark.tsx`, placed in `event-experience.tsx` around the album), then the
  storage chip in `next-step-band.tsx`.
