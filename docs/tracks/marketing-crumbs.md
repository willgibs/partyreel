---
track: marketing-crumbs
status: handed-off      # open -> handed-off; deleted in the merge commit that integrates it
cut: "567e8710"            # the launch-prep SHA the branch was cut from
board: none
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/components/marketing/
  - src/app/(marketing)/
  - src/lib/constants/how-it-works.ts
  - src/components/ui/popup-kinds.test.ts
reads:                  # single-sources you depend on: never duplicate, never edit
  - docs/systems/marketing-content.md
  - docs/systems/design-system.md
---

# lp/marketing-crumbs

**Goal.** Nine of the ROADMAP's marketing lines closed in one pass: the site's words and pictures brought to the product as it is today, the cinema room's invisible postmark and its unreached 404, the demo modal on the product's popup, and three small layout wells. Production code, the whole gate.

## The brief

**The round's direction (Will, standing since round 13):** never dev-tool-ish; a host of 1 to about 10 events first, scaling to hundreds; delight where it costs nothing in clarity; nothing depends on a timeline; immediate, or a clear state and a way to stop it; no AI managing it; cost designed like the architecture; production is the working version.

**The work (each line retired from the ROADMAP in your Handoff, quoted there by its first words):**
1. Marketing (copy): `sections/features/album/album-copy.ts`'s "Take all of it" body still says "everything, photos, or videos" (the retired menu's chips) over a plate that now draws Select, then Save; and the how-it-works keep step's body (`src/lib/constants/how-it-works.ts`) says only "the whole album as a single zip", where the host's panel offers Phone size too.
2. Design: `ContactReceipt`'s `Postmark` (`(cinema)/contact/contact-receipt.tsx`) is inked `text-foreground/75` with `mix-blend-multiply`, which draws nothing over the cinema room's dark card: ink it for the dark.
3. Help: a `<DemoDoor>` in `marketing/mdx/spec-help.tsx`, so `try-the-live-demo` carries a real demo door and not the address.
4. Marketing: the how-it-works pictures and the album-fill grid draw the green landed check the product replaced with a pass of light (`src/components/shared/arrival.css`, read it, never edit it), and the curation mock (`sections/features/curation/bulk-tools.tsx`) floats its select bar off the header's row.
5. Marketing: the cinema 404 (`(cinema)/not-found.tsx`) never draws, since every cinema slug route sets `dynamicParams = false` and an unknown slug gets the root's screen: retire it, or give the root's screen the cinema skin, for one 404 (your call, in Questions).
6. Marketing: /contact still lists the help center's quick questions as chips under its search field; drop them, since the palette's Suggested list already drops from that field, as it does on /help (`(cinema)/contact/page.tsx`).
7. Marketing: the demo modal (`system/demo-modal/demo-modal.tsx`) still draws a bare Dialog; move it onto the code card's `share` kind (`src/components/ui/popup.tsx`, read only) and out of `popup-kinds.test.ts`'s `LEFT_ALONE`.
8. Marketing: the nav's Features pane draws the demo frame in the top 16:9 of a pane stretched to the list's height, leaving an empty well under it (`chrome/mega-panel.tsx`'s `FeaturedDemo`).
9. Marketing: the event pages' table and tent cards (`sections/events/event-object.tsx`) print the code and a scan line but no address, where the product's print stock prints the readable address under the code (`src/app/print/print-stock.tsx`, read only).

A picture of the product composes the product's own pieces (retired-mocks' rule): never a hand copy of a component that exists. A call about how something looks that is not a plain fix goes in Questions with your recommended answer, built.

**Verify on.** The whole gate on the synced tree, each step on its own exit code, and `pnpm lab:smoke` (the demo-framing board imports marketing pieces: `pnpm lab:demo --board demo-framing` too if your diff reaches it); each changed page at 375 and 1440 in your own headless Chrome, light and dark where the page has both.

Model: Opus. Cut 2026-10-06 by the cloud-seated Orchestrator; you run in a cloud session of your own (the spawn prompt's boot).

**Starts from.** CLAUDE.md's working loop, the bible's ten and production as it is; the tests say what has to keep
working.

**Verify on.** The gate on the synced tree (CLAUDE.md's four steps), each step on its own exit code; `pnpm lab:smoke --base http://localhost:<port>` when the lane changes anything under `src/` but tests (it crawls what the change reaches: the Library, and every board whose drawings import a changed file); and the surfaces the Handoff is judged on, local and live.

## Questions (a recommended answer each; the Orchestrator relays them)

- **The cinema 404: retire, not re-skin (item 5).** Recommended and built: the cinema group's `not-found.tsx` and its screen are gone, and the root's paper-and-trail 404 is the site's one 404. Why: every cinema slug is routing's 404 (`dynamicParams = false`), so the group's screen never drew and still rode every cinema page's payload as a reference; a `notFound()` a page does throw falls to the root's boundary, which renders outside the group's layout with its own chrome, so nothing doubles. Re-skinning the root's screen for the cinema would undo the `home=notfound` call (the trail on paper, chosen for the 404 a lost visitor lands on). Overrule → restore the two files from `567e8710` and the lazy entry. Pinned by a new case in `marketing-dynamic-params-policy.test.ts` (no `not-found` under `(marketing)`).
- **The select-mode mock moved into the header row on the home too (item 4b).** `BulkBarMock` is shared by `/features/curation` and the home's curation section, and the app's bar lives in `FeedSectionHeader`'s action slot (the floating pill retired with `EventFeedActionBar`), so both mocks now draw the album header (ALBUM + count, then All · count · like/hide/download · cancel) above the tiles, one component, one fix. Overrule → keep the home's floating pill by giving the mock a `floating` prop.
- **The nav pane's demo frame grew to fill its pane (item 8).** Centring alone left the 84px frame small in a ~366px pane, so `DemoFrame`'s `nav` size is now 140×168 with a 56px corner code (`system/demo-ticket.tsx`), centred in the whole pane with a 153px floor. Overrule → the old numbers.
- **Item 1's copy.** Album "Take all of it": "Select it all, then Save: light copies to Photos, or every original as a zip." How-it-works keep step: "…or take the whole album: the originals to keep for good, or a phone-size set to post tonight." Overrule → rewrite in place.
- **The help door keeps the address in words (item 3).** `<DemoDoor>partyreel.com/demo</DemoDoor>` makes the address itself the door ("Open it from here, or type the short address on any device: …"), so a reader who will type it elsewhere still sees it; with no demo configured it falls back to the value plate.
- **The event cards' address is the code's own value (item 9):** `<host>/demo` from `SITE_URL` (it reads localhost:3000/demo locally, partyreel.com/demo live), on the table card and tent card only, the two pieces a host prints; the badge and the sleeve are not stock.

## System-doc edits (in place, owned facts only)

- none made (both docs are `reads`). Proposed for the Orchestrator: `docs/systems/marketing-content.md` holds no cinema-404 line to delete; if `design-system.md` or `architecture.md` names a group 404 under `(marketing)`, that line goes (I found none with `grep -rn "cinema.*404" docs/systems`).

## Deferred (ROADMAP one-liners, bucket named)

- none yet

## Handoff (replaces the chat report)

- Commits on `lp/marketing-crumbs`: work `960b2ff0f` (the nine items), `f16be0ba4` (the nav frame's size), sync `ef26df182` (launch-prep had moved two commits: `8769437f5`, `294329078`, both docs/types, merged clean). The manifest commit follows.
- Gates on the synced tree `ef26df182`, each on its own exit code: `pnpm typecheck` 0 (after `rm -rf .next/dev`: the killed dev server had left a half-written `validator.ts`), `pnpm lint` 0 with 0 warnings, `pnpm test` 0 (1055 files, 13261 passed, 2 skipped), `zsh scripts/build-lock.sh pnpm build` 0, `pnpm lab:smoke --base http://localhost:3131` 0 (213 checks, 0 failing), `pnpm lab:demo --board demo-framing --base http://localhost:3131` 0 (0 steps; the board has no open step).
- Lane check: `git diff --name-only origin/launch-prep...HEAD` = owned paths + this file, with these exceptions, each the item's own reach:
  - `content/help/try-the-live-demo.mdx` (item 3: one sentence, the address wrapped in the new `<DemoDoor>`; the component alone would door nothing).
  - Item 5's retirement, subtractive only: `src/app/not-found.lazy.tsx` (the `CinemaNotFoundLazy` entry), `src/app/not-found.test.ts` (its `GROUPS` row and a byte count in the header), `src/app/group-not-found.lazy.test.tsx` (its describe block), and stale comment lines in `src/app/not-found.tsx`, `src/app/not-found.site.tsx`, `src/components/shared/not-found-screen.tsx` that named the group 404.
- The items:
  1. Copy: album-copy's "Take all of it" names Select then Save; the how-it-works keep step names Originals and Phone size (`album-copy.ts`, `how-it-works.ts`).
  2. Postmark: `dark:mix-blend-screen` beside the paper's multiply; verified in the Library's receipt specimen inside the cinema room: computed `mix-blend-mode: screen`, the stamp visible on the dark card at 1440 and 375.
  3. Help: `<DemoDoor>` in `mdx/spec-help.tsx` (a `system/demo-modal` door, `source="help-article"`, `InlineCode` fallback); `help-mdx-compile` and `demo-door-policy` green; drawn at 375 and 1440.
  4. Arrival marks: new `sections/shared/arrival-light.tsx` lays the product's own `data-arrived`/`data-landed` (shared/arrival.css, timings from `lib/shared/arrival.ts`) on a layer over a tile; replaces the green checks in `host-pictures.tsx` (Fill: two tiles take turns), `guest-pictures.tsx` (Add: the landed sweep on the thumbnail; Room: the glow), and `album-fill-grid.tsx` (the glow, mounted per arrival by the fill's own clock). Probed live: `pr-arrival-glow` running, opacity rising and fading, the two tiles alternating. The select bar: `BulkBarMock` is the album header's row (curation page and home), drawn at 375 and 1440.
  5. Cinema 404 retired (Questions).
  6. /contact: chips gone, the field alone, subhead "Search the help center without leaving this page."; drawn at 375 and 1440.
  7. Demo modal: `Popup` + `<PopupContent kind="share">` + `PopupHeader`; out of `LEFT_ALONE`; its tests green; drawn at 1440 light and dark (paper card either way).
  8. Nav pane: the frame centred in the whole pane and sized to it (Questions); drawn at 1440.
  9. Event cards: the readable address under the scan line on the table and tent cards; drawn at 375 and 1440.
- ROADMAP lines this retires (the Orchestrator deletes them; ROADMAP is not mine to edit), by their first words: "Marketing (copy): `features/album/album-copy.ts`'s "Take all of it"…", "Design: `ContactReceipt`'s `Postmark`…", "Help: a `<DemoDoor>` in `mdx/spec-help.tsx`…", "Marketing: the how-it-works pictures and the album-fill grid…", "Marketing: the cinema 404 (`(cinema)/not-found.tsx`)…", "Marketing: /contact still lists the help center's quick questions…", "Marketing: the demo modal (`system/demo-modal/demo-modal.tsx`)…", "Marketing: the nav's Features pane draws the demo frame…", "Marketing: the event pages' table and tent cards…".
- Not driven: the postmark on /contact itself (it appears only after a real send; checked on the Library's specimen, which is the real `Postmark` in the cinema wrapper). The session refused appending the three exports to the shell snapshot (and `/root/.partyreel-env`), so each command carried them inline; `chrome-ns` was already in place, so every browser walk ran.
- Assets requested from Will: none.
- Board ideas: `MarketingNotFound`'s `strip` prop now has one caller, which passes `false`; the strip branch could leave it (the help palette and the 500 screen import `MissingFrameStrip` directly).
- Proposed migrations / Worker / Vercel / Stripe / env changes: none.
- Calls his to overrule: the five in Questions (retire the cinema 404; the home's mock in the row too; the nav frame's new size; item 1's two lines; the help door keeping the address as its words).
- Look at first: /how-it-works step 03 (the light taking turns on two tiles), the nav's Features pane, /features/curation's bulk tools, a weddings page's table card.
