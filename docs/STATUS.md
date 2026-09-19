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
| `heroes` | `privacy-hero` (the field as two spirals, faster, a trail) and `album-page` (round four at the home hero's pace, subtle, the live album beneath at 896 with its bottom faded, a pool of light) | `album-page` wired and retired at `2ca47448` (`album-wiring`: the live album under the host's header, the halo, the floor with a photograph section beneath); `album-motion` on the desk with three variations of the fall on the wired hero; `privacy-hero` round three on the desk at `6c99e128` (a breathing aperture, a grid where tiles take turns clearing, sealed cards that lift) |
| `voice` | round one of the voice derived from won lines: eight real lines in the places they are read, three or four close candidates each, bible 20's question first | integrated at `e0b92af6`; on the desk; its question (does the first win bind the other seven) is Will's |
| `glass` | round one of Glass on the app's chrome over photographs: four recipes in numbers, one grade or two, the lightbox's backdrop, the chips over tiles at a phone, the reel's controls, the host's row, the light ground on its own step; every cost measured | integrated at `30aaf705`; on the desk; round two (marketing, the aurora marriage) is cut from his notes |
| `admin` | the admin portal's shape, round one: the operator's home, the navigation, density, colour for state, destructive actions, the health strip, on the real components with fixtures; an on-brand devtool per Will's ruling | integrated at `d6305818`; on the desk (seven steps at 1440 by 900; the questions closed by the Orchestrator, in the CHANGELOG) |
| `loose-ends` | six ROADMAP lines as seven decisions on their real surfaces: the admin chart cast in both modes, one FAQ look, the hero at a 900 px tablet, the album's three ambient pieces | integrated at `b83b7c3d`; on the desk; one question his (the reading of the two ambient pieces that had nothing to vary); a real chart-token bug found, on the ROADMAP's Now list |
| `body-type` | the body and label ladder as seven decisions, every number measured in the frame: a guest's reading copy, the app's body, marketing copy fixed or fluid, the caption floor, the label pair, buttons, line height | integrated at `130236c2`; on the desk; two questions his (the four names; one size for caption and label) |
| `app-shape` | round one of the host app's shape: the home, the event's draw, the event's page, the navigation and the way back, sharing, settings, You, the phone; eight decisions on the shipped components | integrated at `aa338766`; on the desk; four questions carried on their recommendations (in the CHANGELOG) |
| `guest-shape` | round one of the guest experience's shape: the door after the scan, how an empty album speaks, what sits above an album that runs to the window, the Live signal, the guest dialogs, a guest's own photograph, the account's voices; seven decisions on the shipped guest components over one wedding in four access states, phone first | integrated at `beee6325`; on the desk; three questions carried on their recommendations (in the CHANGELOG) |
| `app-vocabulary` | the parts under both shapes: nothing-here-yet, loading, one tile grammar, the bulk toolbar, the gallery's tile-size control and how it persists, the confirm switch; seven decisions on the real components at 1440 and 375 | integrated at `e442fc55`; on the desk; one question carried on its recommendation (the controls ask split in two, staged) |
| `contact-page` | how someone reaches a person at Partyreel: whether a form is required, the receipt, urgency, the topic, the page against the cinema rhythm, what stands beside the form; six decisions on the real desk | integrated at `a8afce0c`; on the desk; three findings on the ROADMAP |
| `press-page` | what Partyreel hands the world about itself: who the page is for, the sheet, the words, the facts, a human, the close, the arc; seven decisions on the real page pieces | integrated at `060dfdf4`; on the desk; one question his ("Live now" pre-launch; recommended: leave it) |
| `app-pricing` | pricing inside the app: what a click opens, what it opens on, how much it holds, how the marketing page stays a click away, the pass, the doors, how a locked control asks, what Checkout returns to; eight decisions on the shipped chrome with four hosts | integrated at `0379c529`; on the desk; three questions carried on their recommendations (in the CHANGELOG); its `doors` third option is app-shape's `you`, drawn |
| `pricing-page` | the marketing pricing page, one decision per part: the opening, the pair, the size, the pass, the calculator, the sheet, the close, the phone; eight decisions on the real pieces with measured captions | integrated at `f79a8037`; on the desk; three questions carried on their recommendations (in the CHANGELOG) |
| `app-door` | login and signup, the door into the host app: what it asks first, how many account surfaces, what stands before the app, what the page is, an existing email, failure, the returning host; seven decisions on the shipped auth components | integrated at `2960db15`; on the desk; four questions his (in the CHANGELOG); the ghost's fade on the empty album (grayscale 0.85 at 40 percent) stays his to overrule from `ghost-wiring` |
| `first-event` | a host's first event from "Create" to a code on the table: what creating asks, where the style is chosen, the Free limit, how the code reaches the venue, where the host lands, what a host holds out at the door, the empty event, the first photograph; eight decisions on the real create card and real QR plates, every code's module edge measured | integrated at `728513ee`; on the desk; six questions his (in the CHANGELOG); two product misses on the ROADMAP (the swatches under the scan floor; the style step's 404 link) |
| `guest-upload` | the moment a guest adds a photograph: the tap, sending, held, failed, the batch, the landing, the warning, the words; eight decisions on the shipped guest components over one wedding, phone first | integrated at `1649506c`; on the desk; four questions his (in the CHANGELOG); the batch step's measured numbers are its own argument |
| `demo-event` | the demo as the product's first impression: the arrival, the framing, the upload as the moment, the way out, what a door promises, the phone scanned off the laptop, how many parties; seven decisions on the shipped demo page, laptop first | integrated at `e3a2c1b6`; on the desk; three questions carried on their recommendations (in the CHANGELOG); one conditional asset (two more curated albums only if the demo becomes three parties) |
| `media-viewer` | what a photograph opens as when a guest or a host taps a tile: the opening, what it holds, who, next, close up, video, the way out, a link; phone first | cut at `d909cb13` (2026-09-19, the overnight round), on the seat |
| `reel-studio` | the highlight reel from the studio to a guest's hands: the door, the room, the styles, the moments, a blocked tile, sharing, the wait, how a guest watches; on local replicas, never the portal | cut at `d909cb13`, on the seat |
| `host-curation` | the host's act of reviewing what guests send: the queue, the verb, the peek, keys, undo, new arrivals, the count, whether a refused guest is told; eight decisions on the shipped review surface | integrated at `ff09a50f`; on the desk; five calls carried on their recommendations (in the CHANGELOG); a shipped bug on the ROADMAP's Now list (the hidden-media dim has never rendered) |
| `admin-triage` | the operator's act on a report inside the admin board's shape: first look, no reason, the verdict, escalate, one idiom for four inboxes, resolved, the phone, the notice | cut at `d909cb13`, on the seat |
| `emails` | every email Partyreel sends, the real templates in an inbox mock: one shell, the brand, the sender, the foot, the code, the moments, the guest's | cut at `d909cb13`, on the seat |
| `help-center` | where a host or a guest with a problem lands: who first, the hub, the article, from the product, feedback, the dead end, search; seven decisions on the real help pieces | integrated at `5118c141`; on the desk; four calls carried on their recommendations (in the CHANGELOG) |
| `profile-page` | what a person is on Partyreel beyond one album: exists, the head, not found, the named, the claim, what a person is, block, the list; phone first | cut at `c74a509d` (2026-09-19, the overnight round), on the seat host-curation freed |

## The previous round: the wind-down (2026-09-17, `257a690d` to `00e82dba`)

His stepped sitting turned picks into working versions the same day (Graphite, the streaming hero, ladder B, the Aurora,
the shadows and the bright edge, the publish bloom, floating surfaces, the v1 wordmark); the lab gained `defineExploration`
and `lab:demo`. The CHANGELOG's "The wind-down" is the record.

## Live state

- **Prod (partyreel.com)** = `main` @ tag `milestone-26` (`df173c2e`, merged 2026-09-18 late from the `launch-prep` tip
  `353ad884`: the admin split's code, the jobs console on three kinds, the chart aliases static, four boards behind
  the key); `launch-prep` is level with it. **The admin cutover is complete** (2026-09-18, late):
  `admin.partyreel.com` is served by `partyreel-admin` (`NEXT_PUBLIC_SURFACE=admin`, the allow-list) and the apex by
  `partyreel` (`=app`, so `/admin` is a 404 there); the cron runs on the app surface only. Every runbook check is done:
  `job_runs` showed exactly one scheduled purge run on 2026-09-19 (04:48 UTC) and Will's sign-in at the admin host
  rendered `/admin/metrics`, `/admin/albums` and `/admin/forensics`. **The `launch-prep` alias**
  (`https://partyreel-git-launch-prep-partyreel.vercel.app`) serves the ladders and the dock; Will reviews on it as well as
  his local `pnpm dev`, so **the alias is rebuilt whenever a board changes**. Vercel's cap is 100 deployment creations per
  trailing day on every path (canceled ones included): on 2026-09-19 it held the alias at `89548cbb` for a day, so lane
  branches no longer create deployments (`vercel.json`), `[preview]` stays the Orchestrator's and the prune runs after every integration.
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

His sitting opened on `privacy-hero` with none (2026-09-18, night); the first batch (build `93d00ff`) ruled `cursor-backdrop`
whole; the second (build `9720798`, 2026-09-19) ruled four boards whole and sent privacy-hero round two back with a `?`. Every
lane since is integrated and on the desk: the four wiring lanes, the app round's four boards (`app-shape`, `privacy-concept`,
`guest-shape`, `app-vocabulary`), the stacking round's eight (`contact-page`, `press-page`, `demo-event`, `app-pricing`,
`pricing-page`, `app-door`, `first-event`, `guest-upload`), and the overnight round's twelve cut at the Orchestrator's discretion
while he slept (2026-09-19, "occupy 8 more slots, paced as usual", then twelve: `media-viewer`, `reel-studio`, `host-curation`,
`admin-triage`, `emails`, `help-center` on the seats; `profile-page`, `how-it-works`, `export-flow`, `site-chrome`,
`event-type-pages`, `error-pages` queued; the state of each in the table). The desk derives the
steps (`/design/lab?key=`): 1-9 show and pick, x flips A and B, g lays them side by side, n goes to the note, ? marks a
question unclear; plus the ghost on a disposable event on the alias (its link in chat). Calls his to overrule: from
`backdrop-wiring` on the home page, the live demo moved whole into the paper chapter as its opener, and the album's heading
kept at `lg` beneath it; the ghost's fade (grayscale 0.85 at 40 percent); type drawn inside a picture counts as depicted
(the help emblem, the press kit's plate, /features/qr's sign); the album at 896 rather than 880. The assets still open: the
grain tile and the worst-case overlap pair (rows 15 and 16) and the v1 icon (row 19). The launch-gated tasks are the ROADMAP's Launch checkpoint (`[human]` / `[eng]` / `[content]`).
