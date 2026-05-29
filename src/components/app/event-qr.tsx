"use client";

import { useRef } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Download, ExternalLink } from "lucide-react";

import { Button } from "@/components/ui/button";

type EventQrProps = {
  /** The guest join URL the QR encodes (…/e/<qr_token>). */
  joinUrl: string;
  eventName: string;
};

function slugify(name: string): string {
  return (
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "event"
  );
}

// Renders the scannable join QR + open/download affordances. QRCodeSVG works on
// React 19 and forwards className/style straight to the <svg>. We keep it on a
// solid white tile (not theme tokens) so contrast stays valid for scanners in
// dark mode. marginSize={4} is the spec's required quiet zone — without it some
// readers won't lock on.
export function EventQr({ joinUrl, eventName }: EventQrProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  function downloadSvg() {
    const svg = containerRef.current?.querySelector("svg");
    if (!svg) return;
    const serialized = new XMLSerializer().serializeToString(svg);
    const blob = new Blob([serialized], {
      type: "image/svg+xml;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${slugify(eventName)}-qr.svg`;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <div ref={containerRef} className="rounded-lg bg-white p-4">
        <QRCodeSVG
          value={joinUrl}
          size={200}
          level="M"
          marginSize={4}
          title={`Join QR code for ${eventName}`}
        />
      </div>
      <div className="flex gap-2">
        <Button variant="outline" size="sm" asChild>
          <a href={joinUrl} target="_blank" rel="noopener noreferrer">
            <ExternalLink /> Open
          </a>
        </Button>
        <Button variant="outline" size="sm" onClick={downloadSvg}>
          <Download /> Download
        </Button>
      </div>
    </div>
  );
}
