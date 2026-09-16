# Partyreel — Status (you-are-here)

> ROLE: the live snapshot: the era, the current round and the one before, live state, infrastructure,
> what waits on Will. BELONGS HERE: what is true right now. · NOT HERE: the rules (→ [`PROGRAM.md`](PROGRAM.md)),
> what shipped (→ [`CHANGELOG.md`](CHANGELOG.md), two rounds deep), how systems work (→ [`systems/`](systems)),
> what might be next (→ [`ROADMAP.md`](ROADMAP.md)). GROWS BY: being replaced at every round close.

**Updated:** 2026-09-16

## The era

Partyreel is in pre-launch continuous elevation: the full product is built and live at partyreel.com with
zero real users, Stripe in TEST mode, and the launch switches deliberately unspent (they accrete in
[`ROADMAP.md`](ROADMAP.md) → Launch checkpoint). The elevation program ([`PROGRAM.md`](PROGRAM.md)) is the
only active thread: work rides `launch-prep` in rounds, each a catalog in the lab, Will's verdicts on the
desk, then the wiring; partyreel.com changes only at tagged milestone merges. The goal for this stretch
(Will, 2026-09-14): every page reaches a cohesive informational flow and every point of the design system,
the marketing site and the app is elevated platform-wide; nothing is protected.

## The current round: the revamp (opened 2026-09-16 at `5cdebfe0`)

Will found the lab "super broken" on localhost (a browser holding an old copy of the lab's stylesheet, plus
two real gaps: a pick that could not be unpicked, 1:1 canvases boxed in a centred column) and the
explorations turning into research papers. The plan he approved runs four rounds, each opening with its own
short planning pass: **Round 1, the lab** (in flight): the stale-stylesheet guard, one toggle rule for every
pick, edge-to-edge canvases and the catalog's shared types landed at `5cdebfe0`; two lanes cut at `28d1aa95`.
**Round 2, the docs diet and the track protocol** (the Orchestrator's): the protocol part landed (PROGRAM.md
is the loop, CLAUDE.md is 150 lines, the one-round manifest template, a manifest deleted at its merge),
the record is two rounds deep and a test holds it, the 26 integrated manifests are gone; the ADR fold
runs as the `docs-adr-fold` lane; the record pages and the systems-doc strip wait for the lab lanes. **Round 3, the Library as the complete inventory**
(components, marketing sections and app screens with live previews, tokens; a review surface with
keep / redesign / retire on every entry). **Round 4, the six paper boards rebuilt as catalogs**
(brand-voice, type-scale, floating-surfaces, light, rounding, media-kit), cut once Will has walked the
palette catalog.

| track | returns | state |
| --- | --- | --- |
| `lab-catalog` | the review's item scope (`item:<id>=keep\|refine\|kill "note"`), `Catalog`, `ItemVerdictRow`, `CompareTwo`, `SpotCompare`, the reading budget in `pnpm lab:smoke`, `pnpm new-board` scaffolding a catalog, `/design/lab/kit` as the toolbox, the palette rebuilt on the kit as the proof | building |
| `lab-sweep` | every lab page walked at 1440 and 375 and fixed in the shell; plain-English labels | integrated at `88dafe50` (the dev indicator moved and the lab functions' file trace cut from 2,248 to 718 files behind it) |

What closes it: both lanes integrated, the walk of Round 1's verification list on a hard-reloaded dev
server, Will's walk of the palette catalog (his first review with per-item verdicts), the six catalog
briefs cut from what he says.

## The previous round: the clarity round (2026-09-15 to 16, `be1638f2` to `1165e503`)

Will's first review through the desk answered three light asks and marked two not clear because the
questions were labels with token options; every ask on the twelve boards was rewritten as a question a
stranger can answer beside its evidence, `?` became an answer, the answering moved onto the board
(`?session=`), and the palette board became the first catalog. Eleven tracks integrated; the CHANGELOG's
entry "The Library x Lab round, Phase 3 opens as the clarity round" is the record.

## Live state

- **Prod (partyreel.com)** = `main` @ tag `milestone-24` (`592da24`). **The `launch-prep` alias**
  (`https://partyreel-git-launch-prep-partyreel.vercel.app`) still serves the Library x Lab round's Phase 1
  (`a0ef9867`): every later `[preview]` push was refused by Vercel's daily cap (100 deployments per trailing
  day, every path counted; canceled deployments register, builds do not). After 2026-09-17 00:13 UTC an
  empty `[preview]` commit on `launch-prep` rebuilds it (the API path stays the fallback), then
  `pnpm lab:smoke --production --key <DESIGN_PREVIEW_KEY>` and the prune. Until then every review is a local
  `pnpm dev` after a hard reload (the lab's chrome reloads a stale sheet once on its own).
- **Data:** disposable test data only (3 profiles / 3 events / about 16 media rows); the accounts and
  fixtures are in [`systems/testing-verification.md`](systems/testing-verification.md).
- **Tests:** 2198 green (`pnpm test`); the gate is typecheck + lint + test + build, run locally (CI runs on
  `main` and `launch-prep` code pushes only; an `lp/*` push only on `[ci]`).
- **Jobs:** the daily purge cron, the media-backup Worker and the daily DB-backup GitHub Action (about
  06:30 UTC) are live; the deletion-aware backup prune ships in dry-run (`PRUNE_MODE=live` is a launch flip).
- **The repo is public for the interim** (Will, 2026-09-15, after twelve tracks spent the month's private
  GitHub Actions minutes in two days); it goes back to private when the budget clears.

## Infrastructure

All backing services run under the owner account **partyr33l@gmail.com ("P3")**: **Supabase** project
`ddafaemglzmuekbtjwzn` (Pro; daily backups on; the public `avatars` bucket; the MCP may be connected
read-only, so re-auth with the DB scope or use the dashboard SQL editor when a DB tool answers `permission`);
**Cloudflare R2** account `8bd90d2f6a374d6cdff2f379e929b060`, buckets `partyreel` (primary, ENAM) and
`partyreel-backup` (Bucket-Locked, WNAM); **Stripe** `acct_1TcStrPtjqmVkBwk` (TEST; the live cutover is a
launch task); **Sentry** org `partyreel`; **Resend** (`partyreel.com` verified; auth email rides Resend SMTP);
**Google OAuth** P3 web client; the in-app operator `partyr33l@gmail.com` (`is_admin` + TOTP MFA); **Vercel**
on the P3 team (Hobby; the Pro cutover, DNS to Cloudflare and the repo transfer are launch-time cutovers).
"Allow new signups" stays ON (account-from-guest and email+password create depend on it; anonymous sign-ins
stay OFF). Already configured, never redo: the R2 buckets, creds, CORS and abort-multipart lifecycle rule;
the apex domain; `CRON_SECRET`; `profiles.is_admin`; the Stripe TEST products, prices, webhook, Billing
Portal and its ten env values; Supabase TOTP MFA with `admin.partyreel.com/auth/callback` in the redirect
allow-list and `NEXT_PUBLIC_ADMIN_HOST` (break-glass: delete the TOTP factor in `auth.mfa_factors`); the
Sentry project, DSN and its four env vars; the media-backup Worker and the DB-backup Action secrets; the
prune crons and the shared `PRUNE_API_SECRET`.

## Waiting on Will

The desk derives the asks and the items (`/design/lab?key=`); the assets are in [`ASSETS.md`](ASSETS.md).
Next from him: a walk of the palette catalog once `lab-catalog` integrates (keep / refine / kill and a note
per palette, one line to paste), then the questions that shape the six catalog briefs, asked in chat. The
launch-gated tasks are the ROADMAP's Launch checkpoint (`[human]` / `[eng]` / `[content]`).
