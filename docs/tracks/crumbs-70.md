---
track: crumbs-70
status: handed-off      # open -> handed-off; deleted in the merge commit that integrates it
cut: "698acd8f"            # the launch-prep SHA the branch was cut from
board: none
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/app/api/stripe/change-plan/
  - src/components/app/dashboard/display-menu.tsx
  - src/components/social/profile-actions-menu.tsx
  - src/components/app/dashboard/stage-lit.tsx
  - src/components/app/create-event-wizard/
reads:                  # single-sources you depend on: never duplicate, never edit
  - src/components/ui/floating-layer.ts
  - src/lib/billing/plan-facts.ts
---

# lp/crumbs-70

**Goal.** Three ROADMAP crumbs: a switch from /pricing's hop says the uploads sentence; two menus read the floating gutter's name; the lit stage's lamp ignites once as she lands from Create.

## The brief

**The round's direction (Will, standing since round 13, carried by every lane):** never dev-tool-ish (the viewfinder's corners survive only as a focus mark, never a style, and so does nothing of their loading state); a host of 1 to about 10 events first, scaling to hundreds; "all work no play is a boring consumer product": delight where it costs nothing in clarity; nothing depends on a timeline (undated, morning-only and multi-day events all read well); "everything should feel as immediate/responsive/snappy, and anything taking longer should provide clear state feedback and potential interruptibility"; Partyreel runs with no AI managing it (every operator fix ships its `/admin` control); cost is designed like the architecture (every image and video action multiplies at scale). Production is the working version: a pick is the best of what was drawn, never a rule.

**★ Local only:** nothing of yours requests the alias, partyreel.com or any *.vercel.app (Hobby's Active CPU). Never a Stripe object or key: the change-plan route's tests mock Stripe as they do today.

**The fixes**, each pinned by a test that fails on the old code:
1. **A Pro host's switch from `/pricing`'s hop** (the checkout button's `already_subscribed` re-post to change-plan) carries no uploads sentence (`uploadsPauseNote`, crumbs-64). The change-plan route answers the notice, and the hop shows it before it redirects. The plan sheet's own switch keeps its words. Never block what the webhook allows; the webhook stays the sole writer of the tier.
2. **Two menus** (`dashboard/display-menu.tsx`, `src/components/social/profile-actions-menu.tsx`) type `collisionPadding={8}`, the number `floatingGutter` (`ui/floating-layer.ts`) now names: read it.
3. **The lit stage's lamp ignites once as she lands from Create.** host-dashboard r3's drawing lit it on arrival; production's wired `LampLight` has no ignition. Create tells the dashboard she just made the event (a flag on the landing: a query parameter Create sets, read once and removed from the address), and the stage plays the ignition once. Reduced motion lands lit at once.
   - Create's files are yours only for setting that flag. If another file must change, it is an exception named in your Handoff.

Wiring rigor: the whole gate. Work economically, with no helper agents; push a WIP commit at each step (this account's weekly usage is near its end).

**Starts from.** CLAUDE.md's working loop, the bible's ten and production as it is; the tests say what has to keep
working.

**Verify on.** The gate on the synced tree (CLAUDE.md's four steps), each step on its own exit code; `pnpm lab:smoke --base http://localhost:<port>` when the lane changes anything under `src/` but tests (it crawls what the change reaches: the Library, and every board whose drawings import a changed file); and the surfaces the Handoff is judged on, local and live.

## Questions (a recommended answer each; the Orchestrator relays them)

- **Where does the ignition ride, when Create has no landing on `/dashboard`?** After the event exists Create leaves by
  Get it ready (into the event's Settings) or the room's close, "Go to your event" (the hub); `/dashboard` is reached
  later, by the hub's breadcrumb or the app's header. A parameter on a landing has nothing to ride. **Recommended, built:**
  Create leaves the new event's id in the tab (`sessionStorage`, `create-event-wizard/just-made.ts`, written the moment
  the event exists); the first lit stage that draws that event plays the ignition and spends the flag, so it fires the
  first time she goes home in that tab and never after. It is read as a store, so the server never draws it (hydration
  matches) and a client navigation paints the lamp dark from its first frame. Will's to overrule: if the close should
  land on `/dashboard` (it duplicates Get it ready's destination today), change that one `href`, and the flag becomes a
  parameter `LampLight` reads once; I did not move an exit the verdicts settled (`landing=beat`, `create=hand`).
- **How long does the hop hold the way to Stripe for the sentence?** **Recommended, built:** the sentence as a plain toast
  and the redirect held 5 s (one reading of 22 words), the button saying it is working meanwhile and the toast carrying
  a "Stay here" that stops it, as does leaving the page (the round's standing "potential interruptibility"): never a
  refusal and never a confirm (the webhook allows the switch, and Stripe's page is the confirm). Will's to overrule: a
  Continue action on the toast instead (a click more, and the page never leaves mid-sentence), or no hold.
- **The route says the sentence only for a step down in the uploads allowance** (`target.uploadsBytes <
  current.uploadsBytes`), so an upgrade and her own size at the other billing never pay the ledger read and never warn;
  the sheet's card says it for any size at or below this month's uploads that is not her own size. They differ only for a
  bigger size already at or below what she has uploaded (she is paused already): there the sheet says "would pause" and
  the hop says nothing. Left as is.

## System-doc edits (in place, owned facts only)

- `docs/systems/billing-caps.md`: the uploads-sentence fact gains the hop's half (change-plan answers `notice`, the
  CheckoutButton shows it and holds one reading, as a timer of its own: the transition-entanglement landmine).
- `docs/systems/dashboard.md`: the lit stage's fact gains the ignition (the tab flag Create leaves, the one read, reduced
  motion).

## Deferred (ROADMAP one-liners, bucket named)

- Design: the Library draws no production `Stage` in its lit state (the host-dashboard board draws its own `EmptyStage`), so
  the ignition has no specimen `lab:smoke` renders or Will can replay; one specimen with a replay key would.
- Billing: the storage list's switch (`storage-list-body.tsx`, through `storage-source.tsx`) is a third client of
  change-plan and says no uploads sentence either; the route's `notice` is there for it to show as the hop does.
- At the record, delete the three ROADMAP lines this lane finished: Design's two menus (`collisionPadding={8}`), Billing's
  `/pricing` hop sentence, and Create's flag for the lit stage's lamp.

## Handoff (replaces the chat report)

- **Pushed:** `lp/crumbs-70`, seven code commits (`e0457eb91` the menus; `1ac463107` the route's `notice` and the hop;
  `edf2a1b67` the lamp and Create's flag; `38ea4223a`, `4245ef703`, `44cb913d9` the hop's hold, each refined after reading
  or driving it) and the manifest and doc commits. launch-prep had not moved (`origin/launch-prep` = `076f6f2c8` at the
  last fetch), so there is no sync commit. The head is in the chat line.
- **Gates**, each on its own exit code, on `44cb913d9` (the last code commit; the Handoff commit after it is docs alone):
  typecheck 0, lint 0, test 0 (922 files, 11,330 tests), `zsh scripts/build-lock.sh pnpm build` 0
  (`../partyreel-wt/_scratch/crumbs-70/gate.summary` and `gate-*.log`); `pnpm lab:smoke --base http://localhost:3131` on
  the same code: 166 checks, 0 failing (scope: boards drive-export, event-header, host-dashboard and identity, the
  Library and the shell; `smoke.log`). No `lab:demo`: this lane is no board.
- **Lane check** (`git diff --name-only origin/launch-prep...HEAD`): every line is under `owns`, this file, or the two
  system docs above, but for these, each with why:
  - `src/components/app/checkout-button.tsx`, `src/components/app/pricing/change-plan-request.ts` and its new
    `change-plan-request.test.ts`, `src/components/app/pricing/checkout-button.test.tsx`: the hop. The brief has the hop
    show the notice, but `owns` names only the route; the client helper that reads the route's JSON dropped the field, and
    the button shows it. No other lane's manifest names them.
  - `src/components/app/dashboard/stage.tsx`: one prop (`eventId={event.id}` on `LampLight`), so only the event she just
    made takes the ignition.
  - `src/components/app/create-event-wizard.tsx`: Create's own file, one call that leaves the flag (the brief: "Create's
    files are yours only for setting that flag").
  - `src/components/ui/floating-layer.test.ts`: two paths added to the one gutter test's list, the rule's one home.
  - `src/components/app/dashboard/stage-lit.test.tsx` (new): the lamp's tests beside the file `owns` names.
- **The items:**
  1. `/pricing`'s hop: the route answers `notice` beside the url (`src/app/api/stripe/change-plan/route.ts`,
     `uploadsNoticeFor`: only a step down in the uploads allowance, read while the portal session is made, a failed read
     answers none and warns); the CheckoutButton shows it as a toast, held 5 s with a Stay here, the sheet's own switch
     untouched. Red on the old code: `route.test.ts` (the sentence; the failed read), `change-plan-request.test.ts`,
     `checkout-button.test.tsx` (the sentence and its hold, Stay here, leaving the page, the router's transitions never held).
  2. Two menus read `floatingGutter` (`display-menu.tsx`, `profile-actions-menu.tsx`; `e0457eb91`); red on the old code in
     `floating-layer.test.ts`.
  3. The lit stage's lamp ignites once as she meets the event she just made (`stage-lit.tsx`: `LampLight`, `useIgnition`;
     `create-event-wizard/just-made.ts`; reduced motion lands lit); red on the old code in `stage-lit.test.tsx` (4 of 9),
     `lamp-flag.test.tsx` (Create leaves the flag the moment the event exists, a refused Create leaves none) and
     `just-made.test.ts`.
  - **Driven in a browser, local only** (nothing of mine requested the alias or Stripe: `dev.log` holds no `/api/stripe`
    line; the scratch pages drew production's `Stage` and the real `CheckoutButton` with stubbed routes and were removed
    before every commit): the lamp on a client navigation with the flag went from opacity 0 to .98 over about 1.2 s at
    scale .82 to 1, the flag spent and a reload lit; a hard load with the flag ignites after hydration, no hydration
    warning; every ignition utility compiles inside `prefers-reduced-motion: no-preference`. The hop: the toast and
    "Starting…" at 1.2 s, Stripe's page at 5 s, a real click on Stay here keeps the page, a link pressed mid-hold navigates
    in 0.4 s and the redirect never fires, and the sentence goes with the page.
  - **Found by driving it, fixed:** a hold awaited inside the press's `startTransition` left every link in the app dead
    until the redirect (React entangles the router's transitions with a pending async one); the hold is now a timer and a
    state, pinned by a test, and the landmine is in `billing-caps.md`.
- Assets requested from Will: none
- Board ideas: Create's exits. The room's close, "Go to your event", ends where Get it ready ends (the event), while the
  dashboard's lit stage and its ignition wait behind the breadcrumb; the close, or a second exit, landing on the dashboard
  could be drawn as two options (the ignition's flag would then ride a parameter).
- Proposed migrations / Worker / Vercel / Stripe / env changes: none (no Stripe object or key touched; the route's tests
  mock Stripe as they did)
- Calls his to overrule: (1) the ignition's flag rides the tab (`sessionStorage`, the event's id), not a parameter,
  because Create has no landing on `/dashboard` (Questions); (2) the hop's sentence is a toast held 5 s with a Stay here,
  never a confirm; (3) the route says the sentence only for a step down in the allowance.
- Look at first: the lit stage after Create (make an event, Get it ready, then go home by the breadcrumb: the lamp ignites
  once, a second visit finds it lit) and, on a Pro account whose month's uploads are past a smaller size's allowance, a
  press on that size from `/pricing` (the sentence, five seconds, Stay here). Both need a signed-in session, so I could
  only draw them on scratch pages; their live walk is the Orchestrator's (this lane is local only).
