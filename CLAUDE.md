@AGENTS.md

# Partyreel — agent operating guide

> Loaded into every session, so it holds only the product, the roles, the working loop, the must-knows and a map;
> everything else is opened when a task touches it.

Partyreel is a guest-powered event media platform: a host creates an event and shares a **QR code**; guests scan it
and upload photos and videos from their phones with no app required (an account, and a confirmed email, when the host
asks for one); the host curates; the link doubles as the shareable album. It is live at partyreel.com with zero real
users (Stripe in TEST mode, the launch switches unspent), in the **elevation program** ([`docs/PROGRAM.md`](docs/PROGRAM.md)).

**Rising tides** (the bible, `/design/library`, which only Will changes): the whole platform is the goal, nothing is
protected or finished, and relitigating any decision for a better answer is welcome. Will's pick in an exploration
is the best of what was drawn, never the perfect answer or a rule: what ships is a working version, and a new
exploration ignores how we got here and hunts for the perfect solution, improving on it or trying something new.

## Sessions & roles

Every top-level session is an **Agent** unless Will's first prompt designates it **the Orchestrator** (at most one, in
the repo root; it alone merges, applies migrations, deploys and mutates service config). An Agent runs one lane in its
own worktree, from a manifest that is its whole init and handoff ([`docs/PROGRAM.md`](docs/PROGRAM.md) "Agent boot"),
and never edits or commits in the repo root.

## Where to look (open a doc only when the task touches it)

| Doing | Read |
| --- | --- |
| UI or design | production, and the Library at `/design/library`: the brand kit, the component catalog, the bible's ten |
| A lab board | [`docs/PROGRAM.md`](docs/PROGRAM.md) "A round returns DECISIONS" |
| A system's code | [`docs/SYSTEMS.md`](docs/SYSTEMS.md) → its `docs/systems/<x>.md` (invariants, ★ landmines) |
| SQL, RLS, grants, a migration | [`docs/systems/database-security.md`](docs/systems/database-security.md) |
| Live verification, test accounts | [`docs/systems/testing-verification.md`](docs/systems/testing-verification.md) |
| Product vision, pricing | [`docs/PRD.md`](docs/PRD.md), [`docs/PRICING.md`](docs/PRICING.md) |
| Where things stand, service ids | [`docs/STATUS.md`](docs/STATUS.md) |
| Open lanes · what might be next · asset asks | [`docs/tracks/`](docs/tracks) · [`docs/ROADMAP.md`](docs/ROADMAP.md) · [`docs/ASSETS.md`](docs/ASSETS.md) |
| What shipped | `git log` (each merge commit carries its lane's summary) |
| Orchestrating | [`docs/tracks/orchestrator.md`](docs/tracks/orchestrator.md), then [`usher/kit/README.md`](usher/kit/README.md) by task |

A system doc (what exists) wins over the ROADMAP (what might be).

## The working loop

1. **Orient**: your manifest (the Orchestrator: its pickup), then only what the task touches.
2. **Doc-check** each library you touch against its current docs (Context7): this stack drifts in ways that look like
   your code is wrong.
3. **Plan, asking hard**: surface every open product, UX or scope decision before building. A lane writes each under
   its manifest's Questions with a recommended answer, builds that answer and lists it as Will's to overrule; a
   one-way door is never guessed: it is written as a question and the lane hands off what it has. The expensive
   failure is a confident agent executing the wrong strategy.
4. **Build** from the brand kit, the bible's ten and production. The tests are the real rules: a failing one names
   what broke, and one reshaped on purpose keeps its real scar, drops its expired reason and says which. Leave
   WHY-comments.
5. **Test**: Vitest for pure logic; a rolled-back Supabase-MCP check for new SQL; the gate.
6. **Verify antagonistically**: force the error cases, the cross-tenant and abuse paths, malformed input; local first,
   then live (below).
7. **Commit and hand off** on your own `lp/<track>` the moment the gate is green.
8. **Record subtractively**: a fact inside your lane refined in place in its `docs/systems/` doc (listed in the
   manifest), and the manifest's Deferred lines; nothing else.

Clarify hard up front, then execute boldly; stop only for a genuinely new decision.

## The gate and git

The gate, each step on its own exit code: `pnpm typecheck`, `pnpm lint` (a warning in a file you touched is yours),
`pnpm test`, `pnpm build`, then `pnpm lab:smoke --base <your dev server>` and, for a board,
`pnpm lab:demo --board <id> --base <your dev server>`. Typecheck, lint and test before every commit; the whole gate
before a handoff. CI is not the gate.

An Agent commits only to its own `lp/<track>`. Stage explicitly, never `git add -A`; never `--no-verify`, a force-push
or an amend of a pushed commit; never a secret. Every commit ends with the `Co-Authored-By` trailer naming the model
actually running.

## Security guardrails (non-negotiable)

- RLS is the security boundary: every Server Function and route handler re-verifies with `supabase.auth.getUser()`,
  never `getSession()` (the proxy refreshes cookies and is no boundary), AND relies on RLS or SECURITY DEFINER RPCs
  ([database-security.md](docs/systems/database-security.md)). Anonymous guests use capability tokens validated inside
  those RPCs; `anon` never gets direct table access; the service-role key is server-only.
- ★ A function created through the Supabase MCP inherits an `anon` EXECUTE grant that a bare `revoke … from public`
  leaves in place: revoke it from `anon` explicitly unless guests must call it.
- ★ Host table writes are COLUMN-locked: revoke at the table level first, then re-grant the legitimate columns.
- ★ Never expose raw R2 keys or URLs to the browser; presign server-side
  ([uploads-and-r2.md](docs/systems/uploads-and-r2.md)).
- ★ Never trust the client for tier or entitlements: the Stripe webhook is the sole writer of `profiles.tier` and
  `storage_cap_bytes` ([billing-caps.md](docs/systems/billing-caps.md)). Before any Stripe MCP work, confirm
  `livemode` is false (`list_available_accounts_or_orgs`).
- Events have no end date; deletion is the only lifecycle exit (the anti-abuse core).

## Project traps

- ★ PostgREST cuts every read at 1,000 rows, silently: read whole with `readAllPages`, chunk id lists with `inChunks`,
  count with `head: true` (`src/lib/db/read-all.ts`).
- Schema changes are SQL files in `supabase/migrations/`: a lane writes one; the Orchestrator applies it through the
  Supabase MCP (there is no CLI) and regenerates `src/lib/db/types.ts`, which is never hand-edited.
- One home per single source: `src/lib/constants/tiers.ts` (pricing and tier limits, mirrored by `public.tier_limits()`
  under a parity test), `src/lib/media/limits.ts` (per-file media limits), `src/lib/r2/keys.ts` (object keys),
  `src/lib/r2/delete.ts` (bulk delete and list), `src/lib/db/*` (all DB access; no SQL in components),
  `src/lib/supabase/*` (the clients), `src/lib/env.ts`, `src/lib/utils.ts` (`cn()`).
- A new secret goes in `.env.local`, the Vercel env (NON-sensitive until launch; a lane proposes it in its Handoff) and
  `src/lib/env.ts` (zod, `.optional()` with a lazy `assert*Env()`).
- A backend job ships its `/admin` management and health signal in the same change: zero silent failures.
- `pnpm format` formats only your changed files (prettier over the whole repo mangles dynamic classNames). When a CSS
  edit does not show in `pnpm dev`, `rm -rf .next/dev`.

## Local dev vs. live testing

Local first: `pnpm dev` with `.env.local` runs every route, RPC and query against the real Supabase and R2. The
allow-list-gated flows (sign-in, upload, email round-trips, checkout) cannot run on localhost: for those, and a final
adversarial pass, drive Chrome against the `launch-prep` alias, allow-listed like prod
(`https://partyreel-git-launch-prep-partyreel.vercel.app`). Never skip or silently downgrade the live red-team (a
lab-only round is the one carve-out). Sign in through the Google account CHOOSER (`willg97@gmail.com` host,
`partyr33l@gmail.com` admin); never type a password or an OTP. Live and DB testing is expected, with disposable test
data only. Will is a targeted instrument for what you cannot drive (a file upload, a password, a logged-out flow):
stage it, hand him the smallest action, resume; a result that smells non-human gets his 10-second look before more
tooling. The lab's `?key=` is a light guard, not a secret (it may appear in a log, a URL or a chat; the value is
`DESIGN_PREVIEW_KEY` in `.env.local`), and a local `next dev` accepts any key.

## Keeping the docs healthy

A doc carries only what a strong model cannot find or infer (Will): never a framework or platform rule that current
docs give, a design rule that production or the Library shows, or a decision's history. Every change passes the
Orchestrator's review and design passes the lab, so rules stay few. **Every fact has one home**, the doc whose
question it answers, **edited in place, never appended**: a stale line is deleted, a shipped narrative goes in the
merge commit, a deferred task is one ROADMAP line; nothing under `docs/` is history. Every added line dilutes the
rest: a one-off mistake is fixed and left in git, and only a recurring one becomes a written rule or a tool's refusal,
encoded by its shape. A new gotcha goes in its `docs/systems/` doc, never here.
