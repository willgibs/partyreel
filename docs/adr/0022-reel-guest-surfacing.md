# ADR-0022: Reel guest surfacing: publish switch, adaptive placement, guest downloads, hybrid source

**Status:** Accepted (2026-07-05, Will's T1 ruling) · **Context:** ADR-0003 (no raw R2 keys),
ADR-0004 (capability tokens), the reel spec's Slice B questions, the client-render pivot, the T1
options-doc (git history: `docs/decisions/t1-reel-guest-surfacing.md`)

## Context

The reel was host-only. Five questions governed what guests see, where, and what they can take away.
Client rendering re-derived the economics: a "guest-triggered render" is now a $0 encode on the
guest's own device, demoting the host-uploaded mp4 from requirement to optimization.

## Decision

1. **Visibility: a host publish switch, default OFF, made loud.** `highlight_reels.guest_visible`
   (default false); the composer carries a prominent one-tap "Share with guests" (the publish tap is
   a product moment, pairing with the reveal work). No silent draft exposure, ever.
2. **Placement: lifecycle-adaptive.** A cinematic reel card under the action block while
   `accepting_uploads` (upload stays the page's primary job mid-event), promoted to the top of the
   page once the host closes uploads and the link becomes the keepsake album. Tapping opens a
   full-bleed player overlay (the watch + share + download surface).
3. **Guests CAN download the mp4.** Watch-only throttles the growth loop at its strongest link and
   protects nothing a screen recorder does not defeat; the free-tier watermark was designed for
   exactly this distribution.
4. **Download source: hybrid, artifact-preferred.** Serve the cached host mp4 when `rendered_hash`
   matches the current config (instant, universal); otherwise the guest self-encodes client-side at
   $0; devices that cannot encode fall back to the newest artifact, then to "ask the host". Guests
   NEVER get a write path: only the host's authed session PUTs to `reelOutputKey`.
5. **The anon surface is an explicit allow-list** (the RPC build spec + its contract test):
   `style_id, orientation, seed, length_seconds, cover_media_id`, derived `mp4_ready` + `watermark`,
   and the ordered reel items re-filtered at read time to approved AND currently visible, with no
   uploader identity. Never returned: `output_key`, render internals/costs/errors/hashes, timestamps,
   the host's tier. Structural guards: the anon RPC gates on `visibility = 'open'` internally
   (password events ride the unlock-cookie server read), and the reel renders ONLY at gallery access
   `full` (never a teaser bypass).
6. **NO end-card.** The watermark carries free-tier branding; paid hosts get zero Partyreel branding
   on their event surface. Ruled explicitly; do not revisit as a "growth extra".

## Consequences

- R3 builds to this spec; the anon-read RPC set grows by exactly one member (advisors re-checked).
- If client-encode ever fails a device class, the model degrades to artifact-only with no product
  re-litigation.
- A tampered guest client can only strip the watermark off its OWN local encode; accepted pre-launch,
  noted for the security round.
