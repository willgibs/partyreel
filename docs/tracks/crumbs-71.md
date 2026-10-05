---
track: crumbs-71
status: handed-off      # open -> handed-off; deleted in the merge commit that integrates it
cut: "dc2855bb"            # the launch-prep SHA the branch was cut from
board: none
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/lib/export/
  - src/components/app/export/
  - docs/systems/profiles-social.md
reads:                  # single-sources you depend on: never duplicate, never edit
  - CLAUDE.md
---

# lp/crumbs-71

**Goal.** Two ROADMAP crumbs: a download's Try again waits for the line to come back and says so; profiles-social.md says a name-only guest's disc colour is kept per ticket.

## The brief

**The fixes:**
1. **Downloads: Try again is offered while the browser says it is offline.** Hold it until `online` fires and say so ("Waiting for your connection…", then Try again). Use the toast's existing words and seams (`src/lib/export/walk.ts`, `src/components/app/export/`), pinned by a test that fails on the old code.
2. **Docs:** `docs/systems/profiles-social.md`'s line on a name-only guest's own header disc gains two facts: the answer is kept per ticket (`pr_guest_seed_<album>`, bound to the ticket by a hash of it, crumbs-65), and a first load holds the disc back and fades it in.

Wiring rigor for fix 1 (it ships): the whole gate. Nothing of yours requests the Vercel alias, partyreel.com or any *.vercel.app. Port 3132 is yours. Work economically, with no helper agents; push a WIP commit at each step (this account's weekly usage is near its end).

**Starts from.** CLAUDE.md's working loop, the bible's ten and production as it is; the tests say what has to keep
working.

**Verify on.** The gate on the synced tree (CLAUDE.md's four steps), each step on its own exit code; `pnpm lab:smoke --base http://localhost:<port>` when the lane changes anything under `src/` but tests (it crawls what the change reaches: the Library, and every board whose drawings import a changed file); and the surfaces the Handoff is judged on, local and live.

## Questions (a recommended answer each; the Orchestrator relays them)

Built on each recommendation; every one is Will's to overrule.

1. **Where does the hold live?** Recommended, and built: in the toast port (`exportToasts`, `export-toast.tsx`), not in
   either engine. The walk's Try again and the take-home Save's both draw there, so one rule serves both (and the
   Library's specimen), the toast's own lifetime (a swipe, the x, a replacement) ends the wait, and the engines stay as
   they are.
2. **Which Try agains wait?** Recommended: a refused or short toast's (what a press can only fail again while the browser
   says it is offline). A cancel's Try again (hers) and Get part N are left alone: a press on either meets the same
   dropped toast, which then waits.
3. **What the held toast says.** Recommended: its own title, with "Waiting for your connection…" in its detail's place and
   no Try again; the x stays. When `online` fires (or the tab is looked at again with the browser online, for a phone
   that froze the tab and missed the event) it is the same toast again, its own detail and its Try again.
4. **Does it run Try again by itself when the line returns?** Recommended: no. A download is a press (a token lives two
   minutes and a part is a tap), and one that starts unasked after a long wait would surprise her; it is offered, not run.

## System-doc edits (in place, owned facts only)

- `docs/systems/profiles-social.md`: the name-only guest's own header disc gains that its colour is kept per ticket
  (`pr_guest_seed_<album>`, bound to the ticket by a hash of it) and that a first load holds the disc back and fades it
  in.
- `docs/systems/uploads-and-r2.md` (the walk's E6 fact, not in `owns`): one clause, that the toast withholds a Try again
  while the browser says it is offline.

## Deferred (ROADMAP one-liners, bucket named)

- Design: the Library's download-toast specimen (`library/compositions/download-toast-demo.tsx`) draws the held Try again as a state of its own (a refusal with `WALK_COPY.waiting` in its detail and no button); today the specimen holds only while the browser itself says it is offline.

## Handoff (replaces the chat report)

- **Commits, pushed to `origin/lp/crumbs-71`:** `0b2af76cb` (the hold and its tests), `27dd93a76` (the two system docs),
  `3b419e84d` (the hold's comment and the no-stacking test); the manifest alone at `cdab691a5` and in this commit. No
  sync: launch-prep moved to `84c7408a1` but nothing it landed touches my owns or reads (`git diff --name-only
  b55564234 origin/launch-prep` has no path under `src/components/app/export`, `src/lib/export` or the two docs), and
  `git merge-tree --write-tree HEAD origin/launch-prep` is clean.
- **Gates, each on its own exit code, on the tree of `3b419e84d`** (logs in `_scratch/crumbs-71/gate-*.txt`):
  `pnpm typecheck` 0; `pnpm lint` 0 (no warnings); `pnpm test` 0 (919 files, 11,335 tests); `zsh scripts/build-lock.sh
  pnpm build` 0 (compiled successfully); `pnpm lab:smoke --base http://localhost:3132` 0 (156 checks, 0 failing).
- **Lane check:** `git diff --name-only origin/launch-prep...HEAD` is `docs/systems/profiles-social.md`,
  `docs/tracks/crumbs-71.md`, `src/components/app/export/export-toast.test.tsx`, `export-toast.tsx`, `export-walk.ts`
  (a comment), `src/lib/export/walk.ts`, plus one exception: `docs/systems/uploads-and-r2.md`, the walk's own system doc
  (CLAUDE.md's "Record subtractively"; one clause, named under System-doc edits).
- **Fix 1, Try again waits for the line.** `exportToasts.show` (`src/components/app/export/export-toast.tsx`) draws a
  refusal's or a short zip's toast WITHOUT its Try again while `navigator.onLine === false`, with
  `WALK_COPY.waiting` ("Waiting for your connection…", `src/lib/export/walk.ts`) in its detail's place and the x
  kept, and draws it again as it was when `online` fires or the tab is looked at again (`visibilitychange`, for a
  phone that froze the tab and missed the event). It lives on the port, so the walk's Try again and the take-home
  Save's (both draw there) are one rule; a replacement, `dismiss` and sonner's own dismissal (`onDismiss`: a swipe)
  stop the listening, so the line returning never draws a toast that is gone. Nothing listens while the browser says
  online; the walk and the Save are untouched (the walk's header gained one sentence saying so).
  *Pinned* by 9 new tests in `export-toast.test.tsx` (the real sonner, and the real walk end to end: offline mint,
  dropped, waiting, `online`, Try again, a fresh mint, the post): run against `b55564234`'s toast, 7 of them fail and
  the other 2 pin scope (a stall keeps its Try again; a cancel's, Get part N and a refusal with no button are left as
  they are). Browser, local (port 3132, the Library's download-toast specimen on the real toaster, `navigator.onLine`
  overridden and `online` dispatched): held at a desk and at 375 (343 x 74 px, both rows one line); an `online`
  with the browser still offline changes nothing; online brings its detail and Try again back; a swipe (synthetic
  pointer events) puts a held toast away and a later `online` draws nothing.
- **Fix 2, docs.** `docs/systems/profiles-social.md`'s disc line: kept per ticket (`pr_guest_seed_<album>`, a hash of the
  ticket beside the colour, `guest-header.tsx`'s `readSeed`/`keepSeed`), and a first load holds the disc back and fades
  it in (`SEED_WAIT_MS`, 2 s, then plain).
- **Nothing of mine requested the Vercel alias, partyreel.com or any `*.vercel.app`:** the only server was
  `pnpm dev -p 3132`, killed by its port before each gate and at this handoff.
- **lab:smoke's PREMISE line** (for his next sitting): drive-export's 9 open asks describe `export-toast.tsx` and
  `uploads-and-r2.md`, which this change touched.
- Assets requested from Will: none
- Board ideas: none
- Proposed migrations / Worker / Vercel / Stripe / env changes: none
- **Calls his to overrule:** the four Questions above (the hold on the port, only a refusal's or a short zip's Try
  again, the detail's place for the words, offered not run on return). One known edge, built on purpose: a Try again
  drawn while the browser said online and left standing is not withdrawn if the browser then goes offline; a press on
  it meets the dropped toast, which then waits (listening for `offline` too would withdraw it live).
- **Look at first:** `/design/library/download-toast`, with DevTools' Network set to Offline, then "A dropped
  connection" (it holds), then back to online (Try again returns); and the block comment above `Again` in
  `export-toast.tsx`.
