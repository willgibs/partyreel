---
track: schema-pass
status: open            # open -> handed-off; deleted in the merge commit that integrates it
cut: "932649e4"            # the launch-prep SHA the branch was cut from
board: none
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - supabase/migrations/20260929160000_schema_pass.sql
  - src/lib/db/queries/media.ts
  - docs/systems/database-security.md
  - src/lib/db/migration-guards.test.ts
reads:                  # single-sources you depend on: never duplicate, never edit
  - docs/systems/reel.md
  - docs/systems/profiles-social.md
  - docs/systems/billing-caps.md
---

# lp/schema-pass

**Goal.** Audit the whole data architecture and make it better under Will's standing permission: drop the dead (the four columns he yes'd, the reel's dormant columns, the latent grants, anything nothing reads), simplify the redundant, add what is missing, never touching what partyreel.com still reads or what the two SQL lanes beside it rewrite; hand off the audit as a list.

## The brief

**His standing permission** (Will, 2026-09-29): "you're in full control of our data architecture, and as you rearchitect or optimize, anything useless may be dropped as needed. Remember, we're still architecting the perfect app/backend with no real users or data to worry about. We should never feel stuck to a backend system that could be improved, especially pre-launch, with nothing but opportunity in front of us. Would be a shame to not optimize everywhere we can before we get bogged down by real user data post-launch."

**The job:** audit the whole data architecture in the shared Supabase (`ddafaemglzmuekbtjwzn`), read-only through the Supabase MCP: tables, columns, constraints, indexes, RLS policies, grants, functions, triggers, extensions and the storage bucket's policies, with `get_advisors` (security and performance) before and after. Then make it better: drop what is dead, simplify what is redundant, add what is missing (an index a hot query wants, a constraint the code assumes), each change with its reason. Everything is test data: no compatibility work to keep rows.

**Named for you:**
- `events.show_guest_list` and its host UPDATE grant, and the three `notification_prefs` columns for mail nothing sends (`notify_album_shared`, `notify_new_uploads_digest`, `notify_new_follower`): his yes on each (2026-09-29).
- The reel's dormant `media.highlight_score` and `clip_*` (ROADMAP's reel bucket): their names sit in the host's column-scoped select list (`src/lib/db/queries/media.ts`), so the drop edits that list in the same commit.
- The latent table-level TRUNCATE, REFERENCES and TRIGGER grants `anon` and `authenticated` hold on every public table (Supabase's default; PostgREST issues none of them), ROADMAP's billing follow-ons line.
- Any function, trigger, index or column no code and no function reads (prove each with a grep of `src/`, `workers/`, `scripts/` and every live function body).

**The two rules that bound every change:**
- **partyreel.com never reads a dropped thing.** Production is `main` at `milestone-30`; check every drop against `git grep` on `main` as well as `launch-prep`, and anything main still reads waits for milestone 31 (list it).
- **Two lanes rewrite SQL beside you.** `settings-wiring` owns every guest-path function this batch (the join, the album's reads, `get_event_by_qr_token`, the upload's gate and presign, likes, both claims) and adds the doors' tables and the Videos column; `triage-r2-wiring` owns the report path's functions, the media guard trigger and the purge's functions (its migration `20260929140000_triage_r2.sql`). Read their manifests (`docs/tracks/settings-wiring.md`, `docs/tracks/triage-r2-wiring.md`, and their branches' migrations on `origin/lp/<track>`) and touch none of those functions or the columns they change; put any improvement there in your Handoff as a follow-up for after their merges.

**Security (non-negotiable):** RLS stays the boundary; `anon` gets no table access; every function created revokes EXECUTE from `public` AND `anon` explicitly; host table writes stay column-locked (a table-level revoke on a table with column grants cascades to them: `database-security.md`'s Gotchas); the service role stays server-only.

**The migration** (write it; the Orchestrator applies it and regenerates the types): `supabase/migrations/20260929160000_schema_pass.sql`, more files if the work splits (add each to `owns` before writing it). A rolled-back proof for every refusal the change must keep (`anon` and another host refused where they were), and `get_advisors` read before and after (the accepted set today: 0029 at 29, 0028 at 4, no-policy at 17).

**The report is the other half:** your Handoff lists every finding as done (with its migration line), proposed for after the two lanes' merges, or left (with why), so the next pass starts from it. Record the lasting facts in `docs/systems/database-security.md` in place.

**Legal:** none (the legal text is rewritten once, right before launch).

**Paths:** your owns are a start. A path you need beyond them: add it to `owns` in your manifest before editing, never one another lane owns, or name a one-line exception.

**Verify:** `pnpm typecheck` against types you regenerate locally from your migration's rolled-back shape is not possible (the Orchestrator regenerates after the apply), so keep TypeScript edits to what the drops remove, each proven by a grep; Vitest for every guard you touch; the rolled-back SQL proofs; `pnpm lab:smoke` whole.

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
