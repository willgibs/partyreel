# Trust & safety: forensic capture, legal hold, CSAM response

Open this before you:
- touch anything that hard-deletes media, an event or an account (legal holds);
- touch the upload pipeline's forensic capture or any `upload_forensics` column;
- handle an abuse report, a legal hold or a CSAM incident (the runbook);
- register with NCMEC.

Elsewhere: the reports queue ([admin-observability.md](admin-observability.md)), the purge sweeps ([lifecycle-recovery.md](lifecycle-recovery.md)), deny-all and grant
conventions ([database-security.md](database-security.md)).

## What each upload captures

Every completed upload writes one deny-all `upload_forensics` row at the complete seam: the network and device facts
(raw IP, user agent and client hints, Vercel's coarse geo, a first-party device UUID, `pr_device_id`, indexed for
cross-event abuse correlation) and the uploader linkage the seam already holds, denormalized at upload (for a guest who
proved no email, the typed `guest_display_name` and the unproved `guest_pending_email` are the whole identity on
record). The row lives exactly as long as its media (`on delete cascade`). The privacy policy and the Terms disclose
this capture, so a new column changes their words too.
- ★ **The device UUID, and every forensic column, is capture-only:** never product logic, never a gate, never shown to
  a host or a guest. The readers are `/admin/forensics` and a lawful-process response: the guest's typed name and
  unproved address appear only on the `?what=record` export, and no page renders either.
- **Capture is best-effort but loud:** a failure never fails the upload, but it warns (`forensic_capture_failed`,
  area `security`) and shows as a gap in `/admin/forensics`' 24-hour coverage.
- **No pre-strip EXIF capture.** The browser strips EXIF before upload ([uploads-and-r2.md](uploads-and-r2.md)), so the server never sees
  it; extracting it first would be the most sensitive collection there is, cut against the marketed EXIF-strip
  story, and waits on counsel's sign-off.

## Legal hold and preservation

On a report, an operator sets a legal hold (`media.legal_hold_at`, `legal_hold_reason`) and preserves: the original is
copied server-side to the segregated `preservation/` prefix (outside `events/`; keys single-sourced in `r2/keys.ts`; a
multipart ranged copy past CopyObject's 5 GB limit), with a JSON evidence snapshot of the media, forensic and event
rows beside it. The one egress is the audit-logged export on `/admin/forensics`. Holds serve every abuse report, not
only CSAM.
- ★ **Held media is never hard-deleted, object OR row.** Every R2 delete runs R2-first, so each caller filters held
  items BEFORE building its key list; the SQL guards in `purge_media_rows`, `purge_media_now` and `restore_media`
  alone would save only the row after the object died. An expired event, or a deleted account's event, holding ANY
  held media is skipped whole, because the FK cascade is all-or-nothing. `forensics/legal-hold.ts` enumerates every
  hard-delete path and why each is safe, so a new path joins it.
- ★ **Which events hold anything is ONE `held_event_ids` answer per candidate set, never a read of held rows:**
  PostgREST cuts a row read at 1,000, and an event whose held rows fell past the cut would read as purgeable. The holds
  are asked again right before the event rows go, so a hold placed mid-sweep keeps its row and its event. The backup
  prune needs nothing: its dual check (primary object gone AND row gone) can never be met by a held item.
- ★ **A hold is discreet, and a held row is immutable to the host, not merely invisible.** The hold columns are not
  SELECT-granted to `authenticated`, so the owning host (who may BE the investigated uploader) cannot see one, and
  `restore_media` refuses a held item with a reason the wrapper maps to the vague default copy. The host's
  `update(status, removed_at)` grant would still let one PATCH move a held item back onto the live gallery, so the
  `media_guard_privileged_transitions` trigger SKIPS (`return null`) any direct client write to a held row. Skip, never
  raise: an exception aborts a whole bulk statement, which would make "Approve all fails on this album" a hold oracle;
  the skip yields PGRST116, the same "That item is no longer available." a missing row produces.
- **Preservation objects are deleted only by hand,** audited, on the REPORT Act's one-year clock. Releasing a hold
  does not touch them, and no sweep lists the `preservation/` prefix.

## The CSAM incident runbook

A draft until counsel signs it, a launch gate (ROADMAP). Trigger: a report (a guest's, a host's email, an inbound from
NCMEC or law enforcement) plausibly involving child sexual abuse material. The one reviewer is Will; keep human
viewing to a minimum: confirm plausibility, never study the content, never forward or screenshot it.

1. **Remove it from live:** `/admin/albums`, the event, remove the item (a soft remove; the guest and host galleries
   drop it at once). Hard-delete nothing.
2. **Hold and preserve:** `/admin/forensics`, the media id and a reason (the report's reference), "Set hold and
   preserve": it leaves every purge and copies the original and its forensic record to the preservation store.
   Preserve the context too: repeat for the same uploader's other items in the event (commingled content is part of
   the REPORT Act's preservation duty).
3. **File the CyberTipline report** at report.cybertip.org (as a registered ESP once registration lands; file
   regardless before it). Include the event id, the media ids, the upload time and the forensic record (the "Record"
   export: IP, user agent, client hints, geo, device UUID, the guest's email or account, typed name and any unproved
   address), and note the report id in the hold's reason or the audit trail.
4. **Preserve for one year:** the filing starts the REPORT Act clock (PL 118-59: a year, secure and access-limited,
   commingled content included). The preservation store and the deny-all rows meet the storage duty; calendar the
   expiry, then delete the preservation objects by hand (audited).
5. **Never tip anyone off:** no notice to the uploader or host beyond the content leaving the gallery, which reads as
   routine moderation. Answer law enforcement only against legal process; refer anything unusual to counsel.
6. **Afterwards:** keep the hold until counsel or law enforcement releases it; an account action (a ban, an event
   takedown) is decided case by case with counsel. Everything is logged in `/admin/forensics`, whose audit trail is the
   evidence of compliance.

Reported media, its forensic row and its preservation copies stay while any hold, filing or law-enforcement matter is
open: failing to preserve or report under 18 U.S.C. 2258A carries six-figure fines.

## NCMEC registration

- Register as a reporting ESP at report.cybertip.org/espregistration before launch; if refused, report actively as an
  unregistered reporter.
- It needs the legal entity's name and address, a designated contact (name, email, phone; a monitored role address),
  the service domain (partyreel.com) and a short description ("guest photo/video sharing for private events").
- After approval: keep the CyberTipline credentials offline (never the repo or Vercel), note the ESP id here, and read
  through the reporting form once so filing under pressure is familiar.
- At the DNS move to Cloudflare, the free CSAM Scanning Tool goes on the zone, described plainly as scanning only what
  Cloudflare proxies: it cannot see presigned R2 media, and media serving is not re-architected to widen it.
