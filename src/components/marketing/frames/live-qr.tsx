"use client";

import Link from "next/link";

import { StyledQr } from "@/components/app/styled-qr";
import { resolveQrPreset } from "@/lib/constants/qr-presets";

// The real, SCANNABLE demo QR for marketing — used by QrFrame when a demo is
// configured (lib/demo.ts `DEMO_EVENT_URL`). Wraps the app's StyledQr (client-only;
// qr-code-styling touches window on construct). The QR graphic is decorative; the
// Link carries the accessible name. The "bold" preset keeps black data on white with
// brand-tinted finder corners (scanner-safe + matches the decorative QrFrame look).
export function LiveQr({
  url,
  caption,
  className,
}: {
  url: string;
  caption: string;
  className?: string;
}) {
  return (
    <Link href={url} aria-label="Try the live demo" className={className}>
      <div className="flex w-full max-w-[260px] flex-col items-center gap-3 rounded-2xl border bg-card p-6 ring-1 ring-foreground/5 transition-transform duration-150 active:scale-[0.99]">
        <div className="rounded-lg bg-white p-2">
          <StyledQr value={url} size={160} style={resolveQrPreset("bold")} />
        </div>
        <span className="text-sm font-medium text-foreground">{caption}</span>
      </div>
    </Link>
  );
}
