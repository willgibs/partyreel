"use client";

import type { ReactNode } from "react";
import { Camera, Images, ImageUp, QrCode } from "lucide-react";

import { LegalConsentLine } from "@/components/shared/legal-consent-line";
import { Button } from "@/components/ui/button";
import { marketingImage } from "@/lib/constants/marketing-media";
import { cn, formatEventDate } from "@/lib/utils";

import {
  DEMO,
  PARTIES,
  type Party,
  type PartyId,
} from "./fixtures";
import type { ScreenId } from "./page-parts";

/**
 * THE FIRST SECONDS OF THE DEMO.
 *
 * ★ THE DEMO IS THE ONE VISITOR WITH NO DOOR. `computeEntry` returns
 * `{ steps: [], autoOpen: false }` for `isOwner || isDemo`, so the welcome,
 * the byline, the count proof and the legal line are all skipped and the
 * visitor is dropped on the album. The reasoning is sound for an OWNER, who
 * wrote the event; it was inherited by the demo, whose visitor is the one
 * person on the whole site who has never seen any of it. `entry-modal.test.tsx`
 * pins that behaviour ("owner and demo never see the surface"), which makes
 * two of the three options below a change to a pinned behaviour rather than a
 * change to a look: the manifest carries it as a finding, not a wall.
 *
 * ★ THE SHELL IS QUOTED, AND THAT IS THE LANE'S ONE DEPARTURE.
 * `entry-shell.tsx` is a real Vaul drawer, and a drawer portals to
 * `document.body`, which inside a lab frame is the BOARD's body: the sheet
 * would leave the picture entirely (the landmine `guest-shape`, `admin` and
 * `glass` all hit). Its material, corner, padding and overlay are reproduced
 * in demo-event.css from the shipped classNames, and nothing that carries a
 * rule is re-decided here. `useMediaQuery` has the same problem for the same
 * reason (it reads the lab page's width, not the frame's), so which shell a
 * width gets is set by the frame's own screen: a drawer below 640, the centred
 * dialog above it.
 *
 * ★ THE WELCOME'S WORDS ARE QUOTED TOO, because `WelcomeStep` is module-local
 * to entry-modal.tsx and is not exported. Every string in `Welcome` below is
 * its own, including the two promises and the count line's grammar.
 */

export type ArrivalShape = "album" | "welcome" | "role";

export const arrivalOf = (v: string | undefined): ArrivalShape =>
  v === "welcome" ? "welcome" : v === "role" ? "role" : "album";

/* ── the shell ───────────────────────────────────────────────────────────── */

/**
 * The entry shell, quoted: a drawer at the foot on a phone, the centred dialog
 * from 640 up. `tall` is the ratified 55svh presence the welcome step alone
 * wears inside the drawer ([data-entry-drawer] [data-welcome-step]).
 */
export function Shell({
  screen,
  tall,
  wide,
  children,
}: {
  screen: ScreenId;
  tall?: boolean;
  /** The three-party door needs more than the dialog's 24rem. */
  wide?: boolean;
  children: ReactNode;
}) {
  if (screen === "1440")
    return (
      <div data-de-arrival className={cn("de-dialog", wide && "de-dialog-wide")}>
        {children}
      </div>
    );
  return (
    <div data-de-arrival className="de-sheet" style={tall ? { minHeight: "55%" } : undefined}>
      <div className="flex min-h-0 flex-1 flex-col">{children}</div>
    </div>
  );
}

/* ── the guest's own welcome, quoted ─────────────────────────────────────── */

function Welcome({ party }: { party: Party }) {
  const count = party.items.length;
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-5 pt-1">
      <div className="flex flex-col">
        <p className="text-xs font-medium tracking-[0.14em] text-muted-foreground uppercase">
          You&rsquo;re invited to
        </p>
        <p className="mt-1.5 font-heading text-page text-balance">
          {party.name}
        </p>
        <p className="mt-2 flex items-center gap-1.5 text-[13px] text-muted-foreground">
          <span>
            Hosted by{" "}
            <span className="font-medium text-foreground">{party.host}</span>
          </span>
          <span aria-hidden className="text-faint">
            ·
          </span>
          <span>{formatEventDate(party.date)}</span>
        </p>
      </div>
      <div className="flex flex-col gap-3.5">
        <p className="flex items-start gap-3 text-base leading-relaxed">
          <Camera className="mt-0.5 size-4.5 shrink-0 text-muted-foreground" />
          Add your photos and videos in seconds. No app, no account.
        </p>
        <p className="flex items-start gap-3 text-base leading-relaxed">
          <Images className="mt-0.5 size-4.5 shrink-0 text-muted-foreground" />
          Everyone&rsquo;s shots land in one album. {count} are already inside.
        </p>
      </div>
      <div className="mt-auto flex flex-col gap-1">
        <Button size="lg" className="w-full text-[15px]">
          View the album
        </Button>
        <LegalConsentLine newTab className="mt-2 text-center" />
      </div>
    </div>
  );
}

/* ── the demo's own arrival ──────────────────────────────────────────────── */

/**
 * THE ROLE. Three things a visitor needs and today gets none of: what this is
 * (a real album, standing in for theirs), where they are standing (in a
 * guest's shoes, at somebody's wedding), and the one thing to do about it.
 *
 * The two rows deliberately MIRROR the guest welcome's two promises rather
 * than inventing a second voice: the same icons, the same measure, the same
 * order, said to a host instead of a guest. Bible 4 still holds behind it: the
 * page under this sheet is the host's event, and this surface is the only
 * place on it that speaks as Partyreel.
 */
function Role({ party }: { party: Party }) {
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-5 pt-1">
      <div className="flex flex-col">
        <p className="text-xs font-medium tracking-[0.14em] text-muted-foreground uppercase">
          A live demo
        </p>
        <p className="mt-1.5 font-heading text-page text-balance">
          You&rsquo;re a guest at {party.name}
        </p>
        <p className="mt-2 text-[13px] text-muted-foreground">
          This is a real album, exactly as {party.host}&rsquo;s guests see it.
        </p>
      </div>
      <div className="flex flex-col gap-3.5">
        <p className="flex items-start gap-3 text-base leading-relaxed">
          <ImageUp className="mt-0.5 size-4.5 shrink-0 text-muted-foreground" />
          Add a photo the way a guest would. Nothing you add is saved.
        </p>
        <p className="flex items-start gap-3 text-base leading-relaxed">
          <QrCode className="mt-0.5 size-4.5 shrink-0 text-muted-foreground" />
          One code did all of this. Yours takes about a minute.
        </p>
      </div>
      <div className="mt-auto flex flex-col gap-2">
        <Button size="lg" className="w-full text-[15px]">
          Look around
        </Button>
        <Button variant="ghost" className="w-full text-muted-foreground">
          Start your own
        </Button>
      </div>
    </div>
  );
}

/* ── the three-party door ────────────────────────────────────────────────── */

const ORDER: PartyId[] = ["wedding", "birthday", "office"];

/**
 * The `pick` option of `event`: three parties on the arrival, chosen before
 * the album opens. Each card carries its party's own cover, its name and its
 * size, which is also what makes the cost of this answer visible: three
 * curated albums to shoot, not one.
 */
export function PartyDoor({
  chosen,
  screen,
}: {
  chosen: PartyId;
  screen: ScreenId;
}) {
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-5 pt-1">
      <div className="flex flex-col">
        <p className="text-xs font-medium tracking-[0.14em] text-muted-foreground uppercase">
          A live demo
        </p>
        <p className="mt-1.5 font-heading text-page text-balance">
          Pick a party to look around
        </p>
        <p className="mt-2 text-[13px] text-muted-foreground">
          Three real albums. Open the one closest to yours.
        </p>
      </div>
      <div
        className={cn(
          "grid gap-2.5",
          screen === "1440" ? "grid-cols-3" : "grid-cols-1",
        )}
      >
        {ORDER.map((id) => {
          const p = PARTIES[id];
          return (
            <div
              key={id}
              data-de-party
              className={cn(
                "flex items-center gap-3 overflow-hidden rounded-xl border p-2.5 text-left",
                screen === "1440" && "flex-col items-stretch gap-2.5 p-2.5",
                id === chosen ? "border-foreground/40" : "border-border",
              )}
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- a local
                  marketing still, sized by the box; next/image inside a lab
                  frame adds a loader for pixels the fixture already holds. */}
              <img
                src={marketingImage(p.cover).src}
                alt=""
                className={cn(
                  "shrink-0 rounded-[var(--radius-tile)] object-cover",
                  screen === "1440" ? "h-20 w-full" : "size-14",
                )}
              />
              <div className="min-w-0">
                <p className="truncate text-[15px] font-medium">{p.name}</p>
                <p className="mt-0.5 text-[13px] text-muted-foreground">
                  {p.items.length} photos, {p.guests} guests
                </p>
              </div>
            </div>
          );
        })}
      </div>
      {/* ★ NO CONSENT LINE HERE, unlike the guest welcome this shell is
          borrowed from. A guest passing the real door is joining an event; a
          visitor choosing which demo to look at is agreeing to nothing, and a
          Terms line under three party cards reads as a dark pattern. */}
    </div>
  );
}

/**
 * The `switch` option of `event`: no door at all, a control over the album
 * that re-fills it in place. It keeps the album's own left line, which is what
 * makes it cheaper to build than a door and quieter than one.
 */
export function PartySwitch({ chosen }: { chosen: PartyId }) {
  return (
    <div data-de-switch className="mb-4 flex flex-wrap items-center gap-2">
      <span className="text-xs text-faint">Looking at</span>
      {ORDER.map((id) => (
        <span
          key={id}
          className={cn(
            "rounded-full border px-3 py-1 text-[13px]",
            id === chosen
              ? "border-foreground/40 bg-muted font-medium text-foreground"
              : "border-border text-muted-foreground",
          )}
        >
          {PARTIES[id].name}
        </span>
      ))}
    </div>
  );
}

/* ── the arrival, in one of three shapes ─────────────────────────────────── */

export function Arrival({
  shape,
  screen,
  party = DEMO,
}: {
  shape: ArrivalShape;
  screen: ScreenId;
  party?: Party;
}) {
  if (shape === "album") return null;
  if (shape === "welcome")
    return (
      <Shell screen={screen} tall>
        <Welcome party={party} />
      </Shell>
    );
  return (
    <Shell screen={screen} tall>
      <Role party={party} />
    </Shell>
  );
}
