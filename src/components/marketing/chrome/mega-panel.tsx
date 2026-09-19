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
 * sitemap consumers must never drag client/env deps). Resources' article card
 * is plain literals for the same reason: lib/content/help.ts reads node:fs and
 * must never be imported client-side (a node-world test pins the slug exists).
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
      /* THE PAIR RENAMED (Will, 2026-09-19, `pair=renamed`): "Two pages, same
         name is too confusing." This card and /how-it-works both told a reader
         "How Partyreel works" and went to different places. The card now names
         the ARTICLE, exactly as the walkthrough's own foot link does, and the
         help hub's link to the page reads "See the loop, start to finish".
         The blurb no longer counts steps: it said four, the article writes
         five and the page walks six, and a count in a nav blurb is one more
         number to keep in step for nothing. */
      href="/help/how-partyreel-works"
      title="Read the full how-to"
      blurb="The whole loop written out, with the details, in the help center."
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
