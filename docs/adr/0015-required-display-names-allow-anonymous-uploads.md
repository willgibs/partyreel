# ADR-0015 — Required public display names + `allow_anonymous_uploads` (uploader-attribution identity, Phase 1)

- **Status:** Accepted + shipped (2026-06-08). Phase 1 of the 4-phase uploader-attribution / unified-identity initiative (master plan session-archived; shipped result in [CHANGELOG.md](../CHANGELOG.md) + [`../systems/auth-accounts.md`](../systems/auth-accounts.md) + [`../systems/guest-flow.md`](../systems/guest-flow.md)).
- **Builds on:** ADR-0004 (anonymous capability tokens), ADR-0008 (account-from-guest verified email), ADR-0011 (email+password auth), ADR-0014 (column-lock security posture).

## Context

The goal is per-photo uploader attribution (a name on each upload, shown in the lightbox). For that, an account-holder always needs a clean, public, contact-free label. Three problems blocked it: (1) `display_name` was optional and the welcome flow never asked, so most accounts had none; (2) the "verify email to upload" gate (`events.require_email`) read as a second-class "verified guest" concept distinct from "account", confusing the model; (3) no profanity/abuse guard existed for a field that would now be shown publicly, and `display_name` was directly client-writable (RLS column grant), so any app-layer check was bypassable.

Strategic frame: anonymous stays strict + frictionless (an anonymous upload shows "Anonymous"); names appear for logged-in uploaders + the host. On a default open event most uploads read "Anonymous" (guests don't log in) — that is the wedge that pulls hosts toward Pro for verified uploads + identification.

## Decision

1. **Display name is REQUIRED, public, and the SINGLE guarded write path.** Every account must set a name before any identity action (host onboarding; the guest upload name step). Rules: min 1 (allow "AJ") / max 60 / trimmed / non-unique / reserved-name-blocked (impersonation: `admin`, `partyreel`, …) / profanity-filtered. Profanity uses **`obscenity`**, tuned word-boundary so it does NOT false-positive on real (often non-Western) names (Anushka/Shitij/Dickson) while still catching slurs, leetspeak, and compounds (calibrated FP 0 / FN 0 on a 40+/26 sample; see `profanity.test.ts`).

2. **Make the check authoritative (not theater).** Revoke the `authenticated` UPDATE grant on `profiles.display_name` so the column is service-role-write-only; route ALL writes through `updateDisplayNameAction` (getUser → validate → profanity → ADMIN-client write). A direct PostgREST PATCH is denied (proven: `has_column_privilege('authenticated',…,'display_name','UPDATE') = false`). `handle_new_user` leaves `display_name` NULL for ALL signups (incl. OAuth — it no longer copies `full_name`); onboarding PREFILLS the guarded input from `user_metadata`, so even a Google name passes through the one filter (no separate re-check codepath).

3. **Collapse "verify" into "account"; rename + invert the config.** `events.require_email` → **`allow_anonymous_uploads`** (default `true`; turning it OFF — requiring an account — stays Pro-gated via `enforce_event_pro_gates`). An account-required event shows an email-primary **"Enter event"** (`EnterEventPrompt`: one-tap code/magic-link create-or-login, secondary password) instead of the old verify prompt. There are no verification-only paths — an account simply proves ownership. `create_guest` raises when `not allow_anonymous_uploads` and there's no confirmed session.

## Consequences

- Every account-holder has a filtered public name; the "Hosted by" byline now always shows (it hid on null before). Attribution UI (P2) can rely on a name existing for any logged-in uploader, else "Anonymous".
- One more `getUser()` on the guest upload path (cheap local null when there's no session; only signed-in viewers pay a validation).
- Profanity is best-effort POLICY, not a security boundary (like reserved-slugs): spaced-out evasion and a root buried mid-token can slip; the word lists grow as reported.
- The DB column rename touched 3 SECURITY DEFINER RPCs (`get_event_by_qr_token`, `create_guest`, `enforce_event_pro_gates`); values were flipped under disabled triggers. Migrations `20260608093908` + `20260608093939`.
- **Does not** include the attribution UI (P2), claiming anonymous uploads (P3), or dashboard consolidation (P4). The deferred anon-RPC server-mediation (post-ADR-0014 pentest) is owned by P3, which rewrites the same `create_guest` write path.
