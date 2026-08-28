import { AtSign, Clapperboard, Lock, Video } from "lucide-react";
import type { CSSProperties } from "react";

import { Reveal } from "@/components/marketing/system/reveal";
import { SectionShell } from "@/components/marketing/system/section-shell";
import {
  MAX_REEL_SECONDS,
  planById,
} from "@/lib/constants/tiers";
import { MAX_UPLOAD_BYTES } from "@/lib/media/limits";
import { formatBytes } from "@/lib/utils";

/**
 * "Where Free ends" (the Portrait-style unlock grid): the four capabilities that
 * are the actual paid wall, each as a big-picture benefit with the Free state
 * named quietly underneath (the third text tone, Will's note 2). Positive
 * framing, honest floor: no capability is invented and no Free restriction is
 * hidden. Numbers derive from tiers.ts / limits.ts.
 */

export function UnlockGrid() {
  const pass = planById("event_pass");
  const tiles = [
    {
      icon: Video,
      title: "Video uploads",
      body: `Guests add clips straight to the album, up to ${formatBytes(MAX_UPLOAD_BYTES)} per file.`,
      freeLine: "Free is photos only.",
    },
    {
      icon: Clapperboard,
      title: `The ${MAX_REEL_SECONDS.pro}-second cut`,
      body: "Twice the reel, and the small mark comes off your renders.",
      freeLine: `Free reels run ${MAX_REEL_SECONDS.free} seconds with a small mark.`,
    },
    {
      icon: Lock,
      title: "Locks and custom links",
      body: "Password-protect the album and name your link.",
      freeLine: "Free shares the standard link, no password.",
    },
    {
      icon: AtSign,
      title: "Your host page",
      body: "Claim /u/you and put every event you host in one public place.",
      freeLine: "Free hosts stay unlisted.",
    },
  ];

  return (
    <SectionShell
      eyebrow="Upgrade"
      heading="Where Free ends and paid begins."
      subhead={`Everything below comes with Pro and the ${pass.name} alike.`}
    >
      <Reveal className="mx-auto mt-12 grid max-w-5xl grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {tiles.map((tile, i) => (
          <div
            key={tile.title}
            data-mkt-reveal
            style={{ "--i": i + 3 } as CSSProperties}
            className="flex flex-col gap-3 rounded-2xl border bg-card/40 p-5"
          >
            <span className="inline-flex size-9 items-center justify-center rounded-lg border text-muted-foreground">
              <tile.icon className="size-4" strokeWidth={1.75} />
            </span>
            <div className="flex flex-1 flex-col gap-1.5">
              <h3 className="font-heading text-base">{tile.title}</h3>
              <p className="text-sm text-pretty text-muted-foreground">
                {tile.body}
              </p>
            </div>
            <p className="text-xs text-muted-foreground/60">{tile.freeLine}</p>
          </div>
        ))}
      </Reveal>
    </SectionShell>
  );
}
