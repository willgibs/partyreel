"use client";

import Image from "next/image";
import Link from "next/link";
import { Menu } from "lucide-react";

import { LearnChevron } from "@/components/marketing/sections/shared/learn-chevron";
import { useNavIndicator } from "@/components/marketing/chrome/nav-indicator";
import { DemoTicket } from "@/components/marketing/system/demo-ticket";
import { Container } from "@/components/shared/container";
import { Logo } from "@/components/shared/logo";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import { marketingImage } from "@/lib/constants/marketing-media";
import {
  isNavGroup,
  MARKETING_CTA,
  type NavGroup,
  type NavItem,
  type NavLink,
} from "@/lib/constants/marketing-nav";
import { DEMO_EVENT_URL } from "@/lib/demo";
import { cn } from "@/lib/utils";

import {
  flatFor,
  HOST,
  navFor,
  type Holds,
  type OnScroll,
  type Returning,
  type Shape,
  type TwoDoors,
} from "./fixtures";

/**
 * THE MARKETING HEADER, FORKED SO IT TAKES ITS ANSWERS AS PROPS.
 *
 * ★ WHY A FORK AND NOT THE SHIPPED COMPONENT. Three reasons, each one a bug
 * before it was a rule:
 *  1. `MarketingNavDesktop` reads `usePathname()` to ink the current section.
 *     Inside a portalled `Frame` that is the LAB's path, so every bar would
 *     draw with nothing current. The active route is a prop here, exactly as
 *     `sandbox/admin/chrome.tsx` does it for the portal's own nav.
 *  2. A still capture has no cursor, so a hover-only mega panel photographs as
 *     an empty bar. The `NavigationMenu` root is CONTROLLED here and handed a
 *     fixed `value`, which is the primitive's own way of being open: the real
 *     viewport, the real entrance, the real geometry, just without a pointer.
 *  3. The board asks what the bar HOLDS and what SHAPE it takes, and the
 *     shipped component has a prop for neither. Nothing in production changes.
 *
 * Everything else is the shipped markup verbatim, on the shipped primitives:
 * the 64 px `Container` row on `--mkt-header-h`, the inert `-z-10` glass layer
 * (never a filter on the bar, header-shell.tsx says why), the quiet trigger
 * over the nova pill, the real `useNavIndicator` pill, the real panel rows and
 * the real `DemoTicket`.
 */

/* ── The bar's two postures, copied off header-shell.tsx ─────────────────── */

/** The glass: background, blur and hairline, painted BEHIND the bar's content
 *  and never in its ancestor chain. Only `opacity` ever changes. */
function GlassLayer({ on }: { on: boolean }) {
  return (
    <div
      aria-hidden
      className={cn(
        "pointer-events-none absolute inset-0 -z-10 border-b border-border bg-background/80 backdrop-blur transition-opacity duration-[220ms] ease-in-out-strong",
        on ? "opacity-100" : "opacity-0",
      )}
    />
  );
}

/* ── The rows and the panel ──────────────────────────────────────────────── */

const linkClass =
  "text-sm text-muted-foreground transition-colors duration-[var(--mkt-dropdown-ink-ms,60ms)] ease-emphasis hover:text-foreground";

const quietTrigger = cn(
  linkClass,
  "h-auto rounded-full bg-transparent px-3 py-1.5 font-normal",
  "hover:bg-transparent hover:text-foreground focus:bg-transparent",
  "data-open:bg-transparent data-open:text-foreground",
);

const flatLink = cn(
  linkClass,
  "rounded-full bg-transparent px-3 py-1.5 hover:bg-transparent focus:bg-transparent",
);

function ItemRow({ link }: { link: NavLink }) {
  return (
    <NavigationMenuLink
      asChild
      className="flex-col items-start gap-0.5 px-3 py-2"
    >
      <Link href={link.href}>
        <span className="text-sm font-medium text-foreground">
          {link.label}
        </span>
        {link.description ? (
          <span className="text-xs leading-snug text-muted-foreground">
            {link.description}
          </span>
        ) : null}
      </Link>
    </NavigationMenuLink>
  );
}

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

/**
 * THE TWO DOORS TO ONE LOOP, which is a decision of its own on this board.
 *
 * Today the Features panel ends on a footnote to `/how-it-works` and the
 * Resources panel's card points at `/help/how-partyreel-works`: two doors to
 * the same story, in one bar, with nothing to tell them apart (and the card
 * says four steps where the article has five, which is a Deferred line
 * whichever option wins).
 */
const LOOP_FOOTNOTE: Record<TwoDoors, string | null> = {
  unlabelled: "New here? See how it works",
  one: "New here? See how it works",
  named: "New here? Watch the loop on one page",
};

const LOOP_CARD: Record<
  TwoDoors,
  { href: string; title: string; blurb: string; imageId: string }
> = {
  unlabelled: {
    href: "/help/how-partyreel-works",
    title: "How Partyreel works",
    blurb: "The whole loop in four steps, from the help center.",
    imageId: "reception-table",
  },
  one: {
    href: "/contact",
    title: "Talk to a person",
    blurb: "Any question about hosting, answered by us.",
    imageId: "reception-table",
  },
  named: {
    href: "/help/how-partyreel-works",
    title: "Read the walkthrough",
    blurb: "The same loop written out, step by step, in the help center.",
    imageId: "reception-table",
  },
};

function featuredFor(label: string, twoDoors: TwoDoors) {
  if (label === "Features")
    return DEMO_EVENT_URL ? (
      <div className="flex flex-col justify-center">
        <DemoTicket layout="column" />
      </div>
    ) : null;
  if (label === "Events")
    return (
      <FeaturedCard
        href="/events"
        title="Every kind of event"
        blurb="Weddings to conferences: see how hosts run Partyreel."
        imageId="wedding-toast"
      />
    );
  if (label === "Resources") return <FeaturedCard {...LOOP_CARD[twoDoors]} />;
  return null;
}

/** The mega panel, forked only so its loop doors take a prop. */
export function BoardPanel({
  group,
  twoDoors,
}: {
  group: NavGroup;
  twoDoors: TwoDoors;
}) {
  const featured = featuredFor(group.label, twoDoors);
  const twoCol = group.children.length > 4;
  const footnote = group.label === "Features" ? LOOP_FOOTNOTE[twoDoors] : null;
  return (
    <div
      className={cn(
        "grid w-[min(680px,calc(100vw-5rem))] gap-2 p-2",
        featured && "md:grid-cols-[1fr_272px]",
        featured && twoCol && "md:w-[min(760px,calc(100vw-5rem))]",
      )}
    >
      <div className="flex min-w-0 flex-col gap-1">
        {group.href ? (
          <NavigationMenuLink
            asChild
            className="mkt-learn group/all flex-row items-center gap-1 px-3 py-2 text-xs font-medium tracking-[0.14em] text-muted-foreground uppercase transition-colors duration-[var(--mkt-dropdown-ink-ms,60ms)] hover:text-foreground"
          >
            <Link href={group.href}>
              All {group.label.toLowerCase()}
              <LearnChevron />
            </Link>
          </NavigationMenuLink>
        ) : null}
        <ul
          className={cn(
            "flex list-none flex-col gap-0.5",
            twoCol && "grid grid-cols-1 sm:grid-cols-2",
          )}
        >
          {group.children.map((child) => (
            <li key={child.href}>
              <ItemRow link={child} />
            </li>
          ))}
        </ul>
        {footnote ? (
          <NavigationMenuLink
            asChild
            className="mt-1 flex-row items-center gap-1.5 border-t px-3 pt-2.5 pb-1.5 text-xs text-muted-foreground transition-colors duration-[var(--mkt-dropdown-ink-ms,60ms)] hover:text-foreground"
          >
            <Link href="/how-it-works" className="mkt-learn">
              {footnote}
              <LearnChevron />
            </Link>
          </NavigationMenuLink>
        ) : null}
      </div>
      {featured}
    </div>
  );
}

/* ── The desktop nav, three shapes ───────────────────────────────────────── */

function PanelNav({
  items,
  open,
  active,
  twoDoors,
  className,
}: {
  items: NavItem[];
  /** Which panel is drawn open; a still capture has no cursor. */
  open: string | null;
  active: string;
  twoDoors: TwoDoors;
  className?: string;
}) {
  const openIndex = open ? items.findIndex((i) => i.label === open) : -1;
  const { listProps, itemProps, indicator } = useNavIndicator(
    openIndex === -1 ? null : openIndex,
  );
  return (
    <NavigationMenu
      value={open ?? ""}
      onValueChange={() => {}}
      className={cn("max-w-none", className)}
    >
      <NavigationMenuList className="relative gap-0" {...listProps}>
        {indicator}
        {items.map((item, index) => {
          const current = item.label === active;
          return isNavGroup(item) ? (
            <NavigationMenuItem
              key={item.label}
              value={item.label}
              className="z-10"
              {...itemProps(index)}
            >
              <NavigationMenuTrigger
                className={cn(quietTrigger, current && "text-foreground")}
              >
                {item.label}
              </NavigationMenuTrigger>
              <NavigationMenuContent>
                <BoardPanel group={item} twoDoors={twoDoors} />
              </NavigationMenuContent>
            </NavigationMenuItem>
          ) : (
            <NavigationMenuItem
              key={item.label}
              className="z-10"
              {...itemProps(index)}
            >
              <NavigationMenuLink
                asChild
                className={cn(flatLink, current && "text-foreground")}
              >
                <Link href={item.href}>{item.label}</Link>
              </NavigationMenuLink>
            </NavigationMenuItem>
          );
        })}
      </NavigationMenuList>
    </NavigationMenu>
  );
}

/** Every entry a flat link to its own hub: no panel, no viewport, no indicator. */
function FlatNav({
  links,
  active,
  className,
}: {
  links: NavLink[];
  active: string;
  className?: string;
}) {
  return (
    <nav className={cn("items-center gap-0", className)}>
      {links.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          aria-current={link.label === active ? "page" : undefined}
          className={cn(flatLink, link.label === active && "text-foreground")}
        >
          {link.label}
        </Link>
      ))}
    </nav>
  );
}

/* ── The right cluster, three ways ───────────────────────────────────────── */

function Actions({
  returning,
  phone,
  compact,
}: {
  returning: Returning;
  /** Whether to draw the hamburger: false when a standing bottom bar owns the
   *  navigation, where a second door to the same links is noise. */
  phone: boolean;
  /** The shrunk rail drops everything but the one action. */
  compact?: boolean;
}) {
  if (returning === "dashboard")
    return (
      <div className="flex items-center gap-2">
        <Button type="button" size="sm">
          Dashboard
        </Button>
        {phone ? <MenuButton /> : null}
      </div>
    );
  if (returning === "avatar")
    return (
      <div className="flex items-center gap-2.5">
        <span className="hidden text-sm text-muted-foreground sm:inline">
          {HOST.name}
        </span>
        <Avatar size="sm">
          <AvatarFallback>{HOST.initial}</AvatarFallback>
        </Avatar>
        {phone ? <MenuButton /> : null}
      </div>
    );
  return (
    <div className="flex items-center gap-2">
      {compact ? null : (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="hidden sm:inline-flex"
        >
          Log in
        </Button>
      )}
      <Button type="button" size="sm">
        {MARKETING_CTA.label}
      </Button>
      {phone ? <MenuButton /> : null}
    </div>
  );
}

function MenuButton() {
  return (
    <Button type="button" variant="ghost" size="icon-sm" aria-label="Open menu">
      <Menu />
    </Button>
  );
}

/* ── The header ──────────────────────────────────────────────────────────── */

export type HeaderProps = {
  shape: Shape;
  holds: Holds;
  returning?: Returning;
  twoDoors?: TwoDoors;
  /** The section the visitor is in, as a prop: `usePathname` lies in a frame. */
  active?: string;
  /** Which panel is drawn open. */
  open?: string | null;
  /** Past the hero: the glass is on and `scroll` decides what the bar becomes. */
  stuck?: boolean;
  scroll?: OnScroll;
  phone?: boolean;
  /** False where a standing bottom bar replaces the hamburger. */
  hamburger?: boolean;
};

export function BoardHeader({
  shape,
  holds,
  returning = "both",
  twoDoors = "one",
  active = "Events",
  open = null,
  stuck = false,
  scroll = "stay",
  phone = false,
  hamburger = true,
}: HeaderProps) {
  // The hide answer, once the page has moved: there is no bar to draw.
  if (stuck && scroll === "hide") return null;
  const rail = stuck && scroll === "shrink";
  const items = navFor(holds);
  return (
    <header className="sticky top-0 isolate z-40">
      <GlassLayer on={stuck} />
      <Container
        data-sc-bar
        className={cn(
          "flex items-center justify-between gap-4 transition-[height] duration-200 ease-in-out-strong",
          rail ? "h-12" : "h-[var(--mkt-header-h,4rem)]",
        )}
      >
        <Link href="/" aria-label="Partyreel home" className="shrink-0">
          <Logo className={rail ? "h-4.5" : undefined} />
        </Link>
        {rail || shape === "door" ? null : shape === "panels" ? (
          <PanelNav
            items={items}
            open={phone ? null : open}
            active={active}
            twoDoors={twoDoors}
            className="hidden md:flex"
          />
        ) : (
          <FlatNav
            links={flatFor(holds)}
            active={active}
            className="hidden md:flex"
          />
        )}
        <Actions
          returning={returning}
          phone={phone && hamburger}
          compact={rail}
        />
      </Container>
    </header>
  );
}
