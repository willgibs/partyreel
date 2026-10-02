---
track: lab-prefetch
status: handed-off      # open -> handed-off; deleted in the merge commit that integrates it
cut: "a5c42530"            # the launch-prep SHA the branch was cut from
board: none
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/components/lab/step.tsx
  - src/components/lab/step.test.tsx
  - src/app/(dev)/design/(shell)/_shell/
  - src/app/(dev)/design/(shell)/lab/
reads:                  # single-sources you depend on: never duplicate, never edit
  - src/proxy.ts
  - src/components/lab/frame.tsx
---

# lp/lab-prefetch

**Goal.** Stop the lab's keyless prefetch 404s on production builds at their source (build 38's red-team LOW), in the shell and the gate only.

## The brief

**The LOW** (ROADMAP: "The lab: a production build logs a 404 for each keyless prefetch"). On a production build the desk logs "Failed to load resource: 404" in two places:
- a board's thumbnail scrolling into view, from a drawing's production `<Link href="#">`. Next prefetches the current route's tree without the query string (`GET /design/lab?_rsc`, segment `/_tree`, no key), and the gate refuses it;
- every step page, through `src/components/lab/step.tsx`'s "Open the whole board", a plain `next/link`.

The shell's own links already take `prefetch={false}` for exactly this.

**Fix it at its source**, so no link drawn on any board, today's or tomorrow's, can do it: the shell's and the kit's frame's links stop prefetching a keyless route (a `prefetch={false}` at every lab link the shell or the frame renders, or one place the frame turns prefetching off for everything drawn inside it, whichever holds for a board's own production `<Link>`). The gate (`src/lib/design-gate/`, `api/design-gate`) is the Orchestrator's and stays as it is; if you find the gate is the only root fix, say so in your Handoff with the change it needs, and ship the link fix.

**Boundaries.** Shell and gate only: no board folder (`src/app/(dev)/design/sandbox/`), and no change to the kit's exports, since boards are cut tonight on them. Name it in your Handoff if the frame (`components/lab/frame.tsx`) must change.

**Starts from.** CLAUDE.md's working loop, the bible's ten and production as it is; the tests say what has to keep
working.

**Verify on.** The gate on the synced tree (CLAUDE.md's four steps), each step on its own exit code; a production build served on port 3135 (`pnpm start -p 3135` after the locked build), the desk and two step pages opened in a headless Chrome of your own with every thumbnail scrolled into view: zero 404s in the console; `pnpm lab:smoke --base http://localhost:3135`.

## Questions (a recommended answer each; the Orchestrator relays them)

- **Should a picture's links prefetch nothing at all, not only nothing keyless?** A link a board draws still prefetches its REAL route from the stage and the desk (the red-team counted about 30 RSC requests a pass: /pricing, /dashboard, /e/...), and `/demo`, whose redirect goes to partyreel.com, is a cross-origin CORS console error on `demo-framing` on any host but the apex (`measure-final-lab.log`, the demo-framing block, on localhost; `src/app/demo/route.ts`). Recommended: no, not now: the red-team called them harmless and the gate's own invariant is what this lane owns; refusing every non-lab prefetch is one more condition in `isKeylessGatePrefetch` if he wants the pictures inert. Built: the narrow guard; his to overrule.
- **Should the gate answer Next's keyless prefetch with something other than a 404?** It would end the request at the server, but a 204 tells anyone who sends Next's prefetch header that `/design` exists, against "an indistinguishable 404". Recommended: no. The gate is untouched and the guard answers in the tab.

## System-doc edits (in place, owned facts only)

- `docs/systems/design-system.md`, "The /design lab": one ★ bullet after the gate's (Next's keyless sibling prefetch, why a frame cannot switch a drawn link off, the lab's own `prefetch={false}` and the `PrefetchGuard`).

## Deferred (ROADMAP one-liners, bucket named)

- Now: the lab: the Library's own links prefetch by default (`library/page.tsx` twice, `library/index-list.tsx`), so a Library index visit sends about 226 keyed prefetches, each a server render of a Library page, though the guard now answers their keyless siblings; `prefetch={false}` on those three links, as `LabLink` has, ends them (from `lab-prefetch`).

## Handoff (replaces the chat report)

Artifacts are in `/Users/gibby/local/ai/partyreel-wt/_scratch/lab-prefetch/` (pruned with the lane): `measure.mjs` drives a headless Chrome of its own over CDP and prints every request the server refused and every console error; its `--guard-off` makes an assignment to `window.fetch` a no-op, so the guard installs into nothing.

- **Commits** pushed to `origin/lp/lab-prefetch`: the work `098ad261`, the system doc `584e27cf`, this manifest (the head, in the chat line). No sync: launch-prep moved by two record commits only since the cut (`8698a5b8`, `3c2681db`, both `docs/tracks/orchestrator.md`), nothing under this lane's `reads` or `owns`.
- **Gates**, each on its own exit code. On `584e27cf`'s tree (`098ad261` plus the doc): `pnpm typecheck` 0 (`typecheck-final.log`), `pnpm lint` 0, no warning (`lint-final.log`), `pnpm test` 0, 735 files and 8,720 tests (`test-final.log`). On `098ad261`, whose code the head carries unchanged: `zsh scripts/build-lock.sh pnpm build` 0 (`build-final.log`) and `pnpm lab:smoke --base http://localhost:3135 --production` 0, 182 checks, 0 failing, the closed door still 404 (`smoke.log`). `lab:demo` not run: no board.
- **Lane check** (`git diff --name-only origin/launch-prep...HEAD`): `_shell/` (markdown.tsx, shell-context.tsx, shell.tsx, and new prefetch-guard.tsx, prefetch-guard.test.ts, prefetch-guard-mount.test.tsx, prefetch-policy.test.ts), `components/lab/step.tsx` and `step.test.tsx`, this file; nothing under `lab/`. One exception: `docs/systems/design-system.md` (the fact this lane refined, "Record subtractively"). The frame, the kit's exports, the gate, `proxy.ts` and every board are untouched.
- **The cause**, read in Next 16.2.6 (`node_modules/next/dist/client/components/segment-cache/scheduler.js:345-384`, `pingRoute`) and seen on the wire: for every prefetched URL that has a query, Next also fetches that path's route tree WITHOUT it. Every lab URL has `?key=`, so any prefetching link into `/design` sends a keyless `GET <path>?_rsc`, segment `/_tree`, which the gate 404s. That is the red-team's request exactly, and it also comes from the step's keyed links, a doc's, the Library's own and every drawn `href="#"` (it resolves to the page it is on): `measure-baseline-steps.log` has the keyless 404 beside the keyed 200 of the same route tree. `probe-baseline-needs.log` shows the step's link mounted keyless at 135 ms (the key is client-only in `useDesignKey`), then keyed at 150 ms.
- **Before** (`fefe9d30`'s build on `next start`, `measure-baseline-*.log`): one refused keyless `/_tree` on each step page (event-ready.needs, .list, .door, locked-door.family, and `/design/lab?session=sample`), on event-ready's whole board and on `/design/lab/kit`; 15, 36, 83 and 113 on the Library's patterns, components, marketing and index pages (247 in `measure-baseline-library.log`).
- **After** (`098ad261`'s build): 0 refused requests on all of those and on the six boards' pages, the tools, tracks, the sample, the Library's index and eight of its pages and two track docs at 1440 (`measure-final-lab.log`, `measure-final-library.log`); 0 refused and 0 console errors on two steps, event-ready's whole board and the kit at 375 and at 1440 (`measure-final-verify-375.log`, `-1440.log`) and with every link hovered on four pages (`measure-final-hover.log`). The only console lines in any run are `demo-framing`'s CORS pair (one request, from a drawn `/demo` link; the Questions), not a 404.
- **What each half does** (`measure-final-guardoff.log`, guard disabled): the per-link fixes alone clear the step pages that have no drawn link (locked-door.family, the kit, the sample) and leave event-ready's whole board and its needs step at 1 each and the Library's patterns at 15, which the guard clears. So both ship.
- **Client navigation still works with the guard on** (`nav-check.mjs`, exit 0): "Open the whole board" and a board link navigate in the same document, the Library's 20 keyed prefetches still go out, none is refused.
- **Items.** (1) `step.tsx`: both "Open the whole board" links say `prefetch={false}`. (2) `markdown.tsx`: the doc reader's link too. (3) `PrefetchGuard` (`_shell/prefetch-guard.tsx`, mounted once in `shell.tsx` beside `LabKeys`): answers a keyless Next prefetch of a `/design` URL in the tab with the gate's 404 before a request exists; a navigation, a keyed prefetch and any other request pass through untouched; in a layout effect, so it lands in the commit that mounts the links. (4) `LabLink`'s note said hover prefetch still applies; in Next 16 `prefetch={false}` turns it off too (`link.js`, and the docs). (5) Tests: `prefetch-policy.test.ts` (a TypeScript-AST scan of the shell, the lab's pages and the kit for a `next/link` without `prefetch={false}`, `LabLink`'s default and callers, and the shell mounting the guard; the admin portal's `admin-prefetch-policy.test.ts` is its model), `prefetch-guard.test.ts` (what it refuses and never touches, held to `proxy.ts`'s own `/design` test), `prefetch-guard-mount.test.tsx`, and `step.test.tsx` (the two links, rendered). Seen to fail: a link's prop removed (the scan and the step test), the guard's mount removed, and its predicate loosened (three of its tests).
- **Why the frame did not change**: "one place the frame turns prefetching off" does not hold for a board's own `<Link>`. `next/link` reads one context (the router) and `links.js` and `scheduler.js` never consult the router it is handed; a null router throws in `useRouter()` in every production component drawn beside it (`navigation.js:146`). The shell's guard is that one place, and it also covers the Library's specimens, which a frame never could.
- **Not exercised: the desk's thumbnails.** All six boards' asks are answered on this tree, so every desk visit drew 0 of 0 thumbnails (`thumbs drawn 0/0`). The same drawings sit in the step stage and the whole board, where their links are observed and prefetch identically (`probe-baseline-needs.log`: the frame's `href="#"` anchors), and the guard keys on the URL, not the tree. An open row means a write to `docs/reviews/*.json`, his ledger; I tried it and the auto-mode classifier refused, rightly, so nothing there was touched. Worth one look on the alias once wave 2's boards put rows on the desk.
- **For the merge:** ROADMAP line 22 ("The lab: a production build logs a 404 for each keyless prefetch ...") is this lane's to delete; it understated the class (the Library logged far more than the lab).
- Assets requested from Will: none
- **Board ideas:** the lane gates run on `pnpm dev`, where Next prefetches nothing, so a production-only console error is only ever the red-team's to find; `lab:demo` already speaks CDP, and one run of it against a locked `next start` build that fails a step on any 4xx its page receives would have caught this at the gate.
- Proposed migrations / Worker / Vercel / Stripe / env changes: none
- **Calls his to overrule:** the guard lives in the shell rather than in a gate answer; it is narrow (keyless `/design` only, the first Question); `LabLink` keeps its unused `prefetch` knob, defaulting to false and held by the scan, so no board cut tonight can fail typecheck over it; the Library's own files are not edited (not this lane's), the guard answers them.
- **Look at first:** `src/app/(dev)/design/(shell)/_shell/prefetch-guard.tsx`, its header is the contract; then the two Questions above.
