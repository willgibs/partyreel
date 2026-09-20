"use client";

import { Check, Clock, Lock } from "lucide-react";

import { EnterEventPrompt } from "@/components/guest/enter-event-prompt";
import { GuestMasonry } from "@/components/guest/guest-masonry";
import { MediaTile } from "@/components/app/media-grid";
import { cn } from "@/lib/utils";

import { ALBUM, JUST_ADDED } from "./fixtures";
import {
  AllowanceStrip,
  EventBlock,
  GUTTER,
  Page,
  type ScreenId,
} from "./page-parts";

/**
 * `gate` — WHEN THE ADDRESS GETS PROVEN, drawn as the one frame that actually
 * differs between the three answers: the guest's screen ONE SECOND AFTER they
 * pressed Add.
 *
 * ★ THE DOOR IS NOT THE QUESTION, AND DRAWING IT THREE TIMES WOULD HIDE THAT.
 * All three answers use the same door, the same field and the same code (the
 * shipped `EnterEventPrompt`, imported whole, with `AccountDoor` inside it —
 * his ruled gate sentence and all). What moves is what has happened to the
 * PHOTOGRAPH by the time the guest looks up: nothing (`before`), it is in the
 * album where everyone can see it (`after`), or it is in but held until the
 * code lands (`held`). So `before` draws the real door over a dimmed album,
 * and the other two draw the album with that one tile in it, wearing its state.
 *
 * ★ `held` INVENTS NO STATUS. `media.status` already has `pending`, the host's
 * review queue already renders it, and moderation-off events already
 * auto-approve. A held upload is a `pending` row whose release condition is a
 * confirmed address instead of a host's tap — which is why this option needs a
 * column on `guests` and nothing on `media` at all.
 */

export type GateShape = "before" | "after" | "held";

export const gateOf = (v: string | undefined): GateShape =>
  v === "after" ? "after" : v === "held" ? "held" : "before";

/* ── the slim bar the two unblocked answers carry ────────────────────────── */

/** What a guest who has uploaded but not confirmed sees at the top of the
 *  album: the ask, without a wall behind it. */
function ConfirmBar({ held }: { held: boolean }) {
  return (
    <div
      data-gv-confirm-bar
      className="flex items-start gap-2.5 border-b border-warning/25 bg-warning/10 px-5 py-2.5"
    >
      <Clock className="mt-0.5 size-3.5 shrink-0 text-warning" aria-hidden />
      <div className="min-w-0">
        <p className="text-[13px] leading-snug font-medium">
          {held
            ? "Tap the code we sent you and your photo goes up"
            : "Tap the code we sent you to keep your photo here"}
        </p>
        <p className="mt-0.5 text-[11px] text-muted-foreground">
          Sent to maya.guest@example.com · Resend in 47s
        </p>
      </div>
    </div>
  );
}

/* ── the one tile the guest just added ───────────────────────────────────── */

function MyTile({ held }: { held: boolean }) {
  return (
    <div
      data-gv-mine
      data-gv-held={held ? "" : undefined}
      className="relative mb-1 overflow-hidden rounded-[var(--radius-tile)]"
    >
      <div className={cn(held && "opacity-40 grayscale")}>
        <MediaTile item={JUST_ADDED} />
      </div>
      <span
        className={cn(
          "absolute inset-x-1 bottom-1 flex items-center justify-center gap-1 rounded-full px-2 py-1 text-[10px] font-medium",
          held
            ? "bg-background/95 text-warning"
            : "bg-background/90 text-muted-foreground",
        )}
      >
        {held ? (
          <>
            <Clock className="size-2.5" aria-hidden /> Waiting for your email
          </>
        ) : (
          <>
            <Check className="size-2.5 text-success" aria-hidden /> Added ·
            unconfirmed
          </>
        )}
      </span>
    </div>
  );
}

/* ── the three screens ───────────────────────────────────────────────────── */

/** `before`: the shipped door, over the album it is standing in front of. */
function BeforeScreen() {
  return (
    <div className="relative h-screen overflow-hidden bg-background text-foreground">
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className={cn("pt-4 pb-3", GUTTER)}>
          <EventBlock count={ALBUM.length} />
        </div>
        <div className={GUTTER}>
          <GuestMasonry items={ALBUM.slice(0, 9)} />
        </div>
      </div>
      <div
        aria-hidden
        className="absolute inset-0 bg-background/80 backdrop-blur-[2px]"
      />
      <div className="absolute inset-x-0 bottom-0">
        <div
          data-gv-door
          className="rounded-t-2xl border-t border-border bg-background px-5 pt-5 pb-6 shadow-[0_-12px_40px_-24px_rgb(0_0_0/0.45)]"
        >
          <EnterEventPrompt qrToken="gv-demo" mediaTotal={ALBUM.length} />
        </div>
      </div>
      <p
        data-gv-blocked
        className="absolute inset-x-5 top-4 flex items-center justify-center gap-1.5 rounded-full bg-foreground/85 px-3 py-1.5 text-[11px] font-medium text-background"
      >
        <Lock className="size-3" aria-hidden />
        Your photo is not uploaded yet
      </p>
    </div>
  );
}

/** `after` and `held`: the album, the bar, and the guest's own tile in it. */
function InScreen({ held }: { held: boolean }) {
  return (
    <Page>
      <ConfirmBar held={held} />
      <div className={cn("pt-4 pb-3", GUTTER)}>
        <EventBlock count={ALBUM.length + (held ? 0 : 1)} />
      </div>
      <div className={GUTTER}>
        <GuestMasonry items={ALBUM} prefix={<MyTile held={held} />} />
      </div>
      <div className={cn("pt-3 pb-6", GUTTER)}>
        <AllowanceStrip />
      </div>
    </Page>
  );
}

export function GateScreen({
  shape,
  screen,
}: {
  shape: GateShape;
  screen: ScreenId;
}) {
  // The gate is a phone question at both widths: a 1440 window draws the same
  // page in the same column the shipped album keeps, so what changes between
  // the two screens is how much album is behind the answer, never the answer.
  const wide = screen === "1440";
  const body =
    shape === "before" ? (
      <BeforeScreen />
    ) : (
      <InScreen held={shape === "held"} />
    );
  if (!wide) return body;
  return (
    <div className="h-screen bg-background">
      <div className="mx-auto h-full max-w-2xl border-x border-border/60">
        {body}
      </div>
    </div>
  );
}
