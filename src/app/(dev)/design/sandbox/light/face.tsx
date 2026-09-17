"use client";

import { GroundBox } from "@/components/lab";
import { PhoneFrame, QrFrame } from "@/components/marketing/frames";
import { cn } from "@/lib/utils";

import { CornerInset, StageOnly, TileOnly, TrueFit } from "./fit";
import { Photo } from "./shared";

/**
 * THE THIN BRIGHT EDGE, DRAWN WHERE IT CAN BE SEEN (round eight).
 *
 * Will on round seven's card: "Genuinely cannot see it in action here." He
 * could not, and for a reason worse than size:
 *
 * ★ THE EDGE WAS UNDER THE PHOTOGRAPH. The cue is an INSET box-shadow, and an
 * inset shadow paints above an element's own background and BELOW its children.
 * On a media tile the child is an image covering the whole box, so the hairline
 * was drawn and then painted over: the "with it" half of that card was the
 * "as today" half, to the pixel. The paste has the same fault
 * (`[data-media-tile] { box-shadow: inset ... }` in candidates.ts), which is in
 * the Handoff. Here the edge rides a pseudo-element above the image
 * (board.css, `[data-lgt-cue="lit"]::after`), so it is at least really there.
 *
 * ★ AND THEN IT IS ONE PIXEL AT NINE PERCENT, so the question is asked the only
 * honest way: one large photograph at true size, with its top left corner
 * enlarged four times beside it, on BOTH halves. The enlargement is fixed on
 * the screen, never a hover lens. If the difference still cannot be seen at
 * true size, that is the finding, and the board says so rather than hiding it.
 */

const TILE_W = 672;
const PHOTO = { w: 480, h: 300 } as const;
const INSET = 144;

function BigPhoto({ lit }: { lit: boolean }) {
  return (
    <Photo
      id="concert-confetti"
      cue={lit ? "lit" : undefined}
      sizes={`${PHOTO.w}px`}
      style={{ width: PHOTO.w, height: PHOTO.h }}
    />
  );
}

/** A specimen and its own corner, enlarged. The caption sits under the inset,
 *  on the bare ground: a box around either would be one more edge. */
function WithCorner({
  width,
  pad = 8,
  wrap = false,
  children,
}: {
  width: number;
  /** Bare ground shown around the corner, so the edge has something to be against. */
  pad?: number;
  /** The stage's row wraps on a phone; a tile is a fixed width and never does. */
  wrap?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("flex items-start gap-4", wrap && "flex-wrap")}>
      <div className="shrink-0" style={{ width }}>
        {children}
      </div>
      {/* As wide as the inset and no wider, so the caption wraps under it
          instead of running out of a tile that is exactly as wide as its
          picture. */}
      <figure
        className="flex shrink-0 flex-col gap-1.5"
        style={{ width: INSET }}
      >
        <CornerInset width={width} size={INSET} pad={pad}>
          {children}
        </CornerInset>
        <figcaption className="text-[10px] leading-snug text-muted-foreground">
          Its top left corner, four times the size
        </figcaption>
      </figure>
    </div>
  );
}

function Tile({ lit }: { lit: boolean }) {
  return (
    <GroundBox
      ground="app-dark"
      className="rounded-lg p-3"
      style={{ width: TILE_W }}
    >
      <WithCorner width={PHOTO.w}>
        <BigPhoto lit={lit} />
      </WithCorner>
    </GroundBox>
  );
}

/**
 * THE THREE KINDS OF SURFACE IT WOULD LAND ON, in the state being shown.
 *
 * ★ TWO OF THE THREE ALREADY HAVE AN OUTLINE. The QR card and the phone frame
 * ship with a border and a hairline ring of their own, so a nine percent line
 * on top of a twelve percent one moves almost nothing; the player's dark canvas
 * is the one surface with no edge today. That is visible here, and it is half
 * of why the board's answer is what it is.
 */
function Surfaces({ lit }: { lit: boolean }) {
  const cue = lit ? "lit" : undefined;
  return (
    <GroundBox ground="app-dark" className="rounded-lg p-5">
      <div className="flex flex-wrap items-start gap-x-10 gap-y-8">
        <figure className="flex flex-col gap-2">
          <WithCorner width={300} wrap>
            <div
              aria-hidden
              className="relative overflow-hidden rounded-xl bg-gallery"
              style={{ width: 300, height: 188 }}
              data-lgt-cue={cue}
            >
              <div className="absolute inset-0 grid place-items-center">
                <span className="flex size-10 items-center justify-center rounded-full bg-white/90">
                  <span
                    aria-hidden
                    className="ml-0.5 border-y-[6px] border-l-[10px] border-y-transparent border-l-black/80"
                  />
                </span>
              </div>
              <div className="absolute inset-x-3 bottom-3 h-1 rounded-full bg-white/25">
                <div className="h-full w-1/3 rounded-full bg-gallery-foreground/90" />
              </div>
            </div>
          </WithCorner>
          <figcaption className="text-[11px] text-muted-foreground">
            The video player&rsquo;s dark canvas
          </figcaption>
        </figure>

        <figure className="flex flex-col gap-2">
          <WithCorner width={220} wrap>
            <div
              className="relative w-[220px]"
              style={{ borderRadius: "calc(var(--radius) * 1.8)" }}
              data-lgt-cue={cue}
            >
              <QrFrame />
            </div>
          </WithCorner>
          <figcaption className="text-[11px] text-muted-foreground">
            The QR card
          </figcaption>
        </figure>

        <figure className="flex flex-col gap-2">
          <WithCorner width={220} wrap>
            <div
              className="relative w-[220px]"
              style={{ borderRadius: "2.5rem" }}
              data-lgt-cue={cue}
            >
              <PhoneFrame />
            </div>
          </WithCorner>
          <figcaption className="text-[11px] text-muted-foreground">
            A framed screen
          </figcaption>
        </figure>
      </div>
    </GroundBox>
  );
}

export function FaceStage({ lit }: { lit: boolean }) {
  return (
    <div data-lgt-step="face">
      <TileOnly>
        <TrueFit natural={TILE_W}>
          <Tile lit={lit} />
        </TrueFit>
      </TileOnly>
      <StageOnly>
        <Surfaces lit={lit} />
      </StageOnly>
    </div>
  );
}
