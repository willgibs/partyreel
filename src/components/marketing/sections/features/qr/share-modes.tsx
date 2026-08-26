import { Link2, MonitorPlay, Printer } from "lucide-react";
import type { CSSProperties } from "react";

import { Reveal } from "@/components/marketing/system/reveal";
import { SectionShell } from "@/components/marketing/system/section-shell";

/**
 * /features/qr paper section 2: where the code goes. The three share modes
 * from content/help/customize-and-share-your-qr.mdx (on a screen / printed /
 * as a link), kept as a calm reading trio.
 */

const MODES: {
  icon: typeof Printer;
  title: string;
  body: string;
}[] = [
  {
    icon: MonitorPlay,
    title: "On a screen",
    body: "Put it up on a TV, a projector, or a laptop by the door. Guests scan from their seats between courses.",
  },
  {
    icon: Printer,
    title: "Printed",
    body: "Table cards, a welcome sign, the program. Download PNG or SVG and it slots into whatever the stationery looks like.",
  },
  {
    icon: Link2,
    title: "As a link",
    body: "Copy the join link and text or email it. Tapping it works exactly like scanning, for the one uncle who will not point a camera at anything.",
  },
];

export function ShareModes() {
  return (
    <SectionShell
      eyebrow="Where it goes"
      heading="Three ways in, one album."
      subhead="The code is just the front door. Put it wherever people already look."
    >
      {/* R4 body choreography: --i continues after the SectionShell header's
          three slots so header and cards read as one move. */}
      <Reveal className="mx-auto mt-10 grid max-w-4xl gap-4 sm:grid-cols-3">
        {MODES.map((mode, i) => (
          <div
            key={mode.title}
            data-mkt-reveal
            className="flex flex-col gap-2.5 rounded-xl border bg-card p-5"
            style={{ "--i": i + 3 } as CSSProperties}
          >
            <mode.icon
              className="size-5 text-muted-foreground"
              strokeWidth={1.6}
            />
            <h3 className="font-heading text-lg sm:text-xl">{mode.title}</h3>
            <p className="text-sm leading-relaxed text-muted-foreground">
              {mode.body}
            </p>
          </div>
        ))}
      </Reveal>
    </SectionShell>
  );
}
