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
the marketing site and the app is elevated platform-wide; nothing is protected, and since 2026-09-19 the host app and
the guest pages are explicitly open to be reconceived from the ground up ("closer to a Frankenstein's monster";
his words in `design/rulings.md`).

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
| `heroes` | `privacy-hero` (the field as two spirals, faster, a trail) and `album-page` (round four at the home hero's pace, subtle, the live album beneath at 896 with its bottom faded, a pool of light) | `album-page` wired and retired at `2ca47448` (`album-wiring`: the live album under the host's header, the halo, the floor with a photograph section beneath); `album-motion` on the desk with three variations of the fall on the wired hero; `privacy-hero` round three on the desk at `6c99e128` (a breathing aperture, a grid where tiles take turns clearing, sealed cards that lift) |
| `river-card` | the river in the real QR door at 4:5 and 3:2, no label, the code unlinked: where it sits, where the photographs end, what it opens, the short door | wired and retired at `5297cb07` (`river-wiring`): the river in the QR door, every media-forward card's own copy gradient, `/demo`, the tall closing rows; on the alias at the next build (the cap) |
| `gallery-width` | how wide galleries run on laptops and desktops: small tiles, more columns, never a wide two-column masonry | wired and retired at `666ee8bc` (`gallery-wiring`): a column width, never a count; 2 / 5 / 6 / 8 columns at 375 / 1280 / 1512 / 1920; a disposable 30-photograph album for his eye is on the alias at `/e/c7809249347d41e0aaf2c9ad27cd3c75` ("Gallery width (disposable)"); his two app asks live in `app-vocabulary` and `guest-shape` |
| `ghost-wiring` | river-visual's `ghost` on the guest album's empty state, for Will to judge in the app | integrated at `31c94253` (resumed on Opus): the river's production home `src/components/shared/river/`, two contracts, a Library entry; the ghost's numbers (grayscale 0.85 at 40 percent, the board's) are his to overrule |
| `voice` | round one of the voice derived from won lines: eight real lines in the places they are read, three or four close candidates each, bible 20's question first | integrated at `e0b92af6`; on the desk; its question (does the first win bind the other seven) is Will's |
| `glass` | round one of Glass on the app's chrome over photographs: four recipes in numbers, one grade or two, the lightbox's backdrop, the chips over tiles at a phone, the reel's controls, the host's row, the light ground on its own step; every cost measured | integrated at `30aaf705`; on the desk; round two (marketing, the aurora marriage) is cut from his notes |
| `admin` | the admin portal's shape, round one: the operator's home, the navigation, density, colour for state, destructive actions, the health strip, on the real components with fixtures; an on-brand devtool per Will's ruling | integrated at `d6305818`; on the desk (seven steps at 1440 by 900; the questions closed by the Orchestrator, in the CHANGELOG) |
| `admin-split` | the admin as its own Vercel project on this one repo, serving only the admin; the main project stops serving it; the cutover runbook for the Orchestrator | integrated at `7f3738ba`; the preview host proven (the allow-list probed, Will's sign-in and MFA step-up done); on `main` at milestone-26; the domain moved and verified (a fresh `_vercel` TXT at GoDaddy), the apex flagged and redeployed: DONE |
| `admin-jobs` | the four backend jobs with no heartbeat (the backup queue and dead letters, the purge's sub-sweeps, email, the limiters) onto the console with health, kill switches and alerts | integrated at `3ad58b1c` (the cross-lane patch applied in the merge); the migration applied, the advisor set unchanged; the Worker deployed (`d7b16bcc`) |
| `loose-ends` | six ROADMAP lines as seven decisions on their real surfaces: the admin chart cast in both modes, one FAQ look, the hero at a 900 px tablet, the album's three ambient pieces | integrated at `b83b7c3d`; on the desk; one question his (the reading of the two ambient pieces that had nothing to vary); a real chart-token bug found, on the ROADMAP's Now list |
| `body-type` | the body and label ladder as seven decisions, every number measured in the frame: a guest's reading copy, the app's body, marketing copy fixed or fluid, the caption floor, the label pair, buttons, line height | integrated at `130236c2`; on the desk; two questions his (the four names; one size for caption and label) |
| `image-trail` | our own cursor-tracking image trail (the Codrops "Image Trail Effects" demo one as the reference, written from scratch: a photograph born on every stretch of cursor travel, sliding to the cursor and decaying behind it) with real homes on the marketing site, and `privacy-hero` round two on the same engine (tighter, faster, the trailing photographs decaying) | wired and retired at `73451c79` (`trail-wiring`): the trail on the root 404 at his numbers, banked in the Library (`/design/library`); the shy fade is a feathered window now (4.90:1 on the real page); the group 404s keep their strip, his to widen |
| `cursor-backdrop` | full-bleed photograph sections that switch with the cursor (demo six of the same resource) for the marketing site's UI-forward chapters in place of the aurora, breaking the strict dark/light alternation: where it sits, how it switches, how the copy stays legible, the phone | wired and retired at `9795e370` (`backdrop-wiring`): `full-quality` on the switching photograph closes chapter one, the live demo opens the paper chapter (the lane's reading of his fold, his to overrule), the engine and the section beside the river with contracts and a Library entry; the room-frames ask amended to 1200 px delivered (row 20) |
| `app-shape` | round one of the host app's shape: the home, the event's draw, the event's page, the navigation and the way back, sharing, settings, You, the phone; eight decisions on the shipped components | integrated at `aa338766`; on the desk; four questions carried on their recommendations (in the CHANGELOG) |
| `guest-shape` | round one of the guest experience's shape: the door after the scan, how an empty album speaks, what sits above an album that runs to the window, the Live signal, the guest dialogs, a guest's own photograph, the account's voices; seven decisions on the shipped guest components over one wedding in four access states, phone first | integrated at `beee6325`; on the desk; three questions carried on their recommendations (in the CHANGELOG) |
| `app-vocabulary` | the parts under both shapes: nothing-here-yet, loading, one tile grammar, the bulk toolbar, the gallery's tile-size control and how it persists, the confirm switch; seven decisions on the real components at 1440 and 375 | integrated at `e442fc55`; on the desk; one question carried on its recommendation (the controls ask split in two, staged) |
| `contact-page` | how someone reaches a person at Partyreel: whether a form is required, the receipt, urgency, the topic, the page against the cinema rhythm, what stands beside the form; six decisions on the real desk | integrated at `a8afce0c`; on the desk; three findings on the ROADMAP |
| `press-page` | what Partyreel hands the world about itself: who the page is for, the sheet, the words, the facts, a human, the close, the arc; seven decisions on the real page pieces | integrated at `060dfdf4`; on the desk; one question his ("Live now" pre-launch; recommended: leave it) |
| `app-pricing` | pricing inside the app: what a click opens, what it opens on, how much it holds, how the marketing page stays a click away, the pass, the doors, how a locked control asks, what Checkout returns to; eight decisions on the shipped chrome with four hosts | integrated at `0379c529`; on the desk; three questions carried on their recommendations (in the CHANGELOG); its `doors` third option is app-shape's `you`, drawn |
| `pricing-page` | the marketing pricing page, one decision per part: the opening, the pair, the size, the pass, the calculator, the sheet, the close, the phone; eight decisions on the real pieces with measured captions | integrated at `f79a8037`; on the desk; three questions carried on their recommendations (in the CHANGELOG) |
| `demo-event` | the demo as the product's first impression: the arrival, the framing, the upload as the moment, the way out, what a door promises, the phone scanned off the laptop, how many parties; seven decisions on the shipped demo page, laptop first | integrated at `e3a2c1b6`; on the desk; three questions carried on their recommendations (in the CHANGELOG); one conditional asset (two more curated albums only if the demo becomes three parties) |

## The previous round: the wind-down (2026-09-17, `257a690d` to `00e82dba`)

His stepped sitting turned picks into working versions the same day: Graphite (`palette-wiring`), the hero
streaming out of the code (`hero-wiring`), ladder B (`type-wiring`), the Aurora (`aurora-wiring`), both
shadows and the bright edge (`light-wiring`), the publish bloom, floating surfaces on Card
(`floating-wiring`) and the v1 wordmark. The brand voice exploration was killed unruled and restarts as a
board built from won lines; the media kit was killed for generated frames (one Higgsfield month before
launch, and no agent tracks an image's rights). The lab gained `defineExploration`, the question-first
authoring shape, and `lab:demo`. The CHANGELOG's "The wind-down" is the record.

## Live state

- **Prod (partyreel.com)** = `main` @ tag `milestone-26` (`df173c2e`, merged 2026-09-18 late from the `launch-prep` tip
  `353ad884`: the admin split's code, the jobs console on three kinds, the chart aliases static, four boards behind
  the key); `launch-prep` is level with it. **The admin cutover is complete** (2026-09-18, late):
  `admin.partyreel.com` is served by `partyreel-admin` (`NEXT_PUBLIC_SURFACE=admin`, the allow-list) and the apex by
  `partyreel` (`=app`, so `/admin` is a 404 there); the cron runs on the app surface only. Every runbook check is done:
  `job_runs` showed exactly one scheduled purge run on 2026-09-19 (04:48 UTC) and Will's sign-in at the admin host
  rendered `/admin/metrics`, `/admin/albums` and `/admin/forensics`. **The `launch-prep` alias**
  (`https://partyreel-git-launch-prep-partyreel.vercel.app`) serves the ladders and the dock. Will reviews
  on the alias as well as his local `pnpm dev`, so **the alias is rebuilt whenever a board changes**. On 2026-09-19 the
  deployment cap (100 creations a day, canceled ones included) hit while six lanes pushed, so the alias sat on
  `89548cbb` with `app-shape` and the river door only in the tree until the window freed; lane branches no longer
  create deployments (`vercel.json`).
  Vercel's cap is 100 deployments per trailing day on every path, so `[preview]` stays the Orchestrator's,
  and the prune runs after every integration.
- **Data:** disposable test data only (3 profiles / 3 events / about 16 media rows); the accounts and
  fixtures are in [`systems/testing-verification.md`](systems/testing-verification.md).
- **Tests:** about 2,190 green (`pnpm test`); the gate is typecheck + lint + test + build, run locally (CI
  runs on `main` and `launch-prep` code pushes only; an `lp/*` push only on `[ci]`). `lab:smoke` passes
  whole again, so a board over its reading budget is a failure, not a known exception.
- **Jobs:** the daily purge cron, the media-backup Worker and the daily DB-backup GitHub Action (about
  06:30 UTC) are live; the deletion-aware backup prune ships in dry-run (`PRUNE_MODE=live` is a launch flip). The backup Worker's queue and dead-letter depth reading (`admin-jobs`) is deployed (version `d7b16bcc`, 2026-09-18); the two derived cards fill with the 05:00 UTC run.
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
on the P3 team (two projects on one repo, `partyreel` and `partyreel-admin`; Hobby; the Pro cutover, DNS to Cloudflare (GoDaddy today; Will cleared the move on 2026-09-18, its runbook is a ROADMAP line) and the repo transfer are launch-time cutovers).
"Allow new signups" stays ON (account-from-guest and email+password create depend on it; anonymous sign-ins
stay OFF). Already configured, never redo: the R2 buckets, creds, CORS and abort-multipart lifecycle rule;
the apex domain; `CRON_SECRET`; `profiles.is_admin`; the Stripe TEST products, prices, webhook, Billing
Portal and its ten env values; Supabase TOTP MFA with `admin.partyreel.com/auth/callback` in the redirect
allow-list and `NEXT_PUBLIC_ADMIN_HOST` (break-glass: delete the TOTP factor in `auth.mfa_factors`); the
Sentry project, DSN and its four env vars; the media-backup Worker and the DB-backup Action secrets; the
prune crons and the shared `PRUNE_API_SECRET`.

## Waiting on Will

His sitting opened on `privacy-hero` with none (2026-09-18, night); the first batch (build `93d00ff`) ruled `cursor-backdrop` whole; the second (build `9720798`, 2026-09-19) ruled four boards whole and sent privacy-hero round two back with a `?`. The four wiring lanes and the app round's four boards (`app-shape`, `privacy-concept`, `guest-shape`, `app-vocabulary`; the seams in `tracks/orchestrator.md`, "The app round's map") are integrated and on the desk; from his stacking steer (2026-09-19, while deployments are capped) from his stacking steer (2026-09-19, while deployments are capped) `contact-page`, `press-page`, `demo-event`, `app-pricing` (his ask: pricing inside the app, the marketing page a "learn more" second layer) and `pricing-page` (his ask: the marketing pricing page, every part its own decision) are on the desk and `app-door`, `guest-upload` and `first-event` (the Orchestrator's two: the core act, the activation moment) are building. The desk derives the steps (`/design/lab?key=`): every board of the round is integrated and his sitting is open
in the rebuilt step (1-9 show and pick, x flips A and B, g lays them side by side, n goes to the note, ?
marks a question unclear), plus the ghost on a disposable event on the alias (its link in chat). Two calls from `backdrop-wiring` are his to overrule on the alias's home page: the live demo moved whole into the paper chapter as its opener (rather than its visual merged into the album section), and the album's heading kept at `lg` beneath it (`text-section` is the first thing to try if the two read as one section). His to
overrule from the wiring lane: the ghost's fade (grayscale 0.85 at 40 percent, the board's values, rather
than the old grid's 25 percent at full grayscale). Two calls were made for him to overrule: type drawn inside a picture
counts as depicted (the help emblem, the press kit's plate, /features/qr's sign), and the album sits at 896,
the scale's step, rather than 880. The assets still open: the grain tile and the worst-case overlap pair
(rows 15 and 16) and the v1 icon (row 19). The bible-20 question becomes the new `voice` board's first ask.
The launch-gated tasks are the ROADMAP's Launch checkpoint (`[human]` / `[eng]` / `[content]`).
