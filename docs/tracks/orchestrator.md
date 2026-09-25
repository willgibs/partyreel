---
track: orchestrator
status: open
cut: "e30aaada"          # the launch-prep SHA this state was written at
owns:                    # the standing claims no lane touches
  - src/app/globals.css
  - src/app/theme.css
  - src/app/(marketing)/marketing.css
  - src/app/(dev)/design/rules/bible.ts
  - src/app/(dev)/design/rules/bible.test.ts
  - src/app/(dev)/design/sandbox/registry.ts
  - src/app/(dev)/design/(shell)/lab/boards.ts
  - src/lib/design-gate/
  - src/app/api/design-gate/
  - scripts/vercel-ignore-build.mjs
  - .github/workflows/ci.yml
reads:
  - CLAUDE.md
  - docs/PROGRAM.md
announces:
  - "reel-defaults-migration merged at 71cfea65 (2026-09-25), its migration applied: `events.reel_hold_sec` (NULL = the default hold; read it with `resolveHoldSec(row.reel_hold_sec)`, since the generated type says `number`), returned last by `get_event_by_qr_token`; `HOLD_STEPS_SEC`, `DEFAULT_HOLD_SEC`, `nearestHoldStep`, `REEL_MOOD_IDS` in `@/lib/reel/defaults` (their one home: the guest lane drops its copies); `setReelDefaults({ eventId, showReel?, styleId?, holdSec? })` in `@/lib/reel/defaults-action` for the view's Set for everyone and Settings; `event_stills(uuid[], int)` (authenticated, one jsonb of preview keys an event, presigned server-side like `readCoverUrls`). reel-guest-wiring and reel-host-wiring merge origin/launch-prep past it."
  - "media-viewer-wiring merged at 7eb190de (2026-09-24): `MediaLightbox`/`MediaLightboxLazy` take `origin={{ kind: \"reel\", rect }}` (rect null fades in; omit `returnTo` so the way out lands in the frame) and `startAt` (a clip's seconds); `ViewerOrigin` is exported from `@/components/shared/media-lightbox`; the photo parameter is `PHOTO_PARAM` with `readPhotoParam` in `@/lib/media/share-save`, whose Save follows the platform (the clip's finish reuses it)."
---

# The Orchestrator's state

The pickup: read this first at every session start, compaction or restart, then `docs/STATUS.md`. It holds only what
is true now: what runs, what comes next, what waits on Will. How to cut, integrate, deploy and recover is the runbook,
[`usher/kit/README.md`](../../usher/kit/README.md). Rewritten in place, never a log. The Orchestrator is whichever
model Will seats (Fable or Opus); nothing here depends on which.

## In flight

Up to eight lanes at once (Will, 2026-09-24); every production build, a lane's or the kit's gate, takes turns
through `scripts/build-lock.sh` (the kit's gate takes it itself). Batch 2 is cut from `e30aaada`; the live plan is
`~/.claude/plans/great-work-however-1-dapper-twilight.md` (the lanes' manifests carry everything they need).

| lane | what | state | model, port | at its handoff |
| --- | --- | --- | --- | --- |
| `album-rows` | the justified rows engine and an opt-in `rows` layout on the shared grid (masonry stays the default), then `album-columns` r2 on it | working (agent `a4df869a96aed6e65`) | Opus, :3131 | integrate for build 8; its Handoff lists each surface's switch for `album-rows-wiring` |
| `clip-bench` | `reel-cut` r2 (the workbench with moments and looks inside it) and `reel-story`'s noun | working (agent `a3b9e5aa5c95602c2`) | Opus, :3138 | integrate for build 8 |
| `reel-host-wiring` | the host's reel side (the Reel card counting to two, one review number, the Highlight reel section, the band and the cards' crossfade, the Studio's host pieces out) and the wide host pages | working (agent `a7a1fff0cd8e82d51`); syncs past the migration lane when announced | Opus, :3133 | HOLD unmerged for the stretch |
| `reel-guest-wiring` | the live reel's guest side with batch 2: the window start, the code toggle at 1024 and up, the view live only at two (the code on a drop), the owner's extras (Play on a screen, Set for everyone, Close back), the hold per event over the host's default, "clip", the 12px phone gutter | handed off at `7d5bfb32` (synced past the migration; gate green on `a3c4eb53`); HOLD unmerged (agent `a744f57e3c4cbd81f`) | Opus, :3137 | integrate first in the stretch; the owner's extras, fullscreen and the wake lock prove on its alias build; its two calls (the pill without fullscreen, "Everyone sees this look") are Will's to overrule |

## Next, in order

1. **Build 8**: integrate `album-rows` and `clip-bench`, read their new asks side by side (`board-card.mjs --desk`), one
   `[preview]`, then Will's sitting: `reel-cut` r2, `reel-story`, `reel-front` r2, `album-columns` r2, `media-viewer` r2.
2. **After the sitting**: cut `reel-clip-wiring` (Opus; the creator, the bench as picked, the finish as amended, the
   Studio's `src/components/reel/` pieces out, the client adds), `reel-sweep` (Opus; the copy from `reel-story`, help,
   legal, admin, docs, `docs/systems/reel.md`) and `reel-teardown` (Sonnet; `reel_clip_add`; the stored files' end);
   the guest lane's last re-open (`reel-front` r2, the creator seam). The stretch integrates guest, host, clip,
   teardown, sweep, synced; one `[preview]` (build 9); the red-team; the drop migration on Will's yes; the one-shot
   R2 sweep; the reel boards and ledgers retire after their manifests close.
3. **`album-rows-wiring`** (Opus): every surface to rows with `album-columns` r2's picks, the jump-free first paint,
   the five steps, and `media-viewer` r2's mark; build 10.
4. **The lab revamp**, once the desk's open boards close and before new explorations open: a board as one
   self-registering folder, its metadata in its spec, lab checks scoped to the lane's own boards, the authoring API
   trimmed, a fresh agent proving it; with library-lean's board ideas (a `Surfaces` family of live frames per route
   with guest entries, the Library's sidebar open by default, a plain-text view of Library pages, a
   retire-or-reuse call on `anonymous-info.tsx` and `floating-add-button.tsx`, and the lab's own words renamed with the
   revamp: the review mechanic's "ruled", `touchpoints.ts`'s `RULINGS`/`Ruling`/`getRuling`, and "ratified").

## Waiting on Will

- **His sitting on build 8**, once `album-rows` and `clip-bench` land: `reel-cut` r2 first.
- **A 10-second iPhone check**: Save to Photos lands in Photos, and a shared photo arrives as a photograph.
