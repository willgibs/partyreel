---
track: recheck-guest-identity
status: handed-off      # open -> handed-off; deleted in the merge commit that integrates it
cut: "c2482757"            # the launch-prep SHA the branch was cut from
board: guest-capture
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/app/(dev)/design/sandbox/guest-capture/
  - src/app/(dev)/design/sandbox/profile-page/
  - src/components/auth/account-door.tsx
  - src/components/auth/account-door.test.tsx
  - src/components/guest/follow-moment-card.tsx
  - src/components/guest/save-account-prompt.tsx
  - src/components/guest/save-account-prompt.test.tsx
reads:                  # single-sources you depend on: never duplicate, never edit
  - src/app/(dev)/design/sandbox/identity-door/spec.ts
  - src/app/(dev)/design/sandbox/identity-claims/spec.ts
  - src/app/(dev)/design/sandbox/identity-profile/spec.ts
  - src/app/(dev)/design/sandbox/reel-front/spec.ts
  - docs/systems/guest-flow.md
  - docs/systems/profiles-social.md
  - content/help/profiles-guest-lists-and-following.mdx
---

# lp/recheck-guest-identity

**Goal.** `guest-capture` and `profile-page` rebuilt on the identity model (the door's optional email, the Unverified mark, opt-in profiles) and the live reel's tile above the capture slot, with everything the three identity boards already ask dropped; plus three shipped lines that promise "on your profile" against the ruling, made true.

## The brief

**Will's words for this work (2026-09-22):** "Once we're complete with the current round and your internal reshaping, we may want to recheck the open boards in Lab to ensure they're all current with our big recent changes to identity and reels."

**The judgment you make on every question a newer ruling reached (Will, 2026-09-22, verbatim):** "when I hit an early board question, I answer based on the immediate context I have in my head of that question, plus what's provided. However, sometimes my selection diverges us from an exploration's idea that's actually better but would become irrelevant due to my selection taking a different path. It's up to your discretion to decide which open questions still offer potential value and deserve to be adapted to current context, and which have been solved optimally already, offering no further value regardless of previous selections (we've already reached pinnacle solution of that question's context) and ready to be removed." An early pick can close the road to the best answer. So, for each reached question: if its options still hold an idea that could beat the current path (even one a ruling diverged from), ADAPT it to the current context: reword it so it asks what is still open, keep the promising road as an option, and say in the option what choosing it would change. If its context is already solved at its best, REMOVE it. An option whose drawing shows the old product is REDRAWN on the current one. The survey below proposes a fix per ask; it is a starting point, and your judgment wins where the options say otherwise. The Handoff says, one line per reached question, whether you adapted, removed or left it, and why. No badges: the overtaken mechanism is retiring.

**Rising Tides, in full (Will, 2026-09-22):** "the library's purpose is more our working rules to keep consistency across what we've built and new builds, but not hard rules that can't be reshaped. Working guidelines, not hard rules ... everything is unprotected, anything may be relitigated for better solutions despite any past decisions." The identity and reel rulings below are the ground each question now stands on, not walls: an option that would beat one of them may stay, stated as the change it would make.

Everything else on a board stays as it is: this is a recheck, not a new round, so the round number stays, no ledger is written, and a question nobody reached is left alone. Keep the decision shape (`defineExploration`: one question per decision, every option drawn). Never ask what a newer board already asks: where an ask overlaps an identity or reel board, drop the overlapping part and name that board in the context. You register nothing: `registry.ts`, `boards.ts` and `touchpoints.ts` are not yours (the Orchestrator moves the desk order at the record).

**What changed under these boards (the current rules; nothing older binds you):**
- IDENTITY. A guest is a row per event at one of three trust levels. (1) A typed name: the public mark reads "Unverified"; the plain disc; no profile page; uploads remembered on the device. (2) A typed name plus an address nobody has proved: stored inert, never shown to the host or other guests, never attributed, never mailed on its own; only the guest's own menu says "Email not confirmed"; publicly the same "Unverified" mark. (3) A confirmed account, the only identity that uploads as itself; a known confirmed address at the door triggers sign-in. The door in names mode asks the name with "Email (optional)" under it ("Come back to this album anytime, with every photo you add."); the name step's lede reads "so the host knows who to thank"; the verified-required gate reads "The host has asked guests to confirm an email for safety. One tap and you're in." The host sees only a badge, never an address. A confirmed address claims its rows per event from a card on the dashboard (Claim all as a shortcut; Finish confirms, and an event left unclaimed has its uploads removed and the address detached). Profiles are a 404 until a handle exists and publish no attended event until its owner turns it on ("nothing until chosen"). Require verified emails is on by default for new events.
- THE REEL. The host-made, published, stored mp4 is gone: no Studio, no Create reel, no publish, no one-reel-per-event, no reel card under the action block, no keepsake hero, no guest download of the host's mp4, no "your reel is ready" mail. The reel is now the event's own live, looping montage of everything the album shows, from its third item, with no host action and no file; a tile at the album's head opens it (`?reel`), a venue screen mode plays it on a wall (`?screen`), and anyone can make their own cut on their device (saved or shared as a file; on a paid event also added to the album as a video). The six reel boards (`reel-view`, `reel-front`, `reel-screen`, `reel-cut`, `reel-host`, `reel-story`) and the three identity boards (`identity-door`, `identity-claims`, `identity-profile`) sit on the desk and are current: read their `spec.ts` for what they ask, and never ask it again.

**Verify** each board at 1440 and 375 with reduced motion honoured; `pnpm lab:smoke`; `pnpm lab:demo --board <board>` for every board you own. In the Handoff list every ask you reshaped, redrew or removed, one line each with its old and new question.

**The stale asks (from the Orchestrator's survey; check each against the files before you change it):**
- `guest-capture` (every ask is reached). `moment` and `shape`: RESHAPE and REDRAW: the names-mode door now asks "Email (optional)" under the name (`identity-door.field`), so this offer is a second ask, to a name-only guest or to one whose unconfirmed address is prefilled; the live reel's tile and its "yours" beat (`reel-front.tile`, `.yours`) sit directly above this slot and are not drawn.
- Drawn copy: "this event on your profile" (`parts.tsx:58`) and "It is on your profile now, and this event came with it" (`parts.tsx:212-213`) break "nothing until chosen": REDRAW.
- `landing`: RESHAPE and drop the `profile` option: "/u/priya ... one event on it already" (`board.tsx:236`) cannot exist (a profile is a 404 until it has a handle); the rest overlaps `identity-claims.pointer`, `identity-claims.after` and `identity-profile.prompt`.
- `name`: RESHAPE: `together` asks for the handle, which `identity-profile.setup` already asks; keep silent versus confirm.
- `follow`: REDRAW: the moment card also carries `identity-claims.pointer`'s `line` and `identity-profile.prompt`'s `follow`; Nina, who is Unverified, is drawn with a seeded face (`parts.tsx:332`).
- `profile-page.quick-look`: RESHAPE: most names at a party are Unverified and have no page; a confirmed account without a handle has none either; a page shows only the events its owner chose. Noor's empty case is `identity-profile.page`'s question (that board sits above this one), so its answer is the ground here.
- `profile-page.view-all`: REDRAW: the fixture is "240 signed-in uploaders" (`fixtures.ts:261-296`) and leaves out the Unverified names listed with the mark.
- The desk: `guest-capture` moves below `identity-profile` at the record (the Orchestrator's; do not edit `touchpoints.ts`).

**The three shipped lines (production copy; make each TRUE, minimal and interim, since `identity-claims.pointer` and `identity-profile.prompt` design this moment itself):** `src/components/auth/account-door.tsx:116` ("Confirm your email and this event stays on your profile, with every photo you added."), `src/components/guest/follow-moment-card.tsx:81-82` ("It is on your profile now, and this event came with it."), `src/components/guest/save-account-prompt.tsx:147` ("this event on your profile, and everything you added to it"). The truth: a confirmed address keeps the event and its photos in the guest's account (their dashboard, where they come back to it); nothing appears on a profile until its owner turns it on. No em-dashes. Keep each line's length and rhythm close; update a test only where it pins behaviour, never to pin the new words. Run the production gate (`pnpm build` included).

**Binds.** The bible and the policies (`/design/library`), the contracts of every component under a path you own, and
CLAUDE.md's working loop. `DESIGN_PREVIEW_KEY` rides the environment, never a command line or a log you print. A record doc
(`docs/STATUS.md`, `docs/ROADMAP.md`, `docs/PROGRAM.md`, `CLAUDE.md`, `docs/ASSETS.md`, `docs/tracks/orchestrator.md`,
`docs/reviews/`) is edited only when your `owns` names it. Stage explicitly; never `--no-verify` or force-push; every commit ends
with the `Co-Authored-By` line naming the model you actually run on.

**Verify on.** The board at 1440 and 375 with reduced motion honoured; `pnpm lab:smoke --base http://localhost:<port>` whole; `pnpm lab:demo --board <board> --base http://localhost:<port>` pressing every step.

## Questions (a recommended answer each; the Orchestrator relays them)

None of these was a one-way door: each is taken on its recommendation, built, and repeated under "Calls his to overrule".

- Reshape `guest-capture.landing` or remove it? Recommended and taken: remove (its `profile` option cannot exist; its `dashboard` road is the destination `identity-claims.pointer` asks how to point at; the album is the ground all three identity boards stand on).
- Which noun makes the three shipped lines true? Recommended and taken: "in your account" for all three, not "on your dashboard": the `save` wear also opens from the Unverified mark and the guest name menu, which claim the uploads but never save the event, so only the account is true on every path.
- Where does the reel's tile sit against the offer? Taken: directly UNDER the post-upload card, at the album's head (the reel plan's C, "its OWN slot directly above `aboveAlbum`", and `event-experience.tsx`'s order: `GuestUpload` in the words column, then the BLEED album); the survey said "above this slot".

## System-doc edits (in place, owned facts only)

- none: no system doc is in `owns`, and `git grep` finds the three retired lines in no doc and no help article.

## Deferred (ROADMAP one-liners, bucket named)

- Now: confirming from the Unverified mark (`unverified-mark.tsx`) or the guest name menu (`guest-name-menu.tsx`) claims the uploads but never saves the event, so it lands in the account (Events you joined) and not on the dashboard, unlike the offer card's door (`SaveEventButton`); save it on those two paths too.
- Now: `content/help/save-an-event-and-find-your-uploads.mdx` lists Uploads and Likes on the dashboard, but they live in the profile's owner mode (`u/[slug]/owner-sections.tsx`, profiles-social.md "The owner mode"); the article and the code disagree.
- Now: a confirmed account with no handle has no page, so the owner mode's uploads, likes and connections are unreachable for it; they need a home that does not require a handle (or `identity-profile.setup` answers it).

## Handoff (replaces the chat report)

- **Commits, pushed:** the work `88deb724`; three sync merges of `origin/launch-prep` as it moved under the lane (`c42811eb` docs-rules, roadmap-lean and the bible's why lines; `d756489f` recheck-mail-admin-export; `4a7f3aee` recheck-help-press), none touching an owned path. The gates below ran on `4a7f3aee`, with `origin/launch-prep` fully merged.
- **Gates on the synced tree, each on its own exit code:** `pnpm design:rules` 0 (no generated diff) · `collect-specimens.mjs` 0 · `pnpm typecheck` 0 · `pnpm lint` 0 (9 warnings, none in a touched file) · `pnpm test` 0 (350 files, 3867 passed, 1 skipped) · `pnpm build` 0 · `pnpm lab:smoke --base http://localhost:3135` 0 (486 checks; reading: guest-capture 317, profile-page 258 of 1200) · `pnpm lab:demo --board guest-capture` 0 (4 steps, every option moves the stage) · `pnpm lab:demo --board profile-page` 0 (3 steps). Both boards also captured at 1440 (a local, uncommitted flip of the SCREEN default, `--save-shots`, reverted) and at 375; `lab:demo` emulates reduced motion, and nothing on either board moves beyond the shipped tiles' own fades.
- **Lane check** (`git diff --name-only origin/launch-prep...HEAD`): the twelve owned board files under `sandbox/guest-capture/` and `sandbox/profile-page/`, the three owned production files (`auth/account-door.tsx`, `guest/follow-moment-card.tsx`, `guest/save-account-prompt.tsx`), this manifest, and ONE exception: `src/app/(dev)/design/sandbox/identity-claims/parts.tsx`, one line (its `MomentCard` quotes the shipped moment line, which this lane changed, so it now reads "It is in your account now"; no open lane owns that board).
- **The three shipped lines, now true** (no test pinned the old words; none was edited): `account-door.tsx` save wear "Confirm your email and this event stays in your account, with every photo you added. Confirming makes a free account." · `follow-moment-card.tsx` "It is in your account now, and this event came with it." (and "All N are in your account now, and this event came with them.") · `save-account-prompt.tsx` "...it stays with you: this event in your account, and everything you added to it." Each carries a WHY-comment stating the rule.
- **guest-capture, one line per reached question** (round 1 kept; `round.changed` says what moved):
  - `moment` ADAPTED: "When should the offer to keep what she added first reach Priya?" to "The door already offered an optional email. When should the second ask, to keep what she added, first reach Priya?"; options kept (the door's ask strengthens `tenth`, said in its means and the overrule); recommendation stays `first`; redrawn with the reel's tile under the card and the heading counting as shipped ("Keep this photo").
  - `shape` ADAPTED: "Should the ask sit in its own card, ride the photo it is about, or become the sheet's last screen?" to "Should the second ask stand in its own card, ride the photograph it is about, or close the door's own sheet?"; `inline` redrawn as a real caption inside her newest tile's column block (it used to draw a thumbnail above the album), `sheet-step`'s means now says it is the same sheet that offered the email a minute earlier; recommendation stays `inline`.
  - `follow` ADAPTED: "Once she confirms, where should Priya actually be offered a follow, and of whom?" to "Once she confirms, where should Priya be offered a follow of Maya, her host: on the moment card, in the Guests list, or on Maya's page?"; redrawn in the page's real order (the Guests list under the whole album: measured 1459px down for `list`, 136px for `card`), the list as shipped (confirmed first, Unverified on the plain disc with the mark, Priya listed without a Follow of herself); recommendation moves `list` to `card`.
  - `landing` REMOVED: "Once everything is confirmed, should Priya still be looking at the album, or somewhere new?" `profile` cannot exist (a 404 until a handle), `dashboard` is `identity-claims.pointer`'s destination, and staying on the album is the ground all three identity boards stand on: nothing left in it could beat that path.
  - `name` ADAPTED: "Should the name Priya typed at the door become her profile silently, or does she get a say?" to "When the name Priya typed becomes her account's name, should she get one look at it first?"; `together` dropped (the handle is `identity-profile.setup`'s); `silent` against `confirm` kept; recommendation moves `together` to `silent` (the ruling's own, editable from Account).
  - The drawn copy REDRAWN everywhere it is quoted ("this event in your account", "It is in your account now").
- **profile-page, one line per reached question** (round 2 kept):
  - `view-all` REDRAWN, question unchanged ("How should the full guest list open from the faces row?"): every option drew the closed faces row (the shipped `GuestList` condenses above twelve), so the chips are quoted and the list is open in all four; the 24 and the 240 now hold the confirmed first and then the Unverified, marked (measured at 240 on a phone: sheet 578px in 149 rows, page 5292px, centred 650px, inline 503px in 12 rows).
  - `quick-look` ADAPTED: "What should a name in the guest list open first?" to "What should tapping a name in the guest list open first, when most names have no page behind them?"; its own knob `tapped` (Nina, Unverified; Jay, confirmed without a handle; Priya, a page) replaces `who`; the look shows what a guest added to this album for every name, and a page's chosen events and Open full profile only where a page exists; `none` is "as shipped" (a pageless name opens nothing); recommendation stays `sheet`.
  - `way-back` ADAPTED (lightly; the survey did not list it): question and options unchanged; its because and overrule assumed "most people at a party are signed out", which Require verified emails on by default reverses, so both now say it per mode; Noor (an empty page, `identity-profile.page`'s question) left the `who` knob.
  - The profile page itself REDRAWN as it ships wherever it is drawn (the bio under the row, not in it; one Events grid with Host and Guest markers; the seeded `xl` avatar), since `quick-look.none` and all of `way-back` stand on it.
- **For other homes (the Orchestrator's):** `touchpoints.ts`'s `guest-capture` note and variants still name "The landing" ("where she lands afterward"); `social/guest-list.tsx`'s comment says "the retired profile-page sandbox board still feeds this component its own fixtures", but the board is standing and no longer imports it; the desk move (`guest-capture` below `identity-profile`) is yours at the record.
- **Assets requested from Will:** none.
- **Proposed migrations / Worker / Vercel / Stripe / env changes:** none.
- **Calls his to overrule:**
  - `guest-capture.landing` removed rather than reshaped to album against dashboard.
  - `guest-capture.follow` now recommends `card` (the honest distance of the list, 1459px, and a names-mode list mostly without a Follow).
  - `guest-capture.name` recommends `silent`, the ruling's own, over `confirm`.
  - `profile-page.quick-look`'s look carries "N photos in this album" for every name, a new road for the names with no page.
  - "In your account" as the one noun in all three shipped lines, "on your dashboard" never (see Questions).
  - The reel's tile drawn under the offer card, at the album's head, wearing `reel-front`'s recommendations (`tile=live` resting on one still, `yours=badge`).
  - `way-back` adapted though the survey left it alone; Noor out of the cast.
  - The one-line exception in `identity-claims/parts.tsx`.
- **Look at first:** `guest-capture.follow` at 375, `list` against `card` (the caption reads the distance); then `profile-page.quick-look` with the `tapped` knob on Nina, then on Priya.
