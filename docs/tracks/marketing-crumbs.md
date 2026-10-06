---
track: marketing-crumbs
status: open            # open -> handed-off; deleted in the merge commit that integrates it
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
