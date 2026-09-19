"use client";

import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";

import { LearnChevron } from "@/components/marketing/sections/shared/learn-chevron";
import { DemoTicket } from "@/components/marketing/system/demo-ticket";
import { NavigationMenuLink } from "@/components/ui/navigation-menu";
import { marketingImage } from "@/lib/constants/marketing-media";
import { type NavGroup, type NavLink } from "@/lib/constants/marketing-nav";
import { DEMO_EVENT_URL } from "@/lib/demo";
import { cn } from "@/lib/utils";

/**
 * THE MEGA-PANEL (expansion round): the rich content of one nav panel — an
 * item column (or two, for the seven-row Features panel) + a FEATURED pane +
 * an optional utility row. Lives in chrome/ (single consumer: the desktop
 * NavigationMenu in marketing-nav.tsx). Renders IN-FLOW inside the skin
 * wrapper (NavigationMenu never portals), so tokens and the dark/paper skins
 * apply with no portal props.
 *
 * The FEATURED registry is COMPONENT-SIDE on purpose: marketing-nav.ts stays
 * pure serializable data (its byte-pins toEqual-compare items, and the footer/
 * sitemap consumers must never drag client/env deps). Every card here is plain
 * literals for a second reason: nothing in the chrome may import a registry
 * that reads node:fs (lib/content/help.ts does, which is why the Resources
 * card pointed at a hard-coded help slug while it pointed at the help center
 * at all).
 *
 * Every interactive element is a NavigationMenuLink (close-on-select + the
 * roving focus contract) EXCEPT the DemoTicket, whose root is already a Link
 * to the demo event; the controlled root's pathname-close covers in-app
 * navigations, and the demo is a full-page exit anyway.
 */
export function MegaPanel({ group }: { group: NavGroup }) {
  const featured = FEATURED[group.label];
  const twoCol = group.children.length > 4;
  return (
    <div
      // The viewport cap is 100vw MINUS 5rem, not 2rem, and the extra is not
      // arbitrary. The shared panel is centred on the NavigationMenu root, and
      // the root sits ~16px LEFT of the page centre at every width — the header
      // is `justify-between` over logo / nav / actions, so the middle child's
      // centre is W/2 + (logoWidth - actionsWidth) / 2, and that delta is a
      // constant -32px. A `100vw - 2rem` panel is therefore exactly W - 32 wide
      // around a centre 16px left of middle, which lands its left edge on 0:
      // flush against the window at ~768-900px. 5rem leaves a 24px left gutter
      // with margin to spare. Re-derive this if the header's logo or action
      // cluster ever changes width.
      className={cn(
        "grid w-[min(680px,calc(100vw-5rem))] gap-2 p-2",
        featured && "md:grid-cols-[1fr_272px]",
        featured && twoCol && "md:w-[min(760px,calc(100vw-5rem))]",
      )}
    >
      <div className="flex min-w-0 flex-col gap-1">
        {group.href && (
          <NavigationMenuLink
            asChild
            className="mkt-learn group/all flex-row items-center gap-1 px-3 py-2 text-xs font-medium tracking-[0.14em] text-muted-foreground uppercase transition-colors duration-[var(--mkt-dropdown-ink-ms,60ms)] hover:text-foreground"
          >
            <Link href={group.href}>
              All {group.label.toLowerCase()}
              <LearnChevron />
            </Link>
          </NavigationMenuLink>
        )}
        <ul
          className={cn(
            "flex list-none flex-col gap-0.5",
            twoCol && "grid grid-cols-1 sm:grid-cols-2",
          )}
        >
          {group.children.map((child) => (
            <li key={child.href}>
              <ItemLink link={child} />
            </li>
          ))}
        </ul>
        {/* The QUIETER of the two doors to the same page (`two-doors=one`, see
            the Resources card below): a footnote under a hairline, in muted
            ink at 12px, where the card is a picture with a title. Will kept it
            deliberately ("more subtle, like a secondary option"), because the
            reader who needs it most is mid-way through a list of features and
            has just realised they do not know the shape of the thing yet. */}
        {group.label === "Features" && (
          <NavigationMenuLink
            asChild
            className="mt-1 flex-row items-center gap-1.5 border-t px-3 pt-2.5 pb-1.5 text-xs text-muted-foreground transition-colors duration-[var(--mkt-dropdown-ink-ms,60ms)] hover:text-foreground"
          >
            <Link href="/how-it-works" className="mkt-learn">
              New here? See how it works
              <LearnChevron />
            </Link>
          </NavigationMenuLink>
        )}
      </div>
      {featured}
    </div>
  );
}

function ItemLink({ link }: { link: NavLink }) {
  return (
    <NavigationMenuLink
      asChild
      className="flex-col items-start gap-0.5 px-3 py-2"
    >
      <Link href={link.href}>
        <span className="text-sm font-medium text-foreground">
          {link.label}
        </span>
        {link.description && (
          <span className="text-xs leading-snug text-muted-foreground">
            {link.description}
          </span>
        )}
      </Link>
    </NavigationMenuLink>
  );
}

/** The featured right panes, keyed by group label (see the header comment). */
const FEATURED: Record<string, ReactNode> = {
  Features: DEMO_EVENT_URL ? (
    <div className="flex flex-col justify-center">
      <DemoTicket layout="column" />
    </div>
  ) : null,
  Events: (
    <FeaturedCard
      href="/events"
      title="Every kind of event"
      blurb="Weddings to conferences: see how hosts run Partyreel."
      imageId="wedding-toast"
    />
  ),
  Resources: (
    <FeaturedCard
      /* ★ ONE IDEA, ONE PAGE, TWO DOORS TO IT (Will, 2026-09-19,
         `two-doors=one` and his plan-mode answer "Yes, both doors open the
         page"): "We can continue to point to the 'How it Works' page from the
         resources dropdown card. The pointer in the 'Features' dropdown menu
         is more subtle (like a secondary option), so the How It Works page
         primary nav link can be that Resources dropdown card."

         So this card is the chrome's PRIMARY door to /how-it-works and the
         Features panel's footnote is the quieter second one. Both open the
         page; the help ARTICLE is now linked from nowhere in the chrome at
         all, which is the point of the ruling. It is not lost: it keeps its
         row under Help center, where a reader with a problem is already
         looking, plus the walkthrough's own foot link and the help hub's.
         (`pair=renamed`, an hour earlier, had told this card to name the
         article instead; that answer solved "two pages, same name" by sending
         the nav to the wrong one of the two.)

         The title is the PAGE'S OWN NAME, deliberately flat: a primary door
         must not be clever about where it goes. The blurb still refuses to
         count steps, which is the standing rule here: the card once said four,
         the article writes five and the page walks six, and a count in a nav
         blurb is one more number to keep in step for nothing. */
      href="/how-it-works"
      title="How it works"
      blurb="The whole loop on one page, the host's side and the guest's."
      imageId="reception-table"
    />
  ),
};

function FeaturedCard({
  href,
  title,
  blurb,
  imageId,
}: {
  href: string;
  title: string;
  blurb: string;
  imageId: string;
}) {
  const image = marketingImage(imageId);
  return (
    <NavigationMenuLink
      asChild
      className="flex-col items-stretch gap-0 overflow-hidden rounded-lg border bg-card p-0"
    >
      <Link href={href}>
        <span className="relative block aspect-[16/9] w-full overflow-hidden">
          <Image
            src={image.src}
            alt=""
            fill
            sizes="272px"
            className="object-cover"
          />
        </span>
        <span className="flex flex-col gap-1 p-3">
          <span className="text-sm font-medium text-foreground">{title}</span>
          <span className="text-xs leading-snug text-muted-foreground">
            {blurb}
          </span>
        </span>
      </Link>
    </NavigationMenuLink>
  );
}
