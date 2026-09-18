---
track: admin-split
status: open            # open -> handed-off; deleted in the merge commit that integrates it
cut: "0681652c"         # the launch-prep SHA the branch was cut from
board: none             # an engineering lane: the admin as its own deployment, one repo
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/proxy.ts
  - src/lib/auth/admin-context.ts
  - src/lib/surface/
  - scripts/vercel-ignore-build.mjs
  - src/app/api/cron/purge/route.ts
reads:                  # single-sources you depend on: never duplicate, never edit
  - src/lib/env.ts
  - docs/systems/admin-observability.md
  - docs/systems/architecture.md
  - vercel.json
  - next.config.ts
  - src/app/admin/layout.tsx
---

# lp/admin-split

**Goal.** The admin portal becomes its own DEPLOYMENT on `admin.partyreel.com`, in this one repository:
a second Vercel project builds the same code with `NEXT_PUBLIC_SURFACE=admin` (in `src/lib/env.ts`
since this cut, optional; unset serves both surfaces, as today) and serves only the admin; the main
project stops serving it. Will's requirements (2026-09-18, verbatim in `docs/design/rulings.md`): one
Orchestrator across every surface in one chat, everything kept tightly synced through the repo, and the
admin "existing elegantly serving its own purpose, with far fewer security risks than having everything
tied together"; his pick: separate now, in parallel with the redesign. **Not in this round:** a second
repo or package (never), any admin UI change (the `admin` board is drawing it), the jobs' backend
(`admin-jobs`), and the config mutations themselves (the Vercel project, its env, the domain move, the
Supabase redirect allow-list: you write the runbook in Handoff, the Orchestrator executes it).

**Binds.** `docs/systems/admin-observability.md` (the admin is gated by one seam, `requireAdmin` with
`is_admin` and AAL2, and its auth cookies stay HOST-isolated: never a `.partyreel.com` domain cookie);
`docs/systems/database-security.md` (`profiles.is_admin` is service-role-write-only); the crons run
exactly once; nothing the lab or the marketing site serves leaks onto the admin host and nothing admin
leaks onto the apex. Every claim in the docs you edit is true on the tree.

## What is true today

- `assertAdminHost()` (`src/lib/auth/admin-context.ts:54`) 404s the portal when the Host is not
  `NEXT_PUBLIC_ADMIN_HOST`; with the var unset (dev) the guard is skipped. `src/proxy.ts:45-52` redirects
  the admin host's root to `/admin` as a convenience, not a boundary. `partyreel.com/admin` is already a
  404 in production; the subdomain is host routing inside the one Next app on the one Vercel project.
- `vercel.json` holds the ignore command and ONE cron (`/api/cron/purge` at 04:00 UTC). A second project
  on the same repo registers the same cron, so without a guard the purge would run twice a day.
- `scripts/vercel-ignore-build.mjs` builds `main` always and `launch-prep` or `lp/*` only on
  `[preview]`; it runs before install, node stdlib only.
- The Workers post heartbeats to `/api/internal/job-run` on the main app; the admin reads `job_runs`
  from the database. The lab (`/design/*`) is keyed and belongs to the app surface.

## What to build

1. **One home for the surface**: `src/lib/surface/` (a pure module: `surface()` reads
   `env.NEXT_PUBLIC_SURFACE`, `servesAdmin()`, `servesApp()`, with a test) so the proxy, the admin gate
   and the cron route agree by construction.
2. **The proxy** (`src/proxy.ts`): on the admin surface, every path outside `/admin`, `/auth`, `/login`
   and what the admin's sign-in and MFA need is a real 404 (the same shape as the lab's keyless 404); on
   the app surface, `/admin` is a 404 whatever the host (the host guard stays as belt and braces). Say in a
   comment which surface each rule belongs to and why.
3. **The cron**: `/api/cron/purge` runs on the app surface only; on the admin surface it answers without
   touching the database or the heartbeat, and the docs say why (both projects register `vercel.json`'s
   cron). If the Vercel docs (the MCP's `search_vercel_documentation`) offer a per-project way to disable a
   cron, name it in Handoff as the better fix; ship the guard regardless.
4. **The ignore script**: the same policy on both projects; if you find a safe way to skip an admin build
   when a push touches nothing the admin serves, propose it, do not ship it (a shared token change reaches
   the admin too).
5. **The docs**: `docs/systems/admin-observability.md`'s deployment section rewritten in place (two
   projects, one repo, the flag, the crons, the cookies, the preview hosts), and one paragraph in
   `docs/systems/architecture.md`; the ROADMAP line is the Orchestrator's.
6. **Tests**: the surface module; the proxy's surface rules; `.env.example` parity if a test holds it.

## The cutover runbook (the Orchestrator's, from your Handoff)

Write it exactly, in order: create the Vercel project `partyreel-admin` on this repo (Next, the same
build); its env (every var the admin needs, with `NEXT_PUBLIC_SURFACE=admin`; `NEXT_PUBLIC_ADMIN_HOST`
production `admin.partyreel.com`, preview the project's `launch-prep` alias host); move the domain
`admin.partyreel.com` from `partyreel` to `partyreel-admin`; the Supabase auth redirect allow-list gains
the new preview host's `/auth/callback` (Will does that in the dashboard); the main project sets
`NEXT_PUBLIC_SURFACE=app`; then the checks: the admin READY on the new project, `partyreel.com/admin`
404, the apex untouched, the MFA sign-in on the new host, the cron running once, the cookies host-isolated.

## Verify, and the gate

Locally with the flag set both ways (`NEXT_PUBLIC_SURFACE=admin pnpm dev -p 3133` and `=app`): the 404s
and the allowed paths on each surface, the cron route's behaviour on each, the admin layout at AAL1 still
reachable on the admin surface (first enrolment is lockout-proof). Dev server on port 3133, stopped by
port (`lsof -ti tcp:3133 | xargs -I{} kill {}`). The gate, each step on its own exit code: `pnpm design:rules`,
`node "src/app/(dev)/design/gallery/collect-specimens.mjs"`, `pnpm typecheck`, `pnpm lint`, `pnpm test`,
`pnpm build` (with the flag unset, then `=admin`, then `=app`: three builds, all green),
`pnpm lab:smoke --base http://localhost:3133` with the flag unset (0 failing).

## Questions (what the goal leaves open; a recommended answer each; the Orchestrator relays them and quotes the answer back)

- none yet

## System-doc edits (in place, owned facts only; the Orchestrator reads each by eye)

- `docs/systems/admin-observability.md`: the deployment section (listed here when written)
- `docs/systems/architecture.md`: the two-projects paragraph (listed here when written)

## Deferred (ROADMAP one-liners, bucket named)

- none yet

## Handoff (replaces the chat report)

- Head <sha>, pushed; synced with launch-prep at <sha> (or: it had not moved)
- Gates on the synced tree, each step's own exit code, the three builds named
- Lane check: `git diff --name-only origin/launch-prep...HEAD` = owned paths + this file + the listed system docs
- The surface rules, one line per path family and surface
- The cutover runbook, exact and ordered, with what is Will's
- Proposed migrations / Worker / Vercel / Stripe / env changes: the runbook above
- Look at first: ...

## Record (one paragraph, past tense, at most eight lines; the Orchestrator fills the merge SHA)

Merged into `launch-prep` at `<sha>` (<date>). ...
