"use client";

import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
} from "react";
import { toast } from "sonner";

import { createClient } from "@/lib/supabase/client";

// The reel-curation controller for the host's event surfaces (rendered ONCE around BOTH the Uploads tab
// and the Reel tab, so adding in Uploads instantly reflects the filled chip + membership in the Reel
// tab). Mirrors LikesProvider's state machine but HOST-ONLY: the host is always signed in, so there's NO
// create-account branch (the whole signed-out dialog/OTP/Google/pending-replay path is dropped).
//
//   * a `reel` Set seeded from the server (listReelItems, in add-order) - a Set preserves INSERTION
//     ORDER, so `orderedIds` = [...reel] is the add-order the Reel panel renders directly;
//   * toggle() optimistically flips, then calls add_to_reel (access-checked RPC) / a reel_items RLS
//     delete (host-scoped), reverting on failure;
//   * writes persist to the DB immediately (client-direct, like the likes unlike), so a reload re-seeds
//     from server truth - no revalidate round-trip, so curating a burst of media stays snappy.
//
// add_to_reel enforces approved + host-owned media (an un-approved/removed/cross-event id is refused).

type ReelContextValue = {
  inReel: (id: string) => boolean;
  toggle: (id: string) => void;
  /** Album bulk-select: add a SET of approved ids at once (idempotent; skips already-in). Resolves
   *  to the count newly added so the caller can fire ONE summary toast (not N). */
  addMany: (ids: string[]) => Promise<number>;
  /** In-reel media ids in add-order (for the Reel panel). */
  orderedIds: string[];
};

const ReelContext = createContext<ReelContextValue | null>(null);

// Reads useReel(); renders nothing for its consumers when no ReelProvider wraps the surface, so the reel
// chip is opt-in per gallery (the guest galleries / recovery bin stay untouched), mirroring useLikes().
export function useReel(): ReelContextValue | null {
  return useContext(ReelContext);
}

// add_to_reel returns jsonb (typed as Json), so narrow it safely rather than index a union member.
function reelOk(data: unknown): boolean {
  return (
    typeof data === "object" &&
    data !== null &&
    (data as { ok?: unknown }).ok === true
  );
}

export function ReelProvider({
  eventId,
  initialReelIds,
  children,
}: {
  eventId: string;
  /** The host's reel media_ids in add-order (listReelItems) - seeds the chips + the Reel panel. */
  initialReelIds: string[];
  children: React.ReactNode;
}) {
  const [reel, setReel] = useState<Set<string>>(() => new Set(initialReelIds));
  const busyRef = useRef<Set<string>>(new Set()); // collapse double-taps per id

  const toggle = useCallback(
    (id: string) => {
      if (busyRef.current.has(id)) return;
      const wasIn = reel.has(id);
      busyRef.current.add(id);
      // Optimistic flip. A re-add appends to the end of the Set => add-order is preserved.
      setReel((prev) => {
        const next = new Set(prev);
        if (wasIn) next.delete(id);
        else next.add(id);
        return next;
      });

      void (async () => {
        const supabase = createClient();
        let ok: boolean;
        if (wasIn) {
          // Un-reel: host-RLS delete (reel_items_host_delete scopes it to the host's own event).
          const { error } = await supabase
            .from("reel_items")
            .delete()
            .eq("event_id", eventId)
            .eq("media_id", id);
          ok = !error;
        } else {
          const { data, error } = await supabase.rpc("add_to_reel", {
            p_media_id: id,
          });
          ok = !error && reelOk(data);
        }
        busyRef.current.delete(id);

        if (!ok) {
          // Revert the optimistic flip.
          setReel((prev) => {
            const next = new Set(prev);
            if (wasIn) next.add(id);
            else next.delete(id);
            return next;
          });
          toast.error(
            wasIn
              ? "Couldn't remove from your reel."
              : "Couldn't add to your reel.",
          );
          return;
        }
        // Confirm an add (names the impact); removing stays quiet (mirrors unlike).
        if (!wasIn) toast.success("Added to your reel");
      })();
    },
    [eventId, reel],
  );

  // Album bulk "Add to reel": optimistically add every not-already-in id (the Set keeps add-order),
  // fire add_to_reel for each in parallel (the RPC re-checks approved + host-owned, idempotent), then
  // revert only the failures. Returns the count newly added; the caller owns the single summary toast.
  const addMany = useCallback(
    async (ids: string[]): Promise<number> => {
      const toAdd = ids.filter((id) => !reel.has(id));
      if (toAdd.length === 0) return 0;
      setReel((prev) => {
        const next = new Set(prev);
        for (const id of toAdd) next.add(id);
        return next;
      });
      const supabase = createClient();
      const failed: string[] = [];
      await Promise.all(
        toAdd.map(async (id) => {
          const { data, error } = await supabase.rpc("add_to_reel", {
            p_media_id: id,
          });
          if (error || !reelOk(data)) failed.push(id);
        }),
      );
      if (failed.length > 0) {
        setReel((prev) => {
          const next = new Set(prev);
          for (const id of failed) next.delete(id);
          return next;
        });
      }
      return toAdd.length - failed.length;
    },
    [reel],
  );

  const inReel = useCallback((id: string) => reel.has(id), [reel]);
  const orderedIds = [...reel];

  return (
    <ReelContext.Provider value={{ inReel, toggle, addMany, orderedIds }}>
      {children}
    </ReelContext.Provider>
  );
}
