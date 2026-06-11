import Image from "next/image";
import { Camera, Images, Smartphone } from "lucide-react";

import { PhoneShell } from "./phone-shell";
import { COVER_PHOTO, EVENT_NAME, PHOTOS } from "./sample-photos";

/**
 * Screen 1: the guest entry moment, phone-framed. A dimmed event page sits
 * behind the welcome card so the modal reads as an invitation INTO something,
 * not a wall. Feature icons are muted in EVERY direction (accent never rides
 * inline iconography; next to nine photographs it competes with the media).
 */
export function EntryModalScreen() {
  return (
    <div aria-hidden className="flex justify-center py-6">
      <PhoneShell>
        {/* The event page behind the modal: gallery already alive. */}
        <div className="absolute inset-0">
          <div className="px-4 pt-12 pb-2">
            <p data-dir-display className="text-lg">
              {EVENT_NAME}
            </p>
            <p className="mt-0.5 text-[11px] text-muted-foreground">
              128 photos & videos
            </p>
          </div>
          <div className="grid grid-cols-3 gap-1 px-4">
            {PHOTOS.slice(0, 9).map((src) => (
              <div
                key={src}
                className="relative aspect-square overflow-hidden"
                style={{ borderRadius: "calc(var(--radius) * 0.6)" }}
              >
                <Image
                  src={src}
                  alt=""
                  fill
                  sizes="110px"
                  className="object-cover"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Scrim + the welcome card. */}
        <div className="absolute inset-0 flex items-end bg-black/45 p-3 backdrop-blur-[2px]">
          <div data-dir-card data-dir-enter className="w-full p-5">
            <div className="relative mx-auto size-14 overflow-hidden rounded-full ring-2 ring-background">
              <Image
                src={COVER_PHOTO}
                alt=""
                fill
                sizes="56px"
                className="object-cover"
              />
            </div>
            <p
              data-dir-display
              className="mt-3 text-center text-xl leading-snug text-balance"
            >
              You&rsquo;re invited to {EVENT_NAME}
            </p>
            <p className="mt-1.5 text-center text-[13px] text-muted-foreground">
              Add your photos and browse everyone&rsquo;s. No app, no account.
            </p>
            <ul className="mt-4 space-y-2.5 text-[13px]">
              <li className="flex items-center gap-3">
                <Camera className="size-4 shrink-0 text-muted-foreground" />
                Add your photos and videos
              </li>
              <li className="flex items-center gap-3">
                <Images className="size-4 shrink-0 text-muted-foreground" />
                See everyone&rsquo;s shots in one place
              </li>
              <li className="flex items-center gap-3">
                <Smartphone className="size-4 shrink-0 text-muted-foreground" />
                Straight from your phone
              </li>
            </ul>
            <button
              data-dir-press
              className="mt-5 h-11 w-full rounded-[var(--radius-action)] bg-primary text-sm font-medium text-primary-foreground"
            >
              Continue
            </button>
            <button className="mt-1.5 h-9 w-full text-[13px] text-muted-foreground">
              Just browsing
            </button>
          </div>
        </div>
      </PhoneShell>
    </div>
  );
}
