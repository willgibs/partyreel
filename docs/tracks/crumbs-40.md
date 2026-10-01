---
track: crumbs-40
status: open            # open -> handed-off; deleted in the merge commit that integrates it
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

- none yet

## Deferred (ROADMAP one-liners, bucket named)

- none yet

## Handoff (replaces the chat report)

- The work commit and the sync commit, pushed (or: launch-prep had not moved); the head is in the chat line
- Every claim names its artifact (a commit, a log line, a path), so the Orchestrator checks rather than believes.
- Gates on the synced tree, each on its own exit code, and the sha they ran on
- Lane check: `git diff --name-only origin/launch-prep...HEAD` = owned paths + this file (exceptions and why)
- The items, one line each
- Assets requested from Will: none, or one per line: `what · spec (size, grade, count, format) · replaces <stand-in id>`
- Board ideas: an improvement you saw beyond your lane, one line each (the Orchestrator may open a board for it)
- Proposed migrations / Worker / Vercel / Stripe / env changes: none
- Calls his to overrule, one line each
- Look at first: ...

## Where I am

- Booted at 8aba036e (launch-prep after crumbs-37's and crumbs-38's merges, so no sync owed); worktree
  `../partyreel-wt/crumbs-40`, dev server port 3132, scratch `../partyreel-wt/_scratch/crumbs-40/`.
- DONE: MEDIUM claims refresh, ad842289 (`ClaimUploadsOnAuth` refreshes on its own claim; `ClaimsReview` no longer
  listens; `claim-uploads-on-auth.test.tsx` red on the old code). Likes, b1dca5a5 (`seed-queue.ts`: the account read
  at every call and followed, a burst as one ask; 7 provider pins red on the old provider). Full `pnpm test` green
  at b1dca5a5's tree (693 files, 8,317 tests, 39 s); typecheck and lint green.
- Measured: `@sentry/core` 10.55's `vercelWaitUntil` returns unless `EdgeRuntime` is defined (so
  `captureRequestError`'s flush never holds a Node.js function; getsentry/sentry-javascript#23087, open), and
  `scheduleServerFlush`'s `after(() => { void Sentry.flush() })` never held the flush either. The ops mail keys
  `${eventId}:${floor(now/10min)}`. The admin layout's `title.default` is templated by the root's "%s · Partyreel".
- NEXT: the NITs (strike line `lib/admin/reports.ts` strikeWords: compare the dates as printed; ops mail:
  `sendOncePerWindow` in `lib/email/send.ts`, keyed on the album's last mail; Sentry: `captureRequestError` wrapper
  in `lib/observability/sentry.ts` + `after(flushed)`; title: the admin layout's own title absolute; the help
  article's Review card "Off" + a pin in `help-product-doors.test.ts`), then the system docs, then the gate.
