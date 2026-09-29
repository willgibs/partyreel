---
track: triage-r2-wiring
status: open            # open -> handed-off; deleted in the merge commit that integrates it
cut: "92334b26"            # the launch-prep SHA the branch was cut from
board: none
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - supabase/migrations/20260929140000_triage_r2.sql
  - src/app/admin/reports/
  - src/app/admin/forensics/
  - src/app/admin/albums/
  - src/components/admin/
  - src/components/app/report-review
  - src/components/guest/report-dialog.tsx
  - src/components/guest/report-answer-form.tsx
  - src/app/api/reports/
  - src/app/(guest)/report/
  - src/lib/validation/report.ts
  - src/lib/db/queries/reports.ts
  - src/lib/db/mutations/reports
  - src/lib/db/mutations/report.ts
  - src/lib/db/mutations/media
  - src/lib/db/triage-seam.ts
  - src/lib/reports/
  - src/lib/admin/reports
  - src/lib/admin/pending.ts
  - src/lib/admin/nav.ts
  - src/lib/guest/report-door.ts
  - src/lib/email/templates.ts
  - src/components/shared/media-lightbox-parts/
  - src/lib/lifecycle/
  - docs/systems/admin-observability.md
  - docs/systems/trust-safety-forensics.md
  - src/app/(dev)/design/sandbox/admin-triage/
reads:                  # single-sources you depend on: never duplicate, never edit
  - docs/reviews/admin-triage.json
  - docs/systems/database-security.md
  - docs/systems/billing-caps.md
  - docs/systems/uploads-and-r2.md
  - docs/systems/guest-flow.md
  - docs/systems/lifecycle-recovery.md
  - content/help/report-a-problem-as-a-guest.mdx
---

# lp/triage-r2-wiring

**Goal.** Wire admin-triage r2 (the reports queue as the review grid, five kinds with harm in front, a reporter's confirmed email, both acts on a phone) and rebuild the hold on Will's word: Hold takes it down by default and preserves, an operator's removal stops counting against the host's storage, an open report protects its item from every permanent delete, and a child-abuse report from a confirmed address hides the item at once pending review.

## The brief

**His r2 answers** (`docs/reviews/admin-triage.json`, build 19's sitting, 2026-09-29): `look=grid` (the review grid, words on every tile: the host queue's 4:5 tiles and keys, each reason, who reported and who sent it under its tile, Space opens it whole), `harm=kinds` (the form asks one of five kinds or Something else; harm arrives in front, worst first, the worst covered; Something else joins the sweep), `proof=confirm` (the form offers Confirm your email with the door's own code, so a signed-out reporter can be asked too, on the address kept until the report closes), and `phone=stop` with his note: "What's the functional difference between \"take it down\" and \"start a hold\"? May help to have both on mobile in case critical review items need one or the other instead of just taking it down." So a phone gets both acts, each one press (the board's `hold` option); sweeps, notes and proof wait for a desk.

**The hold, rebuilt on his word in chat (2026-09-29).** A hold is for what police should see (child sexual abuse material first), so nothing held stays visible by default:
- **Two acts, no third.** Take it down stays as it is (the item leaves the album and the host's Deleted at once, the 30-day window, then the purge). Hold for forensics' confirm carries "Take it down too", ON by default: the reported item and the same uploader's other items the hold covers leave the album and the host's Deleted at once and are preserved (the original and its forensic record to the preservation store, past every purge), each restorable by an operator after review. Unticking it is the quiet hold, for a police preservation request about content that is not harmful to show, where removing it would tip someone off: nothing is removed, the host's own delete of a quietly held item looks like any delete (her Deleted takes it, restore refused, every purge skips it).
- **An operator's removal stops counting against the host's storage at once**, a takedown and a hold alike (they are not hers to manage any more, and then no number tells the two apart: today `profiles.storage_used_bytes` keeps a hold's bytes for ever where a removal's drop). Keep the storage-abuse invariants whole: a host cannot trigger an operator's removal, and the monthly upload meter never refunds.
- **An open report protects its item from every permanent delete** (the host's Delete permanently, the uploader's own delete, an event's deletion, an account's) until the report closes: the item leaves view as the deleter expects, its bytes wait for the review. Do it at the media table's guard, where a hold's protection already lives, so every path is covered at once.

**The child-abuse kind's instant hide** (his yes in chat, with the anti-abuse): the report itself is never gated (anyone, signed in or not, and it heads the queue). A report of that kind from an address confirmed in the form (the door's own code) hides the item from every viewer at once pending review, as a takedown would, restorable; an unconfirmed one heads the queue without hiding, and the form says a confirmed email hides it right away. Limits per address and per event; an address whose child-abuse report is dismissed as false loses the instant hide; and the operator is alerted at once (the portal's own signal, and a mail to the operator's inbox, internal and not a product mail) so a false hide lasts minutes. His words: "implemented poorly this becomes a gate to someone attempting to report real abuse, but the flip side would allow anyone to effectively takedown other photos knowing CA reports are immediate takedown."

**A photo can be reported** (ROADMAP's line: `/api/reports` accepts a `media_id` the report dialog never sends): the viewer's photo gets its own Report into the same dialog with that photo named, since a grid of reported items and the instant hide both need the item.

**Ask for proof** is a new mail to the reporter, and his rule holds every new product mail for the email exploration: build the ask and its record whole, the mail behind a switch left OFF, his yes flips it (a Question). The reporter's closing note (`reporter=note`) stays banked.

**Security (non-negotiable):** every Server Function re-verifies with `getUser()`; the operator's acts stay `is_admin` plus MFA; RLS is the boundary; `anon` gets no table access and every function created revokes EXECUTE from `public` AND `anon`; a host never learns a hold exists (no count, no state, no error that differs); a report never tells the host or the person reported who filed it; the reporter's confirmed address is kept only until the report closes. Replace no function `settings-wiring` replaces this batch (the join, the album's reads, the upload's gate and presign, likes and both claims): an instant hide and a takedown share the operator's removal, which every read already leaves out. The report path's own functions, the media guard and the purge's are yours; a function you replace starts from its newest definition in `supabase/migrations/`.

**The migration** (write it; the Orchestrator applies it and regenerates the types): `supabase/migrations/20260929140000_triage_r2.sql`; add any further file to `owns` before writing it. Exercise inside a rolled-back transaction: a hold with and without "Take it down too"; the host's delete of each; the storage figure at each removal; every permanent-delete path refused on an item an open report names, and allowed once it closes; the instant hide's limits and its loss after a false report; another host and `anon` refused everywhere.

**Legal:** none. The Terms and the Privacy Policy are rewritten once, right before launch (Will, 2026-09-29): neither edit nor draft them.

**Then retire `admin-triage`** in one commit (its folder and its lines in `registry.ts`, `boards.ts`, `touchpoints.ts`, as named exceptions); the ledger is the Orchestrator's to delete.

**The help article** `content/help/report-a-problem-as-a-guest.mdx` sits inside `settings-wiring`'s owns (`content/help/`) this batch: if `settings-wiring` has merged before your handoff, sync and add the article to your owns then; otherwise put its new words in your Handoff as a relay, and the Orchestrator carries them.

**Paths:** your owns are a start. A path you need beyond them: add it to `owns` in your manifest before editing, or name a one-line exception.

**Verify:** Vitest for every rule and the rolled-back SQL checks above; the grid at 1440 and 375 with the worst kind covered; the phone's two acts; the form's five kinds, its confirm and its instant-hide line; a photo's own Report; `pnpm lab:smoke` whole. Name in the Handoff the walks the live red-team should take (a staged report of each kind; the hold's two ways; the host's view after each).

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
