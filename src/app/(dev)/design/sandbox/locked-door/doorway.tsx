"use client";

import { cn } from "@/lib/utils";

import { type DoorProps, type Hues, seesAlbum } from "./door-props";
import { ALBUM } from "./fixtures";
import {
  AlbumBehind,
  AskedMark,
  BeatWords,
  Eyebrow,
  Foot,
  Held,
  HostedBy,
  HOUSE,
  huesAttr,
  litVars,
  LostFoot,
  Page,
  PickBlock,
  RiverBehind,
  Rows,
  revealAt,
  WelcomeFoot,
} from "./furniture";
import {
  LOST,
  type Mark,
  shutWords,
  waitWords,
  WELCOME,
  type Words,
} from "./words";

/**
 * THE DOORWAY: ONE FRESH DIRECTION (his "maybe one fresh one").
 *
 * The product already calls this screen the door, so this draws one: a
 * doorway standing on the page with the party's light behind it, and its LEAF
 * is the state. Open on the welcome, the album itself seen through it and its
 * light thrown across the floor; ajar while the host decides, a blade of light
 * down its edge; shut on the shut door, the one line of light under it that
 * says the party is on and nobody has been told why she is not in it; gone on a
 * link that opens nothing (the 404), an empty frame. The moment she is let in,
 * the leaf swings open on its hinge and the album comes through.
 *
 * ★ A LAMP ANSWERS FOUR QUESTIONS (design-system.md). What emits: the room
 * behind the door (the party). From where: the doorway's opening, which is
 * why the light's reach IS the state (a whole doorway, a blade, a line under
 * the leaf). Sampled from: the album's newest previews when she may see the
 * album (a Public album's welcome, the beat), the house five otherwise (a
 * closed door shows nothing of the album, not even its colour). What admits it:
 * the floor, where the light falls, and the frame's own edge.
 *
 * ★ THE DOOR IS THE PAGE, SO NOTHING IS BEHIND A SHEET (its cost, said on its
 * option): at a desk the welcome no longer stands beside a blurred album,
 * which today's edge sheet keeps in view as the incentive. The album is seen
 * through the open door instead, and the itinerary's next steps (the
 * password, the name, the email) rise as today's sheet under the doorway,
 * which then keeps the state above them. Its `split` and `bespoke` shapes put
 * the welcome back in the sheet over the album, with the doorway small at the
 * sheet's head.
 *
 * ★ STILL AT REST, AND DRAWN WHOLE THERE (bible 5): the leaf's angle is a
 * custom property per state, and only the wait's breath and the swing move it
 * (`locked-door.css`, behind `no-preference`).
 */

type WayState = "open" | "ajar" | "shut" | "none";

export function Doorway({
  state,
  hues,
  size = "page",
  through = false,
  breathe = false,
  from = "shut",
}: {
  state: WayState;
  hues: Hues;
  size?: "page" | "sheet";
  /** The album itself, seen through the open door (only where she may see it). */
  through?: boolean;
  /** The live wait: the leaf and its light breathe on the lamps' clock. */
  breathe?: boolean;
  /** Where an opening door swings from: the beat opens a door that was ajar. */
  from?: "shut" | "ajar";
}) {
  return (
    <div
      data-ld-way={state}
      data-ld-way-size={size}
      data-ld-breathe={breathe ? "" : undefined}
      data-ld-from={from === "ajar" ? "ajar" : undefined}
      data-door-hues={state === "none" ? undefined : huesAttr(hues)}
      aria-hidden
      className="ld-way"
      style={litVars(hues)}
    >
      <span className="ld-way-floor" />
      <span className="ld-way-ground" />
      <div className="ld-way-frame">
        {state !== "none" && (
          <div className="ld-way-room">
            <span className="ld-way-glow ld-way-g1" />
            <span className="ld-way-glow ld-way-g2" />
            <span className="ld-way-glow ld-way-g3" />
            {through && (
              <div className="ld-way-album">
                {ALBUM.slice(0, 4).map((p) => (
                  // eslint-disable-next-line @next/next/no-img-element -- a bootstrap still standing in for the album's own photograph
                  <img key={p.src} data-ld-shows="photo" src={p.src} alt="" />
                ))}
              </div>
            )}
          </div>
        )}
        {state !== "none" && (
          <div className="ld-way-leaf">
            <span className="ld-way-panel ld-way-panel-top" />
            <span className="ld-way-panel ld-way-panel-low" />
          </div>
        )}
        {state !== "none" && <span className="ld-way-sill" />}
      </div>
    </div>
  );
}

const WAY: Record<DoorProps["state"], WayState> = {
  welcome: "open",
  wait: "ajar",
  shut: "shut",
  "was-in": "shut",
  beat: "open",
  lost: "none",
};

const EYEBROW_MARK: Partial<Record<DoorProps["state"], Mark>> = {
  wait: "lock",
  shut: "lock",
  "was-in": "lock",
};

const LOST_WORDS: Words = {
  eyebrow: LOST.eyebrow,
  title: LOST.title,
  lines: [{ text: LOST.line, mark: "link" }],
};

export function DoorwayDoor(p: DoorProps) {
  const { reader, wait, album, state } = p;
  const albumLit = seesAlbum(p);
  const hues = albumLit ? album : HOUSE;
  const lost = state === "lost";
  // A gate's welcome meets the door shut, its light under it: the password or
  // the email is what opens it, and the door says so before a word does.
  const way: WayState = state === "welcome" && !albumLit ? "shut" : WAY[state];
  const words: Words =
    state === "welcome"
      ? WELCOME
      : state === "wait"
        ? waitWords("doorway", wait)
        : lost
          ? LOST_WORDS
          : shutWords("doorway", reader.wasIn);
  const breathe = state === "wait" && wait === "live";

  if (p.container === "page") {
    return (
      <Page reader={lost ? undefined : reader} bar={lost}>
        <div className="flex w-full max-w-sm flex-col items-center text-center sm:max-w-md">
          <Doorway
            state={way}
            hues={hues}
            through={albumLit}
            breathe={breathe}
            from={state === "beat" ? "ajar" : "shut"}
          />
          {state === "beat" ? (
            <div className="mt-10 w-full">
              <BeatWords pick={wait === "pick"} size="section" />
            </div>
          ) : (
            <>
              <div className="mt-10 flex flex-col items-center">
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
                  className="mt-1.5 font-heading text-section text-balance"
                >
                  {words.title}
                </p>
                {state === "welcome" && albumLit && (
                  <div data-door-line style={revealAt(2)} className="mt-2">
                    <HostedBy date inline />
                  </div>
                )}
              </div>
              <div className="mt-3 flex flex-col gap-1.5">
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
                <div className="mt-5 flex w-full flex-col items-center gap-4">
                  <AskedMark live={wait === "live"} hue={HOUSE[0]} />
                  {wait === "pick" && (
                    <div className="w-full text-left">
                      <PickBlock phase="ready" />
                    </div>
                  )}
                </div>
              )}
              {state !== "wait" && (
                <div className="mt-8 w-full">
                  {state === "welcome" ? (
                    <WelcomeFoot />
                  ) : lost ? (
                    <LostFoot />
                  ) : (
                    <Foot reader={reader} />
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </Page>
    );
  }

  /* ── in the held sheet (the `split` and `bespoke` shapes) ───────────────── */

  return (
    <Held
      reader={lost ? undefined : reader}
      bar={lost}
      behind={
        albumLit && state === "welcome" ? (
          <AlbumBehind />
        ) : (
          <RiverBehind named={!lost} />
        )
      }
      hues={hues}
      lamp={state === "beat" ? "bloom" : "base"}
    >
      {state === "beat" ? (
        <div className="flex flex-col items-center gap-6 py-6 text-center">
          <Doorway state="open" hues={album} size="sheet" through from="ajar" />
          <BeatWords pick={wait === "pick"} />
        </div>
      ) : (
        <div
          data-welcome-step={state === "welcome" ? "" : undefined}
          className="flex flex-col gap-5"
        >
          <div
            data-door-line
            style={revealAt(0)}
            className={cn("flex items-end gap-3.5")}
          >
            <Doorway
              state={way}
              hues={hues}
              size="sheet"
              through={albumLit}
              breathe={breathe}
            />
            {state === "welcome" && albumLit && (
              <HostedBy date className="pb-0.5" />
            )}
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
                // The album's name is a hero; a sentence heads on the page step.
                words.title === WELCOME.title
                  ? "text-hero sm:text-section"
                  : "text-page",
              )}
            >
              {words.title}
            </p>
          </div>
          <Rows lines={words.lines} hues={hues} from={3} />
          {state === "wait" && (
            <div className="flex flex-col gap-4">
              <span className="flex">
                <AskedMark live={wait === "live"} hue={HOUSE[0]} />
              </span>
              {wait === "pick" && <PickBlock phase="ready" />}
            </div>
          )}
          {state === "welcome" ? (
            <WelcomeFoot className="mt-auto" />
          ) : state === "wait" ? null : (
            <div className="mt-auto pt-1">
              {lost ? (
                <LostFoot align="start" />
              ) : (
                <Foot reader={reader} align="start" />
              )}
            </div>
          )}
        </div>
      )}
    </Held>
  );
}
