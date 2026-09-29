import type { CSSProperties } from "react";

import { Eyebrow } from "@/components/marketing/system/eyebrow";
import { MediaSplit } from "@/components/marketing/system/media-split";
import { Reveal } from "@/components/marketing/system/reveal";
import { SectionShell } from "@/components/marketing/system/section-shell";

import { GuestListCard } from "./guest-list-card";

/**
 * /features/guests paper section 1: THE GUEST LIST. The card itself (mock +
 * the avatar comb + who sees it) lives in the GuestListCard island; this
 * section is the copy half and the product's truth: every guest who added
 * photos appears, a verified name plain and an unverified one wearing the
 * small mark, and the list shows on the album to everyone who can open it,
 * always, on every plan (Will, event-safety `room=always`). There is no switch
 * to sell: the host's one say in who is on it is the block.
 */

const GUESTS: { name: string; unverified?: boolean }[] = [
  { name: "Maya" },
  { name: "Jay" },
  { name: "Priya" },
  { name: "Sam" },
  { name: "Noor" },
  { name: "Theo", unverified: true },
];

export function GuestListSection() {
  const rise = (i: number) => ({
    "data-mkt-reveal": "",
    style: { "--i": i } as CSSProperties,
  });

  return (
    // R4 / review B15: the chapter read thin: a ~180px card adrift in a ~470px
    // white section. The card carries who sees the list now (and the comb),
    // and the section runs one rhythm step tighter so paper reads dense and
    // confident like the album/curation chapters.
    //
    // THE PAPER CHAPTER'S OPENER (the feature-pages round): THE STRADDLE. The
    // guest list is the one object on this page that belongs to BOTH sides of
    // the cut (it is made in the dark, of the people who were there, and read
    // on the desk the morning after), so at lg+ the card overhangs the cinema
    // -> paper seam, half on the event's dark field, half on the paper. The
    // home album's device, worn by a different object: a card of names, not
    // a browser frame. NEGATIVE MARGIN, not translate (the layout box must
    // really move); relative + z so it paints over the dark it overhangs;
    // the card wears shadow-lift (guest-list-card.tsx) because it overhangs,
    // which is an overlap. Below lg the split stacks and the plain hard cut
    // carries the seam, exactly as home's album does.
    <SectionShell className="py-16 sm:py-20">
      <MediaSplit
        className="lg:items-start"
        media={
          <Reveal
            data-mkt-reveal
            className="relative z-10 mx-auto w-full max-w-md lg:-mt-40"
            style={{ "--i": 0 } as CSSProperties}
          >
            <GuestListCard names={GUESTS} />
          </Reveal>
        }
      >
        <Reveal className="flex flex-col gap-4">
          <Eyebrow {...rise(0)}>The guest list</Eyebrow>
          <h2 {...rise(1)} className="font-heading text-section text-balance">
            See who showed up for the album.
          </h2>
          <p {...rise(2)} className="text-pretty text-muted-foreground">
            Your event page keeps a live list of everyone adding photos, a
            verified name or a marked one. Names and faces, not a spreadsheet,
            so you know who actually filled the album.
          </p>
          <p {...rise(3)} className="text-pretty text-muted-foreground">
            The room sees it too: the list shows on the album for anyone who can
            open it, on every plan. Someone you would rather not see there?
            Block them from the event, and they leave the list and the album in
            one step.
          </p>
        </Reveal>
      </MediaSplit>
    </SectionShell>
  );
}
