# Partyreel — What's next

> ROLE: what might be next: the open tasks, the major-overhaul buckets, the launch checkpoint. · NOT HERE: how a
> system works (→ [`systems/`](systems)), what shipped (→ `git log`; a merge commit carries its lane's summary),
> where things stand (→ [`STATUS.md`](STATUS.md)), speculative ideas (tracked outside these docs).
> GROWS BY: one line per task under its bucket, present tense, at most a one-line why; a line is deleted the day it
> ships or is dropped (git keeps it).

**Provisional.** A line is a candidate, never a spec or an invariant, and it never bends today's implementation; it
becomes real when a plan picks it up. The don't-revert layer is [`systems/`](systems).

**Deferring work:** add one line under the matching bucket below (never an inline "Deferred:" note elsewhere), so an
overhaul finds its whole task list here when it runs. Picking a task up follows CLAUDE.md's working loop.

## Now (concrete, pick-up-able; one line each, the provenance in git)

New lines land at the head of this list (`usher/kit/record.py`); the cross-cutting ones stay here, and the groups
below hold the rest by surface.

- Billing follow-ons: `host-storage`'s wiring needs a per-account, per-item size query (today's `getHostStorageSummary` is an aggregate and `listEventMedia` is per event) and the plan sheet's refusal face on the trigger the board picks.
- Host (Will's call): the Guests room draws a confirmed guest's verified badge without the address the host's viewer shows under the same name; his reason for keeping the address (a badge without it implies more safety than it gives, 2026-09-22) reaches the room too, but the room would list every address at once.
- Dashboard: an account a guest just made through the capture lands first on the host tour ("Create my first event", `welcome-flow.tsx`) before the Guest card the capture promised it; a guest-made account's first visit could lead with that card.
- The voice: after the guest journey's board (`voice-guest`), the host app's lines, then marketing's main lines, each won one line at a time in its real place (Will, 2026-09-22: "nail our voice in the lab, across all main and micro copy").
- Migrations: the remaining `migration-guards.test.ts` pins that hold an object for the deployed `main` build are judged by PROGRAM.md's "Before launch" principle: each contract lands once the alias's build stops calling what it drops.
- Help: `your-dashboard-explained.mdx` carries the stale `<Path>Account menu › Dashboard</Path>` breadcrumb (the account menu has no Dashboard item; the logo is the door), beside its own billing help-sync line.
- Marketing: `faq-data.ts`'s "How long do you keep my photos?" answer reconciles only the Event Pass exception; the Free plan's inactivity removal (the help guide's rule 7) is missing from it.
- Marketing: `/events/weddings` and `/events/trips` still say "no expiry clock counting down" on the memories (`src/lib/constants/events.ts`, four lines), with no word of the Free plan's inactivity removal.
- Guest: the follow moment never plays after a Google or magic-link confirm: `ClaimHandlePrompt` consumes `pr_pending_offer_<qr_token>` only inside the post-upload slot, which needs an upload this visit (`guest-upload.tsx`'s `doneCount > 0`), so a full-reload return shows nothing until the guest's next upload.
- Code hygiene: `dashboard/trash-section.tsx` has no importer and its empty state still says "Nothing in your trash."; it retires with the other unmounted components.
- Profiles (Will's call): should a profile's attended event also follow Require an upload to view? The album holds a viewer who has not uploaded at the teaser (no Guests list) while uploads are open, yet `get_public_profile`'s attended arm shows that viewer the line; recommended: on such an event admit only the host or a signed-in viewer whose own guest row there has a completed upload.
- The lab and the kit: `lab:demo` presses a step only in its default knobs, so a config's other states are never measured (`media-viewer`'s `origin=reel` and `credit=confirmed` were checked by hand); a `--state <control>=<option>` pass would press them too.
- The lab: `media-viewer`'s drawn chrome (both capsules, the strip, the face-led credit) wears a hand-copied `bg-black/55 backdrop-blur-sm`, a grade behind the shipped lightbox's Crystal (`GLASS`); a material pass before the board's next round.
- The lab: `media-viewer.holds` still draws the `grow` opening caught mid-flight, where `who` and `wayout` draw it settled (`Viewer`'s `settled`); its next round passes `settled` there too.
- The lab: `sandbox/gallery-fixtures.ts` (shared by `host-curation` and four reel boards) still mints a nameless `isAnonymous` uploader and puts the host's own uploads in `REVIEW_ITEMS`, neither of which the product can do now.
- Billing (Will's call): checkout lets stacked Event Passes above the chosen Pro size start Pro, shrinking the cap into over-cap grace (`api/stripe/checkout/route.ts` compares no sizes); decide whether a move may shrink a cap.
- Guest: the name step's field carries `autoFocus` (`guest-name-step.tsx:356`) though the password gate drops it for the iOS keyboard; check on a real iPhone.
- Housekeeping: more files with no importer or Library-only, beyond the lines above: `getFollowedHostEventCards` (`queries/social.ts`), `features.ts` and `features-layout.ts` (read only by their tests), `anonymous-info.tsx` (Library only).
- Housekeeping: comments that state retired facts: `getHostAvatarUrl` (`lib/avatar/seed.ts`), `resolveGalleryAccess` (several), `body-token-source.test.ts` (`lib/guest/session-cookie.ts`, `api/guests/route.ts`; the pin is `session-cookie.test.ts`), `claim-handle-prompt.tsx` on what the claim writes, `queries/accounts.ts`'s "only cross-host profiles reader", `profile-slug-control.tsx`'s "EVENT slugs stay Pro", the root `not-found.tsx`'s glow, `contact-sheet.tsx`'s deleted file, `workers/backup/src/index.ts:296`'s "Cost & scaling", `share-urls.ts`'s "database-security.md0", and comments citing numbered rulings no doc holds (`upload-lock.ts`, `entitlement.ts`, `tiers.ts:181`, `request-facts.ts`, `preserve.ts`).
- Housekeeping: three applied migrations have no file in the repo (`reel_style_catalog`, `reel_style_catalog_drop_legacy_overload`, `reel_caps_ingress_multiplier_parity_reapply`): recover each from `supabase_migrations.schema_migrations` into `supabase/migrations/`.
- Docs: three headings still carry a date or a status word (`admin-observability.md`'s "(Will, 2026-09-18 and 2026-09-20)", `durability-backups.md`'s "(BUILT — ships in dry-run)", two runbook headings in `trust-safety-forensics.md`): rename each with its anchors.
- The lab: re-check `testing-verification.md`'s Browser-pane `resize_window` no-op traps against the current tool, which emulated 1440x900 for the systems lane.
- Profile: a confirmed account with no handle has no page, so the owner mode's likes and connections are unreachable for it (the events its uploads are in reach its dashboard as Guest cards); they need a home that needs no handle (or `identity-profile.setup` answers it).
- The lab: `press-page`'s preview frames run short of their real iframes (`board.tsx`'s `wordsPreview`: `paragraph-and-line` declared 560/700 against 605/913, `founder-voice` 740/900 against 850/1238; `the-sheet` and `the-facts` drift the same way); remeasure the board against the real iframe, as `help-center`'s `board.tsx` does.
- The event type pages close on "Your guests need nothing but their phones." (`src/app/(marketing)/(cinema)/events/[slug]/page.tsx:195`), a promise a Require-verified-emails event breaks.
- The `/pricing` h1 (`GOLDEN_LINES.pricing`, "Start free, upgrade when you host again.") sells Pro as hosting again; redraw it on what one big event gains (a voice ask; `PRICING.md` holds Pro's case).
- The toast sweep: where a control can show its own result, no toast fires (65 call sites unreviewed).
- `help-palette.tsx` builds its own floating panel outside `src/components/ui` (a hand-worn `rounded-float` and `shadow-layer`), so `floating-layer.test.ts` cannot hold it.
- `/design/lab/proposals` and the `docs/specs` reader have nothing to show now (a board's argument lives in its `spec.ts`): retire the route and its `status.ts`, or keep it for a board that writes a document.
- Code hygiene: unmounted components (`ghost-grid.tsx`, `floating-add-button.tsx`, `event-filter-pills.tsx`; `filter-chips.tsx` and `tile-size-control.tsx` drawn only in the Library), three unused props passed to `EventCardQr` (`events-section.tsx`), and comments describing retired designs (`sonner.tsx` and `guest-masonry.tsx:35-38`, `masonry.tsx:180-182`, `globals.css:745-747`, `gallery-skeleton.tsx:15-16`, `enter-event-prompt.tsx:7-12`, `cinema-hero.tsx:57-69` and `hero-stream.ts`, `marketing-voice.ts:75`, `next.config.ts:106`).
- The identity round's contract migration, once the alias's build no longer reads what it drops (PROGRAM.md, "Before launch": it never waits for the milestone): drop the sync trigger and `events.allow_anonymous_uploads`, recreate `get_event_by_qr_token` without the old column (keeping `require_upload_to_view`), add `create_guest`'s "Add your name to upload." raise, retire `isAnonymous` and the seed script's old flag, and delete `get_public_profile`'s QA #36 clause (the confirmed-viewer gate beside it implies it), moving `public-profile-visibility.test.ts`'s pin to the gate.
- Sentry: a localhost run reports to the production project as `environment=development` (`commonInit`'s `enabled` is `Boolean(dsn)`, so a `.env.local` holding the DSN sends); enable it on Vercel only, or point development at a second project.
- A real-device pass, an iPhone first: the file-picker upload end to end; the responsive Sheet's phone half with a focused input and the home indicator (it carries no `env(safe-area-inset-bottom)`; vaul's `repositionInputs` is the fallback engine for that half); whether the export's form-POST attachment saves on iOS Safari; the arrival choreography on a real gated event.
- Help-sync, billing: `upgrade-downgrade-or-cancel`, `what-the-free-plan-includes`, `what-happens-when-storage-fills-up`, `payments-receipts-and-invoices` and `pro-vs-event-pass` say buying happens on the pricing page where the app opens its pricing sheet; `your-dashboard-explained` calls the storage bar's panel the only billing page while the account page's Plan card carries Manage billing too.
- Help-sync, the guest door: `how-guests-join-and-upload` still describes the dimmed Tap to retry tile and the approval toast (a failure sheet and a waiting tile replaced them); `a-photo-is-missing-from-the-album` gives the preview one cause (Require an upload to view is the second); `day-of-checklist-for-hosts` says a private-window test skips "the email step" where the door asks a name first.
- Help-sync, the host app: `add-your-own-photos` sends a host to a row of buttons under the event name and a floating button (Add photos sits in the album's own header); `your-event-page-explained` describes the old album control row (one View menu holds Tile size, Sort and Filter with the Deleted lens); `profiles-guest-lists-and-following` and `your-public-profile-following-and-blocking` send a followed host's events to a Following chip the dashboard no longer has.
- Help-sync: bump the `order` of the privacy-and-safety articles after `require-verified-emails-explained`, so `require-an-upload-to-view-explained` (order 7) sits beside it.
- Help: no article mentions the demo; a round picks that article's slug and audience deliberately.
- Help: `ArticleFeedback` records nothing (it calls no endpoint); a per-article count in `/admin` answers which articles fail (the `help-center` board's `feedback` ask shapes it).
- Help: `defaultAudience` (`lib/content/help.ts`) guesses host for two categories where most articles override it; a per-article audience pass.
- Design: teach `cn()` the two shadow utilities (one `theme: { shadow: [...] }` line in `src/lib/utils.ts`): tailwind-merge files them under shadow colour, so `cn("shadow-layer", "shadow-none")` keeps both.
- Design: `elevation-policy.test.ts` scans `.ts`, `.tsx` and `.mdx` only, so a component stylesheet's `box-shadow` escapes it: `cinema-hero.css`'s `.hhs-card` hand-types `0 18px 46px -16px` rather than reading `--shadow-lift`; widen the scan to `.css` under `src/components/` and tokenise or allow-list it.
- Design: `use-sortable-grid.ts` sets a hand-typed pick-up `box-shadow` from JS during a drag (allow-listed by name); it reads `var(--shadow-layer)`.
- Design: the surviving `text-[10px]` sites move to `text-micro` in any lane that opens their files (naming, not sizing).
- Design: the app's light mode owes its own answer for lit surfaces before any dark-versus-light work (the Aurora is dark-ground only).
- Design: a mark over media, if one ships (the shimmer is banked as a delight moment), needs from the glow engine a play-once sweep, a `runId` re-key for every shape (only a one-shot has one), an additive blend over a photograph, and `[data-glw-edge-rest]` under its travelling ring; `SectionLight` ships without a dither until the grain tile lands (ASSETS row 15).

The lab and the kit:
- The kit's `Frame` exposes its pixel height to children (a CSS variable): a percentage `min-h-full` inside a frame collapses to 0 px, so a full-bleed child reaches for `fixed` or a hard-coded screen height today.
- A bare `Frame` ignores the lab's Fit, so a 1920 frame stays 1:1 and the stage head's scale control seems dead.
- A `Frame` seeds its state from the parent's first render, before `useBoardState` reads the URL, and the correcting `lab:set` lands before the frame has hydrated (a board opened at `?ground=cinema` painted every card on the app's dark).
- `lab:demo` reads a step FROZEN when its options differ only inside grid-stacked, visibility-toggled `srcdoc` iframes (the captures come back byte-identical); capture each frame on its own.
- The pinned stage head crushes at 375 when a step has one config row: the recommended line and the knob strip share a line and the label truncates.
- A fully ruled ask is unreachable by `?session=<board>.<ask>` even by a direct link (`_desk/queue.ts`'s `boardWork` walks only asks with no ledger answer), against `lab-demo.mjs`'s claim that a ruled step stays measurable.
- `BoardSection` hands its board one unkeyed child, so a board effect keyed on a module constant freezes when the board's own control swaps the drawn option; the kit keys the child, or every measuring board threads a change token.
- A production hero mounted on a board arrives invisible until `Reveal` sees it (`PageHero`'s subhead and actions hold `data-mkt-cut`'s backwards state); the kit owes boards a settled-state rule.
- The dock draws every control as a pill row; above about eight options a select gives the dock back a screen (`ControlKnobs`, `board-state.tsx`).
- `.lab-dock` at 1280 and up keeps its note column's `14rem` floor beside a long option row (the column patch: `git show bb64f398:docs/tracks/overtaken.md`, Handoff).
- A lab `<breakpoint>:` utility loses to production's class on a shared element (layer order, measured in `design.css`), so a board writes its media query in its own sheet; compiling the lab as a superset of production's utilities that wins wholesale is a round of its own.
- The lab imports production modules the wiring lanes reshape (`git grep -l 'from "@/' 'src/app/(dev)'` lists them); boards on lab fixtures free a wiring lane to reshape them.
- No standing board draws `SpotCompare`, `CompareTwo`, `FrameRow`, `Loupe` or `TrueFit`, and `scripts/new-board.mjs` still scaffolds three of them: keep them for a board that needs one, or retire them (their open refinements wait for a consumer: `SpotCompare`'s per-spot differs line, `CompareTwo` squeezing a fixed-width child, `Frame`'s `onApproach` on a row that clips).
- Every standing board carries a spec, so `_desk/sample-spec.ts` and the desk's dry run can go (keep `/design/lab/sample`'s responsive-variant proof, or move it).
- Index the kit as a component family in the Library's collector and delete `lab/kit/notes.ts`.
- `pnpm design:specimens` beside `design:rules`, so `specimens.generated.json` regenerates by name (today `node "src/app/(dev)/design/gallery/collect-specimens.mjs"`).
- The collector's id collision: a contract target whose file stem matches a Library component's forces renaming both files.
- `// @policy:` on the remaining tree-reading tests, so `/design/library/policies` lists every line the gate holds.
- Mount `ItemVerdictRow` with `LIBRARY_VERDICTS` on a Library entry's page, so a scroll through the components fills `docs/reviews/_library.json`.
- Fold the gallery's `RefSection` into the shell's `Section` (one anchor shape).
- No Library specimen for `HowItWorksStepper` (a full-width section; a `gallery-demos` entry shows it) or `ui/toggle-group.tsx` (one product call site).
- No Library specimen for `PricingSheet`, `LockChip` or `WelcomeToPro`: a live demo would put a real Checkout door in the lab, so a static specimen once the gallery can mock the door.
- `/design/library/components` logs a next/image warning on a hero specimen (`mkt-wedding-golden-01.jpg`, `fill` with `sizes="100vw"` not rendered at full width); give that plate a real `sizes`.
- `/design/library/patterns`' `RouteErrorMock` still draws the old digest chip and no help line.
- `lab/tools/motion/motion-playground.tsx` names `/design/lab/rounding` as a specimen; point it at `/design/library/foundations#radius`.
- A few boards still fade `text-muted-foreground/N` by hand (`git grep 'text-muted-foreground/' 'src/app/(dev)'`); each moves onto `text-faint` when its board is next touched.
- Two standing boards draw the retired literal "No app, no account." (`help-center/who-first.tsx`, `site-chrome/foot.tsx`); their next touch takes the voice's line.
- `guest-capture`'s `sheet-step` peek dims the album with a flat `opacity-40` where the entry shell's own backdrop is `bg-black/10` with a blur (a backdrop-filter step reads UNPAINTED in headless Chrome, so matching it costs a by-hand exception in `lab:demo`).
- `privacy-hero`'s `field.ts`, `field.css` and `field-layer.tsx` survive only for `photoOf` (read by `concepts-layer.tsx`); move it and cut the rest at the board's next touch.
- `sandbox/home-hero/shared.tsx` has no importer (the shipped hero reads `STREAM_FRAMES` in `hero-stream.ts`); delete it.
- Banked: the tucked-artifact card at 375 (the conference and trip cards, the artifact tucked above the copy floor) for a surface where a visual could tuck: `git show 9f5e6a76^:src/app/(dev)/design/sandbox/event-identity/cards.tsx`.
- The design lab on its own subdomain: a second Vercel project on the same code, and a `design.partyreel.com` mapping that rewrites the two route prefixes and `_data/legacy-routes.ts` in one place.

Marketing:
- The feature pages after the album one (curation, guests, privacy, QR, sharing), one ground-up round each in nav order, the album page as the model; the privacy hero's round three is on the desk.
- Marketing glass: the header's `GlassLayer`, the overlays and the set-pieces over photographs, onto the app's ruled material (the banked Glass exploration across marketing and app); until then the nav labels sit at `text-muted-foreground` under the transparent bar and are hard to read over a bright cinema hero.
- `ScreenLamp` casts a full-bleed seam under the sharing and guests heroes where a screen's light is a pool; compose each its own light.
- Brand: the day the v1 icon lands (ASSETS row 19), one pass: `Logo`'s `markOnly` branch (a placeholder tile with no production caller), `src/app/icon.svg`, `favicon.ico`, `apple-icon.png` and `manifest.ts`, the reel watermark's badge and wordmark in `src/lib/reel/engine/canvas2d.ts` (its REAL-LOGO seam; the wordmark path can ride a `Path2D`), and the press kit (`scripts/build-press-kit.mjs` rebuilds the committed zip: the marks and the app icon, which show the retired Aperture glyph today, plus the wordmark in white and in ink, which the kit has never carried).
- A partners page and program for planners, with `/press` growing into the partnerships kit; until then planners read the site as hosts.
- Post-launch event types: `/events/birthdays`, `/events/memorials`.
- `/pricing` opens on paper but the cinema layout pins `themeColor: #040405`, so a phone's browser chrome is dark over a white first screen; the answer is group-level (the layout forbids a per-page `viewport`).
- `sections/pricing/shared-band.tsx` has no importer (the pricing test already refuses it rendered): delete it.
- The footer's FAQ link is hard-coded `/#faq` (`marketing-nav.ts`), so on `/pricing` it leaves the page's own FAQ for the home's.
- Tab into the hidden header costs the reader about 482 px of scroll position (Chrome's scroll-into-view against a sticky element); a keydown-on-Tab return would pre-empt it.
- The phone sheet's foot actions (Log in, Start free, Dashboard) carry no `trackAttrs` while the header's do.
- `navigation-menu.tsx`'s cross-slide still spells `data-[motion=…]` inline; swap it onto `floatingCrossSlide` (identical values).
- The mega panel hand-writes a description per event type beside `EVENT_TYPES.teaser`; one source, in a lane that owns `marketing-nav.ts`.
- `src/lib/constants/events.ts` sits outside the content policy's claim scan.
- The blog's tags: the family-reunion post carries `parties` while its subject reads as a trip, and `blog-tags.ts` has no `trips` tag; `guest-album-for-photographers-and-planners`, `wedding-album-password` and `wedding-photo-sharing-app-vs-shared-albums` carry an audience tag and no link into a type page.
- The blog's follow-ons: real `/blog/page/[n]` routes; a "Start here" strip past about 40 posts; the featured card's eyebrow as the post's purpose; a founder-voice post (Will's ruling first); the `compared` posts re-verified on each refresh.
- The EXIF claim's "for the common formats" clause is missing on its last two sites: `features/privacy/never-rides-along.tsx` and `constants/feature-pages.ts`.
- The legal pages carry no print styles (only the glow engine carries `@media print` and `forced-colors` rules; copy its pattern).
- Inline code in help and blog prose has no plate (the wrappers set it sans and nothing else); give it the muted plate.
- `SectionShell`'s subhead carries no size class (16 px inherited) while `PageHero`'s rides the `subhead` step; put it on the ladder.
- /qr's pull quote (`features/qr/print-shop.tsx`) is the last flat `text-3xl` figure, a `font-heading` paragraph the heading scan does not read; give it a step by role.
- About 26 `bg-muted/N` sites in marketing become sections carrying `.surface-mat` (declared, worn three times).
- An a11y pass on `--faint` (about 3:1 on the page and the mat): the sites that read as body copy move up a step.
- `live-demo.tsx`'s mock panel wears a literal `rounded-[14px]`; the token its role calls for.
- `MediaTile` serves the marketing stand-ins' source files (about 2 MB each into a 287 px tile, 16.8 MB for the album hero), so marketing stills want a derivative.
- `HERO_FIXTURES`, `HERO_FRAME_H` and `HERO_SEED_COUNT` (`album-fill-fixtures.ts`) serve only tests: fold them into the tests or delete them.
- `glow-placement.test.ts` refuses `overflow-hidden` on a lamp's wrapper while a halo must clip to its object: exempt `shape="halo"`, or name `clip-path` (which satisfies both) in its message.
- The home's how-it-works passage renders as `id="how-it-works"` while `section-ids.ts` and its file still call the slot `film-strip`; rename both, with `index.ts` and `home-sections.test.ts`.
- The cinema and paper 404s (a `notFound()` inside a marketing route) render in a fixed `min-h-[60vh]` box with the tile strip while the root 404 fills the screen with the trail; one grammar, or rule the root the only one with the trail.
- A 404 reached through a dynamic marketing route (`/help/nope`) carries the bare `Partyreel` title while the root and paper 404s say Page not found.
- One copy-with-a-receipt primitive for `marketing/press/copy-button.tsx` and `shared/error-digest.tsx`.
- The careers form and `/contact` are two parallel copies of one contract (validation, limiter, insert, receipt): one contract, a honeypot named for nothing real (today `website`), and an end-to-end test for the actions (none exists).
- `sections/careers/contact-sheet.tsx` and `press/press-sheet.tsx` are photography proof sheets named like contact surfaces; rename them when next touched.
- The hero's warm-up (the lamp arriving neutral and warming into the wall) is built and pulled; it returns when Will can judge the swap on a visible screen.
- The QR-to-album handoff wants its own ground-up visual round; the pour (photographs leaving one object and landing in another) is banked for a real "photos dump here" moment.
- The backdrop's entering photograph could offset with pointer speed (one line in `backdrop-engine.ts`).
- A swipe row of cards (`snap-x`, the next card peeking) for a future gallery-type section, never the plan cards.
- The footer's AI assistant row drops to ChatGPT alone if first impressions warrant (Claude's `?q=` prefills without submitting).
- `/features/album`'s h1 is the one of six that wraps to three lines at 1440 (44 characters in `max-w-3xl` at 80 px); shorter copy is Will's call.

The app:
- Host: the hidden-media dim never renders: `shared/masonry.tsx` appends `opacity-30` to `active:scale-[0.98]` with no space, so Tailwind never emits it and a hidden photograph sits in the host album at full brightness (`host-app.md` describes a 30 percent dim; no test covers it).
- Host: dead curation code: `ApproveAllPendingButton` (`host-media-grid.tsx`) has no caller, and the lightbox's pending Approve branch can never render.
- Host: the Review peek (`selectable-media-grid.tsx`), a third full-bleed viewer, promises an Escape in a comment and never listens for it.
- Host: no test covers `useReviewTriage` or the bulk mutations.
- Host: the hub's Guests card counts profile-backed guests only while the album and the Guests room count the named unverified too; count them (Will's call; recommended yes).
- Host: the gallery doorbell rings only when the approved-visible set changes, so a pending upload never wakes the host; the hub bridges it with a host fingerprint route (`/api/events/[eventId]/live`) polled on the guest cadence, which a host channel rung on every arrival (a migration on `media_gallery_doorbell`) would retire.
- Host: the album keeps its own arrival timers (`host-media-grid.tsx`'s `useArrivedIds`) beside the shared `useArrivalMarks` (`lib/shared/arrival.ts`); fold it onto the hook so both surfaces hold an arrival for one length.
- Host: the View menu's Sort ships disabled because the hub gallery's client holds one page, not the whole approved list; it switches on when the list is whole or the sort moves server-side, and a size sort (largest or smallest first) joins it then, the host's way to the heaviest files (Will, 2026-09-22).
- Host: empty states draw "nothing here yet" four ways (`shared/empty-state.tsx`, `dashboard/empty-section-teaser.tsx`, `dashboard/events-empty-teaser.tsx`, `event-feed/feed-section-empty.tsx`) and the Likes section two ways for one interaction (`EmptySectionTeaser` when the server knows it is empty, `my-likes-gallery.tsx`'s bare `EmptyState` after the last unlike); one grammar (`empty-state.tsx`'s comment calls `quiet` the default while the code defaults to `icon`).
- Host: the ghost pack's file list is built three times (`guest/gallery-empty-state.tsx`'s `GUEST_GHOST_FRAMES`, and a list each in `dashboard/events-empty-teaser.tsx` and `dashboard/empty-section-teaser.tsx`); one exported list.
- Host: `event-feed/event-feed.tsx`, `event-feed/event-feed-action-bar.tsx` and `dashboard/trash-section.tsx` have no importer; delete them.
- Host: `guest/file-dropzone.tsx` is rendered only by the host's manual add (`app/host-upload.tsx`), and its "Tap to choose, or drag them here" is half wrong on a phone; move it to the host's side and word it for a hand.
- Host: one label for creating an event (the dashboard says New event, the empty teaser Create your first event, the welcome Create my first event, the app's 404 Create an event).
- Host: the wizard's QR swatches encode `/e/` plus 32 zeroes (`previewJoinUrl`), a 404 when a host test-scans one; say they are samples, or encode the real link once the event exists.
- Host: the hub's header at 375 is unmeasured against "immediately visible at the top of the page"; if the cards row does not clear the fold, the header compresses (the code to about 96, the metadata folding) before anything is cut.
- Host: the restore toast never reads `mediaStillRemoved` (`restore-event-button.tsx`), so an event restored with media still removed says nothing of it.
- Host: bulk Restore-all and Empty-bin for the recovery bins.
- Host: cross-gallery sort and filter for the Uploads section (`get_my_uploads` is filter-ready; a like-count sort).
- Host: help deep links from the app (settings to their articles); the user menu and the 404 are its only `/help` links.
- Account: the existing-account notice for a magic link (the other half of `existing=tell`): a one-line banner on `/dashboard` when Create account signed an existing address in (`checkExistingAccount`, `(auth)/actions.ts`, is the shared rule).
- Account: the signup's Pick a password step (`password-sign-in.tsx`) has no strength meter while `/account`'s change form wears `PasswordStrengthMeter`.
- Account: `EmailSignIn` takes class overrides rather than a Button `size`, so the guest gate's email button (`enter-event-prompt.tsx`) is a default Button forced to h-11; give it a size so it wears `cta`.
- Routes: `/account`, `/welcome` and `/u/[slug]` carry no `loading.tsx` (the profile awaits an RPC and two presign rounds before it paints).
- Profile: the event cards presign the cover's original (`queries/social.ts` reads `original_key`: 1920 wide, multi-megabyte, `loading="lazy"`), so a card paints black for seconds where the preview derivative the dashboard's cards read lands at once.
- Profile: an attended card whose guest added only video draws `EventCard`'s lock fallback (`href: null`); it deserves its own empty face.
- Profile: three hand-rolled toggles do one job (`FollowButton`, the profile menu's block, the Connections card's buttons); one control, one contract.
- Profile: the overflow menu opens over the person's own name at 375.
- Profile: `src/lib/validation/report.test.ts` has no person-arm cases (both subjects, neither, a cross-subject `media_id`).
- Guest: a name-only guest whose session drops re-joins on the same device as a second guest row with the same name, so the guest list shows one person twice; key the re-join on `pr_device_id` (the same row) or de-dupe the list by name and device (Will's to pick).
- Guest: the album's header holds `stats.contributorCount` from the render, so a guest's own first upload under-counts the guests by one until a reload (`event-experience.tsx`); a small server signal on the gallery poll fixes it, never a client heuristic (a returning contributor would over-count).
- Guest: `get_event_by_qr_token` does not return `events.max_upload_bytes`, so the upload sheet's terms line states the product's limits rather than the host's own cap; add the column (with the types and `queries/guest-events.ts`) and `uploadTermsLine`'s `capBytes` seam takes it.
- Guest: Download all (`ExportDialog`) and Save (`SaveEventButton`) are still centred `Dialog`s where the guest's other dialogs ride the responsive Sheet.
- Guest: two identity seams read the server's names through narrow casts (`socialSeam` and the guest list's second argument in `(guest)/e/[token]/page.tsx`; `isVerified` in `media-lightbox.tsx`); collapse them onto the merged types.
- Guest: the album, the door and the report dialog carry no link to `/help` (only the guest 404s do).
- Guest: the media viewer's own image and video have no loading state (a tile has a skeleton; the opened photograph pops in when the full-size presign lands, the slowest picture in the product on venue Wi-Fi).
- Guest: `/api/reports` accepts a `media_id` the report dialog never sends.
- Guest, the demo: the per-tile Save and Share and the export routes enforce no `isDemo` server-side (the guest export serves the demo album in full; the UI hides the rest); decide whether the demo's capability token carries a read-only claim.
- Exports: the mint has no timeout and no cancel (a hung request leaves the toast spinning and Download disabled until a reload), the dialog prints raw integers ("2440 items"), and the album's bulk Download mints with hidden items in and no confirmation.
- Exports: the Worker skips an R2 object it cannot find in silence, so an album emptied between mint and stream downloads as a valid, empty zip; a failed-export state.
- Exports: the album page states "Up to 2,000 items" while the dialog names no number until it refuses and the zip mock's comment keeps the cap unmentioned; one answer (the `export-flow` board's `cap` ask).
- Exports: zip follow-ons: an async build-to-R2 job past the cap; a custom `export.partyreel.com`.
- Media: preview-variant follow-ons: a server-side backfill for pre-feature media; preview bytes on the storage meter; the admin moderation feed's preview; AVIF if quality demands.
- Media: the client-side strip fails open on HEIC/HEIF/AVIF (item-based ISOBMFF) and WebM (EBML), and a JPEG's MPF secondary images keep their own Exif; strip those.
- Media: forensic capture follow-ons, all gated: the pre-strip client-side EXIF capture (counsel-gated), proactive hashing at scale, widening the CSAM scanner past proxied traffic ([`systems/trust-safety-forensics.md`](systems/trust-safety-forensics.md)).
- Admin: `/admin/forensics` renders no per-upload identity (neither the typed name nor the unproved address reaches a table); an uploader column on the held-media table needs `listHeldMedia` (`queries/forensics.ts`) to read it.
- Admin: `/admin/reports` cannot reach a reported person's account (suspend, clear a bio, remove a handle), so the operator acts out of band and only closes the report.
- Admin: `report_status`'s `reviewed` is written by no code path while the marketing and legal copy promise every report is reviewed; a verdict writes it, or the promise changes.
- Admin: `reports.resolution_note` has never been read or written (the `admin-triage` board's `verdict` ask fills it).
- Admin: `ModerationGrid` imports live server actions at module scope; take the action as a prop, as `TriageStatusControl` does.
- Admin: `DistributionChart` hard-codes `YAxis width={28}` (`metrics-charts.tsx`), so a four-digit tick renders as its last three digits the day a count reaches 1,000.
- Admin: the MFA enrolment secret (`admin/mfa-enroll.tsx`) is a bare `<code>`, so preflight sets it in the mono stack; `font-sans`, or the muted plate.
- Admin: `/admin/exports` has no heartbeat (exports sit outside the jobs catalog).
- Admin: "Check the runbook" (`admin/not-found.tsx`, `HELP_BY_AREA`'s admin row) is plain text until a runbook page exists for the operator.
- Admin: an immediate hard-purge for egregious content in `/admin/albums`.
- UI: `ui/drawer` and `ui/tabs` have no product caller (adopt or retire them), and `action-tooltip.tsx`'s comment claims a 200 ms root delay the provider sets to 0.
- UI: `ui/sheet.tsx` has no centred desk posture (the responsive Sheet is a side panel at a desk); a `desk` prop is the line if a door wants one.
- Errors: `/dashboard/<not-a-uuid>` crashes into the app's boundary with a Postgres `22P02` (two server events and one `render:app` per visit) where `notFound()` is the truth; `getEvent` (`queries/events.ts`) refuses a malformed id before the query.
- Errors: a `render:root` Sentry area, so the root `error.tsx` and `global-error.tsx` stop sharing `render:global` (`observability/sentry.ts`, `route-error.tsx`).
- Errors: a `?boundary=global` probe mode that crashes the root layout: `/design/lab/tools/boom` lands on the root boundary, so `global-error.tsx` has no probe.

## Major overhauls (each its own planning round; drop related deferred tasks here)

- **Generated media: one Higgsfield month.** Every image and every video on the site is generated inside ONE paid month
  once more of the site is shaped, landing before launch: the 12 stand-in stills in every marketing page's chrome, the
  blog's OG cards and RSS feed, the conference and trip stills, the demo event's album, and every open
  [`ASSETS.md`](ASSETS.md) row.
  - Its agent opens with deep research into Higgsfield's tooling and prompting (Soul 2.0 and its moodboards, Soul ID, the video models) and writes every final image and video prompt itself; an ASSETS row names the slot and what a frame must survive, never the picture.
  - Before buying, it sweeps ASSETS for every image and video ask so nothing needs a second month, and it runs question-first: the look as round one, each slot's frame staged after it.
  - Re-check the plans at the start (last read: $19 / $59 / $129 a month for 270 / 1,200 / 3,000 credits; a Soul 2.0 image costs 0.12 credits, so the video decides the tier; Plus's free images and unlimited Kling are website-only; the MCP spends credits).
  - Outputs stay ours after cancelling but are not exclusive, and Higgsfield may train on them. The AI disclosure is one sentence at the end of the Terms' Disclaimers and never a mark on an image; no row, field or test tracks where an image came from.
- **QA hardening: the remaining fix queue.**
  - #13 a `presign` abuse kind (`action_attempts` is kind-generic; it needs the `Retry-After`/429 vocabulary the pipeline lacks).
  - #37/#38 persist the pagination cursor for the backup reconcile and the orphan sweep: both restart at the bucket head every run, so nothing past the per-run cap is ever examined.
  - #39 POST id batches: supabase-js renders `.in()` into the URL, and several sites can reach 1,000 to 2,000 UUIDs.
  - Replay a dead letter from `/admin/jobs` (the DLQ has no consumer, and adding one in `wrangler.jsonc` changes delivery semantics).
  - A per-day `job_signals` aggregate once `sent_emails` outgrows a 24-hour head-count (the `sent_at` index first).
  - A dedicated `JOB_API_SECRET` instead of reusing `PRUNE_API_SECRET` as the internal-jobs bearer (three env homes, a Worker secret and a GitHub secret).
  - #44 say whether the `preservation/` prefix (legal-hold evidence) is backed up: the backup Worker copies `events/` only.
  - Cache `.next/cache` in CI if the wall time bites (only the pnpm store is cached).
  - A report-only CSP, then an enforced one (a per-request nonce through the streaming render and an inventory of every inline style; its own project), and `X-Frame-Options` / CSP `frame-ancestors` once that question settles.
  - Sweep the dynamic app routes for the JSX landmine: a text node holding an HTML entity loses its leading space, so a bolded lead-in glues to the next word; no lint or test catches it.
  - A `deletion_requested_by` column, so an operator-triggered deletion is distinguishable from a self-serve one.
  - #11 the >90-minute presign-roll soak and #12 upload retry, fixed in code and never verified live (the soak traps are in [`systems/testing-verification.md`](systems/testing-verification.md)).
- **Notification system** (the foundational features come first, so it knows what needs notifying; the extension point is [`systems/notifications-analytics-growth.md`](systems/notifications-analytics-growth.md)):
  - The announcements overhaul, with per-item announcement un-read toggling.
  - New bell signals: link-activity "new since last seen" deltas; billing `past_due` alerts (a denormalized flag on `profiles`).
  - A durable per-item feed and real-time push.
- **Admin deployment:** its own Sentry project (it shares `partyreel`'s DSN).
- **Admin / operations portal** ([`systems/admin-observability.md`](systems/admin-observability.md)):
  - The portal at a phone, for an operator glancing at health away from a desk.
  - An operator-action audit log: what was done, by whom, with an Undo where one exists (`admin_actions` is a proposal).
  - Per-announcement edit and read receipts.
  - Live Stripe subscription health on the account detail.
  - At very large scale, the prune and reconcile bucket scans move to a merge-join, a deletion tombstone or a shared copy-state index ([`systems/durability-backups.md`](systems/durability-backups.md)).
- **Vercel / Next.js optimization:**
  - Dashboard Suspense streaming, deferred post-launch: completions died inside radix `TabsContent`, and boundaries outside it displayed but never hydrated on this page while the guest page's identical shape works; revisit in the PPR / `cacheComponents` era, with `/design/lab/tools/stream-probe`, the blocking page and `loading.tsx` as the baseline.
  - The `(app)` dashboard's first-load latency (about 1 to 3 s to hydrate: the layout fans out `getUser`, notifications, profile and avatar, then the page adds events and storage).
  - Front Vercel with Cloudflare: DNS sits at GoDaddy, and the move gets its own runbook (the nameserver switch, the three `_vercel` ownership TXTs, Resend's SPF/DKIM/DMARC records, the apex, `www` and `admin` records, proxying off for Vercel-hosted names).
  - A Vercel Spend-Management hard cap and alerts.
  - Revisit the `proxy.ts` per-request `getUser` matcher scope.
  - A large-gallery presigned-read strategy (per-media proxy or pagination beyond the stable buckets).
  - The Realtime concurrent-connection quota (one socket per open guest tab) at launch scale.
  - `cacheComponents` / `"use cache"` adoption post-launch (the deferral's why: [`systems/architecture.md`](systems/architecture.md)).
- **Emails** (the extension point is [`systems/lifecycle-recovery.md`](systems/lifecycle-recovery.md)):
  - A transactional-email automation system.
  - The guest's one-shot "here is your album" mail: only to an unconfirmed address on a row with a completed upload, capped per event, one time, through `sendOnce` with kind `guest_event_link` and dedupe `guest_id`, carrying a "this wasn't me" link that detaches the address (the `emails` board's `guest` ask draws it).
  - A `text/plain` twin beside every `html` (all ten mails are HTML-only).
  - A direct test for `sendOnce`'s claim-then-send dedupe (a mocked Resend, or a rolled-back Supabase-MCP check).
  - The notification card's switches for mails no code path sends (An album you joined was shared, New uploads to your events, Someone followed you); the `emails` board's `moments` ask decides which become mail.
  - The renewal nudge's Renew Event Pass links `/dashboard`, not Checkout (the board's `foot` ask).
  - The first newsletter send carries an unsubscribe link: a signed-out subscriber has no removal path (an account holder has `/account`'s switch).
- **The support-automation arc:** AI-default first responses keyed on `contact_submissions.topic`, and auto-routing rules in `/admin/support`; published language keeps committing to outcomes only (the promise-neutralization doctrine, [`systems/marketing-content.md`](systems/marketing-content.md)).
- **The AI-SEO content arc:**
  - `.md` mirrors of key pages (the llms spec's optional convention).
  - The `/u/[slug]` sitemap and robots decision (a profile publishes nothing until its owner chooses; a slug feed).
  - A WebSite `SearchAction` (it needs a real `?q=` route).
  - AI-referral analytics (UA-tagged hits on `/llms.txt`).
  - `FAQPage` JSON-LD per help article (each is a clean question-and-answer pair).
- **Billing follow-ons:**
  - Grandfathering at the first price change: the policy is ruled in [`PRICING.md`](PRICING.md) "Grandfathering"; the build maps several historical Price IDs per plan in `planForPriceId`, the newest being the public offer.
  - Per-pass dashboard management: which stacked pass a renewal extends, per-pass expiry rows in the storage meter (today the soonest-expiring one renews, billing-caps.md).
  - Revoke the latent table-level TRUNCATE, REFERENCES and TRIGGER grants `anon` and `authenticated` hold on all 22 public tables (Supabase's default grant; PostgREST issues none of them, so none is reachable) in the next security pass.
- **Share studio (QR and share-content configurator):** an in-app generator for polished share outputs, so hosts never build their own; it builds on the QR designer in the share sheet and doubles as a growth lever (every output carries the QR).
  - A gallery of printable QR designs to pick from (the print stock ships in one design).
  - Card presets (minimal ink and photo-backed), and stock cover images per common event type plus generic sets (hosts rarely have a cover before the event).
  - Toggles for the link, the date and the cover; phone and story formats beside printable ones; several file types; drag-and-drop placement as the stretch goal.
  - The share sheet grows sections for posters and an invite when they exist.
- **The reel:** the round's wiring waits on Will's desk review of the six reel boards (`reel-view`, `reel-front`, `reel-screen`, `reel-cut`, `reel-host`, `reel-story`); the approved plan named in [`tracks/orchestrator.md`](tracks/orchestrator.md) runs the expand migration first, then the guest, cut, host, teardown and sweep lanes, one alias build replacing the stored reel, and the drop migration and a one-shot R2 sweep of the stored reel files after its red-team. Ideas at zero storage, since a reel is a recipe:
  - A host featuring one cut on the album, and a shareable cut link.
  - Host pins that open each loop.
  - The uploader's own video window (a trim on `media.clip_start_seconds`/`clip_end_seconds`).
  - A screen link that bypasses the host sign-in (a capability of its own).
  - A counted client event for cuts made per event (no server write exists, by design).
  - Drop the dormant `media.highlight_score` and `clip_*` once the round settles (their names sit in the host's column-scoped select list, so the drop edits that list in the same commit).
- **User profiles and social discovery** (not launch-gating; the consent one-way door is ruled in [`systems/profiles-social.md`](systems/profiles-social.md)):
  - The social feed and discovery (depends on the Notification system).
  - Guest-list sort by upload count (a nudge to contribute).
  - The follow graph has no consumer worth the graph: the Following chip left the dashboard and `getFollowedHostEventCards` (`queries/social.ts`) has no caller, so a followed-hosts feed uses it or it goes by launch.
- **Lab explorations no board asks yet** (each is a board when a seat frees; its brief rechecks the desk for overlap first):
  - Finding one photograph in a thousand (sort, date, person, kind), in the guest album and the host gallery.
  - What an album becomes weeks after the party, since events never end (a keepsake, an anniversary, a nudge to export), narrowed away from `export-flow`.
  - What a host learns about their own event (views, contributors, the photograph everyone liked).
  - The product with a keyboard and a screen reader, end to end.
  - Which surfaces have a dark mode, who can switch, and what a guest gets.
  - One card family for every shared link (the OG routes), and what a shared album's card shows.
  - What a like is here: who sees it, who is told, why the counts are the host's.
  - Whether an album installs to a phone, and who is ever asked to.
  - A failed card, a lapsed pass and a cancelled subscription, as surfaces.
  - A host's "what needs you" that is never empty: one suggested job per event from real state (a queue, paused uploads, a code to print, storage near the cap), one pure function feeding the pulse and the event card.
  - The hub's code as the event's live door (paused uploads dim it, a private event marks it).
  - The in-app notifications' design (the bell, its panel, a state signal versus one that clears), beside the Notification system bucket.
  - The marketing reading surfaces, one board each: a feature page's shape and `/features` as an index; the blog's index and article; Privacy and Terms made scannable; `/about`; applying, from the role page to the operator's inbox; what an AI reader is handed (`llms.txt`).

## Launch checkpoint (far off — a bucket; tasks get assigned here, handled together at launch)

**The clean launch point** ("launch when everything's done"): every published claim is true, every promised path
exists, every backend job is operable from `/admin`, and the switches below flip in a known order with nothing else
pending. Open on the agent side: the two help-catalog gaps left (the restore toast, the report promise), the EXIF
clause's last two sites, legal pages that print, the marketing site at phone widths, the demo event on curated media.
**The `[human]` switches, in order:** counsel sign-off, the DMCA agent, the `privacy@` and `help@` mailboxes →
`LEGAL_PARTY` and both documents effective → Stripe live (the 4 products and 8 prices, the live webhook and portal
with six-price switching verified, the 10 env values, one real-card smoke) → Vercel Pro (the analytics vendor, the
Spend cap, Cloudflare fronting and CSAM scanning at the DNS move, the Realtime quota) → secrets Sensitive,
leaked-password protection, the Sentry alert rule, one DB-backup test-restore → the test-data reset, the demo token
repointed, `PRUNE_MODE=live` → the program teardown.

- A demo event set and ready on every environment: nothing guards `NEXT_PUBLIC_DEMO_QR_TOKEN` (inlined at build), so a deploy without it ships a footer without the code.
- Enable leaked-password protection (HaveIBeenPwned) `[human]`: not Pro-gated, so it can flip any time; the long-standing advisor WARN.
- Enable passkeys `[human]`: the Supabase dashboard (Auth) with the RP id on the apex, then `NEXT_PUBLIC_PASSKEYS=1` (the account page's card is wired and dark).
- Raise Supabase Auth's email rate limit `[human]` (100 an hour project-wide; Authentication, Rate Limits) before a large Require-verified-emails event: a 150-guest door in one hour outruns it (the door names the refusal, and the switch is the host's live valve).
- Pick the web-analytics vendor at the Vercel Hobby → Pro cutover `[eng+human]`: Hobby collects pageviews only; Pro activates the wired custom-event taxonomy but bills usage. PostHog gives 1M events a month free, then $0.00005 an event ($50 a million) against Vercel's about $30 a million, and past about 15M events a month its volume tiers ($0.0000295) undercut Vercel, with funnels and session replay beside; the others are Cloudflare Web Analytics (free, shallow), self-hosted Umami and GA4 (free, with a consent banner and ad-block losses; the move if Google Ads enter). The swap is one file (`src/lib/analytics/web.ts`, [`systems/notifications-analytics-growth.md`](systems/notifications-analytics-growth.md)); the same pick decides whether `(app)` mounts the delegated click listener (its `trackAttrs` are inert today).
- The counsel sign-off gate `[human]` ([`systems/trust-safety-forensics.md`](systems/trust-safety-forensics.md)): the privacy policy's and the Terms' forensic-capture disclosure (IP, UA, geo and device UUID per upload), the CSAM incident runbook and NCMEC registration ([`systems/trust-safety-forensics.md`](systems/trust-safety-forensics.md)), the retention schedule (media-lifetime rows, one-year preservation), the pre-strip EXIF capture go/no-go; the eight-item checklist: `git show 44090827:docs/decisions/t1-forensic-csam-policy.md`.
- NCMEC CyberTipline ESP registration `[human]` (the prep note is in trust-safety-forensics.md); if denied, report actively anyway.
- Enable the Cloudflare CSAM Scanning Tool at the DNS move `[human]`: free, and it scans only proxied traffic, so it cannot see presigned R2 media (say so plainly; trust-safety-forensics.md C2).
- Stripe test → live `[eng+human]`: re-create the 4 products and 8 prices in live (three Pro products carrying six recurring prices, monthly and annual each; the Event Pass product carrying the two one-time prices), named WITHOUT the em-dash the test products carry (those names render in Checkout and the portal), and swap the 10 env values (code unchanged); the runbook is [`PRICING.md`](PRICING.md) "Stripe setup".
- Verify the Stripe Billing Portal permits switching between the six Pro prices (monthly and annual) `[human]`: load-bearing, since a Pro host changing storage size is routed to the portal (Checkout refuses a second subscription), so a portal that refuses the swap leaves a paying host no self-serve resize. The default configuration (`bpc_1TcTxWPtjqmVkBwkcAldFEZA`) enables `subscription_update` with `default_allowed_updates: ["price"]` and `proration_behavior: always_invoice`, but the API returns no `products` list; a dashboard look, or a portal session opened as a Pro host, confirms the switch set.
- Revisit the paid-ingress `INGRESS_CAP_MULTIPLIER` (3× the storage cap, billing-caps.md) before the Pro launch `[eng]`: confirm it holds at real scale.
- The monthly ingress meter's operator surface `[eng]`: nothing in `/admin` shows a host's meter and nothing can lift it, while `PRICING.md`'s posture is that a false positive must never quietly block a paying host; beside the multiplier revisit.
- Legal go-live `[human]`, after counsel signs: (1) fill `LEGAL_PARTY` in [`src/lib/constants/legal.ts`](../src/lib/constants/legal.ts) (entity, state, address, DMCA agent) and flip both documents' `status` to `effective` with an `effectiveDate`; `legal.test.ts` refuses a bracketed placeholder once effective, and the flip needs one line of that test (the rehearsed diff: `git show b19e008e^:docs/tracks/legal-billing-truth.md`, Handoff); (2) register the DMCA designated agent with the Copyright Office ($6, renewed every three years) so the Terms' safe-harbor section is true; (3) create the `privacy@partyreel.com` mailbox both documents name, routed to the support inbox.
- Swap the demo event to curated media `[eng+content]`: repoint `NEXT_PUBLIC_DEMO_QR_TOKEN` to a dedicated event with approved media (ASSETS row 5).
- A committed automated RPC integration suite `[eng]`, replacing the per-change rolled-back MCP checks: blocked on `SUPABASE_DB_URL` (the SESSION string on port 5432, never the 6543 transaction pooler) in the three secret places `[human, 15 minutes]`, then a `postgres` devDependency and a third vitest project whose include skips cleanly when the var is unset, so `pnpm test` stays green without it; every test runs BEGIN, exercises the RPC under `set local role`, asserts, ROLLBACKs, then re-asserts row counts. The fully isolated alternative is the Supabase CLI with the Docker local stack (pre-wired in `supabase/config.toml`, db 54322), picked only if production-DB test traffic ever becomes uncomfortable; detail: `git show 44090827:docs/decisions/rpc-suite-blocked.md`.
- Confirm the Sentry email-alert rule fires `[human]`.
- Configure the app project's Vercel firewall `[eng+human]`: no custom configuration exists (the API answers "not found"), so volumetric abuse meets only the defaults.
- Set `crons.disabledAt` on `partyreel-admin` `[eng]`: a second stop behind the purge route's surface guard, so the admin project never runs the purge cron.
- The pre-launch test-data hard reset `[eng]` (the deletion-aware prune ships, so no timing constraint remains).
- Flip the backup prune to live `[human]`: set `PRUNE_MODE=live` in `workers/backup/wrangler.jsonc` and redeploy once the primary is populated (it ships in dry-run, deleting nothing), with the shared `PRUNE_API_SECRET` set in Vercel and by `wrangler secret put`; see [`systems/durability-backups.md`](systems/durability-backups.md).
- Revisit the git workflow for production `[eng]`: when the program ends, decide the standing workflow (straight to `main` for speed, or branches and PR previews once real users arrive).
- **The elevation-program teardown** `[eng]`, when the program's final milestone merges: re-enable Vercel SSO deployment protection (`ssoProtection: all_except_custom_domains`); delete the temporary Stripe TEST webhook endpoint `we_1U1I3GPtjqmVkBwkjUqWGpvR` (the launch-prep preview endpoint; it must NOT survive into the live cutover); remove the preview origin from the R2 `partyreel` bucket CORS and the Supabase auth redirect allow-list; remove the branch-scoped Vercel env vars (`NEXT_PUBLIC_SITE_URL`, `STRIPE_WEBHOOK_SECRET` at launch-prep) and every `DESIGN_PREVIEW_KEY` row on both projects (Production, the unscoped Preview and launch-prep; the two Production rows still hold the old value); delete the `launch-prep` branch and the `lp/*` remnants; decide the post-program fate of the `lp/*` build gate (`vercel.json` `ignoreCommand` → [`scripts/vercel-ignore-build.mjs`](../scripts/vercel-ignore-build.mjs), part of the git-workflow item above); and revert CLAUDE.md's git section to the post-program rule.
- Close the AWS Remotion sub-account (console) `[human]`: the reel renders on the device, so the sub-account under `partyr33l@gmail.com` (the `remotion-lambda-role` / `remotion-user` IAM and the deployed Remotion site and function) has no use.
- Toggle the critical secrets to Vercel "Sensitive" `[human]`: pre-launch every env var is non-sensitive so values stay swappable; at launch the Supabase service-role key, Stripe and its webhook, `CRON_SECRET`, `PRUNE_API_SECRET` and `UNLOCK_COOKIE_SECRET` flip to Sensitive.
- One DB-backup test-restore `[human]`: prove the backup restores before it is the only copy.
- The `help@partyreel.com` mailbox `[human]`: the help center and the documents name it; confirm the receipt path once it exists.
- The marketing site tuned at phone widths, judged on Will's phone `[eng+human]`: every round so far was judged at desktop.
- A per-account throttle on the deletion request `[eng]`: beyond Supabase Auth's own OTP limits it is unlimited; it needs a live session plus a password or an emailed code, so the exposure is a borrowed session rather than a stranger, and the throttle is cheap insurance.
- Submit the apex to the HSTS preload list `[human]`: a one-way door for the domain and every future subdomain (`max-age` already meets the list's requirement; the header ships without `preload` on purpose).

## Speculative / longer-horizon backlog

Bigger ideas that need product reshaping or a decision before they are roadmap-ready (co-hosts, a referral program,
guest-to-full-user conversion, host 2FA, proactive CSAM filtering, NSFW and host trust-level configs, a content CMS, a
Backblaze B2 cross-vendor backup tier, …) are tracked **outside these docs** to keep this file to actual upcoming
work. Pull one in here (as a Now task or a new overhaul bucket) when it is ready.
