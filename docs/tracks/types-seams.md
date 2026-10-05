---
track: types-seams
status: handed-off      # open -> handed-off; deleted in the merge commit that integrates it
cut: "9fd2bccb"            # the launch-prep SHA the branch was cut from
board: none
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/lib/db/mutations/event-passes
  - src/lib/db/queries/accounts
  - src/lib/db/queries/drive
  - src/lib/db/queries/jobs
reads:                  # single-sources you depend on: never duplicate, never edit
  - src/lib/db/types.ts
---

# lp/types-seams

**Goal.** Drop the five typed seams billing-locks and drive-wiring left for the types to catch up, now that src/lib/db/types.ts knows their tables and functions: passCreditDb, uploadsWindowsDb, untyped in queries/drive.ts, the cast in queries/drive-stops.ts, untypedDb in queries/jobs.ts.

## The brief

**The round's direction (Will, standing since round 13, carried by every lane):** never dev-tool-ish (the viewfinder's corners survive only as a focus mark, never a style, and so does nothing of their loading state); a host of 1 to about 10 events first, scaling to hundreds; "all work no play is a boring consumer product": delight where it costs nothing in clarity; nothing depends on a timeline (undated, morning-only and multi-day events all read well); "everything should feel as immediate/responsive/snappy, and anything taking longer should provide clear state feedback and potential interruptibility"; Partyreel runs with no AI managing it (every operator fix ships its `/admin` control); cost is designed like the architecture (every image and video action multiplies at scale). Production is the working version: a pick is the best of what was drawn, never a rule.

**★ Local only:** nothing of yours requests the Vercel alias, partyreel.com or any *.vercel.app. Port 3131 is yours; 3000 is Will's desk.

`src/lib/db/types.ts` was regenerated on launch-prep after migrations `billing_locks` and `cloud_export` (it is never hand-edited). Each lane left a seam casting the admin client to an untyped `SupabaseClient` until then: `passCreditDb` (`src/lib/db/mutations/event-passes.ts`), `uploadsWindowsDb` (`src/lib/db/queries/accounts.ts`), `untyped` (`src/lib/db/queries/drive.ts`), the cast in `src/lib/db/queries/drive-stops.ts`, and `untypedDb` (`src/lib/db/queries/jobs.ts`). Remove each and its comment, use the typed client, and fix what the real types surface (a nullable column, an RPC's Args taking no null: omit the key, as `over-capacity.ts` does) without changing behaviour; a test that pins a wire shape keeps its meaning. Drop any `SupabaseClient` import left unused.

Wiring rigor: typecheck, lint, the whole `pnpm test`, the build, each through the build lock; no lab run is needed (no rendered path changes).

**Starts from.** CLAUDE.md's working loop, the bible's ten and production as it is; the tests say what has to keep
working.

**Verify on.** The gate on the synced tree (CLAUDE.md's four steps), each step on its own exit code; `pnpm lab:smoke --base http://localhost:<port>` when the lane changes anything under `src/` but tests (it crawls what the change reaches: the Library, and every board whose drawings import a changed file); and the surfaces the Handoff is judged on, local and live.

## Questions (a recommended answer each; the Orchestrator relays them)

- Drop a sixth untyped admin cast too, `src/lib/drive/mail.server.ts:39` (`admin(): SupabaseClient`, no seam comment, outside this lane's `owns`)? Recommended: yes, in the next lane that owns `src/lib/drive/`: three lines (the import, the return type, the return), and a scratch copy of the file typechecks clean against the real types with no other fix. Left standing here.

## System-doc edits (in place, owned facts only)

- `docs/systems/database-security.md`, Gotchas: one ★ bullet, "A typed RPC call cannot say null" (the generated Args mark an argument with a default optional and none nullable, and PostgREST finds a function by the names sent: an argument whose default is null takes `?? undefined`, one with no default stays on the wire as a cast null; both checked live, the Handoff's last item).

## Deferred (ROADMAP one-liners, bucket named)

- Now: `src/lib/drive/mail.server.ts` still casts the admin client to an untyped `SupabaseClient` (three lines; probed clean against the real types).
- Now: `queries/drive.ts`'s table readers (`connectionOf`, `sendRowOf`, `readDriveAdmin`'s lists) still take typed rows through `Record<string, unknown>` casts and `Array.isArray` guards, the untyped client's leftovers; typed fields would shrink them, but no test reads those readers yet.

## Handoff (replaces the chat report)

- The work commit `022ec0b2d` and one docs-only commit after it (`fdb2f6b58`, one line of the Gotchas bullet), pushed to `origin/lp/types-seams`; no sync commit: launch-prep moved only by a record commit since the base `0833b00b1` (`a6f905d4d`, `docs/tracks/orchestrator.md` alone), none in `src/lib/db/types.ts` or a path of mine. The head is in the chat line.
- Gates on `022ec0b2d` (tree clean at the start: `_scratch/types-seams/gate-status.txt` is empty, the sha is in `gate-sha.txt`), each on its own exit code in `_scratch/types-seams/<step>-2.exit`, logs `<step>-2.log`: `pnpm typecheck` 0, `pnpm lint` 0 (no output), `pnpm test` 0 (981 files, 12,167 tests), `pnpm build` 0 (compiled, 268/268 pages). The same four ran green on the uncommitted tree first (`*-1.log`). No `lab:smoke`: every file touched is `server-only` and no rendered path changed, as the brief's wiring rigor says. The two docs-only commits after it (`fdb2f6b58` and this file's) were checked by a full `pnpm test` on the head (exit 0, `_scratch/types-seams/test-3.log`).
- Lane check, `git diff --name-only origin/launch-prep...HEAD`: the five owned files (`src/lib/db/mutations/event-passes.ts`, `src/lib/db/queries/accounts.ts`, `drive.ts`, `drive-stops.ts`, `jobs.ts`) + `src/lib/db/queries/drive.test.ts` (new, under the `queries/drive` prefix) + this file; two exceptions: `src/app/admin/accounts/reads.test.ts` (two hunks, the brief's "a test that pins a wire shape keeps its meaning": it pinned the first page's `p_after_id` as null, and now pins it absent) and `docs/systems/database-security.md` (the one ★ bullet above).
- The items, one line each:
  - `passCreditDb`, `uploadsWindowsDb`, `untyped`, drive-stops's cast and `untypedDb` are gone with their comments; no `SupabaseClient` import is left unused (drive-stops keeps its one, for `SupabaseClient<Database>`).
  - `drive.ts`'s `rpc()` is generic over the generated `cloud_*` names and Args, so a wrong name, a missing key or a wrong type is a compile error; `cloud_export_sweep`, whose Args are `never`, is called with none (the body is `{}` either way).
  - `readMyDriveStops` takes `SupabaseClient<Database>` (the bell passes its request client) and reads typed fields; `readMySends`, `readMySend` and `readMySentTotals` take the typed server client, and `readMySentTotals` loses its `as unknown as PromiseLike<PageResult<…>>` cast.
  - Six arguments of five functions have a SQL default (null) and now take `?? undefined`, so a null leaves the key out: `uploads_windows.p_after_id`, `cloud_connection_refreshed.p_refresh_ct`, `cloud_connection_operator.p_note`, `cloud_export_report.p_finding`, `cloud_export_check_page.p_duplicates` and `.p_finding` (the work commit's body says "five arguments" and lists these six).
  - Seven arguments of four functions have no default and take a null on purpose (`cloud_connection_upsert.p_email`, `.p_name`, `.p_refresh_expires_at`; `cloud_connection_room.p_limit`; `cloud_connection_root.p_candidate`, `.p_expected`; `cloud_export_act.p_user`): they stay on the wire as null through `nullableArg`, the one cast, since a key left out is PGRST202.
  - `reportWork`'s `p_items` is cast `as Json` (the report route builds each item from the Worker's JSON: strings, numbers, booleans, nulls); the exported signatures are otherwise unchanged, so no caller moved.
  - `UploadsWindowRow` stays the app's validated reading of the row, not the generated one: a `returns table` column carries no nullability, so the generated row types `storage_cap_bytes` as `number` and `pass_lapsed_at` as `string`, while live, three real hosts' rows came back with a null `pass_lapsed_at` on all three and a null `storage_cap_bytes` on some; its comment says so.
  - New `src/lib/db/queries/drive.test.ts` (14 tests): each changed call's body as PostgREST receives it (read after `JSON.stringify`, so an `undefined` is no key), against the migrations' own signatures (every argument without a default is on the wire; no key names an argument the function lacks), a real 0 kept for `p_limit` and `p_duplicates`, and the sweep called with none. Mutation-checked: dropping the upsert's nulls, `|| undefined` on `p_duplicates` and sending `p_refresh_ct` as null each turn exactly one case red.
  - Live, read-only, no key printed (`node --env-file=.env.local`, scripts `_scratch/types-seams/live-uploads-windows.mjs` and `live-drive-wires.mjs`): `uploads_windows` with `p_after_id` left out and with null both answer, and over three real hosts it returned three rows; ten wire shapes of seven other functions (ghost ids, so each answers from its first lookup and writes nothing; not `cloud_connection_upsert`, which writes, nor the sweep, which works) resolve on the real PostgREST; and a key with no default left out is `PGRST202` for `uploads_windows` (`p_host_ids`), `cloud_connection_room` (`p_limit`) and `cloud_export_act` (`p_user`).
- Assets requested from Will: none
- Board ideas: none (a wiring lane; nothing rendered)
- Proposed migrations / Worker / Vercel / Stripe / env changes: none
- Calls his to overrule, one line each:
  - The seven required nulls are cast (`nullableArg`), not given `default null` by a migration (which would drop the cast): a migration for a type's convenience was not mine to take.
  - `drive.ts`'s table readers keep their defensive reading of typed rows (no test reads them, and the brief said no behaviour change), while `drive-stops.ts`, small and wholly the seam, reads typed fields.
  - The recurring rule has a home as one ★ Gotchas bullet in `database-security.md`, and `drive.test.ts` is new: both are beyond the five seams.
- Look at first: `src/lib/db/queries/drive.ts` from its top to `nullableArg` and the `?? undefined` sites, then the case list in `drive.test.ts`, which is the wire as PostgREST receives it.
