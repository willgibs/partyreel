---
track: help-wiring
status: open            # open -> handed-off; deleted in the merge commit that integrates it
cut: "2e385f61"            # the launch-prep SHA the branch was cut from
board: none
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/app/(marketing)/(cinema)/help/
  - src/components/marketing/help/
  - src/components/marketing/chrome/
  - src/components/guest/upload/failure-sheet
  - supabase/migrations/20260928150000_article_feedback.sql
  - src/app/admin/help-feedback/
  - src/app/(dev)/design/sandbox/help-center/
  - src/components/guest/upload-tracker
  - src/components/guest/guest-name-menu
  - src/components/guest/guest-account-menu
  - src/components/app/user-menu
reads:                  # single-sources you depend on: never duplicate, never edit
  - docs/reviews/help-center.json
  - docs/systems/marketing-content.md
  - docs/systems/admin-observability.md
  - docs/systems/database-security.md
---

# lp/help-wiring

**Goal.** Build Will's seven `help-center` answers: a host-first help hero whose quick questions drop from the search, the ten doors, illustrated steps, help links where trouble happens plus a standing entry in the menu, recorded article feedback visible in admin, working dead ends, and the search reachable from the header and footer; then retire help-center.

## The brief

**His answers** (`docs/reviews/help-center.json`, each note there; the drawings in `src/app/(dev)/design/sandbox/help-center/`):
- `who-first=host`: the heading and search speak to hosts; guests get one quiet line. His note: "Our entire platform is paid for by hosts, not guests ... Guests are smart enough to find the content they're looking for."
- `hub=strip`: keep the ten doors across the hero's edge, then Start here, the numbers, the index. His note: "remove the preset questions below the input. Instead, when the input is selected, those can drop down as quick options."
- `article=screen`: each step keeps a small illustration of the surface it describes, beside its sentence (drawn from production's own components, as the board did).
- `from-product=contextual`: the failure sheet and a refused photo's row in her uploads each link to the article that answers them. His note: "Let's also include the help center entry in the menu too. That way it's globally accessible for general questions as well." So a Help row in the guest's name menu and the host's account menu, too.
- `feedback=beacon`: one insert per click, visible only in admin; the reader sees the same thank-you or sorry.
  - A table with RLS, `anon` with no table access, and one insert path that is rate-limited and cannot be read back. Write the migration; the Orchestrator applies it.
  - An admin view with its health signal (`/admin/help-feedback`: counts per article, newest first). A backend write ships its admin surface in the same change.
- `dead-end=rung`: a troubleshooting article ends with a link back to the calm, working version of the same act.
- `search=visible`: the header's Resources panel and the footer's Resources column each gain a plain Search row opening the help palette. His note: "admin can create its own component version of the command palette if helpful ... this help palette should have zero conflicts with where they get used (admin vs main platform)." The help palette never mounts in the admin portal.

**Paths:** `voice-wiring` has merged, so the refused row (`src/components/guest/upload-tracker.tsx`; its words are `TRACKER_WORDS` in `src/lib/guest/upload-tracker.ts`, a read) and the guest's name menu are yours. The host's account menu (`src/components/app/user-menu.tsx`) already carries a "Help center" row: keep one, in the menu's own grammar. `hero-wiring` runs beside you and may need `src/components/marketing/chrome/mega-panel.tsx` if the demo's frame changes signature; if it asks, the Orchestrator settles it. Add any other path to `owns` before editing it.

**Then retire `help-center`** in one commit: its folder and its lines in `registry.ts`, `boards.ts` and `touchpoints.ts` (named exceptions). The ledger is the Orchestrator's.

**Verify:**
- Vitest for the feedback path (the insert, the rate limit, no read-back) and the palette's mounts.
- A rolled-back SQL check on the table's grants.
- The help at 1440 and 375.
- `pnpm lab:smoke` whole.

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
