---
track: crumbs-69
status: handed-off      # open -> handed-off; deleted in the merge commit that integrates it
cut: "6174f136"            # the launch-prep SHA the branch was cut from
board: none
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/app/(app)/dashboard/[eventId]/page.tsx
  - src/app/(app)/dashboard/[eventId]/reel/
  - src/components/app/event-feed/hub-opened
reads:                  # single-sources you depend on: never duplicate, never edit
  - src/app/(app)/dashboard/actions.ts
  - src/lib/dashboard/opened.ts
---

# lp/crumbs-69

**Goal.** Two hub crumbs from round 15's ROADMAP: the hub counts as an open for Recent and Last opened, and the old reel route sends a live reel to her own hub's reel while a develop is ahead.

## The brief

**The round's direction (Will, standing since round 13, carried by every lane):** never dev-tool-ish (the viewfinder's corners survive only as a focus mark, never a style, and so does nothing of their loading state); a host of 1 to about 10 events first, scaling to hundreds; "all work no play is a boring consumer product": delight where it costs nothing in clarity; nothing depends on a timeline (undated, morning-only and multi-day events all read well); "everything should feel as immediate/responsive/snappy, and anything taking longer should provide clear state feedback and potential interruptibility"; Partyreel runs with no AI managing it (every operator fix ships its `/admin` control); cost is designed like the architecture (every image and video action multiplies at scale). Production is the working version: a pick is the best of what was drawn, never a rule.

**★ Local only:** nothing of yours requests the alias, partyreel.com or any *.vercel.app (Hobby's Active CPU). Port 3000 is Will's desk; 3132 is another lane's; yours is 3131.

**The fixes**, each pinned by a test that fails on the old code:
1. **The hub counts as an open.** Today only a press from the dashboard stamps `events.host_opened_at` (`noteEventOpenedAction`, `src/app/(app)/dashboard/actions.ts`; `HomeShell`'s listener), so a deep link, the bell or an email never reaches Recent or Last opened.
   - Mount a small client component on the hub (`/dashboard/[eventId]`) that calls the same action once on mount, as `MarkWelcomedOnMount` does.
   - The action's own once-a-minute filter keeps a reload cheap.
   - It costs one Server Function call a hub visit: say so, and keep it at that (never a poll).
2. **The old reel route** (`/dashboard/<id>/reel`, a redirect) sends a live reel to the guests' page, which has no reel before the develop. While a develop time is ahead, send it to the hub's `?reel`, her own reel (hub-strip-wiring, merged); after the develop, as today.

Wiring rigor: the whole gate. Work economically, with no helper agents; push a WIP commit at each step (this account's weekly usage is near its end).

**Starts from.** CLAUDE.md's working loop, the bible's ten and production as it is; the tests say what has to keep
working.

**Verify on.** The gate on the synced tree (CLAUDE.md's four steps), each step on its own exit code; `pnpm lab:smoke --base http://localhost:<port>` when the lane changes anything under `src/` but tests (it crawls what the change reaches: the Library, and every board whose drawings import a changed file); and the surfaces the Handoff is judged on, local and live.

## Questions (a recommended answer each; the Orchestrator relays them)

- **Does the hub's stamp spare itself when the dashboard's press just stamped the same event?** Recommended and built: no, the hub asks once on mount whatever brought her (the brief's "one Server Function call a hub visit"), so a press from the dashboard now asks twice, `HomeShell`'s at the press and the hub's on mount, the second finding no row to move behind the database's minute filter. Not built: sharing `HomeShell`'s per-tab clock (its `stamped` map is private to `home-shell.tsx`, and `opened.ts` is read-only here), nor dropping the press's stamp (the print door is a press into an event that is no hub: Deferred).
- **Where a live reel goes on the old door while a develop is ahead.** Recommended and built: her own hub's `?reel` (the Reel card's own press, on the same `developState`), and only for a reel that plays; a reel that cannot (switch off, platform lever off, under two photographs) goes to the hub without `?reel`, as before, where the card says why (the hub drops a `?reel` it cannot play anyway). Not built: sending every develop-ahead press to `?reel`, which would put a `?reel` on the address that the hub then has to take off again.
- **Does a hub that loads in a background tab count?** Recommended and built: yes, a hub that mounts is an open (a link opened from an email in a new tab is one she meant to open); there is no visibility gate, and a tab brought back to the front asks nothing more.

## System-doc edits (in place, owned facts only)

- `docs/systems/dashboard.md`: the Recent row's bullet: the hub stamps itself on mount (`HubOpened`), so a deep link counts; one Server Function call a hub visit, never a poll, so a press from the dashboard asks twice. It replaces "a deep link is not counted until the hub mounts the same stamp".
- `docs/systems/reel.md`: the Reel card's bullet: the old `/dashboard/<id>/reel` redirect plays her own reel over the hub while the develop is ahead, as the card does.

## Deferred (ROADMAP one-liners, bucket named)

- Dashboard: a press into a hub asks twice now (`HomeShell`'s stamp at the press, then `HubOpened`'s on mount, the second a no-op write behind the minute's filter); narrow `openedIdOf` (`lib/dashboard/opened.ts`) to the doors that are no hub (`/dashboard/<id>/print`, `act-door.tsx`) so the listener stamps the print door alone and a press into a hub asks once.

## Handoff (replaces the chat report)

- **Work head `b0ed3b347`, pushed (`origin/lp/crumbs-69`); the first step is `517237c68`. No sync:** launch-prep had not moved since the base (`85ae56043`, fetched again at the handoff) and `git merge-tree --write-tree origin/launch-prep HEAD` is clean. The chat line's sha is this manifest's own commit on top (docs alone).
- **Gates on `b0ed3b347`, each on its own exit code** (`_scratch/crumbs-69/`, the logs beside this lane's worktree): `pnpm typecheck` 0 (`typecheck.log`; it ran on the head's own content, the formatter changed nothing after), `pnpm lint` 0 (`lint.log`, no output), `pnpm test` 0 (`test.log`: 914 files, 11,253 tests, the two new files adding 20), `zsh scripts/build-lock.sh pnpm build` 0 (`build.log`). `pnpm lab:smoke --base http://localhost:3131 --timeout 90000` 0, 156 checks, 0 failing (`smoke.log`; its scope is the Library, the shell and the four boards that import `src/lib/event/sections.ts`, which this lane touched by two comment lines). No `lab:demo` (no board). Doc-check: Next 16.2.6's own docs in `node_modules/next/dist/docs` (`mutating-data.md` § useEffect, the mount-time Server Function pattern and its "one at a time" note; `redirect.md`: a relative path with a query, from a Server Component) and Context7 `/vercel/next.js` (the same two pages); Strict Mode's doubled effect is `mark-welcomed.tsx`'s precedent.
- **Lane check** (`git diff --name-only origin/launch-prep...HEAD`): the owned paths (`page.tsx`, `reel/page.tsx`, `reel/page.test.tsx`, `hub-opened.tsx`, `hub-opened.test.tsx`) and this file, plus these exceptions, none claimed by a live lane (the live manifests own sandbox boards and compute-presign's R2 files):
  - `src/app/(app)/dashboard/[eventId]/event-not-found.test.tsx`: one `vi.mock` line for `HubOpened`. The hub's page now imports a component that imports the real `actions.ts`, whose `server-only` chain vitest cannot resolve ("Failed to resolve import "server-only" from src/lib/db/mutations/events.ts", seen without the line); the test already mocks every component a found page draws.
  - `src/lib/event/sections.ts`: two comment lines (`legacyRoomAddress`'s docblock said the reel door plays in the guests' view or returns to the hub; it now says the develop-ahead case too). No code.
  - `docs/systems/dashboard.md` and `docs/systems/reel.md`: the System-doc edits above.
- **The hub counts as an open.** `HubOpened` (`src/components/app/event-feed/hub-opened.tsx`, new) calls `noteEventOpenedAction(eventId)` once on mount in a transition, as `MarkWelcomedOnMount` does, and draws nothing; the hub's page mounts it after the not-found answer (`page.tsx`, after `SetCrumbs`), so a gone or foreign event is never stamped. One Server Function call a hub visit and never a poll, said in its docblock, in the page's comment and in `dashboard.md`. Pinned by `hub-opened.test.tsx` (7 tests): once on mount with the event's id and nothing drawn; once under Strict Mode; ★ never again as the page re-renders, the tab is shown, focused or comes back online, nor over three hours of fake time; the next event when handed another and never the same twice; a fresh mount (Back into the hub) stamps again; a failed stamp stays quiet; and the page's own wiring read off its source (the import, one mount handed `event.id`, after `if (!event) return <AppNotFoundScreen />;`). Checked against the old tree: with `page.tsx` reverted the wiring test fails ("expected ... to match /import \{ HubOpened \} ..."); the other six have no old code to run on (the module is new). The action is untouched, so its public-endpoint pins (`actions.test.ts`: a forged id, a table or a timestamp is never the caller's) stand. The build wires it: `.next/server/server-reference-manifest.json` lists `noteEventOpenedAction` (id `40f352541584e4b335945a2fd07e876a1b5dd97917`) for `app/(app)/dashboard/[eventId]/page` beside `app/(app)/dashboard/page`.
- **The old reel route.** `reel/page.tsx`'s `whereItGoes`: a live reel goes to `/dashboard/<id>?reel` (her own reel over the hub, the Reel card's own press) while `developState(event.develops_at)` is `waiting`, and to `/e/<token>?reel` otherwise; anything that is not live goes to the hub as before. Pinned by `reel/page.test.tsx` (13 tests), two of which fail on the old route code (checked with the old file put back: "Expected /dashboard/6f1c2c9e-...?reel, Received /e/tok_9XkQ2mWv?reel": a develop ahead, and the same event a minute after its develop time, which must go to the guests' page); the other eleven hold the answers that did not change: no develop set, a develop reached, the develop's own instant (developed), a time that does not parse (no develop), and the seven that cannot play (one short, with a develop ahead and with none; none, develop ahead; the switch off and the platform lever off, each with and without a develop). `not-found.test.ts`'s pinned line `if (!event) return <AppNotFoundScreen />;` is kept, and `event-not-found.test.tsx` still passes for this route.
- **The two docs** (`dashboard.md`'s Recent row bullet, `reel.md`'s Reel card bullet) say both, in place.
- **Not run:** the alias or any live pass (this lane may not request it); a signed-in hub in a browser. Sign-in returns only to localhost:3000 (Will's desk), and the 3131 server cannot finish the Google chooser (a redirect off the allow-list would land on partyreel.com, which this lane may not request), so the stamp's round trip (the hub's mount, the action, `events.host_opened_at`) and the redirect's landing are held by the tests, the build's wiring above and the code reading, never seen in a browser. A signed-out request to the hub and to the old reel route on the 3131 dev server both answer `307 /login?next=...` (the proxy's gate; `dev.log`).
- Assets requested from Will: none.
- Board ideas: none.
- Proposed migrations / Worker / Vercel / Stripe / env changes: none.
- Calls his to overrule: a hub that loads in a background tab counts as an open (no visibility gate); the old door's `?reel` only for a reel that plays, and only while the develop is ahead; the hub's stamp asks again though the dashboard's press just did (a press from the dashboard asks twice until the Deferred line lands).
- ROADMAP entries this retires (the Orchestrator's records): the two "Host:" lines (the hub counts as an open; `/dashboard/<id>/reel` while a develop is ahead).
- Look at first: `hub-opened.tsx` (the whole component and its docblock), then `reel/page.tsx`'s `whereItGoes`, then the two test files. For Will's ten seconds on the desk build (3000): paste an event's hub address into a tab (not a press from the dashboard) and open the dashboard: the event is first under the Display menu's Last opened sort (or in the Recent row, from seven events), unless a stamp inside the last minute left it as it was. And on an event with a develop time ahead and two playable photographs, open `/dashboard/<id>/reel` by address: it lands on the hub with her reel playing and the dock's "Guests get it at the develop."; with the develop reached it goes to `/e/<token>?reel`.
