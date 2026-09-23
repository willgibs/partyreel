---
track: guests-grant-tidy
status: open            # open -> handed-off; deleted in the merge commit that integrates it
cut: "da64829f"            # the launch-prep SHA the branch was cut from
board: none
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - supabase/migrations/
  - src/lib/db/migration-guards.test.ts
  - docs/systems/database-security.md
  - src/app/api/guests/capture-email/
reads:                  # single-sources you depend on: never duplicate, never edit
  - docs/ROADMAP.md
  - src/lib/db/types.ts
  - docs/systems/guest-flow.md
---

# lp/guests-grant-tidy

**Goal.** The guests table's last host-facing surface and one stray address write are closed in SQL: the host's now-unread guests SELECT and its policy go, and `capture_guest_email` writes only the row's own account's confirmed address. A migration, its guards and a rolled-back proof; the Orchestrator applies it.

## The brief

**Why now:** these are open ROADMAP "Now" lines that state a defect against a rule already on record (the bible, the identity model, the shipped product), not a product decision. Each line is quoted below with its file references; check every one against the code before you change anything (a line can be stale), fix it at its source, and list in the Handoff the exact ROADMAP line each fix closes so the Orchestrator retires it. Where a fix would need a product or copy decision the line does not make, take the recommended answer given here, build it, and list it as his to overrule; never invent a decision the brief does not give. Everything is unprotected (Rising Tides), but this lane fixes defects: it does not redesign.

**The lines (from `docs/ROADMAP.md`'s Now list, found by the `identity-sql-gaps` lane, whose migration `20260922200000_identity_sql_gaps.sql` is applied and is your newest ground):**
1. The host's remaining guests SELECT `(id, event_id, user_id, created_at)` and its `guests_host_select` policy have no reader on either codebase (every guests read is service-role; that lane audited launch-prep and `main` at `milestone-26`): re-verify the audit on both codebases (`git grep` on `origin/launch-prep` and `origin/main`), then revoke the SELECT and drop the policy, the QA #41 shape (revoke at table level; nothing re-granted). If anything reads it, keep it and say what.
2. `capture_guest_email` fills an EMPTY `guests.email` on whatever row the session token names, so on a shared device a confirmed account's address can land on another person's row (the host never sees it, but `upload_forensics.guest_email` records it): recommended, write only when the row's own `user_id` is the confirmed account whose address it is (else nothing), rather than dropping the write, so the newsletter capture keeps working for the account's own row. Start from the function's newest definition.
3. Housekeeping in your files: `api/guests/capture-email/route.ts:18-26` and its `route.test.ts:4-6` count the host's column-scoped SELECT grant among `guests.email`'s readers; the grant no longer carries the column.

**How:** one new migration file (a timestamp after every existing file); replacing a function starts from its NEWEST definition; a function dropped and re-created through the MCP inherits an `anon` EXECUTE grant (re-revoke). Prove it with ONE rolled-back `execute_sql` (`begin; ... rollback;`) on disposable fixtures only, and a contract check commented at the file's foot that ends in a deliberate raise, as `20260922200000_identity_sql_gaps.sql` does. Pin it in `migration-guards.test.ts`; refine `database-security.md` in place. **Never call `apply_migration`**: hand off the apply order (a drift check with normalised checksums, the apply, `get_advisors`, the contract check), as the last lane did.

**Binds.** The bible and the policies (`/design/library`), the contracts of every component under a path you own, and
CLAUDE.md's working loop. `DESIGN_PREVIEW_KEY` rides the environment, never a command line or a log you print. A record doc
(`docs/STATUS.md`, `docs/ROADMAP.md`, `docs/PROGRAM.md`, `CLAUDE.md`, `docs/ASSETS.md`, `docs/tracks/orchestrator.md`,
`docs/reviews/`) is edited only when your `owns` names it. Stage explicitly; never `--no-verify` or force-push; every commit ends
with the `Co-Authored-By` line naming the model you actually run on.

**Verify on.** The gate on the synced tree, each step on its own exit code; the rolled-back proof's statements and results pasted in the Handoff (no secret, no real address).

## Questions (a recommended answer each; the Orchestrator relays them)

- none yet

## System-doc edits (in place, owned facts only)

- none yet

## Deferred (ROADMAP one-liners, bucket named)

- none yet

## Handoff (replaces the chat report)

- The work commit and the sync commit, pushed (or: launch-prep had not moved); the head is in the chat line
- Every claim names its artifact (a commit, a log line, a path), so the Orchestrator checks rather than believes.
- Gates on the synced tree, each on its own exit code
- Lane check: `git diff --name-only origin/launch-prep...HEAD` = owned paths + this file (exceptions and why)
- The items, one line each
- Assets requested from Will: none, or one per line: `what · spec (size, grade, count, format) · replaces <stand-in id>`
- Proposed migrations / Worker / Vercel / Stripe / env changes: none
- Calls his to overrule, one line each
- Look at first: ...
