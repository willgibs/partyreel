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
only CSAM. A hold is for what police should see (Will, 2026-09-29), so Hold for forensics on a report takes it down
too by default: every item it reaches becomes an operator's removal before any copy starts. Unticking Take it down
too is the QUIET hold, for a preservation request about content that is not harmful to show, where removing it
would tip someone off: nothing leaves the album.
- ★ **Held media, and anything an open report names, is never hard-deleted, object OR row** (20260929140000: "an
  open report protects its item from every permanent delete" until it closes). `kept_media_ids(uuid[])` is the one
  home of the rule: held, or named by an open report (its item, or every item of the album an album report names).
  Every R2 delete runs R2-first, so each caller asks it BEFORE building its key list (`reclaimMedia`, purgeMediaNow);
  `purge_media_rows` asks it again, but alone it would save only the row after the object died. A permanent delete of
  a kept row is DEFERRED, never refused (`media.purge_asked_at`): the row leaves the deleter's view and the host's
  meter at once, and the removed_media sweep takes it the night its keeper lets go (`defer_kept_due_media` asks a
  kept removal past its window the same way). An expired event, or a deleted account's event, holding ANY held media
  or any open report is skipped whole, because the FK cascade is all-or-nothing. `forensics/legal-hold.ts`
  enumerates every hard-delete path and why each is safe, so a new path joins it.
- ★ **Which events hold anything (a hold, an operator's removal in its window, an open report) is ONE
  `held_event_ids` answer per candidate set, never a read of held rows:**
  PostgREST cuts a row read at 1,000, and an event whose held rows fell past the cut would read as purgeable. The holds
  are asked again right before the event rows go, so a hold placed mid-sweep keeps its row and its event. The backup
  prune needs nothing: its dual check (primary object gone AND row gone) can never be met by a held item.
- ★ **A hold is discreet: a quietly held row takes the host's own acts like any other** (Will, 2026-09-29: "the
  host's own delete of a quietly held item looks like any delete"). The hold columns and `purge_asked_at` are not
  SELECT-granted to `authenticated`, so the owning host (who may BE the investigated uploader) cannot see either.
  Her Remove, Hide and Show land (the guard's hold branch is gone), her block takes it to Deleted and counts it,
  her Delete permanently asks it (gone for her, off her meter, as any delete), and the purges skip it. Only a way
  back stays shut, in terms any item can meet: `restore_media` answers a held item in the vague default copy a
  missing row gets, and the block's let back in leaves one in Deleted (the list's count of what can come back leaves
  it out, as it leaves out a withdrawal). Its uploader's own feed and delete read a held blocked upload as any other.
- ★ **An operator's removal keeps the runbook's window to hold and preserve** (`removed_by_admin`, 20260928140000),
  because the runbook removes first and holds second. It leaves the host's view and her storage at once
  (`media_host_all` hides it; `media_release_meter` takes its bytes off her meter, and an operator's restore puts
  them back, so a takedown and a hold read the same in every number she has), but its copy waits out its own
  `purge_at` (the removal + 30 days): `purge_media_now` refuses it, her Deleted never counts it nor makes room from
  it (`host_deleted_media`), and `held_event_ids` answers an event holding one inside its window as held, so expired
  events and account deletion keep that event whole. Then the removed_media sweep takes it, unless it is held.
- **Preservation objects are deleted only by hand,** audited, on the REPORT Act's one-year clock. Releasing a hold
  does not touch them, and no sweep lists the `preservation/` prefix.

## The CSAM incident runbook

A draft until counsel signs it, a launch gate (ROADMAP). Trigger: a report (a guest's, a host's email, an inbound from
NCMEC or law enforcement) plausibly involving child sexual abuse material. The one reviewer is Will; keep human
viewing to a minimum: confirm plausibility, never study the content, never forward or screenshot it.

1. **Take it down and hold it, in one press:** Hold for forensics on the report in `/admin/reports` (a phone has it
   too) with Take it down too left on. The reported item and the same uploader's other items in the event
   (commingled content is part of the REPORT Act's preservation duty) become operator's removals at once, out of the
   album and the host's Deleted whatever state each was in, then each is held (out of every purge) and its original
   and forensic record copied to the preservation store. A child-abuse report from a confirmed address has already
   hidden its item (the ops inbox and the rail say so at once); a false one's Dismiss puts it back. Hard-delete
   nothing.
2. **When it was removed first** (Remove on the report, or on the item in `/admin/albums` when no report names it),
   hold it inside the removal's 30 days; an item no report names is held from `/admin/forensics` by its media id.
   Past the window the purge takes an unheld removal's copy. An open report keeps its item from every purge until it
   closes, so close the report only once the hold is placed.
3. **File the CyberTipline report** at report.cybertip.org (as a registered ESP once registration lands; file
   regardless before it). Include the event id, the media ids, the upload time and the forensic record (the "Record"
   export: IP, user agent, client hints, geo, device UUID, the guest's email or account, typed name and any unproved
   address), and note the report id in the hold's reason or the audit trail.
4. **Preserve for one year:** the filing starts the REPORT Act clock (PL 118-59: a year, secure and access-limited,
   commingled content included). The preservation store and the deny-all rows meet the storage duty; calendar the
   expiry, then delete the preservation objects by hand (audited).
5. **Never tip anyone off:** no notice to the uploader or host beyond the content leaving the gallery, which reads as
   routine moderation. When removing it would itself tip someone off (a preservation request about content that is
   not harmful to show), untick Take it down too: the quiet hold leaves it up. Answer law enforcement only against
   legal process; refer anything unusual to counsel.
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
