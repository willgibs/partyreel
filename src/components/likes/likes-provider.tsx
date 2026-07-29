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

import { EmailSignIn } from "@/components/auth/email-sign-in";
import { GoogleIcon } from "@/components/auth/google-icon";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { claimAnonymousUploads } from "@/lib/guest/claim-uploads";
import { createClient } from "@/lib/supabase/client";

// The like controller for a gallery. Rendered ONCE per surface that opts into likes (the guest event
// page, the Uploads tab, the Likes tab); a surface that doesn't wrap its grid gets no like UI because
// useLikes() returns null. It generalizes SaveEventButton's state machine to a whole grid:
//   * signedIn resolved on mount (getSession, local);
//   * a `liked` Set seeded from the viewer's OWN media_likes rows (owner-RLS select, anon => empty), so
//     hearts paint correctly without threading state through SSR / the 12s poll / the feed RPCs;
//   * toggle() does an optimistic flip + the RPC (like_media) / RLS delete (unlike), reverting on failure;
//   * the signed-OUT path mirrors Save: stash a pending intent + open ONE shared create-account dialog;
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
  /** The visible media ids — seeds liked state (owner-RLS select) + re-seeds when the set grows (poll). */
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

      // Seed: which of the visible media has THIS user liked (owner-RLS scopes it to auth.uid()).
      // Add-only merge => never clobbers an in-flight optimistic toggle, and genuinely-new poll items
      // (which the user hasn't liked) correctly stay unfilled.
      if (mediaIds.length > 0) {
        // DELIBERATE swallow: this only SEEDS which hearts start filled. A failed
        // read leaves them unfilled and the (idempotent) like RPC corrects it on
        // the next tap; the add-only merge means we never clobber real state.
        // eslint-disable-next-line partyreel/no-swallowed-db-error
        const { data } = await supabase
          .from("media_likes")
          .select("media_id")
          .in("media_id", mediaIds);
        if (active && data) {
          setLiked((prev) => {
            const next = new Set(prev);
            for (const row of data) next.add(row.media_id);
            return next;
          });
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

      // Signed out: remember the intent + open the create-account dialog (mirrors Save).
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
    // In-page OTP verify (no reload): claim this browser's anonymous uploads (consistent with Save) +
    // complete the pending like inline.
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

  async function signInWithGoogle() {
    const supabase = createClient();
    const redirectTo = `${window.location.origin}/auth/callback?next=${window.location.pathname}`;
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo },
    });
    if (error)
      toast.error("Couldn't start Google sign-in", {
        description: error.message,
      });
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
          <DialogHeader>
            <DialogTitle>Like this</DialogTitle>
            <DialogDescription>
              Create a free account to save your favorites and find them on your
              dashboard. No app, just your email.
            </DialogDescription>
          </DialogHeader>
          <EmailSignIn emailRedirectTo={emailRedirectTo} onVerified={onVerified} />
          <div className="flex items-center gap-3">
            <Separator className="flex-1" />
            <span className="text-xs text-muted-foreground">or</span>
            <Separator className="flex-1" />
          </div>
          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={signInWithGoogle}
          >
            <GoogleIcon /> Continue with Google
          </Button>
        </DialogContent>
      </Dialog>
    </LikesContext.Provider>
  );
}
