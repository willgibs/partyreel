import type { CSSProperties, ReactNode } from "react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

/**
 * THE IDENTITY BLOCK OF A PROFILE: avatar, name, handle, restraint (joined month only: no counts by
 * design, the graph is private, profiles-social.md). The public page (`/u/[slug]`) and her own page
 * before it is public (`/me`, `account-moments` r1, `me-page=private`) wear this one head, so going
 * public later changes who sees the page and never what it is.
 *
 * ★ THE AVATAR IS CENTRED ON THE NAME ROW AND THE BIO SITS OUTSIDE IT, so the avatar stays aligned to
 * the name and meta whether a bio is missing or runs to any length. A bio inside this flex row would
 * drag the avatar down by half of whatever the person wrote.
 *
 * ★ AND THE PHONE LAYOUT IS `max-sm:` ONLY: the name column takes the rest of the row and the actions
 * wrap under it at 375, where a single row would squeeze all three into about 90px. No wider screen is
 * touched by it. `xl` (80px, the Avatar's fourth size) keeps the row on the shared component rather
 * than a hand-rolled disc, so the seeded colour and the component's clipping reach it the same way
 * every other avatar surface gets them.
 *
 * `actions` are the row's own (Follow and the menu for a visitor, Edit profile for the owner), and
 * `children` stand under it (the private page's one line).
 */
export function ProfileHead({
  seed,
  avatarUrl,
  name,
  handle,
  joined,
  actions,
  children,
}: {
  /** The person's colour: `seedFor(id)`, hashed on the server like every seed, never a raw id. */
  seed: string;
  avatarUrl: string | null;
  name: string;
  /** Their handle, where they have a page; a page that is not public yet has none. */
  handle?: string | null;
  /** "October 2026", the one pinned format (`formatMonthYear`). */
  joined: string;
  actions?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <>
      <section
        data-arrive
        style={{ "--arrive-i": 0 } as CSSProperties}
        className="flex flex-wrap items-center gap-5"
      >
        {/* The face is decoration beside the name that follows it: its initial would be read out first. */}
        <Avatar size="xl" seed={seed} aria-hidden>
          <AvatarImage src={avatarUrl ?? undefined} alt="" />
          <AvatarFallback>{name.slice(0, 1).toUpperCase()}</AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1 max-sm:basis-[calc(100%-6.25rem)]">
          <h1 className="font-heading text-page text-balance">{name}</h1>
          <Meta handle={handle} joined={joined} />
        </div>
        {actions}
      </section>
      {children}
    </>
  );
}

/**
 * THE META ROW, WHOSE SEPARATOR TRAVELS WITH WHAT FOLLOWS IT. The row wraps (a long handle at 375 takes
 * the whole line), and a `·` of its own between the two would be left at the end of the first line with
 * nothing after it. Here each item carries the dot that leads it, in a slot of its own padding, and the
 * row is pulled left by that slot under an `overflow-hidden` frame: an item that starts a line has its
 * dot clipped away with the slot, and one that follows another on the same line keeps it. The dot is
 * decoration only (`aria-hidden`), as it always was. A handle too long for the column breaks inside it
 * rather than run into the clip (30 characters of `w` are wider than the column at 375).
 */
function Meta({ handle, joined }: { handle?: string | null; joined: string }) {
  const items = [...(handle ? [`@${handle}`] : []), `Joined ${joined}`];
  return (
    <p className="mt-1 overflow-hidden text-sm text-muted-foreground">
      <span className="-ml-5 flex flex-wrap gap-y-0.5">
        {items.map((item, i) => (
          <span
            key={item}
            className="relative min-w-0 pl-5 [overflow-wrap:anywhere]"
          >
            {i > 0 ? (
              <span
                aria-hidden
                className="absolute inset-y-0 left-0 w-5 text-center text-faint"
              >
                ·
              </span>
            ) : null}
            {item}
          </span>
        ))}
      </span>
    </p>
  );
}
