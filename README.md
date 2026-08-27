# Partyreel

Guest-powered event media. A host creates an event and shares a QR code; guests
scan it and upload photos/videos straight from their phones — **no app, no
account**. Uploads land live in the host's gallery; the host curates, and the same
link doubles as the shareable album. Every QR is an ad for the next host.

> **Status:** the full product is **built and live** (`partyreel.com`) with zero real users
> (Stripe TEST mode) — **pre-launch continuous elevation** on the `launch-prep` branch under the
> active program. See [`docs/STATUS.md`](docs/STATUS.md) for where things stand and
> [`docs/PROGRAM.md`](docs/PROGRAM.md) for the program's rules.

## Start here

| If you want to…                            | Read                                       |
| ------------------------------------------ | ------------------------------------------ |
| Know the current state + what's blocked    | [`docs/STATUS.md`](docs/STATUS.md)         |
| Work in this repo (agent operating guide)  | [`CLAUDE.md`](CLAUDE.md)                    |
| The active program's roles + protocol      | [`docs/PROGRAM.md`](docs/PROGRAM.md)       |
| Find what exists + its invariants          | [`docs/SYSTEMS.md`](docs/SYSTEMS.md) → [`docs/systems/`](docs/systems) |
| See what might be next (provisional)       | [`docs/ROADMAP.md`](docs/ROADMAP.md)       |
| See what shipped, when                     | [`docs/CHANGELOG.md`](docs/CHANGELOG.md)   |
| Understand the product / pricing           | [`docs/PRD.md`](docs/PRD.md) · [`docs/PRICING.md`](docs/PRICING.md) |
| Understand a key technical decision        | [`docs/adr/`](docs/adr/)                   |

## Local development

```bash
pnpm install
cp .env.example .env.local   # then fill in (see src/lib/env.ts for the schema)
pnpm dev                     # http://localhost:3000
```

Useful scripts:

```bash
pnpm typecheck     # next typegen + tsc --noEmit
pnpm lint          # eslint
pnpm test          # vitest run
pnpm format        # prettier on your CHANGED files only (never `prettier --write .` — see CLAUDE.md)
pnpm db:types      # regenerate src/lib/db/types.ts from the linked Supabase project
```

> Note: sign-in, upload, and checkout can't complete on `localhost` (it's deliberately not in any
> allow-list) — verify live on the `launch-prep` preview alias between milestones (`partyreel.com`
> at milestone merges). See [`CLAUDE.md`](CLAUDE.md) "Local dev vs. live testing".

## Stack

Next.js 16 (App Router) · React 19 · Tailwind CSS v4 · shadcn/ui · Supabase
(Postgres + RLS) · Cloudflare R2 (storage) · Stripe (billing) · Resend (email) · Sentry.
Pinned versions and the per-library gotchas that matter live in [`CLAUDE.md`](CLAUDE.md).
