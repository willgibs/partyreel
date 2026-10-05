"use client";

import { PhotoSection } from "@/components/shared/backdrop/photo-section";

import { DevicePair, type Probe } from "../device-frames";

/**
 * THE COPY A PLATE SPECIMEN CARRIES. Deliberately NOT a real marketing section: the collector derives a component's
 * specimen route from which library module imports it, so pulling `full-quality.tsx` in here would make the index claim a
 * home-page section lives in the component gallery.
 *
 * The muted line is in it on purpose: over a photograph the plate takes the body copy off the muted tier (the measured
 * rule in photo-section.css), and this is where that is visible rather than described.
 */
function PlateCopy() {
  return (
    <div className="mx-auto max-w-xl px-6 py-12 text-center">
      <p className="text-xs font-medium tracking-[0.14em] text-muted-foreground uppercase">
        The room
      </p>
      {/* A <p>, not a heading: a specimen's own words are not part of the
          library page's outline, and an h3 here lands in its "on this page"
          list once per specimen under the same text. */}
      <p className="mt-3 font-heading text-section">
        The picture changes as you move through it.
      </p>
      <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
        Six photographs, one plate, and a rail at the foot that says where you
        are. Nothing fades: the next one arrives from the side you came from and
        the one underneath stays exactly where it was.
      </p>
    </div>
  );
}

/** The section's frame caption, read off the frame: which source drives it, and the room it takes. */
const readSection: Probe = (root) => {
  const room = root.ownerDocument.querySelector<HTMLElement>(".bkd");
  if (!room) return null;
  const box = room.getBoundingClientRect();
  if (box.width === 0) return null;
  return `${room.getAttribute("data-bkd-source") ?? "?"} source, ${Math.round(box.width)} × ${Math.round(box.height)}`;
};

/** The section at the viewport it is a full-bleed section of: its plates' `sizes="100vw"` is true there. */
const BAND = 480;

/**
 * THE PHOTOGRAPH SECTION, IN A VIEWPORT IT IS FULL-BLEED IN.
 *
 * The section is a page device: every plate says `sizes="100vw"` and loads lazily, which is true of the section it is and
 * false of a box in the Library's column (a laptop's window is wider than the column, so Next warned of every plate,
 * and the first plate on the page is the largest paint and lazy besides). A frame is the viewport the section is
 * full-bleed in, so the claim is true there and the plates are the real ones; one laptop-wide frame draws each, zoomed
 * down to the column.
 *
 * `source` is forced HERE and nowhere else: production asks the reader's own device (a cursor, or a thumb), and this is the
 * only way to put both rules on one screen for a reviewer sitting at a laptop.
 */
export function PhotoSectionDemo({
  source,
  copy = true,
}: {
  source: "pointer" | "scroll";
  /** Whether a plate stands on the photograph: the instance with none is what separates two chapters. */
  copy?: boolean;
}) {
  return (
    <DevicePair
      id={`photo-section-${source}${copy ? "" : "-bare"}`}
      only="desk"
      heights={{ desk: copy ? BAND : 260 }}
      read={readSection}
      scene={() =>
        copy ? (
          <PhotoSection source={source}>
            <PlateCopy />
          </PhotoSection>
        ) : (
          <PhotoSection source={source} className="min-h-56" />
        )
      }
      replay={false}
    />
  );
}
