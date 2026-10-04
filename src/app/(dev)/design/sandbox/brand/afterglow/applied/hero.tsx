"use client";

import { MARKETING_REELS } from "@/lib/constants/marketing-media";

import type { SlideProps } from "../../deck/contract";
import type { PhotoId } from "../../deck/media";
import { ink, SlideRoot } from "../root";
import { GROUND, LightChips, lightOfPhoto, LitPhoto, Readout, VOICE } from "../system";
import {
  BrowserWindow,
  Btn,
  Note,
  PhoneView,
  ReelClock,
  ReelLight,
  SiteNav,
} from "./kit";

/**
 * 09 THE HOME HERO: partyreel.com's first screen in the room. The site's own
 * H1 and subhead stand in the dark; the one live subject is the reel, and the
 * one light is its Bloom, which answers the reel shot by shot (a golden-hour
 * couple, a birthday's balloons, a stage, a daylight aisle, a dance floor, a
 * toast), so the first thing the site says about colour is that it comes from
 * the photographs, at any event and any hour. The button is a paper pill,
 * never lit; the nav wears the wordmark alone.
 *
 * ★ THE REEL IS THE PORTRAIT HERO REEL, CUT TO 3:2. Its landscape shots sit in
 * a band (rows 392 to 887 of 1280, measured on every shot), so a 3:2 crop of
 * the vertical master shows them edge to edge with no letterbox; the one
 * portrait shot (the petals) loses the couple's heads for two seconds. A
 * landscape master is an asset ask.
 */

const REEL = "hero-candidate-01" as const;

/** The site's H1 (`VOICE.thesis`, its own words), broken where the hero wants it. */
const THESIS = ["The whole", "event, in one", "album."] as const;

/** The home's trust strip, the site's own four claims (`trust-strip.tsx`). */
const CLAIMS = [
  "No app required",
  "Unlisted by default",
  "Yours until you delete it",
  "No photo watermarks",
] as const;

/** The first screen at a desk, drawn at 1440 by 900. */
function HeroDesk() {
  const t = ink("room");
  return (
    <div className="absolute inset-0" style={{ background: GROUND.room.hex, color: t.fg }}>
      <SiteNav ground="room" screen="desk" />
      <div className="absolute" style={{ left: 96, top: 214, width: 560 }}>
        <h1
          className="ag-display"
          data-bd-contrast="the H1 on the room"
          aria-label={VOICE.thesis}
          style={{ fontSize: 92, color: t.fg }}
        >
          {THESIS.map((l) => (
            <span key={l} className="block">
              {l}
            </span>
          ))}
        </h1>
        <p
          className="ag-lede"
          data-bd-contrast="the subhead on the room"
          style={{ color: t.muted, fontSize: 19, lineHeight: 1.52, marginTop: 34, maxWidth: 452 }}
        >
          {VOICE.subhead}
        </p>
        <div className="flex" style={{ gap: 12, marginTop: 38 }}>
          <Btn ground="room" size="lg">
            Start free
          </Btn>
          <Btn ground="room" kind="secondary" size="lg">
            See how it works
          </Btn>
        </div>
      </div>
      <div className="absolute" style={{ left: 760, top: 232, width: 584, height: 389 }}>
        <ReelLight reel={REEL} ground="room" blur={64} spread={8} className="size-full" />
      </div>
      <div
        className="absolute flex items-center justify-between"
        style={{ left: 96, right: 96, bottom: 0, height: 92, borderTop: "1px solid rgb(255 255 255 / 0.07)" }}
      >
        {CLAIMS.map((c) => (
          <Readout key={c} style={{ color: t.faint }}>
            {c}
          </Readout>
        ))}
      </div>
    </div>
  );
}

/** The first screen on a phone, drawn at 375 by 812 under its status bar. */
function HeroPhone() {
  const t = ink("room");
  return (
    <div className="absolute inset-0" style={{ background: GROUND.room.hex, color: t.fg }}>
      <SiteNav ground="room" screen="phone" />
      <div className="absolute" style={{ left: 22, right: 22, top: 146 }}>
        <h1
          className="ag-display"
          aria-label={VOICE.thesis}
          data-bd-read="the phone's H1"
          style={{ fontSize: 46, color: t.fg }}
        >
          {THESIS.map((l) => (
            <span key={l} className="block">
              {l}
            </span>
          ))}
        </h1>
        <p className="ag-lede" style={{ color: t.muted, fontSize: 16, lineHeight: 1.5, marginTop: 20 }}>
          {VOICE.subhead}
        </p>
        <div className="flex" style={{ gap: 10, marginTop: 26 }}>
          <Btn ground="room" size="md">
            Start free
          </Btn>
          <Btn ground="room" kind="secondary" size="md">
            See how it works
          </Btn>
        </div>
      </div>
      <div className="absolute" style={{ left: 22, right: 22, top: 538, height: 221 }}>
        <ReelLight reel={REEL} ground="room" blur={30} spread={4} className="size-full" />
      </div>
    </div>
  );
}

/** The reel's shots, in the order it cuts them: each one's photograph and the light it gives the Bloom. */
const SHOTS = (MARKETING_REELS.find((r) => r.id === REEL)?.recipe.clipIds ?? []) as PhotoId[];

/** The receipt for a light that moves: a still of the slide shows one shot, so the slide prints all six. */
function ShotLights({ cols, w, aspect = 2 / 3 }: { cols: number; w: number; aspect?: number }) {
  const gap = 10;
  const tw = Math.floor((w - gap * (cols - 1)) / cols);
  return (
    <div className="grid" style={{ gridTemplateColumns: `repeat(${cols}, ${tw}px)`, columnGap: gap, rowGap: 14 }}>
      {SHOTS.map((id) => (
        <div key={id}>
          <LitPhoto id={id} focus={id === "wedding-petals" ? "50% 30%" : undefined} style={{ width: tw, height: Math.round(tw * aspect) }} />
          <LightChips light={lightOfPhoto(id)} register="room" height={4} className="mt-2" />
        </div>
      ))}
    </div>
  );
}

const PROOF =
  "The reel's own light, taken shot by shot as it plays: gold for the toast, every colour for the balloons, blue for the floor. The words and the button stay in the dark.";

export function HeroSlide({ screen }: SlideProps) {
  if (screen === "375")
    return (
      <SlideRoot screen={screen} ground="room">
        <ReelClock>
          <div className="absolute inset-x-0 top-0 overflow-hidden" style={{ height: 812 }}>
            <HeroPhone />
          </div>
          <div
            className="absolute inset-x-0"
            style={{ top: 812, paddingInline: 20, paddingTop: 30, borderTop: "1px solid rgb(255 255 255 / 0.08)" }}
          >
            <Note ground="room" label="The one light">
              {PROOF}
            </Note>
            <Readout className="block" style={{ color: ink("room").faint, marginTop: 26 }}>
              Its light, shot by shot
            </Readout>
            <div style={{ marginTop: 12 }}>
              <ShotLights cols={3} w={335} />
            </div>
            <Readout className="block" style={{ color: ink("room").faint, marginTop: 30 }}>
              At a desk
            </Readout>
            <BrowserWindow width={335} ground="room" style={{ marginTop: 12 }}>
              <HeroDesk />
            </BrowserWindow>
          </div>
        </ReelClock>
      </SlideRoot>
    );
  return (
    <SlideRoot screen={screen} ground="room" style={{ background: GROUND.display.hex }}>
      <ReelClock>
        <BrowserWindow width={1000} ground="room" style={{ position: "absolute", left: 48, top: 92 }}>
          <HeroDesk />
        </BrowserWindow>
        <PhoneView width={300} ground="room" style={{ position: "absolute", right: 48, top: 92 }}>
          <HeroPhone />
        </PhoneView>
      </ReelClock>
      <Note ground="room" label="The one light" width={600} style={{ position: "absolute", left: 48, top: 772 }}>
        {PROOF}
      </Note>
      <div className="absolute" style={{ left: 704, top: 772, width: 688 }}>
        <Readout style={{ color: ink("room").faint }}>Its light, shot by shot</Readout>
        <div style={{ marginTop: 10 }}>
          <ShotLights cols={6} w={688} aspect={0.56} />
        </div>
      </div>
      <Readout className="absolute" style={{ right: 48, top: 734, width: 300, textAlign: "center", color: ink("room").faint }}>
        The same page, 375 wide
      </Readout>
    </SlideRoot>
  );
}
