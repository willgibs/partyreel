"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
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
//   * a `liked` Set seeded from `my_liked_media_ids` (the viewer's OWN likes among the grid's ids, the
//     ids in the POST body; anon => nothing asked), so hearts paint correctly without threading state
//     through SSR / the gallery poll / the feed RPCs;
//   * toggle() does an optimistic flip + the RPC (like_media) / RLS delete (unlike), reverting on failure;
//   * the signed-OUT path: stash a pending intent + open ONE shared create-account dialog;
//     the in-page OTP verify replays the like, and a redirect sign-in (Google / magic link) replays any
//     pending like on the next mount.
// Counts are NEVER handled here (they're host-only, read server-side via get_event_like_counts).

type LikesContextValue = {
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
  const [liked, setLiked] = useState<Set<string>>(
    () => new Set(initialLikedIds ?? []),
  );
  const [signedIn, setSignedIn] = useState(false);
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
      setSignedIn(Boolean(session));
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
          if (likedIds.length > 0) {
            setLiked((prev) => {
              const next = new Set(prev);
              for (const id of likedIds) next.add(id);
              return next;
            });
          }
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
            setLiked((prev) => new Set(prev).add(id));
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
      if (!signedIn) {
        if (typeof window !== "undefined")
          localStorage.setItem(PENDING_PREFIX + id, "1");
        pendingIdRef.current = id;
        setDialogOpen(true);
        return;
      }

      const wasLiked = liked.has(id);
      busyRef.current.add(id);
      // Optimistic heart flip (the count, if any, is host-only and not shown on this surface).
      setLiked((prev) => {
        const next = new Set(prev);
        if (wasLiked) next.delete(id);
        else next.add(id);
        return next;
      });

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
          setLiked((prev) => {
            const next = new Set(prev);
            if (wasLiked) next.add(id);
            else next.delete(id);
            return next;
          });
          toast.error(
            wasLiked ? "Couldn't remove that like." : "Couldn't save that like.",
          );
          return;
        }
        // Confirm a like (the heart flipped optimistically; this names the impact —
        // it builds the viewer's OWN likes collection, not a social ping). Unlike stays quiet.
        if (!wasLiked) toast.success("Added to your likes");
        // On the Likes tab, a confirmed unlike drops the tile.
        if (wasLiked && mode === "remove") onRemoved?.(id);
      })();
    },
    [signedIn, liked, mode, onRemoved],
  );

  // Album bulk "Like" (host only — the host is always signed in, so the create-account path never
  // fires here). Optimistically heart every not-already-liked id, fire like_media for each in parallel
  // (idempotent), revert only the failures. Returns the count newly liked; the caller owns the toast.
  const likeMany = useCallback(
    async (ids: string[]): Promise<number> => {
      if (!signedIn) return 0;
      const toLike = ids.filter((id) => !liked.has(id));
      if (toLike.length === 0) return 0;
      setLiked((prev) => {
        const next = new Set(prev);
        for (const id of toLike) next.add(id);
        return next;
      });
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
      if (failed.length > 0) {
        setLiked((prev) => {
          const next = new Set(prev);
          for (const id of failed) next.delete(id);
          return next;
        });
      }
      return toLike.length - failed.length;
    },
    [signedIn, liked],
  );

  const isLiked = useCallback((id: string) => liked.has(id), [liked]);

  async function onVerified() {
    // In-page OTP verify (no reload): claim this browser's anonymous uploads (every confirm door
    // does) + complete the pending like inline.
    void claimAnonymousUploads({ silent: true });
    setSignedIn(true);
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
      setLiked((prev) => new Set(prev).add(id));
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
    <LikesContext.Provider value={{ isLiked, toggle, likeMany }}>
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
