"use client";

import "./seam.css";

import { type CSSProperties, useRef } from "react";

import { COVER_SLOTS } from "@/components/guest/event-experience-head";
import { formatCount } from "@/lib/format/count";

import type { DoorDraw } from "./door-kit";
import { useEdges } from "./edge";
import { castBand, chromaOf, edgeBand, inkOfCover } from "./light";
import type { ScreenId } from "./scene";

/**
 * THE HUB'S ONE LIGHT, MADE AFTERGLOW'S (round six's correction, drawn under
 * every option): the Seam born where the cover's photograph ends, in the
 * edge's own colours, past every control.
 *
 * ★ THE GEOMETRY IS THE BRAND'S RULE, "WORDS AND CONTROLS PAST THE LIGHT'S
 * REACH" (`slides/dark-page.tsx`: "the event's line starts past the light's
 * reach"; `slides/pages.tsx`: a full-width cover, its Seam, the heading
 * below). Round five laid the light under the cards, where it showed only in
 * their 12px gaps. So the cards now stand ON the cover's foot, the photograph
 * runs on under them and ends `gap` px below them (its own colours seen there:
 * the light's source), and the Seam falls from that edge into the page, its
 * whole reach clear, the album starting past it. The cards still cover the
 * seam between the cover and the page, as Apple TV's shelf stands on its
 * hero; nothing pressed stands in the light.
 *
 * ★ REACH IS THE BRAND'S, NEVER PALER (brand r2's kit: "a seam drawn faint
 * reads as smoke"; "quieter is shorter, never paler"): 120px at a desk (the
 * room's own Seam), 104 on a tablet, 72 in a hand (the kit's shortest), at
 * full strength.
 *
 * ★ ONE LAYER PER STILL, ON THE COVER'S OWN CLOCK: the cover dissolves through
 * its photographs (`HeadStills`, six slots of 4.6s), so the light under it
 * does too, each still's own edge crossing with its picture; under reduced
 * motion both hold the first.
 *
 * ★ ON PAPER, BRAND R2'S TAKES (the Paper knob; Will's open ask on the brand
 * board, drawn here, never asked): Aperture (recommended there) keeps the
 * light in a strip of the room under the photograph, at least 30px, the light
 * inside it; Ink prints a rule, at least 2px, and the event's credits in the
 * album's ink; Cast lays a hard 8 to 12px band of the edge's colour as a
 * coloured shadow. No light is ever laid on paper itself.
 */

export type PaperId = "aperture" | "ink" | "cast";

/** HeadStills' hold (`event-experience-head.tsx`, not exported): a still's sixth of the cycle. */
const HOLD_SEC = 4.6;

/**
 * Where everything stands at the cover's foot, per screen: the cards' resting
 * height, the photograph left showing under them, and the Seam's reach in the
 * room; `pad` is the band's own foot at rest (`card-kit.css`).
 */
export const SEAM_AT: Record<
  ScreenId,
  { card: number; gap: number; reach: number; pad: number; bleed: number }
> = {
  "1440": { card: 72, gap: 20, reach: 120, pad: 8, bleed: 20 },
  "820": { card: 108, gap: 20, reach: 104, pad: 8, bleed: 20 },
  "375": { card: 76, gap: 14, reach: 72, pad: 6, bleed: 12 },
};

/** How far the cards stand up into the cover: their whole height and the photograph under them. */
export const seamOf = (screen: ScreenId) => ({
  rise: SEAM_AT[screen].card + SEAM_AT[screen].gap,
  fade: 0,
});

/** The house's dusk (Afterglow's `HOUSE`), the light before the album has a photograph. */
const HOUSE: readonly number[] = [80, 66, 52, 43, 34, 24];

/** Ink's printed rule: a three-hundredth of the width, never under 2px. */
const ruleOf = (w: number) => Math.max(2, Math.round(w / 300));

/** The paper Seam's band (Cast): 8 to 12px, shorter in a hand, never paler. */
const castOf = (screen: ScreenId) => (screen === "375" ? 8 : 12);

/** Aperture's strip of the room: at least 30px. */
const rebateOf = (screen: ScreenId) => (screen === "375" ? 30 : 36);

/** The paper form's own height. */
function paperHeight(paper: PaperId, screen: ScreenId): number {
  if (paper === "aperture") return rebateOf(screen);
  if (paper === "cast") return castOf(screen);
  return ruleOf(SCREEN_W[screen]) + 30;
}

const SCREEN_W: Record<ScreenId, number> = {
  "1440": 1440,
  "820": 820,
  "375": 375,
};

/**
 * THE SEAM UNDER THE COVER: placed by its own margins straight under the
 * cover's edge (the hub's `space-y-6` is production's and outranks a lab
 * utility, so the margins are inline), taking its whole reach in the page so
 * the album starts past it.
 */
export function CoverSeam({
  c,
  screen,
  ground,
  paper,
}: DoorDraw & { paper: PaperId }) {
  const at = SEAM_AT[screen];
  const anchor = useRef<HTMLDivElement | null>(null);
  const edges = useEdges(c.stills, anchor);
  const room = ground === "room";
  const height = room ? at.reach : paperHeight(paper, screen);
  const style: CSSProperties = {
    // From the band's foot (the row's footprint) back up to the photograph's edge.
    marginTop: at.gap - at.pad - 24,
    // ★ The album stands 8px past the light's reach, as a dark page's line
    // stands past it. `space-y-6` is Tailwind 4's: the gap is each child's own
    // bottom margin, so this replaces it (and the row's 24 is above, kept).
    marginBottom: 8,
    marginInline: -at.bleed,
    height,
  };
  const unique = [...new Map(c.stills.map((s) => [s.id, s])).values()];
  const cycle = unique.length > 1;
  const slots = unique.length
    ? cycle
      ? Array.from({ length: COVER_SLOTS }, (_, i) => unique[i % unique.length])
      : unique
    : [];
  const read = slots.every((s) => edges[s.id]);
  return (
    <div
      ref={anchor}
      aria-hidden
      data-eh-light={room ? "room" : paper}
      data-screen={screen}
      // Each still's six hues as read, so a frame's light can be checked against its photograph.
      data-hues={slots
        .map((x) => edges[x.id]?.map(Math.round).join(" ") ?? "unread")
        .join(" | ")}
      className="eh-seam"
      style={style}
    >
      {room || paper === "aperture" ? (
        <div className={room ? "eh-seam-room" : "eh-seam-rebate"}>
          {slots.length === 0 ? (
            <Lit hues={HOUSE} c={0.15} />
          ) : read ? (
            slots.map((s, i) => (
              <Slot key={`${i}-${s.id}`} i={i} cycle={cycle}>
                <Lit hues={edges[s.id]!} c={chromaOf(s.id)} />
              </Slot>
            ))
          ) : null}
        </div>
      ) : paper === "ink" ? (
        <div
          className="eh-seam-ink"
          style={
            {
              "--eh-ink": inkOfCover(c),
              "--eh-rule": `${ruleOf(SCREEN_W[screen])}px`,
            } as CSSProperties
          }
        >
          <span className="eh-seam-rule" />
          <span className="eh-seam-credits">
            {[
              c.name,
              // Credits print what the album holds: nothing to count is never printed as a zero.
              c.guests
                ? `${formatCount(c.guests)} ${c.guests === 1 ? "guest" : "guests"}`
                : null,
              c.photos
                ? `${formatCount(c.photos)} ${c.photos === 1 ? "photo" : "photos"}`
                : null,
            ]
              .filter((w): w is string => Boolean(w))
              .map((word, i) => (
                <span key={word} className="eh-seam-credit">
                  {i ? (
                    <svg viewBox="0 0 5 6" width={5} height={6} aria-hidden>
                      <path d="M0 0L5 3L0 6Z" fill="currentColor" />
                    </svg>
                  ) : null}
                  {word}
                </span>
              ))}
          </span>
        </div>
      ) : (
        <div className="eh-seam-cast">
          {slots.length === 0 ? (
            <span
              className="eh-seam-band"
              style={{ background: castBand(HOUSE, 0.15) }}
            />
          ) : read ? (
            slots.map((s, i) => (
              <Slot key={`${i}-${s.id}`} i={i} cycle={cycle}>
                <span
                  className="eh-seam-band"
                  style={{ background: castBand(edges[s.id]!, chromaOf(s.id)) }}
                />
              </Slot>
            ))
          ) : null}
        </div>
      )}
    </div>
  );
}

/** One still's light, on that still's own clock (HeadStills' crossfade, the same delay). */
function Slot({
  i,
  cycle,
  children,
}: {
  i: number;
  cycle: boolean;
  children: React.ReactNode;
}) {
  return (
    <div
      className="eh-seam-slot"
      data-rest={i === 0 ? "" : undefined}
      data-cycle={cycle ? "" : undefined}
      style={
        {
          "--head-hold": HOLD_SEC,
          "--head-delay": i * HOLD_SEC - HOLD_SEC * COVER_SLOTS,
        } as CSSProperties
      }
    >
      {children}
    </div>
  );
}

/** The light itself (Afterglow's `RoomSeam`): the edge's colours pooled in three soft ellipses, and the edge lit. */
function Lit({ hues, c }: { hues: readonly number[]; c: number }) {
  return (
    <>
      <div
        className="eh-seam-light"
        style={{ background: edgeBand(hues, c, "roomSeam") }}
      />
      <div
        className="eh-seam-line"
        style={{ background: edgeBand(hues, c, "roomLine") }}
      />
    </>
  );
}

/**
 * THE COVER'S OWN SCRIM, FOR THIS GEOMETRY: production's (`.head-scrim`) is
 * heaviest at the cut (80% black), which hid the very edge the light is born
 * at. This keeps its breath at the top and its weight behind the name and the
 * strip, then lifts under the cards, so the photograph's last rows show in its
 * own colours at the edge: the Seam's source, seen.
 */
export function CoverScrim({ screen }: { screen: ScreenId }) {
  const at = SEAM_AT[screen];
  const rise = at.card + at.gap;
  const words = rise + (screen === "375" ? 16 : 22);
  return (
    <div
      aria-hidden
      className="eh-cover-scrim"
      style={{
        background: [
          "linear-gradient(to bottom, rgb(0 0 0 / 0.42) 0, rgb(0 0 0 / 0) 7.5rem)",
          `linear-gradient(to top, rgb(0 0 0 / 0.22) 0, rgb(0 0 0 / 0.34) ${at.gap}px, rgb(0 0 0 / 0.78) ${rise}px, rgb(0 0 0 / 0.78) ${words + 56}px, rgb(0 0 0 / 0.4) 58%, rgb(0 0 0 / 0) 72%)`,
        ].join(", "),
      }}
    />
  );
}
