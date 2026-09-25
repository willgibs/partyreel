"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { toast } from "sonner";

import { AccountDoor, DOOR_WEAR } from "@/components/auth/account-door";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { QueryFailedError } from "@/lib/db/must-query";
import { claimAnonymousUploads } from "@/lib/guest/claim-uploads";
import { captureError } from "@/lib/observability/sentry";
import { createClient } from "@/lib/supabase/client";

// The like controller for a gallery. Rendered ONCE per surface that opts into likes (the guest event
// page, the host's album, the Uploads tab, the Likes tab); a surface that doesn't wrap its grid gets
// no like UI because useLikes() returns null. It is one state machine for a whole grid:
//   * signedIn resolved on mount (getSession, local);
//   * a store of liked ids seeded from `my_liked_media_ids` (the viewer's OWN likes among the grid's ids,
//     the ids in the POST body; anon => nothing asked), so hearts paint correctly without threading
//     state through SSR / the gallery poll / the feed RPCs;
//   * toggle() does an optimistic flip + the RPC (like_media) / RLS delete (unlike), reverting on failure;
//   * the signed-OUT path: stash a pending intent + open ONE shared create-account dialog;
//     the in-page OTP verify replays the like, and a redirect sign-in (Google / magic link) replays any
//     pending like on the next mount.
// Counts are NEVER handled here (they're host-only, read server-side via get_event_like_counts).
//
// ★ A HEART RE-RENDERS ONE MARK, NEVER THE ALBUM (the album-window lane). The liked set used to be
// React state on this provider, so every like handed every consumer a new context value: the grid,
// every tile and every mark of a 1,145-photograph album re-rendered for one heart (measured on the
// scale page: 1,145 tiles and 1,145 marks a like). The set is now a STORE read per id through
// `useSyncExternalStore` (`useIsLiked`), and the context value never changes after mount, so a like
// notifies exactly the marks subscribed to that one id.

/** The viewer's likes, read per id: `has` now, `subscribe` for one id's changes. */
export type LikesStore = {
  has: (id: string) => boolean;
  subscribe: (id: string, onChange: () => void) => () => void;
};

type WritableLikesStore = LikesStore & {
  set: (id: string, liked: boolean) => void;
};

function createLikesStore(initial: Iterable<string>): WritableLikesStore {
  const liked = new Set(initial);
  const listeners = new Map<string, Set<() => void>>();
  return {
    has: (id) => liked.has(id),
    subscribe(id, onChange) {
      let set = listeners.get(id);
      if (!set) listeners.set(id, (set = new Set()));
      set.add(onChange);
      return () => {
        set.delete(onChange);
        if (set.size === 0) listeners.delete(id);
      };
    },
    set(id, on) {
      if (liked.has(id) === on) return;
      if (on) liked.add(id);
      else liked.delete(id);
      listeners.get(id)?.forEach((l) => l());
    },
  };
}

type LikesContextValue = {
  /** The store itself, for `useIsLiked`. Stable for the provider's life. */
  store: LikesStore;
  /**
   * A READ, NOT A SUBSCRIPTION: right for a handler deciding what a tap does, wrong for anything
   * rendered, which reads `useIsLiked(id)` and re-renders when that one id changes.
   */
  isLiked: (id: string) => boolean;
  toggle: (id: string) => void;
  /** Album bulk-select (host only): like a SET of ids at once (idempotent; skips already-liked).
   *  Resolves to the count newly liked so the caller fires ONE summary toast. */
  likeMany: (ids: string[]) => Promise<number>;
};

const LikesContext = createContext<LikesContextValue | null>(null);

export function useLikes(): LikesContextValue | null {
  return useContext(LikesContext);
}

const noSubscription = () => () => {};

/**
 * WHETHER THE VIEWER LIKES THIS ONE PHOTOGRAPH, subscribed to that id alone: the component calling it
 * re-renders when this id's heart flips and for no other like in the album. False without a
 * `LikesProvider` (a surface with no likes).
 */
export function useIsLiked(id: string): boolean {
  const store = useContext(LikesContext)?.store;
  const subscribe = useCallback(
    (onChange: () => void) =>
      store ? store.subscribe(id, onChange) : noSubscription(),
    [store, id],
  );
  const read = () => store?.has(id) ?? false;
  return useSyncExternalStore(subscribe, read, read);
}

/**
 * IN-MEMORY LIKES, with no session and no network: a tap flips the heart and nothing else. For the
 * lab's scale page (`/design/album-scale`), which proves on a production build that a heart
 * re-renders one mark, through the same store and hooks the product reads.
 */
export function LocalLikesProvider({
  initialLikedIds,
  children,
}: {
  initialLikedIds?: string[];
  children: React.ReactNode;
}) {
  const [store] = useState(() => createLikesStore(initialLikedIds ?? []));
  const value = useMemo<LikesContextValue>(
    () => ({
      store,
      isLiked: store.has,
      toggle: (id) => store.set(id, !store.has(id)),
      likeMany: async (ids) => {
        const fresh = ids.filter((id) => !store.has(id));
        for (const id of fresh) store.set(id, true);
        return fresh.length;
      },
    }),
    [store],
  );
  return (
    <LikesContext.Provider value={value}>{children}</LikesContext.Provider>
  );
}

// Remembers a like intent across a REDIRECT sign-in (Google / magic link), replayed on the next mount.
// The in-page OTP path completes inline (no redirect) but sets it too, uniformly; like_media is
// idempotent so a double-fire is harmless.
const PENDING_PREFIX = "pr_pending_like_";

// like_media returns jsonb (typed as Json), so narrow it safely rather than index a union member.
function likeOk(data: unknown): boolean {
  return (
    typeof data === "object" &&
    data !== null &&
    (data as { ok?: unknown }).ok === true
  );
}

export function LikesProvider({
  mediaIds,
  initialLikedIds,
  mode = "keep",
  onRemoved,
  children,
}: {
  /** The visible media ids — seeds liked state (`my_liked_media_ids`) + asks about each id that joins the set (poll). */
  mediaIds: string[];
  /** Optional instant-paint seed (the Likes tab passes every id, all liked) before the select resolves. */
  initialLikedIds?: string[];
  /** "keep" = the heart toggles in place (event page, Uploads). "remove" = an unlike drops the tile (Likes tab). */
  mode?: "keep" | "remove";
  /** Fires after a confirmed unlike in "remove" mode so the gallery can drop the tile. */
  onRemoved?: (id: string) => void;
  children: React.ReactNode;
}) {
  const [store] = useState(() => createLikesStore(initialLikedIds ?? []));
  // Read by the handlers at tap time, never rendered: a ref keeps `toggle` and `likeMany` stable, so
  // the context value is too (see the head note).
  const signedInRef = useRef(false);
  const modeRef = useRef(mode);
  const onRemovedRef = useRef(onRemoved);
  useEffect(() => {
    modeRef.current = mode;
    onRemovedRef.current = onRemoved;
  });
  const [dialogOpen, setDialogOpen] = useState(false);
  const pendingIdRef = useRef<string | null>(null);
  const busyRef = useRef<Set<string>>(new Set()); // collapse double-taps per id
  // The ids already asked about and answered. The seed only ever ADDS hearts (a heart this tab
  // flips is the toggle's own state), so an answered id stays answered, and a poll that brings one
  // new photograph into a thousand-item album asks about that one id, not the whole album again.
  const askedRef = useRef<Set<string>>(new Set());

  // A stable dependency for "the visible set changed" (not "a new array identity each poll").
  const idsKey = mediaIds.join(",");

  // Resolve sign-in, seed liked state from the viewer's own likes, and replay any redirect-queued like.
  useEffect(() => {
    let active = true;
    void (async () => {
      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!active) return;
      signedInRef.current = Boolean(session);
      if (!session) return;

      // Seed: which of the grid's media has THIS user liked, through `my_liked_media_ids` (SECURITY
      // INVOKER over media_likes' owner-only RLS, so it can answer only for auth.uid()).
      // ★ THE IDS RIDE THE POST BODY (the 1,000-row round). The old `.in("media_id", ids)` put every
      // visible id in the URL, about 37 bytes an id, so once the album was read whole a large one's
      // request failed outright, and the failure was swallowed: the hearts simply started empty.
      // The answer is ONE uuid[], which neither a URL nor the row cap can clip (measured: a body of
      // 100,000 ids answers 200). Only the ids not yet answered are asked.
      // Add-only merge => never clobbers an in-flight optimistic toggle, and genuinely-new poll items
      // (which the user hasn't liked) correctly stay unfilled.
      const fresh = mediaIds.filter((id) => !askedRef.current.has(id));
      if (fresh.length > 0) {
        const { data, error } = await supabase.rpc("my_liked_media_ids", {
          p_media_ids: fresh,
        });
        if (error) {
          // The seed is cosmetic, so no toast: the hearts start unfilled, the ids stay unasked (the
          // next change of the grid asks again), and the idempotent like RPC still lands a tap. But
          // it is never silent either: a failed read is reported.
          captureError(
            "media",
            new QueryFailedError("likes: my_liked_media_ids", error),
            { ids: fresh.length },
          );
        } else if (active) {
          for (const id of fresh) askedRef.current.add(id);
          // One uuid[] value (never rows); anything else reads as no hearts rather than a crash.
          const likedIds: string[] = Array.isArray(data) ? data : [];
          for (const id of likedIds) store.set(id, true);
        }
      }

      // Replay a like queued before a redirect sign-in. Keys are cleared after, so this fires once.
      if (typeof window !== "undefined") {
        const pending: string[] = [];
        for (let i = 0; i < localStorage.length; i++) {
          const k = localStorage.key(i);
          if (k && k.startsWith(PENDING_PREFIX))
            pending.push(k.slice(PENDING_PREFIX.length));
        }
        let any = false;
        for (const id of pending) {
          // DELIBERATE swallow: likeOk(undefined) is false, so a failed replay just
          // doesn't fill that heart (and fires no toast). Fails closed, and one
          // stuck replay must not block the rest of the queued likes.
          // eslint-disable-next-line partyreel/no-swallowed-db-error
          const { data } = await supabase.rpc("like_media", { p_media_id: id });
          if (active && likeOk(data)) {
            store.set(id, true);
            any = true;
          }
          localStorage.removeItem(PENDING_PREFIX + id);
        }
        if (active && any) toast.success("Added to your likes");
      }
    })();
    return () => {
      active = false;
    };
    // idsKey stands in for mediaIds; the rest are stable refs/setters.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idsKey]);

  const toggle = useCallback(
    (id: string) => {
      if (busyRef.current.has(id)) return;

      // Signed out: remember the intent + open the create-account dialog.
      if (!signedInRef.current) {
        if (typeof window !== "undefined")
          localStorage.setItem(PENDING_PREFIX + id, "1");
        pendingIdRef.current = id;
        setDialogOpen(true);
        return;
      }

      const wasLiked = store.has(id);
      busyRef.current.add(id);
      // Optimistic heart flip (the count, if any, is host-only and not shown on this surface).
      store.set(id, !wasLiked);

      void (async () => {
        const supabase = createClient();
        let ok: boolean;
        if (wasLiked) {
          // Unlike: owner-RLS delete (self-scoped to auth.uid()), idempotent.
          const { error } = await supabase
            .from("media_likes")
            .delete()
            .eq("media_id", id);
          ok = !error;
        } else {
          const { data, error } = await supabase.rpc("like_media", {
            p_media_id: id,
          });
          ok = !error && likeOk(data);
        }
        busyRef.current.delete(id);

        if (!ok) {
          // Revert the optimistic flip.
          store.set(id, wasLiked);
          toast.error(
            wasLiked
              ? "Couldn't remove that like."
              : "Couldn't save that like.",
          );
          return;
        }
        // Confirm a like (the heart flipped optimistically; this names the impact —
        // it builds the viewer's OWN likes collection, not a social ping). Unlike stays quiet.
        if (!wasLiked) toast.success("Added to your likes");
        // On the Likes tab, a confirmed unlike drops the tile.
        if (wasLiked && modeRef.current === "remove")
          onRemovedRef.current?.(id);
      })();
    },
    [store],
  );

  // Album bulk "Like" (host only — the host is always signed in, so the create-account path never
  // fires here). Optimistically heart every not-already-liked id, fire like_media for each in parallel
  // (idempotent), revert only the failures. Returns the count newly liked; the caller owns the toast.
  const likeMany = useCallback(
    async (ids: string[]): Promise<number> => {
      if (!signedInRef.current) return 0;
      const toLike = ids.filter((id) => !store.has(id));
      if (toLike.length === 0) return 0;
      for (const id of toLike) store.set(id, true);
      const supabase = createClient();
      const failed: string[] = [];
      await Promise.all(
        toLike.map(async (id) => {
          const { data, error } = await supabase.rpc("like_media", {
            p_media_id: id,
          });
          if (error || !likeOk(data)) failed.push(id);
        }),
      );
      for (const id of failed) store.set(id, false);
      return toLike.length - failed.length;
    },
    [store],
  );

  const value = useMemo<LikesContextValue>(
    () => ({ store, isLiked: store.has, toggle, likeMany }),
    [store, toggle, likeMany],
  );

  async function onVerified() {
    // In-page OTP verify (no reload): claim this browser's anonymous uploads (every confirm door
    // does) + complete the pending like inline.
    void claimAnonymousUploads({ silent: true });
    signedInRef.current = true;
    const id = pendingIdRef.current;
    pendingIdRef.current = null;
    setDialogOpen(false);
    if (!id) return;
    const supabase = createClient();
    // DELIBERATE swallow: likeOk(undefined) is false, so a failed like leaves the
    // heart unfilled and the pending key in place, which is what makes the replay
    // above pick it up on the next mount. Fails closed toward "try again".
    // eslint-disable-next-line partyreel/no-swallowed-db-error
    const { data } = await supabase.rpc("like_media", { p_media_id: id });
    if (likeOk(data)) {
      store.set(id, true);
      if (typeof window !== "undefined")
        localStorage.removeItem(PENDING_PREFIX + id);
      toast.success("Added to your likes");
    }
  }

  const emailRedirectTo =
    typeof window !== "undefined"
      ? `${window.location.origin}/auth/callback?next=${window.location.pathname}`
      : "/auth/callback";

  return (
    <LikesContext.Provider value={value}>
      {children}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          {/* The Dialog owns the title and the description for a11y (Radix
              wires aria-labelledby / -describedby to these), so the words come
              from the door's own wear table rather than being retyped here. */}
          <DialogHeader>
            <DialogTitle>{DOOR_WEAR.like.heading}</DialogTitle>
            <DialogDescription>{DOOR_WEAR.like.reason}</DialogDescription>
          </DialogHeader>
          {/* ★ THE LIKE WEAR (Will, 2026-09-20, `surfaces=one`): the one
              account door, in its like wear, so the Terms line and every
              failure path are the door's own rather than a copy of them. */}
          <AccountDoor
            wear="like"
            methods={{ code: true, google: true }}
            emailRedirectTo={emailRedirectTo}
            chrome="none"
            intent="create"
            onVerified={onVerified}
          />
        </DialogContent>
      </Dialog>
    </LikesContext.Provider>
  );
}
