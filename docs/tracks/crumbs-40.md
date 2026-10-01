---
track: crumbs-40
status: open            # open -> handed-off; deleted in the merge commit that integrates it
cut: "e370430b"            # the launch-prep SHA the branch was cut from
board: none
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/components/app/dashboard/claims-review.tsx
  - src/components/likes/likes-provider.tsx
  - src/app/admin/page.tsx
  - content/help/your-event-page-explained.mdx
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

- none yet

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
