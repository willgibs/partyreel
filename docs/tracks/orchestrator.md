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
| `reel-defaults-migration` | `events.reel_hold_sec`, `get_event_by_qr_token` returning it, `event_stills`, the guards, the write path and `setReelDefaults` | working (agent `ad6d9fdbd568b5206`); stops once at "SQL ready at <sha>" for the rolled-back check, apply, `get_advisors` and the types | Opus, :3132 | integrate first, before the guest and host lanes sync; announce it here |
| `album-rows` | the justified rows engine and an opt-in `rows` layout on the shared grid (masonry stays the default), then `album-columns` r2 on it | working (agent `a4df869a96aed6e65`) | Opus, :3131 | integrate for build 8; its Handoff lists each surface's switch for `album-rows-wiring` |
| `clip-bench` | `reel-cut` r2 (the workbench with moments and looks inside it) and `reel-story`'s noun | working (agent `a3b9e5aa5c95602c2`) | Opus, :3138 | integrate for build 8 |
| `reel-host-wiring` | the host's reel side (the Reel card counting to two, one review number, the Highlight reel section, the band and the cards' crossfade, the Studio's host pieces out) and the wide host pages | working (agent `a7a1fff0cd8e82d51`); syncs past the migration lane when announced | Opus, :3133 | HOLD unmerged for the stretch |
| `reel-guest-wiring` | the live reel's guest side, re-opened for batch 2: the window start, the code toggle at 1024 and up, the view gated at two, the owner's extras, the hold per event, "clip", the 12px phone gutter | re-opened by message (agent `a744f57e3c4cbd81f`) from `f3aa612c`; syncs past the migration lane when announced | Opus, :3137 | HOLD unmerged for the stretch; its picture, fullscreen, wake lock and owner's extras prove on the stretch's alias build |

## Next, in order

1. **The migration**: on "SQL ready", the rolled-back check (execute_sql inside a rolled-back transaction), `apply_migration`,
   `get_advisors`, `generate_typescript_types` into `src/lib/db/types.ts`, one commit, then message the lane to finish;
   integrate it and announce it above so the guest and host lanes sync.
2. **Build 8**: integrate `album-rows` and `clip-bench`, read their new asks side by side (`board-card.mjs --desk`), one
   `[preview]`, then Will's sitting: `reel-cut` r2, `reel-story`, `reel-front` r2, `album-columns` r2, `media-viewer` r2.
3. **After the sitting**: cut `reel-clip-wiring` (Opus; the creator, the bench as picked, the finish as amended, the
   Studio's `src/components/reel/` pieces out, the client adds), `reel-sweep` (Opus; the copy from `reel-story`, help,
   legal, admin, docs, `docs/systems/reel.md`) and `reel-teardown` (Sonnet; `reel_clip_add`; the stored files' end);
   the guest lane's last re-open (`reel-front` r2, the creator seam). The stretch integrates guest, host, clip,
   teardown, sweep, synced; one `[preview]` (build 9); the red-team; the drop migration on Will's yes; the one-shot
   R2 sweep; the reel boards and ledgers retire after their manifests close.
4. **`album-rows-wiring`** (Opus): every surface to rows with `album-columns` r2's picks, the jump-free first paint,
   the five steps, and `media-viewer` r2's mark; build 10.
5. **The lab revamp**, once the desk's open boards close and before new explorations open: a board as one
   self-registering folder, its metadata in its spec, lab checks scoped to the lane's own boards, the authoring API
   trimmed, a fresh agent proving it; with library-lean's board ideas (a `Surfaces` family of live frames per route
   with guest entries, the Library's sidebar open by default, a plain-text view of Library pages, a
   retire-or-reuse call on `anonymous-info.tsx` and `floating-add-button.tsx`, and the lab's own words renamed with the
   revamp: the review mechanic's "ruled", `touchpoints.ts`'s `RULINGS`/`Ruling`/`getRuling`, and "ratified").

## Waiting on Will

- **His sitting on build 8**, once `album-rows` and `clip-bench` land: `reel-cut` r2 first.
- **A 10-second iPhone check**: Save to Photos lands in Photos, and a shared photo arrives as a photograph.
