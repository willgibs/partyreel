"use client";

import { GuestPeek } from "@/components/social/guest-peek";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { ProfileCardItem } from "@/lib/social/cards";

/**
 * THE PEOPLE SHE FOLLOWS, AS THE CHIPS OF HER OWN PAGE (`/me` and `/u/<handle>`'s owner mode: "Connections"), each one
 * opening the same look every name in the product opens (`GuestPeek`, `popups` r1 `peek=card`: a card beside the name at a
 * desk, a sheet in a hand). Before this a chip with a page was a link that left her page for theirs, and a chip without
 * one was a name that did nothing; Account's Connections rows already opened the look (`account-moments` r1, `tidy=stays`),
 * and the ROADMAP asked the chips to as well. ★ ONE LOOK, NEVER A SECOND CARD: its props stand as the look keeps them.
 *
 * ★ NO FOLLOW IN IT, since every chip is someone she follows (`canFollow={false}`): the look is who they are and the way
 * to their page, and to unfollow or block is Account's Connections, where the rows turn back. A person with a page opens
 * with their handle and Open full profile; a person with none opens with their face and name alone, as the look has
 * always drawn that.
 *
 * It is a client island because the look is one; `OwnerSections` (a Server Component that answers for the caller alone)
 * hands it the people and nothing else, so it can read nothing of its own.
 */
export function ConnectionChips({ items }: { items: ProfileCardItem[] }) {
  return (
    <ul className="flex flex-wrap gap-2">
      {items.map((item) => {
        const name = item.displayName ?? "Someone";
        return (
          <li key={item.id}>
            <GuestPeek item={item} canFollow={false}>
              <button
                type="button"
                className="flex max-w-56 focus-halo items-center gap-2 rounded-full border border-border py-1 pr-3 pl-1 transition-[background-color,transform] duration-150 ease-emphasis outline-none hover:bg-muted/40 active:scale-[0.97] motion-reduce:active:scale-100"
              >
                {/* The face is decoration beside the name that follows it: its initial would be read out first. */}
                <Avatar size="sm" seed={item.seed} aria-hidden>
                  <AvatarImage src={item.avatarUrl ?? undefined} alt="" />
                  <AvatarFallback className="text-[10px]">
                    {name.slice(0, 1).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span className="truncate text-sm">{name}</span>
              </button>
            </GuestPeek>
          </li>
        );
      })}
    </ul>
  );
}
