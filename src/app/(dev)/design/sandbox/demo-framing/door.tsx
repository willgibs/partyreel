"use client";

import { Link2 } from "lucide-react";
import { useMemo } from "react";

import {
  DOOR_FOOT,
  DOOR_MAIN,
  DoorColumn,
  DoorWords,
} from "@/components/guest/door/door-page";
import { Doorway } from "@/components/guest/door/doorway";
import { RoleWords } from "@/components/guest/door/welcome";
import { LiveDot } from "@/components/marketing/system/demo-modal/demo-door";
import { Logo } from "@/components/shared/logo";
import { Button } from "@/components/ui/button";
import { marketingImage } from "@/lib/constants/marketing-media";
import { HOUSE_HUES, hueOfOklch } from "@/lib/guest/door-light";
import { useSampledPalette } from "@/lib/shared/sampled-palette";

import { ALBUM, DEMO_HOST, DEMO_SLUG, DOMAIN, type Person } from "./fixtures";

/**
 * THE DEMO'S DOOR, THREE IDENTITIES (the `door` decision), each in the
 * doorway as production now draws it (door-wiring, `locked-door` r2's
 * `family=doorway`): the real `Doorway` open onto the demo album, its light the
 * album's own, the real door column and words under it, and the way in.
 *
 * His note on the address: "the demo's welcome door specifically should
 * likely avoid this event title, can keep slug but maybe clearer name like
 * 'Partyreel Demo' or 'Example Party' or just a custom demo door in general
 * ... there'd be friction if the demo is unclear overall and they land on a
 * generic 'Our party' name." So the address stays `our-party` in all three,
 * and what changes is what the door says the visitor has walked into:
 *
 *  - `brand`: Partyreel Demo, the name the demo event carries today (its
 *    seed's default), in production's own demo words (`RoleWords`): "A live
 *    demo", "You're a guest at Partyreel Demo";
 *  - `example`: the same words round a party plainly said to be a sample,
 *    Example Party;
 *  - `own`: a door of the demo's own, in the door's own grammar
 *    (`DoorWords`): it speaks as Partyreel, once, and names the visitor's part
 *    rather than a party (their guests start here, through the link they came
 *    in by); the album behind it keeps its party's name.
 *
 * ★ EVERY OPTION'S HOST IS THE DEMO'S PERSONA (round one's carried `host`),
 * never Will's own account, which is who hosts the demo today.
 *
 * ★ THE LIGHT IS THE ALBUM'S, SAMPLED OFF THE FOUR PHOTOGRAPHS THE DOOR SHOWS,
 * with production's sampler, the house five until it lands, as the real
 * door's light is; handed to the `Doorway` as its props, never through the
 * door's module store, which every frame on the board would share.
 */

export type DoorId = "brand" | "example" | "own";

type Identity = {
  /** The name at the album's head behind the door, and on the door where it names one. */
  readonly album: string;
  readonly albumHost: Person;
};

export const DOORS: Record<DoorId, Identity> = {
  brand: { album: "Partyreel Demo", albumHost: DEMO_HOST },
  example: { album: "Example Party", albumHost: DEMO_HOST },
  own: { album: "Our party", albumHost: DEMO_HOST },
};

/** The album's light, off the four photographs the door shows. */
function useAlbumHues(srcs: readonly string[]): readonly number[] {
  const colors = useSampledPalette(srcs, "dark");
  return useMemo(() => {
    const list = (colors ?? [])
      .map(hueOfOklch)
      .filter((h): h is number => h !== null);
    return list.length >= 3 ? list : HOUSE_HUES;
  }, [colors]);
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

/**
 * A DOOR OF THE DEMO'S OWN, in the door's grammar: the live demo's eyebrow
 * with its live dot (the sign every other door to the demo wears), the
 * visitor's part as the headline, the link they came in by in the byline's
 * place, two lines, and the way in.
 */
function OwnWords() {
  return (
    <div data-welcome-step="" className="flex w-full flex-col items-center">
      <DoorWords
        eyebrow={
          <>
            <LiveDot />A live demo
          </>
        }
        title="Your guests start here"
        titleAs="h1"
        byline={
          <p className="flex items-center justify-center gap-1.5 text-working text-muted-foreground">
            <Link2 aria-hidden className="size-3.5" />
            <span>
              {DOMAIN}
              <span className="font-medium text-foreground">{DEMO_SLUG}</span>
            </span>
          </p>
        }
        lines={[
          "Every guest who scans your code walks through this door.",
          "Step in as one of them and add a photo. Nothing you add is saved.",
        ]}
      />
      <div className={DOOR_FOOT}>
        <Button size="cta" className="w-full" tabIndex={-1}>
          Step in
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
  );
}

export function DemoDoor({ door }: { door: DoorId }) {
  const srcs = useMemo(
    () => ALBUM.through.map((id) => marketingImage(id).src),
    [],
  );
  const hues = useAlbumHues(srcs);
  return (
    <div
      data-df-door={door}
      className="flex min-h-svh flex-col bg-background text-foreground"
    >
      <DoorTop />
      <main className={DOOR_MAIN}>
        <DoorColumn
          doorway={<Doorway state="open" hues={hues} photos={srcs} />}
        >
          {door === "own" ? (
            <OwnWords />
          ) : (
            <RoleWords
              eventName={DOORS[door].album}
              hostName={DOORS[door].albumHost.name}
            />
          )}
        </DoorColumn>
      </main>
    </div>
  );
}
