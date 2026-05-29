# Partyreel

Guest-powered event media. A host creates an event and shares a QR code; guests
scan it and upload photos/videos straight from their phones — **no app, no
account**, just a display name. Uploads land live in the host's gallery; the
host curates and shares a public album. Every QR is an ad for the next host.

> **Status:** Phase 0 (foundation) complete — deployable skeleton, full database
> schema + RLS, and agent docs. No end-user features ship yet. See
> [`docs/STATUS.md`](docs/STATUS.md) for what's next.

## Start here

| If you want to…                           | Read                                 |
| ----------------------------------------- | ------------------------------------ |
| Know the current state + next action      | [`docs/STATUS.md`](docs/STATUS.md)   |
| Work in this repo (agent operating guide) | [`CLAUDE.md`](CLAUDE.md)             |
| Understand the product                    | [`docs/PRD.md`](docs/PRD.md)         |
| See the phased plan                       | [`docs/ROADMAP.md`](docs/ROADMAP.md) |
| Understand a key technical decision       | [`docs/adr/`](docs/adr/)             |

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
pnpm format        # prettier --write .
pnpm db:types      # regenerate src/lib/db/types.ts from the linked Supabase project
```

## Stack

Next.js 16 (App Router) · React 19 · Tailwind CSS v4 · shadcn/ui · Supabase
(Postgres + RLS) · Cloudflare R2 (storage) · Stripe (billing). Pinned versions
and the per-library gotchas that matter live in [`CLAUDE.md`](CLAUDE.md).
