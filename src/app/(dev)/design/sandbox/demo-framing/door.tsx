"use client";

import "./door.css";

import { Link2 } from "lucide-react";
import { type CSSProperties, useMemo } from "react";

import { LiveDot } from "@/components/marketing/system/demo-modal/demo-door";
import { Logo } from "@/components/shared/logo";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { marketingImage } from "@/lib/constants/marketing-media";
import { HOUSE_HUES, hueOfOklch } from "@/lib/guest/door-light";
import { useSampledPalette } from "@/lib/shared/sampled-palette";

import {
  ALBUM,
  DEMO_HOST,
  DEMO_SLUG,
  DOMAIN,
  PARTYREEL_HOST,
  type Person,
} from "./fixtures";
import { stopLinks } from "./scene";

/**
 * THE DEMO'S DOOR, THREE IDENTITIES (the `door` decision), each in the doorway
 * he picked on the door board: the door open onto the demo album, its light
 * the album's own, the words under it, and the way in.
 *
 * His note on the address: "the demo's welcome door specifically should
 * likely avoid this event title, can keep slug but maybe clearer name like
 * 'Partyreel Demo' or 'Example Party' or just a custom demo door in general
 * ... there'd be friction if the demo is unclear overall and they land on a
 * generic 'Our party' name." So the address stays `our-party` in all three,
 * and what changes is what the door says the visitor has walked into:
 *
 *  - `brand`: the demo is named for what it is, Partyreel Demo, hosted by
 *    Partyreel, on its door and at its album's head;
 *  - `example`: a party said plainly to be a sample, Example Party, hosted by
 *    the demo's persona;
 *  - `own`: the door speaks as Partyreel, once, and names the visitor's part
 *    rather than a party: their guests start here, through the link they
 *    came in by. The album behind it keeps its party's name.
 *
 * ★ THE WORDS ARE THE DEMO'S OWN, IN THE DOOR'S GRAMMAR: the eyebrow, the
 * headline at the doorway's size, the byline's place, two lines, and the way
 * in, which is production's demo step (`RoleStep`) moved into the doorway's
 * shape. "Nothing you add is saved" is production's own promise, kept.
 *
 * ★ THE LIGHT IS THE ALBUM'S, SAMPLED OFF THE FOUR PHOTOGRAPHS THE DOOR SHOWS,
 * with production's sampler (`useSampledPalette`), the house five until it
 * lands, as the real door's lamp does.
 */

export type DoorId = "brand" | "example" | "own";

type Identity = {
  readonly eyebrow: string;
  readonly title: string;
  /** Who hosts it, in the byline's place; `own` puts the link there instead. */
  readonly host: Person | null;
  readonly lines: readonly [string, string];
  readonly go: string;
  /** The name at the album's head behind the door. */
  readonly album: string;
  readonly albumHost: Person;
};

export const DOORS: Record<DoorId, Identity> = {
  brand: {
    eyebrow: "You're invited to",
    title: "Partyreel Demo",
    host: PARTYREEL_HOST,
    lines: [
      "A live album, exactly as a guest sees it.",
      "Add a photo the way a guest would. Nothing you add is saved.",
    ],
    go: "Continue",
    album: "Partyreel Demo",
    albumHost: PARTYREEL_HOST,
  },
  example: {
    eyebrow: "You're invited to",
    title: "Example Party",
    host: DEMO_HOST,
    lines: [
      "A live album, exactly as a guest sees it.",
      "Add a photo the way a guest would. Nothing you add is saved.",
    ],
    go: "Continue",
    album: "Example Party",
    albumHost: DEMO_HOST,
  },
  own: {
    eyebrow: "A live demo",
    title: "Your guests start here",
    host: null,
    lines: [
      "Every guest who scans your code walks through this door.",
      "Step in as one of them and add a photo. Nothing you add is saved.",
    ],
    go: "Step in",
    album: "Our party",
    albumHost: DEMO_HOST,
  },
};

/** The album's light, off the four photographs the door shows. */
function useAlbumHues(): readonly number[] {
  const srcs = useMemo(
    () => ALBUM.through.map((id) => marketingImage(id).src),
    [],
  );
  const colors = useSampledPalette(srcs, "dark");
  return useMemo(() => {
    const list = (colors ?? [])
      .map(hueOfOklch)
      .filter((h): h is number => h !== null);
    return list.length >= 3 ? list : HOUSE_HUES;
  }, [colors]);
}

/** The doorway, open, the album seen through it (`door.css`). */
function Doorway({ hues }: { hues: readonly number[] }) {
  return (
    <div
      aria-hidden
      data-df-way
      className="df-way"
      style={
        {
          "--lit-h1": hues[0],
          "--lit-h2": hues[1],
          "--lit-h3": hues[2],
        } as CSSProperties
      }
    >
      <span className="df-way-floor" />
      <span className="df-way-ground" />
      <div className="df-way-frame">
        <div className="df-way-room">
          <span className="df-way-glow df-way-g1" />
          <span className="df-way-glow df-way-g2" />
          <span className="df-way-glow df-way-g3" />
          <div className="df-way-album">
            {ALBUM.through.map((id) => (
              // eslint-disable-next-line @next/next/no-img-element -- a stand-in still seen through the door, as the door board draws it
              <img key={id} src={marketingImage(id).src} alt="" />
            ))}
          </div>
        </div>
        <div className="df-way-leaf">
          <span className="df-way-panel df-way-panel-top" />
          <span className="df-way-panel df-way-panel-low" />
        </div>
      </div>
    </div>
  );
}

/** The guest header as a stranger meets the demo's: the wordmark and its Demo mark. */
function DoorTop() {
  return (
    <header className="relative z-10 flex items-center justify-between gap-2 border-b border-border/60 px-5 py-3">
      <span className="flex items-center gap-2.5">
        <Logo />
        <span className="rounded-full border border-border bg-muted px-2 py-0.5 text-label font-medium text-muted-foreground uppercase">
          Demo
        </span>
      </span>
      <div className="flex h-8 items-center">
        <Button variant="ghost" size="sm" tabIndex={-1}>
          Start for free
        </Button>
      </div>
    </header>
  );
}

export function DemoDoor({ door }: { door: DoorId }) {
  const id = DOORS[door];
  const hues = useAlbumHues();
  return (
    <div
      className="flex min-h-svh flex-col bg-background text-foreground"
      onClickCapture={stopLinks}
    >
      <DoorTop />
      <main className="isolate flex flex-1 flex-col items-center justify-center px-5 py-16">
        <div className="flex w-full max-w-sm flex-col items-center text-center sm:max-w-md">
          <Doorway hues={hues} />
          <div className="mt-10 flex flex-col items-center">
            <p
              data-df-door-eyebrow
              className="flex items-center gap-2 text-label font-medium text-muted-foreground uppercase"
            >
              {door === "own" ? <LiveDot /> : null}
              {id.eyebrow}
            </p>
            <p
              data-df-door-title
              className="mt-1.5 font-heading text-section text-balance"
            >
              {id.title}
            </p>
            <div className="mt-2">
              {id.host ? (
                <p
                  data-df-door-by
                  className="flex items-center justify-center gap-1.5 text-working text-muted-foreground"
                >
                  Hosted by
                  <Avatar seed={id.host.seed} size="sm">
                    <AvatarFallback>{id.host.initial}</AvatarFallback>
                  </Avatar>
                  <span className="font-medium text-foreground">
                    {id.host.name}
                  </span>
                </p>
              ) : (
                <p
                  data-df-door-by
                  className="flex items-center justify-center gap-1.5 text-working text-muted-foreground"
                >
                  <Link2 aria-hidden className="size-3.5" />
                  <span>
                    {DOMAIN}
                    <span className="font-medium text-foreground">
                      {DEMO_SLUG}
                    </span>
                  </span>
                </p>
              )}
            </div>
          </div>
          <div className="mt-3 flex flex-col gap-1.5">
            {id.lines.map((l) => (
              <p
                key={l}
                data-df-door-line
                className="text-base leading-relaxed text-pretty text-muted-foreground"
              >
                {l}
              </p>
            ))}
          </div>
          <div className="mt-8 flex w-full flex-col gap-2">
            <Button size="cta" className="w-full" tabIndex={-1}>
              {id.go}
            </Button>
            <Button
              variant="ghost"
              className="w-full text-muted-foreground"
              tabIndex={-1}
            >
              Start your own
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
