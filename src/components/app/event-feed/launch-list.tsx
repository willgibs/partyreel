import Link from "next/link";
import { CalendarDays, MessageSquareText, Printer, QrCode } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { Button } from "@/components/ui/button";

/**
 * WHAT AN EVENT'S PAGE SAYS BEFORE ANY PHOTOGRAPH (Will, `empty=list`,
 * 2026-09-21: "A launch list of what is left. Three things the app already
 * knows, as three things she can finish. The album takes the room back").
 *
 * ★ THE ITEMS FOLLOW THE EVENT'S OWN NULLS, so this is a list of what is LEFT
 * rather than a checklist with things already ticked on it. A host who set the
 * date while creating never sees a date row; a host who set both sees one row.
 * That is the difference between a list and a lecture, and it is why the
 * derivation is a pure function with its own test rather than three conditionals
 * inside a render.
 *
 * ★ EVERY ITEM IS A REAL DESTINATION, NOT A HINT. The two settings rows land on
 * the event with `?room=settings`, which the hub resolves server-side into the
 * settings sheet already open on the field being asked about; the paper row
 * opens the print route. Nothing here says "you could" without a door beside it.
 *
 * ★ AND SHARING IS THE FOURTH THING ONLY WHILE THE LIST IS SHORT. The code is
 * already in the page's header and in the card chip, so a fourth door to it is
 * a fourth door to something two screens' worth of chrome already offers — it
 * earns its place only when the list has room, which is exactly when a host has
 * finished the setup and has nothing left to do but hand the code out.
 *
 * A server component: three links and a heading have no state, and rendering it
 * on the server keeps `EventUploads` (a client island) from needing to know the
 * event's fields at all — it receives this whole thing as an opaque slot.
 */

export type LaunchItem = {
  id: "date" | "note" | "print";
  icon: LucideIcon;
  title: string;
  line: string;
  action: string;
  href: string;
  /** Opens in a new tab (the print sheet, so the album survives the dialog). */
  external?: boolean;
};

/**
 * The outstanding things, derived from the event row alone. Pure, so the hub can
 * ask for the COUNT without rendering anything.
 */
export function launchItems({
  eventId,
  eventDate,
  description,
}: {
  eventId: string;
  eventDate: string | null;
  description: string | null;
}): LaunchItem[] {
  const items: LaunchItem[] = [];
  if (!eventDate) {
    items.push({
      id: "date",
      icon: CalendarDays,
      title: "Set the date",
      line: "It shows under the name, for you and for your guests.",
      action: "Set it",
      href: `/dashboard/${eventId}?room=settings`,
    });
  }
  if (!description) {
    items.push({
      id: "note",
      icon: MessageSquareText,
      title: "Write a note for guests",
      line: "The first thing somebody reads after they scan the code.",
      action: "Write it",
      href: `/dashboard/${eventId}?room=settings`,
    });
  }
  // Always last, and always present: it is the only item that is not a field
  // and the only one that puts the code somewhere a guest will actually meet it.
  items.push({
    id: "print",
    icon: Printer,
    title: "Print the table cards",
    line: "Nine to a page, or a welcome sign, or a poster.",
    action: "Print",
    href: `/dashboard/${eventId}/print`,
    external: true,
  });
  return items;
}

/** The whole list is short enough that "fewer than three" means "room to spare". */
const SHARE_DOOR_BELOW = 3;

export function LaunchList({
  eventId,
  eventDate,
  description,
}: {
  eventId: string;
  eventDate: string | null;
  description: string | null;
}) {
  const items = launchItems({ eventId, eventDate, description });
  return (
    <div className="py-2">
      <ol className="mx-auto max-w-xl space-y-2">
        {items.map((item) => (
          <li
            key={item.id}
            className="flex items-start gap-3 rounded-xl border border-border p-4"
          >
            <item.icon
              className="mt-0.5 size-4 shrink-0 text-muted-foreground"
              aria-hidden
            />
            <span className="min-w-0 flex-1 space-y-0.5">
              <span className="block text-sm font-medium">{item.title}</span>
              <span className="block text-sm text-muted-foreground">
                {item.line}
              </span>
            </span>
            <Button variant="outline" size="sm" className="shrink-0" asChild>
              <Link
                href={item.href}
                {...(item.external
                  ? { target: "_blank", rel: "noopener noreferrer" }
                  : {})}
              >
                {item.action}
              </Link>
            </Button>
          </li>
        ))}
      </ol>
      {items.length < SHARE_DOOR_BELOW && (
        <div className="flex justify-center pt-3">
          <Button size="sm" asChild>
            <Link href={`/dashboard/${eventId}?room=share`}>
              <QrCode /> Share the code
            </Link>
          </Button>
        </div>
      )}
      <p className="pt-3 text-center text-sm text-muted-foreground">
        The album takes this room back the moment a photograph lands.
      </p>
    </div>
  );
}
