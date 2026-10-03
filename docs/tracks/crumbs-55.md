---
track: crumbs-55
status: handed-off      # open -> handed-off; deleted in the merge commit that integrates it
cut: "8c2dce39"            # the launch-prep SHA the branch was cut from
board: none
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/lib/security-headers
  - src/lib/dashboard/next-step
  - src/app/(dev)/design/(shell)/library/foundations/
  - src/app/(marketing)/(cinema)/about/page.tsx
  - src/components/marketing/legal/legal-document.tsx
  - src/components/marketing/sections/how-it-works/host-pictures.tsx
reads:                  # single-sources you depend on: never duplicate, never edit
  - docs/systems/database-security.md
  - src/lib/event/sections.ts
  - src/app/(as-guest)/
  - src/components/app/share/
  - src/components/app/create-event-wizard/
  - docs/systems/design-system.md
---

# lp/crumbs-55

**Goal.** Four crumbs from tonight's merges: the app refuses any other site's frame (clickjacking), the dashboard's next-step chip links its room directly, the brand kit names the five grounds and the new tokens, and How it works' Create picture draws the room.

## The brief

**Why.** Tonight's merges (round 13's `rooms-wiring`, `identity-wiring`, `wizard-wiring`) left these crumbs, each a ROADMAP line:
1. **Security** (from `rooms-wiring`): the app answers any site's frame (no `frame-ancestors`, no `X-Frame-Options`), so a page can be clickjacked. Add `Content-Security-Policy: frame-ancestors 'self'` and `X-Frame-Options: SAMEORIGIN` to every response through `next.config.ts`'s `headers()` (a root file no manifest may own: it is accepted outside your owns, for this alone), beside what it already sends (read it first; keep every existing header). See it as a guest (`/dashboard/<id>/as-guest`, `src/app/(as-guest)/`) frames the app's own pages and must keep working, so check how it draws before choosing. A test pins both headers on a page, an API route and the as-guest frame. Check the admin project too (same repo, its own config?): name what it sends in your Handoff.
2. **The dashboard's next-step chip** (from `rooms-wiring`): `lib/dashboard/next-step.ts` still links `/guests#at-the-door`, answered by the route's redirect. Link the room directly with `sections.ts`'s `roomHref`, the hop gone.
3. **The brand kit** (from `identity-wiring`): the Library's foundations list four grounds and no `--signal` or `--display*`. Add the fifth ground (`.surface-display`) and the new tokens, as `globals.css` now has them. Two comments still name the old room's `#040405` (`about/page.tsx`, `legal-document.tsx`): make them true, comments only (the legal text itself is never edited before launch).
4. **How it works' Create picture** (from `wizard-wiring`): `host-pictures.tsx`'s `CreatePicture` still draws a Details, Design, Share rail Create has not had since first-event. Draw the room as `create-event-wizard/` now has it: steppers on top, the question in one place, the answer in the centre, one button at the foot.

Retire the four ROADMAP lines in your Handoff (the Orchestrator deletes them). Red first where a test can hold it.

**Starts from.** CLAUDE.md's working loop, the bible's ten and production as it is; the tests say what has to keep
working.

**Verify on.** The gate (CLAUDE.md's four steps, each on its own exit code); `pnpm lab:smoke --base http://localhost:3131`; a `curl -sI` of your dev server's home, an API route and the as-guest page showing both headers; How it works' picture captured at 1440 and 375 in your Handoff.

## Questions (a recommended answer each; the Orchestrator relays them)

- **The brand kit's Elevation legend still draws the body's popover as its menu** (`foundations/elevation-legend.tsx`: hand-copied `bg-popover ... ring-foreground/10`, captioned "DropdownMenuContent's own surface in place"), and production's menus are the display now (`floatingDisplayPanel`, `ui/dropdown-menu.tsx`). Recommended: draw it with `floatingDisplayPanel` and `floatingRow`, so it follows by construction, then read the four heights once on it. Not built here: it changes the legend he praised, and it is not one of the four crumbs.

## System-doc edits (in place, owned facts only)

- `docs/systems/architecture.md`, "One app, one domain": one bullet, the security headers' one home (`src/lib/security-headers.ts`), that the portal sends what the app does, `'self'` never `'none'`, a frame's `src` staying root-relative, and that a full CSP must carry `frame-ancestors` too.

## Deferred (ROADMAP one-liners, bucket named)

- Design: `src/app/(app)/dashboard/new/page.tsx` and its `page.test.tsx` still set the Create page's `themeColor` to `#040405`, the old room's sRGB; the room is `#020202` (the root layout's dark value, converted from `oklch(0.085 0.003 286)`) (from `crumbs-55`).
- Marketing: `lib/constants/how-it-works.ts`'s header (`:18-22`) still says the wizard writes the row "at the end of the Design step"; it is the look screen now (from `crumbs-55`).
- Host: `NextStep`'s `label`, `short` and `href` (`lib/dashboard/next-step.ts`) have no reader but their test: `attention.ts` reads only `kind`, and `act-door.tsx` builds its own `roomHref`; delete them or give them a reader (from `crumbs-55`).
- Design: the Elevation legend's menu is the body's popover and not the display (the Question above) (from `crumbs-55`).
- Security: ROADMAP's CSP line ends "and `X-Frame-Options` / CSP `frame-ancestors` once that question settles": that tail shipped; the report-only then enforced CSP stays, and must carry `FRAME_ANCESTORS` (`security-headers.ts`) (from `crumbs-55`).

## Handoff (replaces the chat report)

- **Commits, pushed:** `31671116` (crumbs 1 and 2), `61f7610a` (crumbs 3 and 4 and the doc line), `9e4466fd` (the headers test also walks the one `route.tsx`), then this manifest alone (its sha is the chat line). `launch-prep` moved to `9d3bf168` (create-wizard-r3's board under `sandbox/create-wizard/`, and records): nothing I own or read (`git diff --name-only ed7b480d origin/launch-prep` holds no path of `owns` or `reads`), so no sync commit.
- **Gates, each on its own exit code, on the tree at `9e4466fd` (the head's code; this manifest is the only later change):** `pnpm typecheck` 0 (`_scratch/crumbs-55/typecheck-3.log`); `pnpm lint` 0, no output (`lint-3.log`); `pnpm test` 0, 827 files and 9,751 tests (`test-3.log`); `zsh scripts/build-lock.sh pnpm build` 0 (`build-3.log`); `pnpm lab:smoke --base http://localhost:3131 --production --key <preview key>` against `pnpm start` on 3131, 0: 195 checks, 0 failing (`lab-smoke-production-final.log`). No `lab:demo`: `board: none`.
- **Lane check** (`git diff --name-only origin/launch-prep...HEAD`): this manifest; `src/lib/security-headers.ts` and `.test.ts`; `src/lib/dashboard/next-step.ts` and `.test.ts`; `src/app/(dev)/design/(shell)/library/foundations/` (`page.tsx`, `grounds.tsx`, `ground-list.ts`, `ground-list.test.ts`); the two comment files; `host-pictures.tsx`. Exceptions: `next.config.ts` (the brief's own: it imports the module and returns it from `headers()`, its inlined copy gone); `src/components/marketing/mock-parity.test.ts` (three additive quote pins, so Create's picture cannot strand again as its rail did: outside `owns`, a data block in the file whose own header says to add them); `docs/systems/architecture.md` (above).
- **1. Security:** both headers on every response, one home. `src/lib/security-headers.ts` holds the whole set (HSTS, nosniff, Referrer-Policy, Permissions-Policy as they were, plus `Content-Security-Policy: frame-ancestors 'self'` and `X-Frame-Options: SAMEORIGIN`), and `next.config.ts` returns it. `security-headers.test.ts` reads it as the server does (Next's own path-to-regexp, a later rule overriding an earlier key) against a page, a route handler, the as-guest address, the portal, the proxy's 404 rewrite, a static asset, and every page and route handler under `src/app` (84 and 48); a source narrowed to exclude `/api/` turned it red (checked, then restored).
  - **As-guest:** it frames the app's own page (`share/as-guest-stage.tsx`, an iframe of the root-relative `/dashboard/<id>/as-guest?in=hub`), so `'self'` keeps it and `'none'` would have broken it; the stage's own test pins the `src`, and the headers test pins that `asGuestHref` stays root-relative (an absolute URL is another origin on a preview alias). The lab's frames are same-origin too: a lab board's route frame (`/design/sandbox/identity/scene`) loaded and was readable under the new headers.
  - **Proof (all in `_scratch/crumbs-55/`):** `curl-after-dev.txt` (3131 dev: home 200, `/api/guests` 405, the as-guest page 307 to `/login`, `/pricing`, `/robots.txt`, `/admin` 404, the proxy's `/surface/not-served` 404, a static 404: all six headers each); `curl-after-production-build.txt` (the same on `pnpm start`; `.next/routes-manifest.json` holds one rule, `/:path*`, with all six) and `curl-after-production-build-final.txt` (the head's own build: home, `/api/guests`, the as-guest redirect). In a real browser (the Browser pane, my own tab), a page on `127.0.0.1:3131` framing `localhost:3131` is refused with "Framing 'http://localhost:3131/' violates the following Content Security Policy directive: "frame-ancestors 'self'"" while a same-origin frame renders the page (`frame-after-cross-blocked-same-ok.jpg`); the same cross-origin frame of today's deployed `https://partyreel.com/pricing` loads (`frame-before-production-framable.jpg`: the clickjack, before).
  - **The admin project:** same repo and the same `next.config.ts` (`vercel.json` has no headers; `partyreel-admin` differs by `NEXT_PUBLIC_SURFACE` alone). Today, deployed, `admin.partyreel.com` sends the four old headers and no frame header (`curl-before-live.txt`); after this deploys it sends the same six as the app. Under `NEXT_PUBLIC_SURFACE=admin` locally every path of its surface carries both: `/` 307, `/admin` 404 (off the admin host), `/login` 200, `/pricing` rewritten to the 404, `/api/cron/purge` 401, `/robots.txt` 200 (`curl-after-dev-admin-surface.txt`). No admin page frames anything (`<iframe` is only in `as-guest-stage.tsx`, the lab's `frame.tsx` and the help's `phone-document.tsx`, whose `srcDoc` is no network response), so the portal needs no wider policy.
  - **Not done, the Orchestrator's alias pass:** a signed-in host's hub opening As a guest (the one thing the headers could break; sign-in cannot run on localhost), and `curl -sI` of the alias and `https://admin.partyreel.com/` after the deploy, each showing `content-security-policy: frame-ancestors 'self'` and `x-frame-options: SAMEORIGIN`.
- **2. The next-step chip:** `nextStepForEvent`'s door step links `roomHref(event.id, "guests")` (`/dashboard/<id>?room=guests`), the hop through the retired `/guests` route gone; At the door heads the Guests room, so the old `#at-the-door` landed in the same place. Red first: `next-step.test.ts` pinned the room's address (failed on `/dashboard/e1/guests#at-the-door`), and that `roomOfHref` reads it as the Guests room.
- **3. The brand kit:** the foundations page has a Grounds group (five tiles, each wearing its real class: paper, the room, the slab, the mat, the display; `grounds.tsx`), The display's tokens drawn on the display (`--display`, `-step`, `-foreground`, `-muted`, `-edge`) and Signal beside Destructive. `ground-list.ts` is the list and `ground-list.test.ts` holds it against `globals.css` (every `.dark` or `.surface-*` that declares `--background`, every `--display*`, the Signal swatch), red before the page named them. The two comments (`about/page.tsx`, `legal-document.tsx`) say `#020202`, comments only. Captured at 1440 light and dark and at 375: `brandkit-*.jpg`.
- **4. How it works' Create picture:** `CreatePicture` draws the room as `create-event-wizard/` has it, at the commit moment (the look screen): her name over the three hairlines with Back and the close, "Pick the code's look" and its line, the phone held up in front of the room's screen over four looks (Classic chosen), and one "Create event" at the foot, on `.surface-ink` so it is dark on paper, the cinema, the help article (`how-partyreel-works`, `loop-create`) and the welcome tour's first beat; checked on how-it-works at 1440, 800 and 375, the home's stepper and the help page at 375 (the welcome is signed-in only and was not walked). Captured on the production build: `create-picture-1440-production-build.jpg`, `create-picture-375-production-build.jpg`. Its three quoted strings are pinned to the wizard in `mock-parity.test.ts` (red against the old picture: it held none of them).
- **Assets requested from Will:** none (the picture uses the look step's own stand-in photograph, `party-dj`).
- **Board ideas:** none beyond the Question and the Deferred lines above.
- **Proposed migrations / Worker / Vercel / Stripe / env changes:** none; both Vercel projects take the headers from their next deploy of this tree, with no setting changed. Retire the ROADMAP lines that open "Design: the brand kit (`/design/library` foundations) lists four grounds", "Design: two comments still name the old room's `#040405`", "Security: the app answers any site's frame", "Host: the dashboard's next-step chip" and "Marketing: how-it-works' Create picture", and trim the tail of the CSP line (the Deferred bullet above).
- **Calls his to overrule:** (1) `'self'` over `'none'`, so As a guest keeps working and nothing else may frame the app; an embed of an album on another site, if one is ever wanted, widens one path. (2) The Create picture is the look screen (the commit moment, as the old one drew Design) and stands on the slab `.surface-ink` (0.165), a step above the real room (0.085), because a `.dark` may never nest in a paper chapter and the picture stands on paper, the cinema and the help; the alternative is a second hand-set near-black. (3) The Grounds are five tiles in a column, one row each, with the media well left to the Gallery group beneath.
- **Look at first:** `curl-after-production-build.txt`, then the two frame captures, then `/design/library/foundations#grounds` and `/how-it-works` (the Create step) at 375.
