import {
  Archive,
  Clapperboard,
  ImageUp,
  MailCheck,
  QrCode,
  Radio,
  Users,
  type LucideIcon,
} from "lucide-react";
import type { CSSProperties } from "react";

import { Reveal } from "@/components/marketing/system/reveal";
import { SectionShell } from "@/components/marketing/system/section-shell";
import { MAX_UPLOAD_BYTES } from "@/lib/media/limits";
import { formatBytes } from "@/lib/utils";

/**
 * "Every plan includes" — the shared floor, so the tiers above never read as a
 * stripped Free vs a complete paid product. A wrapped flex row (the privacy.tsx
 * precedent: seven items never leave an empty grid cell). Every claim is
 * grounded: no guest limit (events.ts: the same QR works for a thousand-person
 * conference), full-res never-watermarked photos, verified-email default,
 * the reel on every tier (PRICING.md), the 30-day trash, the 10 GB file gate.
 */

const ITEMS: { icon: LucideIcon; label: string }[] = [
  { icon: Users, label: "No guest limit" },
  { icon: QrCode, label: "One QR, one link" },
  { icon: Radio, label: "A live album" },
  { icon: ImageUp, label: "Full-res photos, never watermarked" },
  { icon: MailCheck, label: "Verified-email uploads" },
  { icon: Clapperboard, label: "A reel on every plan" },
  { icon: Archive, label: "30-day trash" },
];

export function SharedBand() {
  return (
    <SectionShell
      eyebrow="Always included"
      heading="Every plan carries the whole loop."
      subhead={`Guests scan, upload up to ${formatBytes(MAX_UPLOAD_BYTES)} per file, and watch the album fill. None of that is a paid feature.`}
    >
      <Reveal className="mx-auto mt-10 flex max-w-4xl flex-wrap justify-center gap-3">
        {ITEMS.map((item, i) => (
          <span
            key={item.label}
            data-mkt-reveal
            style={{ "--i": i + 3 } as CSSProperties}
            className="inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm text-muted-foreground"
          >
            <item.icon className="size-4" strokeWidth={1.75} aria-hidden />
            {item.label}
          </span>
        ))}
      </Reveal>
    </SectionShell>
  );
}
