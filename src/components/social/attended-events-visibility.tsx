"use client";

import { useOptimistic, useTransition } from "react";
import { toast } from "sonner";

import {
  hideEventFromProfileAction,
  showEventOnProfileAction,
} from "@/app/(app)/account/social-actions";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import type { AttendedEventSetting } from "@/lib/db/queries/social";
import { formatEventDate } from "@/lib/utils";

/**
 * The guest-side profile key (profiles-social.md point 2; "nothing until
 * chosen", the guest identity round, 2026-09-22): per attended event, "show
 * this on my public profile" — OFF by default, on only once the guest turns
 * it on here (a `profile_shown_events` row). Turning one off here NEVER
 * removes you from the event's own guest list — that list is the HOST's key,
 * never this one. Optimistic switches (a high-frequency toggle: instant),
 * reverted with a toast on failure.
 */
export function AttendedEventsVisibility({
  events,
}: {
  events: AttendedEventSetting[];
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
        Events you add photos to (signed in) can show on your profile. None yet.
      </p>
    );
  }

  return (
    <ul className="divide-y divide-border/60">
      {events.map((event) => {
        const shown = shownById.get(event.id) ?? event.shownOnProfile;
        const switchId = `attended-${event.id}`;
        return (
          <li
            key={event.id}
            className="flex items-center justify-between gap-4 py-2.5 first:pt-0 last:pb-0"
          >
            <Label
              htmlFor={switchId}
              className="min-w-0 flex-1 cursor-pointer font-normal"
            >
              <span className="block truncate text-sm text-foreground">
                {event.name}
              </span>
              {event.event_date && (
                <span className="block text-xs text-muted-foreground">
                  {formatEventDate(event.event_date)}
                </span>
              )}
            </Label>
            <Switch
              id={switchId}
              checked={shown}
              onCheckedChange={(checked) => toggle(event.id, checked)}
              aria-label={`Show ${event.name} on my profile`}
            />
          </li>
        );
      })}
    </ul>
  );
}
