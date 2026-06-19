import Link from "next/link";
import { CalendarPlus } from "lucide-react";

import { Button } from "@/components/ui/button";

// The "photographic promise" ghost pack (Phase 4), reused as faint 16:10 CARD
// ghosts so the empty Events section reads as "your events land HERE", not a void.
const GHOSTS = Array.from({ length: 6 }, (_, i) => `/guest-ghost/g0${i + 1}.webp`);

/**
 * The Events-section create-first HERO teaser (Phase 5 S2b): shown when a host
 * has NO events at all (none created AND none saved). Rescoped from a whole-page
 * empty state to the section, so the single feed always renders — a brand-new
 * account sees this hero + the Uploads/Likes slim teasers beneath, never a void.
 * Create is always enabled here (zero events = below every tier's cap).
 */
export function EventsEmptyTeaser() {
  return (
    <div className="relative">
      <div
        aria-hidden
        className="grid grid-cols-2 gap-3 opacity-25 grayscale sm:grid-cols-3 [content-visibility:auto]"
      >
        {GHOSTS.map((src) => (
          // eslint-disable-next-line @next/next/no-img-element -- tiny local decorative asset
          <img
            key={src}
            src={src}
            alt=""
            loading="lazy"
            className="aspect-[16/10] w-full rounded-xl object-cover"
          />
        ))}
      </div>
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 px-6 text-center">
        <div className="space-y-1.5">
          <h2 className="font-heading text-2xl text-balance">Your events land here</h2>
          <p className="mx-auto max-w-sm text-sm text-muted-foreground">
            Create an event and your guests add photos and videos in seconds. No
            app, no account, just a QR code.
          </p>
        </div>
        <Button asChild size="lg">
          <Link href="/dashboard/new">
            <CalendarPlus /> Create your first event
          </Link>
        </Button>
      </div>
    </div>
  );
}
