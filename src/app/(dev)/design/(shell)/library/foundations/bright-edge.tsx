import Image from "next/image";

import { PhoneFrame, QrFrame, ReelFrame } from "@/components/marketing/frames";
import { marketingImage } from "@/lib/constants/marketing-media";
import { cn } from "@/lib/utils";

/**
 * THE BRIGHT EDGE, WHERE IT IS JUDGED: "I love the bright edge. It's a really
 * nice subtle design touch, but I think the implementation could use a tweak
 * to feel more polished and beautiful. The transparent border radius also
 * revealed some mismatches here in the preview roundings." The rule itself, and why it is shaped the
 * way it is, lives at [data-lit] in src/app/globals.css; the hook's contract is
 * src/components/shared/lit-edge-contract.test.ts. This file only SHOWS it.
 *
 * ★ EVERY SURFACE HERE IS THE PRODUCTION ONE, AND NONE IS DRESSED FOR THE PAGE.
 * The mismatch he caught came from exactly that: the board laid its cue on a
 * bare wrapper with a hand-typed radius (`calc(var(--radius) * 1.8)` restating
 * the QR card's corner, `2.5rem` restating the phone's), so the edge had one
 * arc and the surface another. Here `PhoneFrame`, `QrFrame` and `ReelFrame`
 * are imported and rendered untouched, carrying their own `data-lit` on the
 * box that owns their own radius. The photograph is the one drawing, because
 * the masonry's tile is a row in a grid and not a component: it is that row's
 * box, class for class (`shared/masonry.tsx`).
 *
 * ★ A FIXED 4x CORNER, NEVER A HOVER LENS. One pixel cannot be judged from a
 * description of it, and round seven of the board hid it behind a loupe
 * ("Genuinely cannot see it in action here"). The inset is the same children
 * rendered a second time, inert, scaled from their own top left corner inside
 * a clipped box, so the enlargement is on the screen before anybody reaches for
 * anything. A transform and not `zoom`: the copy must not re-lay-out, or it is
 * a different specimen.
 *
 * ★ THE INSET'S OWN BOX IS SQUARE. The board's inset was rounded, which put a
 * second corner right beside the magnified one being judged; a square window
 * has no arc of its own to compare against.
 *
 * ★ A DARK PHOTOGRAPH AND A BRIGHT ONE, SIDE BY SIDE, BECAUSE THE EDGE IS NOT
 * THE SAME THING ON BOTH. It is the foreground colour at a low alpha, so over
 * a night sky it is a fine line of light and over an overcast one it is almost
 * nothing, which is what a highlight on a bright surface physically is. If it
 * ever reads as a FRAME on the dark one, it is too strong.
 *
 * ★ TWO GROUNDS, AS SIBLINGS, NEVER NESTED, AND NOT THE SPECIMEN'S SPLIT. The
 * edge exists on dark grounds only, so a Library read in light mode would show
 * a page of surfaces with nothing on them and no way to tell that from a bug.
 * The stage forces `.dark` and the proof strip forces `.surface-paper`, side
 * by side (globals.css: never nest one inside the other), so both halves of
 * the rule are on the screen in either theme.
 */

/** How much the corner is enlarged, and the side of the window it is shown in. */
const TIMES = 4;
const INSET = 128;
/** Bare ground kept around the corner, in the specimen's own pixels: an edge is
 *  only an edge against something. */
const PAD = 8;

/** The masonry tile's own box (shared/masonry.tsx), holding one photograph. */
function Photograph({
  id,
  width,
  height,
}: {
  id: string;
  width: number;
  height: number;
}) {
  const img = marketingImage(id);
  return (
    <div
      data-lit=""
      className="relative overflow-hidden bg-black/10"
      style={{ width, height, borderRadius: "var(--radius-tile)" }}
    >
      <Image
        src={img.src}
        alt=""
        fill
        sizes={`${width * TIMES}px`}
        className="object-cover"
      />
    </div>
  );
}

/** One corner, four times the size, always on the screen. */
function CornerInset({
  width,
  children,
}: {
  /** The width the specimen is laid out at, so the copy matches the original. */
  width: number;
  children: React.ReactNode;
}) {
  return (
    <div
      aria-hidden
      inert
      className="relative shrink-0 overflow-hidden ring-1 ring-foreground/15"
      style={{ width: INSET, height: INSET }}
    >
      <div
        className="absolute top-0 left-0 origin-top-left"
        style={{
          width,
          // Right to left: scaled from its own corner, then moved in by the pad.
          transform: `translate(${PAD * TIMES}px, ${PAD * TIMES}px) scale(${TIMES})`,
        }}
      >
        {children}
      </div>
    </div>
  );
}

/** A specimen at true size, its corner beside it, and one line under both. */
function Surface({
  name,
  note,
  width,
  children,
}: {
  name: string;
  note: string;
  width: number;
  children: React.ReactNode;
}) {
  return (
    <figure className="flex min-w-0 flex-col gap-2.5">
      <div className="flex flex-wrap items-start gap-4">
        <div className="shrink-0" style={{ width }}>
          {children}
        </div>
        <CornerInset width={width}>{children}</CornerInset>
      </div>
      <figcaption className="max-w-sm text-xs leading-relaxed">
        <span className="font-medium">{name}</span>{" "}
        <span className="text-muted-foreground">{note}</span>
      </figcaption>
    </figure>
  );
}

function Ground({
  tone,
  title,
  children,
}: {
  tone: "dark" | "paper";
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "rounded-lg bg-background p-5 text-foreground",
        // Each ground is its own root: `.dark` turns the variant on for the
        // stage and `.surface-paper` is the sanctioned subtree-scoped light
        // block. Siblings, so neither ever sits inside the other.
        tone === "dark" ? "dark" : "surface-paper border",
      )}
    >
      <p className="text-[11px] font-medium tracking-[0.14em] text-muted-foreground uppercase">
        {title}
      </p>
      <div className="mt-4 flex flex-wrap items-start gap-x-10 gap-y-8">
        {children}
      </div>
    </div>
  );
}

export function BrightEdge() {
  return (
    <div className="flex flex-col gap-3">
      <Ground tone="dark" title="On a dark ground">
        <Surface
          width={240}
          name="A dark photograph."
          note="The clearest case: a fine line of light along the top, gone by the foot."
        >
          <Photograph id="concert-confetti" width={240} height={160} />
        </Surface>
        <Surface
          width={240}
          name="A bright photograph."
          note="Almost nothing, which is right: a highlight on a bright surface is barely there."
        >
          <Photograph id="wedding-arch" width={240} height={160} />
        </Surface>
        <Surface
          width={300}
          name="A player."
          note="The dark well inside the frame takes the edge; the frame around it is a card and takes none."
        >
          <ReelFrame />
        </Surface>
        <Surface
          width={220}
          name="A framed screen."
          note="The light lands on the bezel's own border, so there is one arc and not two."
        >
          <PhoneFrame />
        </Surface>
        <Surface
          width={220}
          name="The QR card."
          note="The same: on the card's border, inside its outline, rather than a third line."
        >
          <QrFrame />
        </Surface>
      </Ground>

      <Ground tone="paper" title="On a light ground: nothing, by construction">
        <Surface
          width={240}
          name="The same photograph."
          note="The rule is compiled through the dark variant, so no edge is even generated here."
        >
          <Photograph id="concert-confetti" width={240} height={160} />
        </Surface>
        <Surface
          width={220}
          name="The same card."
          note="Its border and its outline, exactly as before."
        >
          <QrFrame />
        </Surface>
      </Ground>
    </div>
  );
}
