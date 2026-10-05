---
track: crumbs-81
status: handed-off      # open -> handed-off; deleted in the merge commit that integrates it
cut: "4c11a0ad"            # the launch-prep SHA the branch was cut from
board: none
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/app/(app)/dashboard/[eventId]/guests/
  - src/lib/db/queries/social.ts
  - src/components/shared/legal-consent-line.tsx
  - src/proxy.ts
  - src/proxy.test.ts
  - src/app/manifest.ts
  - src/components/app/event-settings/settings-state.tsx
  - src/components/app/event-settings/event-settings-sheet
  - src/components/guest/guest-account-menu.tsx
  - src/app/api/me/menu/
reads:                  # single-sources you depend on: never duplicate, never edit
  - src/lib/env.ts
  - src/app/admin/layout.tsx
---

# lp/crumbs-81

**Goal.** Five small things a person can hit, off the parked boards: a sealed album's Guests room tells of the shots waiting, the admin login's legal links and manifest resolve, a Settings write that throws settles as a refusal, Settings' head is described for a screen reader, and the guest's account menu reaches her profile.

## The brief

**The round's direction (Will, standing since round 13, carried by every lane):** never dev-tool-ish; a host of 1 to about 10 events first, scaling to hundreds; "all work no play is a boring consumer product": delight where it costs nothing in clarity; nothing depends on a timeline; "everything should feel as immediate/responsive/snappy, and anything taking longer should provide clear state feedback and potential interruptibility"; Partyreel runs with no AI managing it (every operator fix ships its `/admin` control, zero silent failures); cost is designed like the architecture. Production is the working version: a pick is the best of what was drawn, never a rule.

**Local only:** nothing of yours requests the Vercel alias, partyreel.com or any *.vercel.app, and nothing deploys. Port 3134 is yours; 3000 is Will's desk.

From ROADMAP "Now" (provenance in git). Each fix pinned by a test that fails on the old code:
1. **A sealed album's Guests room says "Nobody has added photos yet" while sealed shots wait**, since its list counts only unsealed uploads (`guests/guests-room.tsx`, `getEventGuests` in `src/lib/db/queries/social.ts`): say shots are waiting to develop (their count, if the read can carry it cheaply), in the camera's voice.
2. **On the admin host, `/login`'s consent line (`LegalConsentLine`) links `/terms` and `/privacy` relatively, and that surface 404s both, as it does `/manifest.webmanifest`:** link the app's absolute pages (the site URL from `env.ts`) and serve or drop the manifest there (`src/proxy.ts` routes the admin host; `proxy.test.ts` pins it).
3. **A Settings write that throws (a dropped connection) leaves its row busy for good and the unsaved value shown**, since `run` in `event-settings/settings-state.tsx` has no catch: settle a throw as a refusal (the value put back, the row free, a word that it did not save).
4. **Settings' page-level head carries no description** (`event-settings-sheet.tsx` sets `aria-describedby` undefined): the event's name as a screen-reader-only description.
5. **The guest's account menu (`guest-account-menu.tsx`) has no Your profile row**, so an account reaches `/me` only through the app's own menu: add it (`/api/me/menu` can return the handle for `/u/<handle>`).

Wiring rigor: the whole gate, each fix re-walked on your port at 375 and 1440 (the admin login on its host as `proxy.test.ts` names it; a thrown write by a blocked request).

**Starts from.** CLAUDE.md's working loop, the bible's ten and production as it is; the tests say what has to keep
working.

**Verify on.** The gate on the synced tree (CLAUDE.md's four steps), each step on its own exit code; `pnpm lab:smoke --base http://localhost:<port>` when the lane changes anything under `src/` but tests (it crawls what the change reaches: the Library, and every board whose drawings import a changed file); and the surfaces the Handoff is judged on, local and live.

## Questions (a recommended answer each; the Orchestrator relays them)

None is a one-way door (no migration, no write path moved); each is built as its recommended answer and listed again under the Handoff's calls.

1. **What does a sealed album's Guests room say while no guest is listed yet?** Recommended, built: "N shots are developing. Their guests join this list when the album develops." (singular: "1 shot is developing. Its guest joins this list when the album develops."), in the list's place and in the camera's own word, with Invite staying the quiet action (a room holding a roll is not an empty one). Not built: a line beside a list that already has guests ("and 12 more shots developing"), since nothing false is said there.
2. **Serve or drop the manifest on the admin host?** Recommended, built: serve. A drop is not available per surface (the file-based `manifest.ts` is linked by the shared root layout on both deployments), so the proxy's every-path rule for the admin host now leaves `/manifest.webmanifest` alone, as it does the icons (a static route, the CDN answers, no function runs). (Next's own docs: file-based metadata overrides the `metadata` object, so the admin layout cannot drop it either.) Consequence: the ops portal is installable, as "Partyreel" (the app's own name and description, start `/`, which the proxy sends to `/admin`). If he wants installs to say what they are, a portal-named manifest ("Partyreel Ops", start `/admin`) is a small follow-up in this one file.
3. **Where do the admin sign-in's Terms and Privacy go?** Recommended, built: the app's own pages (`SITE_URL`) in a new tab, as the guest door's links open, so a sign-in in the middle of a code survives the read. Not built: serving the two pages on the admin host (two allow-list entries, two more pages on the ops host, against its being an allow-list of the portal).
4. **Where does Your profile sit in the guest's account menu?** Recommended, built: after Manage event and ahead of Dashboard and Account (the host menu opens its account group with it), `/u/<handle>` where she has one and `/me` (which sends her on the day she has one) before the answer lands or while she has none.
5. **What does a Settings save that threw say?** Recommended, built: the title the refusal already carries ("Couldn't save that setting.") over "Check your connection and try again.", the neighbours' own words for a round trip that did not come back (the bin's Restore, her uploads' Remove).

## System-doc edits (in place, owned facts only)

- `docs/systems/host-app.md`: the Guests room's one-read bullet (the sealed album's room says its roll, `waiting`) and the Settings bullet (a save that throws settles as a refusal).
- `docs/systems/disposable-mode.md`: "No waiting id leaves the server" (the host's room asks what waits as one number, `countWaitingGuestShots`).
- `docs/systems/guest-flow.md`: "Auth-aware header island" (her handle rides `/api/me/menu`, so Your profile is `/u/<handle>`, else `/me`).
- `docs/systems/marketing-content.md`: the legal acceptance line (on the admin deployment its links are the app's own, absolute, new tab).
- `docs/systems/admin-observability.md`: the perimeter's matcher bullet (the files the shared layout links, `/manifest.webmanifest` alone among the routes).

## Deferred (ROADMAP one-liners, bucket named)

- Host: `countWaitingGuestShots` counts shots on a guest ticket the host later claimed (`guests.user_id` is the host), whom no list ever shows, so a host's own claimed-ticket shots read as "their guests join"; leave that ticket out (a join on the ticket's account) when it earns the read.
- Admin: name the admin deployment's manifest for the portal ("Partyreel Ops", start `/admin`) now that it serves one (`src/app/manifest.ts`).
- Engineering: a manifest's `reads` that names a scratch path (`drive-fixes.md`: `../partyreel-wt/_scratch/...`) resolves only from the primary checkout, so `track-manifests.test.ts` fails in every lane's worktree; resolve `reads` against the git common dir, or keep scratch paths out of `reads`.

## Handoff (replaces the chat report)

- **Commits:** the work is `f91d79d2f` (pushed to `origin/lp/crumbs-81`); this manifest is the commit after it, whose sha is the chat line's. `launch-prep` had moved by two record commits only (`docs/tracks/orchestrator.md`: `077f24d89`, `43367ee17`), which never need a sync, so there is no sync commit.
- **Gates**, each on its own exit code, run on `f91d79d2f` (the manifest commit changes no code), logs in `/Users/gibby/local/ai/partyreel-wt/_scratch/crumbs-81/`:
  - `pnpm typecheck` exit 0 (`typecheck-2.log`); `pnpm lint` exit 0, no warning (`lint-3.log`).
  - `pnpm test` (`test-full-2.log`): 988 of 989 files and 12,280 of 12,281 tests pass. The one failure is not this lane's: `src/lib/track-manifests.test.ts > drive-fixes.md is well-formed` fails because that manifest's `reads` name `../partyreel-wt/_scratch/drive-walk/ledger.txt`, which resolves from the primary checkout only (from any worktree it is `partyreel-wt/partyreel-wt/...`), so it fails in every lane's worktree at this base (a Deferred line above).
  - `zsh scripts/build-lock.sh pnpm build` exit 0 (`build-1.log`): `/manifest.webmanifest` is `○ (Static)`, and the built matcher (`.next/server/functions-config-manifest.json`) carries `manifest\.webmanifest$` on the admin hosts' rule.
  - `pnpm lab:smoke --base http://localhost:3134` exit 0: 209 checks, 0 failing (`smoke-1.log`); its two PREMISE lines say customize's four open asks and event-header's one (`doors`) describe docs and `event-settings/` files this lane touched, to re-read before his next sitting.
- **Lane check** (`git diff --name-only origin/launch-prep...HEAD`) = the owned paths + this file, plus these exceptions, each with its why:
  - Tests beside owned sources, since the brief pins each fix by a test that fails on the old code and the owns' prefixes name the sources: `src/components/app/event-settings/settings-state.test.tsx` (new), `src/components/shared/legal-consent-line.test.tsx`, `src/lib/db/queries/social.test.ts`, `src/components/app/user-menu.test.tsx` (the guest menu's own tests live there).
  - `src/components/app/event-settings/event-page.room.test.tsx`: crumbs-59's pin that a page names no description, reshaped on purpose for item 4 (its scar kept: the dialog never points at an element that is not on the page, and Radix warns of nothing, at the rows, at every page and moving between them; its expired reason, "a page names no description", dropped, said in its header).
  - `src/components/guest/guest-header.tsx` (five lines) and its test: the island that asks `/api/me/menu` is the only hand that can give the menu her handle (`MenuData.slug`, the phase-1 `null`, the answer's field, the mapping, the prop).
  - `src/components/app/share/guests-panel.test.tsx` (one line): `waiting: 0` in its typed `GuestsRoomData` fixture.
  - `docs/systems/{host-app,disposable-mode,guest-flow,marketing-content,admin-observability}.md`: the System-doc edits above.
- **The items**, each re-walked on port 3134 at 375 and 1440 (a same-origin iframe of that width in my own Chrome tab, the window itself cannot resize) as willg97 on a disposable album, `crumbs-81 sealed (disposable)` (`0732b206-d1df-4ed1-b43d-e05b164e982c`), screenshots in `_scratch/crumbs-81/shots/`:
  1. A sealed album's Guests room says "3 shots are developing. Their guests join this list when the album develops." at 375 (`item1-guests-room-3-shots-375.png`) and the desk (`...-desk.jpg`), "1 shot is developing. Its guest joins..." at 1440 (`item1-guests-room-1-shot-1440.jpg`), counting only the guests' shots (the host's own sealed shot is not counted: 4 in the album, 3 counted); after Develop now the room lists the three guests and the line is gone (`item1-guests-room-after-develop-guests-listed.jpg`). Code: `countWaitingGuestShots` (`social.ts`), `readGuestsRoom`'s `waiting`, `guests-room.tsx`. Pins, run against the old code before the fix (`item1-*-before.log`): `social.test.ts` (five, all fail), `room.server.test.ts` (three, all fail), `guests-room.test.tsx` (five, four fail; the fifth guards what must not change).
  2. On the admin deployment (`NEXT_PUBLIC_SURFACE=admin NEXT_PUBLIC_ADMIN_HOST=admin.localhost pnpm dev`, `http://admin.localhost:3134/login`) the consent line links `https://partyreel.com/terms` and `/privacy` with `target=_blank rel=noopener` at 375 and 1440 (`item2-admin-login-consent-links-*`); `/manifest.webmanifest` answers 200 with no proxy run (`dev-admin.log`: `GET /manifest.webmanifest 200 in 10ms (next.js: 4ms, application-code: 6ms)`), while `/terms`, `/privacy`, `/pricing`, `/manifest.webmanifest/x` and `/manifest.webmanifestx` stay 404 and `/robots.txt` and the icons 200. The old code, stashed for a minute on the same server, answered the manifest 404 and linked `/terms` and `/privacy` relatively. The partyreel.com links were read, never opened. Code: `legal-consent-line.tsx`, `proxy.ts`'s second matcher (`manifest\.webmanifest$`), a WHY note in `manifest.ts`. Pins, run against the old code (`item2-before.log`): `legal-consent-line.test.tsx` (two: the admin deployment's links fail, the relative links elsewhere guard), `proxy.test.ts` (the manifest among the paths no host's proxy takes fails; the starts-like guard, that a path merely beginning like it is still the allow-list's, holds on both).
  3. A blocked Server Action (`fetch` rejecting a `Next-Action` request in the page's own world) puts the switch back, frees the row and toasts "Couldn't save that setting. Check your connection and try again." at 375 (`item3-settings-thrown-write-toast-375.png`) and the desk, for a switch and for the typed Event name (the field returns to the saved name); the same switch then saved once the block was off. Code: `run`'s catch in `settings-state.tsx`. Pins, all six failing on the old code (`item3-before.log`, `settings-state-old.log`): `settings-state.test.tsx` (five: the four writes, what waits on a save is released, an older save's throw never undoes a newer one) and `event-settings-sheet.test.tsx` (one).
  4. Settings' page head is described by the event's name, out of sight (`aria-describedby` names a `sr-only` element reading the event's name, 1 by 1 px, at the desk and at 375: `item4-settings-page-head-375.png`), with no Radix warning. Code: `event-settings-sheet.tsx` (a `DialogPrimitive.Description` as the head's child). Pins (`item4-before.log`): `event-settings-sheet.test.tsx` (three, two fail on the old code and the rows' description guards), `event-page.room.test.tsx` (reshaped, above).
  5. The guest's account menu carries Your profile after Manage event, `href=/u/willg` for her live handle, and a click lands on her page (`item5-guest-account-menu-your-profile-desk.jpg`); the `/me` row for an account with no handle is pinned in unit tests only (no signed-in account without a handle was at hand, and a profile was not to be edited). Code: `route.ts` (`slug`), `guest-account-menu.tsx`, `guest-header.tsx`. Pins (`item5-before.log`): `route.test.ts` (new, four: the two about her handle fail on the old code, the 401 and the "only what is hers" guards hold), `user-menu.test.tsx` (two, both fail), `guest-header.test.tsx` (two, both fail).
- **Live data left behind:** `crumbs-81 sealed (disposable)` (willg97's, camera, develop time Oct 12, one host shot and one guest shot, 0.33 MB), kept so the sealed room can be looked at; delete it from its Settings when seen (the nightly purge takes its objects after the 30 days).
- **Assets requested from Will:** none.
- **Board ideas:** the hub's Guests card reads "0 guests" while a sealed roll waits, as the room did (the one count by design): say "N shots developing" there (`event-cards-row.tsx`), so the hub and the room agree.
- **Proposed migrations / Worker / Vercel / Stripe / env changes:** none.
- **Calls his to overrule**, one line each: the room's words over a sealed roll and Invite going quiet while one waits (Q1); the admin host serves the app's manifest, so the ops portal is installable as "Partyreel" (Q2); the admin sign-in's legal links open the app's pages in a new tab (Q3); Your profile after Manage event, `/me` while handle-less (Q4); a thrown save says "Check your connection and try again." (Q5).
- **Look at first:** the Guests room of `crumbs-81 sealed (disposable)` (`/dashboard/0732b206-d1df-4ed1-b43d-e05b164e982c?room=guests`); the admin login at `http://admin.localhost:<port>/login` under the two env vars above; and one thing to know when `back-layers` lands: item 4 relies on `PopupHeader` drawing its `children` in both shapes (`ui/popup.tsx` is theirs), which `event-settings-sheet.test.tsx` and `event-page.room.test.tsx` hold.
