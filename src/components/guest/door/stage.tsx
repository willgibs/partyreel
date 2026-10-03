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
 * light's sample and the walk's landing both read it), and the page holds to one screen while the stage
 * is open (`doorway.css`), so nothing scrolls past the door; the album under it is `inert` (the page's to
 * set).
 *
 * ★ THE FIRST BYTE IS THE DOOR (door-reveal; Will's rule: "the album is never visible before any door/gate
 * that should be encountered first"). The page decides on the server what a newcomer meets first
 * (`entry-steps.ts`'s `doorArrival`), and the stage is in that very HTML (`first`): opaque from the first
 * frame, with no fade of its own, its words rising and its door swinging as it lands. Every gate's door
 * stands the same way.
 *
 * ★ THE WALK THROUGH (`locked-door` r3, `reveal=through`): where the door opens onto the album (a Public
 * album's Continue, the moment she is let in), the stage does not fade: the camera walks through the doorway
 * onto the album's cover (`stage-walk.ts`), and only then goes, in a breath (`walked`).
 *
 * ★ THE ITINERARY'S OTHER STEPS STAY IN THE SHEET (the password, the chooser, the name, the email, the
 * upload, the keep), rising over the album at a Public album she has walked into, and over the door at
 * a gate she is still outside (`RestWords` under it until the sheet rises): the doorway keeps the state
 * above them.
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
   * The album's own light and its cover through the opening: only where she may see the album (a Public
   * album's welcome, the moment she is let in). Otherwise the house five, and nothing.
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
  first = false,
  view,
  phase,
  walk = false,
  walked = false,
  stageRef,
  className,
  children,
}: {
  open: boolean;
  /** Over a Public album she may see (`album`), or at a gate, with nothing of the album behind it (`gate`). */
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
   * the album's keys and address) sees the door as one.
   */
  modal?: boolean;
  /** The page's first byte drew this stage: opaque from the first frame, no fade of its own. */
  first?: boolean;
  /** The album's cover, for the open door's opening (`CoverPicture`): only where `door.album`. */
  view?: ReactNode;
  /** Where on the wheel the resting light starts its turn (the page draws one per visit). */
  phase?: number;
  /** She is walking through the open door (`stage-walk.ts`, run by the door): nothing on it takes a press. */
  walk?: boolean;
  /** She walked through: the stage is the album's own picture, and goes in a breath. */
  walked?: boolean;
  /** The stage's own box, for the walk through it (`walkThrough`). */
  stageRef?: (el: HTMLDivElement | null) => void;
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
      ref={(el) => {
        ref.current = el;
        stageRef?.(el);
      }}
      data-door-stage=""
      data-state={open ? "open" : "closed"}
      data-door-stage-at={at}
      data-door-stage-aside={aside ? "" : undefined}
      data-door-stage-first={first ? "" : undefined}
      data-door-walked={walked ? "" : undefined}
      role={modal && open ? "dialog" : undefined}
      aria-modal={modal && open ? true : undefined}
      inert={!open || walk || undefined}
      className={cn(
        "absolute inset-0 overflow-y-auto overscroll-contain bg-background text-foreground",
        // Over the album, under the page's own floating layers.
        "z-30",
        className,
      )}
      style={
        phase === undefined
          ? undefined
          : ({ "--door-phase": phase } as CSSProperties)
      }
    >
      <div data-door-camera="" className={cn(DOOR_MAIN, "min-h-full")}>
        <div
          data-door-stage-column=""
          className="relative w-full max-w-sm sm:max-w-md"
        >
          {back && (
            <div data-door-stage-back="" className="absolute top-0 left-0 z-10">
              {back}
            </div>
          )}
          <DoorColumn doorway={<StageDoorway door={door} view={view} />}>
            {children}
          </DoorColumn>
        </div>
      </div>
    </div>
  );
}

/** The stage's doorway: the house five, or the album's own light with its cover through the opening. */
export function StageDoorway({
  door,
  view,
}: {
  door: StageDoor;
  view?: ReactNode;
}) {
  return door.album ? (
    <AlbumDoorway door={door} view={view} />
  ) : (
    <Doorway state={door.state} from={door.from} />
  );
}

/**
 * THE DOORWAY IN THE ALBUM'S OWN LIGHT: it registers as a lit lamp (`useLampLit`), which is what lets
 * the album spend a sample on its colour, and shows the album's cover through the opening (`view`): only
 * ever where she may see the album, which the caller answers.
 */
function AlbumDoorway({ door, view }: { door: StageDoor; view?: ReactNode }) {
  useLampLit();
  const { hues } = useDoorHues();
  return (
    <Doorway state={door.state} from={door.from} hues={hues} view={view} />
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
 * THE DOOR AT REST, AT A GATE: the album's name and what it holds, under the doorway, before a step of the
 * door's sheet (the password, the email) rises over it. Today's locked page in the doorway's grammar: the
 * name and the count, nothing else of the album (its host, its date, its photographs) and the house light.
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
