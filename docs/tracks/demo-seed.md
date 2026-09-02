---
track: demo-seed
status: open
cut: "26f7e52"
preview: false
owns:
  - scripts/seed-demo-event.mjs
reads:
  - scripts/backfill-strip-exif.mjs
  - src/lib/r2/keys.ts
  - src/lib/media/limits.ts
---
# lp/demo-seed

**Goal.** One command seeds the curated demo event: `node scripts/seed-demo-event.mjs <folder>` creates
(or reuses, by a fixed name under the demo host) the demo event with the service role, uploads the
folder's media to R2 through the real key scheme (`src/lib/r2/keys.ts`), inserts the media rows as
approved with true dimensions, both orientations, EXIF stripped (run `backfill-strip-exif.mjs` after,
or strip inline with the same library), idempotent (a re-run replaces the set), and prints the QR token
to put in `NEXT_PUBLIC_DEMO_QR_TOKEN`. The media is Will's to pick; the run against prod and the env
repoint are the Orchestrator's (the Launch checkpoint item "swap the demo event to curated media").
Size S.

**Rulings in force.** none.

**Verify on.** A run against a throwaway event with a folder of the marketing manifest's images
(disposable data), the event page on the launch-prep alias afterwards, the rows and keys inspected
through the Supabase and R2 MCPs, then the throwaway event deleted.

## System-doc edits (in place, owned facts only; the Orchestrator reads each by eye)

- `docs/systems/testing-verification.md`: one line, how to reseed the demo event.

## Deferred (ROADMAP one-liners, bucket named)

- none yet

## Handoff

- to be filled at handoff

## Record

- to be filled at integration
