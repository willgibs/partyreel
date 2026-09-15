"use client";

import { useRef, useState } from "react";

import { cn } from "@/lib/utils";

/**
 * A MAGNIFIER OVER A SPECIMEN, for the differences a board argues about that
 * are smaller than the eye at arm's length: a two pixel corner, a hairline
 * border, the join where two tiles meet.
 *
 * ★ IT MAGNIFIES A COPY, NOT THE SPECIMEN. The obvious build is a `transform:
 * scale` on the thing itself under a clip, and it is wrong twice: scaling the
 * judged element changes the judged element (a 4px corner scaled 4x is a 16px
 * corner, which is not what ships), and a transform creates a containing block
 * that re-parents any fixed child. So the children are rendered TWICE, and only
 * the second copy, inert and aria-hidden, is scaled.
 *
 * ★ AND IT SNAPS TO THE DEVICE PIXEL. `image-rendering: pixelated` on the
 * magnified copy is what makes a 1px difference visible as a step rather than
 * as a soft gradient; a smoothed magnification of a hairline looks like a
 * thicker hairline, which is the opposite of the finding.
 *
 * Hover only, and never the only way to see a difference: a board whose whole
 * claim needs a loupe to be visible should say so in its verdict rather than
 * hide the admission behind an interaction.
 */
export function Loupe({
  zoom = 4,
  size = 160,
  children,
  className,
}: {
  zoom?: number;
  /** The lens diameter in CSS pixels. */
  size?: number;
  children: React.ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [at, setAt] = useState<{ x: number; y: number } | null>(null);

  return (
    <div
      ref={ref}
      className={cn("relative min-w-0", className)}
      onPointerMove={(e) => {
        const box = ref.current?.getBoundingClientRect();
        if (!box) return;
        setAt({ x: e.clientX - box.left, y: e.clientY - box.top });
      }}
      onPointerLeave={() => setAt(null)}
    >
      {children}
      {at ? (
        <div
          aria-hidden
          className="pointer-events-none absolute overflow-hidden rounded-full"
          style={{
            width: size,
            height: size,
            left: at.x - size / 2,
            top: at.y - size / 2,
            outline: "1px solid var(--foreground)",
            imageRendering: "pixelated",
          }}
        >
          <div
            className="absolute top-0 left-0 origin-top-left"
            style={{
              transform: `scale(${zoom}) translate(${size / 2 / zoom - at.x}px, ${size / 2 / zoom - at.y}px)`,
            }}
          >
            {children}
          </div>
        </div>
      ) : null}
    </div>
  );
}
