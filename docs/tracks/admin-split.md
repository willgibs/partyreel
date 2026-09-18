---
track: admin-split
status: handed-off      # open -> handed-off; deleted in the merge commit that integrates it
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

- **Does `/api/design-gate` stay reachable on the admin surface?** RECOMMENDED AND SHIPPED: yes.
  `src/app/admin/layout.tsx` mounts `AppDesignIsland`, which asks that route whether a visitor's `?key=`
  is valid before mounting the tuner and the candidate `<style>`; 404ing it would silently kill an
  affordance the portal's own layout mounts, right as the `admin` board starts drawing the portal. The
  route reads no data, echoes no secret, and is a bare 404 without a valid key. Flip it by deleting one
  line from `ADMIN_SURFACE_PREFIXES`.
- **Does `/robots.txt` stay reachable on the admin surface?** RECOMMENDED AND SHIPPED: yes. The shared
  `robots.ts` Disallows `/admin`, `/login`, `/auth` and `/api/`, which on that host is every path there
  is, so serving it is strictly safer than a 404, which crawlers read as "crawl freely". `/sitemap.xml`
  and `/manifest.webmanifest` are 404 there; nothing on the admin host references either.
- **When does `admin.partyreel.com` move, relative to `main`?** RECOMMENDED: after the milestone merge
  that puts this code on `main`, with the new project's cron jobs DISABLED from the moment it exists.
  `main` does not carry `NEXT_PUBLIC_SURFACE` in `env.ts` yet, so until the merge the variable is simply
  ignored on a production build and the new project would serve the whole app on the admin host (no
  regression, but no split either) AND register the shared cron a second time. The runbook below is
  ordered on that recommendation and says exactly where the alternative sits.
- **The admin project doubles the cost of a `[preview]` push.** RECOMMENDED: accept it this round. Both
  projects run `scripts/vercel-ignore-build.mjs` and answer identically by design (see that file's header
  for why an admin-only skip is wrong), so a `[preview]` push now builds twice. If deployment storage
  bites again, the lever is pausing the admin project's git deployments between rounds, not a smarter
  ignore rule.

## System-doc edits (in place, owned facts only; the Orchestrator reads each by eye)

- `docs/systems/admin-observability.md` "What it does": the opening sentence now says the portal is built
  from this repository by its OWN Vercel project, and points at the Perimeter invariant for the shape.
- `docs/systems/admin-observability.md` Invariants, "Keep admin auth cookies HOST-ISOLATED": one added
  clause, that two deployments do not make this safe by themselves because both talk to the one Supabase
  project.
- `docs/systems/admin-observability.md` Invariants, "Perimeter": REWRITTEN in place as "two deployments,
  one tree" with a sub-bullet per surface (the admin allow-list, the app's `/admin` 404, unset serving
  both as the rollback) and the note that both projects still build every route.
- `docs/systems/admin-observability.md` Invariants: TWO NEW bullets the split creates, "The crons run on
  the APP surface only" and "Host and preview are per PROJECT".
- `docs/systems/admin-observability.md` Backend jobs, the ★ missed-run bullet: one added clause naming
  the app surface.
- `docs/systems/architecture.md` heading: "Route groups (one app, one domain)" became "(one app, one
  repository)"; the `admin/` line in the tree names the second Vercel project.
- `docs/systems/architecture.md` "One domain is the growth loop": two added sentences naming the ops
  portal as the one deliberate exception.
- `docs/systems/architecture.md`: ONE NEW bullet, "One tree, two deployments", with why two projects and
  not two repositories, and the crons staying on the app surface.

## Deferred (ROADMAP one-liners, bucket named)

- Ops/cost: revisit the admin project's preview builds if deployment storage bites again (pause its git
  deployments between rounds; never a path-based skip in `scripts/vercel-ignore-build.mjs`).
- Ops: give the admin deployment its own Sentry project (it shares `partyreel`'s DSN today, so portal
  errors and product errors land in one stream).

## Handoff (replaces the chat report)

- **Head**: the tip of `lp/admin-split`, pushed, which is this file's own latest commit (a manifest cannot
  name the SHA it creates; `git rev-parse origin/lp/admin-split` is authoritative). The work itself is
  `dadf7981` (the code and its tests) and `5141db47` (the two system docs); the sync merge is `1e44837c`.
  Synced with `launch-prep` at **`ef044ee8`** (`git merge`, never rebase; it had moved by one docs-only
  commit, `docs/tracks/orchestrator.md`, so nothing intersected this lane).
- **Gates on the synced tree**, each step its own exit code:
  - `pnpm design:rules` exit 0 (113 components, 464 contracts, 18 policies) and
    `node "src/app/(dev)/design/gallery/collect-specimens.mjs"` exit 0 (120 specimens on 90 entries);
    **neither generator produced a diff** (the new test carries no `@policy` / `@contract-for` directive,
    so no artifact outside this lane moved).
  - `pnpm typecheck` exit 0 · `pnpm lint` exit 0 (0 errors, the 8 known warnings) · `pnpm test` exit 0
    (234 files, 2301 tests; 100 of them new).
  - `pnpm build` THREE TIMES, all exit 0, 254 pages each: **flag unset**, **`NEXT_PUBLIC_SURFACE=admin`**,
    **`NEXT_PUBLIC_SURFACE=app`**. The route table is identical in all three: the surface rule is served,
    never compiled away.
  - `pnpm lab:smoke --base http://localhost:3133` with the flag unset: exit 0, **260 checks, 0 failing**.
- **Lane check**, `git diff --name-only origin/launch-prep...HEAD`:

  ```
  .env.example
  docs/systems/admin-observability.md
  docs/systems/architecture.md
  scripts/vercel-ignore-build.mjs
  src/app/api/cron/purge/route.ts
  src/lib/auth/admin-context.ts
  src/lib/surface/index.ts
  src/lib/surface/surface.test.ts
  src/proxy.ts
  ```

  Owned paths + the two listed system docs, with ONE exception to rule on: **`.env.example`** is not under
  `owns` and cannot be (the lane guard refuses a single-segment claim). It is there because the cut left
  `pnpm test` RED: `src/lib/env-example-parity.test.ts` had wanted `NEXT_PUBLIC_SURFACE` in the template
  since the variable landed in `env.ts` at `40a26a55`. The change is one comment line and one blank key.
- **The surface rules, one line per path family and surface** (`src/lib/surface/index.ts` is the only
  source; `decideBySurface` is what the proxy calls):

  | path family | `=admin` | `=app` | unset |
  | --- | --- | --- | --- |
  | `/admin`, `/admin/*` (incl. its Server Actions) | serve | **404** (rewrite) | serve |
  | `/` | **307 to `/admin`** | serve (marketing home) | 307 to `/admin` only on the admin Host, as today |
  | `/login`, `/auth/*` | serve | serve | serve |
  | `/api/cron/*` | serve, and the route answers `skipped: not_this_surface` | serve and RUN | serve and RUN |
  | `/api/design-gate` | serve (keyless is still the route's own 404) | serve | serve |
  | `/robots.txt` | serve | serve | serve |
  | `/sitemap.xml`, `/manifest.webmanifest`, `/llms*.txt` | **404** | serve | serve |
  | marketing (`/pricing`, `/features`, `/help/*`, …) | **404** | serve | serve |
  | host app (`/dashboard*`, `/account`, `/welcome`) | **404** | serve | serve |
  | guest (`/e/*`, `/u/*`) | **404** | serve | serve |
  | the lab (`/design`, `/design/*`) | **404** | serve (key gate unchanged) | serve |
  | every other `/api/*` (stripe, guests, r2, internal, export, reports, me) | **404** | serve | serve |
  | `/_next/*`, `/_vercel/*`, image files | serve (matcher skips them) | serve | serve |

  A 404 above is a REWRITE to `/surface/not-served`, a path no route serves, so Next renders the root
  not-found under a real 404: the same answer a mistyped URL gets. `/administrators` is not `/admin`
  (segment matching, pinned by a test).
- **Verified locally**, dev server on port 3133 only, stopped by port between runs:
  - `=admin` with `Host: admin.partyreel.com`: `/` 307, `/admin` 307 (to `/login?next=/admin`, so the
    portal and therefore the AAL1 enrolment screen stay reachable), `/admin/jobs` 307, `/login` 200,
    `/auth/callback` 307, `/robots.txt` 200, `/api/design-gate?key=…` 200. 404: `/pricing`, `/dashboard`,
    `/design`, `/design/library`, `/e/abc`, `/api/guests`, `/api/stripe/webhook`, `/api/internal/job-run`,
    `/sitemap.xml`, `/manifest.webmanifest`, `/llms.txt`.
  - `=app`: `/admin` and `/admin/jobs` 404 on BOTH `Host: localhost` and `Host: admin.partyreel.com`;
    `/pricing` 200, `/dashboard` 307, `/design` 307, `/robots.txt` 200, `/sitemap.xml` 200. On the admin
    Host, `/` serves the marketing home rather than redirecting into a 404.
  - unset: identical to before the split (admin Host `/` 307, `/admin` 307, `/login` 200; localhost
    `/admin` 404 via the existing host guard, `/pricing` 200, `/design/library` 200).
  - **The cron, with the secret from `.env.local` (never printed).** `=admin`: unauthenticated 401,
    authenticated `{"ok":true,"skipped":true,"reason":"not_this_surface"}`. `=app` and unset:
    unauthenticated 401, authenticated a full run, every sweep zero (nothing was due; the real 04:48 UTC
    cron had already run). **The proof is in the database**: `job_runs` gained exactly the runs the app
    surface made and NOTHING from the admin-surface call, so the admin deployment writes no heartbeat.
- **The cutover runbook.** Ordered. Everything is the Orchestrator's except step 5, which is Will's.
  - **Precondition.** This track merged into `launch-prep`. Team `team_ht9qAVBQVZf60dpGNJUwmaj5`
    (P3 Partyreel Team); the existing project is `prj_9jMOBYmlxMtjNOuWXthVIcwAjWaB` (`partyreel`, Next.js,
    Node 24.x, region `iad1`, root directory the repo root, production branch `main`, no build/install
    overrides, `ignoreCommand` from `vercel.json`).
  1. **Create the project.** A new Vercel project on the SAME repo `willgibs/partyreel`, named
     `partyreel-admin`: framework Next.js, root directory the repo root, production branch `main`,
     region `iad1`, Node 24.x. Nothing is copied but the settings above; `vercel.json` carries the build
     behaviour. (REST: `POST /v11/projects?teamId=…` with
     `{"name":"partyreel-admin","framework":"nextjs","gitRepository":{"type":"github","repo":"willgibs/partyreel"}}`.)
  2. **Disable that project's cron jobs immediately** (Settings → Cron Jobs; the project object's
     `crons.disabledAt`). `vercel.json` is one file in one repo, so this project registers
     `/api/cron/purge` too. The code guard makes the admin deployment answer and stop, but only on a
     branch that CARRIES the guard, and `main` does not until step 7. This toggle is what prevents two
     purges a day in the meantime, and leaving it off afterwards costs nothing (recommended: leave it
     disabled, and let the code guard be the backstop for a project someone recreates without it).
  3. **Set the admin project's env** (`POST /v10/projects/partyreel-admin/env?upsert=true`, team-scoped;
     values copied from `partyreel`, never printed). Production AND preview unless noted.
     - Same values as `partyreel`: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`,
       `SUPABASE_SECRET_KEY`; `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET`
       (forensics presigns and the albums/reports review URLs); `STRIPE_SECRET_KEY`,
       `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_PRO_100`, `STRIPE_PRICE_PRO_500`, `STRIPE_PRICE_PRO_2TB`
       (**all five**, because `src/lib/stripe/client.ts` calls `assertStripeEnv()` all-or-nothing and
       `/admin/metrics` reads live revenue); `CRON_SECRET` (so the shared cron route authenticates
       instead of answering 500 daily); `NEXT_PUBLIC_SENTRY_DSN` plus the build-time `SENTRY_AUTH_TOKEN`,
       `SENTRY_ORG`, `SENTRY_PROJECT`; `DESIGN_PREVIEW_KEY` (the probe the portal's island calls).
     - `NEXT_PUBLIC_SITE_URL`: production `https://partyreel.com`, preview the APP project's
       `launch-prep` alias. Absolute links from the portal point at the product, which is the app surface.
     - `NEXT_PUBLIC_SURFACE` = `admin`, production and preview. This one variable is the split.
     - `NEXT_PUBLIC_ADMIN_HOST`: production `admin.partyreel.com`; preview THIS project's own
       `launch-prep` alias host (expect `partyreel-admin-git-launch-prep-partyreel.vercel.app`, but
       CONFIRM it from the first preview deployment, since Vercel truncates long names).
     - Deliberately NOT set: `RESEND_API_KEY`, `EMAIL_FROM`, `CONTACT_NOTIFY_EMAIL` (the portal sends no
       mail), `PRUNE_API_SECRET`, `UNLOCK_COOKIE_SECRET` (their routes are app-surface and 404 here),
       `NEXT_PUBLIC_DEMO_QR_TOKEN` (marketing), `EXPORT_SIGNING_SECRET` / `EXPORT_WORKER_URL`
       (`/admin/exports` only reads the DB and the kill switch; add them the day an admin surface mints
       an export).
  4. **Set `NEXT_PUBLIC_SURFACE=app` on `partyreel`**, production and preview. Inert until this code
     reaches that branch, correct after.
  5. **WILL'S STEP, in the Supabase dashboard** (Authentication → URL Configuration → Redirect URLs): add
     the NEW project's preview callback, `https://<the alias confirmed in step 3>/auth/callback`.
     `https://admin.partyreel.com/auth/callback` is already allow-listed and does not move. Query-free
     entries only (the R1 gotcha: a non-wildcard entry never matches a query-bearing URL).
  6. **Prove it on previews, before any domain moves.** Push `launch-prep` with `[preview]` so both
     projects build, then red-team the new project's alias: the allow-list table above, and a real
     account-chooser sign-in plus MFA step-up on that preview host. Production is untouched at this point,
     so this step is free to fail.
  7. **The milestone merge to `main`** carrying this code. Until it lands, `NEXT_PUBLIC_SURFACE` is not in
     `main`'s `env.ts` and production ignores it.
  8. **Move the domain.** Remove `admin.partyreel.com` from `partyreel`, then add it to
     `partyreel-admin` (Vercel refuses one domain on two projects, so removal comes first). DNS is
     unchanged, both are Vercel-hosted; expect well under a minute of 404s on the admin host in between.
     (REST: `DELETE /v9/projects/partyreel/domains/admin.partyreel.com`, then
     `POST /v10/projects/partyreel-admin/domains` with `{"name":"admin.partyreel.com"}`.)
  9. **The checks**, in order:
     a. `partyreel-admin` production READY, and `https://admin.partyreel.com/admin` serves the portal
        (307 to `/login` signed out).
     b. `https://partyreel.com/admin` and `/admin/jobs` → 404. The apex otherwise untouched: `/` and
        `/pricing` 200, `/dashboard` still gates, a real `/e/<qr_token>` guest link still loads.
     c. On the admin host, 404 for `/pricing`, `/dashboard`, `/design/library`, `/e/<token>`,
        `/api/stripe/webhook`, `/sitemap.xml`; `/` → 307 to `/admin`; `/robots.txt` → 200.
     d. `https://partyreel-admin.vercel.app/admin` → 404 (the host guard still refuses any host that is
        not `NEXT_PUBLIC_ADMIN_HOST`).
     e. Sign in at `https://admin.partyreel.com/login` through the account CHOOSER (`partyr33l@gmail.com`,
        never a typed password or OTP) and complete the MFA step-up onto `/admin`. Then confirm the
        cookies stayed host-isolated: the apex session is unchanged and signing out of one does not sign
        out of the other.
     f. After the next 04:00 UTC: `select started_at, triggered_by, status from job_runs where job =
        'purge_cron' order by started_at desc limit 5` shows exactly ONE row for that day, and
        `/admin/jobs` reads the purge healthy.
     g. The pages that prove the env landed: `/admin/metrics` renders revenue (all five Stripe vars),
        `/admin/albums` renders thumbnails (R2), `/admin/forensics` loads.
  10. **Reversibility.**
      - **One variable, no code change:** delete `NEXT_PUBLIC_SURFACE` on either project and redeploy.
        That project serves both surfaces again, exactly as before the split. This undoes the whole
        behaviour change in both directions.
      - **The domain:** move `admin.partyreel.com` back to `partyreel` the same way (remove, then add).
        DNS unchanged.
      - **The project:** `partyreel-admin` is safe to delete once the domain is back; nothing references
        it. Its crons toggle is reversible on its own.
      - **Nothing in this track is one-way.** No migration, no Worker, no Stripe object, no schema, no
        data. The only irreversible act in the runbook is deleting a Vercel project, which is step 10's
        last resort and not part of the cutover.
- **Proposed migrations / Worker / Vercel / Stripe / env changes:** the runbook above is the whole set.
  No migration, no Worker, no Stripe change. `src/lib/env.ts` needs NOTHING: `NEXT_PUBLIC_SURFACE` landed
  at the cut with the right shape (optional, `"app" | "admin"`, unset = both). `vercel.json` is unchanged
  and should stay unchanged: its one cron is correct for the app project and neutered by code on the
  admin one. **Proposed and deliberately NOT shipped:** a path-based skip in
  `scripts/vercel-ignore-build.mjs` that would spare the admin project a build when a push names no
  `/admin` path. It is wrong and the reason is now written into that file's header: the portal renders
  the shared tokens, components, auth seam and db layer, so a push that names no `/admin` path still
  changes what the admin serves, and a skipped build would leave the two deployments on different commits
  with nothing saying so.
- **Look at first:** `src/lib/surface/index.ts`, top to bottom. It is the whole rule in one pure file,
  and the five entries in `ADMIN_SURFACE_PREFIXES` plus the two in `EXACT_ADMIN_PATHS` ARE the allow-list
  the admin host will serve. If one of those seven is wrong, that is the thing to change, and every other
  file in this track follows it. Then the two Questions above about `/api/design-gate` and `/robots.txt`,
  which are the two entries a reasonable person could disagree with.

## Record (one paragraph, past tense, at most eight lines; the Orchestrator fills the merge SHA)

Merged into `launch-prep` at `<sha>` (2026-09-18). The admin became its own deployment without leaving the
tree: one pure module, `src/lib/surface`, answers "which surface is this build", and the proxy, the
`requireAdmin` seam and the purge cron all decide from it. The proxy applies it before every other rule,
so the admin surface serves an allow-list (the portal, sign-in, MFA, the cron route, the probe its own
layout calls) and rewrites the rest to a real 404, while the app surface 404s `/admin` whatever the Host
says; unset serves both as before, which is the entire rollback. The cron answers and stops on the admin
surface, since one `vercel.json` registers it on both projects, and the database showed that call writing
no heartbeat. The ignore script stayed identical on both projects, its reason written into its header.
