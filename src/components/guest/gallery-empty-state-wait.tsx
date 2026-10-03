"use client";

import { useMemo, useSyncExternalStore, type ReactNode } from "react";

import { ContactSheet } from "@/components/guest/gallery-empty-state-sheet";
import {
  type AlbumWaitState,
  AlbumWaitStateProvider,
  useAlbumWaiting,
  useAlbumWaitState,
} from "@/components/guest/gallery-empty-state-yield";
import type { HerShots } from "@/components/guest/upload-tracker";
import { type HerShot, waitStands } from "@/lib/disposable/contact-sheet";
import { useWaitClock } from "@/lib/disposable/use-wait-clock";
import { type WaitClock, waitRule } from "@/lib/disposable/wait-words";

/**
 * THE ALBUM'S WAIT: THE CONTACT SHEET (the-wait r1, Will's `wait=sheet`, his disposable-mode r3 pick ported to the
 * album itself: "revisit the event page while developing to see your shots in similar small tiles"). Wherever an album
 * holds photos back (for the host's approval, or until a develop time), a guest meets one square a photo in the order
 * the night took them, everyone's dark and filling live, hers lit with her own photographs, the count over it and the
 * clock under it. Will's walk, which opened the board: his upload "landed" and then "vanished back to the empty state
 * ... a new guest would likely think that's a bug". Here her photo, once it lands, stays where it landed.
 *
 * ★ EVERYONE'S IS NUMBERS ALONE, HERS ARE HERS ALONE. Everyone's squares are drawn from the sync's waiting facts (a
 * count and its minutes, never an id: `GalleryLive.waiting`); her own from her tracker's read and this device's own
 * files (`HerShots`, published by `UploadTracker`, the one place that holds her rows). Nothing on this sheet is ever
 * another guest's picture, name or id (`lib/disposable/contact-sheet.ts`).
 *
 * ★ IT STANDS ABOVE THE ALBUM, AND IS THE EMPTY ALBUM'S STATE WHILE IT STANDS. The page mounts the sheet over the
 * album's rows (`event-experience.tsx`), and the album's own empty state yields to it (`AlbumWaitYield`): both read the
 * one reading this source makes, so an album with nothing a guest can see yet is this sheet and nothing else, and one
 * that has photos already shows the wait above them.
 */

const NO_SHOTS: readonly HerShot[] = [];
const noSubscription = () => () => {};
const noShots = () => NO_SHOTS;

/**
 * THE PAGE'S SOURCE FOR THE ALBUM'S WAIT, inside the album's live provider: it reads what waits off the album's sync
 * (the provider's `AlbumWaitingProvider`) and her own off her tracker, decides whether the sheet stands, and hands
 * both readers that one reading.
 */
export function AlbumWaitSource({
  clock,
  hers: hersStore,
  onOpenHers,
  firstPaintWidth = null,
  rule = false,
  children,
}: {
  /** The album's live reading as a clock (`waitWords`): the host's approval, or a develop time ahead; null for none. */
  clock: WaitClock | null;
  /** Her waiting shots, as her tracker publishes them; null where nobody tracks hers. */
  hers: HerShots | null;
  onOpenHers?: () => void;
  /** The width the album's rows last laid at on this device (the page's `pr_album_w`). */
  firstPaintWidth?: number | null;
  /** She can add here (full access, uploads open): the album's rule is hers to read before anything waits. */
  rule?: boolean;
  children: ReactNode;
}) {
  const live = useAlbumWaiting();
  const hers = useSyncExternalStore(
    hersStore?.subscribe ?? noSubscription,
    hersStore?.get ?? noShots,
    noShots,
  );
  const full = live?.access === "full";
  const waiting = full ? (live?.waiting ?? null) : null;
  const sending = hers.filter((s) => s.sending).length;
  const stands =
    full &&
    waitStands({
      waits: clock !== null,
      count: waiting?.count ?? 0,
      sending,
      landed: hers.length - sending,
    });
  const says = full && rule && clock !== null;
  const state = useMemo<AlbumWaitState>(
    () => ({
      stands,
      waiting,
      hers,
      clock,
      rule: says,
      onOpenHers,
      firstPaintWidth,
    }),
    [stands, waiting, hers, clock, says, onOpenHers, firstPaintWidth],
  );
  return (
    <AlbumWaitStateProvider value={state}>{children}</AlbumWaitStateProvider>
  );
}

/**
 * The album's wait, above its rows: the sheet while it stands; before anything waits, the album's one rule in its
 * place (`ruleClassName`, the page's words column), so a guest reads how uploads develop here before her first add,
 * and reads it once: the sheet's clock says it from the moment the sheet stands.
 */
export function AlbumWait({
  className,
  ruleClassName,
}: {
  className?: string;
  ruleClassName?: string;
}) {
  const state = useAlbumWaitState();
  if (!state?.clock) return null;
  if (!state.stands)
    return state.rule ? (
      <WaitRuleLine clock={state.clock} className={ruleClassName ?? className} />
    ) : null;
  return (
    <div className={className} data-album-wait={state.clock.kind}>
      <ContactSheet
        waiting={state.waiting}
        hers={state.hers}
        clock={state.clock}
        onOpenHers={state.onOpenHers}
        firstPaintWidth={state.firstPaintWidth}
      />
    </div>
  );
}

/**
 * THE ALBUM'S ONE RULE, in the wait's words (the-wait r1, `model=time`): how uploads develop here, the time in her own
 * clock once it is known (`useWaitClock`; the server's render says the rule without it).
 */
function WaitRuleLine({
  clock,
  className,
}: {
  clock: WaitClock;
  className?: string;
}) {
  const nowMs = useWaitClock();
  return (
    <div className={className}>
      <p
        data-develop-note={clock.kind === "develop" ? "" : undefined}
        data-wait-rule={clock.kind}
        className="rounded-md bg-muted px-3 py-2 text-center text-reading text-muted-foreground"
      >
        {waitRule(clock, nowMs)}
      </p>
    </div>
  );
}
