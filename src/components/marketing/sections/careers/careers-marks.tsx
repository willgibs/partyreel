import { cn } from "@/lib/utils";

/**
 * THE PARTYREEL MARKS - the careers hero's media.
 *
 * Hand-built DOM art in the help-emblems.tsx tradition (pure divs + tokens, no
 * images, achromatic), and the one thing Will kept from the careers lab round:
 * "the subtle technical art kind of makes it feel cool in a developer 'this is
 * cool work' way versus repeating more images."
 *
 * ! They are GLOBAL PARTYREEL CONCEPTS, not engine internals (his ruling, same
 *   note: "lean more into global partyreel concepts"). Each mark is one beat of
 *   the product loop a visitor already understands from the rest of the site -
 *   scan, arrive, fill, choose, cut, share, keep - so the wall reads as what we
 *   make rather than as how we make it. A new mark belongs here only if it
 *   names another beat of that loop.
 *
 * Decorative by contract: the wall is aria-hidden at its root, so nothing here
 * carries meaning a screen reader needs.
 */

export type MarkKind =
  | "scan"
  | "phone"
  | "album"
  | "choose"
  | "reel"
  | "share"
  | "keep"
  | "download";

/**
 * ! DRAWN FROM SOLID BLOCKS, ON PURPOSE. These ship at roughly 54px, where a
 *   fill reads and a hairline does not: earlier passes drew them as 1.5-2px
 *   outlines and the wall came out as a field of near-empty squares. Every mark
 *   below is blocks plus at most one 2px rule. Check any new one at the real
 *   size in a production build, never zoomed in and never on a dev server that
 *   might be serving a stale bundle (see the note on the wall below).
 */
export function Mark({ kind }: { kind: MarkKind }) {
  switch (kind) {
    case "scan":
      // The QR: three finder blocks and one module. Scan to join.
      return (
        <span className="relative block size-full">
          <span className="absolute top-0 left-0 size-[34%] rounded-[2px] bg-current" />
          <span className="absolute top-0 right-0 size-[34%] rounded-[2px] bg-current" />
          <span className="absolute bottom-0 left-0 size-[34%] rounded-[2px] bg-current" />
          <span className="absolute right-[6%] bottom-[6%] size-[22%] rounded-[2px] bg-current/55" />
        </span>
      );
    case "phone":
      // The guest's phone. No app, no account, just the camera they brought.
      return (
        <span className="relative block size-full">
          <span className="absolute inset-y-0 left-1/2 w-[52%] -translate-x-1/2 rounded-[5px] bg-current" />
          <span className="absolute inset-y-[16%] left-1/2 w-[34%] -translate-x-1/2 rounded-[2px] bg-current/25" />
        </span>
      );
    case "album":
      // The grid filling up: some landed, the rest still on their way.
      return (
        <span className="grid size-full grid-cols-3 gap-[2px]">
          {[1, 0.25, 1, 0.25, 1, 1, 1, 0.25, 1].map((o, i) => (
            <span
              key={i}
              className="rounded-[2px] bg-current"
              style={{ opacity: o }}
            />
          ))}
        </span>
      );
    case "choose":
      // Curation: one stays, one does not.
      return (
        <span className="relative block size-full">
          <span className="absolute inset-x-0 top-0 h-[42%] rounded-[3px] bg-current" />
          <span className="absolute inset-x-0 bottom-0 h-[42%] rounded-[3px] bg-current/20" />
        </span>
      );
    case "reel":
      // The filmstrip: the album cut down to the highlights.
      return (
        <span className="relative block size-full">
          <span className="absolute inset-x-0 top-[6%] h-[2px] rounded-full bg-current/70" />
          <span className="absolute inset-x-0 bottom-[6%] h-[2px] rounded-full bg-current/70" />
          <span className="absolute inset-x-0 top-[24%] flex h-[52%] gap-[3px]">
            {[1, 0.62, 0.3].map((o, i) => (
              <span
                key={i}
                className="flex-1 rounded-[2px] bg-current"
                style={{ opacity: o }}
              />
            ))}
          </span>
        </span>
      );
    case "share":
      // One link, everybody's copy of the same event.
      return (
        <span className="relative block size-full">
          <span className="absolute top-0 left-1/2 size-[30%] -translate-x-1/2 rounded-full bg-current" />
          <span className="absolute top-[34%] left-1/2 h-[16%] w-[2px] -translate-x-1/2 bg-current/70" />
          <span className="absolute top-[50%] inset-x-[16%] h-[2px] bg-current/70" />
          <span className="absolute top-[50%] left-[16%] h-[18%] w-[2px] bg-current/70" />
          <span className="absolute top-[50%] right-[16%] h-[18%] w-[2px] bg-current/70" />
          <span className="absolute bottom-0 left-[4%] size-[26%] rounded-[2px] bg-current/80" />
          <span className="absolute right-[4%] bottom-0 size-[26%] rounded-[2px] bg-current/80" />
        </span>
      );
    case "keep":
      // Albums do not expire: the same event, stacked and held.
      return (
        <span className="relative block size-full">
          <span className="absolute inset-x-[18%] top-0 h-[22%] rounded-[2px] bg-current/30" />
          <span className="absolute inset-x-[9%] top-[28%] h-[22%] rounded-[2px] bg-current/60" />
          <span className="absolute inset-x-0 top-[56%] h-[30%] rounded-[3px] bg-current" />
        </span>
      );
    case "download":
      // Originals out, at the quality they arrived.
      return (
        <span className="relative block size-full">
          <span className="absolute top-0 left-1/2 h-[34%] w-[3px] -translate-x-1/2 rounded-full bg-current" />
          <span className="absolute top-[30%] left-1/2 size-0 -translate-x-1/2 border-x-[7px] border-t-[9px] border-x-transparent border-t-current" />
          <span className="absolute inset-x-0 bottom-0 h-[16%] rounded-[2px] bg-current" />
        </span>
      );
  }
}

/**
 * The hero wall: a dense field of marks the type sits sovereign over.
 *
 * DENSITY IS THE WHOLE TRICK. A first pass tiled nine columns across the full
 * viewport, which put each mark at ~139px and read as wallpaper, or as a
 * pattern-library dump, rather than as texture. Small and many is what makes it
 * feel like craft; large and few makes it feel like clip art. The tiles are
 * sized (not counted) so the density holds at every width.
 *
 * The box is deliberately TALLER than the section and hangs past both edges,
 * because `data-mkt-wall` drifts translateY by -14% (marketing.css) and would
 * otherwise pull a bare strip into view at the bottom. Same geometry the home
 * album wall uses, reused rather than re-derived.
 *
 * `data-mkt-wall` also carries the loop-pause contract and the reduced-motion
 * guard from that sheet, so careers inherits the ambient register the home hero
 * already ratified instead of inventing a second one.
 */
const WALL_SEQUENCE: MarkKind[] = [
  "scan", "phone", "album", "choose", "reel", "share", "keep", "download",
  "album", "scan", "reel", "phone", "share", "choose", "download", "keep",
  "reel", "album", "scan", "keep", "phone", "download", "choose", "share",
];

/**
 * The opacity wobble, deliberately a different length (7) from the mark
 * sequence (24) so the two cycles only realign every 168 tiles, which is past
 * the end of the wall. Coprime lengths are the cheapest way to stop a fixed
 * pattern from reading as wallpaper, and it stays a pure function of the index
 * (never Math.random) so server and client agree.
 */
const WALL_OPACITIES = [0.5, 0.34, 0.62, 0.4, 0.28, 0.55, 0.36];

/**
 * Enough tiles to fill the drifting box at the widest breakpoint's column count
 * (about 28 across x 14 down at 54px). Overflow is clipped, so covering the
 * worst case costs nothing, while coming up short would expose a bare strip
 * mid-drift.
 */
const WALL_TILE_COUNT = 384;

export function MarksWall({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn(
        "pointer-events-none absolute inset-x-0 -top-[8%] -bottom-[12%] overflow-hidden",
        className,
      )}
    >
      <div
        data-mkt-wall
        // The track list is an INLINE style rather than a class: auto-fill
        // holds the density constant at every width with no breakpoints to
        // keep in sync, which is what this wall actually wants (density is the
        // design constant here, not the column count).
        //
        // ! If the marks ever render as giant blobs or empty squares while you
        //   are working on this, suspect the SERVER before the CSS. Orphaned
        //   next-server processes survive a preview restart and keep serving a
        //   bundle built before your file existed, which looks exactly like
        //   Tailwind refusing to generate your classes. `pkill -f next-server`,
        //   then start one server. (Cost the careers round a long detour;
        //   written up in docs/systems/testing-verification.md.)
        style={{ gridTemplateColumns: "repeat(auto-fill, minmax(54px, 1fr))" }}
        className="grid h-[130%] w-full gap-[3px] p-[3px]"
      >
        {Array.from({ length: WALL_TILE_COUNT }, (_, i) => (
          // NO plate and NO ring on the cell: an earlier pass gave each tile a
          // faint fill plus a hairline, and the BOXES became the texture while
          // the marks disappeared inside them. The marks are the texture.
          //
          // The per-tile opacity wobble is what stops it reading as wallpaper:
          // a flat field of one sequence repeats visibly in rows. It is a pure
          // function of the index (never Math.random) so the server and the
          // client agree and the pattern is stable across renders.
          <span
            key={i}
            className="aspect-square p-[17%] text-foreground"
            style={{ opacity: WALL_OPACITIES[i % WALL_OPACITIES.length] }}
          >
            <Mark kind={WALL_SEQUENCE[i % WALL_SEQUENCE.length]} />
          </span>
        ))}
      </div>
    </div>
  );
}
