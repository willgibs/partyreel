---
track: crumbs-82
status: handed-off      # open -> handed-off; deleted in the merge commit that integrates it
cut: "9d64fe3f"            # the launch-prep SHA the branch was cut from
board: none
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/app/(app)/dashboard/page.tsx
  - src/app/(app)/dashboard/actions.ts
  - src/components/app/dashboard/
  - src/lib/dashboard/
  - docs/systems/dashboard.md
  - src/app/(app)/account/page.tsx
  - src/components/social/follow-button
  - src/components/app/drive/
  - src/app/admin/layout.tsx
  - src/app/admin/not-found
reads:                  # single-sources you depend on: never duplicate, never edit
  - docs/reviews/host-dashboard.json
  - src/app/(dev)/design/sandbox/host-dashboard/spec.ts
---

# lp/crumbs-82

**Goal.** host-dashboard r4's chooser as Will picked it, two small crumbs, and the Drive re-walk's small findings.

## The brief

**The round's direction (Will, standing since round 13, carried by every lane):** never dev-tool-ish; a host of 1 to about 10 events first, scaling to hundreds; "all work no play is a boring consumer product": delight where it costs nothing in clarity; nothing depends on a timeline; "everything should feel as immediate/responsive/snappy, and anything taking longer should provide clear state feedback and potential interruptibility"; Partyreel runs with no AI managing it (every operator fix ships its `/admin` control, zero silent failures); cost is designed like the architecture. Production is the working version: a pick is the best of what was drawn, never a rule.

**Local only:** nothing of yours requests the Vercel alias, partyreel.com or any *.vercel.app, and nothing deploys. Port 3139 is yours; 3000 is Will's desk.

1. **host-dashboard r4's chooser = words** (Will, desk 3; details = built needs nothing): "The stage's own words: the stage's first words say why its event leads (Your newest, Latest photos); pressing them turns the stage into the four rules, its picture showing each" (lands: where the rule's control lives on the stage, how it opens at a desk and a phone, and how the stage moves when it changes). Wire it from the board's drawing (`src/app/(dev)/design/sandbox/host-dashboard/`), production's own pieces, the stage's live read untouched.
2. **`/account` sets no trail** while `/account/profile` does (`SetCrumbs`): a one-step `Partyreel > Account`.
3. **`FollowButton`'s `slug` prop** is taken and unread (`components/social/follow-button.tsx`): drop it and its callers' (`/u/[slug]`, the guest list, the moment card, the claims review); a caller outside your owns is a one-line exception named in your Handoff.

4. **The Drive re-walk's small findings** (ledger `/Users/gibby/local/ai/partyreel-wt/_scratch/drive-rewalk/ledger.txt`): Google shows Drive's permission as an unticked box, so a first Continue comes back as needs-permission (the app recovers in place); the promise screen could say to tick it ("Google asks you to choose an account and to allow this next" says nothing of the box). The Disconnect confirm says "deletes its key to it", the one delete word on a Drive surface: say Partyreel forgets its key. Account's "Sent" and the dashboard tiles' "In your Drive" count sends made through an earlier connection, while Your events' list shows those albums with no state: make them agree (recommended: count only sends of the current connection, the rest as history). The strip moves in coarse steps (one unchanged answer drops it to the 15 s beat; a timed report never showed): keep the 5 s beat while a send is sending or checking.
5. **`/admin/jobs` as a non-admin** answers the 404 page but its tab title reads "Jobs · Partyreel Ops" once loaded: a non-admin's 404 names no admin page.

Not yours: `src/lib/drive/` and `workers/drive/` (capture-time owns them; if a fix needs them, propose it). Each pinned by a test that fails on the old code. Wiring rigor: the whole gate; the dashboard needs port 3000's sign-in: walk what your port reaches and list the rest for the Orchestrator's desk walk.

**Starts from.** CLAUDE.md's working loop, the bible's ten and production as it is; the tests say what has to keep
working.

**Verify on.** The gate on the synced tree (CLAUDE.md's four steps), each step on its own exit code; `pnpm lab:smoke --base http://localhost:<port>` when the lane changes anything under `src/` but tests (it crawls what the change reaches: the Library, and every board whose drawings import a changed file); and the surfaces the Handoff is judged on, local and live.

## Questions (a recommended answer each; the Orchestrator relays them)

Each is built as recommended and is Will's to overrule.

1. **Where is her stage's rule kept?** Beside her Display in `profiles.events_display`, key `lead` (only when it is not
   Newest): no migration, since the column's CHECK is an envelope; the worst Display plus the rule is 177 of its 512 bytes
   as the jsonb prints it (`display-migration.test.ts`; the commit message of `9d8a33b2e` says 212, which was a guess).
   Otherwise: its own column (a migration, regenerated types, and no shared read-then-write).
2. **When does the control stand?** With more than one event and none on its day (the board's `hand`). A party on its own
   day leads under every rule, so on such a day she cannot change the rule (the footnote says why). Otherwise: always
   shown, disabled while a party is live.
3. **Should it stand when all four rules lead with the same event?** Yes: the rule is a standing preference that matters
   once something changes. Otherwise: hidden while the four agree.
4. **What a press reads.** Readiness of the (at most three) events her other rules would lead with is read on every load
   where she has a choice (`ALTERNATE_READS`; only events before their day), so a press draws them whole; the guest count
   of an event a press leads with is read once, lazily (`readStageGuestsAction`). Otherwise both lazily on the first open:
   fewer reads for hosts who never open it (the review modeled 38% of hosts with a choice going from none to at least one
   readiness read a load), at the price of a rail popping in after a press and a phone's band growing.
5. **The strip's beat.** The brief said "5 s"; the store's fast beat is 3 s (`FAST_MS`) and the ledger's 5 s was the
   Checking window. Kept 3 s while a send is preparing, sending or checking and has reported within a minute; 15 s for a
   paused send, stopped files that stopped landing, and a send silent for a minute (dead lanes: three reads every three
   seconds per open tab, found by the review). Otherwise 5 s: about 40% fewer polls while a send runs.
6. **How Sent and the lights agree.** As the brief recommended: only the connection she has now counts and lights; earlier
   sends are one quiet "Earlier" line on Account ("2 albums · 5.9 MB, sent before this connection. They stay where they
   went."). Otherwise: say nothing of earlier sends.
7. **A non-operator's `/admin/*` title.** Exactly an unmatched URL's, "Page not found · Partyreel", with `noindex` kept.
8. **The promise's words.** "Google asks you to choose an account, then to tick the box that lets Partyreel add files",
   the return's own words for the box. Otherwise: quote Google's checkbox line, which Google can change.

## System-doc edits (in place, owned facts only)

- `docs/systems/dashboard.md`: the stage's rule and where it is kept, the chooser (its slots; its words are the
  server's), a press's recomposition and the parity test that holds it to the server's page, the retry, the tab's memory
  of her press, the shared jsonb, the alternates' reads, and her events' total order.
- Proposed, not mine (`docs/systems/drive-export.md` is outside `owns`): line 143, "Account's Sent counts each file once"
  gains "of this connection: a send made at or after the connection's own row (`components/app/drive/this-connection.ts`),
  the earlier ones one Earlier line; the status store drops an earlier connection's sends, so no tile, strip, door or
  flag speaks of them"; and a line for the poll: "every 3 seconds while a send is at work (preparing, sending or
  checking, reported within a minute), 15 for a paused send, stopped files that stopped landing or a silent send".
  `src/app/api/drive/status/route.ts`'s header still says "15 when nothing moved", and `lib/drive/moments.ts`'
  `CANCELED_TITLES.disconnected` and `.account_changed` are unreachable from the filtered poll (lib/drive is capture-time's).

## Deferred (ROADMAP one-liners, bucket named)

- DELETE the ROADMAP line "Code hygiene: `FollowButton`'s `slug` prop ...": done here.
- Code hygiene: her stage's rule and her Display share one jsonb, each written read-then-write (Next runs a tab's actions in
  turn), so two devices writing within a round trip keep the later write whole; an atomic merge (a jsonb-merge RPC) or the
  rule's own column if that ever matters.
- Code hygiene: the dashboard's `remembered` choices (her layout, her stage's rule) never age, so another device's later
  choice shows in a long-lived tab only after a reload; age them out as the search's `QUERY_KEPT_MS` does if it is noticed.
- Cost: read the chooser's alternates' readiness lazily on its first open (Question 4) if the dashboard's read budget tightens.
- Code hygiene: `readStageGuestsAction` reads every approved media row an event holds, as the page's own stage read does;
  a SQL count of guests would serve both.

## Handoff (replaces the chat report)

- **Commits, all pushed** (`git log origin/launch-prep..HEAD`): `e011b245a` (the account's trail, FollowButton, the
  admin 404's title), `dd583ab25` (the Drive findings), `61d92257e` (the chooser), `9d8a33b2e` (the page follows the
  server's rule; the envelope test), `c51969425` (the fresh-eyes review's findings), `e2826cf15` (the sync: a clean
  merge of launch-prep `9b123769a`, capture-time, whose `capturedAt` hunks in `src/lib/db/queries/drive.ts` are intact
  beside mine), then this manifest alone. The head is in the chat line.
- **Gates on the synced tree** `e2826cf15` (each on its own exit code; logs in
  `/Users/gibby/local/ai/partyreel-wt/_scratch/crumbs-82/`, the sha in `gate-sha.txt`): typecheck exit 0
  (`gate-typecheck.log`), lint exit 0 (`gate-lint.log`), `pnpm test` exit 0, 1,029 files and 12,885 tests
  (`gate-test.log`), `build` exit 0 (`gate-build.log`), `lab:smoke --base :3139` exit 0, 176 checks 0 failing
  (`gate-lab-smoke.log`). No board lane: `lab:demo` does not apply.
- **A trial merge of launch-prep `e10377e49`** (identity-wiring and identity-r5 landed after my sync; nothing upstream
  touches my `owns` or `reads`), `git merge --no-commit` then aborted, so the branch is unchanged: clean, no overlapping
  file; typecheck exit 0 (`trial-typecheck.log`), lint exit 0 (`trial-lint.log`), `pnpm test` exit 0, 1,030 files and 12,913
  tests (`trial-test.log`). No second sync commit: the build was not re-run on it.
- **Lane check** (`git diff --name-only origin/launch-prep...HEAD` = owned paths + this file, plus these ten):
  `src/app/(app)/account/page.test.tsx`, `src/app/(app)/dashboard/actions.test.ts` and
  `src/app/(app)/dashboard/page.test.tsx` (the tests of owned files, named beside them); `src/app/admin/portal-title.test.ts`
  (the test of the owned layout's metadata, reshaped with it); `src/app/(guest)/u/[slug]/page.tsx`,
  `src/components/guest/follow-moment-card.tsx`, `src/components/social/guest-list.tsx` and
  `src/components/social/guest-peek.tsx` (each one `slug=` call-site of the FollowButton, the brief names three of the four
  and the claims review is mine); `src/app/admin/exports/drive-controls.tsx` (one line of copy: the operator's Disconnect
  said "deletes its key", the host's confirm's own word, and no other lane owns it); `src/lib/db/queries/drive.ts`
  (`readMySentTotals` became `readMySentRows`, which carries when each send was made; its one caller is the owned card).
- **The items**
  1. Chooser = words, wired: `src/lib/dashboard/{lead,lead-words,leading}.ts` (the rules, the server's words, the page
     around any lead), `components/app/dashboard/{stage-lead,home-body}.tsx` (the control, the client page), three slots on
     `stage.tsx`, `setLeadRuleAction` and `readStageGuestsAction` in `actions.ts`. Walked live on the real dashboard
     (a London-zoned dev server, so no party was live): the reason "Photos yesterday", the four rows with real names and
     facts, the picture following the pointer, a press moving the stage and emptying This week, the rule kept in the
     database (`{"lead":"photos"}`), kept beside a Display write (`{"lead":"photos","layout":"list"}`), a reload leading
     with it, and a phone's rows all legible. The stage's live read (`use-stage-live.ts`, `stage-action.ts`) is untouched.
  2. `/account`'s trail: `Partyreel` (to `/dashboard`) then `Account` as the current page, read off the real shell.
  3. `FollowButton`'s `slug` dropped with its five callers; a scan (`follow-button.test.tsx`) holds that none returns.
  4. The Drive findings: the promise names the box (read on the real Take it home panel); "forgets" in the confirm, its
     toast and the operator's lede, a scan holding that no Drive surface says "deletes its key"; Sent and the lights per
     connection (`this-connection.ts`, `use-drive-status.ts`, `drive-account-card.tsx`); the 3 s beat while a send is at work.
  5. `/admin/jobs` for a non-admin: read live as the signed-in willg97 against the real gate: status 404, the server's
     title and the tab's after hydration both "Page not found · Partyreel" (it read "Jobs · Partyreel Ops"), `noindex` on
     it; a signed-out visitor still gets the 307 to sign-in.
- **The review** (a fresh-eyes agent, 11 items; each answered): fixed, a refused keep could not be retried (the toast
  says try again), the Name sort had no tie-break so a recomposed list ordered equal names differently from the server's
  (the new parity test is red on the old sort), a silent send polled at 3 s for ever, a stranger's head dropped `noindex`
  and swallowed errors unsaid, the operator's "deletes its key"; accepted with their reason and a Deferred line, the shared
  jsonb's cross-device lost update, `remembered` never aging, the alternates' reads, `readStageGuestsAction`'s cost; the
  stale Drive doc lines are proposed above and the files outside `owns` are named in the lane check.
- **Disclosed:** my walks' presses reached the real Supabase as the Browser pane's signed-in session (willg97: cookies for
  `localhost` span ports, so port 3139 is signed in too). The rule and a layout were set and put back; a read-only query
  afterwards shows no profile holds a non-empty `events_display`. In dev, the first 404 of `/admin/jobs` printed Next's own
  "Unexpected root span type 'ResolveMetadata.generateMetadata'" warning once (a `console.warn` of Next's tracer) and not
  again over later 404s and redirects.
- **Not driven here, for the desk walk** (they need a Google connection or the desk's build): Disconnect's confirm and its
  warning toast on Account with a connection; Account's Sent and Earlier lines and the tiles' light after a reconnect;
  the strip's beat through a real send; reduced motion and a real touch on the chooser. The chooser on the desk needs a day
  with no party live (the real account's albums keep today live until midnight: run the desk's server with
  `TZ=Europe/London`, as the walk above did).
- **Assets requested from Will:** none.
- **Board ideas:** the host-dashboard board's picks are all built (`chooser=words`, `details=built`), so it can retire; a
  press moves the old lead into This week or the list with no sign of where it went, and a short shared-element move would
  say it.
- **Proposed migrations / Worker / Vercel / Stripe / env changes:** none.
- **Calls his to overrule:** the eight Questions above, as built.
- **Look at first:** `/dashboard` at 1440 and 375 on a day with no party live: the stage's first words, a press, a choice,
  a reload (kept), then Back from an event; then Account's trail and, with a connection, its Drive card.
