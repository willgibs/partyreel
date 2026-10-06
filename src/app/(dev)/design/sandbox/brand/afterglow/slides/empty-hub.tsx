"use client";

import type { CSSProperties, ReactNode } from "react";

import type { SlideProps } from "../../deck/contract";
import { PARTY, Seeded } from "../../deck/media";
import {
  BrowserWindow,
  Btn,
  Glyph,
  Note,
  PhoneView,
  StatusLight,
} from "../kit";
import { Wordmark } from "../marks";
import { SlideRoot } from "../root";
import {
  type Ground,
  Readout,
  ROOM,
  type StatusId,
  VOICE,
} from "../system";
import { cardOf, groundOf, inkOf, useTake } from "../take";
import { LitCode, plateOf } from "./d-parts";
import { useMeasure } from "./parts";

/**
 * 12 THE HUB, EMPTY: Maya's own event page a minute after she made it, before
 * the first photograph, on both grounds, because the app follows the host's
 * own theme: light at her desk, dark on her phone.
 *
 * ★ THE CODE IS THE SCREEN'S ONE LIVE SUBJECT, and before the first
 * photograph its light is the event's seed. On the light hub it stands in the
 * cover's place, on a card drawn on the take's `onPaper.subject` (Aperture: a
 * piece of the room; Ink and Cast: paper), lit the take's way. The card clips
 * what it holds, so in Aperture the room's glow never reaches the page.
 *
 * ★ ONE LIGHT A SCREENFUL, ACROSS A SCROLL: a scroll later the head has gone
 * and the light has passed to the Add, its Ring filling as her first photos
 * send, while the album to come is the ground itself and says so in words.
 *
 * Words are production's own where it has them (the readiness steps, the
 * empty album's line), shortened to one line a step for the sketch.
 */

const STEPS: readonly { state: StatusId; title: string; line: string }[] = [
  { state: "ready", title: "Who can get in", line: "Anyone with the link." },
  { state: "ready", title: "What guests can add", line: "Photos and videos." },
  { state: "standby", title: "Highlight reel", line: "Plays from the second photo." },
  { state: "standby", title: "This event", line: "The note guests read first." },
  { state: "standby", title: "The code", line: "Nobody has scanned it yet." },
];

const EMPTY_LINE =
  "Your guests add photos and videos in seconds, straight from their phones. No app required.";

/** A hairline in the ground's own ink. */
const hairline = (g: Ground) =>
  g === "room" ? "rgb(255 255 255 / 0.07)" : "rgb(20 20 22 / 0.08)";

/* ── the pieces of the page ───────────────────────────────────────────────── */

/**
 * THE CODE'S CARD, in the cover's place. On a paper page its ground is the
 * take's `onPaper.subject`; on a room page the room's own card. ★ It clips
 * (overflow hidden, its corner kept): a take's light may reach past the plate
 * but never past the card.
 */
function CodeCard({
  page,
  w,
  h,
  q,
  caption,
}: {
  page: Ground;
  w: number;
  h: number;
  /** The code's modules, in px. */
  q: number;
  caption?: string;
}) {
  const take = useTake();
  const sub: Ground = page === "paper" ? take.onPaper.subject : "room";
  const t = inkOf(take, sub);
  const dark = sub === "room";
  const lift =
    page === "paper"
      ? "0 1px 2px rgb(20 20 22 / 0.1), 0 18px 40px -22px rgb(20 20 22 / 0.5)"
      : "0 18px 40px -24px rgb(0 0 0 / 0.8)";
  return (
    <div
      className="relative flex flex-col items-center justify-center overflow-hidden"
      data-bd-card={sub}
      style={{
        width: w,
        height: h,
        borderRadius: 20,
        // A piece of the room is lit from above like everything in it; the
        // hex under the gradient is what the deck's contrast reader finds.
        backgroundColor: dark ? ROOM.room.hex : cardOf(take, "paper").hex,
        backgroundImage: dark
          ? `linear-gradient(180deg, ${ROOM.card.hex} 0%, ${ROOM.room.hex} 62%)`
          : undefined,
        boxShadow: dark
          ? `inset 0 1px 0 rgb(255 255 255 / 0.09), inset 0 0 0 1px rgb(255 255 255 / 0.04), ${lift}`
          : `inset 0 0 0 1px rgb(20 20 22 / 0.08), 0 1px 2px rgb(20 20 22 / 0.04)`,
      }}
    >
      <LitCode q={q} ground={sub} />
      {caption ? (
        <Readout
          style={{
            color: t.faint,
            marginTop: Math.round(plateOf(q).box * 0.2),
          }}
        >
          {caption}
        </Readout>
      ) : null}
    </div>
  );
}

/**
 * Settings' five steps as a card: a point and its words for each. `height`
 * sets it to the code card's, the rows shared out between, so the head's two
 * cards stand on one line.
 */
function Checklist({
  ground,
  width,
  height,
}: {
  ground: Ground;
  width: number;
  height?: number;
}) {
  const take = useTake();
  const t = inkOf(take, ground);
  const rule = hairline(ground);
  return (
    <div
      className="flex flex-col"
      style={{
        width,
        height,
        borderRadius: 18,
        padding: "20px 22px 6px",
        background:
          ground === "room" ? ROOM.card.hex : cardOf(take, "paper").hex,
        boxShadow:
          ground === "room"
            ? "inset 0 0 0 1px rgb(255 255 255 / 0.06), inset 0 1px 0 rgb(255 255 255 / 0.05)"
            : "inset 0 0 0 1px rgb(20 20 22 / 0.08), 0 1px 2px rgb(20 20 22 / 0.04)",
      }}
    >
      <div className="flex items-baseline justify-between">
        <p className="ag-subtitle" style={{ fontSize: 19, color: t.fg }}>
          Get it ready
        </p>
        <Readout style={{ color: t.faint }}>2 of 5</Readout>
      </div>
      <div className="flex flex-col" style={{ marginTop: 10, flex: 1 }}>
        {STEPS.map((s, i) => (
          <div
            key={s.title}
            className="grid"
            style={{
              flex: 1,
              alignContent: "center",
              gridTemplateColumns: "20px 1fr",
              padding: "10px 0",
              borderTop: i ? `1px solid ${rule}` : undefined,
            }}
          >
            <span style={{ paddingTop: 5 }}>
              <StatusLight
                state={s.state}
                ground={ground}
                contrast={
                  i === 0
                    ? "a ready point on the checklist"
                    : i === 2
                      ? "a standby point on the checklist"
                      : undefined
                }
              />
            </span>
            <div>
              <p
                style={{
                  fontSize: 14.5,
                  fontWeight: 600,
                  lineHeight: 1.35,
                  color: t.fg,
                }}
              >
                {s.title}
              </p>
              <p
                className="ag-caption"
                style={{ fontSize: 13, color: t.muted, marginTop: 1 }}
              >
                {s.line}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/** The app's own bar at a desk: the wordmark, where she is, Help, her orb. */
function DeskBar({ ground }: { ground: Ground }) {
  const take = useTake();
  const t = inkOf(take, ground);
  return (
    <div
      className="absolute inset-x-0 top-0 flex items-center justify-between"
      style={{
        height: 72,
        paddingInline: 96,
        borderBottom: `1px solid ${hairline(ground)}`,
      }}
    >
      <span className="flex items-center" style={{ gap: 28 }}>
        <Wordmark height={20} color={t.fg} read="wordmark in the hub's bar" />
        <span className="flex items-center" style={{ gap: 10, fontSize: 14.5 }}>
          <span style={{ color: t.muted }}>Your events</span>
          <span style={{ color: t.faint }}>/</span>
          <span style={{ fontWeight: 500, color: t.fg }}>{PARTY.name}</span>
        </span>
      </span>
      <span
        className="flex items-center"
        style={{ gap: 22, fontSize: 14.5, color: t.muted }}
      >
        Help
        <Seeded seed={PARTY.hostSeed} style={{ width: 32, height: 32 }} />
      </span>
    </div>
  );
}

/**
 * The app's own bar on a phone, under its status bar. `title` is the event's
 * name once its head has scrolled away; until then the wordmark stands there.
 */
function PhoneBar({ ground, title }: { ground: Ground; title?: string }) {
  const take = useTake();
  const t = inkOf(take, ground);
  return (
    <div
      className="absolute inset-x-0 flex items-center justify-between"
      style={{ top: 54, height: 52, paddingInline: 20 }}
    >
      <span
        className="flex items-center"
        style={{ gap: 4, color: t.muted, fontSize: 15, fontWeight: 500 }}
      >
        <Glyph name="back" size={18} weight={2} />
        Events
      </span>
      <span
        className="absolute flex items-center"
        style={{ left: "50%", transform: "translateX(-50%)" }}
      >
        {title ? (
          <span style={{ fontSize: 16, fontWeight: 600, color: t.fg }}>
            {title}
          </span>
        ) : (
          <Wordmark height={16} color={t.fg} read="wordmark in the phone's bar" />
        )}
      </span>
      <Seeded seed={PARTY.hostSeed} style={{ width: 30, height: 30 }} />
    </div>
  );
}

/** The two buttons the empty album offers. */
function AlbumActions({ ground }: { ground: Ground }) {
  return (
    <div className="flex" style={{ gap: 12 }}>
      <Btn
        ground={ground}
        size="md"
        icon={<Glyph name="plus" size={17} weight={2.2} />}
      >
        Add photos
      </Btn>
      <Btn
        ground={ground}
        kind="secondary"
        size="md"
        icon={<Glyph name="print" size={16} />}
      >
        Print the code
      </Btn>
    </div>
  );
}

/* ── the pages ────────────────────────────────────────────────────────────── */

/** The hub at a desk, drawn at 1440 by 900 on `ground`. */
function HubDesk({ ground }: { ground: Ground }) {
  const take = useTake();
  const t = inkOf(take, ground);
  const card = 352;
  return (
    <div
      className="absolute inset-0 overflow-hidden"
      style={{ background: groundOf(take, ground).hex, color: t.fg }}
    >
      <DeskBar ground={ground} />
      {/* Before the first photograph the cover's place holds the code. */}
      <div className="absolute" style={{ left: 96, top: 120 }}>
        <CodeCard page={ground} w={card} h={card} q={168} />
      </div>
      <div className="absolute" style={{ left: 96 + card + 48, top: 198 }}>
        <Readout style={{ color: t.faint }}>
          {PARTY.kind} · {PARTY.date}
        </Readout>
        <h1
          className="ag-title"
          data-bd-contrast="the event's name on the page"
          style={{ fontSize: 68, marginTop: 12, color: t.fg }}
        >
          {PARTY.name}
        </h1>
        <div className="flex items-center" style={{ gap: 10, marginTop: 24 }}>
          <span style={{ fontSize: 15.5, color: t.muted, marginRight: 6 }}>
            {PARTY.url}
          </span>
          <Btn
            ground={ground}
            kind="secondary"
            size="sm"
            icon={<Glyph name="copy" size={15} />}
          >
            Copy link
          </Btn>
          <Btn
            ground={ground}
            size="sm"
            icon={<Glyph name="share" size={15} weight={2} />}
          >
            Share
          </Btn>
        </div>
        <div className="flex items-center" style={{ gap: 22, marginTop: 26 }}>
          <StatusLight
            state="ready"
            ground={ground}
            wordContrast="the status word on the page"
          >
            Open: anyone with the link
          </StatusLight>
          <span
            className="flex items-center"
            style={{ gap: 8, fontSize: 13.5, color: t.muted }}
          >
            <Seeded seed={PARTY.hostSeed} style={{ width: 20, height: 20 }} />
            Hosted by {PARTY.host}
          </span>
        </div>
      </div>
      <div className="absolute" style={{ right: 96, top: 120 }}>
        <Checklist ground={ground} width={360} height={card} />
      </div>
      {/* The album to come is the ground itself, and says so in words: a
          second field of colour here would be a second light. */}
      <div
        className="absolute"
        style={{
          left: 96,
          right: 96,
          top: 520,
          height: 1,
          background: hairline(ground),
        }}
      />
      <div
        className="absolute flex justify-between"
        style={{ left: 96, right: 96, top: 540 }}
      >
        <Readout style={{ color: t.faint }}>The album</Readout>
        <Readout style={{ color: t.faint }}>No photos yet</Readout>
      </div>
      <div
        className="absolute inset-x-0 flex flex-col items-center text-center"
        style={{ top: 628 }}
      >
        <h2
          className="ag-title"
          data-bd-read="the empty album's line"
          style={{ fontSize: 40, color: t.fg }}
        >
          {VOICE.hostEmpty}
        </h2>
        <p
          className="ag-lede"
          style={{
            fontSize: 17,
            color: t.muted,
            marginTop: 12,
            maxWidth: 470,
            textWrap: "balance",
          }}
        >
          {EMPTY_LINE}
        </p>
        <div style={{ marginTop: 28 }}>
          <AlbumActions ground={ground} />
        </div>
      </div>
    </div>
  );
}

/** The hub on a phone, its first screen (375 by 812) on `ground`. */
function HubPhone({ ground }: { ground: Ground }) {
  const take = useTake();
  const t = inkOf(take, ground);
  return (
    <div
      className="absolute inset-0 overflow-hidden"
      style={{ background: groundOf(take, ground).hex, color: t.fg }}
    >
      <PhoneBar ground={ground} />
      <div className="absolute" style={{ left: 20, top: 118 }}>
        <CodeCard page={ground} w={335} h={272} q={136} />
      </div>
      <div
        className="absolute inset-x-0 flex flex-col items-center text-center"
        style={{ top: 418 }}
      >
        <Readout style={{ color: t.faint }}>
          {PARTY.kind} · {PARTY.date}
        </Readout>
        <h1
          className="ag-title"
          style={{ fontSize: 38, marginTop: 8, color: t.fg }}
        >
          {PARTY.name}
        </h1>
        <div style={{ marginTop: 14 }}>
          <StatusLight state="ready" ground={ground}>
            Open: anyone with the link
          </StatusLight>
        </div>
        <div className="flex" style={{ gap: 10, marginTop: 22 }}>
          <Btn
            ground={ground}
            size="md"
            icon={<Glyph name="share" size={16} weight={2} />}
          >
            Share
          </Btn>
          <Btn
            ground={ground}
            kind="secondary"
            size="md"
            icon={<Glyph name="copy" size={16} />}
          >
            Copy link
          </Btn>
        </div>
      </div>
      <div
        className="absolute"
        style={{
          left: 20,
          right: 20,
          top: 664,
          height: 1,
          background: hairline(ground),
        }}
      />
      <div className="absolute" style={{ left: 20, right: 20, top: 688 }}>
        <h2 className="ag-title" style={{ fontSize: 24, color: t.fg }}>
          {VOICE.hostEmpty}
        </h2>
        <p
          className="ag-body"
          style={{ fontSize: 14, color: t.muted, marginTop: 6 }}
        >
          {EMPTY_LINE}
        </p>
      </div>
    </div>
  );
}

/**
 * A scroll later, as her first photographs send (375 by 812 on `ground`):
 * the head has gone, the bar carries the event's name, and the light has
 * passed to the Add.
 */
function HubPhoneSending({ ground }: { ground: Ground }) {
  const take = useTake();
  const t = inkOf(take, ground);
  const { Ring } = take.light;
  return (
    <div
      className="absolute inset-0 overflow-hidden"
      style={{ background: groundOf(take, ground).hex, color: t.fg }}
    >
      <PhoneBar ground={ground} title={PARTY.name} />
      <div
        className="absolute flex justify-between"
        style={{
          left: 20,
          right: 20,
          top: 118,
          paddingBottom: 12,
          borderBottom: `1px solid ${hairline(ground)}`,
        }}
      >
        <Readout style={{ color: t.faint }}>The album</Readout>
        <Readout style={{ color: t.faint }}>No photos yet</Readout>
      </div>
      {/* Centred in the album's own space, between its rule and the line
          that says what is sending: the empty album is the ground itself. */}
      <div
        className="absolute flex flex-col items-center text-center"
        style={{ left: 32, right: 32, top: 344 }}
      >
        <h2
          className="ag-title"
          data-bd-read="the phone's empty album line"
          style={{ fontSize: 27, color: t.fg, textWrap: "balance" }}
        >
          {VOICE.hostEmpty}
        </h2>
        <p
          className="ag-body"
          style={{
            fontSize: 14.5,
            color: t.muted,
            marginTop: 10,
            textWrap: "balance",
          }}
        >
          {EMPTY_LINE}
        </p>
      </div>
      {/* The shutter, docked: the screen's one light, filling as files go. */}
      <div
        className="absolute inset-x-0 flex flex-col items-center"
        style={{ bottom: 44 }}
      >
        <StatusLight state="standby" ground={ground}>
          Sending 2 of 3
        </StatusLight>
        <div style={{ marginTop: 22 }}>
          <Ring
            source={{ seed: PARTY.seed }}
            ground={ground}
            size={66}
            progress={0.66}
            label="Add photos"
          />
        </div>
      </div>
    </div>
  );
}

/* ── the slide ────────────────────────────────────────────────────────────── */

/**
 * A small readout under a screen, in the slide's own faint ink, set in the
 * same line box as a Note's label so the two stand on one line.
 */
function Under({
  children,
  style,
}: {
  children: ReactNode;
  style?: CSSProperties;
}) {
  const t = inkOf(useTake(), "room");
  return (
    <div style={style}>
      <Readout style={{ color: t.faint }}>{children}</Readout>
    </div>
  );
}

export function EmptyHubSlide({ screen }: SlideProps) {
  const take = useTake();
  const m = useMeasure();

  if (m.desk) {
    // The browser and the phone stand on one baseline, as tall as each other.
    const bw = 960;
    const pw = 301;
    const top = m.top;
    return (
      <SlideRoot screen={screen} ground="room">
        <BrowserWindow
          width={bw}
          ground="paper"
          url={`partyreel.com/dashboard/${PARTY.slug}`}
          style={{ position: "absolute", left: m.pad, top }}
        >
          <HubDesk ground="paper" />
        </BrowserWindow>
        <PhoneView
          width={pw}
          ground="room"
          on="room"
          style={{ position: "absolute", left: m.w - m.pad - pw, top }}
        >
          <HubPhoneSending ground="room" />
        </PhoneView>
        <Under
          style={{
            position: "absolute",
            left: m.w - m.pad - pw,
            top: top + 660,
            width: pw,
            textAlign: "center",
          }}
        >
          Her phone, a scroll later
        </Under>
        <Note
          ground="room"
          label="Light at her desk, dark on her phone"
          width={600}
          style={{ position: "absolute", left: m.pad, top: top + 660 }}
        >
          {take.words.notes.hub}
        </Note>
      </SlideRoot>
    );
  }

  // The phone: two screens in their bodies on the room, the light one first,
  // so the deck's head stands on the room above them (a page at 1:1 would
  // put paper under the head's light ink).
  const pw = m.inner;
  const bezel = Math.round(pw * 0.03);
  const ph = Math.round(812 * ((pw - 2 * bezel) / 375)) + 2 * bezel;
  const gap = 92;
  const p1 = m.top + 28;
  const p2 = p1 + ph + gap;
  return (
    <SlideRoot screen={screen} ground="room">
      <Under style={{ position: "absolute", left: m.pad, top: m.top }}>
        Light, a minute old
      </Under>
      <PhoneView
        width={pw}
        ground="paper"
        on="room"
        style={{ position: "absolute", left: m.pad, top: p1 }}
      >
        <HubPhone ground="paper" />
      </PhoneView>
      <Under style={{ position: "absolute", left: m.pad, top: p2 - 28 }}>
        Dark, a scroll later, as her photos send
      </Under>
      <PhoneView
        width={pw}
        ground="room"
        on="room"
        style={{ position: "absolute", left: m.pad, top: p2 }}
      >
        <HubPhoneSending ground="room" />
      </PhoneView>
      <Note
        ground="room"
        label="Her own theme, light or dark"
        width={m.inner}
        style={{ position: "absolute", left: m.pad, top: p2 + ph + 48 }}
      >
        {take.words.notes.hub}
      </Note>
    </SlideRoot>
  );
}
