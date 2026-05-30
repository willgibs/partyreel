"use client";

import { useRef } from "react";
import { Download, ExternalLink } from "lucide-react";

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
  eventName: string;
  /** Resolved preset options (see resolveQrPreset). */
  style: QrStyleOptions;
};

function slugify(name: string): string {
  return (
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "event"
  );
}

// Renders the scannable join QR (styled via the chosen preset) + open/download
// affordances. We keep it on a solid white tile (not theme tokens) so contrast
// stays valid for scanners in dark mode. Download offers SVG (vector — best for
// print) and PNG (universal); the StyledQr instance owns the export.
export function EventQr({ joinUrl, eventName, style }: EventQrProps) {
  const qrRef = useRef<StyledQrHandle>(null);
  const filename = `${slugify(eventName)}-qr`;

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="rounded-lg bg-white p-4">
        <StyledQr ref={qrRef} value={joinUrl} size={200} style={style} />
      </div>
      <div className="flex gap-2">
        <Button variant="outline" size="sm" asChild>
          <a href={joinUrl} target="_blank" rel="noopener noreferrer">
            <ExternalLink /> Open
          </a>
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              <Download /> Download
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={() => qrRef.current?.download(filename, "svg")}
            >
              SVG — best for print
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => qrRef.current?.download(filename, "png")}
            >
              PNG — image
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
