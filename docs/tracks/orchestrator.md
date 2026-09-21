---
track: orchestrator
status: open
cut: "5cdebfe0"          # this window opened at Round 1 of the revamp (2026-09-16)
owns:
  - src/app/(dev)/design/rules/bible.ts
  - src/app/(dev)/design/rules/bible.test.ts
  - src/app/(dev)/design/layout.tsx
  - src/app/(dev)/design/(shell)/page.tsx
  - src/app/(dev)/design/_data/links.ts
  - src/app/(dev)/design/_data/docs.ts
  # The two tests below name no board any more (a fixture, or the first standing
  # board under it.runIf), so a retirement never needs them released again.
  - src/app/(dev)/design/_data/links.test.ts
  - src/app/(dev)/design/_data/docs.test.ts
  - src/app/globals.css
  - src/app/theme.css
  - src/components/dev/motion-tuner-config.ts
  # The board lists: a lane adds or removes ONLY its own board's lines here
  # (the registration and retirement exceptions, announced 2026-09-18).
  - src/app/(dev)/design/sandbox/registry.ts
  - src/app/(dev)/design/(shell)/lab/boards.ts
  - src/app/(dev)/design/_data/legacy-routes.ts
  - src/app/(dev)/design/_data/legacy-routes.test.ts
  - src/app/(dev)/design/sandbox/registry.test.ts
  - src/app/(dev)/design/touchpoints.ts
  - src/app/(dev)/design/touchpoints.test.ts
  - src/components/dev/motion-tuner.tsx
  - src/components/dev/marketing-motion-tuner.tsx
  - src/components/dev/tuner-store.ts
  - src/components/dev/candidate-style.tsx
  - src/components/dev/app-design-island.tsx
  - src/components/dev/glow-contrast.ts
  - src/components/dev/glow-contrast.test.ts
  - src/components/dev/lamp-set.ts
  - src/components/marketing/mdx/
  - src/components/marketing/mdx-components.tsx
  - src/lib/design-gate/
  - src/app/api/design-gate/
  - scripts/vercel-ignore-build.mjs
  - .github/workflows/ci.yml
  - src/app/(marketing)/marketing.css
  - src/lib/events/visibility-labels.ts
  - src/lib/shared/use-entered-frame.ts
reads:
  - src/app/(marketing)/(cinema)/layout.tsx
  - src/components/marketing/system/section-shell.tsx
announces:
  - "The overtaken audit (2026-09-21): four reshape lanes own the fourteen standing boards' sandbox folders and delete every entry for their boards from src/app/(dev)/design/sandbox/overtaken.ts as exception lines (the context now lives in each question); `verified-email-lab` (wave 1 of the identity reshape) owns overtaken.ts, deletes only the three guest-verify entries with the board and adds NO badge for the reshape's reach; when all five have merged the map is empty and stays as the mechanism for a future overlap. A burn cycle's boards never overlap in what they ask (PROGRAM.md). All five merged by 17:23 EDT 2026-09-21: the map is empty, and its sixteen dead per-batch handles went at the last record on the file's own rule."
  - "The identity reshape (2026-09-21): wave 0 `verified-email-migration` lands events.require_verified_email (true = today's require accounts) beside allow_anonymous_uploads under a BEFORE trigger keeping them opposite, guests.display_name, guests.verified_at, upload_forensics.guest_display_name, create_guest(p_qr_token, p_user_id, p_unlock_proven, p_display_name), set_guest_display_name(p_session_token, p_display_name), get_upload_context's require_verified_email and guest_verified, create_media's refusal ('This event is not accepting uploads without a verified email.', which main maps to uploads_closed), get_event_by_qr_token returning BOTH flags; APPLIED 2026-09-21 15:2x EDT, checked and typed (`311e9d28`), merged `34736405`, so every wave-1 lane codes against real names. Wave 0's two findings bind wave 1: identity keys on guests.verified_at, never user_id alone (an unconfirmed session carries a uid and keeps its typed name); the DB accepts a nameless mint (production keeps working) so the name requirement is the route's 422; create_guest's payload carries display_name and verified; claim_anonymous_uploads is unchanged, so the profile-name copy goes through updateDisplayNameAction. Wave 1: `verified-email-server` MERGED `6fae1257` (16:34 EDT; the guest and host lanes sync past it before their handoffs; `email_required` gave way to `verification_required` in src/lib/errors/codes.ts; guest-flow.md's access-gate lines are its) and lands POST /api/guests {qr_token, display_name?} (422 name_required | name_invalid | verification_required), POST /api/guests/name, presign and complete 403 verification_required, UploaderIdentity.isVerified on one precedence rule (user_id set: the profile's name, verified; else a typed name, unverified; else 'A guest'), GridMedia.isVerified, getEventGuestList(id, {includeUnverified}) returning a union, getHostCard(eventId); `verified-email-guest` MERGED `f11c416a` (16:48 EDT; the host lane syncs past it before its help and legal lines) and lands src/components/guest/follow-moment-card.tsx, src/components/shared/unverified-mark.tsx, src/lib/guest/join.ts, src/lib/guest/use-stored-name.ts, DOOR_WEAR.signin; src/app/(dev)/design/sandbox/guest-verify/ is released to `verified-email-lab` and deleted at its merge; `guest-capture` (wave 2) registers at the head at its merge and moves after media-viewer. No push creates a deployment; the alias moves once after the last merge."
  - "overtaken-5 landed (2026-09-21 03:14 EDT, 7e4d7212): src/app/(dev)/design/(shell)/lab/_desk/queue.test.ts now DERIVES the board it proves the desk's join on (it named first-event by name before), so a wiring lane retiring its board syncs past 7e4d7212 BEFORE its retirement commit and never edits that test itself; the map holds no held badge; lint's baseline is 10 warnings, not 8."
  - "The closing sitting's third batch (2026-09-21): `guest-upload-wiring` owns src/components/shared/masonry.tsx and lands src/components/shared/arrival.css, src/lib/shared/arrival.ts (ARRIVAL_GLOW_MS and useArrivalMarks) and src/lib/shared/use-live-poll.ts (the hybrid cadence out of live-gallery.tsx), the arrival grammar for both surfaces (data-arrived the glow, data-landed the sweep); it owns lit-edge-contract.test.ts this batch (the host lane's two qr hosts are exception lines). `first-event-wiring` owns docs/systems/host-app.md, src/lib/qr/ (the module floor), src/app/(print)/ (the print route group) and src/app/api/events/[eventId]/live/ (the host fingerprint route), reads the guest doorbell hook; src/app/globals.css is RELEASED to it for the print block (this list drops the line at the cut; it returns at that lane's merge). `overtaken-5` merges FIRST (overtaken.test.ts refuses a retired board's key; each wiring lane also removes its own board's entries). The identity board (guest-verify round two) is untouched by all three."
  - "Round 1 of the revamp (2026-09-16, 5cdebfe0): the lab guards itself against a stale stylesheet (src/components/lab/lab-chrome.tsx reads --lab-css-generation off .lab-shell; bump lab-css-generation.ts and design.css together when a shell rule changes; a stale copy after one reload means the SERVER: stop it, rm -rf .next/dev, start it); every pick toggles (review-store.ts writers toggleAnswer / setAnswerNote / setBoardNote / toggleItemVerdict / setItemNote, an `items` map keyed by itemHoldId); a wide page at 1:1 runs edge to edge (data-lab-bleed on Stage and FrameRow; a bleed inside a bleed keeps its box); board-spec.ts carries ITEM_VERDICTS, LIBRARY_VERDICTS, BuilderVerdict, Candidate.one/verdict/facts, Control.clearable, BoardSpec.catalog and LIMITS.readingWords; .lab-catalog is the unlayered grid in design.css. Two lanes cut: lab-catalog (the review's item scope, the catalog kit, the toolbox, the reading budget, the palette as proof; owns scripts/lab-smoke.mjs this round) and lab-sweep (walk every lab page and fix the shell; owns design.css and _data/glossary.ts this round). docs/reviews/README.md stays here: a grammar change is written into Handoff verbatim and landed at the merge."
  - "The stepped review round (2026-09-16, 02c409b4): board-spec.ts carries Ask.lands / after / strip, AskOption.state, Candidate.lands, CatalogSpec.mode / winner / walk / stage and LIMITS.askLands / candidateLands; registry.test.ts rules on them (a staged ask waits on an earlier ask or a card of its own catalog; a pick-one catalog names a winner ask that mirrors the pick control and offers none; look is optional once every option is drawn; an ask mirroring a clearable control may offer its cleared default as none)."
  - "The home hero ships (2026-09-17, 0c58ff76): src/components/marketing/sections/home/cinema-hero.tsx is the band streaming out of the demo code on hero-stream.ts, and the home-hero board is retired; sandbox/home-hero/shared.tsx outlives it for the album-hero and river-visual boards (FRAMES, CANVAS, GUTTER, LADDER, Mode, Photo) and nothing else under that folder exists."
  - "The wiring rounds (2026-09-17): Graphite is the palette (globals.css, theme.css, marketing.css at 88d0bec0: a 0.995 page, a 0.105 room, --faint as the third text step, the dark card opaque, no accent, the cinema deepening gone); the three stylesheets are the Orchestrator's again; Copy so far sends only a board's open round (review-message.ts composeSoFar), so a store entry from a round the board has left never rides again."
  - "The second batch (2026-09-17, 4280a59c): the type scale is ruled (B, the spacing law, the dead link on the set) and the Aurora is one light in three kept forms (seam, throw, field), never on paper, on an 8 second clock. The stylesheets are released for the round: theme.css and marketing.css to type-wiring (plus the @utility font-heading block of globals.css), the rest of globals.css to aurora-wiring. review-message.ts: composeSoFar(store, openOf, transcribed) takes the open round's shape ({ round, asks, items }) and Transcribed carries notes by board."
  - "The third batch (2026-09-17, c9903c99 and dc4530df): every card of the light board's round seven is ruled (the bloom, the halo and the beam kept) and round eight is three steps (depth, face, sweep). SectionLight has NO default placement: `placement` is required, `room` takes a `from` origin on an edge of the box and every placement a `reach`, and its contract refuses the same composition twice on one page (Will: the Aurora is 'a mix of all of them... custom and bespoke'). ProCardBeam measures its card's corner and passes it, zero included. src/app/globals.css is released to publish-bloom for the round (the publish block and the one fence rule only)."
  - "The fourth batch (2026-09-17, 871f650b to c64275a3): light r8 is fully answered and floating-surfaces picks Card. `pnpm lab:demo` (scripts/lab-demo.mjs) presses every open step and fails a frozen stage; a catalog card's preview is inert when the card is the press target (src/components/lab/catalog.tsx). Released to light-wiring for the round: src/app/globals.css, src/app/theme.css, _data/links.test.ts and _data/docs.test.ts (the two tests that name light as a standing board and its spec as NOT LAW); touchpoints.ts and touchpoints.test.ts stay here and the lane edits its own board's lines under the retirement exception."
  - "The eighth batch (2026-09-18, 00e82dba): type-phone r1 and rounding r7 are ruled, and one lane, ladders-wiring, wires both ladders and retires both boards (phase 1 type, phase 2 corners). The type ladder's law becomes the ORDER: prose's phone end 18 to 24 and a tenth step, subhead (20 to 24), declared in theme.css AND TYPE_STEPS. Corners are family C in quarters: --radius 8px, --radius-float 12px (rows derived at 8), --radius-tile 4px, --gap-gallery max(3px, var(--radius-tile)), 3xl and 4xl set to initial, a cta Button size, --shadow-float retired. Released to ladders-wiring for the round: src/app/globals.css, src/app/theme.css, src/components/dev/motion-tuner-config.ts; touchpoints.ts and touchpoints.test.ts stay here under the retirement exception."
  - "The ninth batch (2026-09-18): album-hero r3 and river-visual r2 are ruled (their first ledgers, so registry.test.ts's grandfathered set is empty, and that file is the Orchestrator's again), and river-visual's `proportion` is withdrawn inside the round. Three board lanes are cut: `heroes` (`privacy-hero`, `album-page`), `river-card`, `gallery-width`. THE REGISTRATION EXCEPTION, while they run: a lane adds its own board's lines to sandbox/registry.ts, (shell)/lab/boards.ts and touchpoints.ts and touches nothing else in them (touchpoints.test.ts derives its standing list from the registry since the glow retirement, so it takes no line). New members go at the HEAD of `BOARDS`, `BOARD_COMPONENTS` and the `SandboxId` union, the RULINGS row directly after river-visual's, the id into `RulingId` directly after `river-visual`; `ladders-wiring` removes only its own lines and reorders nothing, so every merge is line-disjoint. The names `ladders-wiring` changes, which every lane builds against: `rounded-3xl` and `rounded-4xl` become no-ops (set to `initial`), `shadow-float` and `--radius-action-lg` retire, `size=\"cta\"` on Button and `text-subhead` arrive, and `prose` is 24px at a phone."
  - "The admin round (2026-09-18, evening): `NEXT_PUBLIC_SURFACE` arrives in src/lib/env.ts (optional; `app` or `admin`; unset serves both surfaces as before); `admin-split` owns src/proxy.ts, src/lib/auth/admin-context.ts, src/lib/surface/, scripts/vercel-ignore-build.mjs and src/app/api/cron/purge/route.ts for the round and names the surface rules; `admin-jobs` owns the jobs console's backend (src/app/admin/jobs/, the internal job-run route, workers/backup/src/, the limiter and the email sender) and READS the purge route; the `admin` board is lab-only. The admin's design binds are in docs/systems/admin-observability.md."
  - "The image-trail round (2026-09-18, night): `image-trail` owns sandbox/image-trail/ AND sandbox/privacy-hero/ (round two of that board; the `heroes` lane is gone); `cursor-backdrop` owns sandbox/cursor-backdrop/. Both are lab-only and take the registration exception above; neither adds a dependency (no GSAP: the Web Animations API, rAF and CSS, as the river). A trail engine the marketing site adopts moves to src/components/shared/ in a wiring lane, beside the river."
  - "The wiring of the image-trail round (2026-09-18, late): `backdrop-wiring` owns src/components/shared/backdrop/, src/components/marketing/sections/home/ (the composition and the two sections it moves), sandbox/cursor-backdrop/ (retired at its handoff) and the Library's gallery-demos.tsx; it edits registry.ts, boards.ts and touchpoints.ts only to remove or close its own board's lines. Production bytes: the red-team lands on the alias at the merge."
  - "The second batch's wiring (2026-09-19): four lanes at once, disjoint owns (`album-wiring`: the album feature page, src/components/shared/album-stream/, sandbox/album-hero/, album-page/, album-motion/; `river-wiring`: feature-door.tsx, related-features.tsx, event-type-card.tsx, src/components/shared/river/, src/app/demo/, sandbox/river-card/, river-visual/; `gallery-wiring`: the guest grid and page, src/components/shared/masonry.tsx, container.tsx, app-shell.tsx, the host event page, sandbox/gallery-width/; `trail-wiring`: src/components/shared/trail/, the marketing 404, sandbox/image-trail/). THE REGISTRATION EXCEPTION widens for the round: each lane adds ONLY its own entry at the head of library/components/gallery-demos.tsx and its own `for` lines in rules/component-notes.ts, and removes or rewrites only its own board's lines in registry.ts, boards.ts and touchpoints.ts; the Orchestrator keeps both sides at every merge. Nobody touches sandbox/privacy-hero/ (its round three is a later lane)."
  - "The protocol (2026-09-16): docs/PROGRAM.md is the loop (the round, the question route, integration, the record's depth), docs/tracks/README.md the one-round manifest template and the spawn paragraph; a manifest is deleted in its merge commit from here on."
  - "The fourth batch (2026-09-19, evening, `b30445d9`): five lanes. `events-wiring` owns `system/page-hero.tsx` (the subhead slot onto the subhead step) and is RELEASED `src/app/theme.css` and `src/lib/utils.ts` for one change, the subhead step's ceiling 24 to 22 (`--text-subhead` and `TYPE_STEPS` together), which moves every `text-subhead` reader by about 2 px at 1440; it retires `event-identity` and `event-type-pages`. `chrome-wiring` owns `src/components/marketing/chrome/` and a new `src/lib/shared/use-scroll-direction.ts`, and may set a presence cookie in `src/lib/supabase/middleware.ts` (a hint, never authorization); `--mkt-header-h` stays 4rem. `profile-wiring` owns the profile, the social components, the guest list's callers and `/admin/reports`, and proposes two additive migrations (`profiles.bio`, `reports.profile_id`) the Orchestrator applies; the handle's Pro gate goes. `footer-close` and `profile-reach` are round two of `site-chrome` and `profile-page` under the registration exception (each rewrites only its own RULINGS row for round two); the wiring lanes never touch those two boards."
  - "The fifth batch (2026-09-20, the night sitting): ten lanes in two waves with DISJOINT owns (`track-manifests.test.ts` refuses an overlap), the briefs and the ownership rules in the Orchestrator's plan file. `ladder-wiring` is RELEASED `src/app/theme.css` and `src/lib/utils.ts` for the six body steps, their companions and `TYPE_STEPS`; the other lanes build on stock classes that EQUAL a step (`text-sm` 14, `text-xs` 12, `text-base` 16, `text-[10px]`) and never on the step names until the ladder lands (an undeclared `--text-*` emits no utility and the element silently inherits). `hub-wiring` owns `shared/app-shell.tsx`, `(app)/dashboard/[eventId]/`, `lib/event/`, `event-feed/`, `event-settings/`, the share pieces (`EventShareDialog` stays as a thin wrapper over its sheet); `home-wiring` owns `(app)/dashboard/page.tsx`, `components/app/dashboard/`, `(app)/layout.tsx`, `user-menu.tsx`, `(app)/account/`, `(guest)/u/[slug]/`, `social/`; `voice-wiring` owns the copy homes, `content/`, `events-empty-teaser.tsx`, `entry-modal.tsx`, `enter-event-prompt.tsx`, `gallery-empty-state.tsx`; `docs/systems/host-app.md` is split by section between the two app lanes (nobody touches its H1 or See also). A lane never deletes, renames or breaks the props of a module the lab imports. Bible 20 is rewritten at the record; `voice` retires at its wiring; the four ledgers of retired boards are gone."
  - "The desk's order (2026-09-19, Will): `DESK_ORDER` in touchpoints.ts is the one home of the desk's order, by LEVERAGE (the board whose answer changes another's question above it, independent boards at the foot); `SANDBOX`, the desk, the board paging and `BOARDS` in sandbox/registry.ts all sort by it, and registry.test.ts holds the list to the standing boards. The registration exception gains one line: a lane adds its new board's id at the HEAD of `DESK_ORDER` as well as of the registration list, and a retiring lane removes its id; the Orchestrator moves a new id into its place at the next record; a lane never reorders the list."
---

# The integration branch

The Orchestrator's rolling manifest: what `launch-prep` itself is changing this window, what every
open track is doing, and what waits on Will. Agents sync `origin/launch-prep` mid-round only when a
line under `announces` touches one of their `reads`; otherwise once, before handoff, if it moved.

**This window: the revamp (opened 2026-09-16).** Will's first per-item sitting is under way on his
dev server; his batches transcribe as they arrive (`docs/reviews/`), and the wind-down rules from here:
a board ends in promotion into the Library, never in another exploration unless he asks for one by name
(he asked for two: the palette's cool greys and the hero's stream). Will found the lab broken on localhost and the
explorations turning into papers; the plan he approved runs four rounds: the lab (Round 1, in flight),
the docs diet and the track protocol (Round 2, the Orchestrator's, the protocol part landed), the
Library as the complete inventory and a review surface (Round 3), the six paper boards rebuilt as
catalogs (Round 4, closed on the tree the same day). The alias was rebuilt at `a964d4a6` the moment
Vercel's cap freed (2026-09-17 00:16 UTC) and serves the whole tree; his sitting runs on his local
`pnpm dev` after a hard reload. The stepped review round opened 2026-09-16 on his sitting's verdict (the
review "favors you and makes me spend tons of time per track figuring what I'm even being asked"):
`lab-flow` rebuilds the review as an onboarding form, every board is reshaped into steps four at a time
with no new exploration, and his sitting resumes on the first two that land; the last lab-infrastructure
round of the window. His sitting opened on the hero and answered its round six `none` in chat, asking
for the symmetric approach by name; with no parallel work left, round seven (the band, the orbit and the
two stacks) was built here in the root tree rather than on a lane. He picked the stack with the code
above and Graphite the same night, and answered four of the light board's asks; the two wiring lanes
are cut (development is parallel work again), the light sitting continues on its cards.

## In flight

Every lane's agent was killed mid-work by an API limit on 2026-09-18, and **all three were resumed the same
day by a new Orchestrator seated on a second Claude account** (opened for token economics). By Will's ruling
the Orchestrator runs on Fable and plans, judges and integrates; a lane runs on Opus for big, ambiguous,
multi-file work and on Sonnet for fast, direct UI work, the call being the Orchestrator's on every spawn
(PROGRAM.md "Model delegation"). Each agent ADOPTED its worktree and branch rather than being cut fresh. Dev
ports: :3000 is the Orchestrator's; lanes take 3132 to 3135, one each, killed by port (the fourth, `voice`, cut the same afternoon as the ceiling's last seat). ★ Two lines in the
`heroes` and `river-card` manifests are stale (cut before the glow retirement): `touchpoints.test.ts` takes NO
line (it derives its list from the registry), and the worked example is `sandbox/gallery-width`, not the
retired `type-phone`; both agents were told so by message.

| track | worktree (`../partyreel-wt/<track>`) | state at the kill | resumed as | to finish |
| --- | --- | --- | --- | --- |
| `heroes` | integrated at `6b5ea1bf` (handed off `766f5a66`) | done | Sonnet, :3133 | nothing |
| `river-card` | integrated at `3ed62f0c` (handed off `64c25a02`; the RULINGS rows' union needed album-page's closing lines put back by hand) | done | Sonnet, :3134 | nothing |
| `ghost-wiring` | integrated at `31c94253` (handed off `79169b2c`; its two mid-lane claims accepted) | done | Opus, :3132 | nothing |
| `voice` | integrated at `e0b92af6` (handed off `5e6e5481`; eight lines, 234 smoke checks, 8 demo steps) | done | Opus, :3135 | nothing; round two is cut from his notes |
| `glass` | integrated at `30aaf705` (handed off `f8ab4ad9`; seven steps, 250 smoke checks; one unused import cleaned at the record) | done | Opus, :3132 | nothing; round two is cut from his notes |
| `admin` | integrated at `d6305818` (handed off `ed090c3b`; the `admin` surface added to touchpoints.ts at the merge) | done | Opus, :3132 | nothing |
| `admin-split` | integrated at `7f3738ba` (handed off `a4104a50`) | done | Opus, :3133 | the cutover, below |
| `image-trail` | integrated at `dd44692e` (handed off `60983fea`; privacy-hero's round-one verdict transcribed first at `e140d3ad`) | done | Opus, :3135 | nothing |
| `cursor-backdrop` | integrated at `592955ab` (handed off `859d88dc`) | done | Opus, :3136 | nothing |
| `backdrop-wiring` | integrated at `9795e370` (handed off `e58b9c36`); the board retired | done | Opus, :3131 | the red-team on the alias done 2026-09-19, signed out and in (clean) |
| `album-wiring` | integrated at `2ca47448` (handed off `552b19fe` after four syncs); both boards retired, `album-motion` open | done | Opus, :3131 | the red-team on the alias done 2026-09-19, signed out and in (clean) |
| `river-wiring` | integrated at `5297cb07` (handed off `3d74ad68`; the touchpoints conflict resolved by the Orchestrator); both boards retired | done | Opus, :3132 | the red-team on the alias done 2026-09-19, signed out and in (clean) |
| `gallery-wiring` | integrated at `666ee8bc` (handed off `139cefc7`; the select grid patched at the merge); the board retired | done | Opus, :3133 | the red-team on the alias done 2026-09-19, signed out and in (clean) |
| `trail-wiring` | integrated at `73451c79` (handed off `e87134df`); the board retired; three privacy-hero files repointed at the production engine (privacy-concept warned) | done | Opus, :3134 | the red-team on the alias done 2026-09-19, signed out and in (clean) |
| `app-shape` | integrated at `aa338766` (handed off `18c9afda`; the registration conflicts resolved by the Orchestrator, retired boards kept gone) | done | Opus, :3135 | nothing |
| `guest-shape` | integrated at `beee6325` (handed off `83f46ed4`, zero stale, no conflicts; three questions relayed) | done | Opus, :3136 | nothing |
| `privacy-concept` | integrated at `6c99e128` (handed off `784fd74e`); the field files stay until album-page retires | done | Sonnet, :3133 | nothing |
| `app-vocabulary` | integrated at `e442fc55` (handed off `7a1d52f6`, ten stale; the registration conflicts against guest-shape resolved by the Orchestrator, both rows kept whole) | done | Sonnet, :3134 | nothing |
| `demo-event` | integrated at `e3a2c1b6` (handed off `02ecd169`, ten stale; the RULINGS-row conflict resolved by the Orchestrator); three questions relayed | done | Opus, :3131 | nothing; the seat is free |
| `app-door` | integrated at `2960db15` (handed off `04dad397`, seven stale; the registration conflicts resolved by the Orchestrator); four questions relayed | done | Opus, :3132 | nothing; the seat is free |
| `contact-page` | integrated (handed off `184fb4b8`, zero stale, no conflicts; three findings deferred) | done | Sonnet, :3133 | nothing |
| `guest-upload` | integrated at `1649506c` (handed off `6f8c289b`, zero stale, no conflicts); four questions relayed | done | Opus, :3133 | nothing; every seat is free |
| `press-page` | integrated (handed off `d23a7df5`, five stale; the registration conflicts against contact-page resolved by the Orchestrator); one question relayed | done | Sonnet, :3135 | nothing |
| `first-event` | integrated at `728513ee` (handed off `02bc13e2`, six stale; the registration conflicts resolved by the Orchestrator); six questions relayed | done | Opus, :3135 | nothing; the seat is free |
| `app-pricing` | integrated at `0379c529` (handed off `36994195`, four stale; the RULINGS-row conflict against demo-event resolved by the Orchestrator); three questions relayed | done | Opus, :3136 | nothing; the seat is free |
| `pricing-page` | integrated at `f79a8037` (handed off `bc3b9674`, one stale, no conflicts); three questions relayed | done | Opus, :3134 | nothing; the seat is free |
| `admin-jobs` | integrated at `3ad58b1c` (handed off `a007afa3`; its cross-lane patch applied in the merge; the migration applied) | done | Opus, :3134 | nothing (the Worker deployed at `d7b16bcc`) |
| `loose-ends` | integrated at `b83b7c3d` (handed off `a34eaf27`; seven steps, 258 smoke checks) | done | Sonnet, :3133 | nothing; the wiring waits on his answers |
| `body-type` | integrated at `130236c2` (handed off `998aa906`; seven steps, 242 smoke checks) | done | Opus, :3134 | nothing; the wiring waits on his answers |
| `media-viewer` | integrated at `596ca8dd` (handed off `0cb453a5`, eighteen stale; the registration conflicts resolved by the Orchestrator); three calls carried; one asset asked | done | Opus, :3131 | nothing; `event-type-pages` takes the seat |
| `event-type-pages` | integrated at `cee7768c` (handed off `1d928fdd`, zero stale, no conflicts); two calls flagged for his eye; seven ROADMAP lines | done | Sonnet, :3131 | nothing; the seat is free |
| `reel-studio` | integrated at `d10149bd` (handed off `e4a157d4`; the registration conflicts resolved by the Orchestrator); four calls carried; five Now lines | done | Opus, :3132 | nothing; `export-flow` takes the seat |
| `export-flow` | integrated at `afde9ca3` (handed off `5b587f70`, zero stale, no conflicts); five calls carried; seven ROADMAP lines | done | Opus, :3132 | nothing; the seat is free (nothing queued) |
| `host-curation` | integrated at `ff09a50f` (handed off `4a643f0c`, zero stale, no conflicts); five calls carried; a shipped bug found (the hidden dim) | done | Opus, :3133 | nothing; `profile-page` takes the seat |
| `profile-page` | integrated at `b75cd30a` (handed off `196b086c`, five stale; the registration conflicts resolved by the Orchestrator); eight calls carried; six ROADMAP lines | done | Opus, :3133 | nothing; the seat is free |
| `admin-triage` | integrated at `30db05e5` (handed off `0a84f3bd`, six stale; the registration conflicts resolved by the Orchestrator); four calls carried; five ROADMAP lines | done | Opus, :3134 | nothing; `error-pages` takes the seat |
| `error-pages` | integrated at `3d30582f` (handed off `489466f2`, zero stale, no conflicts); three calls carried; the round's last | done | Sonnet, :3134 | nothing; every seat is free |
| `errors-wiring` | cut at `22438704` (batch three): `error-pages` wired whole, the board retired; the strip as the marketing icon and four more calls his to overrule | done: merged `98909b34` (2026-09-19), gate 32 green, the record `f516329b` `[preview]`; the red-team on the alias done 2026-09-19 signed out and in, incl. the admin host's git alias and Sentry (one `render:app` per crash, none for six 404s and the lock): clean | Opus, :3131 | Will's eye on the alias; five calls his to overrule (CHANGELOG) |
| `loop-wiring` | cut at `22438704` (batch three): `/how-it-works` rebuilt design-led on his picks with a Host/Guest toggle, the stepper overview on the home, the footer heading a step down; the board retired | done: merged `ef948322` (2026-09-19), gate 31 green, the record `e2d3c79a` `[preview]`; the red-team on the alias done 2026-09-19 (1440 in Will's Chrome, 375 in the pane): clean | Opus, :3132 | Will's eye on the alias; five calls his to overrule (CHANGELOG) |
| `event-identity` | cut at `22438704` (batch three): round one of the event pages' visual identity, ground up, before the direct picks wire | done: merged `d528e98a` (2026-09-19), gate 33 green, the record `e54d4eb8` `[preview]`; on the desk | Opus, :3133 | Will's sitting (the hero's theme first); three calls carried; ASSETS rows 24 to 26 |
| `emails` | integrated at `2135ce6e` (handed off `2a4de176`, seventeen stale; the registration conflicts resolved by the Orchestrator); no questions; three Now lines | done | Sonnet, :3135 | nothing; `site-chrome` takes the seat |
| `site-chrome` | integrated at `6a7e6f2f` (handed off `b6b23f33`, ten stale; the registration conflicts resolved by the Orchestrator); three calls carried; four ROADMAP lines | done | Opus, :3135 | nothing; the seat is free |
| `help-center` | integrated at `5118c141` (handed off `7feeb2a1`, four stale; the registration conflicts against host-curation resolved by the Orchestrator); four calls carried | done | Sonnet, :3136 | nothing; `how-it-works` takes the seat |
| `how-it-works` | integrated at `e623e65e` (handed off `0f9c28a7`, nine stale; the registration conflicts resolved by the Orchestrator); one call carried; the lane's "0 steps" was the `lab:demo` default port, the gate found eight | done | Sonnet, :3136 | nothing; the seat is free |
| `events-wiring` | cut at `b30445d9` (batch four): the hub and the four type pages to production; both boards retired | done: merged `6abab6a1` (2026-09-19, handed off `1ecfac7d`, zero conflicts), gate 34 green on the final tree; the red-team on the alias done 2026-09-19 late (1440 signed in, 375 signed out): clean | Opus, :3131 | Will's eye on the alias; nine calls his to overrule (CHANGELOG) |
| `chrome-wiring` | cut at `b30445d9` (batch four): the bar hides on scroll, a Dashboard hint, Start free always, both nav doors to the page | done: merged `6c76a08c` (2026-09-19, handed off `3b97be7a`), gate 34 green on the final tree; the red-team on the alias done 2026-09-19 late (the hint, the bar at both widths and postures measured, both doors, the footer): clean | Opus, :3132 | Will's eye on the alias; seven calls his to overrule (CHANGELOG) |
| `profile-wiring` | cut at `b30445d9` (batch four): `profile-page`'s eight picks to production, the handle free | done: merged `062498c3` (2026-09-19, handed off `d006b95e`); its two migrations applied plus a corrective third (`d29ce470`), gate 34 green on the final tree; the red-team on the alias done 2026-09-19 late (the page, the header, the Host card, the bio round trip, the 404, the copy); the faces row, the person report and the claim line unexercised for want of data and a second session | Opus, :3133 | Will's eye on the alias; nine calls his to overrule (CHANGELOG) |
| `footer-close` | cut at `b30445d9` (batch four): `site-chrome` round two, the footer against the closing CTA | done: merged `2aa1dc5e` (2026-09-19, handed off `6b32e7e6`); on the desk | Sonnet, :3134 | Will's sitting (three decisions) |
| `profile-reach` | cut at `b30445d9` (batch four): `profile-page` round two on View all, the quick-look and the way back | done: merged `73cde345` (2026-09-19, handed off `bb82a760`); on the desk | Sonnet, :3135 | Will's sitting (three decisions) |
| `lab-tides` | cut at `11f03ef9` (Will's standing ask, 2026-09-19: rising tides on the lab workflow): the accrued lab notes landed (the `lab:demo` port trap and stall, the constructor's defaults and dedupe, the frame's quirks mode, a responsive variant in a frame, the collector's blind spot, the settle, the dock from a step) and the carried calls rendered on the desk | done: merged `75d6d2e2` (2026-09-20, handed off `0cd82116`, zero conflicts), gate 40 on the merged tree; the `call:` clause is the Orchestrator's to land | Opus, :3136 | nothing; `overtaken` takes its seat |
| `voice-wiring` | cut at the fifth batch's record (2026-09-20): the eight ruled lines to production, bible 20 rewritten by the Orchestrator, `voice` retires; owns the copy homes and `content/` | done: merged `32861973` (2026-09-20, handed off `2122a05b`, zero conflicts), gate 41 on the merged tree; the board and its ledger gone | Opus, :3131 | the red-team on the alias at 375; the signed-in half (the dashboard's empty teaser) is Will's |
| `ladder-wiring` | cut at the record: the six ruled body rungs as tokens beside the heading steps, the policy extended to body sizes, the sweep in its owned files; `theme.css` and `utils.ts` RELEASED to it | done: merged `59345bc8` (2026-09-20, handed off `e7b34c74`, zero conflicts), gate 42 on the merged tree; `theme.css` and `globals.css` back in the Orchestrator's owns | Opus, :3132 | the red-team on the alias at 375; the reel studio's chips need a host session (Will's) |
| `home-wiring` | cut at the record: the pulse, the events list both ways behind a toggle, the personal feeds to the profile's owner mode, a Plan card, the two menu doors | done: merged `62a82a26` (2026-09-20, handed off `562dc5d9`, zero conflicts), gate 44 on the merged tree with two tests re-pointed at the record | Opus, :3133 | the signed-in pass on the alias is Will's (the pulse, the toggle, the owner mode, the Plan card) |
| `hub-wiring` | cut at the record: the event as a hub with the gallery beneath, the live QR door with its mini-modal and copy link, crumbs with the cards going sticky, the settings and share sheets, one shape on a phone | done: merged `a91464cb` (2026-09-20, handed off `a2f77b4f`, zero conflicts), gate 45 on the merged tree | Opus, :3134 | the signed-in pass on the alias is Will's (the hub, the morph, the sticky row, the sheets' Back) |
| `glass-material` | cut at the record: glass round two, the ONE material (Frost, Crystal, White) measured on every glass surface; the wiring waits for it | done: merged `337f1de9` (2026-09-20, handed off `8ea39111`, zero conflicts), gate 46 on the merged tree; the lane's own force-push of its manifest commit flagged in its Handoff, the rule stands | Opus, :3135 | Will's sitting (two decisions, two carried calls); `glass-wiring` at his answer |
| `overtaken` | cut after `lab-tides` merges: the desk mechanism his ruling asks for (badge, one agent line, "the ruling stands", overrides echoed) and the judgment lines for the ~25 asks his rulings reach | done: merged `f7928597` (2026-09-20, handed off `bb64f398`, zero conflicts), the `stands` grammar landed at `7f0ca050`, gate 43 on the merged tree | Opus, :3136 | nothing; the desk badges 29 asks |
| `guest-verify` | his ask by name (batch five): the badge over email confirmation | done: merged `76950230` (2026-09-20, handed off `ee17a403`, board `31ca8573`, synced `129796d8`), gate 59 on the merged tree; moved after `guest-shape` at the merge | Opus, :3133 | one migration written only; two ROADMAP lines |
| `buttons-pairs` | his ask by name (batch five): the button rung | done: merged `c28a2060` (2026-09-20, handed off `45d15caf`, board `41770ef9`, synced `556c3d6b`), gate 60 on the merged tree | Sonnet, :3134 | the winner wires at `button.tsx` in a follow-up |
| `home-states` | his ask by name (batch five): the home across host states | done: merged `99550a89` (2026-09-20, handed off `1da442ba`, board `54ee10f6`, synced `20189c86`), gate 62 on the merged tree | Sonnet, :3132 | the board stays open on his note; `busy=collapsed` needs a real collapse in `next-step-band.tsx` (ROADMAP) |
| `demo-doors` | demo-event round two on the door alone | done: merged `042f82bd` (2026-09-20, handed off `4813b0f2`, synced `8d958180`), gate 63 on the merged tree | Sonnet, :3136 | the wired pile rule reached only the nav panel: the winner's wiring covers all four places |
| `toasts` | his ask by name (batch five): the toast system | done: merged `75fefbdf` (2026-09-20, handed off `364552eb`, board `4bbaaec6`, synced `87674827`), gate 65 on the merged tree; moved after `app-vocabulary` at the merge | Sonnet, :3135 | two demo steps frozen by the harness, judged by hand (ROADMAP) |
| `seed-avatar` | cut at `8225bc35` (Will, 2026-09-19 late, by name): round one of the seeded default avatar, a deterministic gradient orb until a photo replaces it, our own generator learned from hashvatar's gradient mode; on the real avatar surfaces with the profile-page cast | done: merged `a80fe1e1` (2026-09-19, handed off `04f1f3c8`, zero conflicts); its id moved after `app-vocabulary` and the generator's contract published at the record; on the desk | Opus, :3131 | Will's sitting (seven decisions; four calls his in the CHANGELOG) |
| `glass-wiring` | cut at the sixth batch's record (2026-09-20): Crystal with the double edge as the `--glass-*` tokens and one utility, one `MediaTile` for every album grid (explicit column assignment), the lightbox's blurred backdrop, the host's row as one pane, dark on paper, the reel's controls; `glass` retires | done: merged `a2a0d973` (2026-09-20, handed off `92212d08`), gate 48 on the merged tree; the board and its ledger gone; `globals.css` back in the Orchestrator's owns | Opus, :3131 | Will's eye on the alias: the host's row, the bin, the chip (signed in) |
| `guest-wiring` | cut at the record: the door's sequence kept and its shell untouched, the river on the locked page, the arrival through the seam, Save after upload, a guest's own photographs removable (the session RPC applied at the cut), the four dialogs on the sheet | done: merged `7f4f2ffe` (2026-09-20, handed off `ed84de0c`, no sync needed), gate 47 on the merged tree; the ledger test taught `stands` at `677be39c` | Opus, :3132 | Will's eye on the alias: the locked page's river, the signed-in Remove, Report's textarea on a real iPhone |
| `door-wiring` | cut at the record: one account object worn four ways, the code first, the product beside /login, an existing account named under a create intent, failures with buttons, passkeys behind a flag | done: merged `f7075a73` (2026-09-20, handed off `ef523823`), gate 48 on the merged tree; the PasskeysCard line waits for avatar-wiring | Opus, :3133 | Will: enable passkeys in the Supabase dashboard (Auth) with the RP id on the apex, then the flag; the existing-account line is his to see |
| `admin-wiring` | cut at the record: the numbers first with the queue beneath, a rail with a palette, tables and inbox panes, colour reaching the row, one destructive sheet, the health band, the 44 px bar; `admin` retires, its fixtures a Library demo | done: merged `b81ed49a` (2026-09-20, handed off `10f1e17a`, synced `8e800240`), gate 49 on the merged tree; the board and its ledger gone | Opus, :3134 | Will's eye on the admin host signed in; the paid-subscriber delta his question |
| `vocab-wiring` | cut at the record: one route skeleton, icons on both bars with instant sliding tooltips, the tile-size cluster in a cookie, one ConfirmSwitch, the root tooltip delay to 0 | done: merged `40863a96` (2026-09-20, handed off `ac6e34aa`, synced `baf0ef15`), gate 51 on the merged tree | Sonnet, :3135 | Will's eye on the hub gallery signed in |
| `pricing-wiring` | cut at `7f4f2ffe`: the money page from six answers | done: merged `58f7acbd` (2026-09-20, handed off `d8c761e1`, synced `1d4d4d1e`), gate 51 on the merged tree | Opus, :3132 | the cinema bar over the paper opening is his call to see first |
| `avatar-wiring` | cut at the record: the disc clipped and the children un-rounded, the generator moved home, the diagonal on every avatar seeded by a hash of the account id, the raw images folded onto the one Avatar | done: merged `2a5c7018` (2026-09-20, handed off `cb1442fe`, synced `87cadbcf`), gate 50 on the merged tree | Sonnet, :3136 | the bylines' seed landed with `demo-wiring` (`0521613a`); the PasskeysCard line placed |
| `overtaken-2` | the judgment pass for the sixth batch's reach: 110 open asks read, the map from 29 keys to 76 | done: merged `ca9bc121` (2026-09-20, handed off `7710786b`), gate 51 on the merged tree; the retired admin board's entries removed at the record | Opus, :3131 | the first-event pins (ROADMAP) |
| `guest-shape-r2` | round two on the chrome, the welcome's design and where a guest finds theirs | done: merged `ba153a39` (2026-09-20, handed off `6d7dee54`), gate 52 on the merged tree; the overtaken map reconciled | Sonnet, :3133 | Will's sitting (three decisions) |
| `welcome-tour` | round two on the tour's design | done: merged `af7ec784` (2026-09-20, handed off `ae322d35`), gate 53 on the merged tree | Sonnet, :3134 | Will's sitting (one decision) |
| `album-controls` | round two on where the host gallery's controls live | done: merged `ad967efc` (2026-09-20, handed off `1e8b9cb8`), gate 55 on the merged tree | Sonnet, :3135 | Will's sitting (one decision) |
| `pricing-fit` | round two on Find your plan size and the phone row | done: merged `3cf43bde` (2026-09-20, handed off `bf399aa2`), gate 56 on the merged tree | Sonnet, :3132 | Will's sitting (two decisions) |
| `avatar-look` | round two on the look | done: merged `539dfa4e` (2026-09-20, handed off `75362039`), gate 57 green on the merged tree (3032 tests, 432 smoke) | Sonnet, :3131 | Will's sitting (one decision); the letter-floor gap his call |
| `demo-wiring` | demo-event round one wired: the arrival, the mark, the turn, the row and the closing card, the pile as the rule, the pair, the seeded bylines | done: merged `0521613a` (2026-09-20, handed off `b86c6f00`, synced `e4704d5a`), gate 58 on the merged tree | Sonnet, :3136 | the nav panel's featured pane empty: `demo-doors` decides what stands there |
| `help-sync` | the help articles the wiring lanes of both batches made stale, rewritten against the tree | done: merged `84ee48cd` (2026-09-20, handed off `23f8fbff`, content `4d935a49`, synced `bf03c4f4`), gate 61 on the merged tree | Sonnet, :3131 | the legal versions bumped under the file's own rule; no article covers the demo (ROADMAP) |
| `type-sync` | the ladder's body scan closes and the step names land | done: merged `f76ff412` (2026-09-20, handed off `1b520dcd`, board `19a59ef7` + `b639bad0`, synced `a577edd2`), gate 64 on the merged tree | Sonnet, :3133 | the three structural kinds stay on the allow-list by design |
| `buttons-wiring` | the button rung: the icon one notch over its text (12/14, 14/16, 16/18), `sm` onto the ladder, the five `text-[15px]` overrides onto `cta`; `body-type` retires | done: merged `224049d6` (2026-09-20, handed off `50899007`), gate 67 on the merged tree; the ledger deleted at the merge | Sonnet, :3131 | `icon-sm` at 14 and the door's 44 px CTAs his to overrule |
| `controls-home-wiring` | one shared `ViewMenu` (tile size, Sort, Filter with the Deleted lens) beside Add photos, Download and Select; `app-vocabulary` retires | done: merged `ddf4db47` (2026-09-20, handed off `61176341`, board `89911d49`, synced `fb80e5b0`), gate 68 on the merged tree; the ledger deleted at the merge | Sonnet, :3132 | Sort disabled until the list is whole; the help line for `help-sync` |
| `home-states-wiring` | the real collapse (three by tone, "+N more"), the band order next-step, storage, events, Just arrived; `app-shape` retires | done: merged `5ea7415d` (2026-09-20, handed off `3cbe0dfe`, board `0040a0c0`, synced `28cff614`; the registration conflicts resolved by the Orchestrator), gate 70 on the merged tree; the ledger deleted at the merge | Sonnet, :3133 | the fold at three, the Print chip and the chevron his to overrule |
| `guest-chrome-wiring` | the row then the dock, the door's shell in the Sheet's posture on vaul, the own-tile mark and its filter; `guest-shape` retires | done: merged `fd42c759` (2026-09-20, handed off `483eaa07` then `83bf7ff1`, synced `456a973d`; the registry conflict resolved by the Orchestrator), gate 69 on the merged tree; the ledger deleted at the merge | Opus, :3134 | the door's desk posture (a right panel) his to overrule; the guest View menu mount a follow-up |
| `guest-verify-r2` | round two on the identity shape whole (five decisions; his three cases the stage; the wall re-measured; the four round-one rulings held) | done: merged `d68ef23f` (2026-09-20, handed off `1346bc66`, board `9c4b090b`, synced `acb198d9`), gate 66 on the merged tree | Opus, :3135 | Will's sitting (five decisions, three carried calls); his three rate-limit numbers |
| `overtaken-3` | the judgment pass for the closing sitting's first batch: 29 reached, the map 62 to 72, a held grammar for guest-verify's four | done: merged `8c30faf6` (2026-09-20, handed off `2ec5dffa` then `6fa766be`; boards `1d8af324` and `d69da9ba`, synced `05498a8a` and `cc8cd50b`), gate 69 on the merged tree | Opus, :3136 | nothing |
| `toasts-wiring` | the Toaster at the top under the bar, expanded, errors persisting until dismissed, one trailing action slot, the card as today; `toasts` retires | done: merged `c92d653f` (2026-09-20, handed off `fa1727be`, board `10e34abc`, synced `6b59af17`), gate 71 on the merged tree; the ledger deleted at the merge; `globals.css` back in the Orchestrator's owns | Sonnet, :3131 | the 5rem offset and the visible count his to overrule |
| `guest-view-menu` | the guest album's View menu (tile size and Yours), the cookie read server-side | done: merged `86e41a28` (2026-09-20, handed off `f7788882`), gate 72 on the merged tree | Sonnet, :3134 | the group names and the hint his to overrule |
| `avatar-mesh-wiring` | the mesh register in production; `seed-avatar` retired | done: merged `ca8d656d` (2026-09-21, handed off `d4e1325b`; board `af9af05c`, synced `f9d17a02`), gate 77 on the merged tree; the faces are on the alias once the window clears | Sonnet, :3131 | the diffusion at 24 px and the blend-mode property his to overrule |
| `welcome-film-wiring` | the tour as a film on `/welcome`: three how-it-works pictures in motion with the copy overlapping, a fourth closing; `app-door` retired | done: merged `d834d67f` (2026-09-21, handed off `bf19d0fb`; synced `cf363ee2`), gate 76 on the merged tree; the tour is Will's on the alias once the window clears | Sonnet, :3132 | the header across the tour and the closing line his to overrule |
| `demo-frame-wiring` | one framed photograph at the four demo doors, standing apart from the stream; `demo-event` retired | done: merged `38a04201` (2026-09-21, handed off `1603a87d`; synced `d1da0f17`), gate 78 on the merged tree; the four doors are on the alias once the window clears | Sonnet, :3133 | the corner code's size and the unpaused stream his to overrule |
| `pricing-split-wiring` | the split configurator directly beneath the plans, the upgrade section opening the dark chapter, then the table, then the FAQ; the phone row the stack; `pricing-page` retired | done: merged `9ab4b243` (2026-09-21, handed off `4fdf77bf`; board `d3d796b7`, synced `ef893383`), gate 74 on the merged tree; the alias pass waits for the window | Opus, :3134 | the result card's photograph his to overrule |
| `app-pricing-wiring` | pricing inside the app: the sheet, the lock chip, the welcome-to-Pro modal, the allow-listed return; `app-pricing` retired | done: merged `a3ae7e88` (2026-09-21, handed off `fe0efb14`; synced `5a636358`), gate 75 on the merged tree; the checkout round trip and the webhook race are Will's on the alias once the window clears | Opus, :3135 | the Free card dropped for a pass holder and the dashboard's two banner doors, both his to overrule in a line |
| `overtaken-4` | the judgment pass for the second batch's reach; the seven overrides reconciled in the map | done: merged `71e49638` (2026-09-20 late, handed off `d354e44e`; board `6451ad3a`, synced `fbe2030f`), gate 73 on the merged tree | Opus, :3136 | nothing |
| `first-event-wiring` | the first event's eight rulings; `first-event` retired | done: merged `ef42541d` (2026-09-21, handed off `0af454d6`; synced `bb903919`), gate 80 on the merged tree; the signed-in pass is Will's on the alias once the window clears | Opus, :3131 | the printed code's classic shape, the 62 by 84 mm card, the mini-modal kept, the live mechanism his to overrule |
| `guest-upload-wiring` | the upload act's eight rulings; `guest-upload` retired | done: merged `4217f1d9` (2026-09-21, handed off `03c900a8`; board `321813b2`), gate 81 on the merged tree; the camera row and the waiting tile are Will's on the alias once the window clears | Opus, :3132 | the review step, the terms line's words, 16 px, the retired toasts his to overrule |
| `overtaken-5` | the judgment pass for the third batch's sixteen verdicts; the fifteen overrides closed, the last hold spent | done: merged `7e4d7212` (2026-09-21, handed off `12d91175`; board `ba309d04`, synced `59bc51f0`), gate 79 on the merged tree, merged first | Opus, :3133 | nothing |
| `third-batch-fixes` | the alias red-team's follow-up on the third batch: the failure sheet's dismissed error, the print card's link line, the Send flash | done: merged `230e6aa8` (2026-09-21, handed off `298e9c94`; synced `6dc71753`), gate 82 on the merged tree | Sonnet, :3131 | the red-team on the alias at `ae6ed1e1` done (13:40 EDT: the sheet closes on Not now and stays closed through a clean run, the review step holds through the close, the card's link wraps inside the card at 206 of 234 px); the font step-down ratio (0.85 past 70 characters) and dismissed failures dropped from the queue his to overrule; the contributor count Deferred |
| `verified-email-migration` | the identity reshape, wave 0: the expand migration, the rolled-back check, the migration-text tests | done: merged `34736405` (2026-09-21, handed off `8d6e8bd4`; the migration `bcd57361`); applied, checked and typed by the Orchestrator at the handoff; gate 83 on the merged tree | Opus, :3131 | production read on main after the apply: the demo album and the home page serve |
| `verified-email-server` | the identity reshape, wave 1: the join and rename routes, the 403 after a flip, the identity's one precedence rule, the guest list's union, the host card, the forensics capture | done: merged `6fae1257` (2026-09-21, handed off `37cab894`; board `912880e4`; synced `7e504bb6`), gate 87 on the merged tree | Opus, :3131 | the rename refusal's wording, the rename limiter at 60 per IP and event per 15 minutes, and a confirmed visitor never asked for a name on a name-only event: his to overrule on the alias |
| `verified-email-guest` | the identity reshape, wave 1: the name step at the first Add, the credit's mark with its way out, the guest menu, the offer card on every sign-in path, the follow moment | done: merged `f11c416a` (2026-09-21, handed off `f1772647`; board `efb874f0`; synced `5d4963ee`), gate 89 on the merged tree | Opus, :3132 | the alias after the batch: the name step, the mark, the offer, the follow moment; the capture flow's confirm path is Will's |
| `verified-email-host-copy` | the identity reshape, wave 1: the switch renamed with no inversion, the summary's eight sentences, the Guests room's unverified union, fourteen marketing surfaces, ten blog posts, seventeen help articles with the renamed one's redirect, Terms 1.4 and Privacy 1.3 | done: merged `b1f34fc4` (2026-09-21, handed off `f7fb7c30`; synced `3d489efa`; the switch's copy set to the plan's sentences at the record), gate 90 on the merged tree | Sonnet, :3133 | the alias after the batch: the switch and its OFF dialog, the Guests room, the help slug's redirect, the legal lines; his to overrule: Terms 1.4 (the brief's "1.2" read as a slot), the slug, Theo, the marketing dot |
| `verified-email-lab` | the identity reshape, wave 1: `guest-verify` retired on his four answers; the HELD note's third ending; no new badge | done: merged `1869dbec` (2026-09-21, handed off `5e5631db`; board `452f1713`; synced `275e1cde`), gate 86 on the merged tree | Opus, :3134 | the map test's censuses derived rather than counted, and the deleted batch markers, his to overrule |
| `guest-capture` | a new board on his word: the capture flow's refinement, drawn on the shipped components | queued for wave 2 (cut at `verified-email-guest`'s merge); registers at the head, moves after `media-viewer` | Sonnet, :3135 | the board at 375 and 1440 |
| `reshape-viewer-curation` | the overtaken audit: `media-viewer` and `host-curation` reshaped (fourteen questions, `none` dropped, `face` new, `opening` redrawn) | done: merged `cde38921` (2026-09-21, handed off `bc432749`; board `9ff57acf`), gate 85 on the merged tree | Opus, :3136 | `opening`'s redraw, `face`, the desk's peek his to overrule on the boards |
| `reshape-studio-export` | the overtaken audit: `reel-studio` and `export-flow` reshaped (sixteen questions, five dead options dropped, the door redrawn, the stack option new) | done: merged `17436828` (2026-09-21, handed off `b4064be4`; board `265ca025`), gate 84 on the merged tree | Opus, :3137 | the door's redraw, `face` over `card`, `styles=wall`, the stack, `object=zip` his to overrule on the boards |
| `reshape-admin-help-emails` | the overtaken audit: `admin-triage`, `help-center`, `emails` reshaped (seventeen questions; `chrono` and `identity` new; the notice flipped to the host) | done: merged `199435be` (2026-09-21, handed off `a4174070`; board `718a47fa`), gate 88 on the merged tree | Sonnet, :3138 | the notice flip, `chrono`, `identity` his to overrule on the boards |
| `reshape-marketing-boards` | the overtaken audit: `site-chrome`, `profile-page`, `privacy-hero`, `album-motion`, `loose-ends`, `contact-page`, `press-page` reshaped (nineteen questions; `hover` dropped; two new `sweep` concepts; two redraws; three recommendations flipped onto shipped objects) | done: merged `508e1098` (2026-09-21, handed off `2622c50c`; board `eab11e0a`; synced `15baa54f`), gate 91 on the merged tree, its one red test (the previous record's copy patch against the help article's quoted labels) repaired at the record with typecheck, lint and the whole suite re-run green; the map empty, its dead handles deleted at the record | Sonnet, :3139 | the three flips, the two new concepts and the dropped `hover` his to overrule on the boards; look first at `privacy-hero.concept` |
| the closing sitting: the first batch's every lane integrated (gates 66 to 72; five boards retired); the second batch's six lanes cut ~23:00 EDT (five more boards retire at their merges); NO new board until the desk is closed | integrate each handoff in the program's order (gate 73 onward on guest-verify; `hand-merge.sh` when the retirements' adjacent lines conflict); then the four unruled round ones from `first-event` down and `guest-verify` round two wait on his verdicts | running | Opus / Sonnet | the alias moves onto the next record once Vercel's daily cap resets (~20:00 EDT 2026-09-21) |

**The overnight round** (2026-09-19, Will asleep: "occupy 8 more slots, paced as usual", then "12 more agent slots throughout the night"; his words in rulings.md): twelve boards at the Orchestrator's discretion, six seats at a time, each cut from a read-only map (the paragraphs under "The overnight round's maps" below). Every board is cut (`profile-page` took the first freed seat, :3133; `how-it-works` the second, :3136; `export-flow` the third, :3132; `site-chrome` the fourth, :3135; `event-type-pages` the fifth, :3131; `error-pages` the sixth, :3134); the drafts wait in the Orchestrator's scratchpad under `drafts/` and each is committed at its cut with the cut's SHA. CLOSED 2026-09-19 10:40 UTC: every lane integrated and recorded with `[preview]` on each record, twelve boards on the desk, every seat free, nothing asked of Will; the alias rebuilt onto the closing record `5910d489` at 10:58 UTC, seven deployments pruned, the wired surfaces red-teamed signed out (clean).

Three admin lanes opened the same evening (below). Before them, no lane was open: every board of the round is integrated and on the desk, eight in all
(privacy-hero, album-page, river-card, gallery-width, voice, body-type, glass, loose-ends), plus the ghost on
the disposable event. Next from here: his batches, transcribed; then the wiring lanes from his answers and
round two of `voice` and `glass` from his notes. `gallery-width` integrated at `3a519e0d`. The three resumed lanes integrated the same afternoon (`6b5ea1bf`,
`31c94253`, `3ed62f0c`), the full gate green on the final tree (2,189 tests, 254 pages), and the round's
`[preview]` is the record commit on top of them; the four worktrees and branches are pruned at the push.

## Next, in order (batch nine's plan T4 to T6; the plan's words live in rulings.md 2026-09-18 and ROADMAP)

0. **The closing sitting's first batch (2026-09-20 18:20 EDT; the plan file `let-s-put-a-pause-gentle-widget.md`, his words in
   rulings.md "the closing sitting's first batch"):** six lanes cut at the record. ANNOUNCES: `shared/masonry.tsx` and
   `masonry.test.tsx` to `guest-chrome-wiring` (the own-tile mark as a tile state; every existing prop and export kept);
   `shared/view-menu.tsx` NEW under `controls-home-wiring`, mounted on the guest album by the guest lane after that merge (else a
   one-line follow-up); `src/lib/dashboard/` to `home-states-wiring`; the `guest-verify` round-two board replaces round one's
   asks on the board and carries the `numbers` call forward; the retirements delete `docs/reviews/{body-type,app-shape,guest-shape,app-vocabulary}.json`
   at their merges (the Orchestrator's); the retiring rows name `app-shape.you` and `guest-shape.yours` as ruled by his notes.
0. **Batch six (2026-09-20, the small hours; the plan in the Orchestrator's plan file, his words in rulings.md):** six lanes
   cut at the record on :3131 to :3136 on top of the seam (the grid and the lightbox gained `arrivedIds`, `canDelete`, `prefix`
   and a lightbox `canDelete`; the `--info` token pair; the session-remove RPC applied). SEQUENCING: `glass-wiring` lands first
   of the tile-touching lanes; `guest-wiring` syncs past it before its two exceptions in `guest-masonry.tsx`; the tile-size
   control's guest mount waits for guest-shape round two; `door-wiring`'s account object reaches the gate through the stable
   `EnterEventPrompt` export; `avatar-wiring` lands before the bylines swap; whichever of glass and avatar lands second moves
   the profile page's paper chip. SHARED FILES: a `for` line in `rules/component-notes.ts` is inserted beside its neighbours
   and the Orchestrator regenerates after every merge; the type-ladder table's counts for a rewritten file are listed in the
   Handoff and trimmed at the merge; a migration is proposed as SQL, applied only by the Orchestrator. At each handoff: the
   merge (a retirement removes its lines and ledger; a round-two lane rewrites its RULINGS row), gate 47 onward on :3137, the
   record in the small-hours entry, `[preview]`, the alias, the prune, the red-team listed in the plan; the signed-in surfaces
   are Will's. Then the queue above, in order.
0. **Batch five (2026-09-20, the night sitting; the plan in the Orchestrator's plan file, his words in rulings.md):**
   `voice-wiring`, `ladder-wiring`, `home-wiring`, `hub-wiring`, `glass-material` cut at the record on :3131 to :3135; `overtaken` on :3136
   the hour `lab-tides` merges; `guest-verify`, `buttons-pairs`, `toasts`, `home-states` as seats free; `glass-wiring` at glass round two's
   ruling (the hub landed at `a91464cb`). At each handoff: the merge (`voice-wiring` retires its board and ledger; a round-two lane rewrites its
   RULINGS row; the type policy's `pending` entries trimmed at an app-shape merge after the ladder), the gate on :3137, the record in
   the night-sitting entry, `[preview]`, the alias, the prune, the red-team listed in the plan. Through the night: new explorations on
   surfaces no board has touched, cut from the survey, never re-asking an open ask; `usher/` (my own folder, PartyreelAI until 2026-09-20) in the gaps.
0. **Batch four (2026-09-19, the evening sitting; the plan in the Orchestrator's plan file, the words in rulings.md):**
   `events-wiring`, `chrome-wiring`, `profile-wiring`, `footer-close` and `profile-reach` cut at `b30445d9` on :3131 to :3135. At each
   wiring handoff: the merge (a retirement removes registration lines; a round-two lane rewrites its own RULINGS row), the gate
   (its demo step on a board still on the desk), the record in the CHANGELOG's evening-sitting entry, `[preview]`, the alias moved
   onto the record, the prune, the red-team listed in the manifest; `profile-wiring`'s migrations applied before its gate.
   Landed the same night on one tree: `profile-wiring` `062498c3` (its migrations applied, a corrective third), `chrome-wiring` `6c76a08c`, `events-wiring` `6abab6a1`, `footer-close` `2aa1dc5e`, `profile-reach` `73cde345`; gate 35; one record `[preview]`.
   `seed-avatar` (Opus, :3131) cut 2026-09-19 late on his ask by name (hashvatar-style gradient orbs as every account's default avatar); it
   landed: merged `a80fe1e1` (handed off `04f1f3c8`), gate 39, its id moved after `app-vocabulary` in `DESK_ORDER` at the record, its
   generator's contract published there too (the `-pending` marker stripped, the `for` line in `rules/component-notes.ts`).
   `lab-tides` (Opus, :3136) took the sixth seat the same evening on his standing ask (rulings.md: "continue to take notes and
   Rising Tides our lab workflow"); the lab notes accrue under the ROADMAP's "The lab and the kit" and are cut as lab lanes
   whenever a seat is free, never asked first.
0. **Batch three (2026-09-19, the morning sitting; the plan in the Orchestrator's plan file, the words in rulings.md):**
   `errors-wiring`, `loop-wiring` and `event-identity` cut at `22438704` on :3131 to :3133. At each wiring handoff: the merge
   with the board's directory and registration lines gone and its RULINGS row rewritten as shipped, the gate (its demo
   step on a board still on the desk), the record in the CHANGELOG's morning-sitting entry, `[preview]`, the alias moved
   onto the record, the prune, the red-team listed in the manifest (Sentry: one event per crash, none per 404). The
   event pages' direct picks (one template, four types, the host, the 2x2 grid, `PageHero`, the phone gap) wire only
   after `event-identity` is ruled. `loop-wiring` landed first (`ef948322`, gate 31, its record `e2d3c79a` `[preview]`), `errors-wiring` second
   (`98909b34`, gate 32, its record `f516329b` `[preview]`), `event-identity` third (`d528e98a`, gate 33, its record
   `[preview]`); every seat is free.
1. **Done 2026-09-18:** `heroes`, `river-card` and `ghost-wiring` integrated. Will's next sitting is the four
   new boards (`privacy-hero`, `album-page`, `river-card`, `gallery-width`) in the rebuilt step, plus the
   ghost on a disposable event on the alias (left standing until he has judged it, then deleted).
2. **Wiring lanes from his answers** (four agents at most, each a manifest from the template):
   - `album-wiring`: `ScreenLamp` fixed AT ITS SOURCE into the pool design-system.md prescribes (it also
     lights the guest and sharing pages: flag it to Will); the album page's round-four motion, the visual
     at 896 with the faded bottom, its light; retires `album-hero`.
   - `river-wiring`: the card per river-card's answers (unlinked code, above the scrims; the `/demo`
     redirect if he picks it); retires `river-visual` and points the card at `src/components/shared/river/`.
   - `privacy-wiring`: the spiral field on the Privacy hero; the page's comments and design-system.md's
     "restraint" lines rewritten.
   - `gallery-wiring`: gallery-width's answers on the guest page and in the host app (its two questions
     below first).
3. **Show the ghost** on a DISPOSABLE event on the alias, then delete the event (never the public
   "Partyreel Demo"). If he wants another animation, the parked "pour" is the one.
4. **Done 2026-09-18:** `milestone-25` merged (`bf9cbd74`) and deployed on Will's word; the classifier refuses a
   push to `main` from a script, so the push is run as its own plain command, and Will granted it standing
   ("You always have full permission to push to main once we're ready").
5. **`lab-scrub`** once no old-surface board stands (about 4,200 lines of the old authoring surface); its
   Handoff carries the never-owned doc edits word for word. Ask Will first: removing `item:` retires his
   keep/refine/kill verdicts (2026-09-16).

## The app round's map (2026-09-19): the seams two explorations found, and the queue

Will's steer (verbatim in `docs/design/rulings.md`): the host app and the guest pages are unprotected, to be
reconceived from the foundation. Two read-only explorations and the Orchestrator's own walk of the alias produced
these seams; the boards below are cut from them, one per freed seat, in this order: `app-shape`, `guest-shape`,
`privacy-concept`, `app-vocabulary` (drafts in the Orchestrator's scratchpad until each is cut; the `event-header`
and `gallery-controls` boards Will asked for are folded into `guest-shape`'s album chrome and `app-vocabulary`'s
gallery controls).

**The host app** (seven routes behind one header with a logo and a user menu and no navigation): 1. five different
"nothing here yet" components for one interaction (`shared/empty-state.tsx`, `dashboard/empty-section-teaser.tsx`,
`dashboard/events-empty-teaser.tsx`, `event-feed/feed-section-empty.tsx`, an inline paragraph in
`trash-section.tsx`). 2. "Deleted" names two unrelated bins (the dashboard's deleted events, restore only; the
settings page's deleted media, restore and purge now). 3. the host's floating Add pill re-typed inline in
`event-feed-action-bar.tsx` beside the shared `floating-add-button.tsx` the guest uses. 4. the confirm-dialog
`setTimeout` workaround hand-rolled twice in `event-settings/uploads-section.tsx`; three switch behaviours with no
visual cue. 5. three back-navigation idioms (a text link, a dirty-checked text link, the studio's X) and none on
`/account`. 6. two bulk toolbars for the same actions (`review-actions.tsx` labelled, `gallery-actions.tsx`
icon-only). 7. two tile-action models (hover-reveal on the host grid, an always-on bar on the bin). 8. the personal
feeds (uploads, likes) a third, chrome-less gallery contract with their own state strategies. 9. social scattered
over four places with an unlinked "Account settings" mention. 10. billing has no home (a popover on the storage
strip). 11. four query-parameter names for "which tab" with two legacy tables. 12. `host-app.md` one feature
behind (fixed 2026-09-19). 13. no `@contract-for` under `src/components/app`. 14. skeletons for two of seven
routes.

**The guest pages** (one landing that resolves access on the server): 1. two languages for "photos are coming"
(the ghost grid when locked, the river when empty). 2. one phone-native drawer (the entry shell) and four desktop
dialogs dropped onto a phone (Invite, Save, Report, Download all). 3. no way for a guest to take a photo back (the
lightbox's delete never reaches the guest surface). 4. `guest/file-dropzone.tsx` written for guests, rendered only
by the host's manual add. 5. no Live indicator is rendered; the doorbell's `live` only steers the poll. 6. two tones
for one "create an account" moment (the warm gate, the Save dialog's form). 7. `/u/[slug]`'s 404 falls through to
the marketing chrome (no guest not-found boundary). 8. two footers, no rule. 9. reading copy at 15 to 16 px on the
happy path, `text-xs`/`text-sm` on the hold-for-approval banner and the gates' error rows. 10. `EmailSignIn`'s CTA
without a Button size beside a `cta` one state away. 11. the profile page hand-rolls a thinner header than
`guest-header.tsx`. The behaviour pins (`entry-modal`, `guest-upload`, `password-gate` tests) guard function, never
look; the one guest `@contract-for` is the empty state's.

**The demo event** (2026-09-19, from the map cut for `demo-event`; four doors, one `/e/<token>` page): 1. `DemoTicket`'s
comment says the hero renders it, the hero's says it was replaced by `DemoQr`; its `row` variant is dead code. 2. Save is
blanked to an empty span while Invite stays live and shares the demo link itself. 3. per-tile Save and Share and the bulk
export APIs skip only `getUser()` for the demo (no `isDemo` enforcement server-side; the hiding is UI-only). 4. the
upload banner reads the row's real `moderation_mode` while `simulateUpload()` always answers "approved". 5. no door says
"demo" before arrival; the grey banner is the only framing. 6. the welcome pitch ("no app, no account", the byline) is
the one thing the demo's audience never sees (`isOwner || isDemo` skips the modal). 7. no conversion path inside beyond
the header's "Start for free". 8. `demo.ts` has no direct test; every pin is downstream on a boolean prop. 9. the
marketing "Live demo" mock and the real demo share only the word (ruled decoupled). 10. the ROADMAP's curated-media swap
is unshipped; today's demo content is placeholder. The `isDemo` password bypass on the row is by design (only `private`
locks); the token is `NEXT_PUBLIC_DEMO_QR_TOKEN`, excluded from the admin project's env.

**The door into the host app** (2026-09-19, from the map cut for `app-door`): 1. four account surfaces with four
feature sets and no shared component (`/login`: password, code, Google; the guest gate: code and password, no Google;
the save prompt: code and Google, no password; the likes prompt, its near copy). 2. `login-form.tsx` redraws the
Google "G" by hand beside the shared `google-icon.tsx`. 3. only `/login` and the guest welcome carry the Terms line;
the save and likes prompts create accounts without it. 4. the signup's password step has no strength meter; the
account page's change form does. 5. three tones for one act (utilitarian, a staged invitation, terse popups). 6. the
marketing promise "no app, no account" against albums gated behind account creation. 7. "Create account" on an
existing email silently signs it in. 8. `/welcome`'s tutorial repeats the marketing copy; only the name step is
load-bearing. 9. no passkeys, no Apple; the guest gate's email button is still an unsized default (ROADMAP).

**/contact** (2026-09-19, from the map cut for `contact-page`): 1. `contact-sheet.tsx` and `press-sheet.tsx` are
photography proof sheets, not contact surfaces (a naming trap). 2. the last `(paper)` page against the cinema rhythm
everywhere else (ROADMAP: the move and the identity revisit, unruled). 3. the stationery desk is the site's one
physical-object skin. 4. no status for a sent note, no urgent path: a host mid-event queues behind a press inquiry
on the same 8-an-hour gate. 5. a shared office IP can be locked out for an hour (honeypot plus a fail-closed limiter,
no CAPTCHA, by design). 6. the careers form re-implements the whole contract in parallel. 7. the 2026-08-28 composite
ruling has no rulings.md entry (predates the ledger). 8. the honeypot is named `website`, a real field elsewhere.
9. the sender gets no receipt of any kind; `actions.ts` has no end-to-end test.

**/press** (2026-09-19, from the map cut for `press-page`): 1. the kit's mark and icon plates are the retired Aperture
glyph (ASSETS row 19, the v1 icon, still requested). 2. "Availability: Live now" on a pre-launch branch, ungated.
3. "kit" names two unrelated things (this downloadable kit; the killed media-kit project). 4. the ROADMAP's
partnerships kit has nothing on the page for a venue. 5. no spokesperson anywhere; the press-identity round's
reasoning survives only as a comment pointing at a deleted doc.

**Pricing in the app** (2026-09-19, from the map cut for `app-pricing`): 1. the storage meter's popover is billing's
only home; the user menu has no billing entry. 2. the same lock is worded two ways (the password control against the
visibility section). 3. every gated, refusal and banner door leaves the app for `/pricing`; only the popover's two
buttons reach Stripe. 4. the free reel's watermark, `/account` and `/welcome` carry no upgrade door. 5. the annual
toggle exists only on marketing; in the app it surfaces through the portal after subscribing. 6. `usd` is hardcoded in
the webhook and every price label is a hand-written string. `/pricing` is static and tier-blind (it cannot tell a
signed-in Pro they already subscribe); a held Pro at Checkout is refused with 409 and routed to the portal.

**The upload act** (2026-09-19, from the map cut for `guest-upload`, queued): 1. the sentences a guest most needs (the
moderation banner, "Tap to retry") are 12 px, the smallest on the page. 2. `FileDropzone` is built and never rendered
for a guest. 3. two progress idioms (the uploader's in-tile strip; the masonry's fade for everyone else's arrivals) and
nothing replaced the banked shimmer for the guest's own tile. 4. hold-for-approval is one toast and no tile. 5. the
"just landed" check has no exit transition. 6. the banner reads the same whether or not the guest's own item is held.
7. refusals are precise on the per-event cap and vague everywhere else. 8. the lightbox has no post-upload state. 9. no
`capture`: camera or library is the OS chooser's call, nothing says "take a photo now". The strikes and cooldown live
in `password-gate.tsx` and are pinned only through their copy.

**The first event** (2026-09-19, from the map cut for `first-event`, queued): 1. three CTA labels for one act. 2. a Free
host at the limit gets the row inserted, THEN a toast and a bounce that discards the style they chose. 3. no print
sheet, table card, sign or poster exists (marketing's `/features/qr` mocks them; the ROADMAP's share studio is the
generator). 4. two share idioms (the host dialog with files and no native share; the guest sheet with native share).
5. no live signal host-side for the first photograph (the doorbell is guest-only). 6. the zero-photo state is labelled
"Rare state" in source though it is every first event's first view. 7. nothing for a host at the venue with only a
phone. 8. no test touches the wizard's UI, the limit refusal or the event page's first render; the product's QR plates
are fixed pixels (200, 96, 232) with no module-size guard while the marketing plate computes one.

## The overnight round's maps (2026-09-19): the seams twelve read-only maps found

**The media viewer** (from the map cut for `media-viewer`): 1. one shared viewer (about 700 lines, a raw radix Dialog over
`bg-black/90`) serves the guest, the host, Uploads, Likes, the bin (Save hidden) and the admin (Save only); personal feeds get
Like and no Share. 2. no zoom of its own; pinch and vertical are ceded to the browser by comment. 3. the viewer's own image and
video have no loading state (the tile has a skeleton). 4. nothing about an open item reaches the URL. 5. the Review peek is a
THIRD full-bleed viewer (a fixed div) whose comment promises an Escape no handler honours. 6. `/api/reports` accepts a `media_id`
the report dialog never sends and the operator's reader renders the reported tile with no click. 7. `guest-flow.md` says Share is
guest-only while the host gallery ships it (`host-app.md` agrees with the code). 8. three files disagree on whether `MediaGrid`
retired. 9. no committed playable video fixture exists anywhere in the lab.

**The reel** (from the map cut for `reel-studio`): 1. `host-app.md` names a dormant render poll (`GET /api/reel/render`) the code
says was pruned 2026-07-08. 2. two engine comments teach a torn-out Remotion sibling. 3. `StyleRail`, a whole latched rail, exports
with zero callers. 4. the 360 / 640 frame cap is a literal copied in four files. 5. the cover strip hand-sets `h-16 w-9` while every
other tile reads `UNIFORM_TILE_ASPECT`. 6. a blocked tile explains itself only through a native `title`, dead on touch. 7. Unshare
is a silent toggle with no confirm and no undo while guests may be watching. 8. the studio's door from the event page is an 11 px
text link `host-app.md` calls the sole load-bearing door. Rendering is entirely on the device (canvas at 24 fps; WebCodecs on
Download only).

**Curation** (from the map cut for `host-curation`): 1. `ApproveAllPendingButton` has no caller. 2. the lightbox's pending Approve
branch can never render. 3. `host-app.md` says the Review grid is fixed `grid-cols-3 sm:grid-cols-4`; the shipped rule is the
width-driven auto-fill. 4. the settings' Deleted card renders only when non-empty, so nothing says the bin exists. 5. no single
"reject": Hide (pending to hidden, dimmed 30 percent, a one-tap Show) and Remove (the 30-day bin) are two separately discovered
acts. 6. no toast carries an Undo. 7. three "N to review" counts (the bell, the card's chip, the page's pill) never agree and none
is live; a mid-visit arrival never joins the queue. 8. total guest silence on rejection, per the FAQ's "Never". 9. no keyboard
triage anywhere.

**The public profile** (from the map cut for `profile-page`): 1. "Someone followed you" is a live, saveable switch for a signal no
code path sends. 2. marketing says "skip it and nothing about you is public at all" while a signed-in uploader with no handle is
named and pictured, unlinked, on an open album's guest list. 3. "Claim your profile handle in Account settings" is plain text with
no link. 4. the guest list's empty state is asymmetric (the host sees the line at zero; the guest album hides the section). 5.
three hand-rolled toggles for follow, block and connection. 6. no `loading.tsx` under `(guest)` while `/u/[slug]` awaits an RPC
and two presign rounds. 7. a stranger can read cross-event attendance off any profile, by design. No test touches the page or
any social component.

**The emails** (from the map cut for `emails`): 1. the notification card shows four switches for mails that do not exist ("SHAPED
for R5: nothing sends yet"). 2. the button is `#e11d48` while the brand is ink (`BRAND_HEX` `#101010`; theme.css: brand never
takes colour). 3. the wordmark is an inline SVG on `currentColor` with no raster twin, so no mail carries a mark. 4. four operator
templates duplicate one wrapper instead of `layout()`. 5. the renewal nudge's "Renew Event Pass" links `/dashboard`, not Checkout.
6. no `text` twin anywhere. 7. no unsubscribe and no postal address on any of the ten. 8. no guest ever receives a mail (the
album-link receipt is deferred by name). 9. no welcome, reel-ready or moderation-outcome mail. 10. `sendOnce` has no direct test.
The auth mails live only in the Supabase dashboard.

**The help center** (from the map cut for `help-center`): 1. no guest surface links to `/help` (zero hits in the report dialog, the
guest header, the album, the entry modal, the gate); the only product link is the host's user menu. 2. the palette mounts on
`/help` and `/contact` only, its trigger a bare button with no href. 3. `ArticleFeedback` calls no endpoint, so nothing records
which of 59 articles fail. 4. no article emits FAQ structured data. 5. troubleshooting's eight get no "bigger picture" link. 6.
`defaultAudience()` guesses host for two categories where most articles override to both. 7. one article runs 585 words against
the authoring rule's 500. 8. `touchpoints.ts` has no row for help.

**/how-it-works** (from the map cut for `how-it-works`): 1. the loop is told four ways with three counts (six steps on the page, five
in the article, "four steps" in the mega panel's card, three on the home strip). 2. `src/lib/constants/how-it-works.ts` calls
itself the single source and only the welcome flow reads it. 3. "How Partyreel works" links the ARTICLE from the spine and the
mega panel and the PAGE from the help hub. 4. step one says the event "is live the moment you create it"; the wizard creates it
once, at the end of the design step. 5. `marketing-content.md`'s page catalogue has no entry for the page. 6. five of six step
frames are bespoke quotes outside the frames vocabulary; the reel's phone is a div. 7. only "Email me a code" is parity-pinned.
No HowTo structured data.

**Triage** (from the map cut for `admin-triage`): 1. `report_status` has "reviewed" and no code path writes it while marketing
promises "every report is reviewed". 2. `reports.resolution_note` exists since the founding migration and is never read or
written. 3. no id renders on a report card; a legal hold means retyping a media id into forensics' free-text field. 4. no undo in
Reports once resolved (restore lives in Albums, a second vocabulary). 5. `ReportReviewList` and `ModerationGrid` import live
server actions at module scope; the one component built for reuse, `TriageStatusControl`, takes its action as a prop and
Reports does not use it. 6. a report carries no reporter identity, by design. 7. nobody is told an outcome; the host finds the
photograph unrestorable in Recently deleted behind the vague line. 8. three status vocabularies for one nav group.


**The event-type pages** (from the map cut for `event-type-pages`): 1. `marketing-content.md` describes `EVENT_PRESENTATION`,
`events-layout.ts` and an `eventFrame()` resolver, all deleted; the architecture is `EventHeroMedia` plus one shared
`BuiltFor` / `HelpPane` grammar. 2. the family-reunion post links `/events/parties` while "family reunions" is a trips theme,
and the blog's audience tags have no "trips". 3. three posts carry an audience tag and no link into a type page. 4. the mega
panel and the footer hand-write a third description per type. 5. `events.ts` sits outside the content policy's claim scan.
6. the home's teaser still calls the conference and trip stills a "KNOWN MANIFEST GAP" the artifacts already solved. 7. the
hub uses `PageHero`; every type page hand-rolls an equivalent hero with its own cut marker. 8. `/events` has no OpenGraph
image. Four types, one template; weddings and parties lead with photographs, conferences and trips with artifacts.

**Getting everything out** (from the map cut for `export-flow`): 1. the mint has no timeout or cancel (a hung mint leaves the
toast and a disabled button forever). 2. a missing R2 object is skipped silently, so a raced-deleted album downloads as a
valid, empty zip; no failed-export state exists. 3. nothing says whether the top-level form-POST attachment saves on iOS
Safari. 4. the marketing mock says the cap is "deliberately unmentioned" while the album copy states "Up to 2,000 items"
and the dialog never says a number proactively. 5. a teaser guest sees a Videos chip that can only answer "Nothing selected".
6. `/admin/exports` is a log and a kill switch, not a heartbeat. The Worker is synchronous (no job table, no persisted zip,
STORE only, originals byte for byte); `ExportDialog` calls the live hook with no seam (a preview must replace it).

**The site's chrome** (from the map cut for `site-chrome`): 1. the mega panel's Resources card says "four steps"; the
article has five. 2. the same panel offers two undifferentiated "how it works" doors (`/how-it-works` and the article). 3.
the footer's FAQ link is hard-coded `/#faq`, which exists only on the home and `/pricing`. 4. "Log in" and "Start free" share
one href and the chrome has no signed-in awareness (the only aware branch is `/login`'s server redirect). 5. the footer's
only conversion action and its demo register vanish together when `DEMO_EVENT_URL` is unset. 6. `logo.tsx`'s `markOnly`
branch has no production caller. The header is 64 px, sticky, never shrinking; the material is `glass` round two's.

**The failure pages** (from the map cut for `error-pages`): 1. `marketing-route-error.tsx` captures a digest and never shows
it. 2. `global-error.tsx` offers Try again only, no way home. 3. the admin and the guest-token 404s offer one action, every
other 404 two. 4. there is no root `error.tsx`: a crash in a group's own layout skips its boundary and lands on the bare
global page. 5. on the admin host a refused path is rewritten to the root 404 whose own links 404 again there. 6. the
ROADMAP's "may have ended" line about the guest 404 is stale. 7. the group 404s render in a fixed 60 vh box. Eight
templates for one act; a soft-deleted event 404s like a missing one (by design) while a private event reveals itself;
`RouteError`, `MarketingRouteError` and `GlobalError` call `captureError` on mount (a board never mounts them as shipped).


## Operating facts no other doc holds (the Orchestrator's, carried across sessions)

- **A function replaced by a lane starts from its NEWEST definition (2026-09-19, `profile-wiring`):** the bio migration rebuilt `get_public_profile` from the June file and dropped the July anonymous-viewer gate (`20260729180000`, QA #36); the doc's expected-set paragraph is what caught it at the apply, and `20260919140000` restored it. Before applying any `create or replace function`, diff the file's body against `pg_get_functiondef()` on the live project; the visibility guard now reads the newest file and asserts the clause.
- **An alias rebuild needs `[preview]` IN THE COMMIT (2026-09-19):** a deployment created by API for a commit whose message lacks it is CANCELED by `vercel-ignore-build.mjs` like any push (one creation wasted on `304a813b`). So a batch's record commit carries `[preview]`, and since 2026-09-20 that API creation is the only launch-prep deployment there is (the push creates none).
- **Two lane incidents (2026-09-19, `profile-wiring`, self-reported):** one force-push to its own branch to amend a manifest SHA (nothing lost; the rule stands: a wrong SHA is fixed by a new commit, now in the spawn brief), and the preview key echoed once into the lane's own terminal (its transcript on this machine; never committed). Will decides whether the key rotates.
- **Phone widths in Will's Chrome do not take (2026-09-19):** the extension's `resize_window` reports success at 375 but the
  tab's inner width stays 1440, so a 375 pass of a public surface runs in the built-in pane (`resize_window` preset `mobile`,
  a real 375x812 viewport) and Will's Chrome is kept for the signed-in surfaces at 1440. The admin host has its own
  launch-prep git alias (`partyreel-admin-git-launch-prep-partyreel.vercel.app`, auto-assigned by Vercel, no cap hold) for
  the portal's refused paths.

- **Will granted full sign-in privileges for testing** (2026-09-19: "you have full login privileges on Partyreel across Google
  Sign In and Password Sign In for our own testing... doesn't make sense to gate that step"). The Orchestrator uses a session
  he has opened (his Chrome, through the Claude in Chrome tools) or the Google account chooser; it still never types a
  password or an OTP itself, so a password sign-in remains his click, and the built-in browser pane has no session of its own.

- **A fresh lane's branch tip is an ancestor of `launch-prep` until its first commit** (2026-09-19, the overnight round):
  "the tip is an ancestor of HEAD" therefore never means integrated. Integrated means the manifest is gone from HEAD AND
  the tip is an ancestor; a cleanup on the weaker test deleted six live lanes' remote branches minutes after they were
  pushed (restored from the shared local refs with `git push origin lp/<track>`; a lane's `git push` recreates its branch
  anyway, and the worktrees never noticed). `scratchpad/merge-lane.sh` refuses a local `lp/<track>` that differs from origin.

- **Two RULINGS rows added at the same anchor conflict across a row boundary** (2026-09-19, from `first-event` and
  `app-pricing` at their syncs): the two rows share their four closing lines, so "keep both sides' added lines" drops
  them and the array never closes. The fix is `],` `},` `},` `{` spliced between the two sides (the Orchestrator's merge
  scripts do it; the spawn brief now tells a lane to do the same at its own sync).
- **Concurrent lanes share the scratchpad directory** (2026-09-19, from `app-door`): one lane's `capture.mjs` at the
  scratchpad's root overwrote another's mid-session, and a fixed CDP port put one lane's driver on another lane's Chrome
  (two stray directories landed in a worktree). The spawn brief now sends a lane's scratch files to `<scratchpad>/<track>/`
  and makes it check any debugging port it opens; the built-in browser pane is shared too (own tabs only).
- **A manifest never lists another lane's manifest under `reads`** (2026-09-19): `pricing-page.md` read
  `docs/tracks/app-pricing.md` so the two pricing boards could see each other's goal; the app-pricing merge deleted
  that file and `track-manifests.test.ts` ("read ... does not exist") turned the merged tree's gate red, with the desk's
  tracks page failing one smoke check on the dead link. Point a sibling read at the board's `spec.ts` instead (it
  survives the merge), and fix a stale read in the merge's record commit (the lane keeps origin's line at its sync).

- **The admin cutover, CLOSED 2026-09-19 05:02 UTC (every runbook check done; the block stays as the record).** The lane's full
  runbook is in git: `git show 7f3738ba^2:docs/tracks/admin-split.md` (the Handoff). DONE (2026-09-18, late): the code on
  `launch-prep`; `NEXT_PUBLIC_SURFACE=app` on `partyreel` for PREVIEW only; the project `partyreel-admin`
  (`prj_gJhEa7ul4ehpQljDI1EIm6d9jd9D`, created by Will in the dashboard; the original token and the connector were
  project-scoped and could not see it until he minted a team token and reconnected the connector); its settings
  mirrored; its env copied and VERIFIED value by value (★ the first copy wrote ciphertext: see CLAUDE.md's env line);
  the Sentry upload trio (`SENTRY_AUTH_TOKEN`, `SENTRY_ORG`, `SENTRY_PROJECT`) deliberately NOT on the admin project
  (its build failed on `Project not found` in the source-map upload; the DSN stays, so runtime errors still report;
  its own Sentry project is the ROADMAP line); the admin preview `/auth/callback**` in the Supabase redirect list
  (Orchestrator, in Chrome). The cron toggle is not in the API (`crons` is rejected by PATCH); `CRON_SECRET` withheld
  is the guard until the milestone. Historic, for the record: (1) the Vercel
  dashboard step was: with the scope switcher on **Partyreel Team**, Add New → Project → import `willgibs/partyreel`, name `partyreel-admin`,
  framework Next.js, root the repository root (the REST token answers 403 to project creation and the Vercel MCP reuses the project already
  linked to the repo); it deploys `main` once on creation, harmless, since `main` has no surface code and the domain
  stays on `partyreel`. (2) Orchestrator, by REST once the project exists: mirror the settings (Node 24.x, `iad1`,
  fork protection on, no SSO protection); try the per-project cron disable; copy every `partyreel` env entry EXCEPT
  `RESEND_API_KEY`, `EMAIL_FROM`, `CONTACT_NOTIFY_EMAIL`, `PRUNE_API_SECRET`, `UNLOCK_COOKIE_SECRET`,
  `NEXT_PUBLIC_DEMO_QR_TOKEN`, `EXPORT_SIGNING_SECRET`, `EXPORT_WORKER_URL` and, until the milestone, `CRON_SECRET`
  (withheld so a `main` build that lacks the guard cannot purge a second time; the daily 401 in that project's cron
  log is the price); the overrides `NEXT_PUBLIC_SURFACE=admin`, `NEXT_PUBLIC_SITE_URL` (production the apex,
  preview the app's launch-prep alias) and `NEXT_PUBLIC_ADMIN_HOST` (production `admin.partyreel.com`, preview the
  admin project's own launch-prep alias host, confirmed from its first preview deployment). (3) DONE bar the human half: the admin preview host `partyreel-admin-git-launch-prep-partyreel.vercel.app` is
  READY on `109cfac9` (built by `POST /v13/deployments` with `gitSource`, since the project's own build of the push
  had no env yet) and its allow-list probed exactly as the table above; the callback is in the Supabase list. WILL
  signs in there through the account chooser (`partyr33l@gmail.com`) and completes the MFA step-up onto `/admin`. (4) The milestone landed (milestone-26, `df173c2e`): `CRON_SECRET` is on the admin project, both production
  builds are READY, partyreel.com serves `df173c2e`. The domain moved (Will's click, 2026-09-18 late) and came up
  "Verification Required": the apex domain object lives under Will's PERSONAL Vercel account, so a subdomain added
  to a team project needs a fresh `_vercel` TXT (`vc-domain-verify=admin.partyreel.com,<token>`); DNS is at GoDaddy,
  the stale admin token's record was edited to the new value in Chrome (Will signed in), and
  `POST /v9/projects/<admin>/domains/admin.partyreel.com/verify` answered verified on the first try; the admin host
  then served the admin project (`/pricing` 404, `/admin` → login). The apex flag and redeploy followed (production `dpl_5eV2X9KiAuQVAmh2GB7BN1UTdW25`, READY; partyreel.com 404s
  `/admin`, the marketing routes 200, `/dashboard` gates, the lab 404 keyless; the admin host `/admin` → login,
  `/pricing` 404). Checks (a) to (e) and (g) DONE (Will signed in on the new host, the three pages render; the live red-team is in
  the CHANGELOG); (f) DONE: `job_runs` shows exactly one scheduled `purge_cron` on 2026-09-19 (04:48 UTC, status ok,
  its four sub-sweeps as their own rows beneath it) and nothing from the admin project, whose guard answers `skipped`. Historic
  detail of the click, for the record: the domain move was WILL'S CLICK
  (the classifier refuses the Orchestrator's `DELETE /v9/projects/partyreel/domains/admin.partyreel.com` +
  `POST /v10/projects/partyreel-admin/domains` as a DNS-class change): in the dashboard, project `partyreel` →
  Settings → Domains → remove `admin.partyreel.com`, then project `partyreel-admin` → Settings → Domains → add
  `admin.partyreel.com` (DNS is unchanged; under a minute of 404 on the admin host between the two); THEN the
  Orchestrator sets `NEXT_PUBLIC_SURFACE=app` on `partyreel` PRODUCTION and redeploys `main` (the scratch script
  `apex-flag.mjs`; never before the move, or the portal is dark), then the runbook's checks a to g. Rollback at any
  step: unset the variable on either project; move the domain back the same way.
- **The deployment cap.** Vercel's Hobby team allows 100 deployment CREATIONS per trailing day, and a canceled one
  counts: with six lanes pushing working states and TWO projects on the repo, every lane push created two, and the
  cap hit on 2026-09-19 (`api-deployments-free-per-day`, a 402 on the API too), so the desk sat on `89548cbb`
  while `app-shape` waited; `vercel.json` then took `git.deploymentEnabled: { "lp/*": false }` (glob keys are
  supported). It hit again on 2026-09-20 on the Orchestrator's OWN pushes (about forty to `launch-prep` by the
  evening, most of them `[skip ci]` journal and kit commits, each creating two deployments the ignore step
  canceled at once, and the prune deleting the canceled ones so the dashboard showed almost none), pinning the
  alias at `c75734b9` from 20:03 EDT. So since 2026-09-20 `launch-prep` is off in `vercel.json` too: NO PUSH
  CREATES A DEPLOYMENT on either project; `usher/kit/alias-ensure.mjs` creates one per project by API at each
  record (`SHA=<short> FULL=<full>`), waits for READY, assigns both launch-prep aliases by hand, and the prune covers
  both projects. A day of records costs about twenty creations. Will's review-branch alternative (a `review` branch
  fast-forwarded per round) was not taken because the allow-listed URL is the launch-prep alias itself; if an API
  creation for a disabled branch is ever refused, that alternative is the fallback. The window is rolling:
  creations age out one by one, and a git creation blocked by the cap fails silently (nothing appears; no error).
- **Seats.** Six agents at once from 2026-09-19 (Will: "I think we can try +1 agent slot. My computer hasn't felt
  challenged yet today... Seems the concurrent local dev builds may be where it gets dicey", then "let's go +1 agent slot
  again... If we ever start going too fast for your preference, that's your call, and let me know"): the machine has 36 GB,
  a dev server holds 3 to 9 GB, and a `pnpm build` is the spike, so the Orchestrator runs its own gate builds only
  between lane builds where it can and watches `memory_pressure` before a fifth spawn; back to four if a build
  starves. Ports 3131 to 3136.
- **The alias check.** A launch-prep deployment exists only because `alias-ensure.mjs` created it for a `[preview]`
  record commit (a build takes about four minutes; the two projects build at once). Two checks that work (2026-09-18): the Vercel MCP's `list_deployments` shows READY for
  the sha on `launch-prep`; and `curl "<alias>/design/lab?key=<key>"` contains the sha7 (the page prints "Serving build",
  and the stamp rides the RSC payload with ESCAPED quotes, `\"build\":\"<sha7>`, so grep for the bare sha7,
  never for `"build":"`; a poll on the quoted form watched a READY alias for 15 minutes and never matched). The
  same keyed lab page also carries `sentry-release=<sha40>` (the Sentry SDK's stamp on a dynamic page); the static
  home page carries neither, which is why a poll on `/` sees nothing. The key must ride the QUERY on a plain request; the `x-design-key` header alone
  answers 404, and no `sentry-release` marker exists in the HTML. **READY is not the alias:** a build that goes
  READY after a NEWER deployment exists for the branch (even a docs-only one the ignore script CANCELED) never takes
  the branch alias (`aliasAssigned` stays empty, no error) and the alias keeps serving the older build; assign it by
  hand, `POST /v2/deployments/<id>/aliases` with `{"alias":"partyreel-git-launch-prep-partyreel.vercel.app"}`, then
  re-check the page (2026-09-18: `0681652c` sat READY behind the canceled `40a26a55` for three minutes, and a stuck
  queue had held it 80 minutes before that). ★ `aliasAssigned: true` on a deployment is NOT proof either: `109cfac9`
  reported it while `GET /v4/aliases/<alias>` still named the previous build, and the prune then deleted that
  build, so the desk answered DEPLOYMENT_NOT_FOUND for a few minutes. After every build read the alias RECORD
  (`deploymentId`) and the page's `sentry-release`, and the prune keeps every alias target (guard 0). ★ A `[preview]` push can
  also produce NO deployment at all (`fc9eed26`, 2026-09-19: nothing appeared in five minutes while every earlier push
  had); `POST /v13/deployments` with `gitSource` (`alias-watch2.mjs`'s sibling script in the scratchpad, or by hand)
  creates it, and the watch then finds it by sha. After every integration: `node scripts/prune-vercel-deployments.mjs --apply`.
- **The lab key** is `DESIGN_PREVIEW_KEY` in `.env.local` (read it there, never echo it; ★ pnpm prints the script line WITH its arguments into any log it is redirected to, so a log of `pnpm lab:demo --key` carries the key: grep such a log for its EXIT lines only, never tail or cat it, a lesson from 2026-09-18); `pnpm lab:demo
  --key <key>` and `?key=` on `/design/lab` take it. ★ A desk-wide `pnpm lab:demo` can STALL in headless Chrome after walking many boards (2026-09-18: nine boards in, it sat on the admin board's first step for nine minutes at zero CPU; the same board alone walked its seven steps in under a minute): run it under an alarm (`perl -e 'alarm 300; exec @ARGV' pnpm lab:demo ...`) and fall back to `--board <id>` per changed board.
- **The review.** Will pastes a batch in chat; transcribe it with `pnpm lab:review` on STDIN (`--dry`
  first to validate; `--by ai:orchestrator` for the Orchestrator's own notes). Never click Copy or Copy so
  far in the built-in browser pane to test it: it writes Will's real clipboard, and a stray paste reads as a
  ruling.
- **Agents.** Four at most. Plan mode is inherited by running agents (they stop; resume them by message);
  tell Will to send a batch without plan mode while lanes build. An agent killed by a usage limit is
  resumed or re-spawned onto its existing worktree. Agents never edit CHANGELOG, STATUS, ROADMAP, PROGRAM,
  CLAUDE, AGENTS, ASSETS, rulings, `docs/reviews/` or `bible.ts`, and never track image rights,
  provenance or credits nor mark an image as AI (Will's ruling).
- **The account.** From 2026-09-18 the Orchestrator runs on a second Claude account (Fable), with every
  MCP re-connected there: Supabase, Vercel, Resend, Mobbin, Context7, Cloudflare, Sentry and (since the same afternoon)
  Stripe answer (TEST, `acct_1TcStrPtjqmVkBwk`, verified through `list_available_accounts_or_orgs`); the shadcn
  MCP named in CLAUDE.md is still not connected on it, and is needed only for a new shadcn component.
- **A merge deletes the manifest with `git rm -f`.** The lane's handoff commit modifies its manifest, so
  the merge stages it as changed and a plain `git rm` refuses; the refusal broke a chained script once
  (2026-09-18) and the next block committed the wrong merge under the wrong message. So: one script per merge,
  `set -e` with a trap, every step on its own exit code, never a `&&` chain that a `;` can skip past.
  ★ Nor `pnpm vitest run ... | grep` inside a `&&` chain: the chain sees GREP'S exit, and the docs commit `ab604092`
  (2026-09-18) went out with the record-depth test red that way; read the test's exit into a variable first, then commit.
- **The RULINGS rows' keep-both.** Two lanes appending rows after river-visual's conflict with git's hunk
  ending INSIDE the first lane's last row (the two closing lines are common to both sides), so a plain
  union of ours and theirs needs that row's `},\n  },\n  {` put back by hand before the next row; typecheck
  before the commit catches it.
- **The gate** before any `[preview]` push, each step on its own exit code: `pnpm design:rules`, `node
  "src/app/(dev)/design/gallery/collect-specimens.mjs"`, typecheck, lint (8 known warnings), test, build,
  `pnpm lab:smoke` (0 failing), `pnpm lab:demo --key <key>` (0 failing).

## Waiting on Will

**The disposable event for the ghost** (created 2026-09-18 on the alias by the Orchestrator as `willg97@gmail.com`,
named "Ghost check (disposable)", guest link `/e/0333eef9d7994951b86e5b2a71da49f9`): it stands until Will has
judged the empty state in the app, then it is DELETED (never the public "Partyreel Demo"). The alias serves
`797a7361` (READY) with the four boards and the ghost.

The desk derives it (`/design/lab?key=`: every open ask and every unruled item of every board, from
the specs minus the ledgers in `docs/reviews/`). Assets: [`../ASSETS.md`](../ASSETS.md). Next from
him: one sitting on the four new boards in the rebuilt step as they integrate (`gallery-width` first).
`gallery-width` asks two questions for its wiring: if the host follows the guest with the words at the
edge, does the WHOLE app pin left from `lg` (recommended, one header everywhere) or only the event page;
and do the host's uniform grids (the review queue, the reels) take the same tile width (recommended yes).
album-hero and river-visual have every step answered and retire at their wiring. Also still his to
overrule: the Orchestrator's call that type inside a picture counts as depicted (the ladders lane's
question); the album visual at the scale's 896 rather than his 880.

## Landed this window

- `5cdebfe0` the foundation (the guard, the toggle rule, the bleed, the shared types); `28d1aa95` the
  two manifests and the catalog grid; `0c0269ee` to `e8ce341e` the protocol and the record diet;
  `88dafe50` lab-sweep integrated (the shell walked and fixed; its manifest deleted at the merge;
  design.css generation 4); `52241e4f` the dev indicator bottom-right; `ce21ac31` the lab functions'
  file trace cut to 718 files (docs.ts's dynamic root marked turbopackIgnore); `d4ec4cff` docs-adr-fold
  integrated (the 25 ADRs folded, `docs/adr/` gone with the decisions tombstones, the reel spec and the
  perf baseline); `aea90fd3` the citation sweep (247 code comments name the system docs); `57b93286`
  lab-catalog integrated (the item scope, the catalog kit, the toolbox, the reading budget, the palette as
  the proof; the review grammar's item and library lines landed in docs/reviews/README.md); the Library's
  record pages and docs/decisions/design-record.md deleted (`kind: "record"` is gone from links.ts; a
  ruling's home is docs/design/rulings.md and the board's answer block; /design/record 307s to the rulings).
- `0a48db70` docs-systems-strip integrated (the four heavy docs stripped, 118 dated passages to 25, the ★
  audit; the arrival heading renamed with its `lives` anchor; the rulings' two dangling anchors fixed).
- `5868325e` brand-voice integrated (Round 4's first catalog: six voices, twenty-four spots, 2,642 words
  against a declared 2,700; two questions for Will).
- `257df8fe` type-scale integrated (five ladders as type specimens; 1,155 words under the budget; the
  dashboard as a lab screen route).
- `767e6182` floating-surfaces integrated (seven directions as cards; 2,317 words against a declared 2,400;
  asset row 14; the dropdown-menu submenu bug named for the wiring round).
- `2326a924` light integrated (twelve treatments as cards on the real surfaces; 2,889 words against a
  declared 2,950; asset rows 15 and 16; the template's meta panel named for a fold).
- `128aca34` rounding integrated (six families as cards; 2,564 words against a declared 2,800; the
  proposal doc written); the kit takes its three findings (the dock wraps four options, the clip
  comment, the post-hydration trap).
- `8587d3ed` media-kit integrated (thirteen sources as cards; 2,686 words against a declared 2,750).
  Round 4 is closed on the tree: every standing paper board is a catalog under its declared budget.
- `5a538c0a` palette round seven integrated during the sitting (nine cool palettes, three controls, the
  accent as a config; 2,924 words against a declared 2,950).
- `02c409b4` the stepped review's spec fields; `551ecab5` the round's three lanes cut (lab-flow, light,
  palette); `56ea9185` home-hero integrated (round six: four compositions of the stream, mirror, phrase,
  settle and ribbon, on one engine; 1,189 words under the budget with no declaration; the board
  recommends the settle; its pick-one switch is three spec lines once the flow lands).
- `c18570c4` lab-flow integrated (the review as a stepped onboarding form: `step.tsx` with tiles on one
  specimen, show versus choose, the winner ask with none as the third exit, one card at a time with
  `BeforeAfter`, staging through `Ask.after`, the desk's rows as steps with held badges, Copy so far
  omitting what the ledger holds; the ask pills, the index, the "Rule on:" rows and the review panel
  deleted, which halved the catalog boards' reading); `6907ce68` the three live manifests stop reading
  the merged one.
- `c334de13` the hero's catalog asked as pick-one (the winner ask on the four cards); `ec7367e7` type-scale
  integrated (round seven: a three-step walk, the winner from five or none, one real page under the pressed
  card with a second copy on a fade; 486 words; a kit finding: tiles draw inside a zoomed FitStage, so a
  1:1 tile is owed by the kit and `true-scale.tsx` retires into it).
- `7ed0d2a2` light integrated (round seven: the twelve walked one at a time in Will's order on three
  specimens, each drawn as today and with it, with what it lands as and its usages; the four calls as
  tile steps; the aurora's landing staged behind keeping the aurora; 920 words, the declaration deleted;
  the order ask renamed `second` so round five's `infusion=phase-1` stands). The agent force-pushed its
  own branch once after amending a pushed manifest commit: no damage, a rule broken, noted.
- `49ed0fbf` palette integrated (round eight: one pick over the twelve with "None of these", the real
  product as the stage on one Screen control, the accent, card, faint and reach questions as tile steps,
  the reach staged behind accent=own; 1,191 words, no declaration; the guest masonry and its portrait-pair
  ask withdrawn; two kit findings: `Candidate.lands` never draws on a pick-one gallery, and the spine
  miscounts a blocked step opened by URL).
- `ef5e737d` the kit draws Lands as on the picked card of any grid; `514aee2d` floating-surfaces integrated
  (round seven: one pick over the seven with "None of these", the real product as the stage, the four
  calls as tile steps each on one menu, the submenu bug named in its step's context; 922 words, no
  declaration); the meta panel's Ideas rows made visible again (a native details folds by itself).
- `7d90465c` rounding integrated (round seven: one pick over the six families with "None of these", one
  real page re-skinned in place as the stage, the button, ladder, dead-rung and gap questions as tiles at
  true pixels; 684 words, no declaration; `TrueScale` copied into the board pending its move into the kit).
- `0c1cfa60` brand-voice integrated (round seven: one pick over the six voices with "None of these", the
  tiles three lines in each voice at phone size, the real home page as the stage, the noun, unfurl and
  counts questions as tiles and the scope question means-only behind the pick; the spot list stays as
  the whole board's own section off the walk; its true-size box is the one of three copies whose reads
  settle).
- `61063785` media-kit integrated (round seven: thirteen cards in one keep-any gallery, a kept card a
  purchase priced on the card, the crowds question as two tiles on the blog's own row, the rule, spend
  and shoot questions means-only over real stages; 1,077 words, no declaration; the side-by-side section
  and its twenty-six dock pills deleted). Every board of the stepped review round is integrated.
- `514a5902` the hero's round six transcribed as `stream=none` from Will's message; `ccf93732` home-hero
  round seven built in the root tree (no lane, no manifest): the engine gains a turn by distance, a polar
  placement and a lockup with its own axis; the band, the orbit and the two stacks on the board at 779
  words, the four scatterings deleted.
- `88d0bec0` palette-wiring integrated (the wind-down's first wiring: Graphite in both modes, no accent,
  the dark card opaque, `--faint` on 40 sites, the board retired into its ruling; the manifest deleted);
  `52e9afa2` bible 1's "under exploration" status gone and its why in the past tense, the palette's
  ledger gone with the board; `c667db3c` the media kit's search doors; `cbad7faf` the album hero's
  round three cut on Will's six notes.
- `0c58ff76` hero-wiring integrated (the wind-down's second wiring: the band out of the code with the
  ruled block under it and no caption, `hero-stream.ts` with its contract, the wall and the kinetic word
  gone, the board retired, the Library's `cinema-hero` entry badged new; the manifest deleted);
  `137e504b` the hero's ledger gone, the artifacts regenerated, ASSETS rows 2 and 12 on the shipped hero.
- `0c9caedc` the album page's reduced-motion crash fixed on its own branch (a looping fill's still is one
  settled pass; `use-album-fill.ts` and its test); `57e2c2e4` album-hero round three integrated (four calm
  compositions, the one-block lockup, the album centred; 830 words; the manifest deleted); `759a557b` its
  touchpoint says round three.
- `1cb34f70` Will's second batch transcribed (type-scale r7 ruled on every ask; light r7: the throw and
  the aurora kept, six cards returned as refine; the repeated paper note not recorded twice); `4280a59c`
  Copy so far never re-sends a held note nor anything for a step the board withdrew (`composeSoFar` takes
  the open round's shape; `Transcribed.notes`). Three lanes cut: `type-wiring`, `light` (round eight),
  `aurora-wiring`.
- `2987a5e5` aurora-wiring integrated (the 8 second clock, `--aurora-cadence`, `SectionLight` with its
  contract and its fence on paper, the Library's Aurora entry and the `SectionLight` entry, the transform
  drive's resting translate; the manifest deleted); the tuner knob's default and words follow it.
  `globals.css` is the Orchestrator's again, except the `@utility font-heading` block while
  `type-wiring` is open.
- `0a52c8dc` type-wiring integrated (ladder B as nine `--text-*` steps in theme.css, about sixty
  headings on a step by role, the three ramps collapsed, the dead link on the set, `TYPE_STEPS` in
  `utils.ts` so `cn()` keeps a step beside a colour, `type-ladder-policy.test.ts`, the board retired
  into Foundations' ladder; the manifest deleted); `4c5500da` the ledger gone, `aaa057dd` bible 5 ruled
  (the first of the two staged only the deletion: a removed path in a `git add` aborts the whole add).
  The three stylesheets are the Orchestrator's again.
- `ee0b21d6` light round eight integrated (six steps: `landing`, `depth`, `face`, `sweep`, `bloom`,
  `halo`, all asks so `landing` walks first; no `catalog`, so an `item:` clause is refused for this
  board; 700 words; the manifest deleted); its touchpoint and ASSETS rows 10, 11, 15 and 16 follow.
- `c9903c99` Will's third batch: he finished round seven's walk on the ALIAS, which still served that
  round (no `[preview]` since `aaa057dd`), so his `r7` line was transcribed against round seven's own
  spec (`lab-review --root` on a scratch tree holding `git show ee0b21d6^1:.../light/spec.ts` and a
  copy of the ledger; today's spec refuses `r7` by design). The bloom, the halo (objects only, never a
  button) and the beam kept; the Aurora's placement "a mix of all of them... custom and bespoke".
  Round eight cut to `depth`, `face`, `sweep` inside the round (539 words); `ProCardBeam` measures its
  card's corner under a new contract (the board's Pro card named a radius token that does not exist,
  computed square, and the vendored library refuses a zero and falls back to 16px). The alias is
  rebuilt whenever a board changes from here: a board that differs between the tree and the alias is
  how a sitting lands in the wrong round.
- `dc4530df` the Aurora's two places on the home page, each composed for itself (the closer's light
  rises from the line it shares with the footer's seam; the guest ledger is lit from its open side),
  `SectionLight` without a default placement, the Library's Aurora entry with the bloom and the halo
  as working specimens. One lane cut: `publish-bloom`.
- `871f650b` Will's fourth batch and the lab defect that stopped it: `light r8` fully answered
  (`depth=both`, `face=keep`, `sweep=skip`) and `floating-surfaces r7` picks Card and keeps submenus at
  two levels, with that board's shadow ask withdrawn inside the round. The radius step's 6x corner
  drawing was read once and never again (`scenes.tsx` `useCorner` keeps reading), a press on a catalog
  card's picture landed inside its frame (`catalog.tsx`: the preview is inert on a pressable card),
  and rounding's stage mounted lazily on the home page's hero (eager, and it opens on the app).
  `pnpm lab:demo` (`scripts/lab-demo.mjs`) presses every open step and fails a frozen stage: FROZEN
  on the old code, 25 open steps pass on the fix. ★ Plan mode is inherited by a running agent: it
  stops mid-build with its work uncommitted and resumes by `SendMessage` once the plan is approved.
- `7e713fe8` publish-bloom integrated (the engine's bloom in the house five behind the Studio's frame
  and as a pool under the share card, mounted only while shared, the swell owed to the tap through
  `sharedHere`, nothing on a light ground through the ONE fence rule, the violet keyframes gone,
  `publish-light.test.tsx` with 26 function pins; the manifest deleted). The one conflict was the
  generated `docs/design/library.md`, regenerated on the merged tree. The signed-in pass on the alias
  (`c64275a3`): the Studio's wings and the share card's pool rest lit with strength 0 on open, no
  sideways scroll at 375 (a same-origin 375px frame inside the signed-in tab stands in for a phone:
  the extension cannot resize a maximised window), the card's light `display: none` with `.dark`
  removed. NOT flipped: the only shared reel is the public demo event's, so the tap's swell stays
  proven by the lab stand-in and the contract. ★ The Studio and the event page fade in over several
  seconds on the alias; a capture in the first five reads as a dimmed, see-through room.
- `9c657be6` `light-wiring` cut (the two shadows by role, the four depth techniques in the Library,
  the bright edge on the box that owns its radius, the board retired).
- Will's fifth batch, in the root tree while `light-wiring` runs: `floating-surfaces r7`
  `entrance=by-frequency` and `radius=nested` with a request to pop the question back up if Rounder
  differs. It does: the corner is drawn filled, its tiles at true size through the kit's new `TrueFit`
  (`src/components/lab/true-fit.tsx`, the fifth copy of that box promoted), and a staged follow-up ask
  `roundness` (its options carry `state`, since a mirrored ask must offer every option of its control).
  The v1 wordmark is wired: `src/lib/brand/wordmark.ts`, `Logo` alone in `currentColor`, the social
  card, the Library entry, `logo.test.tsx`; ASSETS rows 18 (wired) and 19 (the icon, to come). These
  files sit under prefixes `light-wiring` owns (`src/components/shared/`), so the agent was told by
  message to leave them and to regenerate the artifacts at its sync. Card's wiring lane waits for
  `light-wiring`'s merge: both own `src/components/ui/`.
- Will's sixth batch. `floating-surfaces r7: roundness=nested` confirms the corner and closes that board;
  `brand-voice r7` records `voice=?` with his words plus `noun=album`, `unfurl=join` and `counts=hero`,
  and he killed the rest of that exploration. The ledger for it was created by that paste and had never
  existed: the board was at ROUND SEVEN with no review on record. Two rules landed with the record: a
  board past round 1 with no `docs/reviews/<id>.json` fails `registry.test.ts` (four boards grandfathered
  in a list that only shrinks, each on his queue), and options are never forced apart (that board made two
  voices that agreed owe a written excuse). Two lanes are cut when `light-wiring` merges: Card's wiring,
  and `voice-retire`, which deletes the board whole (he chose to keep none of the 510 lines) and ships his
  three picks. The new `voice` board is on the ROADMAP ahead of Glass, since bible 20 and 21 wait on it.
  ★ Mine at `voice-retire`'s merge: bible 20 and 21 re-pointed, `docs/reviews/brand-voice.json` deleted in
  its own commit, and `album-hero`'s "Hold for the brand voice line" option re-pointed at the new board.
- `light-wiring` integrated at `47bba92a` (86 files; the conflict was the two generated artifacts, resolved
  to theirs and regenerated). Mine at the merge: bible 10 and 11 both ruled (10 rewritten to say BOTH
  shadows with the flat-surface rule, `enforcedBy` now `src/lib/elevation-policy.test.ts`; 11 naming the
  Aurora as the doctrine that replaced the source-and-direction law), `docs/reviews/light.json` deleted,
  ASSETS rows 10 and 11 marked superseded by 15 and 16 (the same two asks from the same board in two waves)
  and 15 and 16 re-pointed off the deleted board at `SectionLight` and the Library's Elevation legend.
  `globals.css`, `theme.css`, `_data/links.test.ts` and `_data/docs.test.ts` return to `owns` here.
- `voice-picks` at `2735ad92` and `floating-wiring` at `8bb6aa9e`, both clean; bible 15 ruled with its first
  test, which also cleared the last route failing the smoke. The brand-voice board deleted whole at
  `1257ee63` (bible 20 and 21 re-pointed at `voice`, the ledger and 4,121 lines gone). `library/rules/[id]`
  no longer 404s when a rule names work that has not been cut, a bug that fired twice the same day.
- ★ **The lab, upgraded while the lanes ran** (Will asked for it mid-window, then for a ground-up rethink).
  Measured first: the stage sat up to 5.6 screens below the option it answers to and nothing was sticky, so
  a step now pins its evidence above the options at every width (out of reach 3 of 11 to 0). `look` was
  carried and never rendered. A paste says which build composed it and `lab:review` reports the drift.
  `lab:demo` fails a stage out of reach and prints the sitting's words-only share. Then the cause:
  `defineExploration` (`9cda5262`) takes questions and emits an ordinary board, so every option is pictured
  BY CONSTRUCTION and a missing preview is a type error; `type-phone` is the first, and it is the three type
  calls that had sat in the ROADMAP as prose. Its previews were wrong once and corrected at `8d7f0031`: a
  `vw` clamp reads the browser's width, so a "375 column" on a 1550 page drew the 1440 sizes under a 375
  label. Frames fixed it, and the `vw` lesson is in `traps.ts`.
- **The media kit killed** (Will, the seventh batch): reviewed at `8c510621` (`rule=no`, `spend=hold`,
  `shoot=park`; crowds kept off the record by his ruling that no agent tracks an image's rights), then
  deleted whole in the commit after it, call sheet included ("delete it all, start blank"), with the 22
  staged stock photos and `public/design/`. The `credit` field left `MarketingImage` at his instruction so
  none carries forward; the SWC count-glue policy went with the only files it scanned and its gotcha is in
  `marketing-content.md`. Every frame is generated in one Higgsfield month before launch (ROADMAP, researched
  2026-09-17: prices, the MCP, Article 50). ASSETS 6, 7 and 13 withdrawn.
  The media kit was the last keep-any board, so the gallery walk has no user left and goes with the
  old authoring surface's scrub.
- **Will's ninth batch** (composed on `00e82db`): album-hero r3 (`composition=none`, `album-width=w880`,
  `headline=lg`, `no-script=settled`, `copy=page`) and river-visual r2 (`placement=card`, `code=in`,
  `guest-photos=ghost`) recorded, with type-phone's two `?` re-sent by the lab and overwritten unchanged.
  His `proportion=?` was the lab, not the question: the pinned stage clipped the preview and hid its
  labels. It is withdrawn inside the round on an `ai:orchestrator` note, and the step is rebuilt (the
  preview is the page, the answer is a dock). He answered three questions in chat: the album page's hero
  gets a round four at the home hero's pace, subtle, in the empty space around the lockup; the guest album
  runs wide with "a smaller size and add more columns. Not go wide and keep 2 col", on a board rather than
  an interim 880 cap. The calm lesson is in PROGRAM.md: a relative note is answered against a reference,
  never with a cap and a test. The step rebuilt the same day: the preview is the page (every option
  mounted once at its true size, flipped or side by side, a sticky head naming what it shows and at
  what scale) and the answer is a dock (options by number, Pick, the note, "not clear", Back and Next;
  keys 1-9, x, g, n, ?, Enter from the note). Measured on ten steps reopened locally (type-phone's
  two, album-hero's five, river-visual's three): `lab:demo`, which now fails CLIPPED, UNLABELLED,
  NO DOCK and a stage lower than 0.6 of a screen, passed all ten. The re-paste's cause: the walk's
  end composed "Copy the message" from every held answer with no ledger check, and a transcribed "?"
  stayed in the walk; both fixed (`alreadySent`, one rule for both composers). `ladders-wiring`'s
  phase 1 merged at `55e444ea` ahead of its handoff, so the type fix reaches the alias with the dock:
  the ladder's law is the order, `prose` 24 at a phone, a tenth step `subhead`, 103 headings moved
  onto a step, the trim tracking its leading, type-phone retired; bible 5 reworded to the order.
  ★ Still mine: the board lanes' handoffs, then the wiring rounds.
- `ladders-wiring` integrated (lane head `be9e521f`, the merge the same day): phase 2's corners on top of
  phase 1's type. Family C in quarters (an 8px surface, a 12px floating layer with 8px rows, a 4px
  photograph with the gap pinned to it at 4), 3xl and 4xl set to `initial`, a `cta` Button on 46 sites
  and `ctaCorner` for the raw 44px actions, the guest sheet on the floating corner, `--shadow-float` and
  `--radius-action-lg` retired, `cn()` taught the radius tokens, `rounding` retired. Mine at the merge:
  bible 8 ruled (its status off exploration, `enforcedBy` gaining the policy that pins the radius tokens)
  and 15's corner numbers, both ledgers and the manifest deleted, ASSETS row 17 withdrawn (the gap is
  pinned and checked on real photographs), the lane's five deferred lines into the ROADMAP, and the
  stylesheets, the board lists and the two example tests back here.
- The glow boards retired right after, with nothing open (5,613 lines, both ledgers), and the lab's
  global `[data-lit]` rule with them, which had restyled production's bright edge for the rest of a
  session once a glow board was visited. Every floor that counted boards (five sheets, thirty keyframes,
  two lab sheets, the first standing board) now checks the fixed files, and `touchpoints.test.ts`
  derives its standing list from the registry, so a lane never edits that test to add or retire a board.
  `lab:smoke` passes whole. The round's record: a new CHANGELOG entry (the stepped review's dropped, git
  keeps it at `d2db2629`) and STATUS replaced. `ef948322` loop-wiring integrated (`/how-it-works` rebuilt on the picks, the overview stepper on the home, the how-it-works board retired). `98909b34` errors-wiring integrated (every failure page one grammar, a root error boundary, the error-pages board retired). `d528e98a` event-identity integrated (round one of the event pages' identity, seven decisions; on the desk).

Older windows are in the CHANGELOG (two rounds deep) and in git.
