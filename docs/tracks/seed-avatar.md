---
track: seed-avatar
status: open            # open -> handed-off; deleted in the merge commit that integrates it
cut: "8225bc35"          # the launch-prep SHA the branch was cut from
board: seed-avatar      # round one: the seeded default avatar, a deterministic gradient orb until a photo replaces it
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/app/(dev)/design/sandbox/seed-avatar/
reads:                  # single-sources you depend on: never duplicate, never edit
  - docs/design/rulings.md
  - docs/systems/profiles-social.md
  - src/components/ui/avatar.tsx
  - src/components/social/guest-list.tsx
  - src/components/app/user-menu.tsx
  - src/components/guest/guest-account-menu.tsx
  - src/components/app/account-avatar-form.tsx
  - src/app/(guest)/u/[slug]/page.tsx
  - src/app/(app)/account/page.tsx
  - src/lib/social/cards.ts
  - src/lib/supabase/avatar-storage.ts
  - src/app/theme.css
  - src/app/(dev)/design/sandbox/profile-page/spec.ts
  - src/app/(dev)/design/sandbox/profile-page/fixtures.ts
---

# lp/seed-avatar

**Goal.** Round one of the seeded default avatar, Will's ask by name (2026-09-19, verbatim in `docs/design/rulings.md`):
"A while back, Vercel introduced seed-generated dither avatars, which made new accounts feel way cooler than something
generic. I'd like you to explore https://www.hashvatar.com/ ... so that we can bake our own version into the app for new
accounts until a new avatar is uploaded to replace. I noticed that with both our guest lists and default dashboard,
without avatars/color it feels very bland. This would immediately bring life to all avatar components, without a generic
one being repeated for every new account. Guest lists would feel rich and diverse, even without any custom avatars
uploaded. I like the gradient over dither for our purposes." Today every account without a photo is one letter on
`bg-muted` (`ui/avatar.tsx`'s `AvatarFallback`), on the guest list, the faces row, the dashboard's user menu, the guest
account menu, the account page and the profile's identity row. Research first, then decisions: pull the hashvatar package
into your scratch directory (`npm pack hashvatar`, read its source and README; the site and the GitHub repo too) and learn
its gradient mode exactly (how the string is hashed, how the hue and the four oklch colours derive from it, where the light
source sits, what `animated` does, what `tones` constrains). Then write OUR OWN generator in the board directory, credited
to hashvatar (MIT) in a comment, with zero dependencies and NO canvas: pure functions (`seed -> hue -> palette`) and one
renderer that works in a Server Component (an inline SVG with a radial gradient, or a CSS background), so the guest list,
a server component, can draw it; the wiring lane promotes it into `AvatarFallback`. Draw every option on the REAL avatar
surfaces with the `profile-page` board's 24-name cast (five with a photo, the rest seeded), phone first at 375 with 1440
on the knob. Six to eight decisions; recut them if the drawings argue otherwise:

1. `look`: the orb (one hue, a radial light source, hashvatar's gradient mode); a two-hue diagonal (Vercel's); an aurora
   blend of two hues in the Aurora's own register (seam, throw); the orb with the initial over it. Gradient, never dither
   (his steer).
2. `letter`: the initial stays over the orb at every size; the orb alone; the initial only from 40 px up where it can read.
3. `seed`: the colour derives from the account id (stable across renames, never a leak); from the display name (a person
   can tune their colour by renaming, and a rename changes them everywhere); for an uploader without an account, the
   guest row's id. Never the email or anything private (`profiles-social.md`).
4. `palette`: the full hue wheel with lightness and chroma clamped so every orb reads on the dark ground AND on paper
   (against the ring `after:border-border` and the letter); a curated set of hues; the album's own sampled palette
   (drawn to show the coupling it costs).
5. `motion`: none (avatars are chrome; the motion budget); a slow drift on the profile's own page only; a drift on hover.
6. `after-upload`: the photo replaces the orb whole; the orb persists as the ring behind the photo (the account's colour
   as identity); the orb as the loading state until the presigned photo lands (the profile's cards paint black for
   seconds today, ROADMAP).
7. `the-crowd`, the proof: the faces row and the wrapping chips at 375 and 1440 with 24 seeded guests against today's
   grey letters, with the number of distinct hues and the lowest contrast measured in the frame.

**Binds.** The bible (bible 1, media is the colour: an avatar is a person's colour, not the chrome's; bible 7; no
em-dashes); the `Avatar` contract (`sm` 24, `default` 32, `lg` 40, the ring); the privacy doctrine (nothing private in a
seed); zero dependencies and no canvas (server-renderable); `defineExploration` with one question per decision and every
option drawn on the real surface; the reading budget (`pnpm lab:smoke`); every step's options changing its stage (`pnpm
lab:demo --board seed-avatar`); the registration exception: this lane adds ONLY its own board's lines at the HEAD of
`sandbox/registry.ts`'s registration list, `(shell)/lab/boards.ts`, the `SandboxId` union AND `DESK_ORDER` in
`src/app/(dev)/design/touchpoints.ts` (the Orchestrator moves the id into its leverage place at the merge), plus its
RULINGS row, and nothing else in those files. A generator test beside the board (`// @contract-for:` the generator file):
the same seed gives the same colours; a thousand seeds spread over the wheel; every colour clears a contrast floor against
the ring and the letter at every size.

**Verify on.** The board at 375 and 1440 with reduced motion honoured, `pnpm lab:smoke --base http://localhost:3131`
whole, `pnpm lab:demo --board seed-avatar --base http://localhost:3131` pressing every step; the gate (`pnpm design:rules`,
the specimen collector, typecheck, lint with the 8 known warnings, test, build) each on its own exit code;
`DESIGN_PREVIEW_KEY` in the environment, never on a command line. Lab-only: no production byte.

## Questions (what the goal leaves open; a recommended answer each; the Orchestrator relays them and quotes the answer back)

- none yet

## System-doc edits (in place, owned facts only; the Orchestrator reads each by eye)

- none (lab-only)

## Deferred (ROADMAP one-liners, bucket named)

- none yet

## Handoff (replaces the chat report)

- Head <sha>, pushed; synced with launch-prep at <sha> (or: it had not moved)
- Gates on the synced tree: design:rules ok, specimens ok, typecheck ok, lint ok (8 known), test ok (N), build ok (M pages); `pnpm lab:smoke` ok; `pnpm lab:demo --board seed-avatar` ok (N steps)
- Lane check: `git diff --name-only origin/launch-prep...HEAD` = owned paths + this file + the registration lines (exceptions and why)
- What hashvatar's gradient mode does, in five lines, and what ours keeps and changes
- The decisions, one line each: `<id>: the question; the recommendation and why`
- Assets requested from Will: none
- Proposed migrations / Worker / Vercel / Stripe / env changes: none
- Look at first: ...

## Record (one paragraph, past tense, at most eight lines; the Orchestrator fills the merge SHA)

Merged into `launch-prep` at `<sha>` (<date>). ...
