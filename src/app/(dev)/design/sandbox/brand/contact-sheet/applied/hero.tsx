"use client";

import { SITE_SUBHEAD, SITE_THESIS } from "@/lib/constants/marketing-voice";

import { HEAD } from "../../deck/deck";
import { GUESTS, PARTY } from "../../deck/media";
import { Display, Kicker, type Screen, SlideRoot } from "../parts";
import { GROUND, PhoneShell, Print, who } from "../system";
import {
  BrowserShell,
  Orb,
  PlayGlyph,
  Pill,
  RollStrip,
  type RollFrame,
  SiteNav,
  StatusBar,
} from "./kit";

/**
 * 09 THE HOME HERO: partyreel.com's first screen, on paper. The site's own
 * line and subhead, Start free, and the party's roll running the width of the
 * page under them, each frame credited to whoever shot it, with the keeper
 * lifted off it as a print. The page opens on a spread (one photograph, its
 * edge in its border) over a sheet (the roll), which is the vision's own page
 * rhythm, and nothing is ever set on a photograph.
 *
 * What it proves: a paper home is as alive as a dark one. The photographs are
 * the only colour on it, the people who took them are named on the edge in
 * their own light, and the roll develops as the page lands, then keeps
 * advancing a frame at a time, the way an album fills.
 */

/** The party's roll: eight frames, a cycle, each credited to the guest who shot it. */
const ROLL: readonly RollFrame[] = (
  [
    ["wedding-arch", "50% 40%"],
    ["party-dj", undefined],
    ["wedding-rings", undefined],
    ["concert-confetti", undefined],
    ["reception-table", undefined],
    ["festival-crowd", undefined],
    ["wedding-toast", "35% 50%"],
    ["party-balloons", undefined],
  ] as const
).map(([photo, focus], i) => ({
  photo,
  focus,
  // Each guest's own frame counter: everyone shoots their own roll, and a
  // roll drawn twice to loop never shows a seam in its numbers.
  n: String([14, 9, 22, 5, 17, 11, 30, 19][i]),
  who: who([2, 6, 4, 3, 7, 1, 0, 5][i]),
}));

/** The rebate along the roll, the event's edge cut in two and printed frame by frame. */
const REBATE = [
  [{ text: "Partyreel", dim: true }, "25A"],
  ["Maya & Jay", "12.09.26"],
] as const;

/** The site's own four facts, the quiet row under the hero. */
const FACTS = ["No app required", "Unlimited by default", "Yours until you delete it", "No photo watermarks"] as const;

const KEEPER_EDGE = ["24", { text: "Lena", seed: who(5).seed }, "The keeper"] as const;

const [LINE_1, LINE_2] = SITE_THESIS.split(", ");

/**
 * THE DEMO'S DOOR: the guests of the sample album in their own light, its
 * true counts, and the way in. People are what make a paper page alive.
 */
function DemoDoor({ size = 14, orb = 26 }: { size?: number; orb?: number }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
      <span style={{ display: "flex", flex: "none" }}>
        {GUESTS.slice(0, 6).map((g, i) => (
          <Orb key={g.seed} seed={g.seed} size={orb} ring style={{ marginLeft: i ? -Math.round(orb * 0.3) : 0 }} />
        ))}
      </span>
      <p className="cs-read" style={{ margin: 0, fontSize: size, lineHeight: `${Math.round(size * 1.4)}px` }}>
        <span className="cs-muted">
          {PARTY.name}&rsquo;s {PARTY.kind.toLowerCase()}: {PARTY.guests} guests,{" "}
          {PARTY.photos.toLocaleString("en-US")} photos.
        </span>{" "}
        <span style={{ fontWeight: 600, textDecoration: "underline", textUnderlineOffset: 3, textDecorationThickness: 1.5 }}>
          Try the live demo
        </span>
      </p>
    </div>
  );
}

/**
 * THE PAGE ITSELF, at its own width: 1280 at a desk, 375 on a phone. `top`
 * is what sits above the nav (a phone's status bar, the deck's head).
 */
export function HeroPage({ layout, top = 0 }: { layout: "desk" | "phone"; top?: number }) {
  return layout === "desk" ? <HeroDesk top={top} /> : <HeroPhone top={top} />;
}

function HeroDesk({ top }: { top: number }) {
  return (
    <div style={{ position: "relative", width: 1280, height: 1000 + top }}>
      <div style={{ position: "absolute", left: 0, right: 0, top }}>
        <SiteNav layout="desk" />
      </div>
      <div className="absolute" style={{ left: 64, top: top + 128, width: 800 }}>
        <Display as="h1" size={112} style={{ lineHeight: 0.9 }}>
          <span data-bd-read="h1, the site's own line">
            {LINE_1},
            <br />
            {LINE_2}
          </span>
        </Display>
        <p
          className="cs-read cs-muted"
          style={{ fontSize: 21, lineHeight: "32px", margin: "34px 0 0", maxWidth: 560 }}
          data-bd-read="subhead"
        >
          {SITE_SUBHEAD}
        </p>
        <div style={{ display: "flex", gap: 12, marginTop: 34 }}>
          <Pill size={17}>Start free</Pill>
          <Pill size={17} tone="line" lead={<PlayGlyph size={11} />}>
            Watch a sample reel
          </Pill>
        </div>
        <div style={{ marginTop: 30 }}>
          <DemoDoor />
        </div>
      </div>
      <RollStrip
        frames={ROLL}
        frameW={184}
        gap={7}
        edgeSize={10}
        rebate={REBATE}
        advance
        develop={{ delay: 300, duration: 1700 }}
        offset={92}
        style={{ position: "absolute", left: 0, top: top + 676, width: 1280 }}
      />
      <Print
        photo="wedding-petals"
        w={318}
        ratio={2 / 3}
        border={15}
        tilt={-2.2}
        edge={KEEPER_EDGE}
        edgeSize={11}
        develop={{ delay: 500, duration: 2600 }}
        style={{ position: "absolute", left: 900, top: top + 214 }}
        read="the keeper, lifted off the roll"
      />
      <div
        className="absolute"
        style={{ left: 64, right: 64, top: top + 884, display: "flex", justifyContent: "space-between" }}
      >
        {FACTS.map((f, i) => (
          <span
            key={f}
            className="cs-read cs-muted"
            style={{
              flex: 1,
              fontSize: 15,
              fontWeight: 500,
              paddingLeft: i ? 24 : 0,
              borderLeft: i ? "1px solid rgb(22 18 15 / 0.12)" : undefined,
            }}
          >
            {f}
          </span>
        ))}
      </div>
    </div>
  );
}

function HeroPhone({ top }: { top: number }) {
  return (
    <div style={{ position: "relative", width: 375, height: 900 + top }}>
      <div style={{ position: "absolute", left: 0, right: 0, top }}>
        <SiteNav layout="phone" />
      </div>
      <div className="absolute" style={{ left: 16, right: 16, top: top + 86 }}>
        <Display as="h1" size={48} style={{ lineHeight: 0.92 }}>
          <span data-bd-read="h1, the site's own line">
            {LINE_1},
            <br />
            {LINE_2}
          </span>
        </Display>
        <p className="cs-read cs-muted" style={{ fontSize: 17, lineHeight: "25px", margin: "18px 0 0" }}>
          {SITE_SUBHEAD}
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 22 }}>
          <Pill size={16}>Start free</Pill>
          <Pill size={16} tone="line" lead={<PlayGlyph size={10} />}>
            Watch a sample reel
          </Pill>
        </div>
      </div>
      <RollStrip
        frames={ROLL}
        frameW={132}
        gap={5}
        edgeSize={9}
        rebate={REBATE}
        advance
        develop={{ delay: 300, duration: 1700, count: 4 }}
        offset={40}
        style={{ position: "absolute", left: 0, top: top + 512, width: 375 }}
      />
      <Print
        photo="wedding-petals"
        w={226}
        ratio={2 / 3}
        border={11}
        tilt={-2.4}
        edge={["24", { text: "Lena", seed: who(5).seed }, "The keeper"]}
        edgeSize={9}
        develop={{ delay: 500, duration: 2600 }}
        style={{ position: "absolute", left: 76, top: top + 430 }}
        read="the keeper, lifted off the roll"
      />
      <div className="absolute" style={{ left: 16, right: 16, top: top + 806 }}>
        <DemoDoor size={13} orb={24} />
      </div>
    </div>
  );
}

/* ── the slide ───────────────────────────────────────────────────────────── */

export function HeroSlide({ screen }: { screen: Screen }) {
  return screen === "1440" ? <HeroSlideDesk /> : <HeroSlidePhone />;
}

function HeroSlideDesk() {
  const phoneW = 336;
  const phoneH = Math.round(phoneW * 2.165);
  const screenW = phoneW - 14;
  const scale = screenW / 375;
  return (
    <SlideRoot screen="1440" style={{ background: GROUND.sheet.hex }}>
      <BrowserShell
        w={1010}
        h={808}
        url="partyreel.com"
        page={1280}
        style={{ position: "absolute", left: 52, top: HEAD["1440"] + 22 }}
      >
        <HeroPage layout="desk" />
      </BrowserShell>
      <PhoneShell
        w={phoneW}
        h={phoneH}
        style={{ position: "absolute", left: 1040, top: HEAD["1440"] + 96 }}
      >
        <StatusBar />
        <div style={{ position: "absolute", left: 0, top: 0, transform: `scale(${scale})`, transformOrigin: "0 0" }}>
          <HeroPage layout="phone" top={47} />
        </div>
      </PhoneShell>
    </SlideRoot>
  );
}

function HeroSlidePhone() {
  return (
    <SlideRoot screen="375">
      <div style={{ position: "absolute", left: 0, top: 0 }}>
        <HeroPage layout="phone" top={HEAD["375"]} />
      </div>
      <div className="absolute" style={{ left: 16, right: 16, top: HEAD["375"] + 904 }}>
        <Kicker style={{ fontSize: 11 }}>The same first screen, at a desk</Kicker>
        <BrowserShell w={343} h={300} url="partyreel.com" page={1280} style={{ marginTop: 14 }}>
          <HeroPage layout="desk" />
        </BrowserShell>
      </div>
    </SlideRoot>
  );
}
