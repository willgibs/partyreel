"use client";

import { Hourglass, Images, Lock, type LucideIcon, QrCode } from "lucide-react";

import { NotFoundScreen } from "@/components/shared/not-found-screen";
import { cn } from "@/lib/utils";

import { type DoorProps, type Hues, seesAlbum } from "./door-props";
import {
  AlbumBehind,
  AskedMark,
  AskPair,
  BackIn,
  BeatWords,
  Eyebrow,
  Held,
  HostedBy,
  HOUSE,
  huesAttr,
  litVars,
  LostFoot,
  Page,
  PickBlock,
  Pool,
  QuotedCheck,
  RiverBehind,
  revealAt,
  WayOutButton,
  WelcomeFoot,
} from "./furniture";
import {
  LOST,
  prose,
  shutWords,
  waitWords,
  WELCOME,
  type Words,
} from "./words";

/**
 * THE LIT COLUMN, PUSHED FURTHER (round one's `lit`, "Today's column, lit": the
 * other half of his direction).
 *
 * Round one lit one screen: the not-found column, its lock in a pool of the
 * house light. This round makes that column the grammar of every state: one
 * emblem, one headline, one line, one action, centred, whether the state
 * stands in the held sheet or on a page. The EMBLEM is the state (the album
 * for the welcome, an hourglass while she waits, the lock on the shut door, the
 * check the moment she is in) and the LIGHT is how it feels: the album's own
 * hues pouring round it on the welcome, the house light breathing while she
 * waits, the house light spent to a glow on the shut door.
 *
 * ★ ONE LIGHT PER VIEW. The column's light is its emblem's, so the sheet's edge
 * lamp stands down here: a lamp at the top and a pool in the middle would be
 * two sources for one door (design-system.md: a new lamp answers what emits).
 * What emits: the emblem. Where it falls: round it, spent before the headline
 * under it (in dark, a muted word inside the atmosphere register reads 2:1).
 * Sampled from: the album where the door may show it, the house five
 * everywhere else. What admits it: the pool.
 *
 * ★ WHAT IT SHOWS IS ITS COST, THE OTHER WAY ROUND: the shut door names no album
 * and no host ("the host"), as round one's lit did, so a private album keeps
 * saying nothing about itself, and a newcomer at a closed door learns nothing
 * of whose party it is.
 */

type EmblemState = "open" | "wait" | "shut" | "bloom" | "lost";

const ICON: Record<Exclude<EmblemState, "bloom">, LucideIcon> = {
  open: Images,
  wait: Hourglass,
  shut: Lock,
  lost: QrCode,
};

/**
 * THE EMBLEM: a pool of light with the state's glyph in ink, and the door
 * lamp's own blobs laid round it as a spill (`lit.css`'s drift, still under
 * reduced motion). `bloom` swaps the pool for the beat's check in the album's
 * light.
 */
export function LitEmblem({
  state,
  hues,
  size = "sheet",
  breathe = false,
}: {
  state: EmblemState;
  hues: Hues;
  size?: "sheet" | "page";
  /** The live wait: the pool swells and settles on the lamps' clock. */
  breathe?: boolean;
}) {
  const Icon = state === "bloom" ? null : ICON[state];
  return (
    <div
      data-ld-emblem={state}
      data-ld-breathe={breathe ? "" : undefined}
      className="relative isolate flex items-center justify-center"
    >
      <div
        data-ld-spill
        data-door-hues={state === "lost" ? undefined : huesAttr(hues)}
        aria-hidden
        className={cn("door-lamp ld-spill", size === "page" && "ld-spill-page")}
        style={litVars(hues)}
      >
        <span className="door-lamp-blob door-lamp-b1" />
        <span className="door-lamp-blob door-lamp-b2" />
        <span className="door-lamp-blob door-lamp-b3" />
      </div>
      {Icon ? (
        <Pool
          hue={hues[0]}
          size={size === "page" ? "hero" : "emblem"}
          className="ld-emblem-pool"
        >
          <Icon strokeWidth={1.75} />
        </Pool>
      ) : (
        <QuotedCheck hues={hues} />
      )}
    </div>
  );
}

const EMBLEM: Record<DoorProps["state"], EmblemState> = {
  welcome: "open",
  wait: "wait",
  shut: "shut",
  "was-in": "shut",
  beat: "bloom",
  lost: "lost",
};

export function LitDoor(p: DoorProps) {
  const { reader, wait, album, state } = p;
  const albumLit = seesAlbum(p);
  const hues = albumLit ? album : HOUSE;
  const emblem = EMBLEM[state];

  if (p.container === "page") return <LitPage {...p} hues={hues} />;

  const words: Words =
    state === "welcome"
      ? WELCOME
      : state === "wait"
        ? waitWords("lit", wait)
        : state === "lost"
          ? {
              eyebrow: LOST.eyebrow,
              title: LOST.title,
              lines: [{ text: LOST.line, mark: "link" }],
            }
          : shutWords("lit", reader.wasIn);
  const lost = state === "lost";

  return (
    <Held
      reader={lost ? undefined : reader}
      bar={lost}
      behind={
        albumLit && state === "welcome" ? (
          <AlbumBehind />
        ) : (
          <RiverBehind
            named={state === "welcome" || state === "wait" || state === "beat"}
          />
        )
      }
      hues={hues}
      lamp={false}
    >
      <div
        data-welcome-step={state === "welcome" ? "" : undefined}
        className="flex flex-col items-center gap-5 pt-3 text-center"
      >
        <LitEmblem
          state={emblem}
          hues={hues}
          breathe={state === "wait" && wait === "live"}
        />
        {state === "beat" ? (
          <BeatWords pick={wait === "pick"} />
        ) : (
          <>
            <div className="flex flex-col items-center">
              {words.eyebrow && (
                <Eyebrow text={words.eyebrow} hue={hues[0]} line={0} />
              )}
              <p
                data-ld-words
                data-ld-title
                data-door-line
                style={revealAt(1)}
                className={cn(
                  "mt-1.5 font-heading text-balance",
                  // The album's name is the welcome's hero; every other state's
                  // headline is a sentence, on the door heading's own step.
                  state === "welcome"
                    ? "text-hero sm:text-section"
                    : "text-page",
                )}
              >
                {words.title}
              </p>
              {state === "welcome" && albumLit && (
                <div data-door-line style={revealAt(2)} className="mt-2">
                  <HostedBy date inline />
                </div>
              )}
            </div>
            <div className="flex max-w-xs flex-col gap-1.5">
              {words.lines.map((l, i) => (
                <p
                  key={l.text}
                  data-ld-words
                  data-door-line
                  style={revealAt(3 + i)}
                  className="text-base leading-relaxed text-pretty text-muted-foreground"
                >
                  {l.text}
                </p>
              ))}
            </div>
            {state === "wait" && (
              <div className="flex w-full flex-col items-center gap-4">
                <AskedMark live={wait === "live"} hue={HOUSE[0]} />
                {wait === "pick" && (
                  <div className="w-full text-left">
                    <PickBlock phase="ready" />
                  </div>
                )}
              </div>
            )}
            <div className="mt-auto w-full pt-1">
              {state === "welcome" ? (
                <WelcomeFoot />
              ) : lost ? (
                <LostFoot />
              ) : state === "wait" ? null : (
                <>
                  {reader.unlisted ? (
                    <AskPair />
                  ) : (
                    <div className="flex flex-col items-center gap-3">
                      <WayOutButton className="w-full" />
                      {!reader.confirmed && <BackIn />}
                    </div>
                  )}
                </>
              )}
            </div>
          </>
        )}
      </div>
    </Held>
  );
}

/**
 * THE COLUMN AS A PAGE: production's not-found screen itself, wearing the lit
 * emblem through its own `visual` slot, so the option is production's screen
 * lit rather than a lookalike (round one's `lit`, kept).
 */
function LitPage({
  reader,
  wait,
  album,
  state,
  hues,
}: DoorProps & { hues: Hues }) {
  const emblem = EMBLEM[state];
  if (state === "lost") {
    return (
      <Page bar>
        <NotFoundScreen
          visual={<LitEmblem state="lost" hues={HOUSE} size="page" />}
          eyebrow={LOST.eyebrow}
          title={LOST.title}
          description={<span data-ld-words>{LOST.line}</span>}
          actions={<LostFoot />}
        />
      </Page>
    );
  }
  if (state === "beat") {
    return (
      <Page reader={reader}>
        <div className="flex w-full max-w-sm flex-col items-center gap-5 text-center">
          <LitEmblem state="bloom" hues={album} size="page" />
          <BeatWords pick={wait === "pick"} />
        </div>
      </Page>
    );
  }
  if (state === "wait") {
    const words = waitWords("lit", wait);
    return (
      <Page reader={reader}>
        <NotFoundScreen
          visual={
            <LitEmblem
              state={emblem}
              hues={hues}
              size="page"
              breathe={wait === "live"}
            />
          }
          eyebrow={words.eyebrow}
          title={words.title}
          description={<span data-ld-words>{prose(words.lines)}</span>}
          actions={
            wait === "pick" ? (
              <div className="w-full max-w-sm text-left">
                <PickBlock phase="ready" />
              </div>
            ) : null
          }
          footnote={<AskedMark live={wait === "live"} hue={HOUSE[0]} />}
        />
      </Page>
    );
  }
  const words = shutWords("lit", reader.wasIn);
  return (
    <Page reader={reader}>
      <NotFoundScreen
        visual={<LitEmblem state={emblem} hues={hues} size="page" />}
        title={words.title}
        description={<span data-ld-words>{prose(words.lines)}</span>}
        actions={
          reader.unlisted ? <AskPair /> : <WayOutButton className="w-full" />
        }
        footnote={reader.confirmed ? undefined : <BackIn />}
      />
    </Page>
  );
}
