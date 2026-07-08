import Link from "next/link";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { ProfileCardItem } from "@/lib/social/cards";

/**
 * The named "Guests" list (ADR-0019: renders ONLY when the host turned on
 * show_guest_list; the server query already enforced that + excluded anonymous
 * uploads). One presentational component for BOTH surfaces (the host event page
 * section and the guest album), so the two can never drift. Server-renderable:
 * items arrive fully hydrated (avatar URLs, never storage paths).
 *
 * A guest WITH a handle links to /u/<slug>; one without renders as a plain chip
 * (no dead link, no "claim a handle" nudge on someone else's album).
 */
export function GuestList({ items }: { items: ProfileCardItem[] }) {
  if (items.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No signed-in guests have added photos yet.
      </p>
    );
  }

  return (
    <ul className="flex flex-wrap gap-1.5">
      {items.map((item) => {
        const chip = (
          <>
            <Avatar size="sm">
              <AvatarImage src={item.avatarUrl ?? undefined} alt="" />
              <AvatarFallback className="text-[10px]">
                {(item.displayName ?? "?").slice(0, 1).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <span className="max-w-40 truncate">
              {item.displayName ?? "Guest"}
            </span>
          </>
        );
        const chipClass =
          "flex h-8 items-center gap-2 rounded-full border border-border py-1 pr-3 pl-1 text-sm";
        return (
          <li key={item.id}>
            {item.slug ? (
              <Link
                href={`/u/${item.slug}`}
                className={`${chipClass} text-foreground transition-transform duration-150 ease-emphasis outline-none hover:bg-muted/60 focus-visible:ring-2 focus-visible:ring-ring/50 active:scale-[0.97] motion-reduce:active:scale-100`}
              >
                {chip}
              </Link>
            ) : (
              <span className={`${chipClass} text-muted-foreground`}>
                {chip}
              </span>
            )}
          </li>
        );
      })}
    </ul>
  );
}
