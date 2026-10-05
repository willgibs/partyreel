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

## Where I am (parked for the laptop restart; delete this section at the handoff)

**Done, in the WIP commit** (`vitest run src/lib/content src/lib/content-policy.test.ts src/components/marketing`: 72 files, 700 tests green before it; typecheck and lint logs in `../partyreel-wt/_scratch/help-words/`):
- Audience: `defaultAudience` is exported and says both for account-and-profile and highlight-reel; `help.test.ts` holds that a shelf's default is what most of its articles are and that an article never restates it, plus the tag's meaning. The pass: eight redundant `audience: both` removed; `host` on notifications-and-emails and play-the-reel-on-a-screen (the owner's control); `both` on what-guests-can-and-cant-see and what-you-can-upload; reporting-and-safety is host (its playbook is the host's, the guest's is its own article).
- End dates (fix 1): help create-your-first-event, how-long-media-is-kept, pro-vs-event-pass, turn-off-uploads-or-cap-file-size, what-the-free-plan-includes, event-settings-explained; blog event-album-no-expiry-date, family-reunion, group-trip; both `AUTHORING.md` guides (rule 7, the lifecycle line).
- Taking photos home (fix 2): help download-photos-videos-and-albums (rewritten: Select, then Save to Photos or Files; the host's Download opens Take it home, Originals and Phone size), browse-the-album, share-the-album-after-the-event, how-long-media-is-kept, your-data-and-deleting-your-account, how-partyreel-works; the seven blog posts (birthday, conference, disposable-cameras, office-holiday, qr-code-for-wedding, scanned-a-qr-code, wedding-day-timeline) and the trip post; blog `AUTHORING.md`'s product paragraph.
- The reel's place (fix 3): highlight-reel-renders-on-your-phone, scanned-a-qr-code-where-your-photos-go (the cover's round play button).
- The demo article (fix 4): `content/help/try-the-live-demo.mdx`, getting-started, order 1 (the five after it shifted by one, the map in `help/AUTHORING.md` follows), audience host by the shelf's default (its reader is a would-be host standing where a guest stands), linked from how-partyreel-works' Start small callout.
- Retired controls (fix 6): the profile article says Following, the two Download album walks are gone, and `NOT_SHIPPED` in `help-ui-labels.test.ts` is empty.
- One addition beyond the list: the blog quoted `<UiLabel>Require verified emails</UiLabel>` (nine posts, one FAQ answer, the blog guide), a switch the product renamed "An email first"; the blog's labels are scanned by no test, so it went unseen.

**Remaining, in order:**
1. `features/sharing/downloads-section.tsx` and `sharing-faq.ts` (read, not yet edited): both still say "Download all", the type filters and "Download selected". Say Select, then Save (guests) and Download, then Originals or Phone size (hosts); the section's two trigger chips become "Download" (in your gallery) and "Select" (in the guest album). Leave `zip-modal-demo.tsx` (not mine; `mock-parity.test.ts` pins its quotes).
2. `src/app/(guest)/e/[token]/not-found.screen.tsx`: its comment says "there is no end date in this product"; correct the fact, words unchanged.
3. `docs/systems/marketing-content.md`, in place: the "stays up" ★ (no line says an event "has no end date"), the audience default in the content-pipeline bullet, the demo article's coupling to the demo's guest side.
4. Check `your-event-page-explained`'s reel card faces against `reel-card.tsx` (ROADMAP line 87 says the card now also says "Guests get it later").
5. The whole gate on the synced tree (typecheck, lint, test, the locked build), `pnpm dev -p 3137`, `pnpm lab:smoke --base http://localhost:3137`, and a look at /help/try-the-live-demo, /help/download-photos-videos-and-albums and the audience badge ("For hosts" on notifications-and-emails) in a Browser tab of my own.
6. Fill Questions, System-doc edits, Deferred and the Handoff below, set `status: handed-off`, push, say "handed off at <sha>". Sync (`git merge origin/launch-prep`) only if code touching my work landed.

**To carry to the handoff.** Question: `loop-keep`'s picture is `KeepPicture` (`how-it-works/host-pictures.tsx`, drawn by `desk-screens.tsx`, shared with /how-it-works), not `registry.ts`, which holds only its alt text: correcting the string alone would make the picture and its words disagree, and redrawing it is design in files I do not own; recommended and built: leave both, and redraw it with the two mocks ROADMAP names (`take-home-section.tsx`, `zip-modal-demo.tsx`), then change the alt text with it. Board ideas: marketing still says "no end date" in `faq-data.ts:47` (claim-fenced), `features/album/album-copy.ts:156`, `album-faq.ts:48`, `how-much-fits.tsx:132` and `pricing/comparison-table.tsx:148`, and `constants/tiers.ts`'s header says "NO event end date"; `blog-keep-lines.test.ts`'s header says it too. Found, not fixed: `sign-in-options-and-passwords` says the account email "can't be changed from there yet" while `display-name-and-profile-photo` walks a Change beside it; verify at /account and fix the stale one.

**Dev server:** none started, port 3137 is free, no headless Chrome and no Browser tab of mine open.

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
