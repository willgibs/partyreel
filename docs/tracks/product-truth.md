---
track: product-truth
status: open
cut: "ae2e7cd"          # the stub SHA; the agent resets it to the launch-prep SHA it cuts from
preview: false
owns:
  - src/lib/db/mutations/host-media.ts
  - src/app/api/stripe/checkout/route.ts
  - src/app/(app)/dashboard/
  - src/components/app/visibility-selector.tsx
  - src/app/admin/albums/
  - src/lib/upload/uploader.ts
  - src/app/(guest)/e/
  - src/lib/db/queries/media.ts
  - content/help/the-qr-wont-scan-or-the-link-wont-open.mdx
reads:
  - src/lib/constants/tiers.ts
  - src/lib/db/types.ts
  - src/lib/media/limits.ts
---
# lp/product-truth

**Goal.** The app and guest surfaces say only true things. The help catalog's research (2026-09-01)
found nine gaps between the copy and the product; this track closes the app-side ones, numbered as
the catalog numbered them: **1** the `Video uploads are available on the Pro plan.` wrapper string omits
the Event Pass; **2** `?upgraded=1` is set by checkout and never read, so a purchase has no
confirmation (read it once on the dashboard, one toast, then strip it from the URL); **3** the settings
selector says "Public" while the event header chip says "Open" (the chip changes, see the ruling);
**4** `restoreEventAction.mediaStillRemoved` is never surfaced (surface it through a LOCAL result type
for that action, never by widening the shared `ActionResult`); **5** the ops-only "missing ETag" upload
error can reach a guest (a guest-facing message, the ops detail to the log); **7** `tiers.ts`'s comment
still cites a retired 5-min/2-GB video limit (one comment line, the single exception to the lane, see
below); **8a** the guest 404 says the event "may have ended" (events have no end date); **8b** the
open-event unfurl promises "no account" even when the event requires one (key it on
`allow_anonymous_uploads`, the real column); **9** `lifecycle-recovery.md` says a guest's self-deleted
upload is excluded from the host's Deleted list while `listRecentlyDeletedMedia` applies no such filter
(a live check settles which is true, then either the query or the doc line changes). Gap 6 (the privacy
FAQ's "flag a photo or video") and the marketing side of gap 3 belong to the marketing follow-ons track.
Size M.

**Rulings in force.** (1) **Visibility word: "Public"** (Will, 2026-09-02: "Public sounds much
clearer than open"): the event header chip changes from "Open" to "Public"; "Open" is reserved for the
accepting-uploads state and never describes visibility; help copy follows. (2) **Gap 9 default:** the
bin hides uploader-deleted rows, matching what `restore_media` refuses, unless the live check shows the
doc was right all along. (3) **The account-required unfurl line, proposed default:** keep the title;
the description becomes "Add your photos and videos. This event asks guests for an email." (Will rules
on the words at review; propose alternatives in Handoff if the copy reads wrong in place.)

**Also touches, by ruling (explain in the lane check):** one comment line in `src/lib/constants/tiers.ts`
(gap 7). Nothing else outside `owns`.

**Verify on.** Locally against the real Supabase (`pnpm dev` + the service-role routes) for everything
signed-out: the guest 404, the unfurl (`curl` the event page and read the OG tags, both
`allow_anonymous_uploads` states on disposable events), the upload error path; Vitest for the pure
pieces and a rolled-back RPC contract check for any query change. Sign-in is allow-list gated off
localhost, so list the signed-in surfaces (the dashboard toast, the header chip, the restore action,
the admin albums page) under "Look at first" in Handoff: the Orchestrator walks them on the
launch-prep alias at integration.

## System-doc edits (in place, owned facts only; the Orchestrator reads each by eye)

- `docs/systems/lifecycle-recovery.md`: the true fact for gap 9 (one line).
- `docs/systems/guest-flow.md`: the unfurl and 404 lines if they state the old copy.

## Deferred (ROADMAP one-liners, bucket named)

- none yet

## Handoff

- to be filled at handoff

## Record

- to be filled at integration
