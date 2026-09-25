import { River, type RiverFrame } from "@/components/shared/river/river";
import { Button } from "@/components/ui/button";

/**
 * THE "PHOTOGRAPHIC PROMISE" EMPTY STATE: a guest album with nothing in it yet.
 *
 * The picture is the flow, so an empty album reads as something arriving
 * rather than a wall standing still.
 *
 * ★ NOTHING POURS OUT OF AN OBJECT HERE. The lab's river can be born from a QR
 * code or a printed plate; on a host's album it is born from nothing, above the
 * frame (`River` has no origin at all, deliberately). The guest surface belongs
 * to the host's event, so no Partyreel demo code sits inside somebody's own
 * album, and a guest reached this screen BY scanning a code: handing it back
 * is the one slot where a code is certainly wrong.
 *
 * ★ THE GHOST IS A FILTER ON THIS WRAPPER, never a layer over the photographs
 * (the media carries the colour, and the interface never paints over it) and
 * never a prop on the river: the river is a full-luminance object everywhere
 * else it will be placed, and the fade belongs to the surface that needs it. At
 * full luminance an EMPTY album would promise pictures that do not exist, which
 * is the one thing an empty state may not do. Its values are brighter than a
 * static ghost grid would need and not fully desaturated, because the flow
 * moves and dissolves at every edge, so it has less to say per pixel than
 * static tiles, and a colourless stream reads as broken where a colourless grid
 * reads as faint.
 *
 * ★ THE PROMISE SITS OVER THE FLOW, which no other placement of the river may
 * do: a feature visual has no clearing cut for type and puts its words beside
 * the picture. The ghost treatment is what buys it here.
 */

/**
 * The guest-ghost pack, in launch order: small local WebPs (~44KB for all
 * nine) rather than the marketing stills, because a guest is on a phone on
 * event Wi-Fi. One card per photograph, so none is ever doubled in view, and
 * neighbours in this list are the two a reader sees together at the top of the
 * flow.
 */
export const GUEST_GHOST_FRAMES: RiverFrame[] = Array.from(
  { length: 9 },
  (_, i) => ({ src: `/guest-ghost/g0${i + 1}.webp` }),
);

/**
 * THE GHOSTED FLOW, AT ONE DEPTH, FOR BOTH PLACES A GUEST MEETS NOTHING: the
 * river on the locked page as well as the empty album, so one absence has one
 * picture, and ONE FADE is what keeps it one. The depth lives here beside the
 * pack it fades rather than being retyped at each placement, because a second
 * copy of `opacity-40 grayscale-[85%]` is how two screens drift apart.
 *
 * ★ THE FRAMES ARE STAND-INS, NEVER THE EVENT'S OWN. On a locked page that IS
 * the privacy rule: a password event leaks the name and the count, and zero
 * pixels of its media. On an empty album there is nothing of the event's to draw
 * in the first place.
 */
export function GhostRiver() {
  return (
    <div className="opacity-40 grayscale-[85%]">
      <River frames={GUEST_GHOST_FRAMES} />
    </div>
  );
}

export function GalleryEmptyState({
  onAddFirst,
}: {
  /** Present only when the viewer can upload — drives the CTA. */
  onAddFirst?: () => void;
}) {
  return (
    <div className="relative">
      {/* The river is SQUARE here (its default ratio). It takes its width from
          this column and never from a constant: the guest gallery is 335px at a
          phone and 632px from 672 up, and that column may widen. */}
      <GhostRiver />
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 px-6 text-center">
        {/* An empty state's title: the ladder's `subsection`, a step under the
            album's own h1 (`page`) so the empty album never out-shouts it.

            ★ AN INVITATION, NOT A DESCRIPTION: a description of a place asks
            nothing of the reader, so the title asks for the first upload rather
            than sitting passive, waiting for a picture to land. The host's empty
            dashboard speaks in the same voice ("Your first album starts here"):
            the album as the noun, "starts" as the verb, the reader at the start
            of it. */}
        <p className="font-heading text-subsection text-balance">
          The album starts with you
        </p>
        {onAddFirst && (
          <Button size="lg" onClick={onAddFirst}>
            Be the first to add a photo
          </Button>
        )}
      </div>
    </div>
  );
}
