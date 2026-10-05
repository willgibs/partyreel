---
track: help-words
status: open            # open -> handed-off; deleted in the merge commit that integrates it
cut: "46682654"            # the launch-prep SHA the branch was cut from
board: none
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - content/help/
  - content/blog/
  - src/components/marketing/sections/features/sharing/downloads-section.tsx
  - src/components/marketing/sections/features/sharing/sharing-faq.ts
  - src/lib/content/help.ts
  - src/lib/content/help.test.ts
  - src/app/(guest)/e/[token]/not-found.screen.tsx
  - docs/systems/marketing-content.md
  - src/lib/content/help-ui-labels.test.ts
  - src/components/marketing/help/step-screens/registry.ts
reads:                  # single-sources you depend on: never duplicate, never edit
  - src/lib/content/help-links.ts
  - src/lib/constants/marketing-voice.ts
---

# lp/help-words

**Goal.** The help center, the blog and two marketing sections say what the product does today: an end date only says when and never ends anything; a guest takes photos home by Select, then Save to Photos or Files, never a Download all; the reel opens from the cover's play button, never "at the top of the album"; a help article for the live demo; each help article's audience set on purpose; three articles that quote retired controls corrected.

## The brief

**The round's direction (Will, standing since round 13, carried by every lane):** never dev-tool-ish (the viewfinder's corners survive only as a focus mark, never a style, and so does nothing of their loading state); a host of 1 to about 10 events first, scaling to hundreds; "all work no play is a boring consumer product": delight where it costs nothing in clarity; nothing depends on a timeline (undated, morning-only and multi-day events all read well); "everything should feel as immediate/responsive/snappy, and anything taking longer should provide clear state feedback and potential interruptibility"; Partyreel runs with no AI managing it (every operator fix ships its `/admin` control); cost is designed like the architecture (every image and video action multiplies at scale). Production is the working version: a pick is the best of what was drawn, never a rule.

**★ Local only:** nothing of yours requests the Vercel alias, partyreel.com or any *.vercel.app (Vercel's Hobby CPU is at its limit). Port 3136 is yours; 3000 is Will's desk and red-team 54's, never touched; 3130 is the Orchestrator's gate.

**Why this lane:** a help article that walks a button the product no longer has is a support ticket waiting to happen. Facts only: the words follow the voice (`src/lib/constants/marketing-voice.ts`, both `AUTHORING.md` guides) and change only where the product changed; no page is redesigned (the marketing pages' look is the brand boards' to come).

**The fixes:**
1. **End dates.** The help center and blog say "Events have no end date" (`create-your-first-event.mdx`, `how-long-media-is-kept.mdx`, `pro-vs-event-pass.mdx`, `turn-off-uploads-or-cap-file-size.mdx`, `what-the-free-plan-includes.mdx`, `event-album-no-expiry-date.mdx`, `family-reunion-photo-sharing.mdx`, both `AUTHORING.md` guides; `git grep -i 'end date' content` for the rest) where Settings offers "Add an end date". Say an end date only says when and never ends anything (the anti-abuse core: an event never expires; deletion is the only exit). `src/app/(guest)/e/[token]/not-found.screen.tsx`'s comment says the same old fact: correct it, its words unchanged.
2. **Taking photos home.** Four help articles (`browse-the-album`, `download-photos-videos-and-albums`, `share-the-album-after-the-event`, `how-long-media-is-kept`), marketing's `downloads-section.tsx` and `sharing-faq.ts`, and seven blog posts still walk the guest's Download all; say Select, then Save to Photos or Files (what the product draws today: read the guest's take-home in `src/components/guest/` before writing).
3. **The reel's place.** Two blog posts (`highlight-reel-renders-on-your-phone.mdx`, `scanned-a-qr-code-where-your-photos-go.mdx`) place the reel "at the top of the album": the cover's play button opens it.
4. **The live demo** has no help article: write one, its slug and audience chosen deliberately (`content/help/`, following `AUTHORING.md`), linked where the help center's index lists its kind.
5. **Audiences.** `defaultAudience` (`src/lib/content/help.ts`) defaults account-and-profile and highlight-reel to host while most of their articles override it to both: a per-article audience pass, each article's audience the people it actually helps.

6. **Three articles quote controls the product no longer has** (crumbs-77's stricter label scan found them): `download-photos-videos-and-albums` and `your-data-and-deleting-your-account` walk a Download album menu that left with take-home r1, and `your-public-profile-following-and-blocking` taps Unfollow where the Connections card's row says Following; the help center's `loop-keep` step screen (`src/components/marketing/help/step-screens/registry.ts`) draws the same menu. Correct them, then delete their `NOT_SHIPPED` entries in `src/lib/content/help-ui-labels.test.ts`, so the test holds them from now on.

Tests: the content tests (`help-ui-labels.test.ts` and its siblings) green; any label a help article quotes exists in the product. Wiring rigor: the whole gate, and `lab:smoke` (the help pages render).

**Starts from.** CLAUDE.md's working loop, the bible's ten and production as it is; the tests say what has to keep
working.

**Verify on.** The gate on the synced tree (CLAUDE.md's four steps), each step on its own exit code; `pnpm lab:smoke --base http://localhost:<port>` when the lane changes anything under `src/` but tests (it crawls what the change reaches: the Library, and every board whose drawings import a changed file); and the surfaces the Handoff is judged on, local and live.

## Questions (a recommended answer each; the Orchestrator relays them)

- none yet

## System-doc edits (in place, owned facts only)

- none yet

## Deferred (ROADMAP one-liners, bucket named)

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
- Calls his to overrule, one line each
- Look at first: ...
