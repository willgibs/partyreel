---
track: account-moments-wiring-2
status: open            # open -> handed-off; deleted in the merge commit that integrates it
cut: "c04da309"            # the launch-prep SHA the branch was cut from
board: none
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/components/social/follow-button.tsx
  - src/components/social/follow-button.test.tsx
  - src/components/social/relation-toggle.tsx
  - src/components/social/relation-toggle.test.tsx
  - src/app/(app)/account/page-connections.tsx
  - src/app/(app)/account/page-connections.test.tsx
  - src/app/(app)/me/
  - src/components/app/dashboard/page-invite-card.tsx
  - src/components/app/dashboard/page-invite-card.test.tsx
  - src/app/(guest)/u/[slug]/
  - supabase/migrations/20261008040000_first_follow.sql
  # New files beside the owned ones (a lane may add its own siblings before editing: crumbs-17's rule); nothing is
  # shared with a live lane, and no live lane claims any of them.
  - src/components/social/private-line.tsx
  - src/components/social/first-follow-line.tsx
  - src/components/social/first-follow-line.css
  - src/components/social/first-follow-line.test.tsx
  - src/lib/db/queries/first-follow.ts
  - src/lib/db/queries/first-follow.test.ts
  - src/lib/db/queries/invite-light.ts
  - src/lib/db/queries/invite-light.test.ts
  - src/components/app/dashboard/page-invite-light.ts
  - src/components/app/dashboard/page-invite-light.test.ts
  - src/components/app/dashboard/page-invite-read.ts
  - src/components/app/dashboard/page-invite-read.test.tsx
  - src/components/app/dashboard/page-invite-card.css
reads:                  # single-sources you depend on: never duplicate, never edit
  - docs/reviews/account-moments.json
  - src/app/(dev)/design/sandbox/account-moments/spec.ts
  - docs/systems/profiles-social.md
  - docs/PRD.md
---

# lp/account-moments-wiring-2

**Goal.** Following and her page's invitation as Will picked at account-moments r2: a first follow that says once that only she sees it, and the invitation on her page as one compact lit plate.

## The brief

**The round's direction (Will, standing; PRD.md's "Will's product principles" hold each with its reason):** never dev-tool-ish; a host of 1 to about 10 events first, scaling to hundreds; delight where it costs nothing in clarity, and attention earned (the one thing that needs her may draw the eye, beautiful and inviting, while nothing yells or crowds a screen); nothing depends on a timeline; immediate, or a clear state and a way out (a failure says what happened, that nothing was lost, and the one easy way to put it right); Partyreel runs with no AI managing it (every operator fix ships its `/admin` control, zero silent failures); cost is designed like the architecture. Production is the working version: a pick is the best of what was drawn, never a rule.

**Local only:** nothing of yours requests the Vercel alias, partyreel.com or any *.vercel.app (Vercel's Hobby CPU sits at 97% of its 30-day window), and nothing deploys. Port 3135 is yours; 3000 is Will's desk, 3130 the Orchestrator's gate. A signed-in walk runs on your own port in a headless Chrome of your own: `usher/kit/redteam/` (its `signin.mjs` mints a test host's session on a localhost base, willg97@gmail.com or hi@willgibs.com, never the operator; `docs/systems/testing-verification.md`), never Will's browser pane or his Chrome. Test data is disposable and named so ("<track> (disposable)"), deleted or listed for deletion in the Handoff.

**From Will's batch (2026-10-07; `docs/reviews/account-moments.json` round 2):**
- **`follow=once`:** her first follow ever shows the private line (a lock and a few muted words, as her own page says "Only you can see this page.") under the button; every follow after is the button alone, so the thousandth is quiet; Connections keeps the line for whenever she looks. "Once" is read on the server from her list being empty before the press (the carried `once-memory`: no new column, every device alike; her first, not her first three: `once-few`). Draw the line inside `FollowButton` or `RelationToggle`, so every place she follows from (her page, a guest's card, the follow moment, claims) gets it without editing those files. The follow action is `src/app/(guest)/u/[slug]/actions.ts`; only if an RPC must answer "was it empty", the migration is `supabase/migrations/20261008040000_first_follow.sql`, through the Orchestrator.
- **`invite=plate`:** a compact dark plate under her head on `/me`, and on the dashboard's same card (`page-invite-card.tsx`, mounted on the home): the room's own black (brand-marks-wiring makes `.surface-ink` that this wave; use the class, never a hex), its top edge lit in her own photographs' colours, holding the words and the way to the setup. His note is the design: "my eye goes straight to cta heading/button beside each other to easily digest info at a glance (this is good global philosophy - spreading out copy makes it feel hard to quickly digest, but having copy groups feel a bit more grouped/compact and breathing room allow it draws much better focus/hierarchy/user eye flows)". His other idea, the page below the plate as a teaser of what going public unlocks, is a later redesign of her page: leave the content below as it is.

**The consent model is never drawn away:** a page is public only by her choice, and claiming a handle is the consent act (profiles-social.md); the plate leads to the setup, which claims the handle last, at Finish.

**ROADMAP line you close:** "Connections chips (`/me`, `/u/<handle>`) could open the look" (opening `GuestPeek`, whose props stay as guests-room-wiring keeps them).

**The board stays:** `src/app/(dev)/design/sandbox/account-moments/` carries its ledger until her page's redesign; delete nothing there.

**Lanes running beside you (never edit their paths; a line you need there is an exception in your Handoff, with why):** brand-marks-wiring (`globals.css`, `theme.css`, the marks, `badge.tsx`), create-wizard-wiring-2 (Create, readiness, the checklist, `settings-rows.tsx`, the hub's `page.tsx`, the guest header and name menu), no-signal-wiring (the upload queue, `components/guest/upload/`, the roll's counting files), guests-room-wiring (`dashboard/[eventId]/guests/`, `guest-peek.tsx`), account-moments-wiring-2 (FollowButton, RelationToggle, Connections, `/me`, `u/[slug]/`), crumbs-91 (the album's order, the guest page, `event-experience.tsx`, `as-guest*`, Immediate's lines), and the boards event-page-r1 and brand-marks-r2 (their folders).

**Wiring rigor:** the whole gate (CLAUDE.md), each step on its own exit code, through `scripts/build-lock.sh`. Verify what your change adds antagonistically (its error cases, malformed input, and the cross-tenant and abuse paths of anything that reaches data), walking your own new paths once at 375 and 1440 and reading the page's text and state before a screenshot; the wide walk across surfaces, themes and assistive settings is the milestone red-team's. WHY-comments where a choice is not obvious; a test reshaped on purpose keeps its real scar and says which reason expired. A Handoff states what the Orchestrator needs to integrate and record, never an essay.

**Starts from.** CLAUDE.md's working loop, the bible's ten and production as it is; the tests say what has to keep
working.

**Verify on.** The gate on the synced tree (CLAUDE.md's four steps), each step on its own exit code; `pnpm lab:smoke --base http://localhost:<port>` when the lane changes anything under `src/` but tests (it crawls what the change reaches: the Library, and every board whose drawings import a changed file); and the surfaces the Handoff is judged on, local and live.

## Questions (a recommended answer each; the Orchestrator relays them)

Each is built as its recommended answer and is Will's to overrule.

1. **The press line where no name is known** (the guest list's Follow, the moment card's, claims'). With a name: "Only you see who you follow. Maya just sees one more follower." (the board's words; the name's first word). Without one: "Only you see who you follow. They just see one more follower." Connections keeps "…Each of them just sees one more follower." *Overrule:* one name-free sentence everywhere.
2. **Where the line stands.** Her page: under the head exactly as drawn (flush left in a hand, flush right under the button at a desk). Every other seat: under the button in its own row, the row wrapping to hold it while it stands (one `:has()` rule in the line's sheet, so no host file is edited). Never a toast or a bubble (a bubble is the board's `mark`). *Overrule:* a floating note at tight rows.
3. **"Once" needs no migration.** `followProfileAction` asks, before the write, whether her list is empty (one `limit 1` read of her own follows under owner RLS: `lib/db/queries/first-follow.ts`); nothing is stored, no RPC changes, so `20261008040000_first_follow.sql` is not written and nothing waits on the Orchestrator. A read that fails says nothing and never fails the follow; two first follows at one instant on two devices may both say it. *Overrule:* `follow_user` answering it (one round trip, atomic; a migration and `types.ts` regenerated).
4. **Unfollow her only follow, then follow again, says it again** (her list is empty before the press: `once-memory`, as carried). *Overrule:* a stored flag.
5. **The plate reads her photographs through a Server Function on mount** (`(app)/me/actions.ts`: her newest six previews, presigned), so `PageInviteCard`'s props and both mount sites stay as they are (the dashboard's page is create-wizard-wiring-2's). A view costs one action and six preview GETs of about 16KB (R2 Class B; no database beyond the one RPC read). She gets the plate lit by her photographs, else her seed, else the house ember. *Overrule:* props from each page's server render (one line in the dashboard) to save the action.
6. **The plate's words**, as drawn: "Your page, when you're ready" / "Nothing is public until you finish." / "Choose what shows"; the dashboard's Not now is a ghost key after it. *Overrule:* the old card's words.
7. **Connections chips open the look** (the ROADMAP line): a chip is a button opening `GuestPeek` (her face, name, `@handle`, Open full profile); a chip with no page opens it too (face and name alone; it used to be a dead span).
8. **`.surface-ink` is still the slab's graphite in this tree** (brand-marks-wiring deepens it this wave). The plate wears the class and reads the room's own card in the dark theme from a wrapper token, so it needs no edit when the class deepens; until then the paper plate reads a step lighter than the board's.

## System-doc edits (in place, owned facts only)

- `docs/systems/profiles-social.md`: the `/me` bullet (the invitation is the lit plate, standing, light read on her device), the follow bullet (a first follow says it once, read by the Server Function before the write), Connections (the standing line; the chips open the look).

## Deferred (ROADMAP one-liners, each naming its bucket and area)

- none yet

## Handoff (replaces the chat report)

- The work commit and the sync commit, pushed (or: launch-prep had not moved); the head is in the chat line
- Every claim names its artifact (a commit, a log line, a path), so the Orchestrator checks rather than believes.
- Gates on the synced tree, each on its own exit code, and the sha they ran on
- Lane check: `git diff --name-only origin/launch-prep...HEAD` = owned paths + this file (exceptions and why)
- The items, one line each
- Assets requested from Will: none, or one per line: `what · spec (size, grade, count, format) · replaces <stand-in id>`
- Board ideas: an improvement you saw beyond your lane, one line each (the Orchestrator may open a board for it)
- Proposed migrations / Worker / Vercel / Stripe / env changes: none
- Calls for Will: only a decision built in that he cannot see by using the product (plans, billing and renewals; lifecycle and timing; deletion, retention and privacy; safety and moderation; what the product does on its own), one line each, or none. A design, wording or flow choice is never one: production and the lab show it
- Look at first: ...
