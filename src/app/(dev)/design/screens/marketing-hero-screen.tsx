import Image from "next/image";

import { PHOTOS } from "./sample-photos";

/**
 * Screen 4: the marketing hero, the identity at full volume. Marketing is the
 * one surface allowed to be louder, but the loudness comes from TYPE and the
 * photo fan, never from chrome color: the same nothing-loud policy that rules
 * the app. The photo fan is the pitch itself (this is what your album becomes).
 */
export function MarketingHeroScreen() {
  const fan = [PHOTOS[4], PHOTOS[0], PHOTOS[2], PHOTOS[8], PHOTOS[10]];

  return (
    <div aria-hidden className="overflow-hidden py-10">
      <div className="mx-auto max-w-2xl px-4 text-center">
        <p className="text-[11px] font-medium tracking-[0.18em] text-muted-foreground uppercase">
          The shared camera roll for real life
        </p>
        <h2
          data-dir-display
          className="mt-3 text-4xl leading-[1.08] text-balance sm:text-5xl"
        >
          Every guest is your photographer.
        </h2>
        <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-muted-foreground sm:text-base">
          One QR code on the table. Guests scan it and add their photos and
          videos from their phones, no app and no account. You curate the album
          everyone keeps.
        </p>
        <div className="mt-6 flex items-center justify-center gap-3">
          <button
            data-dir-press
            className="h-11 rounded-[calc(var(--radius)*0.9)] bg-primary px-6 text-sm font-medium text-primary-foreground"
          >
            Start free
          </button>
          <button className="h-11 rounded-[calc(var(--radius)*0.9)] px-4 text-sm font-medium text-muted-foreground">
            See how it works
          </button>
        </div>
      </div>

      {/* The fan: media supplies every drop of color on this page. */}
      <div className="mt-10 flex justify-center">
        <div className="flex -space-x-10">
          {fan.map((src, i) => (
            <div
              key={src}
              className="relative h-44 w-32 shrink-0 overflow-hidden shadow-[0_18px_40px_-18px_rgba(0,0,0,0.45)] sm:h-56 sm:w-40"
              style={{
                borderRadius: "calc(var(--radius) * 1.2)",
                transform: `rotate(${(i - 2) * 4.5}deg) translateY(${Math.abs(i - 2) * 10}px)`,
                zIndex: i === 2 ? 2 : 1,
              }}
            >
              <Image
                src={src}
                alt=""
                fill
                sizes="160px"
                className="object-cover"
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
