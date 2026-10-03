"use client";

import Link from "next/link";
import { ArrowRight, Trash2 } from "lucide-react";
import { useId } from "react";

import { Button } from "@/components/ui/button";
import { trackAttrs } from "@/lib/analytics/events";
import { RECENTLY_DELETED_WINDOW_DAYS } from "@/lib/lifecycle/recently-deleted";

import { footButton, RoomFoot, RoomGround, RoomHead, RoomPage } from "./room";

/** One event already filling a slot, as the door names it. */
export type CappedEvent = { id: string; name: string };

/**
 * THE DOOR (`limit=door`, Will: "Should handle upfront with actions to address"). The refusal arrives
 * BEFORE the form, names the plan's real number and the event already holding the slot, and offers both
 * ways forward; since create-wizard r2 it stands in the room as every screen of Create does: its question
 * up top, the events holding the plan in the centre with the way to free one, See Pro alone at the foot.
 * It is not a step, so it has no steppers, and it stands unlit (light never goes near a cap).
 *
 * ★ THE COPY COMES FROM THE NUMBER, NEVER FROM A LITERAL "ONE". Free holds one event today and an Event
 * Pass holds one, but `profiles.event_slots` is the webhook-derived concurrent-pass count and overrides
 * both (billing-caps.md), so a host who stacked three passes must read "holds 3 events". A sentence with
 * "one" written into it is a sentence that lies the first time somebody stacks.
 */
export function CapDoor({
  planName,
  maxEvents,
  events,
  onUpgrade,
}: {
  planName: string;
  maxEvents: number | null;
  events: CappedEvent[];
  onUpgrade: () => void;
}) {
  const questionId = useId();
  const limit = maxEvents ?? events.length;
  const holds = limit === 1 ? "one event" : `${limit} events`;
  const named = events[0];
  const rest = events.length - 1;

  return (
    <RoomGround screen="door" light="none">
      <RoomHead close={{ href: "/dashboard", label: "Close" }} />
      <div className="relative flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain">
        <RoomPage
          question={`${planName} holds ${holds}`}
          questionId={questionId}
          sub={
            named
              ? rest > 0
                ? `You have ${named.name} and ${rest} more. Pro holds as many events as you want.`
                : `You have ${named.name}. Pro holds as many events as you want.`
              : "Pro holds as many events as you want."
          }
        >
          {named ? (
            <div className="w-full max-w-md space-y-4">
              <ul className="space-y-2">
                {events.map((event) => (
                  <li key={event.id}>
                    <Link
                      href={`/dashboard/${event.id}`}
                      className="flex items-center justify-between gap-3 rounded-xl bg-card px-4 py-3 text-sm ring-1 ring-foreground/10 transition-colors duration-150 hover:ring-foreground/25"
                    >
                      <span className="min-w-0 truncate font-medium">
                        {event.name}
                      </span>
                      <ArrowRight className="size-4 shrink-0 text-muted-foreground" />
                    </Link>
                  </li>
                ))}
              </ul>
              <div className="flex flex-col items-center gap-2 text-center">
                <Button variant="ghost" asChild>
                  <Link href={`/dashboard/${named.id}?room=settings`}>
                    <Trash2 /> Delete it
                  </Link>
                </Button>
                {/* The place deleted events wait has one name in the app, "Deleted" (the dashboard's
                    filter, the lifecycle emails), and its window is the lifecycle constant, never a
                    typed number. */}
                <p className="text-caption text-pretty text-muted-foreground">
                  {`Deleting an event frees its slot. It waits in Deleted for ${RECENTLY_DELETED_WINDOW_DAYS} days first, so nothing is gone the moment you press it.`}
                </p>
              </div>
            </div>
          ) : null}
        </RoomPage>
      </div>
      <RoomFoot>
        <Button
          type="button"
          size="cta"
          onClick={onUpgrade}
          className={footButton}
          {...trackAttrs("cta_click", {
            cta: "upgrade",
            location: "create-cap-door",
          })}
        >
          See Pro
        </Button>
      </RoomFoot>
    </RoomGround>
  );
}
