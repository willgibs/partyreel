---
track: crumbs-40
status: handed-off      # open -> handed-off; deleted in the merge commit that integrates it
cut: "8aba036e"            # the launch-prep SHA the branch was cut from
board: none
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/components/app/dashboard/claims-review.tsx
  - src/components/app/dashboard/claims-review.test.tsx
  - src/components/shared/claim-uploads-on-auth.tsx
  - src/components/shared/claim-uploads-on-auth.test.tsx
  - src/components/likes/likes-provider.tsx
  - src/components/likes/likes-provider.test.tsx
  - src/components/likes/seed-queue.ts
  - src/components/likes/seed-queue.test.ts
  - src/lib/test-utils/mock-supabase.ts
  - src/lib/admin/reports.ts
  - src/lib/admin/reports.test.ts
  - src/lib/reports/reporter.server.ts
  - src/lib/reports/reporter.server.test.ts
  - src/lib/email/send.ts
  - src/lib/email/send.test.ts
  - src/lib/observability/sentry.ts
  - src/lib/observability/sentry.test.ts
  - src/instrumentation.ts
  - src/app/admin/page.tsx
  - src/app/admin/layout.tsx
  - src/app/admin/portal-title.test.ts
  - content/help/your-event-page-explained.mdx
  - src/lib/content/help-product-doors.test.ts
  - src/components/app/event-feed/feed-section-header.tsx
reads:                  # single-sources you depend on: never duplicate, never edit
  - docs/systems/host-app.md
  - docs/systems/guest-flow.md
  - docs/systems/admin-observability.md
  - docs/systems/trust-safety-forensics.md
---

# lp/crumbs-40

**Goal.** Build 35's red-team finds: the dashboard's claims dropping what the layout's silent claim took (the MEDIUM: crumbs-35's fix does not hold), the likes provider following the device's session, the viewer's likes asks coalesced over a burst, and five small ones (a strike line's repeated date, the ops mail's clock buckets, a server crash event lost after a quiet spell, /admin's title, the event-page article's Off state).

## The brief

Build 35's red-team finds (`../partyreel-wt/_scratch/redteam-35/ledger.txt`; grep it for the steps), each fixed at its root with a test that fails on today's code:

- **MEDIUM, the dashboard keeps offering a claim it already made** (crumbs-35's fix does not hold): a signed-out guest uploads with willg97's address in the optional email; he signs in and opens /dashboard. The toast shows, but the "waiting for you" banner and Review's "Claim" stay for a row SQL shows is his, and the event's Guest card is missing until a reload. The red-team's cause: `ClaimsReview` subscribes to `onClaimed` when the page segment mounts, `dashboard/loading.tsx` streams that segment after the layout, so the layout's claim usually lands first, and `onClaimed` keeps no last result for a late subscriber. Make the refresh independent of who mounts first, in both orders (a soft navigation, and a hard load after sign-in), and prove both.
- **LOW, Sentry `JAVASCRIPT-NEXTJS-6J`** ("QueryFailedError: likes: my_liked_media_ids: permission denied for function my_liked_media_ids"): with a guest album open signed in, a sign-out in another tab, then a new photo arriving. The likes provider decides once, for its life, that she is signed in. It follows the device's session as the guest header now does (`guest-header.tsx`'s `look`, crumbs-35), and calls no signed-in RPC once the session is gone.
- **LOW, the viewer's likes asks**: a held arrow key made 157 `my_liked_media_ids` calls in about 200 steps while the link store made 3. Coalesce a burst's asks as crumbs-33 did for links (`lib/album/links.ts`: two in flight, a burst as one, newest first).
- **NITs**:
  - a strike line repeats the bar's own date ("A Dismiss makes 7, until Mar 28, 2027 UTC", where the later instant prints as the same day): say it so the reader learns something, or drop the clause;
  - the ops mail's "once per album per ten minutes" uses fixed clock buckets, so an album got two mails 4 minutes apart: a window per album;
  - one of three server crash events was lost on the first hit after a quiet spell: find whether Sentry's server event is flushed before the function freezes on Vercel, and fix it if so;
  - `/admin`'s title is "Operations · Partyreel" where every other portal page ends "· Partyreel Ops";
  - `your-event-page-explained` describes the Review card's states but not "Off".

**Verify:**
- the gate;
- each item's test red on today's code;
- on localhost, drive what runs there.

The dashboard signed in, the portal and the album's likes cannot run signed in on localhost, so name their steps for the next build's red-team in your Handoff.

**Will's desk is up:** `locked-door`, `event-ready` and `disposable-mode` describe the door, the hub and the guest page. Change no word or behaviour their asks describe, and leave `entry-modal.tsx` and the door untouched. If the lab crawl's PREMISE line names a board, say in your Handoff why its asks still hold.

**Paths:** your owns are a start. Add each file to `owns` in your manifest before editing, or name a one-line exception. No SQL. Two lanes may run beside you, so don't touch their files:
- `crumbs-37` owns the album's sync, the purge cron, the over-capacity sweep and the admin album drill-in;
- `crumbs-38` owns the profile's lists (`my-uploads`, `my-likes`), the viewer's credit and the guest's upload queue and toasts.

**Starts from.** CLAUDE.md's working loop, the bible's ten and production as it is; the tests say what has to keep
working.

**Verify on.** The gate on the synced tree (CLAUDE.md's four steps), each step on its own exit code; `pnpm lab:smoke --base http://localhost:<port>` when the lane changes anything under `src/` but tests (it crawls what the change reaches: the Library, and every board whose drawings import a changed file); and the surfaces the Handoff is judged on, local and live.

## Questions (a recommended answer each; the Orchestrator relays them)

Each is built as recommended and is Will's to overrule; none is a one-way door.

- **The claim's refresh lives with the claim, not the page.** The (app) layout's own claim (`ClaimUploadsOnAuth`)
  refreshes the route once a claim it ran moved uploads, on whichever (app) page is open, and the claims review no
  longer listens (two listeners would refresh twice). Recommended: yes, since every (app) page reads what the claim
  changed, and only the layout is always mounted before its claim lands.
- **A session that ends takes its hearts with it.** The likes provider follows the device's session: when it goes,
  the hearts drawn for that account clear (as the header's avatar does) and a tap opens the like door; when an
  account arrives, the album's hearts are asked again for it. Recommended: yes.
- **A strike line whose later lift prints as the same day drops the clause** ("A Dismiss makes 7." rather than
  repeating "until Mar 28, 2027 UTC"); the dates are compared as printed. Recommended: drop it, since an hour on the
  same day tells an operator nothing she acts on.
- **The ops mail's window runs from the album's last mail**, keyed on that mail, so two reports that race past the
  same last mail claim one key and one mail goes. Recommended: yes.
- **The portal's title is fixed in its layout** (its own title absolute, "Operations · Partyreel Ops"), so any
  untitled portal page reads the portal's suffix, not only /admin. Recommended: yes.

## System-doc edits (in place, owned facts only)

- `docs/systems/host-app.md` (the claims review): the layout's claim is refreshed by its own caller, never a
  listener in the page segment, and why.
- `docs/systems/guest-flow.md` (likes): the hearts follow the device's session; two asks out, a burst as one.
- `docs/systems/admin-observability.md`: the ops mail's window from the album's last mail; every server capture
  (the helpers and `onRequestError`) held by its request until its flush is out, and why Sentry's own is not.

## Deferred (ROADMAP one-liners, bucket named)

- Now · Observability: `captureRequestError` (`lib/observability/sentry.ts`) holds a crash's flush itself because
  `@sentry/core`'s `vercelWaitUntil` does nothing off the Edge runtime (getsentry/sentry-javascript#23087, open at
  10.55); once a release holds Node.js functions, the hold is a harmless second `waitUntil` and the wrapper can go
  back to Sentry's own (from `crumbs-40`).

## Handoff (replaces the chat report)

- **Commits, pushed to `origin/lp/crumbs-40`; no sync commit.** Cut at 8aba036e (launch-prep after crumbs-37's and
  crumbs-38's merges); launch-prep has since moved by one record commit only (c13d0bd1, the pickup), which needs
  no sync. Work: ad842289 (claims), b1dca5a5 (likes), 19efaa7e (strike line), 2bead1ff (ops mail), b1031eb0
  (Sentry), 723669aa (portal title), da36f424 (help article), 83104557 (system docs). The head is in the chat line.
- **Gates on be129863's tree** (the head minus this manifest), each on its own exit code, logs in
  `../partyreel-wt/_scratch/crumbs-40/`: `pnpm typecheck` 0 (`gate-typecheck.log`); `pnpm lint` 0, no warnings
  (`gate-lint.log`); `pnpm test` 0, 694 files, 8,329 tests (`gate-test.log`); `zsh scripts/build-lock.sh pnpm
  build` 0 (`gate-build.log`); `pnpm lab:smoke --base http://localhost:3132` 0, 170 checks, 0 failing
  (`gate-labsmoke.log`). No board, so no `lab:demo`.
- **Lane check:** `git diff --name-only origin/launch-prep...HEAD` is 25 paths, every one under `owns` (widened at
  38cc0392 to each item's root, before its edit), this manifest, or one of the three system docs under System-doc
  edits. Owned and untouched: `src/app/admin/page.tsx` (the title is fixed in its layout), `src/lib/email/send.test.ts`
  (the window is pinned through the reporter's real ledger instead) and `feed-section-header.tsx` (no item named it).
- **PREMISE** (the lab crawl): disposable-mode and locked-door read `guest-flow.md`, event-ready reads `host-app.md`.
  Their asks still hold: my edits there are the likes paragraph and the claims review's refresh, and no ask of the
  three describes likes, the claims review or the dashboard's refresh (camera, waiting, wall, peek, create, video,
  cost, save; family, shape, wait, lost; list, guide, create, needs, door). No word or behaviour an ask describes
  changed, and `entry-modal.tsx` and the door are untouched.

**The items** (each with its test red on the old code, named in its commit):
- MEDIUM, claims: the (app) layout's `ClaimUploadsOnAuth` refreshes the route itself once a claim it ran moved
  uploads (never after the layout has left), and `ClaimsReview` no longer listens, so it is one refresh whichever
  mounts first. `claim-uploads-on-auth.test.tsx` drives the real claim and the real review in both orders (the
  red-team's, the segment arriving after the claim: 0 refreshes on the old code). Next's action queue runs a refresh
  dispatched during a navigation after it (`app-router-instance.js` `dispatchAction`).
- LOW, Sentry 6J: the likes provider reads the session at every signed-in call (seed, like, bulk like, replay, the
  door's verify) and follows it (the SDK's sign-in and sign-out, the session cookie, the tab looked at again): no
  call without a session, the hearts go with it, an arriving account has them asked again, an answer landing after
  a change is never painted, a refusal the session's end explains is not reported (`seed-queue.ts`; 6 provider pins).
- LOW, the viewer's asks: two `my_liked_media_ids` out at once, a burst's seeds as one ask, a stalled ask giving up
  its place after 8 s (the link store's constants, imported); the held-key pin: 200 steps make 3 calls (200 on the
  old provider).
- NIT, strike line: a Dismiss's later lift is named only when it prints a later date ("A Dismiss makes 7.").
- NIT, ops mail: `sendOncePerWindow` (`lib/email/send.ts`) reads the album's last `report_urgent` mail; inside ten
  minutes nothing goes, past it the key names that mail, so racing reports claim one key. No SQL.
- NIT, Sentry server events: found and fixed. `@sentry/core` 10.55's `vercelWaitUntil` returns unless `EdgeRuntime`
  is defined, so `captureRequestError`'s flush never held a Node.js function on Vercel (getsentry/sentry-javascript
  #23087, open). `onRequestError` is ours now: Sentry's capture, then the flush's own promise handed to `after()`
  (Vercel's request context when there is no request scope). `captureError`/`captureWarning` had a smaller form of
  it (they handed `after()` a callback that only started a flush) and hold the promise too. Probed in `next dev`:
  inside `onRequestError` for a render crash, `after()` accepted the flush (`[crumbs-40 probe] after() held the
  flush`, a temporary log, reverted, not committed).
- NIT, /admin's title: the portal layout's own title is absolute ("Operations · Partyreel Ops") with the same
  template, pinned through Next's `resolveTitle` over both layouts' real metadata.
- NIT, the help article: the Review card's "Off", held by `help-product-doors.test.ts` to every face
  `reviewCardFace` draws.

**Local** (:3132): the article renders "or Off while uploads go straight into the album" (`help-article.html`); the
Library's report queue composition draws its strike line; the public demo album, signed out, loads with no script
error and asks no RPC (R2's localhost CORS only). Signed in cannot run here, so **for build 36's red-team**:
1. Claims, both orders, in a VISIBLE tab: stage a names-only upload with willg97's address; (a) sign in landing on
   /u/willg, then a client navigation to /dashboard; (b) sign out, stage a second, sign in to a hard /dashboard. Each:
   `claim_anonymous_uploads`, then a `/dashboard` RSC refresh; no banner or Review row for it; the Guest card there
   without a reload.
2. Likes, two tabs: a guest album open signed in, a sign-out in the other tab, then a new photo: no
   `my_liked_media_ids` after the sign-out, the hearts gone, a heart tap opens the like door, no new 6J in Sentry.
3. The viewer's asks: the Scale probe as its owner in a foreground tab, ArrowRight held about 200 steps: a handful of
   `my_liked_media_ids`, not one a step.
4. The portal: a barred address whose Dismiss lifts later the same day reads "A Dismiss makes N." (partyr33l's 7);
   /admin's tab reads "Operations · Partyreel Ops".
5. The ops mail: two child reports on one album minutes apart across a :x0 boundary: one `report_urgent` row
   (`<event>:first` or `<event>:after:<id>`), one mail; one more past ten minutes after it: a second.
6. Sentry: /design/lab/tools/boom on the alias after a quiet spell, three times spaced out: a node event each time.

- Assets requested from Will: none.
- Board ideas: none. (ROADMAP's Profile line on the Likes page's Show more, which names this file, stands: not in
  this brief; with `seed-queue.ts` it is one method that marks ids liked as they join.)
- Proposed migrations / Worker / Vercel / Stripe / env changes: none.
- Calls his to overrule: the five under Questions, each built as recommended (the claim's refresh is the layout's
  on any (app) page; a session that ends takes its hearts; a same-day lift drops the date; the ops mail's window
  from the album's last mail; the portal's title fixed in its layout).
- Look at first: item 1's soft-navigation order on the alias (the MEDIUM that did not hold last time), then item 2.

## Where I am

- Handed off. Everything above is done; nothing is in progress.
