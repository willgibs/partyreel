"use client";

import { forwardRef, type RefObject } from "react";
import { Download } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { StyledQr, type StyledQrHandle } from "@/components/app/styled-qr";
import type { QrStyleOptions } from "@/lib/constants/qr-presets";

type EventQrProps = {
  /** The guest join URL the QR encodes (…/e/<qr_token>). */
  joinUrl: string;
  /** Resolved preset options (see resolveQrPreset). */
  style: QrStyleOptions;
};

export function qrFilename(eventName: string): string {
  const slug =
    eventName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "event";
  return `${slug}-qr`;
}

/**
 * THE SCANNABLE CODE, ON ITS PLATE, AND NOTHING ELSE (`hand=same`, Will
 * 2026-09-21: "The shared dialog design could be improved a lot, but this works
 * better than the other two options").
 *
 * It used to carry Open and Download under it, which is how the sheet ended up
 * with a 200 px code and two rows of controls in the middle of it. The verbs
 * moved up into the sheet's own action row where they sit beside Copy and Share;
 * what is left here is the object a guest points a phone at.
 *
 * ★ THE PLATE IS SOLID WHITE, NOT A THEME TOKEN. A scanner rule rather than a
 * palette choice: the host app is dark, and a code that inverts with the theme
 * stops decoding on half the phones at a party.
 *
 * ★ ITS SIZE IS CSS, NOT THE `size` PROP (share.css, `.pr-share-code`). The
 * sheet is full width in a hand and ~416 px at a desk; `size` sets the rendered
 * resolution and the quiet zone the generator bakes in, and one rule scales what
 * it drew to whatever the sheet is carrying — no measuring, no second render. A
 * square viewBox with `height: auto` keeps it square, and a code that is not
 * square does not scan.
 *
 * ★ THE DOWNLOAD MENU IS A SIBLING THAT BORROWS THIS INSTANCE'S REF, because
 * `.download()` is imperative on the `qr-code-styling` object this component
 * owns. Giving the menu its own component and its own second instance would
 * draw a whole second copy of the same code off screen purely to export it.
 */
export const EventQr = forwardRef<StyledQrHandle, EventQrProps>(
  function EventQr({ joinUrl, style }, ref) {
    return (
      <div className="pr-share-code w-full max-w-[360px] rounded-xl bg-white p-3">
        <StyledQr ref={ref} value={joinUrl} size={360} style={style} />
      </div>
    );
  },
);

/** SVG or PNG, off the plate above's own instance. */
export function QrDownloadMenu({
  qrRef,
  eventName,
}: {
  qrRef: RefObject<StyledQrHandle | null>;
  eventName: string;
}) {
  const filename = qrFilename(eventName);
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="text-muted-foreground">
          <Download /> Download the code
        </Button>
      </DropdownMenuTrigger>
      {/* NO TITLE ROW AND NO GROUP, ON PURPOSE. Card is the family's shape
          (Will, 2026-09-17) and its own declared cost is that "a two-row
          menu is suddenly furniture". The trigger says Download and the two
          rows say what you get; a header would repeat the button and a group
          label would name a group of two. The parts are a vocabulary, and
          this menu has nothing more to say. */}
      <DropdownMenuContent align="start">
        <DropdownMenuItem onClick={() => qrRef.current?.download(filename, "svg")}>
          SVG (best for print)
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => qrRef.current?.download(filename, "png")}>
          PNG (best for screens)
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
