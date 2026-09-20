import { River, type RiverFrame } from "@/components/shared/river/river";
import { Button } from "@/components/ui/button";

/**
 * THE "PHOTOGRAPHIC PROMISE" EMPTY STATE: a guest album with nothing in it yet.
 *
 * Phase 4 drew it as a faint 3 by 3 ghost mosaic; Will replaced the PICTURE on
 * the river-visual board (`guest-photos=ghost`, 2026-09-18: "an immediate
 * upgrade to the 'this is where it all lands' empty state"). Its two rules are
 * unchanged and the picture is now the flow, so an empty album reads as
 * something arriving rather than a wall standing still.
 *
 * ★ NOTHING POURS OUT OF AN OBJECT HERE. The lab's river can be born from a QR
 * code or a printed plate; on a host's album it is born from nothing, above the
 * frame (`River` has no origin at all, deliberately). A demo code inside
 * somebody's own album is Partyreel's demo on the host's page, which bible 4
 * refuses, and a guest reached this screen BY scanning a code: handing it back
 * is the one slot where a code is certainly wrong.
 *
 * ★ THE GHOST IS A FILTER ON THIS WRAPPER, never a layer over the photographs
 * (bible 1) and never a prop on the river: the river is a full-luminance object
 * everywhere else it will be placed, and the fade belongs to the surface that
 * needs it. At full luminance an EMPTY album would promise pictures that do not
 * exist, which is the one thing an empty state may not do. These are the values
 * Will ruled on: a hair brighter than the mosaic's 25 percent and not fully
 * desaturated, because the flow moves and dissolves at every edge, so it has
 * less to say per pixel than nine static tiles did, and a colourless stream
 * reads as broken where a colourless grid read as faint.
 *
 * ★ THE PROMISE SITS OVER THE FLOW, which no other placement of the river may
 * do: a feature visual has no clearing cut for type and puts its words beside
 * the picture. The ghost treatment is what buys it here.
 */

/**
 * The guest-ghost pack, in launch order: small local WebPs (~44KB for all
 * nine) rather than the marketing stills the lab board drew, because a guest is
 * on a phone on event Wi-Fi. One card per photograph, so none is ever doubled
 * in view, and neighbours in this list are the two a reader sees together at
 * the top of the flow.
 */
export const GUEST_GHOST_FRAMES: RiverFrame[] = Array.from(
  { length: 9 },
  (_, i) => ({ src: `/guest-ghost/g0${i + 1}.webp` }),
);

/**
 * THE GHOSTED FLOW, AT ONE DEPTH, FOR BOTH PLACES A GUEST MEETS NOTHING (Will,
 * `nothing=river`, 2026-09-20: the river on the locked page as well as the
 * empty album). The locked page drew a nine-cell `GhostGrid` and the empty
 * album drew the river, so one absence had two pictures; the ruling makes it
 * one, and ONE FADE is what keeps it one. The depth lives here beside the pack
 * it fades rather than being retyped at each placement — a second copy of
 * `opacity-40 grayscale-[85%]` is exactly how the two screens drifted apart the
 * first time.
 *
 * ★ THE FRAMES ARE STAND-INS, NEVER THE EVENT'S OWN. On a locked page that IS
 * the privacy rule: a password event still leaks what it leaked before, the
 * name and the count, and zero pixels of its media. On an empty album there is
 * nothing of the event's to draw in the first place.
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
      {/* The river is SQUARE here (its default ratio), which is exactly the
          footprint the 3 by 3 mosaic had at every width, so the promise did not
          move when the picture changed. It takes its width from this column and
          never from a constant: the guest gallery is 335px at a phone and 632px
          from 672 up, and a later round may widen it. */}
      <GhostRiver />
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 px-6 text-center">
        {/* An empty state's title: the ladder's `subsection`, a step under the
            album's own h1 (`page`) so the empty album never out-shouts it.

            ★ RULED (Will, 2026-09-19, voice r1 `empty=starts`): it read "This
            is where it all lands", which is a description of a place and asks
            nothing of the reader. "This incentivizes action (first upload)
            rather than feeling passive and waiting for a picture to land." The
            host's empty dashboard took the same voice from the same sitting
            ("Your first album starts here"): the album as the noun, "starts" as
            the verb, the reader at the start of it. */}
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
