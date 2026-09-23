---
track: recheck-by-upload
status: handed-off            # open -> handed-off; deleted in the merge commit that integrates it
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

- none: every reached question resolved inside the brief's own discretion; nothing rose to a genuinely new one-way-door decision.

## System-doc edits (in place, owned facts only)

- none: `owns` names no `docs/systems/` file, and nothing here changed production behaviour.

## Deferred (ROADMAP one-liners, bucket named)

- "Now": line 29 ("Profiles (Will's call): should a profile's attended event also follow Require an upload to view?") is answered by tonight's ruling verbatim (only the host or a signed-in viewer who has passed that event's door sees the line) — resolve/remove rather than leave open.
- "Now": line 173's "Save (`SaveEventButton`)" half (guest dialogs that should ride the responsive Sheet) goes moot once `guest-by-upload` retires the button; "Download all" (`ExportDialog`) is the only half still live.

## Handoff (replaces the chat report)

- Work commit `f746dbbe` ("recheck: five identity boards made current with tonight's rulings"); synced with `origin/launch-prep` (one commit ahead, `docs/tracks/orchestrator.md` only) at merge commit `a8937fe1`, no conflicts. This manifest's own commit is the head; its sha is the chat line.
- Every claim below names its artifact.
- Gates on the synced tree (`a8937fe1`), each its own exit code: `pnpm design:rules` 0 (no diff), `collect-specimens.mjs` 0 (no diff), `pnpm typecheck` 0, `pnpm lint` 0 (9 pre-existing warnings, none in a file this lane touched), `pnpm test` 0 (353 files, 3893 passed, 1 pre-existing skip), `pnpm build` 0. `pnpm lab:smoke --base http://localhost:3131`: 486 checks, 0 failing. `pnpm lab:demo --board <board> --base http://localhost:3131`: identity-door 5/5, guest-capture 4/4, identity-profile 4/4, identity-claims 5/5, media-viewer 8/8, every step 0 failing and drawing its options.
- Lane check: `git diff --name-only origin/launch-prep...HEAD` = exactly the 10 files under the five owned board dirs (`guest-capture/parts.tsx`; `identity-claims/{board,fixtures,parts,spec}`; `identity-door/{parts,spec}`; `identity-profile/{fixtures,parts,spec}`) plus this manifest's own commit. Nothing else; `media-viewer/` untouched (see its line below).
- The items, one line each:
  - `identity-door.field` / `.nudge` / `.menu` / `.remove`: no drawn save act in any of the four; left standing.
  - `identity-door.gate`: adapted. The `list` option's two benefits ("save the event to your profile" / "come back anytime") are down to one true forward promise now that save is dead; redrew it to one line and reweighed the recommendation from `list` to `line`, since a single leftover benefit no longer earns the extra element over the ruled sentence.
  - `guest-capture`: adapted (narrowly). The offer's own words stand, per the brief; only the drawn save act moved — the Bookmark glyph in `OfferCard`'s circle became Mail (the actual act is confirming an email, not a separate save), and the doc comment's `SaveEventButton` mention is dropped. `moment` / `shape` / `follow` / `name` untouched.
  - `identity-profile.attended`: adapted (wording). "Joined" became "added photos to" throughout (the ask's context, the `guest-menu` option, and every card/label in `parts.tsx`), matching production's own `attended-events-visibility.tsx` empty-state copy ("Events you add photos to"), read but not edited.
  - `identity-profile.page`: adapted. The recommended `count` option's "3 events, kept private" would leak that Priya is a guest of a Require-upload-to-view album (The Block Party) to a stranger who never passed its door. Gave `ATTENDED` a `requireUpload` flag, made the count viewer-scoped (2 of 3, computed live, never hardcoded), and reweighed the recommendation (kept `count`: the fix is the same door-first discipline the attended arm's own covers already use, not new complexity).
  - `identity-claims.after`: adapted. "The dashboard is unchanged" after Finish is no longer true: a claimed event now joins Your events as a Guest card. Redrew `toast` and `profile` so both show the claim settling in as an ordinary Guest card (`DashboardScene` gained an `extraCard` slot); kept `strip` as a genuinely distinct "just-claimed" highlight (its own section above Your events, never a duplicate card) rather than removing it as solved, since the highlight-vs-quiet contrast is real value the baseline fix does not reach.
  - `identity-claims` background art: `SavedEventCard` and `ClaimedStrip`'s `EventCard variant="saved"` replaced by `variant="hosted"` plus a local `GuestMark` overlay ("Guest", the same glass-pill corner treatment the bookmark used). No board imports `variant="saved"` after this commit (checked all five boards; only these two call sites existed).
  - `media-viewer.who`: verified, no change. Read `Attribution`, `FaceCredit` and `Chrome` in `viewer.tsx` end to end: the host's confirmed-address line (`Address`, `viewer.tsx:170-177`) already renders for all three shapes (`pill`/`foot` through `Attribution`'s shared return branch, `face` through `FaceCredit`, mounted independently of `holds`). Confirmed live: Role=host + Credit=confirmed shows "Leah · leah@example.com" under all three `who` picks, at both screens. The board's other seven asks untouched.
  - Touchpoints: `touchpoints.ts:224` (`identity-profile`'s `board.note`) still reads "verified with three events joined and none shown"; wants "added photos to three events" to match the board.
- Assets requested from Will: none.
- Proposed migrations / Worker / Vercel / Stripe / env changes: none.
- Calls his to overrule, one line each:
  - `identity-door.gate`: moved the recommendation from `list` to `line` (one surviving benefit felt thin against the ruled sentence); overrule keeps `list` if even one true benefit is worth the extra line.
  - `identity-profile.page`: kept `count` (viewer-scoped) as recommended rather than folding to `nothing`; overrule is `nothing` if a count that must change with who is asking is one gate too many to keep right forever.
  - `identity-claims.after`: kept `strip` as a live third option rather than removing it as solved; overrule removes it if a highlight beyond a plain Guest card is not wanted at all.
  - `identity-claims` background art: chose `EventCard variant="hosted"` plus a local marker over a fully custom card (the brief's other named option), since it reuses the real component's chrome; overrule draws a bespoke card if the "Guest" pill reads too close to the hosted look.
- Look at first: `identity-claims.after` (two Guest cards in Your events under `toast`/`profile`, `strip` kept as the contrasting highlight), then `identity-door.gate` (the redrawn single-benefit line).
