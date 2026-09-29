"use client";

import { EyeOff, Globe, Lock, Pause } from "lucide-react";

import { StyledQr } from "@/components/app/styled-qr";
import { EventCodeDoor } from "@/components/app/share/event-code-door";
import { resolveQrPreset } from "@/lib/constants/qr-presets";
import { gateOf, stepOf, type Door } from "@/lib/event/door/door";
import { doorLabel, GATE_LABELS } from "@/lib/events/visibility-labels";
import { formatCount } from "@/lib/format/count";
import { cn } from "@/lib/utils";

import { THIRTIETH_URL } from "./fixtures";

/**
 * THE CODE BESIDE THE NAME, THREE WAYS.
 *
 * Today's is production's `EventCodeDoor` itself: a real code on a white mat
 * that dims under a Paused pill, and nothing else. The two candidates keep
 * its mat, its 112px code and its place, and add the door: a mark on the
 * mat's corner, or a line of words on the mat under the code.
 *
 * ★ NOTHING LANDS ON THE MODULES. A code scans by its modules and its quiet
 * zone (`module-floor.ts`), so the mark sits OUTSIDE the mat's edge and the
 * sign sits UNDER the code inside the mat's own padding; the code itself is
 * the same 112px it is today in every option. Only Me and paused dim it, as
 * paused already does, because a guest who scans either meets a door that
 * will not take a photo.
 *
 * ★ THE WORDS ARE THE DOOR'S OWN (`visibility-labels.ts`, the one home that
 * words the door everywhere): the step, the gate's short word, and "Only you"
 * in the host's voice for Only me.
 *
 * Drawn with pointer events off: pressing it opens the code card, a layer
 * that would land on the lab's page rather than the frame being judged.
 */

export type CodeVariant = "today" | "mark" | "sign";

export type DoorNow = {
  door: Door;
  acceptingUploads: boolean;
  waiting: number;
};

const CODE_PX = 112;

/**
 * The door in the host's words, on a sign 112px wide: the step for Public,
 * the gate's own short word under a lock for Private (the lock says Private),
 * "Only you" for Only me, and paused uploads over any of them.
 */
function doorWords(d: DoorNow): { main: string; detail: string | null } {
  if (stepOf(d.door) === "only_me") return { main: "Only you", detail: null };
  if (!d.acceptingUploads) return { main: "Uploads paused", detail: null };
  // The gate's short word is `doorLabel`'s own ("Private · You let in"): read, never retyped.
  const [step, gate] = doorLabel(d.door).split(" · ");
  return {
    main: gate ?? step ?? "Public",
    detail: d.waiting > 0 ? `${formatCount(d.waiting)} waiting` : null,
  };
}

/** Whether the code leads a guest to a door that takes no photo. */
const dimmed = (d: DoorNow) =>
  !d.acceptingUploads || stepOf(d.door) === "only_me";

function Mat({
  d,
  children,
  foot,
}: {
  d: DoorNow;
  children?: React.ReactNode;
  foot?: React.ReactNode;
}) {
  return (
    <span
      data-er-code=""
      className="pointer-events-none relative block shrink-0 rounded-lg bg-white p-2"
    >
      <span
        data-er-code-dim={dimmed(d) ? "" : undefined}
        className={cn("block", dimmed(d) && "opacity-25")}
      >
        <StyledQr
          value={THIRTIETH_URL}
          size={CODE_PX}
          style={resolveQrPreset("classic")}
        />
      </span>
      {foot}
      {children}
    </span>
  );
}

/** A mark on the mat's corner: a lock for a gate, a closed eye for Only me, the count when people wait. */
function CornerMark({ d }: { d: DoorNow }) {
  const gate = gateOf(d.door);
  const only = stepOf(d.door) === "only_me";
  const paused = !d.acceptingUploads;
  if (!gate && !only && !paused) return null;
  const Icon = only ? EyeOff : paused ? Pause : Lock;
  const label = only
    ? "Only you can open it"
    : paused
      ? "Uploads paused"
      : `Private: ${GATE_LABELS[gate!].toLowerCase()}${d.waiting ? `, ${d.waiting} waiting` : ""}`;
  const amber = d.waiting > 0 && !only;
  return (
    <span
      data-er-code-mark=""
      aria-label={label}
      title={label}
      className={cn(
        "absolute -top-2 -right-2 flex h-6 min-w-6 items-center justify-center gap-0.5 rounded-full px-1.5 ring-2 ring-background",
        amber
          ? "bg-warning text-warning-foreground"
          : "bg-neutral-900 text-white",
      )}
    >
      <Icon className="size-3.5" strokeWidth={2.25} aria-hidden />
      {amber ? (
        <span className="text-[11px] font-semibold tabular-nums">
          {d.waiting}
        </span>
      ) : null}
    </span>
  );
}

/** A line on the mat under the code: the door in words, and who waits at it. */
function SignLine({ d }: { d: DoorNow }) {
  const w = doorWords(d);
  const only = stepOf(d.door) === "only_me";
  const Icon = only
    ? EyeOff
    : !d.acceptingUploads
      ? Pause
      : gateOf(d.door)
        ? Lock
        : Globe;
  return (
    <span
      data-er-code-sign=""
      className="block w-[112px] pt-1.5 pb-0.5 text-center text-[11px] leading-tight text-neutral-900"
    >
      <span className="flex items-center justify-center gap-1 font-semibold">
        <Icon className="size-3 shrink-0" strokeWidth={2.5} aria-hidden />
        <span className="truncate">{w.main}</span>
      </span>
      {w.detail ? (
        d.waiting > 0 && d.acceptingUploads ? (
          // The needs-action tone, as a pill: the mat is white in both themes,
          // and amber type on white is too light to read at 11px.
          <span className="mt-1 inline-flex rounded-full bg-warning px-1.5 py-px font-semibold text-warning-foreground tabular-nums">
            {w.detail}
          </span>
        ) : (
          <span className="mt-0.5 block truncate text-neutral-600">
            {w.detail}
          </span>
        )
      ) : null}
    </span>
  );
}

/** The code at one door, in one option's way. */
export function CodeDoor({ variant, d }: { variant: CodeVariant; d: DoorNow }) {
  if (variant === "today") {
    return (
      <span data-er-code="" className="pointer-events-none contents">
        <EventCodeDoor
          eventName="Maya's 30th"
          joinUrl={THIRTIETH_URL}
          qrStyle="classic"
          acceptingUploads={d.acceptingUploads}
        />
        {!d.acceptingUploads ? <span data-er-code-dim="" hidden /> : null}
      </span>
    );
  }
  if (variant === "mark")
    return (
      <Mat d={d}>
        <CornerMark d={d} />
      </Mat>
    );
  return <Mat d={d} foot={<SignLine d={d} />} />;
}
