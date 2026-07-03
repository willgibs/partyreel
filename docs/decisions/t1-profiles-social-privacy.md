# Options-doc: the profiles + social P2 consent/privacy model

> STATUS: awaiting Will's ruling (T1 Ruling Day). One of the four R1 one-way-door docs.
> Ruling lands as ADR-0019+ and gates R4b (Social layer). Author: agent, 2026-07-03.

## 1. The decision, and why it is a one-way door

P1 (public creator profiles, being built, reversible) leads into P2: `user_follows` (any user can
follow any user, a `saved_events` clone) plus a per-event **"Guests (N)"** section on the event feed
(signed-in uploaders, sortable by upload count). Together these take a person who merely *uploaded a
photo at a party* and potentially make them **listed, linkable, followable, and discoverable**.

Three things make this irreversible in practice:

1. **Exposure cannot be un-leaked.** If a guest list ships public-by-default and we tighten later,
   every name already rendered on a shared album link has been seen, scraped, or screenshotted. A
   default can only safely move in the private-to-public direction with fresh consent, never back.
2. **The legal basis is chosen once.** Under GDPR, publishing a user's presence needs a lawful basis:
   explicit opt-in consent is clean; "legitimate interest" requires a balancing test that likely fails
   here, because *attendance at a private event* can reveal facts about someone's private life
   (who they socialize with, where they were, sometimes religion or orientation by event type). If we
   launch on an opt-out default and later need consent, we face a re-consent campaign against data we
   already exposed. Opt-in now costs nothing; opt-out now creates permanent debt.
3. **The semantics bake into the security layer.** Discoverability, listing, and blocking rules get
   compiled into SECURITY DEFINER RPCs and RLS filters that every social surface then assumes.
   Changing "who can see whom" after launch means auditing every list-returning RPC again.

The counterweight: **we have zero real users today**, so whatever we rule applies cleanly with no
backfill and no apology. This is the cheapest moment this decision will ever be.

**Also folded in (same consent surface):** R5 adds guest-facing notifications. What may we send an
account guest vs an anonymous-email guest by default? Same ruling, so the notification prefs table
is shaped correctly the first time.

## 2. Context and constraints (codebase + product)

- **Identity chain already exists:** `media.guest_id` -> `guests.user_id` -> `profiles`.
  `display_name` is required, public, profanity-filtered, service-role-write-only (ADR-0015).
  Uploader attribution (name) already shows in the lightbox to anyone holding the album link; the
  email is host-visible only *by construction*. "Anonymous" renders for unclaimed uploads.
- **"Require accounts to upload" is FREE and default-ON** (S5, 2026-06-21), so the typical future
  uploader is an identifiable account guest. The guest list is derivable today with zero schema work,
  which is exactly why the consent model must come first.
- **`events.display_in_profile` (P1) already decouples discovery from access** on the host side: an
  open event can stay off a public profile. P2 needs the guest-side twin of that idea.
- **Event pages are capability-gated, not indexed:** `/e/[qr_token]` is noindex and the token is the
  authorization (ADR-0004). So "public guest list" really means "visible to anyone holding the album
  link". Profiles (`/u/[slug]`) are the opposite: indexable, searchable, deliberately public. The
  consent stakes are much higher on any surface that *links out to a profile*.
- **Load-bearing privacy invariants to preserve:** `getGalleryStats` ships numbers, never identities;
  like counts are host-only; locked pages leak name + count only. A public guest list must not become
  the side channel that breaks these.
- **The bell is derive-on-read with a tiny extension point** (one read + one case); R5 replaces it
  with a durable feed + Realtime push. Notification consent tiers decided here define that table.
- **Cost math (2026-07-03 program context):** reel renders are moving client-side (target $0 at any
  scale; fallback tuned Lambda at ~$0.006-0.024/render), and Supabase Realtime push adds no new SaaS.
  So nothing in the consent model needs to be shaped by infrastructure cost. This is purely a
  product/consent decision; pick the right model, not the cheap one.
- **The real `/privacy` page is launch-gated** and must document whatever we rule (GDPR/CCPA
  disclosure, right to delete, right to opt out).

### What comparable products do

- **Partiful** shows the guest list to guests by default but gives the **host** toggles to hide the
  guest list and guest count (Display + Privacy settings); only hosts see the full invite list, and
  "Can't Go" RSVPs are hidden from guests. Consent is host-held, not guest-held.
  ([help.partiful.com](https://help.partiful.com/hc/en-us/articles/26503238663195-Can-I-hide-the-guest-list-or-guest-count-on-the-party-page))
- **Instagram tagged photos** are the subject-controlled model: you can require manual approval
  before a tag appears on your profile, and you are notified on every tag. Presence on your own
  profile is yours to grant. ([help.instagram.com](https://help.instagram.com/496738090375985/))
- **Google Photos shared albums** share to specific accounts by default for control, and face
  visibility has per-person "show less / block" controls; the design direction is per-person subject
  control layered over owner control.
  ([support.google.com](https://support.google.com/photos/answer/9789702?hl=en))
- **VSCO** is the anti-anxiety social graph: all profiles public by design, but **follower counts and
  lists are visible only to you**, and there are no public likes. Follows exist without becoming a
  status economy. ([vsco.co](https://vsco.co/archive/journal/vsco-cam-3-for-android-find-follow),
  [bitdefender.com](https://www.bitdefender.com/en-gb/blog/hotforsecurity/parents-need-know-vsco))
- **Regulatory baseline:** GDPR consent must be a clear affirmative opt-in act
  ([gdpr.eu](https://gdpr.eu/gdpr-consent-requirements/), [gdpr-info.eu](https://gdpr-info.eu/art-6-gdpr/));
  legitimate interest needs a purpose/necessity/balancing test that is hard to win for publicizing
  event attendance ([iubenda](https://www.iubenda.com/en/help/78656-consent-vs-legitimate-interest/)).
  For email: CAN-SPAM permits transactional mail without prior consent (opt-out required for
  promotional); CASL requires consent with only a narrow, genuinely-transactional exemption, and an
  existing relationship gives implied consent for service messages
  ([crtc.gc.ca](https://crtc.gc.ca/eng/com500/faq500.htm),
  [octillolaw.com](https://octillolaw.com/insights/can-spam-tcpa-and-casl-best-practices-for-marketing-teams/)).
  Designing to the strictest overlap (opt-in for anything promotional, relationship-based defaults
  with granular opt-out for service messages) satisfies all three regimes at once.

## 3. Options

### Option A: Public by default, opt-out (the Facebook-era model)

Guest lists render named on every shared album; profiles are discoverable by default; anyone is
followable; blocking is the only escape hatch.

- **Consequences:** maximum social energy on day one (full lists, dense graph). But a party guest's
  attendance goes public without any action on their part, the GDPR basis is a legitimate-interest
  stretch we would likely lose, and the first "why is my name on this wedding album for my whole
  office to see" email is a trust incident for a product whose pitch is "frictionless and safe".
- **Reversibility: effectively none.** Tightening later un-lists no one retroactively and requires a
  re-consent campaign. This is the door slamming.

### Option B: Host-controlled (the Partiful model)

The host gets a `show_guest_list` toggle per event; when on, all signed-in uploaders render named.
Guests get no individual say beyond not uploading.

- **Consequences:** simplest to build (one event column, zero guest UX) and matches how invite tools
  work. But it puts consent in the wrong hands: the host does not own the guest's identity exposure,
  and Partiful can afford this because RSVPing to an invite is itself a deliberate social act, while
  scanning a QR to dump photos is not. Legally it leaves us as the controller publishing a data
  subject's presence on a third party's say-so.
- **Reversibility: moderate.** Adding per-guest control later is additive, but every list rendered
  before that patch was exposure the guest never granted.

### Option C: Layered consent, two keys (RECOMMENDED)

Presence on any public social surface requires **both** the host's key and the guest's key; the host
always sees their own event's contributors (no new exposure, they see attribution today).

- **Account level:** `profiles.discoverable`, default **false**. Off = today's behavior exactly:
  plain-text attribution name, no profile link, not followable, not in any public list, not in
  search/discovery. On = attribution links to your profile, you appear named in public guest lists,
  and you are followable. Creating a public profile (P1) is the natural moment that *asks* for this
  flag; it never silently implies it.
- **Event level (host key):** `events.show_guest_list`, host toggle. When on, the "Guests (N)"
  section renders: **named entries for discoverable guests only**, everyone else aggregated into a
  "+K more" count (numbers-only, consistent with the `getGalleryStats` invariant). Host default ON is
  safe because named exposure is guest-gated anyway.
- **Per-event unlist (the Instagram remove-tag analog):** a discoverable guest can still remove
  themselves from one specific event's public list ("I am public, but not on *this* album") via a
  small `guest_list_optouts (user_id, event_id)` table. Cheap, and it is the escape hatch that makes
  a single global flag livable.
- **Follows, VSCO-shaped:** any signed-in user can follow a **discoverable** user (or any host with a
  public P1 profile, since publishing a profile is the followable consent act). Follower **lists and
  counts are private to the account owner**; no public follower counts anywhere. This keeps the
  growth loop (guest follows host, sees the next event) without importing a clout economy.
- **Blocking ships IN the P2 slice, not as a fast-follow:** `user_blocks (blocker_id, blocked_id)`.
  Semantics: severs follows in both directions, prevents re-follow, hides the blocker's profile and
  guest-list entries from the blocked user on all **social** surfaces. It does not touch in-album
  attribution on a capability link (that is the host's event surface, and pretending the name is not
  there while the photos are is false comfort). Block lists are private; blocking sends no
  notification.
- **Consequences:** the guest list starts sparser (only opted-in guests named), which is the real
  cost. Mitigation: the opt-in prompt sits at high-intent moments (first upload success, profile
  creation, the save-event prompt), and "N guests" still renders social proof even at zero opt-ins.
  Build cost is moderate: two flags, two small tables, and every list-returning RPC filters by
  discoverable + blocks server-side (SECURITY DEFINER, never client-filtered).
- **Reversibility: the only option that keeps the door open.** Every future loosening (a default
  flip, richer discovery) is a fresh consent ask against users who already have the controls. No
  retroactive exposure is ever created.

### Option D: Strict opt-in everything (max privacy)

Like C, but also: follows require approval (follow requests), guest lists are host-only forever with
no public section, and all notifications are opt-in including account-guest service messages.

- **Consequences:** legally bulletproof but kills P2's point: no public guest list means no "who else
  was there" moment, follow requests add a whole inbox/approval subsystem for a network with zero
  users, and opt-in-only service notifications means hosts miss "your reel is ready". The social
  thread the mission names would ship dead.
- **Reversibility: high, but** we would be building approval machinery we would almost certainly rip
  out, and D can always be reached later from C by flipping semantics down, not up.

## 4. Notification consent tiers (folds into the same ruling)

Three tiers, designed to the strictest overlap of CAN-SPAM / CASL / GDPR:

| Tier | What | Account guest default | Anon-email guest default |
| --- | --- | --- | --- |
| 1. Transactional / security | sign-in codes, password, billing, deletion warnings, "download before purge" | Always sent, no toggle | Sent only where a flow they initiated requires it (e.g. OTP) |
| 2. Relationship / service | activity on events you joined or host: reel ready, album shared, new-uploads digest, new follower (only if discoverable) | **ON by default**, per-category toggles + one-click unsubscribe in every email | **Never.** Only explicit one-shots they requested ("email me the album", via the existing `sendOnce` pattern) |
| 3. Marketing / newsletter | product news, promos | **OFF, explicit opt-in** (the existing newsletter checkbox stays the one door) | Same: only via the existing `capture_guest_email` opt-in |

Rationale: an account guest has an existing relationship (CASL implied consent, GDPR
legitimate-interest for service messages is defensible), so tier 2 default-on with granular opt-out
is both lawful and the behavior people expect. An anonymous-email guest gave us an address for one
purpose; using it for anything else is exactly the spam pattern the laws target, and they have no
prefs surface to manage, so the rule is "only what they explicitly asked for, per ask". Social
notifications (new follower) belong to tier 2 but fire only when `discoverable` is on, since a
non-discoverable user cannot gain followers. Every tier-2/3 email carries unsubscribe; tier-1 never
mixes in promotional content (that mixing is what voids the CASL transactional exemption).

## 5. RECOMMENDATION: Option C with the tier table above

Reasoning, compressed:

1. **It is the only model that matches who owns the consent.** The host owns the event; the guest
   owns their identity. Two keys, one per owner, is the honest mapping. Partiful's host-only model
   fits invites, not photo dumps from a QR scan.
2. **It is the strict-enough legal baseline** (GDPR affirmative opt-in for public presence, CCPA
   disclosure + delete via the existing account/erasure paths, CASL-safe email tiers) without D's
   self-sabotage. The ROADMAP sketch already pointed here; this ruling confirms and sharpens it.
3. **It costs us nothing today and preserves every future move.** Zero users means zero backfill;
   defaults can loosen later with consent but can never tighten retroactively. C is the only option
   where T-plus-one-year Will still has all four options available.
4. **The sparse-list risk is manageable with UX, not defaults.** High-intent opt-in prompts plus the
   aggregate "+K more" keep the section alive; VSCO proves a private-counts graph still functions.
5. **Blocking and the per-event unlist ship in the same slice as follows and lists.** A social layer
   without its safety valves, even for a week, is the incident we cannot walk back.

If Will replies "yes, your recommendation", the ruling is: Option C defaults exactly as written in
section 3 (discoverable false, show_guest_list on, named-if-discoverable, per-event unlist, private
follower counts, mutual-severance blocking in-slice) + the section 4 notification tiers. Record as
its own ADR (0019+; four T1 rulings land the same day, so take the next free number) and unblock R4b.

## 6. What we build meanwhile / what waits

**Build now (no ruling needed, or scaffolding the ruling either way):**

- P1 public profiles as planned: creating one is itself the consent act for that surface, and the
  profile-creation flow is where the `discoverable` ask will live.
- Schema scaffolding that is harmless under any option because NO surface reads it until the ruling:
  `profiles.discoverable boolean not null default false` (note: the default itself is part of the
  ruling; A would flip it, B/D drop the flag, so the column ships dormant and the ruling seeds its
  semantics) written only via an authenticated RPC or a server action, mirroring the `display_name`
  lesson: never a raw column grant; `events.show_guest_list` (host-writable column-grant allowlist
  add, equally dormant until a list surface exists).
- R5 notification foundation shaped to the three tiers: the prefs table keyed by category with
  per-category defaults, so the ruling drops in as seed values, not a redesign.
- The `/privacy` page draft section covering listing, follows, blocking, and email tiers (it is
  launch-gated anyway; this ruling supplies its content). Coordinate with the forensic/CSAM T1
  ruling, which writes its own capture-disclosure section into the SAME page: draft them together.

**Waits for the ruling (do not start):**

- The public "Guests (N)" named section and its RPC.
- `user_follows` + `user_blocks` behavior and any follow UI.
- Any default flips, any discovery/search surface, any attribution-to-profile linking.
- Sending any tier-2 email to anyone.
