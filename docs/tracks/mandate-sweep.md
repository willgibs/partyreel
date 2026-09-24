---
track: mandate-sweep
status: open            # open -> handed-off; deleted in the merge commit that integrates it
cut: "ce9c13df"            # the launch-prep SHA the branch was cut from
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
