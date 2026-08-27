import type { CSSProperties } from "react";

import { Eyebrow } from "@/components/marketing/system/eyebrow";
import { MediaSplit } from "@/components/marketing/system/media-split";
import { Reveal } from "@/components/marketing/system/reveal";
import { SectionShell } from "@/components/marketing/system/section-shell";

import { GuestListCard } from "./guest-list-card";

/**
 * /features/guests paper section 1: THE GUEST LIST. The card itself (mock +
 * the avatar comb + the live "show on the album" switch) lives in the
 * GuestListCard island; this section is the copy half and the settings truth:
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
    // R4 / review B15: the chapter read thin — a ~180px card adrift in a ~470px
    // white section. The card carries its governing setting now (and the comb),
    // and the section runs one rhythm step tighter so paper reads dense and
    // confident like the album/curation chapters.
    <SectionShell className="py-16 sm:py-20">
      <MediaSplit
        className="lg:items-start"
        media={
          <Reveal
            data-mkt-reveal
            className="mx-auto w-full max-w-md"
            style={{ "--i": 0 } as CSSProperties}
          >
            <GuestListCard names={GUESTS} />
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
