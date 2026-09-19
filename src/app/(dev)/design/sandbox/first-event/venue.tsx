"use client";

import { type ReactNode } from "react";
import {
  ArrowRight,
  Copy,
  Download,
  ExternalLink,
  Images,
  Mail,
  MessageSquare,
  Printer,
  Send,
  Share2,
  Sun,
} from "lucide-react";

import { PageHeading } from "@/components/shared/page-heading";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { Code, type Size } from "./frame";
import { EVENT, JOIN_URL, SLUG_URL } from "./fixtures";
import { type Empty, type First, EventPage } from "./event";

/**
 * GETTING IT OUT: how the code leaves the screen, where a host lands with it,
 * and what they hold out to a guest at the door.
 *
 * ★ THE PRODUCT HAS NO PAPER AT ALL. There is no print sheet, table card, sign
 * or poster anywhere in the app: today a host gets an SVG and a PNG and builds
 * the rest in somebody else's tool. Meanwhile /features/qr mocks a table card
 * and a welcome sign as if they came out of the product
 * (marketing/sections/features/qr/print-shop.tsx), and the ROADMAP's share
 * studio names the generator as the real feature. So the `sheet` option here
 * draws the artifacts the marketing site already sells, at their real paper
 * proportions, with the real code set in them. The board draws it; the wiring
 * would build it.
 *
 * ★ EVERY MILLIMETRE ON THE STOCK IS A SPEC, NOT A MEASUREMENT, and the two are
 * kept apart on purpose. The frame measures pixels and the caption says so; the
 * mm under each piece is what the sheet would print, which is a decision rather
 * than a reading. The one number that is measured on every option is the code's
 * module edge, because that is what decides whether the thing scans at all.
 */

/* ── The axes ────────────────────────────────────────────────────────────── */

/** How the code reaches the venue. */
export type Venue = "files" | "sheet" | "send";
export const venueOf = (v: string | undefined): Venue =>
  v === "files" || v === "send" ? v : "sheet";

/** Where a just-created host lands. */
export type Landing = "page" | "beat" | "home";
export const landingOf = (v: string | undefined): Landing =>
  v === "page" || v === "home" ? v : "beat";

/** The host at the venue with only a phone. */
export type Hand = "same" | "show" | "card";
export const handOf = (v: string | undefined): Hand =>
  v === "same" || v === "card" ? v : "show";

/* ── How the code reaches the venue ──────────────────────────────────────── */

/**
 * TODAY: the wizard's third step. A 200 px code, Open, a two-row Download menu,
 * the copy-link row and the slug control. Everything after this happens in
 * Canva, Word or a print shop's web form, and the app never hears about it.
 */
function VenueFiles({ size }: { size: Size }) {
  return (
    <div className="mx-auto w-full max-w-xl space-y-5 rounded-xl border border-border p-6">
      <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/40 px-3 py-2 text-sm">
        <span className="font-medium">{EVENT.name} is ready.</span>
      </div>
      <div className="space-y-1">
        <p className="text-sm font-medium">Your event link</p>
        <p className="text-sm text-muted-foreground">
          Print or display the QR, or share the link. Guests just open it. No
          app, no account.
        </p>
      </div>
      <div className="flex flex-col items-center gap-4">
        <Code size={200} value={JOIN_URL} />
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <ExternalLink /> Open
          </Button>
          <Button variant="outline" size="sm">
            <Download /> Download
          </Button>
        </div>
        <div className="w-48 overflow-hidden rounded-md border border-border bg-popover text-sm shadow-lift">
          <p className="px-3 py-2">SVG (best for print)</p>
          <p className="px-3 py-2">PNG (best for screens)</p>
        </div>
      </div>
      <LinkField url={JOIN_URL} />
      <div className="space-y-2 rounded-lg border border-border p-3">
        <p className="text-sm font-medium">Prettier link</p>
        <LinkField url={SLUG_URL} button="Save" />
      </div>
      {size === "laptop" && (
        <p className="text-sm text-muted-foreground">
          Two files and a link. Whatever a guest ends up reading off a table,
          somebody made it somewhere else.
        </p>
      )}
    </div>
  );
}

/**
 * THE SHEET THE APP PRINTS. Three pieces of stock, the code already set in
 * each, the event's name on them, and one press to paper or PDF. The table
 * cards come nine to a sheet because nine tables is a wedding.
 */
function VenueSheet({ size, bare }: { size: Size; bare: boolean }) {
  const phone = size === "phone";
  return (
    <div className="mx-auto w-full max-w-5xl space-y-5">
      {/* ★ ONE HEADING, NOT TWO. Reading the first captures caught the beat
          saying "the event is live, get the code where your guests will be"
          and then, two lines down, "Get the code out there". A surface that is
          nested inside another one drops its own title; it never repeats it in
          different words. */}
      {!bare && (
        <div className="space-y-1">
          <PageHeading>Get the code out there</PageHeading>
          <p className="text-sm text-muted-foreground">
            Pick a piece, print it, put it where the guests are.
          </p>
        </div>
      )}
      <div
        className={cn("flex gap-6", phone ? "flex-col" : "items-start")}
      >
        <div className="flex items-end gap-4">
          <Stock
            label="Table card"
            spec="A7, nine to a sheet · the code at 38 mm"
            w={phone ? 150 : 190}
            ratio={1.414}
            selected
          >
            <TableCard scale={phone ? 0.72 : 0.92} />
          </Stock>
          <Stock
            label="Welcome sign"
            spec="A4 · the code at 90 mm"
            w={phone ? 120 : 155}
            ratio={1.414}
          >
            <SignFace scale={phone ? 0.62 : 0.78} />
          </Stock>
        </div>
        <div className="min-w-0 flex-1 space-y-4">
          <div className="space-y-2">
            <p className="text-sm font-medium">Nine to a sheet</p>
            <p className="text-sm text-muted-foreground">
              Cut lines included. A poster is the same card at A2, for the bar
              or the entrance.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button>
              <Printer /> Print
            </Button>
            <Button variant="outline">
              <Download /> Save as PDF
            </Button>
            <Button variant="ghost" className="text-muted-foreground">
              Just the code
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">
            The code inside every piece is the same one, at a size that survives
            a phone camera across a table. Nothing to lay out and nothing to
            scale.
          </p>
        </div>
      </div>
    </div>
  );
}

/**
 * SEND IT TO YOURSELF. The host is on a laptop and the printer is not, or the
 * host is on a phone and the venue is tomorrow. So the code goes where the host
 * is going: the phone's own share sheet, or an email with the pieces attached.
 *
 * ★ THE SHARE SHEET IS A PHONE THING and this option says so at 1440 rather
 * than drawing a control that does not exist there. That asymmetry IS the
 * option's cost: on a laptop it is an email and nothing else.
 */
function VenueSend({ size }: { size: Size }) {
  const phone = size === "phone";
  return (
    <div className="mx-auto w-full max-w-3xl space-y-5">
      <div className="flex flex-col items-center gap-3">
        <Code size={160} value={JOIN_URL} pad="p-3" />
        <p className="text-sm font-medium">{EVENT.name}</p>
      </div>
      <div className="space-y-3 rounded-xl border border-border p-5">
        <p className="text-sm font-medium">Send it to yourself</p>
        <div className="flex items-center gap-2 rounded-md border border-border px-3 py-2">
          <Mail className="size-4 shrink-0 text-muted-foreground" />
          <span className="min-w-0 flex-1 truncate text-sm text-muted-foreground">
            rosa@delgado.co
          </span>
          <Button size="sm">
            <Send /> Send
          </Button>
        </div>
        <p className="text-sm text-muted-foreground">
          The code as SVG and PNG, the table cards as a PDF, and the link. Open
          it on whatever machine the printer is on.
        </p>
      </div>
      {phone ? (
        <div className="overflow-hidden rounded-2xl border border-border">
          <p className="border-b border-border px-4 py-3 text-sm font-medium">
            Or hand it to the phone
          </p>
          <ul className="divide-y divide-border">
            {[
              { Icon: MessageSquare, label: "Messages" },
              { Icon: Mail, label: "Mail" },
              { Icon: Images, label: "Save to Photos" },
              { Icon: Share2, label: "More" },
            ].map(({ Icon, label }) => (
              <li key={label} className="flex items-center gap-3 px-4 py-3">
                <Icon className="size-4 text-muted-foreground" />
                <span className="text-sm">{label}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-border p-5">
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <Share2 className="size-4" /> The phone&rsquo;s own share sheet is
            not here. On a laptop this option is the email and nothing else.
          </p>
        </div>
      )}
    </div>
  );
}

export function VenueScreen({
  venue,
  size,
  bare = false,
}: {
  venue: Venue;
  size: Size;
  /** Nested inside a surface that already titled it, so it drops its own. */
  bare?: boolean;
}) {
  if (venue === "files") return <VenueFiles size={size} />;
  if (venue === "send") return <VenueSend size={size} />;
  return <VenueSheet size={size} bare={bare} />;
}

/* ── Where a just-created host lands ─────────────────────────────────────── */

/**
 * STRAIGHT IN. The ongoing page from second one: everything the event will ever
 * hold, at the one moment it holds none of it. With the code in the header
 * (app-shape's `share=front`) it is not a bad landing, and it is still a page
 * built for the other ninety-nine visits.
 */
function LandingPage({
  empty,
  first,
  size,
}: {
  empty: Empty;
  first: First;
  size: Size;
}) {
  return <EventPage empty={empty} first={first} size={size} />;
}

/**
 * A BEAT OF ITS OWN. One screen for the one job that is actually next, with a
 * beginning and an end, and a door out of it. It is the only landing that can
 * walk a first-time host from a code on a screen to paper on a table, and it
 * happens exactly once per event.
 */
function LandingBeat({ venue, size }: { venue: Venue; size: Size }) {
  return (
    <div className="mx-auto w-full max-w-4xl space-y-6">
      <div className="space-y-1 text-center">
        <PageHeading>{EVENT.name} is live</PageHeading>
        <p className="text-sm text-muted-foreground">
          One thing left: get the code where your guests will be.
        </p>
      </div>
      <div className="rounded-2xl border border-border p-6">
        <VenueScreen venue={venue} size={size} bare />
      </div>
      <div className="flex justify-center">
        <Button variant="ghost" className="text-muted-foreground">
          Go to your event <ArrowRight />
        </Button>
      </div>
    </div>
  );
}

/**
 * BACK TO THE DASHBOARD, the new event lit. The best landing for a host setting
 * up three events in one sitting, and the one that hands a first-time host a
 * card and no next move.
 */
function LandingHome({ size }: { size: Size }) {
  return (
    <div className="space-y-6">
      <PageHeading>Dashboard</PageHeading>
      <div
        className={cn(
          "grid gap-4",
          size === "phone" ? "max-w-full" : "max-w-3xl sm:grid-cols-2",
        )}
      >
        <div className="overflow-hidden rounded-xl border-2 border-brand">
          <div className="flex items-center justify-center bg-muted/40 py-6">
            <Code size={132} value={JOIN_URL} pad="p-3" />
          </div>
          <div className="space-y-1 p-4">
            <p className="text-sm font-medium">{EVENT.name}</p>
            <p className="text-sm text-muted-foreground">
              {EVENT.dateLabel} · no photos yet
            </p>
            <p className="pt-1 text-sm text-brand">Your code is ready</p>
          </div>
        </div>
        <div className="flex min-h-40 items-center justify-center rounded-xl border border-dashed border-border p-4 text-center text-sm text-muted-foreground">
          Room for the next one.
        </div>
      </div>
    </div>
  );
}

export function LandingScreen({
  landing,
  venue,
  empty,
  first,
  size,
}: {
  landing: Landing;
  venue: Venue;
  empty: Empty;
  first: First;
  size: Size;
}) {
  if (landing === "beat") return <LandingBeat venue={venue} size={size} />;
  if (landing === "home") return <LandingHome size={size} />;
  return <LandingPage empty={empty} first={first} size={size} />;
}

/* ── The host at the venue, with only a phone ────────────────────────────── */

/**
 * TODAY: open the event, press Share, and read a 200 px code out of a dialog on
 * a 375 px screen, at whatever brightness the phone happened to be at, with a
 * title, a description, a download menu and a manage link around it.
 */
function HandSame() {
  return (
    <div className="flex min-h-full items-end bg-foreground/40 p-4">
      <div className="w-full space-y-4 rounded-xl border border-border bg-background p-6">
        <div className="space-y-1">
          <p className="font-heading text-subsection">Share {EVENT.name}</p>
          <p className="text-sm text-muted-foreground">
            Guests scan the code or open the link to join your event.
          </p>
        </div>
        <div className="flex flex-col items-center gap-4">
          <Code size={200} value={JOIN_URL} />
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <ExternalLink /> Open
            </Button>
            <Button variant="outline" size="sm">
              <Download /> Download
            </Button>
          </div>
        </div>
        <LinkField url={JOIN_URL} />
        <Button variant="ghost" size="sm" className="text-muted-foreground">
          Edit link and settings
        </Button>
      </div>
    </div>
  );
}

/**
 * THE CODE, AND NOTHING ELSE. One press from the event: white to the edges, the
 * screen forced to full brightness, the code as large as 375 px can carry it.
 * Everything a dialog spends on chrome goes into modules instead, which is the
 * only thing that decides whether this reads across a dark room.
 */
function HandShow() {
  return (
    <div className="flex min-h-full flex-col items-center justify-center gap-6 bg-white p-4">
      <Code size={343} value={JOIN_URL} pad="p-0" radius="rounded-none" />
      <div className="space-y-1 text-center text-neutral-900">
        <p className="font-heading text-lg">{EVENT.name}</p>
        <p className="text-sm text-neutral-500">Scan to add your photos.</p>
      </div>
      <p className="flex items-center gap-1.5 text-xs text-neutral-400">
        <Sun className="size-3.5" /> Brightness is at full. Tap anywhere to go
        back.
      </p>
    </div>
  );
}

/**
 * THE PHONE BECOMES THE TABLE CARD. The same artifact the sheet prints, on the
 * screen: a guest reads one thing whether they are looking at paper or at a
 * hand, and a phone propped against a glass says what it is with nobody
 * standing beside it. The code is smaller for it, and the caption says by how
 * much.
 */
function HandCard() {
  return (
    <div className="flex min-h-full items-center justify-center bg-neutral-100 p-4">
      <div className="w-full rounded-2xl bg-white px-6 py-8 text-center text-neutral-900 shadow-lift">
        <p className="font-heading text-2xl leading-tight text-balance">
          Add your photos
        </p>
        <p className="mt-1.5 text-xs text-neutral-500">
          Scan the code. No app, no account.
        </p>
        <span className="mt-5 block">
          <Code size={264} value={JOIN_URL} pad="p-0" radius="rounded-none" />
        </span>
        <p className="mt-5 font-heading text-base">{EVENT.name}</p>
        <p className="mt-1 text-[11px] tracking-wide text-neutral-500">
          {EVENT.dateLabel}
        </p>
      </div>
    </div>
  );
}

export function HandScreen({ hand }: { hand: Hand }) {
  if (hand === "same") return <HandSame />;
  if (hand === "card") return <HandCard />;
  return <HandShow />;
}

/* ── The stock, and the small parts ──────────────────────────────────────── */

/** One piece of paper on the desk, at its real proportion, with its spec. */
function Stock({
  label,
  spec,
  w,
  ratio,
  selected = false,
  children,
}: {
  label: string;
  spec: string;
  /** The preview's width in px; the height follows the paper's ratio. */
  w: number;
  ratio: number;
  selected?: boolean;
  children: ReactNode;
}) {
  return (
    <span className="block space-y-2">
      <span
        className={cn(
          "flex items-center justify-center overflow-hidden bg-white text-neutral-900 shadow-lift",
          selected ? "ring-2 ring-brand" : "ring-1 ring-black/10",
        )}
        style={{ width: w, height: Math.round(w * ratio) }}
      >
        {children}
      </span>
      <span className="block">
        <span className="block text-sm font-medium">{label}</span>
        <span className="block text-xs text-muted-foreground">{spec}</span>
      </span>
    </span>
  );
}

/** What is printed on a table card: the code, then what to do with it. */
function TableCard({ scale }: { scale: number }) {
  return (
    <span className="flex flex-col items-center px-3 text-center">
      <Code
        size={Math.round(112 * scale)}
        value={JOIN_URL}
        pad="p-0"
        radius="rounded-none"
        print
      />
      <span
        className="mt-2 block font-heading leading-tight"
        style={{ fontSize: Math.round(15 * scale) }}
      >
        Scan to add your photos
      </span>
      <span
        className="mt-1 block text-neutral-500"
        style={{ fontSize: Math.round(10 * scale) }}
      >
        {EVENT.name}
      </span>
    </span>
  );
}

/** What is printed on the welcome sign: the words first, then the code. */
function SignFace({ scale }: { scale: number }) {
  return (
    <span className="flex flex-col items-center px-3 text-center">
      <span
        className="block font-heading leading-tight"
        style={{ fontSize: Math.round(17 * scale) }}
      >
        Add your photos
      </span>
      <span
        className="mt-0.5 block text-neutral-500"
        style={{ fontSize: Math.round(10 * scale) }}
      >
        No app, no account.
      </span>
      <Code
        size={Math.round(112 * scale)}
        value={JOIN_URL}
        pad="p-0"
        radius="rounded-none"
        print
        className="mt-2"
      />
    </span>
  );
}

/** The shipped copy-link row, inert (a real Copy writes the reviewer's OS clipboard). */
function LinkField({ url, button }: { url: string; button?: string }) {
  return (
    <div className="flex gap-2">
      <span className="flex min-w-0 flex-1 items-center rounded-md border border-border px-3 py-2 text-xs text-muted-foreground">
        <span className="truncate">{url.replace("https://", "")}</span>
      </span>
      {button ? (
        <Button variant="outline" size="sm">
          {button}
        </Button>
      ) : (
        <Button variant="outline" size="icon" aria-hidden tabIndex={-1}>
          <Copy />
        </Button>
      )}
    </div>
  );
}
