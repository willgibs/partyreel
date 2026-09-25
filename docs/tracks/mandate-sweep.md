---
track: mandate-sweep
status: handed-off            # open -> handed-off; deleted in the merge commit that integrates it
cut: "9026d619"            # the launch-prep SHA the branch was cut from (corrected from ce9c13df: that was launch-prep's head when this manifest was first written, but origin/launch-prep had moved to 9026d619 by the time this agent actually booted `git worktree add` from it)
board: none
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - content/help/bulk-select-and-batch-actions.mdx
  - scripts/new-board.mjs
  - src/app/(app)/account/layout.tsx
  - src/app/(app)/dashboard/[eventId]/actions.ts
  - src/app/(app)/dashboard/[eventId]/reel/page.tsx
  - src/app/(app)/name-gate.test.ts
  - src/app/(app)/name-gate.ts
  - src/app/(dev)/design/(shell)/_shell/callout.tsx
  - src/app/(dev)/design/(shell)/_shell/tag.tsx
  - src/app/(dev)/design/(shell)/lab/_desk/review-session.tsx
  - src/app/(dev)/design/(shell)/lab/_desk/review-store.test.tsx
  - src/app/(dev)/design/(shell)/lab/_desk/review-store.ts
  - src/app/(dev)/design/(shell)/lab/_desk/sample-spec.ts
  - src/app/(dev)/design/(shell)/lab/_desk/session-step.ts
  - src/app/(dev)/design/(shell)/lab/tools/reel-video/video-lab.tsx
  - src/app/(dev)/design/(shell)/library/components/gallery-demos.tsx
  - src/app/(dev)/design/(shell)/library/foundations/bright-edge.tsx
  - src/app/(dev)/design/(shell)/library/foundations/elevation-legend.tsx
  - src/app/(dev)/design/(shell)/library/foundations/radius-ladder.tsx
  - src/app/(dev)/design/(shell)/library/foundations/type-ladder.tsx
  - src/app/(dev)/design/touchpoints.ts
  - src/app/(marketing)/(cinema)/blog/blog-list.tsx
  - src/app/(marketing)/(cinema)/blog/page.tsx
  - src/app/(marketing)/(cinema)/careers/[slug]/page.tsx
  - src/app/(marketing)/(cinema)/events/[slug]/page.tsx
  - src/app/(marketing)/(cinema)/press/page.tsx
  - src/app/(marketing)/(cinema)/pricing/page.tsx
  - src/app/(marketing)/(paper)/contact/contact-form.tsx
  - src/app/(marketing)/marketing.css
  - src/app/admin/applicants/page.tsx
  - src/app/admin/support/page.tsx
  - src/app/api/stripe/checkout/route.ts
  - src/app/demo/route.ts
  - src/app/globals.css
  - src/app/not-found.tsx
  - src/app/theme.css
  - src/components/admin/inbox-pane.test.tsx
  - src/components/app/account-avatar-form.tsx
  - src/components/app/avatar-cropper.tsx
  - src/components/app/dashboard/claims-card.tsx
  - src/components/app/dashboard/events-empty-teaser.tsx
  - src/components/app/pricing/gated-sites.test.ts
  - src/components/app/qr-designer-dialog.tsx
  - src/components/app/share/event-share-provider.tsx
  - src/components/app/share/event-sheets.tsx
  - src/components/app/user-menu.tsx
  - src/components/app/welcome-flow.css
  - src/components/app/welcome-flow.tsx
  - src/components/auth/password-sign-in.tsx
  - src/components/dev/motion-tuner-config.ts
  - src/components/lab/board-spec.ts
  - src/components/lab/catalog.test.tsx
  - src/components/lab/catalog.tsx
  - src/components/lab/exploration.ts
  - src/components/lab/item-verdict.tsx
  - src/components/lab/step.tsx
  - src/components/marketing/chrome/header-shell-contract.test.tsx
  - src/components/marketing/chrome/mobile-menu.tsx
  - src/components/marketing/chrome/nav-indicator.tsx
  - src/components/marketing/chrome/session-hint-contract.test.tsx
  - src/components/marketing/chrome/session-hint.tsx
  - src/components/marketing/legal/legal-document.tsx
  - src/components/marketing/marketing-not-found.tsx
  - src/components/marketing/mdx/spec-shared.tsx
  - src/components/marketing/press/press-sheet.tsx
  - src/components/marketing/sections/events/event-artifacts.tsx
  - src/components/marketing/sections/events/event-door.tsx
  - src/components/marketing/sections/events/event-object-contract.test.ts
  - src/components/marketing/sections/events/event-object.tsx
  - src/components/marketing/sections/events/event-statement.tsx
  - src/components/marketing/sections/events/event-turn.tsx
  - src/components/marketing/sections/events/event-type-card.tsx
  - src/components/marketing/sections/features/album/arrivals-hero.tsx
  - src/components/marketing/sections/features/album/live-album-stage.tsx
  - src/components/marketing/sections/features/album/live-album.css
  - src/components/marketing/sections/home/cinema-hero.css
  - src/components/marketing/sections/home/cinema-hero.tsx
  - src/components/marketing/sections/home/film-strip.tsx
  - src/components/marketing/sections/home/hero-stream.test.ts
  - src/components/marketing/sections/home/hero-stream.ts
  - src/components/marketing/sections/home/reel-screen-lamp.tsx
  - src/components/marketing/sections/home/section-ids.ts
  - src/components/marketing/sections/how-it-works/spine.tsx
  - src/components/marketing/sections/pricing/configurator-contract.test.tsx
  - src/components/marketing/sections/pricing/plan-cards-contract.test.tsx
  - src/components/marketing/sections/pricing/plan-cards.tsx
  - src/components/marketing/sections/shared/bulk-select-mock.tsx
  - src/components/marketing/sections/shared/confetti-burst.tsx
  - src/components/marketing/sections/shared/how-it-works-stepper.test.tsx
  - src/components/marketing/sections/shared/how-it-works-stepper.tsx
  - src/components/marketing/system/morph-delegate.tsx
  - src/components/marketing/system/page-hero.tsx
  - src/components/marketing/system/screen-lamp.tsx
  - src/components/reel/publish-light.tsx
  - src/components/reel/reel-builder.tsx
  - src/components/reel/reel-marquee.tsx
  - src/components/reel/reel-reveal.tsx
  - src/components/reel/reel-share-card.tsx
  - src/components/reel/studio-moments-picker.tsx
  - src/components/reel/use-reel-config.ts
  - src/components/shared/album-stream/album-stream.css
  - src/components/shared/album-stream/album-stream.test.tsx
  - src/components/shared/album-stream/album-stream.tsx
  - src/components/shared/album-stream/stream-engine.test.ts
  - src/components/shared/album-stream/stream-engine.ts
  - src/components/shared/backdrop/backdrop-engine.test.ts
  - src/components/shared/backdrop/backdrop-engine.ts
  - src/components/shared/backdrop/photo-section.css
  - src/components/shared/backdrop/photo-section.test.tsx
  - src/components/shared/backdrop/photo-section.tsx
  - src/components/shared/backdrop/room-frames.ts
  - src/components/shared/failure-grammar.test.tsx
  - src/components/shared/legal-consent-line.tsx
  - src/components/shared/media-lightbox.css
  - src/components/shared/media-lightbox.test.tsx
  - src/components/shared/media-lightbox.tsx
  - src/components/shared/not-found-screen.tsx
  - src/components/shared/river/river.tsx
  - src/components/shared/trail/trail-engine.ts
  - src/components/shared/trail/trail-frames.ts
  - src/components/shared/trail/trail.css
  - src/components/shared/trail/trail.tsx
  - src/components/shared/view-menu.test.tsx
  - src/components/ui/command-palette.tsx
  - src/components/ui/dialog.tsx
  - src/components/ui/floating-layer.ts
  - src/components/ui/popover.tsx
  - src/lib/admin/queue.ts
  - src/lib/billing/passes.ts
  - src/lib/billing/storage-guard.test.ts
  - src/lib/constants/about.ts
  - src/lib/constants/careers.ts
  - src/lib/constants/feature-pages.ts
  - src/lib/constants/how-it-works.ts
  - src/lib/constants/legal-terms.tsx
  - src/lib/constants/marketing-nav.ts
  - src/lib/constants/marketing-voice.ts
  - src/lib/constants/press.ts
  - src/lib/constants/qr-presets.ts
  - src/lib/constants/tiers.ts
  - src/lib/content-policy.test.ts
  - src/lib/content/blog.test.ts
  - src/lib/content/help.ts
  - src/lib/dashboard/arrivals.ts
  - src/lib/db/queries/guest-addresses.ts
  - src/lib/db/queries/reel.ts
  - src/lib/db/queries/social.guest-identity.test.ts
  - src/lib/events/upload-lock.ts
  - src/lib/events/visibility-labels.ts
  - src/lib/forensics/preserve.ts
  - src/lib/forensics/request-facts.ts
  - src/lib/lifecycle/account-deletion.ts
  - src/lib/media/share-save.ts
  - src/lib/media/uploader-identity.test.ts
  - src/lib/media/uploader-identity.ts
  - src/lib/r2/keys.test.ts
  - src/lib/reel/build-reel-props.ts
  - src/lib/reel/engine/video/ladder.test.ts
  - src/lib/reel/engine/video/ladder.ts
  - src/lib/reel/engine/video/window-reader.ts
  - src/lib/reel/guest-download-plan.test.ts
  - src/lib/reel/guest-download-plan.ts
  - src/lib/reel/guest-reel-contract.test.ts
  - src/lib/reel/guest-reel-payload.ts
  - src/lib/reel/guest-reel.ts
  - src/lib/reel/quick-add.ts
  - src/lib/shared/arrival.ts
  - src/lib/shared/use-scroll-direction.test.ts
  - src/lib/shared/use-scroll-direction.ts
  - src/lib/stripe/change-plan.ts
  - src/lib/stripe/entitlement.test.ts
  - src/lib/stripe/entitlement.ts
reads:                  # single-sources you depend on: never duplicate, never edit
  - CLAUDE.md
---

# lp/mandate-sweep

**Goal.** Every comment and line of lab text outside the boards states its reason as guidance, never as a pick, a ruling or a law.

## The brief

**The sweep.** Design and past decisions are guidance with their reason, never a law, and nothing is treated as finished; the rule's home is CLAUDE.md "Keeping the docs healthy". The files you own still frame a choice as authority: "Will ruled", "his pick", "law", "binds", "worn here rather than re-judged", "interim law", "precedent", "(bible N)", "ruling 2", dated provenance. Rewrite each line so it keeps its reason (what it protects, why the code is the way it is) and drops the authority; delete a line that is only authority. Keep firm words where something actually breaks (security, data, a real technical constraint), each with its reason.

**Pointers to repair.** The two docs lanes listed code comments that point at sections or numbered rulings their docs no longer have; the list, with the new home of each fact, is in the scratch file `sweep-pointers.md` (its path is beside your scratch directory). Point each comment at the fact's current home, or drop the pointer and keep the reason.

**Behavior does not change.** Comments and descriptive strings only: no test's assertion changes, and the gate stays green. A test whose name or message frames a pick as law is renamed to say what it checks.

**Hand off with:** the count of framing lines before and after, three examples of a rewrite, and any line you left framed with its reason.

**Starts from.** CLAUDE.md's working loop, the bible's ten and production as it is; the tests say what has to keep
working.

**Verify on.** `pnpm test` green with no assertion changed; `git grep` for the framing words returns only lines that keep a real reason; the Handoff's count before and after.

## Questions (a recommended answer each; the Orchestrator relays them)

- none yet

## System-doc edits (in place, owned facts only)

- none yet

## Deferred (ROADMAP one-liners, bucket named)

- Design library: `src/app/(dev)/design/touchpoints.ts` types each entry `Ruling` (`export type Ruling`, `RULINGS`, `getRuling()`); `src/lib/constants/marketing-voice.ts` has a real `SITE_THESIS_STATUS`/`HeaderStatus` status of `"ruled" | "provisional"`. Both are code (renaming is a behavior change, out of a comment sweep's scope), but both are the same authority-as-name pattern this lane rewrote everywhere else; a future round could rename to e.g. `Rationale`/`getRationale()` and `"final" | "draft"`.

## Handoff (replaces the chat report)

- Work commit: `30fd086f` — "mandate-sweep: comments and lab text outside the boards state their reason, never a pick, a ruling or a law" (148 files). Pushed to `origin/lp/mandate-sweep`. This manifest commit follows it alone, per the boot doc. No sync commit: `origin/launch-prep` moved (to `b2d22c72`, the refresh wave landing) since this lane's cut, but this lane's `reads` (`CLAUDE.md`) is byte-identical there, and the one owned file the upstream commits also touched (`touchpoints.ts`) changed disjoint line ranges (upstream: 149-176, 333-357; this lane: 209) — confirmed with `git diff 9026d619 origin/launch-prep -- touchpoints.ts` and `git diff HEAD -- touchpoints.ts`, no overlap. Flagged below for the Orchestrator to re-check.
- Gates, all on `30fd086f` (the synced tree — no sync needed, see above): `pnpm typecheck` exit 0 (route types generated, `tsc --noEmit` clean); `pnpm lint` exit 0 (0 errors; 7 pre-existing warnings in files outside this lane's owns, confirmed identical with the work stashed); `pnpm test` exit 0 (427 files, 4580 tests, 0 failed, 0 assertions changed); `zsh scripts/build-lock.sh pnpm build` exit 0 ("Compiled successfully", 257 pages generated); `pnpm lab:smoke --base http://localhost:3133` exit 0 ("314 checks, 0 failing").
- Lane check: `git diff --name-only origin/launch-prep...HEAD` = exactly the 148 owned paths the work commit touched (verified: `comm -23` against the manifest's `owns` list is empty); this file (the manifest) is the one addition once its own commit lands.
- The count, `git grep -inE '\bruled\b|\bruling\b'` across every owned file: **519 lines before, 95 after** (measured against `git show 9026d619:<path>` per file vs the current tree). Every one of the 95 remaining is a confirmed exception, not a miss — see "left framed with its reason" below; the arithmetic reconciles exactly (32 confirmed non-lab exceptions + 63 lab-mechanic/real-identifier lines = 95). A second count on the non-"ruled" markers (`(bible N)`, `law`, `binds`, `precedent`, `decision N`, `his/Will's pick`, `not-law`) came back **zero** stale hits outside the same exception set.
- Three examples of the rewrite:
  1. `src/app/globals.css` — a whole doctrine renamed, not just one line: "── THE FOUR LAWS THIS ENCODES ── / 1 SOURCE … 2 DIRECTION … 3 COLOUR … 4 FALLOFF" became "── THE FOUR RULES THIS ENCODES ── / SOURCE … DIRECTION … COLOUR … FALLOFF", and then every later cross-reference in the file ("law 4's arrival", "law 2. Where the lamp is", "does NOT fail law 2… What decides the CTA case is law 1 instead") was reworded to name the rule directly ("FALLOFF's arrival", "DIRECTION. Where the lamp is", "does NOT fail DIRECTION… What decides the CTA case is SOURCE instead") — the reason survives, the numbered-citation-as-authority does not. ~30 call sites across `globals.css`, `theme.css`, `screen-lamp.tsx`, `reel-screen-lamp.tsx`, `live-album-stage.tsx` and `publish-light.tsx` follow the same rename.
  2. `src/app/(app)/name-gate.ts` — `"THE NAME GATE, IN ONE PLACE (name-gate, 2026-09-22).\n\nWill's ruling: \"I wanted to ensure an account without a name wasn't moving around the app as a normal user...\""` became `"THE NAME GATE, IN ONE PLACE.\n\n\"I wanted to ensure an account without a name wasn't moving around the app as a normal user...\""` — the quote (the actual reason) stays verbatim; "Will's ruling:" (the appeal to who decided) is gone.
  3. `src/lib/stripe/entitlement.ts` + `entitlement.test.ts` + `src/app/api/stripe/checkout/route.ts` + `src/lib/billing/passes.ts` + `src/lib/r2/keys.test.ts` — a pointer repair folded into the same sweep: `"billing-caps.md ruling 1 (\"one plan at a time\")"` (a numbered ruling billing-caps.md no longer has, per the docs lanes' list in `sweep-pointers.md`) became `"billing-caps.md's rule (\"one plan at a time for Pro; passes stack\")"`, naming the fact's current home instead of a citation that no longer resolves; `"billing-caps.md ruling 3"` and `tiers.ts`'s `"billing-caps.md decision 3"` were repaired the same way.
- Any line left framed with its reason (all deliberate, all re-checked after every edit, none accidental):
  - **The lab's own review vocabulary** (not authority over a past decision — it IS the product): a catalog card is "ruled" keep/refine/kill; `scripts/new-board.mjs`, `review-session.tsx`, `sample-spec.ts`, `session-step.ts`, `catalog.tsx`, `item-verdict.tsx`, `step.tsx` all use "ruled"/"ruling" this way and are unchanged.
  - **Real identifiers, unrelated to this sweep, where renaming is a behavior change**: `session-step.ts`'s `ruled`/`afterRuled`/`ruledFor`/`NOTHING_RULED` fields; `touchpoints.ts`'s `Ruling` type, `RULINGS` export and `getRuling()` (flagged above under Deferred); `trail-engine.ts`'s exported `RULED` spec object; `marketing-voice.ts`'s `SITE_THESIS_STATUS`/`HeaderStatus` values of `"ruled" | "provisional"`; `board-spec.ts`'s `from: number | "ruling" | "precedent"` union (and its already-neutral JSDoc). `callout.tsx`'s `CalloutKind = "not-law" | ...` stayed for the same reason (it's a prop value read by pages outside this lane); only its display label and JSDoc changed ("Not law" → "Guidance", the authority framing dropped from the comment).
  - **Not authority framing at all, on inspection**: `"a ruled ledger"` (blog-list.tsx) and `"Ruled rows, not dot-bullets"` (careers page) mean lined/ruled paper, not a verdict; `"which stays ruled out"` / `"the one thing ruled out"` (trail files) use the ordinary English idiom; `theme.css`'s `"not a strict hard ruling"` is inside a verbatim Will quote already making this sweep's exact point, so it was left as his words; `globals.css`'s `"lab -> ruling -> promotion"` describes the elevation program's own pipeline, not a specific decision's permanence; `"canonical"` (SEO/data-source-of-truth), `"authoritative"` (e.g. "Reduced motion is authoritative even when...", a precedence statement) and `"ratified"` (the pre-existing, codebase-wide term of art for "the lab-selected shipped variant," used far outside this lane's owns and not in the brief's marker list) were treated as out of scope.
  - **Actual legal text, not a comment**: 18 lines of `legal-terms.tsx`'s real Terms-of-Service clauses use "law" in the ordinary legal sense (governing law, applicable law); untouched. `content-policy.test.ts`'s `"law-enforcement"`/`"law enforcement"` is content-moderation domain vocabulary (CSAM/NCMEC detection), also untouched.
  - Two regex false positives caught and left alone on inspection: `dashboard/arrivals.ts` and `reel/quick-add.ts` each read as matching `"his pick"`, but the actual text is `"...this picks..."` / `"...shaped this pick..."` — `"his pick"` is a substring of `"this pick(s)"`, not the phrase.
- Assets requested from Will: none.
- Board ideas: none beyond the Deferred item above (that one is code hygiene, not a design question).
- Proposed migrations / Worker / Vercel / Stripe / env changes: none.
- Calls his to overrule, one line each:
  - Treated `"ratified"` as out of scope everywhere (not in the brief's marker list; a codebase-wide term of art, not unique to this lane) — if he wants it swept too, it touches far more files than this lane owns.
  - Kept the lab's "ruled keep/refine/kill" review mechanic's vocabulary as product terminology, not authority-framing — if he'd rather the mechanic itself used different words, that is a lab-infrastructure naming change, not a comment sweep.
  - Did not sync with the moved `origin/launch-prep` (reasoning above); if the Orchestrator's own merge disagrees, the fix is a two-line conflict in `touchpoints.ts` at most.
- Look at first: `src/app/globals.css` and `src/app/theme.css` (the two densest files, and the ones the record commit specifically called out as "carrying the framing lines it rewrites"); then `src/lib/constants/marketing-voice.ts` (the file with the most "RULED" headings, now stripped of attribution+date but keeping the status word that mirrors its own real `HeaderStatus` type).
