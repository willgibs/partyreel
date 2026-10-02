"use client";

import "./lit.css";

import {
  useEffect,
  useId,
  useRef,
  type CSSProperties,
  type ReactNode,
} from "react";
import type { LucideIcon } from "lucide-react";

import { useDoorView } from "@/components/guest/door/album-view";
import {
  DOOR_MAIN,
  DoorColumn,
  DoorWords,
} from "@/components/guest/door/door-page";
import { Doorway, type DoorwayState } from "@/components/guest/door/doorway";
import { Button } from "@/components/ui/button";
import { formatMediaCount } from "@/lib/format/count";
import { HOUSE_HUES, useDoorHues, useLampLit } from "@/lib/guest/door-light";
import { cn } from "@/lib/utils";

/**
 * THE STAGE: THE DOOR AS THE ALBUM'S PAGE (`locked-door` r2, Will's `shape=shared`: "one design for every
 * state; only the words and the light change"). The welcome, the ask, the wait and the moment she is let
 * in are not steps in a sheet over the album any more: each is the doorway standing on the page with its
 * words under it, the same door a guest turned away meets (`shut-door.tsx`) and a broken link draws empty
 * (`e/[token]/not-found.screen.tsx`).
 *
 * ★ IT STANDS OVER THE ALBUM, NEVER IN PLACE OF IT. The album keeps its layout under the stage (the
 * light's sample and the reveal's choreography both read it), and the page holds to one screen while the
 * stage is open (`doorway.css`), so nothing scrolls past the door; the album under it is `inert` (the
 * page's to set). At a gate it stands over its own server-drawn twin (`at="gate"`): the door and the
 * album's name in the same place from the first paint, so the stage arrives with no fade and only its
 * words rise.
 *
 * ★ THE ITINERARY'S OTHER STEPS STAY IN THE SHEET (the password, the chooser, the name, the email, the
 * upload, the keep), rising over the album at a Public album she has walked into, and over the door at
 * a gate she is still outside (`RestWords`): the doorway keeps the state above them.
 */

/**
 * THE SCRIM OVER THE DOOR AT A GATE: a light dim with no blur, so the doorway keeps its state above
 * the sheet (shut while she is outside, swinging open on the step's own success). The album's scrim
 * (`DOOR_SCRIM`) blurs what stands behind into the reward; a door is not a reward to blur but a place
 * she is standing at.
 */
export const STAGE_SCRIM =
  "bg-black/20 supports-backdrop-filter:backdrop-blur-none dark:bg-black/45";

/** What the stage's doorway shows: its state, and whether it wears the album's own light. */
export type StageDoor = {
  state: DoorwayState;
  /**
   * The album's own light and its newest photographs through the opening: only where she may see the
   * album (a Public album's welcome, the moment she is let in). Otherwise the house five, and nothing.
   */
  album: boolean;
  /** Where an opening door swings from: the door she waited at swings the rest of the way. */
  from?: "shut" | "ajar";
};

export function DoorStage({
  open,
  at,
  door,
  back,
  focusKey,
  aside = false,
  modal = true,
  className,
  children,
}: {
  open: boolean;
  /** Over a Public album she may see (`album`), or over a gate's own server-drawn door (`gate`). */
  at: "album" | "gate";
  door: StageDoor;
  /** The step's way back (the ask's chevron to the welcome), at the column's top left. */
  back?: ReactNode;
  /**
   * Which words stand on the stage. When they change under her (asked, then waiting, then let in), the
   * new headline takes the focus a pressed button left behind, so a screen reader hears the new door.
   */
  focusKey?: string;
  /**
   * A step of the door's sheet stands beside the door (a gate's password or email): at a desk, where
   * the sheet is a panel from the right edge, the door moves into the room the panel leaves it.
   */
  aside?: boolean;
  /**
   * ★ THE DOOR HOLDS HER, AS THE SHEET DID (a dialog, modal): the album behind it is `inert`, and every
   * surface that waits for "another layer" before it speaks (`ui/layer-is-up.ts`: the claim's own ask,
   * the album's keys and address) sees the door as one. False for the page's own server-drawn twin of
   * a gate's door, which is the page itself before the door's island has arrived.
   */
  modal?: boolean;
  /** The stage's layer, for the page's own server-drawn twin of a gate's door (one step below). */
  className?: string;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const titleId = useId();
  // The door is named by its own headline (whichever words stand on it), as the sheet was by its title.
  useEffect(() => {
    const stage = ref.current;
    if (!stage || !modal) return;
    const title = stage.querySelector<HTMLElement>("h1");
    if (title) {
      if (!title.id) title.id = titleId;
      stage.setAttribute("aria-labelledby", title.id);
    } else {
      stage.removeAttribute("aria-labelledby");
    }
  });
  const lastKey = useRef(focusKey);
  useEffect(() => {
    if (lastKey.current === focusKey) return;
    lastKey.current = focusKey;
    const stage = ref.current;
    if (!stage || !open) return;
    const active = document.activeElement;
    // Only where the focus was hers on this stage (or fell to the page when its button left): a door
    // that changes while she reads elsewhere never pulls her focus.
    if (active && active !== document.body && !stage.contains(active)) return;
    const title = stage.querySelector<HTMLElement>("h1");
    if (!title) return;
    // A headline takes the focus only as the door's own landmark, never as a stop in the tab order.
    if (!title.hasAttribute("tabindex")) title.setAttribute("tabindex", "-1");
    title.focus({ preventScroll: true });
  }, [focusKey, open]);

  return (
    <div
      ref={ref}
      data-door-stage=""
      data-state={open ? "open" : "closed"}
      data-door-stage-at={at}
      data-door-stage-aside={aside ? "" : undefined}
      role={modal && open ? "dialog" : undefined}
      aria-modal={modal && open ? true : undefined}
      inert={!open || undefined}
      className={cn(
        "absolute inset-0 overflow-y-auto overscroll-contain bg-background text-foreground",
        // Over the page's own twin of it, which stands a step below (`EventExperience`'s gate).
        "z-30",
        className,
      )}
    >
      <div className={cn(DOOR_MAIN, "min-h-full")}>
        <div
          data-door-stage-column=""
          className="relative w-full max-w-sm sm:max-w-md"
        >
          {back && <div className="absolute top-0 left-0 z-10">{back}</div>}
          <DoorColumn doorway={<StageDoorway door={door} />}>
            {children}
          </DoorColumn>
        </div>
      </div>
    </div>
  );
}

/** The stage's doorway: the house five, or the album's own light with the album through the opening. */
export function StageDoorway({ door }: { door: StageDoor }) {
  return door.album ? (
    <AlbumDoorway door={door} />
  ) : (
    <Doorway state={door.state} from={door.from} />
  );
}

/**
 * THE DOORWAY IN THE ALBUM'S OWN LIGHT: it registers as a lit lamp (`useLampLit`), which is what lets
 * the album spend a sample on its colour, and shows the album's newest previews through the opening
 * (`album-view.ts`): only ever where she may see the album, which the caller answers.
 */
function AlbumDoorway({ door }: { door: StageDoor }) {
  useLampLit();
  const { hues } = useDoorHues();
  const photos = useDoorView();
  return (
    <Doorway state={door.state} from={door.from} hues={hues} photos={photos} />
  );
}

/**
 * A SMALL GLYPH IN THE DOOR'S EYEBROW, in the door's light (`DoorGlyph`'s look, `lit.css`): the house
 * five at a gate, where nothing of the album may be sampled, so it never borrows a light another album
 * left in the page's store.
 */
export function StageGlyph({
  icon: Icon,
  hue = HOUSE_HUES[0],
}: {
  icon: LucideIcon;
  hue?: number;
}) {
  return (
    <Icon
      aria-hidden
      className="door-glyph size-3 shrink-0"
      style={{ "--glyph-h": hue } as CSSProperties}
    />
  );
}

/**
 * THE DOOR AT REST, AT A GATE: the album's name and what it holds, under the doorway, while a step of the
 * door's sheet (the password, the email) rises over it, and as the page's first paint before any step
 * has arrived. Today's locked page in the doorway's grammar: the name and the count, nothing else of the
 * album (its host, its date, its photographs) and the house light.
 */
export function RestWords({
  eventName,
  mediaTotal = 0,
}: {
  eventName: string;
  mediaTotal?: number;
}) {
  return (
    <DoorWords
      title={eventName}
      titleAs="h1"
      lines={[
        mediaTotal > 0
          ? `${formatMediaCount(mediaTotal)} inside`
          : "This event is private",
      ]}
    />
  );
}

/**
 * "YOU'RE IN", ON THE STAGE: the door she waited at swings the rest of the way open, and its words rise
 * once the leaf has started (the door is the beat's mark here, so no check blooms). What she chose while
 * she waited stands under it, going in (`sending`). Past the slow threshold it says the album is
 * opening; past the watchdog, a way to open it (the refresh always recovers: she is in).
 */
export function StageBeat({
  slow,
  stalled,
  onRetry,
  sending,
}: {
  slow: boolean;
  stalled: boolean;
  onRetry: () => void;
  /** Her choice at the door, going in now (the chooser's own row, `wait-picks.tsx`). */
  sending?: ReactNode;
}) {
  if (stalled) {
    return (
      <div
        data-door-beat="stalled"
        className="flex w-full flex-col items-center"
      >
        <DoorWords
          title="That took longer than it should"
          titleAs="h1"
          lines={[
            "You’re unlocked, the album just didn’t open. Give it one more tap.",
          ]}
        />
        <div className="mt-8 w-full">
          <Button onClick={onRetry} size="cta" className="w-full">
            Open the album
          </Button>
        </div>
      </div>
    );
  }
  return (
    <div
      data-door-beat="in"
      className="flex w-full flex-col items-center"
      // The words wait for the leaf to begin its swing (`doorway.css`'s 250ms), then rise.
      style={{ "--door-line-base": "250ms" } as CSSProperties}
    >
      <DoorWords
        title="You’re in"
        titleAs="h1"
        lines={
          sending
            ? []
            : [
                <span key={slow ? "slow" : "welcome"}>
                  {slow ? "Opening the album" : "Welcome to the party"}
                </span>,
              ]
        }
      />
      {sending && <div className="mt-6 w-full">{sending}</div>}
    </div>
  );
}
