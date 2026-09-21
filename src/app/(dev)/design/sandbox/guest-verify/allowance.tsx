"use client";

import { Check, Images, Sliders, TriangleAlert } from "lucide-react";

import { MediaTile } from "@/components/app/media-grid";
import { Button } from "@/components/ui/button";
import { GALLERY_UNIFORM_COLUMNS } from "@/components/shared/masonry";
import { cn } from "@/lib/utils";

import { ALBUM, ALLOWANCE, METER } from "./fixtures";
import {
  AllowanceLine,
  FrameNote,
  MeterStrip,
  Pane,
  type ScreenId,
} from "./page-parts";

/**
 * `allowance` -- WHAT AN UNPROVEN SESSION MAY ADD, and it is the decision that
 * replaces the safety the gate used to provide.
 *
 * ★ THE FACT THAT MAKES THIS A DECISION AT ALL, and it is invisible in the
 * product: `storage_ledger.cumulative_bytes` counts bytes UPLOADED and never
 * decrements (`tiers.ts`). Deleting a photograph frees the storage cap and
 * never the month. So every upload spends the host's month for good, the
 * account requirement was the only per-person cost standing at a public QR
 * code, and `abuse_rate_limit.sql` does not cover this: its signal is one
 * address touching MANY events, with a deliberately high per-event ceiling,
 * because a venue is exactly one event and a party is heavy traffic on purpose.
 *
 * ★ SO THE MEASUREMENT ON EVERY FRAME IS THE HOST'S MONTH, not a count of
 * tiles. Three arithmetics, all at 4 MB a photograph, which is an ESTIMATE and
 * is labelled one: a room of 120 at the handful is 4.8 GB of a Free host's
 * 20 GB; an event budget of 500 is 2 GB and the host can see and move it; open
 * is a script with a public link spending all 20 GB in an afternoon.
 */

export type AllowanceShape = "handful" | "budget" | "open";

export const allowanceOf = (v: string | undefined): AllowanceShape =>
  v === "budget" ? "budget" : v === "open" ? "open" : "handful";

/* -- the guest's side ----------------------------------------------------- */

/** What a guest meets, and on two of the three answers that is nothing at all. */
function GuestSide({ shape }: { shape: AllowanceShape }) {
  const tiles = ALBUM.slice(0, 6);
  return (
    <div className="flex h-full flex-col gap-2.5 p-3">
      <div className={GALLERY_UNIFORM_COLUMNS}>
        {tiles.map((t) => (
          <div
            key={t.id}
            className="relative w-full overflow-hidden bg-black/10"
            style={{
              aspectRatio: "4 / 5",
              borderRadius: "var(--radius-tile)",
            }}
          >
            <MediaTile item={t} playBadge="none" />
          </div>
        ))}
      </div>
      {shape === "open" ? (
        <p
          data-gv-guest-stop="never"
          className="rounded-lg bg-muted/50 px-3 py-2 text-[11px] leading-snug text-muted-foreground"
        >
          Nothing is ever said, because nothing ever stops. A guest who proves
          nothing has exactly the reach of one who proves everything.
        </p>
      ) : (
        <div
          data-gv-guest-stop={shape}
          className="space-y-2 rounded-lg border border-border bg-muted/30 px-3 py-2.5"
        >
          <p className="flex items-center gap-1.5 text-[12px] font-medium">
            <Images className="size-3.5 shrink-0" aria-hidden />
            {shape === "handful"
              ? `That is ${ALLOWANCE.handful}. One tap and keep going.`
              : "Maya's album is full for tonight, unless you confirm."}
          </p>
          <p className="text-[11px] leading-snug text-muted-foreground">
            {shape === "handful"
              ? "Confirm your email and there is no limit, on this phone or any other. Everything you have already added stays exactly where it is."
              : `Guests here have added ${ALLOWANCE.budget} photos without confirming. Confirm yours and it does not count against that.`}
          </p>
          <Button size="sm" className="w-full">
            Confirm and keep adding
          </Button>
          <p className="flex items-center gap-1 text-[10px] text-muted-foreground">
            <Check className="size-2.5 shrink-0 text-success" aria-hidden />
            {shape === "handful"
              ? "Nothing you added is at risk, and the ask arrives after ten photographs rather than before one."
              : "A guest who arrives late meets a wall somebody else built, and cannot see it coming."}
          </p>
        </div>
      )}
      <p className="mt-auto text-[10px] leading-snug text-muted-foreground">
        Video is never in an unproven allowance on any answer: it is the
        tier-gated upload and the expensive byte.
      </p>
    </div>
  );
}

/* -- the host's side ------------------------------------------------------ */

const HOST_MATH: Record<
  AllowanceShape,
  { spent: number; tone: "plain" | "warn" | "bad"; caption: string }
> = {
  handful: {
    spent: ALLOWANCE.roomAtHandfulGb,
    tone: "plain",
    caption: `A room of 120 who all stay unproven spends ${ALLOWANCE.roomAtHandfulGb} GB, at ${METER.photoMb} MB a photograph (an estimate). The bound is per person, so it scales with the guest list and not with the internet.`,
  },
  budget: {
    spent: 2,
    tone: "warn",
    caption: `${ALLOWANCE.budget} photographs is 2 GB, and Maya can see it and raise it mid-party. The bound is per EVENT, so the fiftieth guest can be stopped by the first.`,
  },
  open: {
    spent: METER.freeMonthlyGb,
    tone: "bad",
    caption: `${METER.photosToBurnFreeMonth.toLocaleString("en-GB")} photographs is the whole month. ${ALLOWANCE.openLine}`,
  },
};

/** The row the settings sheet grows on the one answer that needs a control. */
function BudgetRow() {
  return (
    <div className="space-y-1.5 rounded-lg border border-border px-3 py-2.5">
      <p className="flex items-center justify-between text-[12px] font-medium">
        <span className="flex items-center gap-1.5">
          <Sliders className="size-3.5 shrink-0" aria-hidden />
          Photos from guests who have not confirmed
        </span>
        <span className="text-muted-foreground">
          {ALLOWANCE.budget} of {ALLOWANCE.budget}
        </span>
      </p>
      <div className="h-1.5 overflow-hidden rounded-full bg-muted">
        <div className="h-full w-full rounded-full bg-warning" />
      </div>
      <p className="text-[10px] leading-snug text-muted-foreground">
        A control nobody finds before the party and everybody needs during it.
        Raising it is a tap; knowing to is the problem.
      </p>
      <Button size="sm" variant="secondary" className="w-full">
        Raise to 1,000
      </Button>
    </div>
  );
}

function HostSide({ shape }: { shape: AllowanceShape }) {
  const math = HOST_MATH[shape];
  return (
    <div className="flex h-full flex-col gap-2.5 p-3">
      {shape === "budget" ? (
        <BudgetRow />
      ) : (
        <div className="rounded-lg border border-border px-3 py-2.5">
          <p className="text-[12px] font-medium">
            {shape === "handful"
              ? "Nothing on the settings sheet"
              : "Nothing on the settings sheet, and nothing to reach for"}
          </p>
          <p className="mt-0.5 text-[10px] leading-snug text-muted-foreground">
            {shape === "handful"
              ? "The bound is a product rule, the same at every event, and a host never has to know it exists."
              : "When the month goes, the host finds out from the meter, after it is spent and cannot be given back."}
          </p>
        </div>
      )}
      <MeterStrip
        spentGb={math.spent}
        tone={math.tone}
        caption={math.caption}
      />
      {shape === "open" && (
        <p className="flex items-start gap-1.5 rounded-lg bg-destructive/10 px-3 py-2 text-[10px] leading-snug text-destructive">
          <TriangleAlert className="mt-px size-3 shrink-0" aria-hidden />
          The QR code is on a table in a public room. This is the only answer
          where the cost of a stranger is unbounded, and the host pays it.
        </p>
      )}
    </div>
  );
}

export function AllowanceScreen({
  shape,
  screen,
}: {
  shape: AllowanceShape;
  screen: ScreenId;
}) {
  const wide = screen === "1440";
  return (
    <div
      className={cn(
        "grid h-screen gap-3 bg-background p-3 text-foreground",
        wide ? "grid-cols-2 grid-rows-[1fr_auto]" : "grid-rows-[1.15fr_1fr_auto]",
      )}
    >
      <Pane label="The guest, at the edge of the allowance">
        <GuestSide shape={shape} />
      </Pane>
      <Pane
        label="The host's month, which never refunds"
        tone={shape === "open" ? "warn" : "host"}
      >
        <HostSide shape={shape} />
      </Pane>
      <div className={cn("space-y-2", wide && "col-span-2")}>
        <AllowanceLine shape={shape} />
        <FrameNote label="On every answer">
          The gate is gone either way: his `gate=after` ruling means a mail that
          never arrives can no longer stop an upload. This decides what stands in
          its place, and who pays when nothing does.
        </FrameNote>
      </div>
    </div>
  );
}
