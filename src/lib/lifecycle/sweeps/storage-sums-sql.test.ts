/**
 * THE STORAGE SUMS' SQL, PINNED (storage-sums-signal, 20261007022000): the lock order that closes the one deadlock the
 * sums' trigger opened, read from the definition that wins across the migration set (`liveFunction`), so a later
 * `create or replace` of `remove_my_upload` that drops a lock or reorders them fails here; and the two functions the
 * nightly check and the Rebuild call, the service role's alone. Its behaviour on the live schema is the migration's own
 * rolled-back proof, its races the pre-flight's (the file's header).
 */
import { describe, expect, it } from "vitest";

import {
  executableMigrations,
  liveFunction,
} from "@/lib/db/testing/migrations";

/** Every grant or revoke naming the function, across the set, in order, as code. */
function grantsOf(name: string): string[] {
  const out: string[] = [];
  for (const { sql } of executableMigrations()) {
    const re = new RegExp(
      `(?:grant|revoke) [^;]* on function public\\.${name}\\([^)]*\\)[^;]*;`,
      "g",
    );
    for (const m of sql.matchAll(re)) out.push(m[0]);
  }
  return out;
}

describe("remove_my_upload's sneaky-block withdrawal", () => {
  const body = liveFunction("remove_my_upload").code;
  const arm = body.indexOf("if v_already_removed then");
  const main = body.indexOf("set status = 'removed', removed_at = now()");
  const sneaky = body.slice(arm, main);

  it("is 20261007022000's definition", () => {
    expect(liveFunction("remove_my_upload").file).toBe(
      "20261007022000_storage_sums_signal.sql",
    );
  });

  it("★ takes her host's profiles row first, then the media row NOWAIT, then re-marks: the order no partner can cycle with", () => {
    const candidate = sneaky.indexOf("if found then");
    const herRow = sneaky.indexOf(
      "perform 1 from public.profiles p where p.id = v_host for no key update;",
    );
    const theRow = sneaky.indexOf(
      "perform 1 from public.media x where x.id = p_media_id for no key update nowait;",
    );
    const remark = sneaky.indexOf(
      "update public.media m set removed_by_uploader = true where m.id = p_media_id and m.status = 'removed' and not m.removed_by_uploader and exists (select 1 from public.event_blocks b where b.event_id = m.event_id and m.id = any (b.removed_media_ids) and m.removed_at = b.created_at);",
    );
    expect(arm).toBeGreaterThan(-1);
    expect(candidate).toBeGreaterThan(-1);
    expect(herRow).toBeGreaterThan(candidate);
    expect(theRow).toBeGreaterThan(herRow);
    expect(remark).toBeGreaterThan(theRow);
  });

  it("locks only a row still the block's and not yet withdrawn: the candidate read decides, in the guest arm alone", () => {
    expect(sneaky).toContain(
      "if not v_is_host_upload then select e.host_id into v_host from public.media m join public.events e on e.id = m.event_id where m.id = p_media_id and m.status = 'removed' and not m.removed_by_uploader and exists (select 1 from public.event_blocks b where b.event_id = m.event_id and m.id = any (b.removed_media_ids) and m.removed_at = b.created_at); if found then",
    );
    // No lock of her row anywhere else in the body: the main arm keeps media then her row (in the trigger).
    expect(body.split("from public.profiles").length - 1).toBe(1);
    expect(body.split("nowait").length - 1).toBe(1);
    expect(body.slice(main)).not.toContain("for no key update");
  });

  it("keeps its grants as they stand: the signed-in caller's, never anon's or PUBLIC's", () => {
    expect(grantsOf("remove_my_upload").slice(-2)).toEqual([
      "revoke all on function public.remove_my_upload(uuid) from public, anon;",
      "grant execute on function public.remove_my_upload(uuid) to authenticated;",
    ]);
  });
});

describe("the check and the Rebuild", () => {
  it.each(["storage_sums_drift", "rebuild_storage_sums"])(
    "%s is a pinned SECURITY DEFINER body, the service role's alone",
    (name) => {
      const fn = liveFunction(name);
      expect(fn.code).toMatch(/\bsecurity definer\b/);
      expect(fn.code).toContain("set search_path = ''");
      const grants = grantsOf(name);
      expect(grants.at(-1)).toMatch(
        /^grant execute on function .* to service_role;$/,
      );
      expect(grants.join(" ")).not.toMatch(
        /to (?:anon|authenticated|public)\b/,
      );
    },
  );

  it("the check writes nothing: STABLE", () => {
    expect(liveFunction("storage_sums_drift").code).toMatch(/\bstable\b/);
  });

  it("the sub-sweep's switch is seeded ON, never flipped by a re-apply", () => {
    const seeded = executableMigrations()
      .map(({ sql }) => sql)
      .join(" ");
    expect(seeded).toContain(
      "insert into public.ops_flags (key, enabled) values ('storage_sums_enabled', true) on conflict (key) do nothing;",
    );
  });
});
