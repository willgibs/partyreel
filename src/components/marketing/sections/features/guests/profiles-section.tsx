import { UserPlus } from "lucide-react";
import type { CSSProperties } from "react";

import { Eyebrow } from "@/components/marketing/system/eyebrow";
import { MediaSplit } from "@/components/marketing/system/media-split";
import { MonoCaption } from "@/components/marketing/system/mono-caption";
import { Reveal } from "@/components/marketing/system/reveal";
import { SectionShell } from "@/components/marketing/system/section-shell";

/**
 * /features/guests paper section 2: PROFILES & FOLLOWING. A quiet /u/[slug]
 * profile-card mock (the real Follow control's strings, the real "Show on my
 * profile" opt-in wording) beside the growth loop made human. The copy keeps
 * the OPT-IN framing load-bearing: profiles are optional, nothing is public
 * until a guest claims a handle, and attended events appear only when chosen.
 */

export function ProfilesSection() {
  const rise = (i: number) => ({
    "data-mkt-reveal": "",
    style: { "--i": i } as CSSProperties,
  });

  return (
    <SectionShell>
      <MediaSplit
        mediaSide="end"
        media={
          <Reveal
            aria-hidden
            data-mkt-reveal
            className="mx-auto w-full max-w-xs"
            style={{ "--i": 0 } as CSSProperties}
          >
            <div className="rounded-2xl border bg-card p-6 shadow-[var(--shadow-float)]">
              <div className="flex flex-col items-center gap-2 text-center">
                <span className="grid size-14 place-items-center rounded-full bg-muted font-heading text-xl">
                  M
                </span>
                <p className="font-heading text-xl">Maya</p>
                <MonoCaption>partyreel.com/u/maya</MonoCaption>
                {/* The real /u/[slug] follow control's resting state. */}
                <span className="mt-1 inline-flex h-9 items-center gap-1.5 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground">
                  <UserPlus className="size-4" />
                  Follow
                </span>
              </div>
              <div className="mt-5 border-t pt-4">
                <p className="text-xs font-medium tracking-[0.14em] text-muted-foreground uppercase">
                  Events
                </p>
                <p className="mt-2.5 text-sm font-medium">
                  Maya &amp; Jay&rsquo;s Wedding
                </p>
                <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
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
            className="font-heading text-3xl text-balance sm:text-4xl"
          >
            One name across every party, if you want it.
          </h2>
          <p {...rise(2)} className="text-pretty text-muted-foreground">
            Profiles are optional and opt-in. Claim a handle and you get a
            public page that carries your name from event to event; skip it and
            nothing about you is public at all.
          </p>
          <p {...rise(3)} className="text-pretty text-muted-foreground">
            Follow the hosts and the people you met, and the next album finds
            you. An event shows up on a profile only when that guest chose to
            show it. The people you partied with, findable next time, on their
            terms.
          </p>
        </Reveal>
      </MediaSplit>
    </SectionShell>
  );
}
