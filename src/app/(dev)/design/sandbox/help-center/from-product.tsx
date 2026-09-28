"use client";

import {
  Check,
  ChevronLeft,
  Clock,
  Flag,
  ImageIcon,
  LifeBuoy,
  LogIn,
  Pencil,
  RefreshCw,
  XCircle,
  XIcon,
} from "lucide-react";
import Image from "next/image";
import type { ReactNode } from "react";

import { DoorLamp } from "@/components/guest/door/lit";
import { KEEP_TITLE } from "@/components/guest/save-account-prompt";
import { Logo } from "@/components/shared/logo";
import { UNVERIFIED_LABEL } from "@/components/shared/unverified-mark";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { floatingPanel, floatingRow } from "@/components/ui/floating-layer";
import { marketingImage } from "@/lib/constants/marketing-media";
import { TRACKER_WORDS } from "@/lib/guest/upload-tracker";
import { cn } from "@/lib/utils";

import { stopLinks } from "./vocab";

/**
 * DECISION 4: FROM THE PRODUCT, on the three guest surfaces a help link could
 * live on, each quoted from the file it ships in and drawn at the tile's own
 * width (a desk's panels at 1440, a hand's sheet and screen at 375):
 *
 *  - HER MENU (`guest-name-menu.tsx`): her name over "Unverified", the card
 *    "Keep this event" with Add your email, Change name, Log in.
 *    Report is not in the header: it sits at the album's foot
 *    (`event-experience.tsx`), drawn under the menu's crop.
 *  - THE FAILURE SHEET (`failure-sheet.tsx`), wearing voice-guest's
 *    `failed=exact` words ("2 of 8 didn't upload", Retry both), his pick and
 *    not yet wired, because that is the sheet a link would ship on.
 *  - HER UPLOADS (`upload-tracker.tsx`), a refused photo's row in its shipped
 *    words (`TRACKER_WORDS`: "Not approved", voice-guest r2's `status`).
 *
 * `menu` and `contextual` add only their links, marked in the tile's foot as
 * proposals. Nothing here mounts a Radix portal (the real menu, sheet and
 * list would open over the whole board rather than inside this tile), so
 * each surface is its markup, classes quoted, and inert.
 */
export type ProductShape = "none" | "menu" | "contextual";

const NAME = "Maya";

/** A link on a proposal: the product's own quiet underline. */
function HelpLink({ children }: { children: ReactNode }) {
  return (
    <a
      href="#"
      className="font-medium text-foreground underline decoration-border underline-offset-4 transition-colors duration-150 hover:decoration-foreground"
    >
      {children}
    </a>
  );
}

/** A caption over each surface, so a reader knows which of the three it is. */
function Label({ children }: { children: ReactNode }) {
  return (
    <p className="mb-3 px-4 text-xs font-medium text-muted-foreground sm:px-0">
      {children}
    </p>
  );
}

/* ── Her menu, over the album's head; the album's foot under it ───────────── */

function MenuRow({
  icon,
  children,
  proposed = false,
}: {
  icon: ReactNode;
  children: ReactNode;
  proposed?: boolean;
}) {
  return (
    <div
      className={cn(
        "relative flex cursor-default items-center gap-2 px-2 py-1.5 text-sm select-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 [&>svg:first-child]:text-muted-foreground",
        floatingRow,
        proposed && "bg-accent text-accent-foreground",
      )}
    >
      {icon}
      {children}
    </div>
  );
}

function HerMenu({ help }: { help: boolean }) {
  const strip = ["wedding-golden", "reception-table", "party-balloons"].map(
    (id) => marketingImage(id),
  );
  return (
    <div className="relative">
      <header className="flex items-center justify-between gap-2 border-b border-border/60 px-5 py-3">
        <Logo />
        <div className="flex h-8 items-center">
          <span className="flex items-center gap-2 rounded-full">
            <Avatar size="sm">
              <AvatarFallback className="text-[10px]">
                {NAME.slice(0, 1)}
              </AvatarFallback>
            </Avatar>
            <span className="max-w-28 truncate text-sm">{NAME}</span>
          </span>
        </div>
      </header>
      {/* The album's head, cropped: what the open menu hangs over. */}
      <div className="grid grid-cols-3 gap-[var(--gap-gallery)] px-3 pt-4 opacity-60 sm:px-5">
        {strip.map((img) => (
          <span
            key={img.id}
            className="relative block aspect-[4/5] overflow-hidden rounded-tile bg-muted"
          >
            <Image
              src={img.src}
              alt=""
              fill
              sizes="160px"
              className="object-cover"
            />
          </span>
        ))}
      </div>
      {/* DropdownMenuContent (align end, w-60) and its rows, classes quoted. */}
      <div
        className={cn(
          "absolute top-[3.25rem] right-5 z-10 w-60 min-w-32 overflow-hidden p-1",
          floatingPanel,
        )}
      >
        <div className="flex flex-col gap-0.5 px-2 pt-0.5 pb-1 text-xs text-foreground">
          <span className="truncate text-sm leading-tight font-medium">
            {NAME}
          </span>
          <span className="truncate text-xs leading-tight font-normal text-muted-foreground">
            {UNVERIFIED_LABEL}
          </span>
        </div>
        <div className="relative isolate m-1 overflow-hidden rounded-md bg-muted/60 p-3">
          <DoorLamp edge="card" />
          <p className="text-reading text-pretty text-foreground">
            {KEEP_TITLE}
          </p>
          <div
            className={cn(
              "mt-2 flex h-8 items-center justify-center bg-primary px-2 text-sm font-medium text-primary-foreground",
              floatingRow,
            )}
          >
            Add your email
          </div>
        </div>
        <MenuRow icon={<Pencil />}>Change name</MenuRow>
        <div className="-mx-1 my-1 h-px bg-border" />
        <MenuRow icon={<LogIn />}>Log in</MenuRow>
        {help && (
          <MenuRow icon={<LifeBuoy />} proposed>
            Help center
          </MenuRow>
        )}
      </div>
      {/* The album between, elided; then its foot, where Report lives. */}
      <p className="px-5 pt-40 text-center text-xs text-faint">&hellip;</p>
      <footer className="mx-3 mt-8 flex justify-center border-t border-border/60 pt-5 pb-2 sm:mx-5">
        <Button
          variant="ghost"
          size="sm"
          className="text-muted-foreground hover:bg-muted hover:text-foreground"
          tabIndex={-1}
        >
          <Flag /> Report
        </Button>
      </footer>
    </div>
  );
}

/* ── The failure sheet, in the words he picked ────────────────────────────── */

const FAILED = [
  { name: "IMG_4821.jpg", image: "wedding-toast" },
  { name: "IMG_4826.jpg", image: "concert-confetti" },
] as const;

function FailureSheet({
  mode,
  help,
}: {
  mode: "desktop" | "phone";
  help: boolean;
}) {
  return (
    <div
      className={cn(
        "relative flex flex-col gap-4 bg-popover text-sm text-popover-foreground shadow-layer",
        mode === "phone"
          ? "rounded-t-float border-t"
          : "min-h-[31rem] border-l",
      )}
    >
      <span className="absolute top-3 right-3 flex size-7 items-center justify-center rounded-md text-muted-foreground">
        <XIcon className="size-4" />
      </span>
      <div className="flex flex-col gap-0.5 p-4">
        <p className="font-heading text-card-title font-medium text-foreground">
          2 of 8 didn&rsquo;t upload
        </p>
        <p className="text-sm text-muted-foreground">
          The other 6 are in the album.
        </p>
      </div>
      <div className="px-4">
        <div className="flex flex-col gap-4">
          <Button type="button" size="cta" className="w-full" tabIndex={-1}>
            <RefreshCw /> Retry both
          </Button>
          <ul className="flex flex-col gap-3">
            {FAILED.map((f) => (
              <li key={f.name} className="flex items-center gap-3">
                <span className="relative block size-11 shrink-0 overflow-hidden rounded-tile bg-muted">
                  <Image
                    src={marketingImage(f.image).src}
                    alt=""
                    fill
                    sizes="44px"
                    className="object-cover"
                  />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-reading font-medium">
                    {f.name}
                  </span>
                  <span className="block text-reading text-pretty text-muted-foreground">
                    That upload did not finish.
                  </span>
                </span>
                <Button
                  type="button"
                  variant="outline"
                  size="lg"
                  className="shrink-0"
                  tabIndex={-1}
                >
                  <RefreshCw /> Retry
                </Button>
              </li>
            ))}
          </ul>
          {help && (
            <p className="text-reading text-muted-foreground">
              Still not going? <HelpLink>What stops an upload</HelpLink>
            </p>
          )}
        </div>
      </div>
      <div className="mt-auto flex flex-col gap-2 p-4">
        <Button
          type="button"
          variant="ghost"
          size="lg"
          className="w-full"
          tabIndex={-1}
        >
          Not now
        </Button>
      </div>
    </div>
  );
}

/* ── Her uploads, with one photo the host did not add ─────────────────────── */

const ROWS = [
  {
    status: "approved",
    image: "party-balloons",
    Icon: Check,
    tone: "text-success",
  },
  {
    status: "waiting",
    image: "wedding-golden",
    Icon: Clock,
    tone: "text-warning",
  },
  {
    status: "refused",
    image: null,
    Icon: XCircle,
    tone: "text-muted-foreground",
  },
  {
    status: "approved",
    image: "reception-hall",
    Icon: Check,
    tone: "text-success",
  },
] as const;

function HerUploads({
  mode,
  help,
}: {
  mode: "desktop" | "phone";
  help: boolean;
}) {
  return (
    <div
      className={cn(
        "flex flex-col text-sm",
        mode === "phone"
          ? "border-y bg-background"
          : "min-h-[31rem] border-l bg-popover text-popover-foreground shadow-layer",
      )}
    >
      {mode === "phone" ? (
        <div className="shrink-0 border-b">
          <div className="grid h-13 grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2 px-2">
            <span className="inline-flex items-center gap-0.5 justify-self-start px-1.5 text-sm font-medium text-muted-foreground">
              <ChevronLeft className="size-5" />
              Album
            </span>
            <p className="truncate text-center font-heading text-base font-medium text-foreground">
              Your uploads
            </p>
            <span aria-hidden />
          </div>
          <p className="px-4 pb-3 text-sm text-pretty text-muted-foreground">
            The host reviews uploads before they appear in the album.
          </p>
        </div>
      ) : (
        <div className="relative flex shrink-0 flex-col gap-1 p-4 pr-12">
          <span className="absolute top-3 right-3 flex size-7 items-center justify-center rounded-md text-muted-foreground">
            <XIcon className="size-4" />
          </span>
          <p className="font-heading text-card-title font-medium text-pretty text-foreground">
            Your uploads
          </p>
          <p className="text-sm text-pretty text-muted-foreground">
            The host reviews uploads before they appear in the album.
          </p>
        </div>
      )}
      <div className={cn("px-4 pb-4", mode === "phone" && "pt-4")}>
        <ul className="divide-y divide-border/60 pb-2">
          {ROWS.map((row, i) => (
            <li key={i} className="flex items-center gap-3 py-2.5">
              <div className="relative flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-tile bg-muted">
                {row.image ? (
                  <Image
                    src={marketingImage(row.image).src}
                    alt=""
                    fill
                    sizes="44px"
                    className="object-cover"
                  />
                ) : (
                  // Nothing outside the album is presigned for a guest, so a refused photo has no picture.
                  <ImageIcon
                    className="size-4 text-muted-foreground/60"
                    aria-hidden
                  />
                )}
              </div>
              <p
                className={cn(
                  "flex min-w-0 flex-1 items-center gap-1.5 text-sm",
                  row.tone,
                )}
              >
                <row.Icon className="size-4 shrink-0" aria-hidden />
                <span className="truncate text-foreground">
                  {TRACKER_WORDS[row.status]}
                </span>
                {help && row.status === "refused" && (
                  <span className="ml-auto shrink-0 pl-2 text-muted-foreground">
                    <HelpLink>Why?</HelpLink>
                  </span>
                )}
              </p>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

const FOOT: Record<ProductShape, string> = {
  none: "As shipped: no guest surface links to help. The sheet wears his failed=exact words, picked and not yet wired.",
  menu: "Proposed: the Help center row; every other row is her menu as shipped.",
  contextual:
    "Proposed: the two links, to “An upload won't finish” and “A photo is missing from the album”; the rest as shipped.",
};

export function FromProductPreview({
  shape,
  mode,
}: {
  shape: ProductShape;
  mode: "desktop" | "phone";
}) {
  const desk = mode === "desktop";
  // In a hand every surface runs the phone's full width, as it does on the album.
  return (
    <div
      onClickCapture={stopLinks}
      className={cn("bg-background text-foreground", desk ? "p-6" : "py-6")}
    >
      <div
        className={cn(
          "grid gap-8",
          desk ? "grid-cols-3 items-start" : "grid-cols-1",
        )}
      >
        <div>
          <Label>Her menu, and the album&rsquo;s foot</Label>
          <div
            className={cn(
              "overflow-hidden",
              desk ? "rounded-xl border" : "border-y",
            )}
          >
            <HerMenu help={shape === "menu"} />
          </div>
        </div>
        <div>
          <Label>When 2 of her 8 do not go</Label>
          <FailureSheet mode={mode} help={shape === "contextual"} />
        </div>
        <div>
          <Label>Her uploads</Label>
          <HerUploads mode={mode} help={shape === "contextual"} />
        </div>
      </div>
      <p className="mt-6 px-4 text-xs text-muted-foreground sm:px-0">
        {FOOT[shape]}
      </p>
    </div>
  );
}
