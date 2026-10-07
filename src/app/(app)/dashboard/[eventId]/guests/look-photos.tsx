"use client";

import {
  useCallback,
  useEffect,
  useId,
  useState,
  useSyncExternalStore,
} from "react";
import { ChevronRight } from "lucide-react";

import {
  LOOK_PAGE,
  NO_LOOK,
  STRIP,
  type LookAnswer,
} from "@/app/(app)/dashboard/[eventId]/guests/look";
import {
  addedHead,
  addedWords,
} from "@/app/(app)/dashboard/[eventId]/guests/words";
import { MediaTile, type GridMedia } from "@/components/app/media-grid";
import type { ViewerOrigin } from "@/components/shared/media-lightbox";
import {
  MediaLightboxLazy,
  preloadMediaLightbox,
} from "@/components/shared/media-lightbox.lazy";
import { CreditLookContext } from "@/components/shared/media-lightbox-parts/credit";
import { Button } from "@/components/ui/button";
import {
  Popup,
  PopupBody,
  PopupContent,
  PopupHeader,
} from "@/components/ui/popup";
import { useBackCloses } from "@/components/ui/popup-back";
import { Skeleton } from "@/components/ui/skeleton";
import type { BlockTarget } from "@/lib/events/event-blocks";
import { formatCount } from "@/lib/format/count";
import { readStoredSession } from "@/lib/guest/use-stored-session";

/**
 * A PERSON'S PHOTOGRAPHS IN THE CARD A NAME OPENS (guests-room r1, `card=standing`, Will's popups r1 look built:
 * "four of their photos and See all"): the strip under who they are, the panel See all opens (the album filtered to
 * them), and the viewer a photograph opens in. What the card reads is `look-actions.ts`'s, and only what the album
 * shows (approved, visible).
 *
 * ★ WHERE A CARD READS, ONE RULE (`useLookSource`): a host's surface hands its person the way Block names them (the
 * room's names, her viewer's credit), and her own album is read; an album's page (`/e/<token>`) reads that album, as
 * the guest who is looking; anywhere else (Account's Connections, the Library) the card says who they are with no
 * strip, since there is no "here" to show photographs from.
 *
 * ★ SEE ALL IS THE ALBUM FILTERED TO ONE PERSON, AS A PLACE OF ITS OWN (`lists=panel`: beside the screen at a desk,
 * the whole screen in a hand, the phone's Back closing it), a page of 24 at a time (`guest-list.tsx`'s own page: a
 * thousand photographs never arrive as one page 100 screens tall). The album pages themselves gain no filter: they are
 * other surfaces' (the hub's, the guest page's).
 *
 * ★ A PHOTOGRAPH OPENS THE VIEWER EVERY ALBUM USES (`MediaLightbox`), over whatever opened it, walking the ones the
 * card or the panel holds; it holds a history entry of its own (`useBackCloses`), so the phone's Back closes it first.
 * Its credit names the person whose card this is, and opens no second card (`CreditLookContext` is emptied under it).
 */

/** Where a card reads a person's photographs: the host's own album, or the album a guest is looking at. */
export type LookSource =
  | { side: "host"; target: BlockTarget }
  | {
      side: "album";
      qrToken: string;
      who:
        | { kind: "account"; userId: string }
        | { kind: "row"; guestId: string };
    };

/** A page's own address never changes under a card without the card's page going with it: nothing to listen for. */
const unchanging = () => () => {};

/** The album an address names (`/e/<token>`, the guest page's own route), else null. */
export function albumTokenOf(pathname: string): string | null {
  const m = /^\/e\/([^/?#]+)/.exec(pathname);
  if (!m) return null;
  try {
    return decodeURIComponent(m[1]);
  } catch {
    return null;
  }
}

/**
 * The album a card stands in, where its page is one (`/e/<token>`): the token its own address carries, else null.
 * ★ READ OFF THE PAGE'S OWN ADDRESS, so the album's guest list (`guest-list.tsx`, which hands its look only the person)
 * needs no prop to give its cards photographs; read from the window, never the router's hooks, so a card renders
 * wherever a name does (a server render reads null: no card is open there).
 */
export function useAlbumToken(): string | null {
  return useSyncExternalStore(
    unchanging,
    () => albumTokenOf(window.location.pathname),
    () => null,
  );
}

/**
 * WHERE A CARD READS ITS PERSON'S PHOTOGRAPHS (the header's one rule): the host's surface names them for Block, and
 * that name is the read's (the room's names, her credit's photograph); an album's page reads its album, as the guest
 * who is looking, the person as its list names them (a typed name by its ticket, anyone else by their account);
 * anywhere else, nowhere.
 */
export function useLookSource(
  item: { id: string; kind?: "unverified" },
  block: { target: BlockTarget } | undefined,
): LookSource | null {
  const token = useAlbumToken();
  if (block) return { side: "host", target: block.target };
  if (!token) return null;
  return {
    side: "album",
    qrToken: token,
    who:
      item.kind === "unverified"
        ? { kind: "row", guestId: item.id }
        : { kind: "account", userId: item.id },
  };
}

/** A key per source and page, so two cards of one person share a read and two people never do. */
function keyOf(
  source: LookSource,
  limit: number,
  after: { at: string; id: string } | null,
) {
  return JSON.stringify([source, limit, after]);
}

/** A read younger than this is a card's answer at once when it opens again; its links live 90 minutes. */
const FRESH_MS = 5 * 60_000;

/** The page's life's reads: one per source and page, shared by every card that asks the same. */
const reads = new Map<string, { at: number; answer: Promise<LookAnswer> }>();

/**
 * The look's two Server Functions, fetched as a card first asks (★ NEVER AT IMPORT: every surface that draws a name
 * imports the card, and the Functions' module is the server's, so a page or a test that never opens a strip never
 * loads it).
 */
const actions = () =>
  import("@/app/(app)/dashboard/[eventId]/guests/look-actions");

function ask(
  source: LookSource,
  limit: number,
  after: { at: string; id: string } | null = null,
): Promise<LookAnswer> {
  const key = keyOf(source, limit, after);
  const held = reads.get(key);
  if (held && Date.now() - held.at < FRESH_MS) return held.answer;
  const call = actions().then((a) =>
    source.side === "host"
      ? a.readHostLookAction({ target: source.target, after, limit })
      : a.readAlbumLookAction({
          qrToken: source.qrToken,
          sessionToken: readStoredSession(source.qrToken),
          who: source.who,
          after,
          limit,
        }),
  );
  // A read that never answered (offline) is a failure like any other, never a throw out of the card.
  const answer = call.catch(() => NO_LOOK);
  reads.set(key, { at: Date.now(), answer });
  // A failure is not kept: the next open, or Try again, asks afresh.
  void answer.then((a) => {
    if (!a.ok && reads.get(key)?.answer === answer) reads.delete(key);
  });
  return answer;
}

type LookState =
  | { state: "reading" }
  | { state: "failed" }
  | (Extract<LookAnswer, { ok: true }> & { state: "ready" });

/** One page of a person's photographs, asked as the card opens (and again on Try again). */
function useLookPage(source: LookSource, limit: number) {
  const [attempt, setAttempt] = useState(0);
  const [held, setHeld] = useState<{ key: string; look: LookState } | null>(
    null,
  );
  const key = keyOf(source, limit, null);
  useEffect(() => {
    let alive = true;
    void ask(source, limit).then((answer) => {
      if (!alive) return;
      setHeld({
        key,
        look: answer.ok ? { ...answer, state: "ready" } : { state: "failed" },
      });
    });
    return () => {
      alive = false;
    };
    // The source is read through its key: a new object for the same person asks nothing new.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, attempt]);
  const look: LookState =
    held && held.key === key ? held.look : { state: "reading" };
  return {
    look,
    retry: () => {
      reads.delete(key);
      setHeld(null);
      setAttempt((n) => n + 1);
    },
  };
}

/** A photograph's tile in a card or the panel: the album tile's own picture, one press from the viewer. */
function LookTile({
  item,
  label,
  onOpen,
}: {
  item: GridMedia;
  label: string;
  onOpen: (tile: HTMLElement) => void;
}) {
  return (
    <li className="aspect-square overflow-hidden rounded-tile bg-muted">
      <button
        type="button"
        aria-label={label}
        data-look-photo={item.id}
        onPointerEnter={preloadMediaLightbox}
        onClick={(e) => onOpen(e.currentTarget)}
        // The halo drawn inside: the tile's corner clips anything outside it.
        className="group/tile relative block size-full press-shrink focus-halo cursor-pointer transition-[scale] duration-150 ease-emphasis outline-none [--press-scale:0.97] halo-inset"
      >
        <span className="block size-full transition-[filter] duration-200 ease-emphasis group-hover/tile:brightness-110">
          <MediaTile item={item} />
        </span>
      </button>
    </li>
  );
}

/** The strip's head: its kind and count as a section's own head, See all at its end where four are not all. */
function StripHead({
  id,
  added,
  more,
  name,
  onSeeAll,
}: {
  id: string;
  added: { photos: number; videos: number } | null;
  more: boolean;
  name: string;
  onSeeAll: () => void;
}) {
  const total = added ? added.photos + added.videos : null;
  return (
    <div className="flex min-h-7 items-center justify-between gap-3">
      <h3 id={id} className="flex items-center gap-1.5">
        <span className="text-label font-semibold text-muted-foreground uppercase">
          {added ? addedHead(added) : "Photos"}
        </span>
        {total ? (
          <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-muted px-1 text-[10px] font-semibold text-muted-foreground tabular-nums">
            {formatCount(total)}
          </span>
        ) : null}
      </h3>
      {more ? (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          data-look-see-all=""
          aria-label={`See all ${added ? addedWords(added) : "photos"} from ${name}`}
          onClick={onSeeAll}
          className="-mr-1.5 text-muted-foreground hover:text-foreground"
        >
          See all
          {/* ★ An arrow leans the way it goes under the pointer, two pixels on the key's own clock. */}
          <ChevronRight
            data-icon="inline-end"
            className="transition-transform duration-150 ease-emphasis motion-safe:group-hover/button:translate-x-0.5"
          />
        </Button>
      ) : null}
    </div>
  );
}

/**
 * THE CARD'S STRIP: their photographs' kind and count, See all where four are not all of them, and up to four tiles at
 * one size, newest first. `added` is what a surface already counted (the room's read), so the head says it before the
 * tiles land; while they read, their places breathe; a read that fails says so with Try again, never an empty strip.
 * A person the album shows nothing of has no strip at all.
 */
export function LookStrip({
  source,
  name,
  added,
  onOpenPhoto,
  onSeeAll,
}: {
  source: LookSource;
  name: string;
  added?: { photos: number; videos: number } | null;
  onOpenPhoto: (items: GridMedia[], index: number, tile: HTMLElement) => void;
  onSeeAll: () => void;
}) {
  const headId = useId();
  const { look, retry } = useLookPage(source, STRIP);
  const known =
    look.state === "ready"
      ? { photos: look.photos, videos: look.videos }
      : (added ?? null);
  const total = known ? known.photos + known.videos : null;
  if (look.state === "ready" && total === 0) return null;
  const places = Math.min(STRIP, total ?? STRIP);
  return (
    <section
      aria-labelledby={headId}
      data-look-strip={look.state}
      className="space-y-1.5"
    >
      <StripHead
        id={headId}
        added={known}
        more={total !== null && total > STRIP}
        name={name}
        onSeeAll={onSeeAll}
      />
      {look.state === "failed" ? (
        <div className="flex items-center justify-between gap-3 rounded-lg bg-muted/50 py-1.5 pr-1.5 pl-3">
          <p className="text-caption text-muted-foreground">
            Couldn&rsquo;t load their photos.
          </p>
          <Button type="button" variant="ghost" size="sm" onClick={retry}>
            Try again
          </Button>
        </div>
      ) : (
        <ul
          className="grid grid-cols-4 gap-[var(--gap-gallery)]"
          aria-busy={look.state === "reading" || undefined}
        >
          {look.state === "ready"
            ? look.items.map((item, i) => (
                <LookTile
                  key={item.id}
                  item={item}
                  label={`Open ${item.type === "video" ? "video" : "photo"} ${i + 1} of ${formatCount(look.photos + look.videos)}`}
                  onOpen={(tile) => onOpenPhoto(look.items, i, tile)}
                />
              ))
            : Array.from({ length: places }, (_, i) => (
                <li key={i} aria-hidden>
                  <Skeleton className="aspect-square rounded-tile" />
                </li>
              ))}
        </ul>
      )}
    </section>
  );
}

/** The panel's pages, read one after another as Show more asks. */
function useLookPages(source: LookSource, open: boolean) {
  const [pages, setPages] = useState<{
    items: GridMedia[];
    added: { photos: number; videos: number } | null;
    next: { at: string; id: string } | null;
    state: "reading" | "ready" | "failed";
  }>({ items: [], added: null, next: null, state: "reading" });
  const [attempt, setAttempt] = useState(0);
  const key = keyOf(source, LOOK_PAGE, null);
  useEffect(() => {
    if (!open) return;
    let alive = true;
    void ask(source, LOOK_PAGE).then((answer) => {
      if (!alive) return;
      setPages(
        answer.ok
          ? {
              items: answer.items,
              added: { photos: answer.photos, videos: answer.videos },
              next: answer.next,
              state: "ready",
            }
          : { items: [], added: null, next: null, state: "failed" },
      );
    });
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, open, attempt]);
  const more = useCallback(() => {
    const after = pages.next;
    if (!after) return;
    setPages((p) => ({ ...p, state: "reading" }));
    void ask(source, LOOK_PAGE, after).then((answer) => {
      setPages((p) =>
        answer.ok
          ? {
              // A photograph a later page repeats (one landed mid-browse) is drawn once.
              items: [
                ...p.items,
                ...answer.items.filter(
                  (item) => !p.items.some((had) => had.id === item.id),
                ),
              ],
              added: { photos: answer.photos, videos: answer.videos },
              next: answer.next,
              state: "ready",
            }
          : { ...p, state: "failed" },
      );
    });
  }, [pages.next, source]);
  return {
    ...pages,
    more,
    retry: () => {
      reads.delete(key);
      setPages({ items: [], added: null, next: null, state: "reading" });
      setAttempt((n) => n + 1);
    },
  };
}

/**
 * SEE ALL: THE ALBUM FILTERED TO ONE PERSON, a place of its own (the list kind: beside the screen at a desk, the whole
 * screen in a hand), headed by their name and what they added, a page of 24 at a time with Show more under it.
 */
export function LookPanel({
  source,
  name,
  open,
  onOpenChange,
  onOpenPhoto,
  returnFocus,
}: {
  source: LookSource;
  name: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onOpenPhoto: (items: GridMedia[], index: number, tile: HTMLElement) => void;
  /** Where the keyboard goes when the panel closes: the name whose card opened it (the card itself is gone). */
  returnFocus?: () => HTMLElement | null;
}) {
  const pages = useLookPages(source, open);
  const total = pages.added ? pages.added.photos + pages.added.videos : null;
  const rest = total === null ? 0 : Math.max(0, total - pages.items.length);
  return (
    <Popup open={open} onOpenChange={onOpenChange}>
      <PopupContent
        kind="list"
        data-look-panel=""
        onCloseAutoFocus={(event) => {
          const back = returnFocus?.();
          if (!back?.isConnected) return;
          event.preventDefault();
          back.focus({ preventScroll: true });
        }}
      >
        <PopupHeader
          title={name}
          description={
            pages.added
              ? `${addedWords(pages.added)} in this album`
              : "In this album"
          }
        />
        <PopupBody className="space-y-3">
          {pages.state === "failed" && pages.items.length === 0 ? (
            <div className="flex flex-col items-start gap-3 rounded-lg border border-dashed p-5">
              <p className="text-sm text-muted-foreground">
                Couldn&rsquo;t load their photos.
              </p>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={pages.retry}
              >
                Try again
              </Button>
            </div>
          ) : (
            <ul
              className="grid grid-cols-3 gap-[var(--gap-gallery)]"
              aria-busy={pages.state === "reading" || undefined}
            >
              {pages.items.map((item, i) => (
                <LookTile
                  key={item.id}
                  item={item}
                  label={`Open ${item.type === "video" ? "video" : "photo"} ${i + 1} of ${formatCount(total ?? pages.items.length)}`}
                  onOpen={(tile) => onOpenPhoto(pages.items, i, tile)}
                />
              ))}
              {pages.state === "reading"
                ? Array.from(
                    {
                      length: Math.min(
                        LOOK_PAGE,
                        pages.items.length === 0
                          ? Math.min(LOOK_PAGE, total ?? 9)
                          : rest,
                      ),
                    },
                    (_, i) => (
                      <li key={`reading-${i}`} aria-hidden>
                        <Skeleton className="aspect-square rounded-tile" />
                      </li>
                    ),
                  )
                : null}
            </ul>
          )}
          {pages.state !== "reading" && pages.next ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="w-full"
              onClick={pages.more}
            >
              {pages.state === "failed"
                ? "Try again"
                : `Show ${formatCount(Math.min(LOOK_PAGE, rest || LOOK_PAGE))} more`}
            </Button>
          ) : null}
        </PopupBody>
      </PopupContent>
    </Popup>
  );
}

/** The viewer over a card's or a panel's photographs (the shared `MediaLightbox`), its own history entry held. */
export function LookViewer({
  viewing,
  onClose,
  viewerIsHost,
}: {
  viewing: {
    items: GridMedia[];
    index: number;
    origin?: ViewerOrigin;
  } | null;
  onClose: () => void;
  viewerIsHost: boolean;
}) {
  const [index, setIndex] = useState<number | null>(null);
  const [closeRequest, setCloseRequest] = useState<{
    n: number;
    instant: boolean;
  } | null>(null);
  // A new opening starts the viewer at its photograph (adjusted during render: state from a prop).
  const [opened, setOpened] = useState(viewing);
  if (viewing !== opened) {
    setOpened(viewing);
    setIndex(viewing ? viewing.index : null);
  }
  const open = viewing !== null && index !== null;
  // The phone's Back closes the photograph first, the way its own close does (an entry of its own).
  useBackCloses(open, () =>
    setCloseRequest((r) => ({ n: (r?.n ?? 0) + 1, instant: false })),
  );
  return (
    <CreditLookContext.Provider value={null}>
      <MediaLightboxLazy
        items={viewing?.items ?? []}
        index={open ? index : null}
        origin={viewing?.origin}
        viewerIsHost={viewerIsHost}
        closeRequest={closeRequest}
        onIndexChange={setIndex}
        onClose={() => {
          setIndex(null);
          onClose();
        }}
      />
    </CreditLookContext.Provider>
  );
}
