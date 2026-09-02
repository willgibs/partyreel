import { Link2, Smartphone, UserRoundCheck, type LucideIcon } from "lucide-react";
import type { CSSProperties } from "react";

import { LearnMoreLink } from "@/components/marketing/sections/shared/learn-more-link";
import { Eyebrow } from "@/components/marketing/system/eyebrow";
import { MediaSplit } from "@/components/marketing/system/media-split";
import { Reveal } from "@/components/marketing/system/reveal";
import { SectionShell } from "@/components/marketing/system/section-shell";

import { EntryPhone } from "./entry-phone";

/**
 * GETTING IN: how a guest reaches the album, the QR page's story told from
 * the album's side, because a visitor landing here first has never seen a
 * code. One phone cycles the three screens a guest actually meets; the three
 * facts answer the questions a host asks next: is there an app, do guests
 * need an account, and is the link the same as the code.
 *
 * ★ The default for a new event is REQUIRE ACCOUNTS ON (tiers.ts, the settings
 * helper). "No app, no account" is the welcome sheet's own line, but on a
 * default event the next tap is the email code, so the fact says so rather
 * than promising "no account by default".
 */

const FACTS: { icon: LucideIcon; title: string; body: string }[] = [
  {
    icon: Smartphone,
    title: "No app, ever",
    body: "The code opens the album in the browser they already have. Point, tap, add.",
  },
  {
    icon: UserRoundCheck,
    title: "One switch decides names",
    body: "Require accounts (on for new events) and guests confirm an email with a one-time code. Switch it off and anyone with the link adds, shown as Anonymous.",
  },
  {
    icon: Link2,
    title: "One link, and it never changes",
    body: "The code is the album link. Scan it, tap it in a chat, or open it later. Pro and Event Pass can name it too.",
  },
];

export function GettingInSection() {
  const rise = (i: number) => ({
    "data-mkt-reveal": "",
    style: { "--i": i } as CSSProperties,
  });

  return (
    <SectionShell>
      <MediaSplit
        className="lg:items-center"
        mediaSide="end"
        media={
          <Reveal
            data-mkt-reveal
            className="w-full"
            style={{ "--i": 0 } as CSSProperties}
          >
            <EntryPhone />
          </Reveal>
        }
      >
        <Reveal className="flex flex-col gap-4">
          <Eyebrow {...rise(0)}>Getting in</Eyebrow>
          <h2
            {...rise(1)}
            className="font-heading text-3xl text-balance sm:text-4xl"
          >
            Scan, and they&rsquo;re in.
          </h2>
          <p {...rise(2)} className="max-w-md text-pretty text-muted-foreground">
            Guests point a camera at the code, land on a welcome screen, and
            start adding. That is the whole onboarding.
          </p>
          <div className="mt-2 flex flex-col gap-5">
            {FACTS.map((fact, i) => (
              <div key={fact.title} {...rise(3 + i)} className="flex gap-3.5">
                <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg border text-muted-foreground">
                  <fact.icon className="size-4" strokeWidth={1.5} />
                </span>
                <div className="flex flex-col gap-1">
                  <h3 className="font-heading text-base">{fact.title}</h3>
                  <p className="max-w-md text-sm leading-relaxed text-muted-foreground">
                    {fact.body}
                  </p>
                </div>
              </div>
            ))}
          </div>
          <div {...rise(6)}>
            <LearnMoreLink href="/features/qr">Inside the QR code</LearnMoreLink>
          </div>
        </Reveal>
      </MediaSplit>
    </SectionShell>
  );
}
