import { UserPlus } from "lucide-react";
import type { CSSProperties } from "react";

import { LearnMoreLink } from "@/components/marketing/sections/shared/learn-more-link";
import { Eyebrow } from "@/components/marketing/system/eyebrow";
import { MediaSplit } from "@/components/marketing/system/media-split";
import { Caption } from "@/components/marketing/system/caption";
import { Reveal } from "@/components/marketing/system/reveal";
import { SectionShell } from "@/components/marketing/system/section-shell";

/**
 * /features/guests paper section 2: PROFILES & FOLLOWING. A quiet /u/[slug]
 * profile-card mock (the real Follow control's strings) beside the growth loop
 * made human.
 *
 * ★ THE SENTENCE WAS THE THING THAT MOVED (Will, `named=everyone`,
 * 2026-09-19). This page used to promise that skipping a handle kept you
 * invisible while the product named every signed-in uploader on the album, and
 * exactly one of the two had to change. His reasoning for keeping the product
 * as it is: "We want guests to be able to easily bypass deeper account creation
 * (like handles/public page) to get to the event and upload, so only displaying
 * with a handle is bad versus all guests who upload... You're only shown as a
 * guest by uploading, and photos require attribution, so it doesn't make sense
 * for someone to want to upload but not be on the guest list." So the promise
 * below is the true one: a handle buys a PAGE, not invisibility.
 *
 * ★ AND THE MOCK IS THE SHIPPED PAGE AGAIN. The card used to draw a separate
 * "Also at" list because the page did; since `made-of=covers` the page is one
 * group of event cards with a Host or Guest mark on each, and a marketing mock
 * that shows a section the product no longer has is a lie with a screenshot.
 */

/** Art-directed fixtures in the Maya & Jay family (no real people or events):
 *  one party Maya hosted and one she only went to, which is what makes "one
 *  name across every party" visible rather than merely claimed. */
const PARTIES: { name: string; role: "Host" | "Guest" }[] = [
  { name: "Maya & Jay’s Wedding", role: "Host" },
  { name: "Priya’s 30th", role: "Guest" },
];

export function ProfilesSection() {
  const rise = (i: number) => ({
    "data-mkt-reveal": "",
    style: { "--i": i } as CSSProperties,
  });

  return (
    // R4 / review B15: same densify pass as the guest-list section — the card
    // was a max-w-xs sliver floating in a tall white section. It carries the
    // profile page's real body (one marked group, none of it openable from
    // here, exactly as shipped) and the chapter runs a rhythm step tighter.
    <SectionShell className="py-16 sm:py-20">
      <MediaSplit
        className="lg:items-start"
        mediaSide="end"
        media={
          <Reveal
            aria-hidden
            data-mkt-reveal
            className="mx-auto w-full max-w-sm"
            style={{ "--i": 0 } as CSSProperties}
          >
            <div className="rounded-2xl border bg-card p-6">
              <div className="flex flex-col items-center gap-2 text-center">
                <span className="grid size-16 place-items-center rounded-full border bg-muted font-heading text-2xl">
                  M
                </span>
                <p className="font-heading text-xl">Maya</p>
                <Caption>partyreel.com/u/maya</Caption>
                {/* The real /u/[slug] follow control's resting state. */}
                <span className="mt-1 inline-flex h-9 items-center gap-1.5 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground">
                  <UserPlus className="size-4" />
                  Follow
                </span>
              </div>
              {/* One group with a mark per row, as the page ships: hosted and
                  attended together, and nothing a viewer can open from here
                  (attendance is not a capability grant). */}
              <div className="mt-5 border-t pt-4">
                <p className="text-xs font-medium tracking-[0.14em] text-muted-foreground uppercase">
                  Events
                </p>
                <ul className="mt-2.5 divide-y">
                  {PARTIES.map((party) => (
                    <li
                      key={party.name}
                      className="flex items-center justify-between gap-3 py-2"
                    >
                      <span className="min-w-0 truncate text-sm">
                        {party.name}
                      </span>
                      <span className="shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                        {party.role}
                      </span>
                    </li>
                  ))}
                </ul>
                <p className="mt-2.5 text-xs leading-relaxed text-muted-foreground">
                  Only the events Maya chose to show.
                </p>
              </div>
            </div>
          </Reveal>
        }
      >
        <Reveal className="flex flex-col gap-4">
          <Eyebrow {...rise(0)}>Profiles &amp; following</Eyebrow>
          <h2
            {...rise(1)}
            className="font-heading text-section text-balance"
          >
            One name across every party, if you want it.
          </h2>
          <p {...rise(2)} className="text-pretty text-muted-foreground">
            Claim a handle and you get a public page that carries your name from
            event to event. Skip it and your name still appears on the albums
            you add photos to, with no page behind it.
          </p>
          <p {...rise(3)} className="text-pretty text-muted-foreground">
            Follow the hosts and the people you met, and the next album finds
            you. An event shows up on a profile only when that guest chose to
            show it. The people you partied with, findable next time, on their
            terms.
          </p>
          <div {...rise(4)}>
            <LearnMoreLink href="/features/privacy">
              What stays private
            </LearnMoreLink>
          </div>
        </Reveal>
      </MediaSplit>
    </SectionShell>
  );
}
