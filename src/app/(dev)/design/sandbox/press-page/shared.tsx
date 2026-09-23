import Image from "next/image";
import type { ReactNode } from "react";

import { Frame } from "@/components/lab";
import { PRESS_KIT } from "@/lib/constants/press";
import { BRAND_HEX } from "@/lib/constants/site";
import { cn } from "@/lib/utils";

/**
 * SHARED FURNITURE for every press-page preview: the two-viewport pair
 * (loose-ends' own pattern, copied rather than imported so a board never reaches
 * into another board's directory) and the one fixture name every "a human is
 * named" option reuses.
 */

/** Two real viewports, one above the other: 1440 first, 375 second, both
 *  loaded into a real iframe so a breakpoint or a `vw` step resolves against
 *  the width being judged rather than the lab page's own. */
export function Widths({
  id,
  desktopH,
  phoneH,
  render,
}: {
  id: string;
  desktopH: number;
  phoneH: number;
  render: (mode: "desktop" | "phone") => ReactNode;
}) {
  return (
    <div className="flex min-w-0 flex-col gap-6">
      {(["desktop", "phone"] as const).map((mode) => (
        <Frame
          key={mode}
          id={`pp-${id}-${mode}`}
          w={mode === "desktop" ? 1440 : 375}
          h={mode === "desktop" ? desktopH : phoneH}
          title={mode === "desktop" ? "1440" : "375"}
        >
          {render(mode)}
        </Frame>
      ))}
    </div>
  );
}

/**
 * THE ONE FIXTURE NAME every "named contact" or "founder" option reuses
 * (`a-human`, `the-words`' founder-voice, `the-close`'s naming variant): a
 * single invented person, never a real one, in the house style guest-shape's
 * "Maya & Jay" already set for fixture identities. Kept in one place so a
 * reviewer meets the same name wherever the board names someone at all.
 */
export const FIXTURE_NAME = "Jordan Ellis";
export const FIXTURE_TITLE = "Founder";

/** The literal plate ground colours, PressSheet's own rule (a plate is the
 *  artwork's own ground, never a theme utility): white behind ink-drawn
 *  artwork, ink behind white-drawn artwork. */
const PLATE_PAPER = "#ffffff";
const PLATE_BY_ID: Record<string, string> = {
  "mark-dark": PLATE_PAPER,
  "mark-light": BRAND_HEX,
  "app-icon": PLATE_PAPER,
  qr: PLATE_PAPER,
};

/**
 * FOUR REAL PLATES, SMALL: an abbreviation of PressSheet for the boards that
 * argue about STRUCTURE (`who-for`, `the-arc`) rather than about the sheet's
 * own contents (`the-sheet` owns that decision in full, at real size). Reuses
 * the real kit files rather than colour swatches, so even a compressed
 * preview is the real marks and never a placeholder for them.
 */
export function MiniPlates({ className }: { className?: string }) {
  const ids = ["mark-dark", "mark-light", "app-icon", "qr"];
  return (
    <ul
      className={cn(
        "grid grid-cols-4 gap-[var(--gap-gallery)] rounded-tile bg-border p-[var(--gap-gallery)]",
        className,
      )}
    >
      {ids.map((id) => {
        const asset = PRESS_KIT.find((a) => a.id === id);
        if (!asset) return null;
        return (
          <li
            key={id}
            style={{ background: PLATE_BY_ID[id] }}
            className="relative flex aspect-square items-center justify-center overflow-hidden rounded-tile"
          >
            {asset.format === "svg" ? (
              // eslint-disable-next-line @next/next/no-img-element -- a tiny static press asset preview, exactly press-sheet.tsx's own call.
              <img src={asset.file} alt="" className="size-[50%]" />
            ) : (
              <Image src={asset.file} alt="" width={64} height={64} className="size-[54%]" />
            )}
          </li>
        );
      })}
    </ul>
  );
}

/** A muted, boxed footnote: how every preview marks a fixture as a fixture
 *  (a stand-in name, a placeholder length of copy) without pretending it is
 *  real. Small and out of the way, the same register press-sheet.tsx's own
 *  footnote uses. */
export function FixtureNote({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <p className={cn("mt-3 max-w-xl text-xs text-pretty text-faint", className)}>
      {children}
    </p>
  );
}
