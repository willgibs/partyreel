# Partyreel — Status (you-are-here)

> ROLE: the live snapshot: the era, the current round and the one before, live state, infrastructure,
> what waits on Will. BELONGS HERE: what is true right now. · NOT HERE: the rules (→ [`PROGRAM.md`](PROGRAM.md)),
> what shipped (→ [`CHANGELOG.md`](CHANGELOG.md), two rounds deep), how systems work (→ [`systems/`](systems)),
> what might be next (→ [`ROADMAP.md`](ROADMAP.md)). GROWS BY: being replaced at every round close.

**Updated:** 2026-09-18

## The era

Partyreel is in pre-launch continuous elevation: the full product is built and live at partyreel.com with
zero real users, Stripe in TEST mode, and the launch switches deliberately unspent (they accrete in
[`ROADMAP.md`](ROADMAP.md) → Launch checkpoint). The elevation program ([`PROGRAM.md`](PROGRAM.md)) is the
only active thread: work rides `launch-prep` in rounds, each a catalog in the lab, Will's verdicts on the
desk, then the wiring; partyreel.com changes only at tagged milestone merges. The goal for this stretch
(Will, 2026-09-14): every page reaches a cohesive informational flow and every point of the design system,
the marketing site and the app is elevated platform-wide; nothing is protected.

## The current round: the ladders and the dock (opened 2026-09-18 at `00e82dba`)

Will's eighth and ninth batches finished the sitting the stepped review opened: both ladders answered,
wired and their boards retired; the album hero and river-visual answered, their wiring waiting on four new
boards; and the lab rebuilt around his note that he could not see what he was answering. His steer binds
from here: the end goal is the product, fast iterative rounds beat slow meticulous ones, and a relative
note ("a bit more calm") is answered against a reference he already likes, never a cap and a test (the
album hero's round three went "too boring" that way).

| track | returns | state |
| --- | --- | --- |
| `ladders-wiring` | the type ladder's law as the ORDER (`prose` 24 at a phone, a tenth step `subhead`, every heading on a step, the clamped trim) and family C's corners in quarters (8 / 12 / 4, the gap pinned, a `cta` Button); `type-phone` and `rounding` retired | integrated: phase 1 at `5a5c6eb4`, phase 2 at `d2db2629`; bible 5 and 8 ruled |
| the lab's step | the preview is the page (every option once at true size, flipped or side by side, a sticky head naming it) and the answer is a dock; a transcribed `?` leaves the walk; `lab:demo` fails CLIPPED, UNLABELLED, NO DOCK | landed at `d37be90e`, measured on ten reopened steps at 1280, 1512 and 375 |
| the glow boards | `glow-doctrine` and `glow-moments`, records with nothing open | retired with the `[data-lit]` leak; the floors fixed; `lab:smoke` passes whole |
| `heroes` | `privacy-hero` (the field as two spirals, faster, a trail) and `album-page` (round four at the home hero's pace, subtle, the live album beneath at 896 with its bottom faded, a pool of light) | integrated at `6b5ea1bf` (resumed on Sonnet after the kill): eight decisions, every option a real Frame at 1440 and 375; `album-page` on the desk; `privacy-hero` round one answered none (his first note of the sitting: denser, faster, the trailing photographs decaying), round two builds in `image-trail` |
| `river-card` | the river in the real QR door at 4:5 and 3:2, no label, the code unlinked: where it sits, where the photographs end, what it opens, the short door | integrated at `3ed62f0c` (resumed on Sonnet): four decisions, every code at the 3px floor; on the desk |
| `gallery-width` | how wide galleries run on laptops and desktops: small tiles, more columns, never a wide two-column masonry | integrated: four decisions measured at 1280, 1512 and 1920 (tile, width, where the words sit, the host); on the desk |
| `ghost-wiring` | river-visual's `ghost` on the guest album's empty state, for Will to judge in the app | integrated at `31c94253` (resumed on Opus): the river's production home `src/components/shared/river/`, two contracts, a Library entry; the ghost's numbers (grayscale 0.85 at 40 percent, the board's) are his to overrule |
| `voice` | round one of the voice derived from won lines: eight real lines in the places they are read, three or four close candidates each, bible 20's question first | integrated at `e0b92af6`; on the desk; its question (does the first win bind the other seven) is Will's |
| `glass` | round one of Glass on the app's chrome over photographs: four recipes in numbers, one grade or two, the lightbox's backdrop, the chips over tiles at a phone, the reel's controls, the host's row, the light ground on its own step; every cost measured | integrated at `30aaf705`; on the desk; round two (marketing, the aurora marriage) is cut from his notes |
| `admin` | the admin portal's shape, round one: the operator's home, the navigation, density, colour for state, destructive actions, the health strip, on the real components with fixtures; an on-brand devtool per Will's ruling | building (Opus, :3132; cut this evening) |
| `admin-split` | the admin as its own Vercel project on this one repo, serving only the admin; the main project stops serving it; the cutover runbook for the Orchestrator | handed off at `a4104a50`; integrating (the runbook's project, crons and env follow the merge; the domain moves at the milestone) |
| `admin-jobs` | the four backend jobs with no heartbeat (the backup queue and dead letters, the purge's sub-sweeps, email, the limiters) onto the console with health, kill switches and alerts | building (Opus, :3134; cut this evening) |
| `loose-ends` | six ROADMAP lines as seven decisions on their real surfaces: the admin chart cast in both modes, one FAQ look, the hero at a 900 px tablet, the album's three ambient pieces | integrated at `b83b7c3d`; on the desk; one question his (the reading of the two ambient pieces that had nothing to vary); a real chart-token bug found, on the ROADMAP's Now list |
| `body-type` | the body and label ladder as seven decisions, every number measured in the frame: a guest's reading copy, the app's body, marketing copy fixed or fluid, the caption floor, the label pair, buttons, line height | integrated at `130236c2`; on the desk; two questions his (the four names; one size for caption and label) |
| `image-trail` | our own cursor-tracking image trail (the Codrops "Image Trail Effects" demo one as the reference, written from scratch: a photograph born on every stretch of cursor travel, sliding to the cursor and decaying behind it) with real homes on the marketing site, and `privacy-hero` round two on the same engine (tighter, faster, the trailing photographs decaying) | building (Opus, :3135; cut tonight from Will's first note) |
| `cursor-backdrop` | full-bleed photograph sections that switch with the cursor (demo six of the same resource) for the marketing site's UI-forward chapters in place of the aurora, breaking the strict dark/light alternation: where it sits, how it switches, how the copy stays legible, the phone | building (Opus, :3136; cut tonight) |
| `album-hero` (round three) | answered in full (`none`, `w880`, `lg`, `settled`, `page`) | waits on `album-page`, then its wiring |
| `river-visual` (round two) | answered (`card`, `in`, `ghost`; `proportion` withdrawn) | waits on `river-card`, then its wiring |

## The previous round: the wind-down (2026-09-17, `257a690d` to `00e82dba`)

His stepped sitting turned picks into working versions the same day: Graphite (`palette-wiring`), the hero
streaming out of the code (`hero-wiring`), ladder B (`type-wiring`), the Aurora (`aurora-wiring`), both
shadows and the bright edge (`light-wiring`), the publish bloom, floating surfaces on Card
(`floating-wiring`) and the v1 wordmark. The brand voice exploration was killed unruled and restarts as a
board built from won lines; the media kit was killed for generated frames (one Higgsfield month before
launch, and no agent tracks an image's rights). The lab gained `defineExploration`, the question-first
authoring shape, and `lab:demo`. The CHANGELOG's "The wind-down" is the record.

## Live state

- **Prod (partyreel.com)** = `main` @ tag `milestone-25` (`bf9cbd74`, merged 2026-09-18 from the `launch-prep` tip
  `707d99a2`: Graphite, the type and corner ladders, the Aurora with shadows by role, the hero band and the v1
  wordmark, the river on the empty album); `launch-prep` runs ahead by the boards integrated since. **The `launch-prep` alias**
  (`https://partyreel-git-launch-prep-partyreel.vercel.app`) serves the ladders and the dock. Will reviews
  on the alias as well as his local `pnpm dev`, so **the alias is rebuilt whenever a board changes**.
  Vercel's cap is 100 deployments per trailing day on every path, so `[preview]` stays the Orchestrator's,
  and the prune runs after every integration.
- **Data:** disposable test data only (3 profiles / 3 events / about 16 media rows); the accounts and
  fixtures are in [`systems/testing-verification.md`](systems/testing-verification.md).
- **Tests:** about 2,190 green (`pnpm test`); the gate is typecheck + lint + test + build, run locally (CI
  runs on `main` and `launch-prep` code pushes only; an `lp/*` push only on `[ci]`). `lab:smoke` passes
  whole again, so a board over its reading budget is a failure, not a known exception.
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

His sitting opened on `privacy-hero` with none (2026-09-18, night); its round two and the two boards his note asked for are cut. The desk derives the steps (`/design/lab?key=`): all eight boards of the round are integrated and his sitting is open
in the rebuilt step (1-9 show and pick, x flips A and B, g lays them side by side, n goes to the note, ?
marks a question unclear), plus the ghost on a disposable event on the alias (its link in chat). His to
overrule from the wiring lane: the ghost's fade (grayscale 0.85 at 40 percent, the board's values, rather
than the old grid's 25 percent at full grayscale). Two calls were made for him to overrule: type drawn inside a picture
counts as depicted (the help emblem, the press kit's plate, /features/qr's sign), and the album sits at 896,
the scale's step, rather than 880. The assets still open: the grain tile and the worst-case overlap pair
(rows 15 and 16) and the v1 icon (row 19). The bible-20 question becomes the new `voice` board's first ask.
The launch-gated tasks are the ROADMAP's Launch checkpoint (`[human]` / `[eng]` / `[content]`).
