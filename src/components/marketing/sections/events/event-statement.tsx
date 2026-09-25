import Image from "next/image";
import type { CSSProperties } from "react";

import { Reveal } from "@/components/marketing/system/reveal";
import { Container } from "@/components/shared/container";
import { eventAlbumSlug, type EventType } from "@/lib/constants/events";
import { marketingImage } from "@/lib/constants/marketing-media";
import { cn } from "@/lib/utils";

import { SharedRoll } from "./event-artifacts";

/**
 * THE SECOND SECTION: ONE CLAIM, ONE VISUAL.
 *
 * `second-section=statement` was chosen, condemning the drawing in the same
 * breath, verbatim: "While this 'one claim, one visual' (doesn't
 * *have* to be picture) section is the selection, the UI could be improved a
 * lot." And the thing it replaces, in his words: "I hate the 'A wedding is the
 * most photographed day of your life...' bland text just beneath the hero with
 * its tag list, for the second section that needs to catch attention after a
 * hero it's doing horribly."
 *
 * So what the board drew (a heading, a paragraph, a bare rounded photograph in
 * a column) is not what ships. Three things changed:
 *
 *  1. THE VISUAL IS AN OBJECT, NOT AN IMAGE BLOCK. A pair of prints, the back
 *     one leaning out from behind the front, in the same paper vocabulary the
 *     hero's object is built from. The page reads as one place that way, and a
 *     rounded rectangle of photograph is the thing every template does.
 *  2. THE LONG TAIL IS A FOOT, NOT A STRAY LINE. The terms sit under a hairline
 *     as the section's own footer, which is what lets them stay small and quiet
 *     and still be the first thing a crawler reads after the claim. Every one
 *     of them survives (that is the SEO the umbrella pages exist for); what
 *     went is the chip row that read as a tag cloud.
 *  3. THE TWO COLUMNS ARE NOT HALVES. Seven and five with a deep gutter, so the
 *     claim has a real measure and the object is a companion rather than the
 *     other half of a split.
 *
 * ★ THE VISUAL NEED NOT BE A PHOTOGRAPH, and on two pages it is not. The design
 * says so out loud, and `events.ts` carries the call as data: `media.statement`
 * is a pair of stills on the types the manifest has honest subjects for, and
 * null on conferences and trips, where the PRODUCT stands there instead. That
 * is the more honest picture on both (a conference organiser is buying the feed
 * filling, not a room) and it keeps two objects from being the same object
 * twice down one page.
 *
 * ★ THE SIZES ARE HIS. The claim rides the `chapter` step; the quiet line stays
 * at 18 ("On desktop, hero sub maybe 20-22 and opening stays 18"), which is
 * `text-lg` and deliberately NOT the subhead step the hero's own line moved to.
 */

const seat = (i: number) => ({ "--i": i }) as CSSProperties;

/**
 * The pair of prints. The back one is rotated the other way and sits proud of
 * the front's top-right corner: two prints squared up are a grid, two prints
 * leaning apart are a pile somebody put down.
 *
 * ★ THE PAPER IS WHITE, never `bg-card`. This section stands on the cinema
 * ground where the card token is near-black, so a border in it is a gap and the
 * print stops being a print (the same note is on `event-object.tsx`'s `Print`,
 * which this deliberately matches: one paper vocabulary down the whole page).
 */
function StatementPrints({ stills }: { stills: readonly string[] }) {
  const [front, back] = stills;
  return (
    <div
      aria-hidden
      className="relative mx-auto w-full max-w-[380px] pt-8 pr-8"
    >
      <span className="absolute top-0 right-0 block w-[58%] rotate-[7deg] overflow-hidden rounded-xl bg-white p-2 shadow-lift ring-1 ring-black/10">
        <span className="relative block aspect-4/5 overflow-hidden rounded-md">
          <Image
            src={marketingImage(back).src}
            alt=""
            fill
            sizes="(min-width: 1024px) 220px, 40vw"
            className="object-cover"
          />
        </span>
      </span>
      <span className="relative block -rotate-[3deg] overflow-hidden rounded-xl bg-white p-2.5 shadow-lift ring-1 ring-black/10">
        <span className="relative block aspect-4/5 overflow-hidden rounded-lg">
          <Image
            src={marketingImage(front).src}
            alt=""
            fill
            sizes="(min-width: 1024px) 380px, 80vw"
            className="object-cover"
          />
        </span>
      </span>
    </div>
  );
}

export function EventStatement({
  type,
  className,
}: {
  type: EventType;
  className?: string;
}) {
  const prints = type.media.statement;
  return (
    <section className={cn("py-20 sm:py-24", className)}>
      <Container>
        <Reveal className="grid items-center gap-12 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-7">
            <h2
              data-mkt-reveal
              className="font-heading text-chapter text-balance"
              style={seat(0)}
            >
              {type.statement.claim}
            </h2>
            <p
              data-mkt-reveal
              className="mt-6 max-w-xl text-copy text-pretty text-muted-foreground"
              style={seat(1)}
            >
              {type.statement.line}
            </p>
            {/* The umbrella's long tail, kept whole and kept quiet: one running
                line under a hairline, which is the shape a footnote has. The
                chip row it replaces wrapped 6 + 1 on the wider types and read
                as a tag cloud either way (A25). */}
            <div
              data-mkt-reveal
              className="mt-10 max-w-xl border-t pt-4"
              style={seat(2)}
            >
              <p className="text-xs font-medium tracking-[0.06em] text-faint">
                {type.nestedThemes.join(" · ")}
              </p>
            </div>
          </div>
          <div data-mkt-reveal className="lg:col-span-5" style={seat(3)}>
            {prints ? (
              <StatementPrints stills={prints} />
            ) : (
              // The product as the visual. The album wears this type's own
              // name (never a second one invented here), and the tiles are
              // whatever honest stills it owns, falling back to its card's
              // stand-in so no cell is ever an empty plate.
              <SharedRoll
                title={type.albumName}
                slug={eventAlbumSlug(type.albumName)}
                stills={
                  type.media.object.length > 0
                    ? type.media.object
                    : [type.media.card]
                }
              />
            )}
          </div>
        </Reveal>
      </Container>
    </section>
  );
}
