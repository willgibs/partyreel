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
the record is two rounds deep and a test holds it, the 26 integrated manifests are gone, the 25 ADRs
are folded into the system docs and every citation names the doc (`d4ec4cff`, `aea90fd3`); the
Library's record pages and `docs/decisions/design-record.md` are gone (git keeps them); the four heavy
system docs are stripped and every ★ audited (`0a48db70`). Round 2 is closed on the tree. **The wind-down** (Will, mid-sitting): every board's favourites land in the Library as working versions
and the board retires; a later exploration branches from an entry, never from an unselected board; the one
exploration still owed is the home hero's stream catalog before its wiring. **Round 3, the Library as the complete inventory**
(components, marketing sections and app screens with live previews, tokens; a review surface with
keep / redesign / retire on every entry). **Round 4, the six paper boards rebuilt as catalogs**
(brand-voice, type-scale, floating-surfaces, light, rounding, media-kit): cut at `385cfa99` on Will's
answer that all six are rebuilt before any review, and closed on the tree the same day, every board
under its declared reading budget (1,151 to 2,889 words, from 4,220 to 15,004).

| track | returns | state |
| --- | --- | --- |
| `lab-catalog` | the review's item scope (`item:<id>=keep\|refine\|kill "note"`), `Catalog`, `ItemVerdictRow`, `CompareTwo`, `SpotCompare`, the reading budget in `pnpm lab:smoke`, `pnpm new-board` scaffolding a catalog, `/design/lab/kit` as the toolbox, the palette rebuilt on the kit as the proof | integrated at `57b93286`; the palette verified on the desk |
| `lab-sweep` | every lab page walked at 1440 and 375 and fixed in the shell; plain-English labels | integrated at `88dafe50` (the dev indicator moved and the lab functions' file trace cut from 2,248 to 718 files behind it) |
| `docs-systems-strip` | the four heavy system docs stripped to the system and its invariants, every ★ audited | integrated at `0a48db70` |
| `brand-voice` | Round 4 catalog: six voices as cards, twenty-four real spots drawn twice under any two | integrated at `5868325e` |
| `type-scale` | Round 4 catalog: five ladders as type specimens at true pixels, two on the same real page | integrated at `257df8fe`, 1,155 words under the budget |
| `floating-surfaces` | Round 4 catalog: seven directions as cards on the app's dark over the album, the desk under two | integrated at `767e6182`, 2,317 words against a declared 2,400 |
| `light` | Round 4 catalog: the twelve treatments as cards on the real surfaces at true size, the aurora's landing as a two-way compare | integrated at `2326a924`, 2,889 words against a declared 2,950 |
| `rounding` | Round 4 catalog: six families as cards at true size, two on one real page | integrated at `128aca34`, 2,564 words against a declared 2,800 |
| `media-kit` | Round 4 catalog: thirteen sources as cards with their contact sheets at the real card size | integrated at `8587d3ed`, 2,686 words against a declared 2,750 |
| `palette` (round seven) | nine cool palettes and three controls, one optional accent per palette behind a switch, every card on a colourful mix of photographs | integrated at `5a538c0a`, 2,924 words against a declared 2,950; ready for the sitting |
| `home-hero` (round six) | three or four polished stream treatments on the ruled hero, the last exploration before its wiring | building |

Round 1 is closed on the tree (both lanes integrated, the verification list walked on the dev server);
Will's first review with per-item verdicts is the palette catalog plus the six rebuilt boards, on the
desk, once Round 4 lands. The reading budget (1,200 words outside every closed fold,
specimen and paste, or a spec's declared budget with its reason) is met by the six rebuilt boards and
by type-scale outright; the six boards not yet rebuilt (the palette at 3,817, the two glow boards, the
home hero, the album hero, the river) still fail it on purpose, and `pnpm lab:smoke` reports the routes
and the budget apart.

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
Next from him: the sitting on the desk (the palette and the six rebuilt boards, keep
/ refine / kill and a note per item, one line to paste), and three questions the boards carry
(brand-voice: one voice everywhere at three volumes, or two voices; whether bible 20 means the naming or
the shape; type-scale: the compared pair side by side scrolling sideways at 1440, or the kit's wipe; floating-surfaces:
seven cards or the four named, and the menu ground photograph, asset row 14; light: the grain tile and the
worst-case overlap pair, rows 15 and 16; rounding: six families or the four named). One product bug waits for
the wiring round: every nested submenu paints nothing (`ui/dropdown-menu.tsx`'s `SubContent` has no portal).
The launch-gated tasks are the ROADMAP's Launch checkpoint (`[human]` / `[eng]` / `[content]`).
