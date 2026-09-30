---
track: shared-claims
status: open            # open -> handed-off; deleted in the merge commit that integrates it
cut: "2049e1ea"            # the launch-prep SHA the branch was cut from
board: none
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/lib/guest/claim-uploads
  - src/lib/guest/claim-ask
  - src/lib/guest/session-tokens
  - src/lib/guest/use-stored-name.ts
  - src/lib/guest/device-tickets.test.tsx
  - src/components/shared/claim-ask
  - src/components/shared/claim-uploads-on-auth.tsx
  - src/app/(guest)/e/[token]/page.tsx
  - src/lib/db/migration-guards.test.ts
  - supabase/migrations/20260929234000_shared_phone_claims.sql
reads:                  # single-sources you depend on: never duplicate, never edit
  - docs/systems/database-security.md
  - docs/systems/guest-flow.md
  - docs/systems/auth-accounts.md
---

# lp/shared-claims

**Goal.** On a shared phone, an anonymous guest's photos are claimed only by whoever they can belong to, and a claim never erases what the guest typed.

## The brief

**Build 26's red-team (LOW, pre-existing, `../partyreel-wt/_scratch/redteam-26/ledger.txt`):** on one browser, an anonymous visitor typed a name and an unproved address and added photos to an album. When another person, `partyr33l`, then signed in on the same browser, `claimAnonymousUploads` (`src/lib/guest/claim-uploads.ts`, which calls the `claim_anonymous_uploads` RPC) claimed that guest row for her account:
- she had never opened that album;
- the claim erased the visitor's typed name and address;
- the real owner can never claim those photos now.

The claim does this by design today: every guest ticket the browser holds becomes the signed-in account's. A party's shared phone makes it ordinary rather than rare.

**Settle whose a ticket is before claiming it, at the root:**
- a ticket that names someone else is never claimed;
- a claim never erases what the guest typed;
- the owner can still claim her photos later from her own account.

**The recommended answer, which you build and which is Will's to overrule** (write it under your Questions; it is not a one-way door):
- claim silently only what can be hers: a ticket whose typed address is her own, or one that carries no address and no name at odds with hers;
- ask once, in plain words, before claiming a ticket typed under another name ("3 photos were added on this phone as Dana. Are they yours?");
- leave a ticket that names another address alone, for its owner.

Read every caller of the claim, and every door a guest ticket is minted or claimed through (the account door, the email confirm, the guest's entry), and hold the rule in one home.

A SQL change is a migration:
- write it and prove it rolled back on the live schema through the Supabase MCP (read-only otherwise);
- hold its shape in `migration-guards.test.ts`;
- never apply it: the Orchestrator applies by protocol;
- new objects in `public` grant `anon` and `authenticated` nothing by default (CLAUDE.md), so a function revokes from `public` and grants exactly.

**Verify:**
- the gate;
- the claim's tests red on today's code and green on yours;
- the rolled-back proof.

Localhost cannot sign in, so name the shared-phone walk for the next build's red-team in your Handoff: two accounts on one browser, one anonymous visit between them.

**Paths:** your owns are a start. The claim's callers and your migration's file: add each to `owns` in your manifest before editing, or name a one-line exception.

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
