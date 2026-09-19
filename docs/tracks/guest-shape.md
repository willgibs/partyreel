---
track: guest-shape
status: open            # open -> handed-off; deleted in the merge commit that integrates it
cut: "236cc03f"            # the launch-prep SHA the branch was cut from
board: guest-shape      # round one: the guest experience's SHAPE from the scan
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/app/(dev)/design/sandbox/guest-shape/
reads:                  # single-sources you depend on: never duplicate, never edit
  - docs/design/rulings.md
  - docs/design/guidance.md
  - docs/systems/guest-flow.md
  - docs/systems/design-system.md
  - src/app/(guest)/e/[token]/page.tsx
  - src/app/(guest)/u/[slug]/page.tsx
  - src/components/guest/event-experience.tsx
  - src/components/guest/guest-header.tsx
  - src/components/guest/entry-shell.tsx
  - src/components/guest/entry-modal.tsx
  - src/components/guest/password-gate.tsx
  - src/components/guest/enter-event-prompt.tsx
  - src/components/guest/ghost-grid.tsx
  - src/components/guest/gallery-empty-state.tsx
  - src/components/guest/live-gallery.tsx
  - src/components/guest/guest-masonry.tsx
  - src/components/guest/guest-share.tsx
  - src/components/guest/save-event-button.tsx
  - src/components/guest/save-account-prompt.tsx
  - src/components/guest/report-dialog.tsx
  - src/components/shared/media-lightbox.tsx
  - src/lib/guest/entry-steps.ts
  - src/app/(dev)/design/sandbox/admin/spec.ts
---

# lp/guest-shape

**Goal.** Round one of `guest-shape`: the guest experience reconceived from the SCAN, its shape first. Will
(2026-09-19, `docs/design/rulings.md`): "Let's treat the full app experience as well as guest pages as
unprotected. Anything and everything is open to relitigate or reconcept from the ground up to begin establishing
a better system from its foundation." Six to eight decisions with `defineExploration`, each drawn on the real
guest components with FIXTURES (an open event with photographs, the same event gated by a password, an event
that requires an account, the empty album) PHONE FIRST at 375 and also at 1440, a recommendation each, every
number measured. The guest pages are the host's event, minimally branded (the ruling of 2026-05-31), and the
galleries now run to the window at 240 px tiles with the header on the gallery's left line (`gallery-wiring`,
2026-09-19): draw on that shape. **Not in this round:** any production byte; the host app (`app-shape`); the
tile grammar and controls (`app-vocabulary`).

**What is measured (the tree at the cut).** One landing (`/e/[token]`) that resolves visibility and access on the
server and wraps whatever it earns in an entry shell (a Vaul drawer on a phone, a centred dialog above) whose
steps (welcome, password, account) are four mechanisms stacked (the adaptive shell, the honest-affordance table,
the arrival beat, the success hold); a locked backdrop drawn as a ghost grid while the empty album is drawn as the
river (two languages for "photos are coming"); the album page as a left editorial shell (name, byline, a stats
line, three buttons, Download all, the masonry, a Report footer) with the product's "Start for free" in the
guest's header; every other guest dialog (Invite, Save, Report, Download all) a plain centred dialog on a phone;
two tones for one "create an account" moment (the warm gate versus the Save dialog's form); no way for a guest to
take a photo back once it lands (the lightbox has the affordance, the guest surface never passes it); no Live
indicator rendered (the doorbell's `live` only steers the poll); `/u/[slug]` with its own thinner header and a 404
that falls through to the marketing chrome; two footers with no rule; reading copy at 15 to 16 px on the happy
path and `text-xs`/`text-sm` on the sentences a guest most needs (the hold-for-approval banner, the gate's error
rows). Eleven seams are listed in the Orchestrator's exploration of 2026-09-19 (`docs/tracks/orchestrator.md`,
"The app round's map"); read them. The behaviour pins in `entry-modal.test.tsx`, `guest-upload.test.tsx` and
`password-gate.test.tsx` guard function, never look: the step order, the dismiss rules, the queue's
one-at-a-time and retry, the five strikes and the cooldown survive whatever shell you draw them on.

**The decisions (suggested; yours to recut, never forced apart).** The DOOR (one continuous door that never swaps
shell type, phone first even on a laptop; the adaptive shell kept with the locked backdrop in the river's
language; welcome and gate collapsed into one screen for the open event, the drama kept for gated ones); NOTHING
HERE YET (one language for locked and empty; two on purpose, each redrawn with the reason; the locked backdrop
folded into the door); the ALBUM'S CHROME (what the header carries and where the actions sit once the album runs
to the edge; the Live signal designed from zero; the growth hook's place, a whisper or a header link); every guest
DIALOG one object (the adaptive sheet promoted to all of them; inline panels instead of modals; modals kept with
the two account moments merged); what a guest can DO about their own upload (a time-boxed remove in the lightbox's
pill; never, said plainly at upload time; a "yours" view inside the album); the ARC to owner (one account surface
reachable from the event and the profile; the profile as the reward screen; light-touch as today in one language);
the FOOTER and the profile's chrome (one rule). The `admin` board is the worked example for a shape board on real
components with fixtures; `gallery-width` for the spec's form.

**Binds.** The bible; the guest rulings (the host's event, minimal branding; guest reading copy at 15 to 16 px);
the anti-abuse pieces out of frame and untouched (the capability token, the presigned URLs, the limiters, the
signed unlock cookie); no em-dashes; the copy is open (bible 21). Mobbin is encouraged, never required: shared
albums, event apps, RSVP and invitation flows.

## Verify, and the gate

- Each step its own exit code: `pnpm design:rules`, the specimen collector, `pnpm typecheck`, `pnpm lint` (the 8
  known warnings), `pnpm test`, `pnpm build`, `pnpm lab:smoke --base http://localhost:3136`,
  `pnpm lab:demo --board guest-shape` (0 failing), with `DESIGN_PREVIEW_KEY` in the environment.
- Every option at 375 and 1440 on the real components with fixtures; a capture of every option beside its words,
  the picture checked against the words; the reading budget.

## Questions (what the goal leaves open; a recommended answer each; the Orchestrator relays them and quotes the answer back)

- (fill)

## System-doc edits (in place, owned facts only; the Orchestrator reads each by eye)

- None expected (lab-only).

## Deferred (ROADMAP one-liners, bucket named)

- (fill)

## Handoff (replaces the chat report)

- (fill: the head SHA, the gates on the synced tree, the lane check pasted, the items one line each, the
  questions and their answers, assets, system-doc lines, deferred lines, look at first)

## Record (one paragraph, past tense, at most eight lines; the Orchestrator fills the merge SHA)

(fill)
