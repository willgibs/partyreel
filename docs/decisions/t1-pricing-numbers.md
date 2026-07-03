# T1 Options-doc: final pricing numbers (reel length caps + Pro ingress cap + Event Pass renewal sanity check)

> ROLE: decision input for T1 Ruling Day (elevation program, R1 Decision Studio). Ruling lands as ADR-0019+
> and the numbers flow into `src/lib/constants/tiers.ts` + `tier_limits()` within 24h of the ruling.
> Prepared 2026-07-03. Sources read: `docs/PRICING.md`, `src/lib/constants/tiers.ts`,
> `docs/specs/reel-v1.md`, `docs/systems/billing-caps.md`, `src/components/reel/reel-composer.tsx`.

## 1. The decision, and why it is a one-way door

Three numbers are still open in the locked 2026-05-29 pricing model:

1. **Reel LENGTH caps, Free vs Pro.** The composer today offers Auto / 15s / 30s with no tier
   enforcement. The spec (reel-v1.md) already ratified "shorter max length on Free, longer on Pro"
   but left the values to land pre-launch. With the client-render pivot (canvas + WebCodecs on the
   host's device, $0 per render at any scale; fallback = tuned Lambda at ~$0.006 to $0.024/render),
   the COST lever is gone: length is now a pure product / upsell / watermark-exposure lever.
2. **`MONTHLY_INGRESS_BYTES.pro`**, currently `null` (unmetered) with a `// revisit` comment. The
   anti-abuse ingress meter (uploaded bytes per month, never refunds on delete) needs a Pro number
   before launch or a paid account is an unmetered transfer pipe.
3. **Event Pass renewal at $15/yr** (test price already created): sanity check only.

Why one-way: the length caps go on the PUBLIC pricing page and into hosts' saved reel configs, and
taking length away from paying (or even free) users later is a visible downgrade; the grandfathering
policy (paid subs keep their join-rate terms) makes every marketed number sticky. Raising any of
these later is painless; lowering them is the door that closes. So each number should be set at the
CONSERVATIVE end that still feels generous.

Settled and NOT reopened here: watermark on Free (stays), free generation for all tiers, full-quality
free export, video-in-reel is paid-only by construction (only paid tiers, Pro AND Event Pass, can
upload video; `videosAllowedForTier` = any non-free tier), 1 reel per event.

## 2. Context and constraints

- **Tiers (locked):** Free $0 / 2 GB / 1 event, photos only. Pro $9 / $19 / $39 for 100 GB / 500 GB /
  2 TB, unlimited events, video. Event Pass $24 one-time / 75 GB / ~1 yr, video, $15/yr renewal.
- **Free must still shine** (PRICING.md + reel spec): the first-event experience sells the upgrade,
  and "a janky free reel reads as a mediocre product, hurting upgrades." The watermark is already the
  free-tier marketing lever; length is the secondary nudge, not the primary one.
- **The ingress meter is per HOST TIER today**: `MONTHLY_INGRESS_BYTES: Record<Tier, number | null>`
  (free: 20 GB, pro: null, event_pass: null), enforced in `create_media` / `create_media_as_host`
  against `storage_ledger.cumulative_bytes` (never decrements). One static number per tier cannot
  fit both the $9 / 100 GB and the $39 / 2 TB plan fairly; that shape question is part of the ruling.
- **What churn abuse actually costs us:** R2 has zero egress and zero ingress fees, so the burn is
  Class A write ops (~$4.50 per million PUTs), the durability-backup Worker's mirrored writes, and
  transient storage. The REAL abuse is distribution: use an album as a free CDN (upload, mass
  download at our zero egress, delete, repeat under the storage cap). The meter bounds how much
  DISTINCT content can flow through per month; it is unmarketed and never refunds, so a false
  positive silently blocks a paying customer (admin visibility + a manual raise path must exist).
- **Client rendering changes the math:** render cost no longer scales with length. What still scales
  is on-device encode time (older phones encoding 90s+ get slow) and the fallback Lambda render
  (roughly linear in length, still cents at 60s).
- **Parity contract:** every number here changes in TWO places together: `tiers.ts` (TS source) and
  the `public.tier_limits()` SQL fn; the Vitest parity test (`tiers.test.ts`) guards the pairing.
  Length caps additionally need server-side clamping (the reel config RPC + the render/mint path must
  derive the cap from the HOST's tier; never trust the client for entitlements).

### Outside norms for free-tier highlight-video length (research)

| Product | Free-tier norm |
| --- | --- |
| GoPro Quik | 15 / 30 / 60 second presets; desktop edits capped at 60s |
| Canva | free video features widely reported capped ~30s; Pro up to 60 min |
| Google Photos highlight videos | defaults to ~1 minute (not tier-gated) |
| CapCut | generous free tier (1080p, no watermark on manual edits); length gating regional/experimental |
| Share platforms | TikTok/IG Reels engagement sweet spot ~15 to 34s; IG Reels reach favors under 90s |

Takeaway: 15 to 60 seconds IS the free-tier norm for auto-highlight tools, and short montages
out-perform long ones on the share platforms the reel is built for. A 30s free reel is not stingy;
it is the category default.

## 3. Options

### Decision A: reel length caps

At ~2 to 2.5s per clip, 30s holds ~12 to 15 moments; 60s holds ~25 to 30; 90s of stills drags.

| | Free | Pro + Event Pass | Consequences | Reversibility |
| --- | --- | --- | --- | --- |
| **A1** | 15s | 60s | Hard gate; strongest upsell pressure. A 15s free reel (~7 clips) undercuts the "wow that sells the upgrade" and reads stingy vs the GoPro/Canva 30s norm. | Raising Free later is easy but the first impression is spent. |
| **A2 (recommended)** | 30s | 60s | Free matches the category norm and holds a real montage; Pro doubles it AND is where video clips (already Pro-only) need the room. Composer change is small: add a 60s option, clamp Auto at the tier max, lock 60s behind paid with the upgrade hint. | Both caps can be RAISED later with zero pain (the one-way door stays open). |
| **A3** | 30s | 90s | More Pro headroom, but 90s photo montages sag, on-device encode time grows on old phones, and IG Reels reach penalizes 90s+. Buys little today. | Cannot be lowered once marketed; if 90s demand appears, raising A2's 60 to 90 later is trivial. |

Auto in every option means min(natural curation length, tier cap), per the spec ("auto, capped by tier").

### Decision B: `MONTHLY_INGRESS_BYTES.pro`

| | Shape | Numbers | Consequences | Reversibility |
| --- | --- | --- | --- | --- |
| **B1** | Keep `null` | unmetered Pro | Zero work; but a $9 sub becomes an unlimited zero-egress distribution pipe. Fails the launch bar. | n/a |
| **B2** | One static Pro number | 6 TB/mo (3x the largest plan) | Fits the Record shape as-is; but the $9 / 100 GB plan gets a 60x-cap allowance, so abuse cost is decoupled from revenue. | Unmarketed, tunable silently. |
| **B3 (recommended)** | Multiplier of the EFFECTIVE storage cap | **3x cap/month**: 300 GB (Pro 100), 1.5 TB (Pro 500), 6 TB (Pro 2 TB), and 225 GB for Event Pass while we are in there | Abuse bound scales with revenue; legit use is comfortably inside (filling your entire cap three times in one month is not normal hosting). Implementation: an `INGRESS_CAP_MULTIPLIER = 3` in `tiers.ts` + the RPCs computing `3 * effective cap` from `profiles.storage_cap_bytes` (they already read it for the storage check); `tier_limits()` returns the multiplier; parity test extends to it. | Unmarketed and never surfaced in copy, so the multiplier can be tuned either way silently; the only sticky part is a paying host hitting it, mitigated by admin visibility + a manual override. |

Why 3x: 1x = fill your cap once (normal); 2x = one full redo; 3x leaves a full extra cycle of
headroom before the meter bites, while capping the transfer-pipe abuse at roughly $10 to $15 of
write-op + backup cost per month on the worst plan. Free stays at 20 GB/mo (10x its cap, already
generous). The cost of being wrong is asymmetric: too high just means slightly more abuse headroom;
too low blocks a paying customer, so 3x over 2x.

### Decision C: Event Pass renewal at $15/yr (sanity check)

- Full-use cost: 75 GB at $0.015/GB/mo is ~$13.50/yr, so $15 is thin ONLY at 100% utilization;
  a typical wedding album (15 to 25 GB) costs $2.70 to $4.50/yr. Renewal years add near-zero ingress
  (the album is already uploaded) and reels now render for $0.
- Reference point: Google One 100 GB is ~$20/yr; $15 for 75 GB of a hosted, shareable, reel-bearing
  album is priced to feel like an easy yes, which is the point of a retention price.
- **Verdict: keep $15.** No change. The only watch item mirrors PRICING.md's Pro 2 TB note: if
  full-utilization renewals ever cluster, revisit; renewal is a Stripe price, changeable for FUTURE
  renewals without touching code (grandfathering only binds active terms).

## 4. RECOMMENDATION

**A2 + B3 + C keep.** Concretely:

1. **Reel length: Free 30s max, Pro + Event Pass 60s max.** Composer offers 15s / 30s to everyone,
   adds a 60s option locked behind paid, Auto clamps to the tier cap. Server-side: clamp
   `p_length_seconds` in the reel-config RPC and re-derive the cap from the host's tier at
   render/mint time. New `MAX_REEL_SECONDS: Record<Tier, number>` in `tiers.ts` (free: 30, pro: 60,
   event_pass: 60), mirrored in `tier_limits()`, parity-tested.
2. **Ingress: 3x the effective storage cap per month for Pro AND Event Pass** (300 GB / 1.5 TB /
   6 TB / 225 GB), via an `INGRESS_CAP_MULTIPLIER = 3` rather than static bytes; Free stays 20 GB.
   Surface the meter state on the admin host view so a legit block is visible and overridable.
3. **Event Pass renewal stays $15/yr.** Nothing to change.

Reasoning in one line: with render cost at $0, every remaining number is a product lever, so set the
free experience at the category norm (30s, watermarked, still excellent), make Pro's headroom real
(60s + video clips), bound abuse proportionally to revenue (3x cap), and leave every door open in the
only direction we would ever want to walk through it (raising, never lowering).

If Will replies "yes, your recommendation," the executing agent has everything: the three numbers,
the shape (`MAX_REEL_SECONDS` + `INGRESS_CAP_MULTIPLIER`), and the parity contract.

## 5. What we build meanwhile / what waits

**Builds now (not blocked by this ruling):**
- The R2-A WebCodecs + canvas spike (the Plan A gate) and the engine work: length caps sit ON TOP of
  the engine, whichever render path wins.
- Reveal-moment + marketing-identity lab work; the composer's existing Auto / 15s / 30s stays as-is.
- Admin ingress-meter visibility can be scaffolded any time (it reads `storage_ledger` regardless of
  the Pro number chosen).

**Waits for the ruling:**
- The `tiers.ts` + `tier_limits()` change set (all three numbers land together in one slice, parity
  test extended, `get_advisors` after the migration).
- The pricing-page copy touch (Pro gains "60-second reels"; Free shows "30-second reels").
- The composer 60s option + tier lock + server clamps (ships with the same slice so UI and
  enforcement never drift).

Sources: [GoPro Quik length limits](https://projectgo.pro/how-long-can-gopro-quik-videos-be/),
[GoPro community on 60s desktop cap](https://community.gopro.com/s/question/0D53b00008BtCSjCAN/why-does-the-new-quick-app-limit-video-edits-to-60-seconds?language=en_US),
[Canva video length limits](https://8designers.com/blog/does-canva-have-a-video-length-limit),
[Canva Pro vs Free 2026](https://www.stylefactoryproductions.com/blog/canva-pro-vs-free),
[CapCut free vs Pro 2026](https://bigvu.tv/blog/capcut-free-vs-pro-what-2026s-restructure-actually-gives-you/),
[Google Photos highlight videos](https://www.techradar.com/computing/software/google-photos-can-now-make-automatic-highlights-videos-of-your-life-heres-how).
