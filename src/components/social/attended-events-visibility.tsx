"use client";

import { useOptimistic, useTransition } from "react";
import { Check, Image as ImageIcon, Lock } from "lucide-react";
import { toast } from "sonner";

import {
  hideEventFromProfileAction,
  showEventOnProfileAction,
} from "@/app/(app)/account/social-actions";
import type { AttendedEventPick } from "@/lib/db/queries/social";
import { cn } from "@/lib/utils";

/**
 * THE COVER PICKER (`identity-profile` r1, `attended=picker`: "tap an event's own cover to show it;
 * the chosen ones lift off the grid"). It replaced the switch list, so there is ONE way to choose
 * what a page shows, here in Account and on the setup wizard's last screen.
 *
 * ★ THE KEY IS THE GUEST'S OWN (profiles-social.md point 2; "nothing until chosen", the guest identity
 * round, 2026-09-22): per event this person ADDED PHOTOS TO (an approved upload on a confirmed
 * identity, exactly what the page's line needs), a tile is OFF until she taps it on (a
 * `profile_shown_events` row). Tapping one off NEVER removes her from the event's own guest list:
 * that list is the HOST's key. A choice outlives her last removal: the event leaves this grid and the
 * page meanwhile, and a later upload brings it back already chosen.
 *
 * ★ A TILE IS THE ALBUM'S OWN WINDOW, masked as her dashboard's Guest card is (the query does it):
 * an open album's cover, a password album's name with no cover, a private album's lock with neither.
 * A locked tile still toggles, because a choice she can see is one she can take back.
 */

/**
 * The grid itself, stateless: a caller owns what is chosen. Account saves each tap as it lands
 * (`AttendedEventsVisibility`); the wizard holds its taps until Finish.
 */
export function AttendedEventTiles({
  events,
  isShown,
  onToggle,
  disabled = false,
}: {
  events: AttendedEventPick[];
  isShown: (id: string) => boolean;
  onToggle: (id: string, show: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {events.map((event) => {
        const shown = isShown(event.id);
        return (
          <li key={event.id}>
            <button
              type="button"
              aria-pressed={shown}
              aria-label={`Show ${event.name} on my page`}
              disabled={disabled}
              onClick={() => onToggle(event.id, !shown)}
              className={cn(
                // ★ THE LIFT IS THE STATE (the drawn picker): a chosen tile rises and takes the lift,
                // the one shadow for an object that truly sits above its own kind. An answer to a
                // press, so the strong ease-out, well under 300ms; the press itself dips the tile.
                "relative flex w-full flex-col overflow-hidden rounded-[var(--radius-tile)] bg-card text-left ring-1 ring-foreground/10 transition-[translate,scale,box-shadow] duration-200 ease-emphasis outline-none focus-visible:ring-3 focus-visible:ring-ring/50 active:scale-[0.97] disabled:cursor-default disabled:opacity-60 motion-reduce:transition-none motion-reduce:active:scale-100",
                // Chosen, the tile's hairline becomes the accent: the one colour the interface keeps
                // for itself marks what she has published.
                shown && "-translate-y-1 shadow-lift ring-2 ring-brand",
              )}
            >
              <span className="relative block aspect-[4/5] w-full overflow-hidden">
                {event.coverUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element -- presigned R2 URL, not optimizable
                  <img
                    src={event.coverUrl}
                    alt=""
                    loading="lazy"
                    className="size-full object-cover"
                  />
                ) : (
                  // The album's own no-cover ground (EventCard's), so a gated tile reads as the
                  // same object as her dashboard's card for it.
                  <span className="flex size-full items-center justify-center bg-gallery text-gallery-muted">
                    {event.locked ? (
                      <Lock className="size-6" aria-hidden />
                    ) : (
                      <ImageIcon className="size-6" aria-hidden />
                    )}
                  </span>
                )}
                {/* The mark wears the tile's own ground as a rim, so it reads on a photograph and on
                    the dark no-cover ground alike (the accent alone vanishes into the dark). */}
                <span
                  aria-hidden
                  className={cn(
                    "absolute top-2 right-2 flex size-6 items-center justify-center rounded-full bg-brand text-brand-foreground ring-2 ring-card transition-[opacity,scale] duration-150 ease-emphasis motion-reduce:transition-none",
                    shown ? "scale-100 opacity-100" : "scale-75 opacity-0",
                  )}
                >
                  <Check className="size-3.5" />
                </span>
              </span>
              <span className="flex min-w-0 flex-col gap-0.5 px-2.5 py-2">
                <span className="truncate text-sm font-medium text-foreground">
                  {event.name}
                </span>
                <span className="text-xs text-muted-foreground">
                  {shown ? "Showing on your page" : "Private"}
                </span>
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}

/**
 * Account's picker: every tap saves as it lands. Optimistic (a tap answers at once), reverted with
 * a toast when the server refuses.
 */
export function AttendedEventsVisibility({
  events,
}: {
  events: AttendedEventPick[];
}) {
  const [, startTransition] = useTransition();
  // event id -> shown. Optimistic over the server-provided initial state.
  const [shownById, setShown] = useOptimistic(
    new Map(events.map((e) => [e.id, e.shownOnProfile])),
    (state, next: { id: string; shown: boolean }) => {
      const copy = new Map(state);
      copy.set(next.id, next.shown);
      return copy;
    },
  );

  function toggle(id: string, show: boolean) {
    startTransition(async () => {
      setShown({ id, shown: show });
      const result = show
        ? await showEventOnProfileAction(id)
        : await hideEventFromProfileAction(id);
      if (!result.ok) {
        setShown({ id, shown: !show }); // revert
        toast.error(result.message);
      }
    });
  }

  if (events.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Events you add photos to with a confirmed email can show on your page.
        None yet.
      </p>
    );
  }

  return (
    <AttendedEventTiles
      events={events}
      isShown={(id) =>
        shownById.get(id) ??
        events.find((e) => e.id === id)?.shownOnProfile ??
        false
      }
      onToggle={toggle}
    />
  );
}
