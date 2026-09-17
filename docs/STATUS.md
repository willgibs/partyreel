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

## The current round: the stepped review round (opened 2026-09-16 at `02c409b4`; every board integrated at `dd77fc9e`)

Will stopped his first per-item sitting on the round-four catalogs ("the review process favors you and
makes me spend tons of time per track figuring what I'm even being asked") and asked for every open track
to run one more round shaping its previews for a question-based review. His steer binds from here: the end
goal is the product, fast iterative rounds beat slow meticulous ones for design, HTML and CSS is shaping
rather than QA, the lab is a means. The round ran in one day: the spec fields, then `lab-flow` rebuilt the
review as an onboarding form (one context and its question alone on the screen, the options as preview
tiles on one specimen, show before choose, "None of these" as a pick-one board's third exit, one card at a
time for a keep-any board, staged follow-ups, the desk's rows as steps, "Copy so far" omitting what the
ledger holds), then every board was reshaped into steps four agents at a time with no new exploration.
Every reshaped board is under the standard 1,200 words with its declaration deleted. **The round is closed
on the tree and its sitting is next**: Start the review on the desk walks the hero, the palette, light,
type-scale, floating-surfaces, rounding, brand-voice and the media kit, and a pick's wiring round is cut the
day he makes it (the wind-down: a favourite becomes a working version in the Library, the board retires).
The kit findings the boards raised are the ROADMAP's first Now lines; none blocks the sitting.
**The sitting's first night (2026-09-17):** the hero's round six answered none and round seven built in the
root tree; his batch then picked the hero (`stream=stack-above`, the caption under the code dropped) and
the palette (`graphite`, no accent, the card as declared, the faint colour in), answered four of the
light board's asks and ruled the aurora off the light ground. Two wiring lanes are cut (`hero-wiring`,
`palette-wiring`; the wind-down: each board retires as its favourite becomes a working version); the
light sitting continues on its cards; Copy so far sends only a board's open round now (`a6afec3b`).

| track | returns | state |
| --- | --- | --- |
| `lab-flow` | the review as a stepped onboarding form: tiles on one specimen, show versus choose, the three exits, one card at a time, staging, the desk's rows as steps | integrated at `c18570c4`; the catalog boards' reading halved with the deletions |
| `home-hero` (round six) | four compositions of the stream (mirror, phrase, settle, ribbon) on the ruled hero, the last exploration before its wiring | integrated at `56ea9185`, 1,189 words under the budget |
| `palette-wiring` | the wind-down's first wiring: Graphite in both modes (a Pearl page, a Graphite room, Apple's cool greys), no accent, the dark card opaque, `--faint` as the third text step on 40 sites; the board retired | integrated at `88d0bec0`; bible 1 ruled and the ledger gone at `52e9afa2` |
| `hero-wiring` | the wind-down's second wiring: the band streaming out of the real demo QR with the ruled block under it and no caption, the engine as `hero-stream.ts` with its contract (two breakpoints, the minimum 683 and 642 px), the wall, its scrims and the kinetic word gone, the board retired | integrated at `0c58ff76`; the ledger gone and the artifacts regenerated at `137e504b` |
| `album-hero` (round three) | Will's six notes answered: the lockup composed for the page as one block with no gap, four calm compositions on one engine (the orbit, the field calmed, the shelf, the arrival) with the calm rule pinned by a test, the live album centred on a 720 / 880 / 1040 step; the board picks the orbit | integrated at `57e2c2e4`, 830 words; the touchpoint at `759a557b` |
| `fix/album-fill-still` | a production bug on `/features/album` under Reduce Motion (a looping fill's end tick was Infinity): a looping fill has a defined still now, one settled pass, pinned by the test | merged at `0c9caedc`, on the alias since 04:45 UTC |
| `home-hero` (round seven) | Will answered round six none in chat, the symmetric approach by name; the Orchestrator built the band (the reference's), the orbit (Cosmos's ring round the code, the block under it) and the two unsplit stacks in the root tree the same evening | on the tree at `ccf93732`, 779 words |
| `type-scale` (round seven) | pick-one: the winner from the five or none, the spacing and the 404 heading as tile steps | integrated at `ec7367e7`, 486 words |
| `light` (round seven) | the twelve cards reshaped for the walk: one at a time on three specimens, before/after and what each lands as, the asks as tile steps | integrated at `7ed0d2a2`, 920 words, no declaration |
| `palette` (round eight) | pick-one: the winner from the twelve or none, the accent and its reach as tile steps on the real product | integrated at `49ed0fbf`, 1,191 words, no declaration |
| `floating-surfaces` (round seven) | pick-one: the winner from the seven or none, the submenu, corner, entrance and shadow questions as tiles on one menu | integrated at `514aee2d`, 922 words, no declaration |
| `rounding` (round seven) | pick-one: the winner from the six or none, the button, ladder, dead-rung and gap questions as tiles at true pixels | integrated at `7d90465c`, 684 words, no declaration |
| `brand-voice` (round seven) | pick-one: the winner from the six voices or none on three lines at phone size, the noun, unfurl, counts and scope questions as steps | integrated at `0c1cfa60` |
| `media-kit` (round seven) | keep-any as a gallery (a kept card is a purchase, priced on the card), the crowds question as two tiles, the rule, spend and shoot questions means-only | integrated at `61063785`, 1,077 words, no declaration |

## The previous round: the revamp (2026-09-16, `5cdebfe0` to `48bd3bdc`)

Will found the lab "super broken" on localhost and the explorations turning into papers. Round 1 fixed the
lab (the stale-stylesheet guard, one toggle rule for every pick, edge-to-edge canvases, the catalog kit and
the reading budget; `lab-catalog` `57b93286`, `lab-sweep` `88dafe50`); Round 2 made `docs/PROGRAM.md` the
loop, CLAUDE.md 150 lines, a manifest deleted at its merge and the record two rounds deep, folded the 25
ADRs and stripped the four heavy system docs (`d4ec4cff`, `aea90fd3`, `0a48db70`); Round 4 rebuilt the six
paper boards as catalogs under declared budgets (`5868325e` to `8587d3ed`), and the palette's cool round
seven landed mid-sitting (`5a538c0a`). Round 3, the Library as the complete inventory with keep / redesign
/ retire on every entry, waits for its planning pass after the sitting. The CHANGELOG's entry "The revamp"
is the record.

## Live state

- **Prod (partyreel.com)** = `main` @ tag `milestone-24` (`592da24`). **The `launch-prep` alias**
  (`https://partyreel-git-launch-prep-partyreel.vercel.app`) serves the wind-down's two wirings, Graphite and
  the band out of the code, and the album page's reduced-motion fix (`0c9caedc`, built 2026-09-17 04:45 UTC;
  the production smoke passed 250 checks with the door closed at `c7f6ebdd`, the two glow boards over the
  reading budget on purpose; the album hero's round three is on the tree, not yet built). Vercel's
  cap is 100 deployments per trailing day on every path (canceled deployments register, builds do not), so
  `[preview]` stays the Orchestrator's and rare. Will's sitting runs on his local `pnpm dev` after a hard
  reload; the alias is the same tree for a phone.
- **Data:** disposable test data only (3 profiles / 3 events / about 16 media rows); the accounts and
  fixtures are in [`systems/testing-verification.md`](systems/testing-verification.md).
- **Tests:** 2,160 green (`pnpm test`); the gate is typecheck + lint + test + build, run locally (CI runs on
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

The desk derives the steps (`/design/lab?key=`); the assets are in [`ASSETS.md`](ASSETS.md). Next from him:
the stepped sitting, board by board, pasted in batches with Copy so far (the Orchestrator transcribes each
batch with `pnpm lab:review`); one question outside the walk, whether bible 20 means the naming or the
shape (brand-voice); the assets still open: the menu ground photograph (row 14), the grain tile and the
worst-case overlap pair (rows 15 and 16), the bright-edged tile set (row 17), and the media kit's 36 masters
and $56 bridge, which its spend and shoot steps now ask. One product bug waits for the wiring round: every
nested submenu paints nothing (`ui/dropdown-menu.tsx`'s `SubContent` has no portal). The launch-gated tasks
are the ROADMAP's Launch checkpoint (`[human]` / `[eng]` / `[content]`).
