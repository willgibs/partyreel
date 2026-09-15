"use client";

import "./board.css";

import { useEffect, useState } from "react";
import {
  ArrowLeft,
  Check,
  Copy,
  Download,
  EyeOff,
  Images,
  MoreHorizontal,
  Plus,
  QrCode,
  Search,
  Share2,
  Sparkles,
  Trash2,
  Upload,
  Users,
} from "lucide-react";

import { EventCard } from "@/components/app/event-card";
import type { GridMedia } from "@/components/app/media-grid";
import { EntryShell } from "@/components/guest/entry-shell";
import { MasonryColumns } from "@/components/shared/masonry";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { marketingImage } from "@/lib/constants/marketing-media";
import { cn } from "@/lib/utils";

import type { ScreenId } from "./screen-ids";

/**
 * THE APP SCREENS, IN A REAL VIEWPORT (round four, 2026-09-15).
 *
 * ★ WHY A ROUTE AND NOT A STAGE. Three rounds drew the app inside the shell's
 * Stage, and a Stage is a div: a Tailwind breakpoint prefix inside it reads the
 * BROWSER's width, not the canvas's, so `sm:columns-3` fires inside a 375
 * canvas on a desktop and the phone read is a fiction; and every radix panel
 * portals to the page's own body, so a dialog escapes the canvas entirely.
 * Both are documented on Stage itself, and both are why every app composition
 * on this board used to be hand-rewritten with a `mode` prop instead of the
 * component's own prefixes: a stand-in, judged as if it were the thing.
 *
 * This page is the thing. The board mounts it in an iframe laid out at exactly
 * 1440x930 or 375x760, so `document` IS the canvas: real breakpoints, real
 * portals, real scroll, real `position: fixed`, at true pixels. The pattern is
 * the floating-surfaces board's (it needed a document of its own for the same
 * portal reason); what this lane adds is that the CANDIDATE comes in from the
 * parent, written into this document as the same paste a ruling would land.
 *
 * So the compositions below are the production components with their own
 * responsive classes left alone: MasonryColumns as the gallery ships it,
 * EventCard as the dashboard ships it, the real Dialog and DropdownMenu, and
 * the real guest EntryShell, which is a vaul drawer below 640 and a Radix
 * dialog above and is therefore two different surfaces depending on the
 * canvas.
 */

/* ── The media the screens borrow ──────────────────────────────────────── */

const STILLS = [
  "wedding-golden",
  "party-dj",
  "festival-lights",
  "concert-confetti",
  "wedding-toast",
  "reception-hall",
  "party-balloons",
  "festival-crowd",
];

/** Real GridMedia rows off the marketing manifest: width and height are the
 *  file's own, so MasonryColumns lays the natural ratios it ships with. */
function items(count: number, offset = 0): GridMedia[] {
  return Array.from({ length: count }, (_, i) => {
    const img = marketingImage(STILLS[(i + offset) % STILLS.length]);
    return {
      id: `rnd-${offset}-${i}`,
      type: "photo" as const,
      url: img.src,
      previewUrl: img.src,
      width: img.width,
      height: img.height,
    };
  });
}

/* ── The host dashboard ────────────────────────────────────────────────── */

const EVENTS = [
  {
    name: "Summer wedding",
    cover: "wedding-golden",
    date: "14 June",
    items: "312 items",
    status: "Open",
    pending: 6,
  },
  {
    name: "Rooftop birthday",
    cover: "party-balloons",
    date: "2 May",
    items: "88 items",
    status: "Open",
    pending: 0,
  },
  {
    name: "Team offsite",
    cover: "reception-hall",
    date: "19 March",
    items: "140 items",
    status: "Closed",
    pending: 0,
  },
  {
    name: "Label night",
    cover: "party-dj",
    date: "7 February",
    items: "506 items",
    status: "Open",
    pending: 2,
  },
];

function DashboardScreen() {
  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6 sm:py-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl leading-snug tracking-tight sm:text-3xl">
            Your events
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Four hosted, one saved.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative hidden sm:block">
            <Search className="absolute top-1/2 left-2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input className="w-44 pl-7" placeholder="Search events" />
          </div>
          <Button>
            <Plus data-icon="inline-start" /> New event
          </Button>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-1.5">
        <Button size="sm" variant="secondary">
          All
        </Button>
        <Button size="sm" variant="ghost">
          Hosted
        </Button>
        <Button size="sm" variant="ghost">
          Saved
        </Button>
        <Badge className="ml-1">
          <Check data-icon="inline-start" /> 6 to review
        </Badge>
      </div>

      <ul className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {EVENTS.map((e) => (
          <li key={e.name}>
            <EventCard
              href="#"
              name={e.name}
              coverUrl={marketingImage(e.cover).src}
              dateLabel={e.date}
              itemsLabel={e.items}
              statusLabel={e.status}
              pendingCount={e.pending}
              qrSlot={
                <span className="flex items-center justify-center rounded-[var(--radius-tile)] bg-white p-1.5 text-black">
                  <QrCode className="size-3.5" aria-hidden />
                </span>
              }
            />
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ── The host event page ───────────────────────────────────────────────── */

function EventScreen() {
  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6 sm:py-8">
      <a
        href="#"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground"
      >
        <ArrowLeft className="size-3.5" /> All events
      </a>
      <div className="mt-2 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl leading-snug tracking-tight sm:text-3xl">
            Summer wedding
          </h1>
          <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <Images className="size-3.5" /> 312 items
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Users className="size-3.5" /> 48 guests
            </span>
            <span className="inline-flex items-center gap-1.5">
              <EyeOff className="size-3.5" /> Link only
            </span>
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button>
            <Share2 data-icon="inline-start" /> Share
          </Button>
          <Button variant="outline">
            <Sparkles data-icon="inline-start" /> Make a reel
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon" aria-label="More">
                <MoreHorizontal />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>
                <Copy /> Copy the guest link
              </DropdownMenuItem>
              <DropdownMenuItem>
                <QrCode /> Open the QR
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Download /> Download the album
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive">
                <Trash2 /> Delete the event
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-1.5">
        <Button size="sm" variant="secondary">
          All
        </Button>
        <Button size="sm" variant="ghost">
          To review
          <Badge className="ml-1.5">6</Badge>
        </Button>
        <Button size="sm" variant="ghost">
          Gallery
        </Button>
        <Button size="sm" variant="ghost">
          Reel
        </Button>
      </div>

      <div className="mt-4">
        <MasonryColumns items={items(12)} viewerIsHost />
      </div>
    </div>
  );
}

/* ── The gap, on the real grid ─────────────────────────────────────────── */

/**
 * ★ THE PAIR IS A FINDING, NOT A CANDIDATE. guest-masonry.tsx,
 * gallery-skeleton.tsx and ghost-grid.tsx write their column gap as a LITERAL
 * `gap-[3px]` while their tiles ride `var(--radius-tile)`, so the moment the
 * tile goes above 3 the four corners meeting at a junction open a visible
 * diamond, on the one grid every guest sees and nowhere else in the product.
 */
function GalleryScreen() {
  const nine = items(9);
  return (
    <div className="flex min-h-full flex-col bg-gallery text-gallery-foreground">
      <div className="flex items-center justify-between gap-3 px-4 py-3">
        <div>
          <p className="font-heading text-lg leading-snug">Summer wedding</p>
          <p className="text-xs text-gallery-muted">312 photos, 48 guests</p>
        </div>
        <Button>
          <Upload data-icon="inline-start" /> Add photos
        </Button>
      </div>
      <div className="grid gap-6 px-4 pb-6 sm:grid-cols-2">
        <div>
          <div className="grid grid-cols-3 gap-[var(--gap-gallery)]">
            {nine.map((m) => (
              <span
                key={m.id}
                className="relative block aspect-square overflow-hidden bg-black/10"
                style={{ borderRadius: "var(--radius-tile)" }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element -- a local still, same as the tile ships */}
                <img
                  src={m.url}
                  alt=""
                  loading="lazy"
                  className="size-full object-cover"
                />
              </span>
            ))}
          </div>
          <p className="mt-2 text-[11px] text-gallery-muted tabular-nums">
            On the token: the gap follows the tile.
          </p>
        </div>
        <div>
          <div className="grid grid-cols-3 gap-[3px]">
            {nine.map((m) => (
              <span
                key={m.id}
                className="relative block aspect-square overflow-hidden bg-black/10"
                style={{ borderRadius: "var(--radius-tile)" }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element -- a local still, same as the tile ships */}
                <img
                  src={m.url}
                  alt=""
                  loading="lazy"
                  className="size-full object-cover"
                />
              </span>
            ))}
          </div>
          <p className="mt-2 text-[11px] text-gallery-muted tabular-nums">
            As the guest gallery ships: a literal 3px gap.
          </p>
        </div>
      </div>
      <div className="px-4 pb-8">
        <p className="mb-2 text-[11px] text-gallery-muted">
          The same photographs in the shared MasonryColumns, which is the grid
          every host surface uses and the one the guest gallery is being
          converged onto.
        </p>
        <MasonryColumns items={items(10, 2)} />
      </div>
    </div>
  );
}

/* ── The guest door, drawn by the production shell ─────────────────────── */

function EntryScreen() {
  // The shell is fully derived upstream in production, so `open` is a constant
  // here and the dismiss is a no-op: this is the surface at rest, which is the
  // only state its corner can be judged in.
  const [open, setOpen] = useState(true);
  return (
    <div className="relative min-h-full bg-gallery text-gallery-foreground">
      <div className="flex items-center justify-between gap-3 px-4 py-3">
        <p className="font-heading text-lg leading-snug">Summer wedding</p>
        <span className="text-xs text-gallery-muted">312 photos</span>
      </div>
      <div aria-hidden className="px-1 pb-8 opacity-70">
        <MasonryColumns items={items(8, 3)} />
      </div>
      <EntryShell
        open={open}
        dismissMode="held"
        onDismiss={() => setOpen(false)}
        title="Welcome to Summer wedding"
        description="Add your photos to the shared album."
      >
        <p className="font-heading text-lg leading-snug font-semibold">
          Welcome to Summer wedding
        </p>
        <p className="mt-1 text-muted-foreground">
          A shared gallery for the whole event. Add what you shot, see what
          everyone else did.
        </p>
        <Input className="mt-4" placeholder="Your name" defaultValue="" />
        <Button className="mt-3 w-full">Add your photos</Button>
        <button
          type="button"
          className="mt-2 w-full text-center text-xs text-muted-foreground"
        >
          Just looking, thanks
        </button>
      </EntryShell>
    </div>
  );
}

/* ── The floating layer, portalled into this canvas ────────────────────── */

function FloatingScreen() {
  return (
    <div className="relative min-h-full px-4 py-6 sm:px-6 sm:py-8">
      <h1 className="font-heading text-2xl leading-snug tracking-tight">
        Summer wedding
      </h1>
      <p className="mt-1 max-w-md text-sm text-muted-foreground">
        The album behind the layer, so the panel has something to detach from.
      </p>
      <div aria-hidden className="mt-4 opacity-90">
        <MasonryColumns items={items(9, 1)} />
      </div>

      <Dialog open>
        <DialogContent
          showCloseButton={false}
          onOpenAutoFocus={(e) => e.preventDefault()}
          className="sm:max-w-sm"
        >
          <DialogHeader>
            <DialogTitle>Share this event</DialogTitle>
            <DialogDescription>
              Anyone with the link can add photos. The QR goes on the table.
            </DialogDescription>
          </DialogHeader>
          <Input defaultValue="partyreel.com/e/summer-wedding" readOnly />
          <DialogFooter>
            <Button variant="ghost">Cancel</Button>
            <Button>
              <Copy data-icon="inline-start" /> Copy link
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="pointer-events-none fixed right-4 bottom-4 z-50 flex justify-end">
        <DropdownMenu open>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              className="pointer-events-auto"
              aria-label="More"
            >
              <MoreHorizontal data-icon="inline-start" /> Album
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            side="top"
            className="pointer-events-auto"
          >
            <DropdownMenuItem>
              <Copy /> Copy the guest link
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Download /> Download the album
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive">
              <Trash2 /> Delete the event
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}

/* ── The page ──────────────────────────────────────────────────────────── */

const GROUND_CLASS: Record<string, string> = {
  "app-light": "surface-paper",
  "app-dark": "dark",
  cinema: "dark",
  paper: "surface-paper",
  ink: "surface-ink",
};

/**
 * ★ THE GROUND IS PAINTED TWICE, ON PURPOSE.
 *
 * On the wrapper, where it is server rendered and there is no flash; and on
 * <body> from an effect, because every radix panel portals INTO the body and
 * would otherwise land outside the ground it is being judged on. It goes on
 * body rather than <html> because next-themes owns the class list on the
 * document element and puts `dark` back after any effect here has run, so a
 * ground written there is a fight; body is uncontested, and the token blocks
 * are plain class selectors, so a `.surface-paper` on body beats an inherited
 * `.dark` from html for this whole subtree.
 *
 * The <style> is the lab's own chrome, removed for THIS document only. The
 * screen route lives under the lab layout, which lays a 232px nav in the first
 * grid column from `lg` up, and inside a 1440 frame that breakpoint is real
 * (which is the whole reason the route exists), so the nav would take a sixth
 * of the canvas. Rendered rather than written from an effect so the nav is
 * never painted at all.
 */
export function ScreenPage({
  screen,
  ground,
}: {
  screen: ScreenId;
  ground: string;
}) {
  const groundClass = GROUND_CLASS[ground] ?? "surface-paper";
  const cinema = ground === "cinema";

  useEffect(() => {
    const body = document.body;
    body.classList.add(groundClass);
    if (cinema) {
      body.dataset.mkt = "";
      body.classList.add("rnd-screen-cinema");
    }
    return () => {
      body.classList.remove(groundClass, "rnd-screen-cinema");
      delete body.dataset.mkt;
    };
  }, [groundClass, cinema]);

  return (
    <>
      <style>{
        ".lab-grid{display:block}.lab-nav,.lab-sidebar-pill{display:none}"
      }</style>
      <div
        className={cn(
          groundClass,
          "rnd-screen min-h-dvh bg-background text-foreground",
          cinema && "rnd-screen-cinema",
        )}
        {...(cinema ? { "data-mkt": "" } : {})}
      >
        {screen === "dashboard" ? <DashboardScreen /> : null}
        {screen === "event" ? <EventScreen /> : null}
        {screen === "gallery" ? <GalleryScreen /> : null}
        {screen === "entry" ? <EntryScreen /> : null}
        {screen === "floating" ? <FloatingScreen /> : null}
      </div>
    </>
  );
}
