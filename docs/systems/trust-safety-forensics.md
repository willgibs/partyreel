# Trust & safety — forensic capture, legal hold, CSAM response

> ROLE: what we capture per upload for law-enforcement response, how a legal hold + evidence preservation works, and the CSAM incident runbook.
> BELONGS HERE: the `upload_forensics` capture seam, `media.legal_hold_*` + the purge exclusions, the preservation prefix, `/admin/forensics`, the incident runbook, the NCMEC registration prep. · NOT HERE: the reports queue UI (→ [admin-observability.md](admin-observability.md)), the purge cron mechanics (→ [lifecycle-recovery.md](lifecycle-recovery.md)), grant/RLS conventions (→ [database-security.md](database-security.md)).
> GROWS BY: integrate-in-place.

## What it does

Every completed upload writes ONE deny-all `upload_forensics` row: raw IP, timestamp, full user agent, `sec-ch-*` client hints, Vercel `x-vercel-ip-*` coarse geo, the
uploader linkage the seam already holds (host user id, or guest id + user id/email + the typed
`guest_display_name` + the unproved `guest_pending_email`, denormalized at upload time: for a guest who
proved no email they are the whole identity on record), and a durable first-party **device UUID** (localStorage `pr_device_id`, sent with the
complete request, indexed for cross-event abuse correlation). The row lives exactly as long as its
media (`ON DELETE CASCADE`; no separate sweep). On a report, an admin sets a
**legal hold** (`media.legal_hold_at/_reason`) and **preserves**: the original object is copied
server-side to the segregated `preservation/` prefix + a JSON evidence snapshot (media + forensic +
event rows) lands beside it. The sole egress is the audit-logged `/admin/forensics` export. The hold and
preservation machinery serves EVERY abuse report, not only the CSAM case the runbook below covers.

## Where it lives

- Capture: [`forensics/capture.ts`](../../src/lib/forensics/capture.ts) (called by
  [`upload/server-pipeline.ts`](../../src/lib/upload/server-pipeline.ts) after `create_media*`
  succeeds; the strategies hand it their existing identity) + the pure header shaping
  [`forensics/request-facts.ts`](../../src/lib/forensics/request-facts.ts). Device UUID:
  [`upload/device-id.ts`](../../src/lib/upload/device-id.ts) → `device_uuid` in the complete body.
- Hold exclusions: the pure predicates [`forensics/legal-hold.ts`](../../src/lib/forensics/legal-hold.ts)
  (which also enumerates every hard-delete path and why each is safe) + filters in the purge sweeps
  ([`lifecycle/sweeps/`](../../src/lib/lifecycle/sweeps), account deletion) and `purgeMediaNow`; the
  event-level question (does this event hold anything?) is `held_event_ids(uuid[])` through
  `readHeldEventIds` ([`lifecycle/reclaim.ts`](../../src/lib/lifecycle/reclaim.ts)); the SQL
  choke-point guards live in `purge_media_rows` / `purge_media_now` / `restore_media`.
- Preservation: keys in [`r2/keys.ts`](../../src/lib/r2/keys.ts) (`preservedOriginalKey` /
  `preservedForensicsKey` — the single source; deliberately OUTSIDE `events/`), the server-side
  copy in [`r2/objects.ts`](../../src/lib/r2/objects.ts) (multipart ranged copy past the 5 GB
  CopyObject limit), the service [`forensics/preserve.ts`](../../src/lib/forensics/preserve.ts).
- Admin: [`/admin/forensics`](../../src/app/admin/forensics) (coverage signal, holds list,
  preserve form, audit log) + the export route
  [`/admin/forensics/export`](../../src/app/admin/forensics/export/route.ts); reads in
  [`db/queries/forensics.ts`](../../src/lib/db/queries/forensics.ts) (every hold read whole, its lookups chunked; a
  failed count or lookup throws, and the record export fails with an error audit row when its media or event
  read fails).

## Invariants (don't break)

- ★ **Held media is NEVER hard-deleted — object OR row.** Every R2 delete is R2-FIRST, so each
  caller must filter held items BEFORE building its key list (the SQL guard alone would save only
  the row after the object died). An expired event, or a deleted account's event, containing ANY held
  media is skipped WHOLE (the FK cascade is all-or-nothing). ★ Which events hold anything is ONE
  `held_event_ids` answer per candidate set, never a read of held ROWS: PostgREST cuts a row read at
  1,000, and an event whose held rows fell past the cut would read as purgeable. The media reads leave
  held rows out, and the holds are asked again right before the event rows go, so a hold placed while a
  sweep runs keeps its row and its event. The backup-prune Worker needs no change: its dual-gate (primary
  object absent AND row gone) can never be satisfied by a held item.
- ★ **The device UUID is CAPTURE-ONLY.** Never product logic, never gating, never rendered to a
  host/guest. Same for every `upload_forensics` column: the readers are `/admin/forensics` and a
  lawful-process response, nothing else.
- **Capture is best-effort-but-LOUD:** a capture failure never fails the upload, but it Sentry-warns
  (`forensic_capture_failed`, area `security`) and shows in the `/admin/forensics` 24h coverage gap.
- **NO pre-strip EXIF capture.** The client-side EXIF strip means the server never sees EXIF; a
  client-side pre-strip extraction is the most sensitive collection, cuts against the marketed
  EXIF-strip story, and is COUNSEL-GATED. Do not build it without that sign-off.
- **A held-removed item stays off live:** `restore_media` refuses with reason `legal_hold`, which
  the wrapper deliberately maps to the vague default copy (an uploader/host must not learn a hold
  exists). The same discretion holds on the READ path: SELECT on `media` is COLUMN-scoped and the
  hold columns are not granted to `authenticated`, so the owning host can't see a hold via
  PostgREST or the gallery queries (which enumerate `MEDIA_HOST_COLUMNS`, parity-tested against
  the grant). → [database-security.md](database-security.md).
- ★ **A held row is IMMUTABLE to the host, not merely invisible.** The host's
  `update(status, removed_at)` grant would otherwise let one PATCH to `/rest/v1/media` move a held item
  back onto the live gallery, so the `media_guard_privileged_transitions` BEFORE trigger SKIPS
  (`return null`) any direct client write to a held row. **Skip, never raise**: an exception would abort a whole bulk
  statement, so "Approve all suddenly fails on this album" would itself be a hold oracle; the silent skip
  yields PGRST116 and therefore the identical "That item is no longer available." copy a missing row
  produces.
- **Every `restore_media` CREATE OR REPLACE keeps the `removed_by_uploader = false` guard** (a guest's
  self-deletion stays PRIVATE to the host); `forensics/migration-guards.test.ts` pins it, plus the
  grant parity above.
- **Preservation objects are deleted only BY HAND** (audited, on the REPORT Act 1-year clock).
  Releasing a hold does not touch them; no sweep lists the `preservation/` prefix.

## The CSAM incident runbook (draft — counsel signs before launch)

Trigger: a report (guest report, host email, NCMEC/LE inbound) plausibly involving child sexual
abuse material. One named reviewer (Will, solo-operator phase); minimize human viewing — confirm
plausibility, do not study the content, never forward or screenshot it.

1. **Remove from live** — `/admin/albums` → the event → remove the item (soft-remove; the guest and
   host galleries drop it immediately). Do NOT hard-delete anything.
2. **Hold + preserve** — `/admin/forensics` → paste the media id + a reason (report ref) → "Set
   hold and preserve". This excludes it from every purge and copies the original + the forensic
   record to the preservation store. Preserve the surrounding CONTEXT too: repeat for the same
   uploader's other items in the event (commingled content is part of the REPORT Act preservation
   duty).
3. **File the CyberTipline report** — report.cybertip.org (as a registered ESP once registration
   lands; file regardless if not yet registered). Include: the event id, media id(s), upload
   timestamp, and the forensic record (the "Record" export: IP, UA, client hints, geo, device
   UUID, guest email/user linkage, the typed name and any unproved address). Note the report id in the hold reason or audit trail.
4. **Preserve for 1 year** — the CyberTipline filing starts the REPORT Act preservation clock
   (PL 118-59: 1 year, secure, access-limited, commingled content included). The preservation
   store + the deny-all rows satisfy the storage posture; calendar the expiry, then delete the
   preservation objects by hand (audited).
5. **Do not tip off** — no notice to the uploader or host beyond the content disappearing from the
   gallery (removal looks like routine moderation). Respond to LE requests only against legal
   process; refer anything unusual to counsel.
6. **Afterwards** — keep the hold until counsel/LE says otherwise; the account-action decision
   (ban, event takedown) is case-by-case with counsel. Log everything in `/admin/forensics` (the
   audit trail is the evidence of compliance).

**Never** delete reported media, its forensic row, or preservation copies while any hold, filing,
or LE matter is open — 18 U.S.C. 2258A failure-to-preserve/report carries six-figure fines.

## NCMEC registration prep (Will handoff — pre-launch, see the ROADMAP launch checkpoint)

- Register as a reporting ESP at **report.cybertip.org/espregistration** before launch; if denied,
  report actively as an unregistered reporter.
- You'll need: legal entity name + address, a designated point of contact (name/email/phone; use
  a role address you monitor), the service domain (partyreel.com), and a short service
  description ("guest photo/video sharing for private events").
- After approval: store the CyberTipline credentials offline (NOT in the repo/Vercel), note the
  ESP id in this doc, and dry-read the reporting form once so filing under pressure is familiar.
- At the DNS move to Cloudflare: enable the free **Cloudflare CSAM Scanning Tool** on the zone,
  documented plainly as scanning only what Cloudflare proxies: it cannot see presigned R2 media, and
  media serving is not re-architected to widen its coverage.

## See also

[uploads-and-r2.md](uploads-and-r2.md) (the complete seam) · [lifecycle-recovery.md](lifecycle-recovery.md)
(the purge sweeps the hold excludes) · [database-security.md](database-security.md) (deny-all
conventions) · [admin-observability.md](admin-observability.md) (the portal shell + reports queue).
