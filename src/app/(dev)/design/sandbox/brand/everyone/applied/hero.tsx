"use client";

import { SITE_SUBHEAD, SITE_THESIS } from "@/lib/constants/marketing-voice";

import type { SlideProps } from "../../deck/contract";
import type { PhotoId } from "../../deck/media";
import { Trail, WORDMARK_DOT_SHARE } from "../marks";
import { isDesk, Pic, SlideGround } from "../slides/kit";
import { BASE, CROWD, ON, Orb, PhoneShell } from "../system";
import {
  Action,
  BrowserShell,
  Caption,
  PlayGlyph,
  Scaled,
  SiteNav,
  SiteNavPhone,
  StatusBar,
} from "./kit";

/**
 * 09 THE HOME HERO. partyreel.com's first screen in daylight: the site's own
 * line, whose full stop is whoever is looking, followed by everyone after
 * them, running off the page because the guest list is never closed; the
 * subhead; the one call to act; then the photographs, edge to edge at the
 * album's gap, untouched. The front door is people, and the pictures are
 * left whole.
 *
 * ★ THE LINE ENDS THE WAY THE WORD DOES. The wordmark's full stop is a person
 * and its trail is everyone after it; the site's thesis takes the same
 * ending, at the same share of its size, so the hero is the brand's idea said
 * once at full volume rather than a headline with a mascot beside it. It is
 * the page's one trail (the system's rule), and it never crosses a picture.
 *
 * ★ THE VISITOR IS A HOUSE GUEST: the site has no event of its own, so the
 * full stop (in the nav and in the line) is one of the five house lamps,
 * fresh each visit; the people after it are the sample album's guests, the
 * same album the band shows.
 */

const VISITOR = "house:305";

/**
 * The band is the live album (the creative director's pass: four uncredited
 * photographs were a stock landing page). Each photograph is credited under
 * it with its guest and when it landed, people beside the picture, never on it.
 */
const BAND: { id: PhotoId; focus?: string; by: number; when: string }[] = [
  { id: "wedding-toast", focus: "62% 45%", by: 2, when: "just now" },
  { id: "reception-table", focus: "50% 50%", by: 6, when: "1 min ago" },
  { id: "party-dj", focus: "50% 38%", by: 5, when: "4 min ago" },
  { id: "festival-crowd", focus: "50% 50%", by: 4, when: "9 min ago" },
];

/** A photograph's credit: its guest, then when it landed. */
function BandCredit({
  by,
  when,
  size,
  font,
}: {
  by: number;
  when: string;
  size: number;
  font: number;
}) {
  const p = CROWD[by];
  return (
    <span
      className="flex items-center"
      style={{
        gap: Math.round(size * 0.4),
        fontSize: font,
        color: ON.paper.ink,
      }}
    >
      <Orb seed={p.seed} size={size} />
      <span style={{ fontWeight: 600 }}>{p.name}</span>
      <span style={{ color: ON.paper.muted }}>{when}</span>
    </span>
  );
}

/** The thesis without its stop: the stop is drawn, a person. */
const [LINE_A, LINE_B] = SITE_THESIS.replace(/\.$/, "").split(", ");

/**
 * THE SITE'S LINE, ITS FULL STOP A PERSON. The stop sits where the period
 * would, on the baseline at the wordmark's share of the size, and the trail
 * leaves from it at the same size.
 */
function Thesis({
  size,
  count,
  read,
}: {
  size: number;
  count: number;
  read?: string;
}) {
  const d = size * WORDMARK_DOT_SHARE;
  const sink = size * 0.009;
  return (
    <h1
      className="ev-display"
      data-bd-read={read}
      style={{ fontSize: size, color: BASE.ink.hex, whiteSpace: "nowrap" }}
    >
      {LINE_A},
      <br />
      {LINE_B}
      {/* The stop is said once to a reader, as the line's own period; the orb is drawn for the eye. */}
      <span className="sr-only">.</span>
      <span
        aria-hidden
        className="relative inline-block"
        style={{
          width: d,
          height: d,
          marginLeft: size * 0.055,
          verticalAlign: "baseline",
        }}
      >
        <Orb
          seed={VISITOR}
          size={d}
          style={{ position: "absolute", left: 0, bottom: -sink }}
        />
        <span
          className="absolute"
          style={{ left: d + d * 0.34, bottom: -sink }}
          aria-hidden
        >
          <Trail h={size} count={count} start={0} />
        </span>
      </span>
    </h1>
  );
}

/* ── the page at a desk (real 1440 wide) ───────────────────────────────── */

const DESK_H = 1000;

function HeroDesk() {
  return (
    <div
      className="relative overflow-hidden"
      style={{ width: 1440, height: DESK_H, backgroundColor: ON.paper.ground }}
    >
      <SiteNav tone="paper" dot={VISITOR} />
      <div className="absolute" style={{ left: 56, top: 124 }}>
        <Thesis size={150} count={30} read="H1 at a desk" />
      </div>
      <div
        className="absolute flex items-end justify-between"
        style={{ left: 56, right: 56, top: 446 }}
      >
        <p
          className="ev-body"
          data-bd-contrast="subhead on paper"
          style={{
            width: 600,
            fontSize: 21,
            lineHeight: 1.45,
            color: BASE.muted.hex,
          }}
        >
          {SITE_SUBHEAD}
        </p>
        <div className="flex" style={{ gap: 12, paddingBottom: 4 }}>
          <Action
            tone="paper"
            solid
            h={56}
            font={17}
            contrastLabel="Start free on its plate"
          >
            Start free
          </Action>
          <Action tone="paper" h={56} font={17}>
            <PlayGlyph size={13} />
            Watch a sample reel
          </Action>
        </div>
      </div>
      <div
        className="absolute flex"
        style={{ left: 0, top: 640, width: 1440, height: DESK_H - 640, gap: 3 }}
      >
        {BAND.map((b) => (
          <div
            key={b.id}
            className="flex flex-col"
            style={{ flex: 1, height: "100%" }}
          >
            <Pic id={b.id} focus={b.focus} style={{ flex: 1, minHeight: 0 }} />
            <div
              style={{
                height: 44,
                display: "flex",
                alignItems: "center",
                paddingInline: 14,
              }}
            >
              <BandCredit by={b.by} when={b.when} size={20} font={14} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── the page on a phone (real 375 wide) ───────────────────────────────── */

function HeroPhone({ top, status = false }: { top: number; status?: boolean }) {
  const tile = (375 - 3) / 2;
  return (
    <div
      className="relative overflow-hidden"
      style={{ width: 375, backgroundColor: ON.paper.ground }}
    >
      {status ? <StatusBar tone="paper" /> : <div style={{ height: top }} />}
      <SiteNavPhone tone="paper" dot={VISITOR} />
      <div style={{ padding: "30px 20px 0" }}>
        {/* 46 px: the line runs 0.43 em a letter, so "The whole event," holds 335 with room to spare. */}
        <Thesis
          size={46}
          count={12}
          read={status ? undefined : "H1 on a phone"}
        />
        <p
          className="ev-body"
          data-bd-contrast={status ? undefined : "subhead on a phone"}
          style={{
            marginTop: 22,
            fontSize: 16.5,
            lineHeight: 1.45,
            color: BASE.muted.hex,
          }}
        >
          {SITE_SUBHEAD}
        </p>
        <div className="flex" style={{ gap: 10, marginTop: 24 }}>
          <Action tone="paper" solid h={46} font={15.5}>
            Start free
          </Action>
          <Action tone="paper" h={46} font={15.5}>
            <PlayGlyph size={11} />
            Watch a sample reel
          </Action>
        </div>
      </div>
      <div
        className="grid"
        style={{
          marginTop: 32,
          gridTemplateColumns: "1fr 1fr",
          columnGap: 3,
          rowGap: 10,
        }}
      >
        {BAND.map((b) => (
          <div key={b.id}>
            <Pic id={b.id} focus={b.focus} style={{ height: tile }} />
            <div style={{ marginTop: 7, paddingInline: 2 }}>
              <BandCredit by={b.by} when={b.when} size={16} font={12} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── the slide ─────────────────────────────────────────────────────────── */

export function Hero({ screen }: SlideProps) {
  if (!isDesk(screen)) {
    return (
      <SlideGround tone="paper" screen={screen} pad={false}>
        <HeroPhone top={52} />
      </SlideGround>
    );
  }
  const bw = 986;
  const scale = bw / 1440;
  const pw = 284;
  const ps = pw / 375;
  return (
    <SlideGround
      tone="paper"
      screen={screen}
      pad={false}
      style={{ backgroundColor: BASE.step.hex }}
    >
      <div className="absolute" style={{ left: 52, top: 92 }}>
        <BrowserShell
          width={bw}
          height={Math.round(DESK_H * scale)}
          url="partyreel.com"
        >
          <Scaled w={1440} h={DESK_H} scale={scale}>
            <HeroDesk />
          </Scaled>
        </BrowserShell>
        <Caption tone="paper" style={{ marginTop: 14 }}>
          partyreel.com at a desk
        </Caption>
      </div>
      <div className="absolute" style={{ left: 1440 - 52 - pw - 18, top: 120 }}>
        <PhoneShell width={pw} tone="paper">
          <Scaled w={375} h={812} scale={ps}>
            <HeroPhone top={0} status />
          </Scaled>
        </PhoneShell>
        <Caption tone="paper" style={{ marginTop: 14 }}>
          On a phone
        </Caption>
      </div>
    </SlideGround>
  );
}
