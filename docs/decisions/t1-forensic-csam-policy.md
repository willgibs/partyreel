# T1 Options-Doc: Forensic / Device-ID Capture + CSAM Legal Policy

> STATUS: awaiting Will's ruling (T1 Ruling Day). Once ruled, record as ADR-0019+ and prune the
> ROADMAP sketch. Research date: 2026-07-03. Sources at the bottom.
>
> **CORRECTION TO THE ROADMAP SKETCH (verified):** the sketch cites 18 U.S.C. 2258A(h) as "90d, +90 on
> LE request." That was the pre-2024 law. The **REPORT Act (S. 474, Public Law 118-59, signed May 7,
> 2024)** changed it: a completed CyberTipline report is itself treated as a preservation request for
> **1 YEAR**, the provider must also preserve reasonably accessible **commingled content** (files giving
> context about the reported material or person), must keep it in a **secure location with access
> limited** to what compliance requires, and must preserve **consistent with the NIST Cybersecurity
> Framework**. The Act also expanded reportable offenses (child sex trafficking, coercion/enticement of
> a minor) and raised fines for knowing failure to report: first offense $600k for providers under
> 100M monthly active users, $850k at or above (Partyreel sits in the $600k band), up from $150k. Every
> number below uses the current law.

## 1. The decision, and why it is a one-way door

When abusive media is uploaded to Partyreel and later reported (harassment, revenge content, CSAM),
what can we hand law enforcement, and what must we do?

Three rulings are bundled here because they share one door:

- **(a) Capture scope:** what per-upload forensic signal we record at upload time.
- **(b) Retention + access:** how long it lives, who can read it.
- **(c) CSAM posture:** reactive report-and-preserve only, or plus proactive hash scanning.
- **(d) Counsel gate:** which pieces need a lawyer's sign-off before they ship.

**Why one-way, in both directions:**

1. **Un-captured data is gone forever.** An upload happens once. If the forensic record is not written
   in that request, no later policy can recover the IP, the device id, or the EXIF (the client-side
   strip that shipped 2026-07-02 means the server NEVER sees EXIF; only a pre-strip client extraction
   can). "Decide later" silently equals "capture nothing" for every event that happens meanwhile.
2. **Captured data is a liability you cannot un-create.** It is subpoenable, discoverable, breach
   surface, and a privacy-promise reversal (guests were sold "no app, no account," and we just shipped
   and will market the EXIF strip). Widening capture later is a policy edit; narrowing it later does
   not un-collect what exists.
3. **The CSAM runbook cannot be improvised.** Once we have actual knowledge of apparent CSAM, federal
   duties start running immediately (report + 1-year preservation), with six-figure fines for knowing
   failure. The posture must exist before the first report, not after.

## 2. Context and constraints

**Product/architecture facts that shape the options:**

- **Guests are anonymous by design** (capability tokens, ADR-0004; verified email only when the host
  requires it). Email is disposable, IP is venue-shared NAT (whole wedding = one IP). A durable
  first-party device UUID is the only per-device signal we can get without a fingerprinting vendor.
- **The EXIF strip is client-side, pre-upload** (`src/lib/media/strip-metadata.ts`, wired into the one
  shared `uploadFile()` seam in `src/lib/upload/uploader.ts`). Forensic EXIF capture must extract key
  fields (GPS, device make/model/serial, capture time) in the browser BEFORE the strip and POST them
  with the upload. Same seam covers guest, host, and (with client reel rendering) the reel mp4 upload.
- **Today we capture nothing forensic per upload.** `media` has no IP/UA/device columns; the only
  IP-adjacent data is the rate-limiter's `action_attempts.ip_hash` (hashed, short-lived). So the
  status quo IS "none," and every day at scale is unrecoverable.
- **Deletion is the lifecycle** (no event end date; 30-day recovery bin then hard purge). A legal hold
  must exclude reported media AND its forensic row from the auto-purge sweep.
- **Serving-path fact that bounds the Cloudflare option:** media is served via server-side presigned
  R2 URLs against the R2 S3 endpoint (ADR-0003), NOT through the partyreel.com zone. Cloudflare's CSAM
  Scanning Tool scans **cached content on a Cloudflare-proxied zone**. So after the DNS move it would
  see site assets but NOT guest media, unless we re-architect media serving behind a proxied R2 custom
  domain (public bucket + Worker-gated access), which is a real project and conflicts with the
  "never expose raw R2 URLs" invariant as currently built.
- **Cost is not a deciding axis.** The reel program's client-render pivot makes renders $0; the
  forensic capture is a row per upload (~1 KB), the Cloudflare tool is free (2024 update: no NCMEC
  credentials needed, any plan), and Microsoft PhotoDNA Cloud is free for qualified orgs but
  application-gated. The deciding axes are legal duty and privacy posture, not dollars.
- **Legal baseline (current law, verified):** 2258A imposes a reporting duty on providers upon
  **actual knowledge** of apparent violations; it imposes **no proactive monitoring duty** (2258A(f)).
  Report via NCMEC's CyberTipline (register as a reporting ESP first). Preservation on report: 1 year,
  secure, access-limited, NIST-CSF-consistent, commingled context included. 2258B gives providers
  liability protection for compliant preservation/handling.
- **Privacy disclosure dependency:** `/privacy` is still a stub (a ROADMAP launch-checkpoint item).
  Any capture we ship must be described there before real users arrive.

## 3. Options

### Axis (a): capture scope

| | A1. None until report | A2. Minimal (IP + time + geo + UA) | A3. Full fingerprint (A2 + UA client hints + device UUID + pre-strip EXIF) |
|---|---|---|---|
| LE value | Near zero (the upload already happened; nothing to hand over) | Weak at venues (shared NAT), fine for remote abusers | Strong: device UUID survives token rotation; EXIF serial/GPS ties a file to a device and place |
| Privacy cost | Zero | Low (standard server-log tier) | Highest: EXIF capture reverses the just-shipped "server never sees EXIF" story unless carefully framed |
| Build cost | Zero now | Small (request headers into a deny-all table) | Medium (client hint negotiation, UUID plumbing, pre-strip EXIF extractor + POST) |
| Reversibility | Fully reversible policy, IRREVERSIBLE data gap | Can widen later; collected rows deletable | Can narrow later; collected rows deletable |

**A3 split worth naming:** the device UUID and client hints are ordinary first-party anti-abuse
practice; the **EXIF capture is the sensitive outlier** (GPS + hardware serial). They can be ruled
separately: A3-lite = A2 + UUID + client hints, EXIF deferred behind counsel.

### Axis (b): retention + access

| | B1. Media-lifetime aligned | B2. Fixed short window (90d rolling) | B3. Long fixed (1y for everything) |
|---|---|---|---|
| Rule | Forensic row lives exactly as long as its media (incl. the 30-day bin); hard-deleted by the same purge; **legal hold on report flips it to the 1-year 2258A clock** | Deleted 90d after upload even if media lives on | Everything kept 1 year |
| Story | Cleanest: "we keep upload metadata only while your media exists" | Simple, but old media (the common report case: discovered months later) has NO forensic record, defeating the purpose | Max LE value, worst privacy posture and breach surface, hard to justify pre-revenue |

Access, all options: **deny-all, service-role only** (RLS enabled, no policies, no grants), never
rendered in any UI; the only egress is an explicit admin **legal-hold/preserve/export action** that is
itself audit-logged. Preservation copies for a CyberTipline report go to a segregated, encrypted R2
prefix (or bucket) with the same deny-all posture, satisfying "secure location, limited access."

### Axis (c): CSAM response posture

| | C1. Report-and-preserve only (reactive) | C2. C1 + Cloudflare CSAM tool on the zone | C3. C1 + true proactive hashing of guest media |
|---|---|---|---|
| What | The mandatory baseline: on actual knowledge, remove from live, file CyberTipline report, 1-year secure preservation, LE cooperation. No scanning. | Enable the free tool when DNS moves to Cloudflare. Honest limit: it scans zone-cached content, so it covers site surfaces but NOT presigned R2 media today | PhotoDNA Cloud (free, application-gated) or Thorn Safer (paid) hashing every upload server-side |
| Duty | Fully compliant; 2258A(f) imposes no monitoring duty | Same compliance, marginal extra coverage, $0, ~zero build | Not legally required; real trust-and-safety value at scale; new vendor, new pipeline, new false-positive runbook |
| Reversibility | Posture upgradeable any time | Toggle | Add-later is fine; hashes are computed on future uploads either way |

C2 caveat spelled out: making the tool see guest media would mean serving media through a proxied R2
custom domain, a re-architecture of the presign invariant. Do not do that for the scanner alone; log
it as a consideration IF media serving ever moves behind the zone for other reasons (cache/egress).

### Axis (d): counsel gate

| | D1. Ship it all, counsel reviews after | D2. Counsel gates the paper, code ships | D3. Counsel gates everything |
|---|---|---|---|
| Rule | Fastest, risks shipping wrong policy promises | Capture + hold mechanics ship now (they are just engineering); the WORDS (privacy policy, ToS clause, CSAM runbook, retention schedule) and the EXIF-capture call get counsel sign-off before launch/marketing | Nothing ships until a lawyer rules |
| Fit | Bad for a one-way door | Matches the program (build now, launch switches accrete) | Stalls unrecoverable capture for weeks; the data gap grows |

## 4. RECOMMENDATION

**Capture scope: A3-lite.** Per upload, record raw IP + precise timestamp + Vercel geo headers + full
UA + UA client hints + a durable first-party device UUID (localStorage + cookie, survives session-token
rotation), into a new deny-all `upload_forensics` table keyed to `media.id`. **Defer the pre-strip EXIF
capture behind counsel sign-off** (it is the single most sensitive collection, it cuts against the
EXIF-strip privacy story we will market, and IP + UUID + timestamp already gives LE a workable thread).
If counsel blesses it with the right privacy-policy language, add it as a fast follow at the same
`uploadFile()` seam.

**Retention + access: B1.** Forensic rows live exactly as long as their media (through the 30-day bin,
hard-deleted by the same purge sweep). On report: legal hold excludes media + forensic row from purge;
on a CyberTipline filing, copy media + commingled context + forensic record to a segregated encrypted
deny-all preservation prefix on the 1-year clock. Service-role only; the sole egress is an audit-logged
admin preserve/export action at `/admin` (ships with its health signal, per the P8 mandate).

**CSAM posture: C1 + C2.** Register with NCMEC's CyberTipline as a reporting ESP **before launch**;
write the runbook (remove from live, report, preserve 1 year, minimize human viewing, single named
reviewer). Flip on the Cloudflare CSAM Scanning Tool when DNS moves (free, no credentials, zero build)
while stating plainly it does not cover presigned media. **No PhotoDNA/Safer now**; revisit at real
scale, and note PhotoDNA Cloud is free-with-application, so the ROADMAP's "too costly" framing is
about integration and ops burden, not license fees.

**Counsel gate: D2.** Engineering ships on the branch now; these four things get sign-off before
launch: (1) the privacy-policy + ToS language describing the capture, (2) the CSAM runbook + NCMEC
registration, (3) the retention schedule (B1 + the 1-year hold), (4) the EXIF-capture go/no-go.

**Why this bundle:** it closes the unrecoverable gap immediately (every pre-capture day is data lost
forever), keeps the collected surface small enough to defend in one privacy-policy paragraph, meets
the mandatory federal duties with margin (the only non-negotiable piece), spends $0, and leaves every
upgrade path (EXIF, proactive hashing, longer retention) open as two-way doors.

### Confirm-with-counsel checklist (hand this to the lawyer)

1. Confirm Partyreel is a "provider of an electronic communication service or remote computing
   service" under 2258A (almost certainly yes) and register with the NCMEC CyberTipline.
2. Review the CSAM runbook: actual-knowledge trigger, who files, timeline, remove-from-live vs
   preserve, the "as soon as reasonably possible" filing standard, and the expanded offense list
   (trafficking, enticement) from the REPORT Act.
3. Bless the 1-year preservation implementation: segregated encrypted storage, access limited to
   named individuals, NIST-CSF-consistent controls, commingled-content scope.
4. Human-exposure protocol: minimize who views suspected CSAM, one named reviewer, no copies outside
   the preservation store (2252A exposure for mishandling).
5. Privacy policy + guest-facing ToS language for the forensic capture (IP, device UUID, client
   hints), including CCPA/state-law disclosure duties and any EU/ePrivacy consent question for the
   device UUID if non-US guests matter at launch.
6. The EXIF pre-strip capture go/no-go, and if go, its disclosure wording.
7. Retention schedule sign-off (B1) + the legal-hold trigger definition (what counts as a "report").
8. Subpoena/LE-request response process (who answers, what we produce, preservation-letter handling).

## 5. What we build meanwhile / what waits

**Build now (no ruling needed, or unblocked the moment Will says "yes, your recommendation"):**

- The `upload_forensics` deny-all table + capture at the upload-complete server seam (IP, timestamp,
  geo, UA, client hints) and the device-UUID plumbing in the guest/host clients.
- Legal-hold flag + purge-sweep exclusion + the audit-logged `/admin` preserve/export action with its
  health signal.
- The segregated preservation prefix + copy mechanism (useful for ALL abuse reports, not just CSAM).
- The CSAM runbook doc draft + the NCMEC registration application (Will's name goes on it).
- Fix the ROADMAP sketch's stale "90d +90" citation to the REPORT Act's 1-year rule.

**Waits for counsel (D2 gate):** launch itself with capture enabled and marketed, the privacy-policy
text, the EXIF pre-strip capture, the final retention schedule.

**Waits for the DNS move:** enabling the Cloudflare CSAM Scanning Tool on the zone.

**Waits for scale (explicitly deferred):** proactive hashing (PhotoDNA Cloud application or Safer),
any media-serving re-architecture to widen the Cloudflare scanner's coverage.

## Sources

- [18 U.S.C. 2258A (current text, LII)](https://www.law.cornell.edu/uscode/text/18/2258A)
- [18 U.S.C. 2258A (US House, prelim ed. incl. REPORT Act amendments)](https://uscode.house.gov/view.xhtml?req=granuleid%3AUSC-prelim-title18-section2258A&num=0&edition=prelim)
- [REPORT Act, S. 474, 118th Congress (Congress.gov)](https://www.congress.gov/bill/118th-congress/senate-bill/474/text/rs)
- [REPORT Act overview (Wikipedia)](https://en.wikipedia.org/wiki/REPORT_Act)
- [Cloudflare CSAM Scanning Tool docs](https://developers.cloudflare.com/cache/reference/csam-scanning/)
- [Cloudflare: "A simpler path to a safer Internet" (2024 tool update, no NCMEC credentials)](https://blog.cloudflare.com/a-simpler-path-to-a-safer-internet-an-update-to-our-csam-scanning-tool/)
- [Cloudflare: NCMEC reporting via Workflows (R2-based preservation pattern)](https://blog.cloudflare.com/simplifying-ncmec-reporting-with-cloudflare-workflows/)
