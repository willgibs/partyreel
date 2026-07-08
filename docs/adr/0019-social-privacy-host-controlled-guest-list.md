# ADR-0019: Host-controlled guest lists; profile-side guest privacy; open follows

**Status:** Accepted (2026-07-05, Will's T1 ruling) · **Context:** ADR-0015 (required public display
names), the profiles+social program (ROADMAP), the elevation-program T1 options-doc (git history:
`docs/decisions/t1-profiles-social-privacy.md`)

## Context

P2 of the profiles+social program adds `user_follows` and a per-event "Guests (N)" list (signed-in
uploaders). The options-doc weighed four consent models, from public-by-default through strict
opt-in-everything, and recommended a two-key model (host toggle AND per-guest opt-in). Will ruled
differently, and the reasoning is the durable part of this record.

## Decision (the ruled model)

1. **The event guest list is HOST-controlled.** `events.show_guest_list` (host toggle); when on, ALL
   signed-in uploaders render named on the event surface. There is NO per-guest opt-in key and NO
   per-event unlist from the event page.
2. **The guest's control lives on their OWN profile.** A guest can hide individual events from their
   public profile (the guest-side twin of `events.display_in_profile`) while remaining on the event's
   guest list as an uploader.
3. **No `discoverable` flag.** Profiles are public by existence; creating one (P1) is the consent act.
4. **Follows are open any-to-any**; follower lists and counts are private to the account owner (the
   VSCO shape: a graph without a clout economy).
5. **Blocking ships IN the P2 slice** (mutual severance, private, no notification), never as a
   fast-follow.
6. **Notification consent tiers** (from the options-doc, uncontested): transactional always;
   relationship/service default-ON with per-category opt-out for ACCOUNT guests only; anonymous-email
   guests receive nothing beyond explicitly requested one-shots; marketing stays explicit opt-in.

## Why (Will's reasoning, recorded verbatim-in-intent)

- Per-guest opt-in lands guest lists near-empty: disappointing for hosts, friction for the future
  social side, and more for a new guest to digest at signup-to-upload.
- Attribution is ALREADY public by name on the same album surface (ADR-0015 required display names),
  so listing everyone who uploaded in one place adds little new exposure.
- A guest concerned about the linkage can simply not upload, or the host can enable anonymous uploads;
  the escape hatches already exist at the right layer.

## Consequences

- The `Guests (N)` section renders full-named lists whenever the host enables it; social surfaces
  filter by blocks server-side (SECURITY DEFINER), never client-side.
- The GDPR posture rests on legitimate interest over already-public attribution rather than opt-in
  consent; counsel blesses the `/privacy` + ToS wording in the ADR-0020 D2 paper review (a checklist
  item, not a build blocker).
- The invariants that survive unchanged: `getGalleryStats` ships numbers never identities; emails stay
  host-visible-only by construction; locked pages leak name + count only.
