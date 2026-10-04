---
track: small-fixes
status: open            # open -> handed-off; deleted in the merge commit that integrates it
cut: "ee0629d7"            # the launch-prep SHA the branch was cut from
board: none
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/lib/upload/
  - src/lib/export/
  - src/components/app/export/
  - src/lib/avatar/
  - src/app/(app)/dashboard/[eventId]/guests/
  - src/components/social/guest-list.tsx
  - src/components/shared/media-lightbox-parts/credit.tsx
  - src/lib/format/
  - src/lib/utils.ts
  - docs/systems/uploads-and-r2.md
  - docs/systems/profiles-social.md
reads:                  # single-sources you depend on: never duplicate, never edit
  - CLAUDE.md
---

# lp/small-fixes

**Goal.** Three of Will's small calls: E6 (a cancel and a dropped connection told apart, for downloads and uploads), Q2 (a date range spoken with "to"), and every name-only guest painted in her own seeded colour.

## The brief

**The round's direction (Will, standing since round 13, carried by every lane):** never dev-tool-ish (the viewfinder's corners survive only as a focus mark, never a style, and so does nothing of their loading state); a host of 1 to about 10 events first, scaling to hundreds; "all work no play is a boring consumer product": delight where it costs nothing in clarity; nothing depends on a timeline (undated, morning-only and multi-day events all read well); "everything should feel as immediate/responsive/snappy, and anything taking longer should provide clear state feedback and potential interruptibility"; Partyreel runs with no AI managing it (every operator fix ships its `/admin` control); cost is designed like the architecture (every image and video action multiplies at scale). Production is the working version: a pick is the best of what was drawn, never a rule.

**E6, Will's answer (2026-10-04): tell a cancel and a dropped connection apart.** Today every download ends in words: "Downloading...", then "Your download is saved.", or "That download didn't finish." with Try again for only what's missing, and a cancel and a dropped connection read the same (`src/lib/export/walk.ts`, the export toast).
- A cancel is intentional: it asks to confirm first, then offers Try again.
- A network failure is never hidden: it says the connection dropped and what to do, so she neither tries in vain nor blames the app (his picture: a crowded indoor stadium, "I hate this app, it's not working").
- The same for uploads (`src/lib/upload/uploader.ts` and the words it feeds).
- Where the words render in a file another lane owns, propose the line through the Orchestrator (`src/components/ui/` is graphite-wiring's this round; arrival-wiring owns the guest album's empty and arrival files).

**Q2, Will's answer: a date range is spoken with "to".** "May 1–3, 2026" reads to a screen reader as a dash or nothing. Give every range a spoken "to" while the eye keeps the en dash (the range's one formatter is `formatEventDate` in `src/lib/utils.ts`; one accessible form wherever a range renders, no visible change).

**The name-only guest's hashvatar (the approved plan, `../partyreel-wt/_scratch/desk/round-15-plan.md`, "Your second note" item 3).** A guest who joined by name only gets no avatar colour today (`room.server.ts`: `person.userId ? seedFor(person.userId) : null`). Seed her from her own guest row, `seedFor(guests.id)`, hashed server-side like every seed (`src/lib/avatar/seed.ts`). Never her name: nobody can game the colour, and every name-only album gets its colours. Do it wherever a name-only guest is painted: the guests room, the album's credit, the guest list, and her own face on the guest page if it paints one (a file outside your list is an exception named in your Handoff).
- Say two rules aloud in `profiles-social.md`: one colour per ticket (a name-only guest returning on another device is a new row and a new colour, which only an account cures), and a claim switches the colour once (when she confirms and claims, every surface turns to her account's colour).
- No raw guest id reaches a browser that doesn't already hold it; the seed is the hash.

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
