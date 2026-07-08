# ADR-0020: Forensic upload capture (A3-lite), media-lifetime retention, reactive CSAM posture

**Status:** Accepted (2026-07-05, Will's T1 ruling) · **Context:** the 2026-06-08 pentest follow-up
(ROADMAP forensic entry), the EXIF/GPS strip (milestone-0: the server never sees EXIF post-upload),
the T1 options-doc (git history: `docs/decisions/t1-forensic-csam-policy.md`)

## Context

When abusive media is reported, we currently hand law enforcement nothing. Un-captured data is
unrecoverable per upload; captured data is subpoenable liability; CSAM duties run from actual
knowledge with six-figure failure-to-report fines. The options-doc corrected our stale legal sketch:
**the REPORT Act (PL 118-59, 2024) makes a filed CyberTipline report a 1-year preservation trigger**
(secure, access-limited, NIST-CSF-consistent, commingled content included), superseding the old
90+90-day reading of 18 U.S.C. 2258A(h).

## Decision

1. **Capture scope A3-lite:** per upload, record raw IP + precise timestamp + Vercel geo + full UA +
   UA client hints + a durable first-party device UUID into a deny-all `upload_forensics` table keyed
   to `media.id`. The pre-strip EXIF capture (GPS/serial extracted client-side before the strip) is
   DEFERRED behind counsel: it is the most sensitive collection and cuts against the marketed
   EXIF-strip story.
2. **Retention B1:** forensic rows live exactly as long as their media (through the 30-day bin,
   hard-deleted by the same purge sweep). On report: legal hold excludes media + forensic row from
   purge; on a CyberTipline filing, media + commingled context + the forensic record copy to a
   segregated, encrypted, deny-all preservation prefix on the 1-year clock. Service-role only; the
   sole egress is an audit-logged `/admin` preserve/export action with a health signal (P8 mandate).
3. **CSAM posture C1+C2:** register with NCMEC's CyberTipline as a reporting ESP before launch (if
   the ESP application is denied, we still actively report); maintain the report-and-preserve runbook
   (remove from live, file, preserve 1 year, minimize human viewing, one named reviewer); enable the
   free Cloudflare CSAM Scanning Tool at the DNS move, stated plainly that it cannot see presigned R2
   media. No PhotoDNA/Safer now; revisit at real scale.
4. **Counsel gate D2:** engineering ships now; counsel signs before launch: the privacy-policy + ToS
   capture language, the CSAM runbook + NCMEC registration, the retention schedule, and the EXIF
   go/no-go. The 8-item counsel checklist lives in the options-doc (git history) and the launch
   checkpoint.

## Consequences

- Every pre-capture day was an unrecoverable gap; the capture seam closes it at ~1 KB/upload with a
  one-paragraph privacy-policy disclosure.
- The preservation machinery (legal hold + segregated prefix + admin action) serves ALL abuse
  reports, not just CSAM.
- Proactive hashing and any media-serving re-architecture to widen scanner coverage are explicitly
  deferred and logged.
