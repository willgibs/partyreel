"use client";

import {
  DECOMPOSITION_FACTS,
  REEL_LINE,
} from "@/lib/constants/marketing-voice";

import type { SlideProps } from "../../deck/contract";
import { type PhotoId, Reel } from "../../deck/media";
import { isDesk, Kicker, Pic, SlideGround } from "../slides/kit";
import {
  BASE,
  Credit,
  CROWD,
  crowdFor,
  GuestRow,
  ON,
  type Person,
} from "../system";
import { Action, PlayGlyph, SiteNav, SiteNavPhone } from "./kit";

/**
 * 10 A DARK PAGE: /reel, in the room. The reel plays as large as the page
 * allows and is the brightest thing on it; the people who made it are there
 * only as credits beside the pictures: the row of who took part (the newest
 * arriving), and the last photographs to land, each with its guest's face
 * and name at its side. Nothing of theirs touches a frame.
 *
 * ★ NO STATUS ON THIS PAGE, ON PURPOSE: waiting's plate in the room is paper,
 * the brightest value the system owns, and a tag here would out-shine the
 * reel. Status lives where work happens (the hub, the album), not on a page
 * whose subject is pictures.
 */

/** The sample reel's numbers are the site's own (the reel band's facts). */
const SAMPLE = DECOMPOSITION_FACTS[0];
const GUESTS_N = 48;

/** Who made the sample: the deck's crowd, then more, in arrival order. */
const MADE_BY: readonly Person[] = [
  ...CROWD.slice(1),
  ...crowdFor("sample-reel", GUESTS_N - (CROWD.length - 1)),
];

const LANDED: { who: Person; id: PhotoId; when: string; focus?: string }[] = [
  { who: CROWD[2], id: "concert-confetti", when: "just now" },
  { who: CROWD[6], id: "festival-crowd", when: "1 min ago" },
  { who: CROWD[5], id: "party-dj", when: "3 min ago", focus: "50% 35%" },
];

/** The last photographs to land, each with its guest beside it. */
function Landed({ n, tile, gap }: { n: number; tile: number; gap: number }) {
  return (
    <ul className="grid" style={{ gap }}>
      {LANDED.slice(0, n).map((l) => (
        <li key={l.id} className="flex items-center" style={{ gap: 16 }}>
          <Pic
            id={l.id}
            focus={l.focus}
            lit
            style={{ width: tile, height: tile, flex: "none" }}
          />
          <div className="grid" style={{ gap: 7 }}>
            <Credit person={l.who} size={24} tone="room" />
            <span
              className="ev-body"
              style={{ fontSize: 13, color: BASE.roomMuted.hex }}
            >
              {l.when}
            </span>
          </div>
        </li>
      ))}
    </ul>
  );
}

const BODY =
  "The reel plays every approved photo by itself, on a phone or on the wall, while the event is still going.";

function ReelDesk() {
  const reelW = 864;
  const reelH = Math.round((reelW * 9) / 16);
  return (
    <SlideGround tone="room" screen="1440" pad={false}>
      <div className="absolute" style={{ left: 0, top: 56 }}>
        <SiteNav tone="room" dot="house:305" h={72} />
      </div>
      <div className="absolute" style={{ left: 56, top: 150 }}>
        <Kicker tone="room">The reel</Kicker>
        <h1
          className="ev-display"
          data-bd-read="H1 in the room"
          style={{ fontSize: 84, marginTop: 14, color: BASE.roomInk.hex }}
        >
          Everyone&apos;s photos,
          <br />
          {REEL_LINE.replace("Everyone's photos, ", "")}
        </h1>
      </div>
      <div className="absolute" style={{ left: 976, top: 196, width: 408 }}>
        <p
          className="ev-body"
          data-bd-contrast="body in the room"
          style={{ fontSize: 17, lineHeight: 1.5, color: BASE.roomMuted.hex }}
        >
          {BODY}
        </p>
        <div style={{ marginTop: 22 }}>
          <Action tone="room" solid h={50} font={16}>
            <PlayGlyph size={12} />
            Watch a sample reel
          </Action>
        </div>
      </div>
      <div
        className="ev-photo ev-photo-lit"
        style={{
          position: "absolute",
          left: 56,
          top: 384,
          width: reelW,
          height: reelH,
        }}
      >
        <Reel id="hero-candidate-02" />
      </div>
      <div className="absolute" style={{ left: 976, top: 384, width: 408 }}>
        <Kicker tone="room">A sample reel</Kicker>
        <p
          className="ev-head"
          style={{ fontSize: 27, marginTop: 10, color: BASE.roomInk.hex }}
        >
          {SAMPLE}
        </p>
        <div style={{ marginTop: 16 }}>
          <GuestRow
            people={MADE_BY}
            max={8}
            total={GUESTS_N}
            size={30}
            tone="room"
            pop
          />
        </div>
        <div
          style={{
            height: 1,
            backgroundColor: ON.room.line,
            margin: "26px 0 22px",
          }}
        />
        <Kicker tone="room" style={{ marginBottom: 16 }}>
          Just landed
        </Kicker>
        <Landed n={3} tile={80} gap={14} />
      </div>
    </SlideGround>
  );
}

function ReelPhone() {
  return (
    <SlideGround tone="room" screen="375" pad={false}>
      <div style={{ height: 52 }} />
      <SiteNavPhone tone="room" dot="house:305" />
      <div style={{ padding: "26px 20px 0" }}>
        <Kicker tone="room">The reel</Kicker>
        <h1
          className="ev-display"
          data-bd-read="H1 in the room, on a phone"
          style={{ fontSize: 40, marginTop: 12, color: BASE.roomInk.hex }}
        >
          Everyone&apos;s photos,
          <br />
          {REEL_LINE.replace("Everyone's photos, ", "")}
        </h1>
        <p
          className="ev-body"
          data-bd-contrast="body in the room, on a phone"
          style={{
            fontSize: 16,
            lineHeight: 1.5,
            marginTop: 16,
            color: BASE.roomMuted.hex,
          }}
        >
          {BODY}
        </p>
        <div style={{ marginTop: 20 }}>
          <Action tone="room" solid h={46} font={15.5}>
            <PlayGlyph size={11} />
            Watch a sample reel
          </Action>
        </div>
      </div>
      {/* The landscape cut, edge to edge: the portrait cut letterboxes its
          stills in black, which would make the reel the darkest thing here. */}
      <div
        className="ev-photo ev-photo-lit"
        style={{ marginTop: 28, width: 375, height: 290, borderRadius: 0 }}
      >
        <Reel id="hero-candidate-02" />
      </div>
      <div style={{ padding: "0 20px" }}>
        <Kicker tone="room" style={{ marginTop: 26 }}>
          A sample reel
        </Kicker>
        <p
          className="ev-head"
          style={{ fontSize: 23, marginTop: 8, color: BASE.roomInk.hex }}
        >
          {SAMPLE}
        </p>
        <div style={{ marginTop: 14 }}>
          <GuestRow
            people={MADE_BY}
            max={7}
            total={GUESTS_N}
            size={30}
            tone="room"
            pop
          />
        </div>
        <div
          style={{
            height: 1,
            backgroundColor: ON.room.line,
            margin: "24px 0 20px",
          }}
        />
        <Kicker tone="room" style={{ marginBottom: 14 }}>
          Just landed
        </Kicker>
        <Landed n={3} tile={72} gap={12} />
      </div>
    </SlideGround>
  );
}

export function ReelPage({ screen }: SlideProps) {
  return isDesk(screen) ? <ReelDesk /> : <ReelPhone />;
}
