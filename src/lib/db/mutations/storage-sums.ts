/**
 * THE OPERATOR'S REBUILD OF ONE HOST'S STORAGE SUMS (storage-sums-signal): `rebuild_storage_sums` (service role,
 * 20261006180000) takes her profiles row first, so no writer of hers moves a sum meanwhile, drops her event and host
 * sum rows and makes them again from her media, and answers what her summary read before and after. The caller
 * re-checks admin and AAL2 first (`rebuildStorageSumsAction`); this is the write half only.
 */
import "server-only";

import { QueryFailedError } from "@/lib/db/must-query";
import type {
  Figures,
  RebuildAnswer,
} from "@/lib/lifecycle/sweeps/storage-sums-state";
import { createAdminClient } from "@/lib/supabase/admin";

type AdminClient = ReturnType<typeof createAdminClient>;

function figures(value: unknown, where: string): Figures {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new TypeError(`rebuild_storage_sums: ${where} is not an object`);
  }
  const o = value as Record<string, unknown>;
  const at = (key: string) => {
    const n = o[key];
    if (typeof n !== "number" || !Number.isFinite(n)) {
      throw new TypeError(
        `rebuild_storage_sums: ${where}.${key} is not a number`,
      );
    }
    return n;
  };
  return {
    active: at("active_bytes"),
    deleted: at("standby_bytes"),
    system: at("system_bytes"),
  };
}

/** The function's jsonb, read defensively: an answer this code does not know is a failure, never a rebuild. */
export function parseRebuildAnswer(data: unknown): RebuildAnswer {
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    throw new TypeError("rebuild_storage_sums: not an object");
  }
  const o = data as Record<string, unknown>;
  if (o.ok === false && o.reason === "no_host") {
    return { ok: false, reason: "no_host" };
  }
  if (o.ok !== true) {
    throw new TypeError("rebuild_storage_sums: an answer it does not know");
  }
  return {
    ok: true,
    before: figures(o.before, "before"),
    after: figures(o.after, "after"),
  };
}

export async function rebuildStorageSums(
  admin: AdminClient,
  hostId: string,
): Promise<RebuildAnswer> {
  const { data, error } = await admin.rpc("rebuild_storage_sums", {
    p_host_id: hostId,
  });
  if (error) {
    throw new QueryFailedError("storage sums: rebuild_storage_sums", error);
  }
  return parseRebuildAnswer(data);
}
