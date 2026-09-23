---
track: recheck-by-upload
status: open            # open -> handed-off; deleted in the merge commit that integrates it
cut: "8d1f66fd"            # the launch-prep SHA the branch was cut from
board: identity-door
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/app/(dev)/design/sandbox/identity-door/
  - src/app/(dev)/design/sandbox/guest-capture/
  - src/app/(dev)/design/sandbox/identity-profile/
  - src/app/(dev)/design/sandbox/identity-claims/
  - src/app/(dev)/design/sandbox/media-viewer/
reads:                  # single-sources you depend on: never duplicate, never edit
  - docs/systems/guest-flow.md
  - docs/systems/profiles-social.md
  - src/components/auth/account-door.tsx
  - src/components/app/event-card.tsx
  - src/components/shared/unverified-mark.tsx
---

# lp/recheck-by-upload

**Goal.** Five standing boards made current with tonight's rulings before Will reviews them: save is gone (a person is a guest only by uploading), a profile's "guest at" line follows the album, and a guest's own deletes close a require-upload album again. Each reached question is adapted (the promising road kept open, the recommendation re-weighed) or removed as solved, by Will's decision-outcomes rule; no board imports the `saved` card variant afterwards.

## The brief

**Will's words (2026-09-22), verbatim.** On the save feature: "we should kill the event 'save' feature. Most of our product choices are meant to encourage guest participation for the host's benefit, so saving an event without participating is useless. This likely creates some conflict with some of our save flows leading to email capture, but the only way to be attached to an event as a guest should be via upload. Password entry, veryify account, but no upload? Not listed as a guest. Delete all of your uploads? Removed as a guest. Uploaded 1 photo? You're a guest. The new email capture after upload should incentivize the email to save the event under the account for the future, but uploading to an event is now effectively saving. No attendance reward; must upload to be guest." On signing in from the name menu: "now that 'save' as a feature is being removed, I think this question has become stale. As a rough equivalent, in events that don't require verified emails, a name-only or unverified email guest logging in would carry their uploads into their verified account." On the host's credit keeping a confirmed guest's email: "Yes ... because this is the safety advantage when a host toggles on require verified accounts for events. Otherwise, if we don't display verified emails, anyone could verify any email account, and there's no real verified identity tied to the safety feature. If I'm a verified guest on 'fakeemail@domain.com' but the host only sees a verified badge, it implies far more safety than it should." His two follow-up picks: a profile's "guest at this event" line FOLLOWS THE ALBUM (on an event set to Require an upload to view, only the host and signed-in people who have passed that event's door see it), and on that door, "OWN DELETES CLOSE IT" (a guest's own deletes close the album again; a host's or the system's removal never re-closes it). And: "we have no real users on Partyreel, so everything is test data right now. Don't have to dance around anything like save tables in the database before launch - big reason we're delaying it, so we can have a perfect product before rather than try to adapt new features to existing users' data."

**The judgment on every question a newer ruling reached (Will, 2026-09-22, verbatim):** "when I hit an early board question, I answer based on the immediate context I have in my head of that question, plus what's provided. However, sometimes my selection diverges us from an exploration's idea that's actually better but would become irrelevant due to my selection taking a different path. It's up to your discretion to decide which open questions still offer potential value and deserve to be adapted to current context, and which have been solved optimally already, offering no further value regardless of previous selections (we've already reached pinnacle solution of that question's context) and ready to be removed." So for each reached question: if its options still hold an idea that could beat the current path, ADAPT it to the current context (reword what is still open, keep the promising road as an option, say in the option what choosing it would change) and re-weigh its recommendation when the reason behind it changed; if its context is already solved at its best, REMOVE it. An option whose drawing shows the old product is REDRAWN on the current one. No badges.

**Rising Tides (Will, 2026-09-22):** "the library's purpose is more our working rules to keep consistency across what we've built and new builds, but not hard rules that can't be reshaped. Working guidelines, not hard rules ... everything is unprotected, anything may be relitigated for better solutions despite any past decisions." A rule that blocks better work is reshaped deliberately and named in your Handoff.

**The rules these lanes stand on (tonight's rulings, the current model):**
- A person is a GUEST of an event only through an upload of theirs. A LIVE upload is one whose `media.status` is not `removed` (pending, approved or hidden). What other people see needs an APPROVED one: the guest list, the Guests room, every guest count, a profile's "guest at" line. The account's own events list takes any live one. A `guests` row stays what it is, the device's upload ticket minted at the door, and nothing reads a row as attendance. A cut added to the album (the reel round) is an upload like any other.
- SAVE IS GONE: no Save button, no saved list, no separate save step anywhere. The events a person added to appear on their dashboard marked "Guest" (the profile's own word), so "this event stays in your account" becomes true through the upload and the claim. Confirming an email claims the uploads (the existing claim: a name-only or typed-address guest's uploads on the same browser; a typed address's rows on any device once that address is confirmed).
- REQUIRE AN UPLOAD TO VIEW: an upload the guest removed themselves (`removed_by_uploader`, a disown included) no longer opens the door; a host's, an admin's or the system's removal still does.
- A profile's "guest at" line on a require-upload event, while uploads are open, shows only to the host and to signed-in viewers who have passed that event's door.
- The host keeps seeing a confirmed guest's address under the name in the host's viewer (Will's reason above).
- Before launch nothing waits for partyreel.com's older build (PROGRAM.md, "Before launch").

**Your five boards and what the rulings reach on each** (a survey from two read-only reviews; a starting point, and your judgment wins where the options say otherwise):
- `identity-door` (`spec.ts`, `parts.tsx`): `gate`'s recommended `list` option adds "Save the event to your profile" (from his earlier note asking for "a couple benefits (save the event, come back anytime)"), which no longer exists, and its `because` cites it. The question still holds value (does the verified gate say what confirming gives?): redraw `list` with benefits that hold for a guest who confirms at the gate BEFORE any upload (confirming alone attaches her to nothing; every photo she adds stays in her account), and re-weigh the recommendation, which may now be `line` or a one-benefit list. Check `menu`, `field`, `nudge` and `remove` for any drawn save act.
- `guest-capture` (`spec.ts`, `parts.tsx`): the context ("Confirming keeps the event and every photo in her account") stays true (the claim brings the event with the photos). Only a separate save act drawn in the parts changes (the `Bookmark` glyph at `parts.tsx:77`, any "Save event" label, and the comment naming `SaveEventButton`). The offer's words stay; a later voice board owns them.
- `identity-profile` (`spec.ts`, `parts.tsx`): `attended` picks among her "joined" events: they become the events she added photos to (her wording in the context and options). `page`'s recommended "3 events, kept private" now leaks what "Follow the album" hides: it tells any visitor she is a guest at albums they could not open. Adapt: the count covers only events this viewer could see if they were shown (or the option is redrawn without a count), and re-weigh the recommendation.
- `identity-claims` (`spec.ts`, `parts.tsx`, `fixtures.ts`): `after` says the dashboard is unchanged after Finish, but a claimed event now joins Your events as a Guest card. Adapt: redraw `toast` with the claimed event arriving as a Guest card; keep `strip` only if it is a distinct "just claimed" highlight, otherwise remove it as solved; `profile` stands. Its background art (`SavedEventCard`, `parts.tsx:581-596`, `:632`, `:679`) draws the production `EventCard` with `variant="saved"`, which the `guest-by-upload` lane is changing: replace it with LOCAL lab art (a card of your own drawing marked "Guest", or `EventCard` with `variant="hosted"` plus a local marker), so no board imports the `saved` variant.
- `media-viewer` (`spec.ts`, `viewer.tsx`): `who` must draw the host's confirmed-address line (`Address`, `viewer.tsx:163-175`) in every option (`pill`, `foot`, `face`) whenever the credit is confirmed and the viewer is the host. Add it where an option lacks it; nothing else on the board moves.

**Touchpoints.** You edit no `touchpoints.ts`, `registry.ts` or `boards.ts` line. List in your Handoff any `touchpoints.ts` text that now reads wrong (for example `identity-profile`'s "three events joined") and the Orchestrator lands it at the record.

Everything else on a board stays: this is a recheck, not a new round (the round number stays; no ledger is written); keep `defineExploration`'s shape (one question per decision, every option drawn). The Handoff says, one line per reached question, whether you adapted, removed or left it, and why.

**Binds.** The bible and the policies (`/design/library`), the contracts of every component under a path you own, and
CLAUDE.md's working loop. A record doc
(`docs/STATUS.md`, `docs/ROADMAP.md`, `docs/PROGRAM.md`, `CLAUDE.md`, `docs/ASSETS.md`, `docs/tracks/orchestrator.md`,
`docs/reviews/`) is edited only when your `owns` names it. Stage explicitly; never `--no-verify` or force-push; every commit ends
with the `Co-Authored-By` line naming the model you actually run on.

**Verify on.** Each of the five boards at 1440 and 375 with reduced motion honoured; `pnpm lab:smoke --base http://localhost:<port>` whole; `pnpm lab:demo --board <board> --base http://localhost:<port>` for identity-door, guest-capture, identity-profile, identity-claims and media-viewer, every step pressing; the gate (`pnpm design:rules`, the collector, typecheck, lint, test, build) on the synced tree.

## Questions (a recommended answer each; the Orchestrator relays them)

- none yet

## System-doc edits (in place, owned facts only)

- none yet

## Deferred (ROADMAP one-liners, bucket named)

- none yet

## Handoff (replaces the chat report)

- The work commit and the sync commit, pushed (or: launch-prep had not moved); the head is in the chat line
- Every claim names its artifact (a commit, a log line, a path), so the Orchestrator checks rather than believes.
- Gates on the synced tree, each on its own exit code
- Lane check: `git diff --name-only origin/launch-prep...HEAD` = owned paths + this file (exceptions and why)
- The items, one line each
- Assets requested from Will: none, or one per line: `what · spec (size, grade, count, format) · replaces <stand-in id>`
- Proposed migrations / Worker / Vercel / Stripe / env changes: none
- Calls his to overrule, one line each
- Look at first: ...
