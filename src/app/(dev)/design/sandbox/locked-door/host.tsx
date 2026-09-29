"use client";

import { Hourglass, Lock } from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

import { type DoorProps, type Hues, seesAlbum } from "./door-props";
import { HOST } from "./fixtures";
import {
  AlbumBehind,
  Eyebrow,
  Foot,
  Held,
  HostedBy,
  HOUSE,
  huesAttr,
  litVars,
  LostFoot,
  LostIcon,
  Page,
  PickBlock,
  Pool,
  QuotedCheck,
  RiverBehind,
  Rows,
  revealAt,
  WaitHold,
  WelcomeFoot,
} from "./furniture";
import {
  BEAT,
  LOST,
  type Mark,
  shutWords,
  waitWords,
  WELCOME,
  type Words,
} from "./words";

/**
 * THE HOST'S DOOR, PUSHED FURTHER (round one's `host`, his direction: "more
 * polished/creative explorations off of this").
 *
 * Round one closed the welcome's hero (the album's name beside Maya's face).
 * This round makes the host the door itself, on every state: her portrait
 * leads each screen with the lamp's light around it as a HALO, and the halo is
 * what tells the state. Lit in the album's own hues on the welcome; breathing
 * in the house light while she decides; unlit on the shut door, her face still
 * there, since she is the way on; blooming into a check the moment she lets
 * someone in, and the beat says so ("Maya let you in"). Her name comes first
 * on every screen ("Hosted by Maya" beside the face, bible 7), the album's name
 * is the door's plate under it, and the lines are the welcome's rows on pools.
 *
 * ★ A LAMP ANSWERS FOUR QUESTIONS (design-system.md). What emits: the sheet's
 * free edge, as today. Where it falls: the edge, and her portrait just under
 * it, which is the halo. Sampled from: the album's newest previews where the
 * door may show them (a Public album's welcome, the beat), the house five
 * everywhere else. What admits it: the paper of the sheet, and the portrait's
 * own ring.
 *
 * ★ WHAT IT SHOWS IS ITS COST: the shut door names the album and shows the
 * host's face, which a private album hides today (his `host` pick took that
 * cost as the direction; the caption measures it on every frame).
 */

type PlateState = "open" | "wait" | "shut" | "bloom" | "none";

/**
 * THE HOST'S PLATE: her portrait in a ring of the lamp's light, and a small
 * mark on the ring's foot that names the state in a glyph (the way a status
 * sits on a contact): nothing on the welcome, an hourglass while she decides,
 * a lock on the shut door, the check the moment she lets someone in. The ring
 * is a conic sweep of the three hues with a soft glow behind it; the live wait
 * breathes it and turns it on the lamps' clock (still under reduced motion),
 * the shut door leaves a hairline, and the 404, which has no host, is an empty
 * ring around the QR glyph.
 */
export function Plate({
  state,
  hues,
  size = "sheet",
  breathe = false,
}: {
  state: PlateState;
  hues: Hues;
  size?: "sheet" | "page";
  /** The live wait: the ring turns and its glow breathes. */
  breathe?: boolean;
}) {
  const lit = state === "open" || state === "wait" || state === "bloom";
  return (
    <span
      data-ld-plate={state}
      data-ld-breathe={breathe ? "" : undefined}
      data-ld-shows={state === "none" ? undefined : "host"}
      data-door-hues={lit ? huesAttr(hues) : undefined}
      className={cn(
        "ld-plate relative isolate inline-flex shrink-0 items-center justify-center rounded-full",
        size === "sheet" ? "size-14" : "size-24",
      )}
      style={litVars(hues)}
    >
      <span aria-hidden className="ld-halo-glow" />
      <span aria-hidden className="ld-halo" />
      {state === "none" ? (
        <LostIcon
          aria-hidden
          className={cn(
            "text-muted-foreground",
            size === "sheet" ? "size-5" : "size-8",
          )}
        />
      ) : (
        <Avatar
          seed={HOST.seed}
          className="ld-plate-face size-[calc(100%-10px)]"
        >
          <AvatarFallback className={size === "sheet" ? "text-lg" : "text-3xl"}>
            {HOST.name.slice(0, 1)}
          </AvatarFallback>
        </Avatar>
      )}
      {state === "bloom" && (
        <span className="absolute -right-1 -bottom-1 z-10">
          <QuotedCheck hues={hues} size="sent" />
        </span>
      )}
      {(state === "wait" || state === "shut") && (
        <span
          data-ld-plate-mark={state}
          className={cn(
            "absolute z-10 rounded-full bg-popover p-0.5",
            size === "sheet" ? "-right-1 -bottom-1" : "right-0 bottom-0",
          )}
        >
          <Pool hue={hues[state === "wait" ? 1 : 3]} size="badge">
            {state === "wait" ? (
              <Hourglass strokeWidth={2} />
            ) : (
              <Lock strokeWidth={2} />
            )}
          </Pool>
        </span>
      )}
    </span>
  );
}

/** A state's eyebrow glyph: today's clock while she waits, the lock where the door is shut. */
const EYEBROW_MARK: Partial<Record<DoorProps["state"], Mark>> = {
  wait: "clock",
  shut: "lock",
  "was-in": "lock",
  lost: "link",
};

/** The plate a state wears. */
const PLATE: Record<DoorProps["state"], PlateState> = {
  welcome: "open",
  wait: "wait",
  shut: "shut",
  "was-in": "shut",
  beat: "bloom",
  lost: "none",
};

/** The 404's words, in the host's door's shape. */
const LOST_WORDS: Words = {
  eyebrow: LOST.eyebrow,
  title: LOST.title,
  lines: [{ text: LOST.line, mark: "link" }],
};

export function HostDoor(p: DoorProps) {
  const { reader, wait, album } = p;
  const state = p.state;
  const albumLit = seesAlbum(p);
  const hues = albumLit ? album : HOUSE;
  const breathe = state === "wait" && wait === "live";

  if (state === "beat") return <HostBeat {...p} />;

  const words: Words =
    state === "welcome"
      ? WELCOME
      : state === "wait"
        ? waitWords("host", wait)
        : state === "lost"
          ? LOST_WORDS
          : shutWords("host", reader.wasIn);

  const align = p.container === "page" ? "center" : "start";
  const extra =
    state === "wait" ? <WaitHold wait={wait} align={align} /> : null;
  const foot =
    state === "welcome" || state === "wait" ? null : state === "lost" ? (
      <LostFoot align={align} />
    ) : (
      <Foot reader={reader} align={align} />
    );
  const lost = state === "lost";

  if (p.container === "page") {
    return (
      <Page reader={lost ? undefined : reader} bar={lost}>
        <div className="flex w-full max-w-sm flex-col items-center gap-6 text-center">
          <Plate
            state={PLATE[state]}
            hues={hues}
            size="page"
            breathe={breathe}
          />
          <div className="flex flex-col items-center">
            {words.eyebrow && (
              <Eyebrow
                text={words.eyebrow}
                mark={EYEBROW_MARK[state]}
                hue={hues[0]}
                line={0}
              />
            )}
            <p
              data-ld-words
              data-ld-title
              data-door-line
              style={revealAt(1)}
              className={cn(
                "mt-1.5 font-heading text-balance",
                lost ? "text-page" : "text-section",
              )}
            >
              {words.title}
            </p>
            {!lost && <HostedBy className="mt-2" />}
          </div>
          <div className="flex flex-col gap-1.5">
            {words.lines.map((l, i) => (
              <p
                key={l.text}
                data-ld-words
                data-door-line
                style={revealAt(2 + i)}
                className="text-base leading-relaxed text-pretty text-muted-foreground"
              >
                {l.text}
              </p>
            ))}
          </div>
          {extra}
          {foot}
        </div>
      </Page>
    );
  }

  return (
    <Held
      reader={lost ? undefined : reader}
      bar={lost}
      behind={albumLit ? <AlbumBehind /> : <RiverBehind named={!lost} />}
      hues={hues}
    >
      <div
        data-welcome-step={state === "welcome" ? "" : undefined}
        className="flex flex-col gap-5"
      >
        <div
          data-door-line
          style={revealAt(0)}
          className="flex items-center gap-3.5"
        >
          <Plate state={PLATE[state]} hues={hues} breathe={breathe} />
          {/* ★ AT A GATE THE HOST'S DOOR STILL SHOWS HER, where today's
              redacted page hides the host and the date: the door is hers, so
              her face is its plate. The date stays hidden, as today. */}
          {!lost && <HostedBy date={albumLit && state === "welcome"} />}
        </div>
        <div className="flex flex-col">
          {words.eyebrow && (
            <Eyebrow
              text={words.eyebrow}
              mark={EYEBROW_MARK[state]}
              hue={hues[0]}
              line={1}
            />
          )}
          <p
            data-ld-words
            data-ld-title
            data-door-line
            style={revealAt(2)}
            className={cn(
              "mt-1.5 font-heading text-balance",
              // The album's name is the plate, a hero; the 404's sentence
              // heads on the page step.
              lost ? "text-page" : "text-hero sm:text-section",
            )}
          >
            {words.title}
          </p>
        </div>
        <Rows lines={words.lines} hues={hues} from={3} />
        {extra}
        {state === "welcome" ? (
          <WelcomeFoot className="mt-auto" />
        ) : (
          foot && <div className="mt-auto pt-1">{foot}</div>
        )}
      </div>
    </Held>
  );
}

/**
 * THE MOMENT SHE LETS HER IN: the halo blooms in the album's own light (she may
 * see it now), a check lands on the portrait, and the beat says who opened the
 * door. The pick wait's three photos go in under it.
 */
function HostBeat({ container, reader, wait, album }: DoorProps) {
  const body = (
    <div className="flex flex-col items-center gap-4 py-8 text-center">
      <Plate state="bloom" hues={album} size="page" />
      <div>
        <p
          data-ld-words
          data-ld-title
          data-door-line
          style={revealAt(0, 140)}
          className="font-heading text-page"
        >
          {BEAT.title}
        </p>
        <p
          data-ld-words
          data-door-line
          style={revealAt(1, 140)}
          className="mt-1 text-base text-muted-foreground"
        >
          {BEAT.byHost}
        </p>
      </div>
      {wait === "pick" && (
        <div className="w-full max-w-sm">
          <PickBlock phase="sending" align="center" />
        </div>
      )}
    </div>
  );
  if (container === "page") return <Page reader={reader}>{body}</Page>;
  return (
    <Held
      reader={reader}
      behind={<RiverBehind named />}
      hues={album}
      lamp="bloom"
    >
      {body}
    </Held>
  );
}
