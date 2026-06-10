# ADR-0017: Gated gallery — gate the VIEW (server-enforced access levels + a unified entry modal)

**Status:** Accepted (2026-06-09). Builds on the capability-token model ([ADR-0004](0004-anonymous-guests-capability-tokens.md)), the 3-state visibility + password gate ([ADR-0007](0007-event-visibility-password-protection.md)), and `allow_anonymous_uploads` ([ADR-0015](0015-required-display-names-allow-anonymous-uploads.md)). Shipped as a 3-phase initiative; full record in [CHANGELOG.md](../CHANGELOG.md), current truth in [guest-flow.md](../systems/guest-flow.md).

## Context

`allow_anonymous_uploads=false` (and the password gate) gated only the UPLOAD, not the VIEW: an anonymous visitor to an account-required event saw the FULL gallery, and only contributing carried friction. That rewards free-riders (collect everyone's photos, add none), hurts the host, and dissuades contribution. The reframe: make account creation the INCENTIVE to SEE the photos, not a blocker to contribute.

## Decision

**Gate the VIEW with three server-enforced access levels** — `none` / `teaser` / `full` — resolved by a pure `resolveGalleryAccess(event, {isOwner, isAuthed, isUnlocked})` and enforced IDENTICALLY by the two (and only two) guest media surfaces: the `/e/` RSC and the `/api/guests/gallery` poll. The poll was previously UNAUTHENTICATED, so gating only the RSC would be a trivial bypass (closing that was the security crux).

- **`teaser`** = the newest N (9) approved PHOTOS + a total count, via a capped admin read (`getApprovedPhotoTeaser`, self-guarded by visibility). The withheld set NEVER reaches the browser (not a CSS blur — it survives dev-tools / a direct poll call).
- **Privacy rule:** a password event is `none` (no real media) until unlocked; the teaser appears only once the password is proven and the only remaining gate is the account.
- Owner / signed-in / demo bypass to `full`. **No DDL** — all capping is server-side TypeScript; the anon RPCs + column locks are untouched.

**One unified entry `Dialog`** drives all guest entry with ordered, SERVER-DRIVEN steps `welcome → password? → account?`: each step reuses the existing auth form and advances via `router.refresh()` (the RSC re-resolves, the satisfied gate drops — no client step-machine). The always-on first-visit **welcome** is the friendly front door (a guest scanning a QR off a dinner menu needs a beat of context).

Two UX calls diverged from the initial sketch:
- **Radix `Dialog` only**, not a Vaul drawer-on-mobile — a swipe-away sheet mis-signals a gate you must complete, and the app had no responsive-modal precedent.
- **Dismissibility fits what's behind each step** ("dismiss to what?"): welcome freely dismissable to the page; password FIRM (nothing behind it but the locked event); account closes to the browsable teaser (a soft paywall), re-opened by a "See all N photos" button.

**Host config:** the upload-framed "Allow anonymous uploads" toggle is relabeled **"Require guest accounts"** (a display inversion of the same boolean column; schema + server Pro-gate unchanged) + a live `guestExperienceSummary()` shared with the dashboard access line (one source).

## Consequences

- The "zero-server-`getUser`-on-the-common-path" frugality note (guest-flow.md) is intentionally relaxed: the gate needs auth state at render. Cost is unchanged for the anonymous majority (`getUser()` with no session is a local null); the owner check (an explicit `host_id = uid` match, NOT the open-event RLS read) runs only when signed in.
- Inherently Pro (both gates are already Pro-gated); every gated gallery is a signup funnel.
- **Verified** across all three phases: the access matrix as unit tests + local curl (teaser cap, no-leak, none-before-password) against the prod DB; live on partyreel.com (anonymous teaser, signed-in full, the entry modal renders, the host relabel + the live summary).
