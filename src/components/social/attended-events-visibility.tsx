"use client";

import { useOptimistic, useTransition } from "react";
import { toast } from "sonner";

import {
  hideEventFromProfileAction,
  unhideEventFromProfileAction,
} from "@/app/(app)/account/social-actions";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import type { AttendedEventSetting } from "@/lib/db/queries/social";
import { formatEventDate } from "@/lib/utils";

/**
 * The guest-side profile key (profiles-social.md point 2): per attended event, "show this
 * on my public profile". ON by default (hidden only when a hide row exists).
 * Hiding here NEVER removes you from the event's own guest list — that list is
 * the HOST's key — and the card copy says so once, above the rows. Optimistic
 * switches (a high-frequency toggle: instant), reverted with a toast on failure.
 */
export function AttendedEventsVisibility({
  events,
}: {
  events: AttendedEventSetting[];
}) {
  const [, startTransition] = useTransition();
  // event id -> hidden. Optimistic over the server-provided initial state.
  const [hiddenById, setHidden] = useOptimistic(
    new Map(events.map((e) => [e.id, e.hiddenFromProfile])),
    (state, next: { id: string; hidden: boolean }) => {
      const copy = new Map(state);
      copy.set(next.id, next.hidden);
      return copy;
    },
  );

  function toggle(id: string, show: boolean) {
    startTransition(async () => {
      setHidden({ id, hidden: !show });
      const result = show
        ? await unhideEventFromProfileAction(id)
        : await hideEventFromProfileAction(id);
      if (!result.ok) {
        setHidden({ id, hidden: show }); // revert
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
        const hidden = hiddenById.get(event.id) ?? event.hiddenFromProfile;
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
              checked={!hidden}
              onCheckedChange={(checked) => toggle(event.id, checked)}
              aria-label={`Show ${event.name} on my profile`}
            />
          </li>
        );
      })}
    </ul>
  );
}
