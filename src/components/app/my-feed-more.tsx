"use client";

import { useCallback, useMemo, useRef, useState } from "react";

import type { FeedPageAnswer } from "@/app/(guest)/u/[slug]/feed-actions";
import type { GridMedia } from "@/components/app/media-grid";
import { Button } from "@/components/ui/button";
import type { FeedCursor } from "@/lib/db/queries/my-uploads";

/**
 * A PERSONAL FEED PAST ITS FIRST PAGE (crumbs-38: "My uploads and My likes stop at 200 with an honest note"; "a
 * cursor and a load-more"). The owner mode renders her newest 200 on the server; each Show more asks the next page
 * after the last item she was shown (a keyset, `get_my_uploads` / `get_my_likes`) and lays it under the rest.
 *
 * ★ THE FIRST PAGE IS THE SERVER'S, THE REST ARE HERS. A delete revalidates her page, so the first page can come
 * back shifted (the 201st moves up into it) while the pages she loaded still hold it: an item is shown once,
 * where it first appears, and the next press resumes after the last page she loaded, never the first page's
 * cursor, so nothing is skipped or shown twice.
 *
 * ★ AND WHAT SHE REMOVED LEAVES EVERY PAGE ON HER OWN WORD (crumbs-45, build 36's red-team: a first-page Delete
 * came back 20 ms after its answer and stayed until a reload). `drop` takes an item out of the first page and the
 * loaded ones alike, at once and for the page's life, never leaning on the action's revalidation, which can land
 * late: the viewer's close writes the address in the same tick, just before its Delete's Server Action, and Next
 * (16.2.6) then commits that write's restore over the action's answer, so the page keeps its old tree until the
 * next router action (a Show more, a like) applies the new one (measured in a bare Next app). So the revalidated
 * first page and her removal agree in either order, and a first page that refills late shows each item once.
 *
 * ★ A FAILED PAGE KEEPS WHAT SHE HAS: the pages stand, and the button asks again ("Try again"), in the storage
 * list's own control and words (`storage-list-body.tsx`).
 */

/** How a feed asks for its next page: the owner mode passes the Server Function (`feed-actions.ts`). */
export type ReadFeedPage = (ask: {
  before: FeedCursor;
}) => Promise<FeedPageAnswer>;

export type FeedMoreStatus = "idle" | "loading" | "failed";

export type FeedPages = {
  /** The first page and every page loaded since, each item once. */
  items: GridMedia[];
  /** The cursor of the page after the last one shown; null at the end, or where no reader was passed. */
  next: FeedCursor | null;
  status: FeedMoreStatus;
  more: () => void;
  /** An item that left for good (a confirmed delete, an unlike): out of every page, the first one too, for good. */
  drop: (id: string) => void;
};

export function useFeedPages(
  first: readonly GridMedia[],
  firstNext: FeedCursor | null,
  read: ReadFeedPage | undefined,
): FeedPages {
  // Null until a page past the first has landed: until then the first page's own cursor is the next.
  const [loaded, setLoaded] = useState<{
    items: GridMedia[];
    next: FeedCursor | null;
  } | null>(null);
  const [status, setStatus] = useState<FeedMoreStatus>("idle");
  // What left for good while this page stood, whichever page showed it (the head's second ★).
  const [gone, setGone] = useState<ReadonlySet<string>>(() => new Set());
  // One press at a time, read in the handler (a second press during a load is the same ask).
  const busy = useRef(false);

  const next = read ? (loaded ? loaded.next : firstNext) : null;

  const items = useMemo(() => {
    const seen = new Set(first.map((item) => item.id));
    const pages =
      loaded && loaded.items.length > 0
        ? [...first, ...loaded.items.filter((item) => !seen.has(item.id))]
        : [...first];
    return gone.size === 0 ? pages : pages.filter((item) => !gone.has(item.id));
  }, [first, loaded, gone]);

  const more = useCallback(() => {
    if (!read || !next || busy.current) return;
    busy.current = true;
    setStatus("loading");
    read({ before: next }).then(
      (answer) => {
        busy.current = false;
        if (!answer.ok) {
          setStatus("failed");
          return;
        }
        setLoaded((prev) => {
          const have = new Set((prev?.items ?? []).map((item) => item.id));
          return {
            items: [
              ...(prev?.items ?? []),
              ...answer.items.filter((item) => !have.has(item.id)),
            ],
            next: answer.next,
          };
        });
        setStatus("idle");
      },
      () => {
        busy.current = false;
        setStatus("failed");
      },
    );
  }, [read, next]);

  const drop = useCallback((id: string) => {
    setGone((prev) => (prev.has(id) ? prev : new Set(prev).add(id)));
  }, []);

  return { items, next, status, more, drop };
}

/** The feed's foot: Show more while a page waits after the last, and nothing at the end. */
export function FeedMore({
  feed,
  label,
}: {
  feed: Pick<FeedPages, "next" | "status" | "more">;
  /** What it adds, for a reader who meets the button out of its place ("Show more uploads"). */
  label: string;
}) {
  if (!feed.next) return null;
  return (
    <div className="flex justify-center">
      <Button
        type="button"
        variant="outline"
        size="sm"
        data-feed-more={feed.status}
        disabled={feed.status === "loading"}
        aria-label={feed.status === "idle" ? label : undefined}
        onClick={feed.more}
      >
        {feed.status === "loading"
          ? "Loading…"
          : feed.status === "failed"
            ? "Try again"
            : "Show more"}
      </Button>
    </div>
  );
}
