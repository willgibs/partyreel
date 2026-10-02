---
track: crumbs-46
status: handed-off      # open -> handed-off; deleted in the merge commit that integrates it
cut: "a5c42530"            # the launch-prep SHA the branch was cut from
board: none
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/app/(guest)/me/
  - src/app/(app)/me/
  - src/app/(guest)/u/[slug]/
  - src/components/app/user-menu
  - src/components/app/dashboard/page-invite-card
  - src/lib/admin/reports.ts
  - src/lib/admin/reports.test.ts
  - src/components/marketing/sections/pricing/comparison-table
  - src/components/app/event-card.tsx
  - docs/systems/profiles-social.md
reads:                  # single-sources you depend on: never duplicate, never edit
  - docs/systems/admin-observability.md
  - src/components/marketing/system/
---

# lp/crumbs-46

**Goal.** Four ROADMAP crumbs on surfaces nothing else touches tonight: /me for an account without a handle (Will's answer A), the closed strike line's repeated date, /pricing's sticky plan head at 1024 and up, and event-card's Open/Closed comment.

## The brief

Each item is a ROADMAP Now line. Read it there whole and retire it in your Handoff's list.

1. **`/me`** (ROADMAP: "Profile: `/me`, the owner mode at an address that needs no handle", Will's answer A to crumbs-44's question, 2026-10-01). A confirmed account without a handle keeps its likes and uploads at `/me`: `OwnerSections` takes no identity, so it is private by construction. `/me` redirects to `/u/<handle>` once a handle exists, and the user menu's handle-less "Your profile" opens it. `components/app/dashboard/page-invite-card.tsx:62` points at the same setup today: decide whether it moves too, and say so.
2. **The closed strike line's repeated date** (ROADMAP: "a dismissed child-abuse report's closed line says one date twice"), in `src/lib/admin/reports.ts`'s `closedStrikeWords`, red on today's code first.
3. **`/pricing` at 1024 and up** (ROADMAP: "when the header hides on scroll, the matrix's sticky plan head stays 64 px down"), in `components/marketing/sections/pricing/comparison-table.tsx`. The head should follow the header.
4. **`event-card.tsx:119`** documents `statusLabel` as "Open/Closed (hosted)"; the word is Open or Paused since crumbs-42 (`uploadsLabel`).

A board cut after your merge draws the dashboard (`page-invite-card`, `event-card`), so leave those screens as they look, beyond what each item needs.

**Starts from.** CLAUDE.md's working loop, the bible's ten and production as it is; the tests say what has to keep
working.

**Verify on.** The gate on the synced tree (CLAUDE.md's four steps), each step on its own exit code; `pnpm lab:smoke --base http://localhost:3134`; a test red on the old code for items 1 and 2; /pricing read at 1024 and 1440 with the header hidden and shown, in a headless Chrome of your own; name /me's signed-in walk for build 40's red-team.

## Questions (a recommended answer each; the Orchestrator relays them)

Each is built as recommended and is Will's to overrule; none is a one-way door (a route, a redirect and a prop).

- **Where does `/me` live, and what does it wear?** In the `(app)` group: the sign-in gate, the app header with her
  menu, and the name gate (`name-gate.test.ts` demands one layout call of every (app) route), titled "Your profile",
  the setup's invitation as its head, then `OwnerSections` unchanged. Option: `(guest)/me` with the profile page's own
  header and footer, so a handle changes the page and not the frame; cost: its own two gates and the album's "Made
  with Partyreel" footer on a private page. **Recommended and built: (app).**
- **Is the invitation there dismissible?** A Not now would take away the only way from /me to the setup (the user
  menu's door used to be the setup itself) and, being the dashboard's one cookie, the dashboard's card too.
  **Recommended and built: standing, no Not now** (`PageInviteCard dismissible={false}`; the dashboard's card is as it
  was). Option: dismissible, /me reading the cookie; cost: an account that said Not now once finds no door on her own
  profile (Account's card still has one).
- **Does `page-invite-card` move to `/me`?** No. The card IS the invitation and its button is the setup's own door;
  sending it through /me would put a stop in front of the setup, the tap crumbs-44 took out of the menu's door. It keeps
  `PROFILE_SETUP_PATH`; the dashboard looks as it did.
- **/me shows the whole owner mode, Connections too.** The ROADMAP line names likes and uploads, but `OwnerSections` is
  one component with three sections and the profile's owner mode is the same three, so a handle changes the page and
  never what she keeps there. Option: hold Connections back until she has a handle (they also live on Account).
  **Recommended and built: all three.**
- **/me joins the sign-in return list** (`return-path.ts`: one regex and one test line, outside `owns`): a session that
  ended under the open menu comes back to the page it asked for, as `/account/profile` did when it was the menu's
  door. Option: leave it out, and a signed-out press lands on the dashboard after sign-in.

## System-doc edits (in place, owned facts only)

- `docs/systems/profiles-social.md`: one bullet for `/me` beside the owner mode's gate (the (app) shell and its two
  gates, no segment or param so no `isSelf`, the standing invitation, the real 307 to `/u/<handle>` and so no
  `loading.tsx`, noindex), and the setup bullet's door line (the menu's handle-less Your profile opens `/me`).

## Deferred (ROADMAP one-liners, bucket named)

- Now · Guests: the album header's account menu (`guest-account-menu.tsx`) has no Your profile row for any account, so
  an account reaches /me (or `/u/<handle>`) only through the app shell's menu, two taps from an album;
  `/api/me/menu` would also return the handle.

## Handoff (replaces the chat report)

Logs and captures: `/Users/gibby/local/ai/partyreel-wt/_scratch/crumbs-46/` (below, `_scratch/`).

- **Commits, pushed:** `09b4bc3c` (the work: /me, the strike line, the plan head, event-card's comments) and
  `fc2bf795` (/me's refusals in the return-path tests), then this manifest alone. **No sync commit:** launch-prep moved
  twice since the cut (`8698a5b8`, `3c2681db`), both the Orchestrator's pickup doc alone
  (`git diff --stat fefe9d30 origin/launch-prep` = `docs/tracks/orchestrator.md`), so no code that touches this lane landed.
- **Gates on `fc2bf795`'s tree, each on its own exit code** (the first test run had one red, `invite.test.ts`'s door list
  naming the user menu, reshaped on purpose below; `_scratch/test-1.log`): `pnpm typecheck` 0 (`gate2-typecheck.log`),
  `pnpm lint` 0 (`gate2-lint.log`), `pnpm test` 0, 734 files and 8,725 tests (`gate2-test.log`),
  `zsh scripts/build-lock.sh pnpm build` 0 (`gate2-build.log`, `/me` in its route table as dynamic),
  `pnpm lab:smoke --base http://localhost:3134` 0, 141 checks and 0 failing (`gate2-smoke.log`; scope event-ready via
  `event-card.tsx`, locked-door via `user-menu.tsx`, the Library). `lab:demo` not run: no board is this lane's, and
  those two draw only a comment and an href that changed.
- **Lane check** (`git diff --name-only origin/launch-prep...HEAD`, plus this file): every line sits under `owns` but four,
  each a single line or a reshaped scar, listed with why:
  - `src/lib/auth/return-path.ts` and `return-path.test.ts`: `/me` joins the sign-in return list (one regex; the page
    list gains it and six lookalike refusals), so a signed-out press returns to it;
  - `src/app/(app)/account/profile/invite.test.ts`: its door list named `user-menu.tsx` as opening the setup, which it
    no longer does (it opens `/me`); the invitation takes the menu's place in the list, the scar (a door names the
    setup's one address, never Account's card) kept and the menu's name dropped, said in its docblock;
  - `src/lib/db/queries/profile.ts`: one docblock line said the menu's handle-less door opens "the claim card on /account".
- **The items** (each retires its ROADMAP Now line, found by its opening words):
  1. **`/me`** ("Profile: `/me`, the owner mode at an address that needs no handle"): `src/app/(app)/me/` (`layout.tsx` the
     name gate, `page.tsx`, `page.test.tsx` 5 cases), the user menu's handle-less Your profile opens it
     (`user-menu.test.tsx`, red on the old code: it read `/account/profile`), `PageInviteCard` gains `dismissible`
     (`page-invite-card.test.tsx`, red on the old code: the Not now stayed), `OwnerSkeleton` extracted to
     `u/[slug]/owner-skeleton.tsx` and shared, `owner-mode.test.ts` reads `/me` too (no params, no identity, the
     redirect before the sections, no public-profile read, no `loading.tsx`), `docs/systems/profiles-social.md`. **`page-invite-card`
     does not move**: it IS the invitation, its button the setup's own door, and a stop at /me would be the tap crumbs-44
     took out of the menu's door; the dashboard looks as it did (default props, the same DOM).
  2. **The closed strike line's date once** ("a dismissed child-abuse report's closed line says one date twice"):
     `closedStrikeWords` says "then" for the bar's date when it prints the same as the strike's
     (`reports.test.ts`: "says a date once ...", red on the old code, which printed "until Mar 14, 2027 UTC; ... until Mar 14,
     2027 UTC"; its across-midnight case, two minutes and two dates, passes on both and guards comparing printed dates, as
     `strikeWords` does).
  3. **/pricing's sticky head** ("/pricing at 1024 and up: when the header hides on scroll"): `comparison-table.tsx`'s
     `STICKY_HEAD` rests on `--mkt-header-h` and takes `top-0` on the header's own hide rule (`comparison-table.test.ts`
     holds the two to one text, red on the old code). Read in a headless Chrome of my own (`_scratch/cdp.mjs`):
     `pricing-head-final.json` (1024 and 1440: bar 0 and head 0 hidden, bar 64 and head 64 shown) and
     `pricing-{before,after}-{1024,1440}-{hidden,shown}.png` (the before shows rows through the band above the head);
     frame by frame `pricing-follow-{1440,1024,1440-reduced}.txt` (arriving, bar and head are the same number every
     frame; leaving, the head is ahead under the bar's glass, never a gap; reduced motion flips both at once);
     `pricing-escapes.json` (with `data-hidden` held, focus inside the bar, a nav panel open and the phone sheet open
     each keep the head at 64, and 0 again once they end); `pricing-lg-edge.txt` (1023 static, 1024 sticky). The build
     keeps the rule: the escaped selector sits in the compiled `@media (min-width:64rem)` block of
     `.next/static/chunks/021~mjjxnz6dm.css`.
  4. **event-card's comment** ("`event-card.tsx:119` documents `statusLabel` as Open/Closed"): that line and a second
     "Open/Closed" in the file's head docblock (`:53`) say Open/Paused (`uploadsLabel`).
- **Verified against the real thing where it can run:** signed out, `GET /me` answers 307 to `/login?next=%2Fme` and
  `/account` 307 (`dev.log`, `GET /me 307`; the `next` value is `return-path.test.ts`'s); `/u/willg` signed out renders as
  before after the skeleton's move (`profile-willg-{1440,375}-light.png`); /me's page over fixtures, 1440 and 375, light
  and dark, empty and full, no sideways overflow (`me-empty-*.png`, `me-full-*.png`: a throwaway route, never
  committed, deleted). The page itself is signed-in only, so its walk is build 40's, below. Doc-checked: Next 16's
  `redirect` (307 outside a streaming context: why `/me` has no `loading.tsx`) and `revalidatePath` (a Server Function
  refreshes every visited page on its next visit and re-renders only the page it was called from when that path is
  revalidated, so `removeMyUploadAction` needs no `/me` entry: the delete's own `drop` is the page's word, as on the
  profile), Tailwind v4's arbitrary variants (`_` is a space; the built CSS grepped above).
- **Build 40's red-team: /me signed in** (accounts, read from `profiles` with a select: `hi@willgibs.com` holds no handle,
  `willg97@gmail.com` holds `willg`, `partyr33l@gmail.com` holds `partyr33l`):
  1. As `hi@willgibs.com`, the avatar menu's Your profile opens `/me`: the h1 "Your profile", the invitation (Set up your
     page, Nothing shows until you finish., Choose what shows, and no Not now), then "Only you can see the sections
     below." and Your uploads, Your likes, Connections, each full or its teaser; 1440 and 375, light and dark.
  2. Delete one of her guest uploads there (the confirm says it is final): the tile leaves at once; go to the dashboard and
     back through the menu: it is still gone. Unlike a photo: it leaves.
  3. Choose what shows opens `/account/profile`; the dashboard's card (when it shows) still has its Not now, and
     dismissing it there does not change /me's card.
  4. As `willg97@gmail.com`, `/me` answers 307 to `/u/willg` with no skeleton first, and the menu's Your profile opens
     `/u/willg` directly.
  5. Signed out, `/me` goes to `/login?next=%2Fme` and, through the chooser, returns to `/me` (or `/u/willg`).
  6. A nameless account (needs a fresh one; `name-gate.test.ts` holds the layout) reaches `/welcome` from `/me`.
- **Assets requested from Will:** none.
- **Board ideas:** /me's head drawn on the real page: the standing invitation card above her photographs (built)
  against a one-line door beside the heading, as the owner's profile has its Edit profile button; the card is the louder
  of the two, and the page's own business is her uploads and likes.
- **Proposed migrations / Worker / Vercel / Stripe / env changes:** none.
- **Calls his to overrule:**
  - `/me` lives in the app shell behind both gates and is titled "Your profile", not on the profile page's own chrome;
  - its invitation stands (no Not now), where the dashboard's stays dismissible;
  - the dashboard's card stays on the setup and does not move to `/me`;
  - `/me` shows all three owner sections, Connections too, though the ROADMAP line names likes and uploads;
  - `/me` is on the sign-in return list (one regex, outside `owns`);
  - the repeated date reads "then", where a restructured sentence was the other way;
  - the plan head follows on the header's arrival clock both ways (leaving, it leads the bar by up to 55 px under the
    bar's glass and the two meet within the bar's 220 ms), where the header's two clocks would need the long selector
    three times.
- **Look at first:** `/pricing` at 1440, scrolled down through the matrix (the head flush to the top) and nudged back up
  (under the bar, together with it); then the red-team walk's step 1, the only part of /me this lane could not see live.
