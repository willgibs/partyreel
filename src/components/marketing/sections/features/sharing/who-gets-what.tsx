import { Clapperboard, Lock, Users, type LucideIcon } from "lucide-react";
import type { CSSProperties, ReactNode } from "react";

import { LearnMoreLink } from "@/components/marketing/sections/shared/learn-more-link";
import { Reveal } from "@/components/marketing/system/reveal";
import { SectionShell } from "@/components/marketing/system/section-shell";

/**
 * Sharing page section 4 (paper): the calm clarity block. Three document-style
 * rows: access = originals for everyone, sharing never loosens visibility
 * (crosslink to /features/privacy), and the reel downloads too (/reel). The
 * reel row wears the house --reel violet (the app's universal action color for
 * reel things); the rest stays ink.
 */

const ROWS: {
  icon: LucideIcon;
  tint: string;
  title: string;
  body: string;
  link?: ReactNode;
}[] = [
  {
    icon: Users,
    // R4 / review B13 (icon-colour ruling): hue encodes APP STATE only — green
    // is live/approve/success, amber is review/hide, violet is reel. "Everyone
    // with the link" is none of those, so it reads neutral like Lock does.
    tint: "text-muted-foreground",
    title: "Everyone with the link",
    body: "Whoever can open the album can save from it: one favorite from the lightbox or the whole zip. Guests get the originals, not compressed copies.",
  },
  {
    icon: Lock,
    tint: "text-muted-foreground",
    title: "Only who you chose",
    body: "Sharing never loosens your settings. The album opens exactly as widely as you set it, and the download button reaches no further than the link does.",
    link: (
      <LearnMoreLink href="/features/privacy">
        Who can open the link
      </LearnMoreLink>
    ),
  },
  {
    icon: Clapperboard,
    tint: "text-reel",
    title: "The reel comes home too",
    body: "The highlight reel downloads like everything else: one finished video, ready to keep and repost wherever the group chat lives.",
    link: <LearnMoreLink href="/reel">Meet the reel</LearnMoreLink>,
  },
];

export function WhoGetsWhat() {
  return (
    <SectionShell
      width="narrow"
      eyebrow="Who gets what"
      heading="Access to the album is access to the originals."
    >
      {/* R4 body choreography: --i continues after the header's two slots
          (eyebrow + heading; this section has no subhead). */}
      <Reveal className="mx-auto mt-6 max-w-2xl divide-y">
        {ROWS.map((row, i) => (
          <div
            key={row.title}
            data-mkt-reveal
            className="flex items-start gap-4 py-7"
            style={{ "--i": i + 2 } as CSSProperties}
          >
            <span
              className={`flex size-10 shrink-0 items-center justify-center rounded-lg border ${row.tint}`}
            >
              <row.icon className="size-5" strokeWidth={1.5} />
            </span>
            <div>
              <h3 className="font-heading text-subsection">{row.title}</h3>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                {row.body}
              </p>
              {row.link && <div className="mt-2">{row.link}</div>}
            </div>
          </div>
        ))}
      </Reveal>
    </SectionShell>
  );
}
