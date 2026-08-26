import type { CSSProperties } from "react";

import { Eyebrow } from "@/components/marketing/system/eyebrow";
import { MediaSplit } from "@/components/marketing/system/media-split";
import { Reveal } from "@/components/marketing/system/reveal";
import { SectionShell } from "@/components/marketing/system/section-shell";

/**
 * /features/guests paper section 1: THE GUEST LIST. A calm mock of the host's
 * "Guests" section (the real feed section label) using the shipped GuestList
 * chip shape (avatar + display name in an h-8 pill) and the settings truth:
 * only signed-in uploaders appear, anonymous uploads are never listed, and
 * showing the list ON the album is the host's own switch.
 */

const GUESTS = ["Maya", "Jay", "Priya", "Sam", "Noor", "Alex"];

export function GuestListSection() {
  const rise = (i: number) => ({
    "data-mkt-reveal": "",
    style: { "--i": i } as CSSProperties,
  });

  return (
    <SectionShell>
      <MediaSplit
        media={
          <Reveal
            aria-hidden
            data-mkt-reveal
            className="mx-auto w-full max-w-md"
            style={{ "--i": 0 } as CSSProperties}
          >
            <div className="rounded-2xl border bg-card p-5 shadow-[var(--shadow-float)]">
              <div className="flex items-baseline justify-between">
                {/* "Guests" is the real event-page section label. */}
                <span className="text-xs font-medium tracking-[0.14em] text-muted-foreground uppercase">
                  Guests
                </span>
                <span className="font-mono text-xs text-muted-foreground tabular-nums">
                  {GUESTS.length} signed in
                </span>
              </div>
              <ul className="mt-4 flex flex-wrap gap-1.5">
                {GUESTS.map((name) => (
                  <li
                    key={name}
                    className="flex h-8 items-center gap-2 rounded-full border py-1 pr-3 pl-1 text-sm"
                  >
                    <span className="grid size-6 place-items-center rounded-full bg-muted text-[10px] font-medium">
                      {name[0]}
                    </span>
                    {name}
                  </li>
                ))}
              </ul>
              <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
                Guests who uploaded anonymously are never listed.
              </p>
            </div>
          </Reveal>
        }
      >
        <Reveal className="flex flex-col gap-4">
          <Eyebrow {...rise(0)}>The guest list</Eyebrow>
          <h2
            {...rise(1)}
            className="font-heading text-3xl text-balance sm:text-4xl"
          >
            See who showed up for the album.
          </h2>
          <p {...rise(2)} className="text-pretty text-muted-foreground">
            Your event page keeps a live list of everyone adding photos while
            signed in. Names and faces, not a spreadsheet, so you know who
            actually filled the album.
          </p>
          <p {...rise(3)} className="text-pretty text-muted-foreground">
            Want the room to see it too? One switch shows the guest list on the
            shared album, for anyone who can open it. Until you flip it, the
            list is yours alone.
          </p>
        </Reveal>
      </MediaSplit>
    </SectionShell>
  );
}
