"use client";

import type { SlideProps } from "../../deck/contract";
import { PARTY, Seeded } from "../../deck/media";
import { Wordmark } from "../marks";
import { ink, SlideRoot } from "../root";
import {
  CodePlate,
  GROUND,
  lightOfSeed,
  Readout,
  Ring,
  SeedCover,
  type StatusId,
  StatusLight,
  VOICE,
} from "../system";
import { BrowserWindow, Btn, Glyph, Note, PhoneView } from "./kit";

/**
 * 12 THE HUB, EMPTY: Maya & Jay's own album, a minute after she made it, no
 * photograph yet. Before the first photograph the light is the event's own
 * seed (its hashvatar hue, a teal, at three depths): the code stands in its
 * Bloom, the screen's one light, and where the album will be, the seed glows
 * in the dark as its atmosphere. The status set sits where it naturally does,
 * on the rail of Settings' five steps: a Ready point for what is done, the
 * half-lit Standby for what waits, no hue for waiting.
 *
 * ★ ONE LIGHT PER SCREENFUL, ACROSS A SCROLL: the shutter is not on the first
 * screen, where the code is lit. A scroll later the head has gone, and the
 * light has passed to the Add: its Ring fills with the seed's light as her
 * first photographs send (the study's "aurora that answers": a real signal).
 *
 * Words are production's own (`readiness.ts`, the empty states).
 */

const SEED_LIGHT = lightOfSeed(PARTY.seed);

const STEPS: readonly { state: StatusId; title: string; line: string }[] = [
  { state: "ready", title: "Who can get in", line: "Anyone with the link." },
  { state: "ready", title: "What guests can add", line: "Uploads are open." },
  { state: "standby", title: "Highlight reel", line: "An album with a few photos in it invites guests to add theirs." },
  { state: "standby", title: "This event", line: "Write the note guests read first, after they scan the code." },
  { state: "standby", title: "The code", line: "Nobody has opened it yet. Send it or print it, then scan it once yourself." },
];

const EMPTY_LINE = "Your guests add photos and videos in seconds, straight from their phones. No app required.";

/** Settings' five steps as a rail: a point and its words for each. */
function Rail() {
  const t = ink("room");
  return (
    <div
      style={{
        background: GROUND.roomCard.hex,
        borderRadius: 16,
        padding: "20px 22px 8px",
        boxShadow: "inset 0 0 0 1px rgb(255 255 255 / 0.06), inset 0 1px 0 rgb(255 255 255 / 0.05)",
      }}
    >
      <div className="flex items-baseline justify-between">
        <p className="ag-subtitle" style={{ fontSize: 19 }}>
          Get it ready
        </p>
        <Readout style={{ color: t.faint }}>2 of 5</Readout>
      </div>
      <div className="flex flex-col" style={{ marginTop: 12 }}>
        {STEPS.map((s, i) => (
          <div
            key={s.title}
            className="grid"
            style={{
              gridTemplateColumns: "18px 1fr",
              padding: "11px 0",
              borderTop: i ? "1px solid rgb(255 255 255 / 0.06)" : undefined,
            }}
          >
            <span style={{ paddingTop: 5 }}>
              <StatusLight
                state={s.state}
                ground="room"
                contrast={i === 0 ? "a ready point on the rail" : i === 2 ? "a standby point on the rail" : undefined}
              />
            </span>
            <div>
              <p style={{ fontSize: 14.5, fontWeight: 600, lineHeight: 1.35 }}>{s.title}</p>
              <p className="ag-caption" style={{ fontSize: 13, color: t.muted, marginTop: 1 }}>
                {s.line}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/** The app's own bar: the wordmark alone, where she is, and her orb. */
function AppBar({ phone = false }: { phone?: boolean }) {
  const t = ink("room");
  if (phone)
    return (
      <div className="absolute inset-x-0 flex items-center justify-between" style={{ top: 54, height: 52, paddingInline: 20 }}>
        <span className="flex items-center" style={{ gap: 6, color: t.muted, fontSize: 15, fontWeight: 500 }}>
          <Glyph name="back" size={18} weight={2} />
          Events
        </span>
        <Wordmark height={16} color={t.fg} read="wordmark in the app's bar" style={{ position: "absolute", left: "50%", transform: "translateX(-50%)" }} />
        <Seeded seed={PARTY.hostSeed} style={{ width: 30, height: 30 }} />
      </div>
    );
  return (
    <div
      className="absolute inset-x-0 top-0 flex items-center justify-between"
      style={{ height: 68, paddingInline: 40, borderBottom: "1px solid rgb(255 255 255 / 0.06)" }}
    >
      <span className="flex items-center" style={{ gap: 26 }}>
        <Wordmark height={20} color={t.fg} read="wordmark in the app's bar" />
        <span className="flex items-center" style={{ gap: 10, fontSize: 14.5 }}>
          <span style={{ color: t.muted }}>Your events</span>
          <span style={{ color: t.faint }}>/</span>
          <span style={{ fontWeight: 500 }}>{PARTY.name}</span>
        </span>
      </span>
      <span className="flex items-center" style={{ gap: 22, fontSize: 14.5, color: t.muted }}>
        Help
        <Seeded seed={PARTY.hostSeed} style={{ width: 32, height: 32 }} />
      </span>
    </div>
  );
}

/** The hub at a desk, drawn at 1440 by 900. */
function HubDesk() {
  const t = ink("room");
  return (
    <div className="absolute inset-0 overflow-hidden" style={{ background: GROUND.room.hex, color: t.fg }}>
      <AppBar />
      {/* The head: the code, lit by the event's own seed, the one light. */}
      <div className="absolute" style={{ left: 96, top: 140 }}>
        <CodePlate size={168} light={SEED_LIGHT} ground="room" />
      </div>
      <div className="absolute" style={{ left: 410, top: 140, width: 540 }}>
        <Readout style={{ color: t.faint }}>
          {PARTY.kind} · {PARTY.date}
        </Readout>
        <h1 className="ag-title" data-bd-contrast="the event's name on the room" style={{ fontSize: 66, marginTop: 10 }}>
          {PARTY.name}
        </h1>
        <div className="flex items-center" style={{ gap: 12, marginTop: 20 }}>
          <span style={{ fontSize: 15.5, color: t.muted }}>{PARTY.url}</span>
          <Btn ground="room" kind="secondary" size="sm" icon={<Glyph name="copy" size={15} />}>
            Copy link
          </Btn>
          <Btn ground="room" size="sm" icon={<Glyph name="share" size={15} weight={2} />}>
            Share
          </Btn>
        </div>
        <div className="flex items-center" style={{ gap: 22, marginTop: 24 }}>
          <StatusLight state="ready" ground="room" wordContrast="the status word on the room">
            Open: anyone with the link
          </StatusLight>
          <span className="flex items-center" style={{ gap: 8, fontSize: 13.5, color: t.muted }}>
            <Seeded seed={PARTY.hostSeed} style={{ width: 20, height: 20 }} />
            Hosted by {PARTY.host}
          </span>
        </div>
      </div>
      <div className="absolute" style={{ left: 1000, top: 108, width: 376 }}>
        <Rail />
      </div>
      {/* Where the album will be: the seed, glowing in the dark. */}
      <SeedCover seed={PARTY.seed} style={{ position: "absolute", left: 96, top: 488, width: 600, height: 380, borderRadius: 4 }} />
      <div className="absolute" style={{ left: 760, top: 560, width: 520 }}>
        <h2 className="ag-title" data-bd-read="the empty album's line" style={{ fontSize: 44 }}>
          {VOICE.hostEmpty}
        </h2>
        <p className="ag-lede" style={{ fontSize: 17, color: t.muted, marginTop: 14, maxWidth: 440 }}>
          {EMPTY_LINE}
        </p>
        <div className="flex" style={{ gap: 12, marginTop: 28 }}>
          <Btn ground="room" size="md" icon={<Glyph name="plus" size={17} weight={2.2} />}>
            Add photos
          </Btn>
          <Btn ground="room" kind="secondary" size="md" icon={<Glyph name="print" size={16} />}>
            Print the code
          </Btn>
        </div>
      </div>
    </div>
  );
}

/** The hub on a phone, its first screen: the code lit, the album to come. */
function HubPhone() {
  const t = ink("room");
  return (
    <div className="absolute inset-0 overflow-hidden" style={{ background: GROUND.room.hex, color: t.fg }}>
      <AppBar phone />
      {/* Set below the bar by the light's own reach (about 1.5 times its blur), so the
          bar and its wordmark stay out of the light. */}
      <div className="absolute inset-x-0 flex justify-center" style={{ top: 176 }}>
        <CodePlate size={128} light={SEED_LIGHT} ground="room" />
      </div>
      <div className="absolute inset-x-0 flex flex-col items-center text-center" style={{ top: 394 }}>
        <h1 className="ag-title" style={{ fontSize: 34 }}>
          {PARTY.name}
        </h1>
        <p className="ag-caption" style={{ fontSize: 13.5, color: t.muted, marginTop: 6 }}>
          {PARTY.kind} · {PARTY.date}
        </p>
        <div style={{ marginTop: 14 }}>
          <StatusLight state="ready" ground="room">
            Open: anyone with the link
          </StatusLight>
        </div>
        <div className="flex" style={{ gap: 10, marginTop: 20 }}>
          <Btn ground="room" size="md" icon={<Glyph name="share" size={16} weight={2} />}>
            Share
          </Btn>
          <Btn ground="room" kind="secondary" size="md" icon={<Glyph name="copy" size={16} />}>
            Copy link
          </Btn>
        </div>
      </div>
      <div className="absolute" style={{ left: 20, right: 20, top: 606 }}>
        <h2 className="ag-title" data-bd-read="the phone's empty album line" style={{ fontSize: 25 }}>
          {VOICE.hostEmpty}
        </h2>
        <p className="ag-body" style={{ fontSize: 14, color: t.muted, marginTop: 6 }}>
          {EMPTY_LINE}
        </p>
      </div>
      <SeedCover seed={PARTY.seed} style={{ position: "absolute", left: 20, right: 20, top: 712, height: 260, borderRadius: 4 }} />
    </div>
  );
}

/** A scroll later, as her first photographs send: the light has passed to the Add. */
function HubPhoneSending() {
  const t = ink("room");
  return (
    <div className="absolute inset-0 overflow-hidden" style={{ background: GROUND.room.hex, color: t.fg }}>
      <AppBar phone />
      <div className="absolute" style={{ left: 20, right: 20, top: 122 }}>
        <h2 className="ag-title" style={{ fontSize: 25 }}>
          {VOICE.hostEmpty}
        </h2>
        <p className="ag-body" style={{ fontSize: 14, color: t.muted, marginTop: 6 }}>
          {EMPTY_LINE}
        </p>
      </div>
      <SeedCover seed={PARTY.seed} style={{ position: "absolute", left: 20, right: 20, top: 222, height: 404, borderRadius: 4 }} />
      {/* The shutter stands on the room, never on the seed's glow, its band filling as the files go. */}
      <div
        className="absolute inset-x-0 flex flex-col items-center"
        style={{ bottom: 0, height: 150, paddingTop: 22, background: `linear-gradient(to bottom, transparent, ${GROUND.room.hex} 34%)` }}
      >
        <StatusLight state="standby" ground="room">
          Sending 2 of 3
        </StatusLight>
        <div style={{ marginTop: 18 }}>
          <Ring light={SEED_LIGHT} ground="room" size={66} progress={0.62} label="Add photos" className="ag-ring-fill-in" />
        </div>
      </div>
    </div>
  );
}

const PROOF =
  "Before the first photograph, the light is the event's own seed. The code glows with it; a scroll later the Add does, its Ring filling as her first photos send.";

export function EmptyHubSlide({ screen }: SlideProps) {
  const t = ink("room");
  if (screen === "375")
    return (
      <SlideRoot screen={screen} ground="room">
        <div className="absolute inset-x-0 top-0 overflow-hidden" style={{ height: 812 }}>
          <HubPhone />
        </div>
        <div
          className="absolute inset-x-0 flex items-center"
          style={{ top: 812, height: 44, paddingInline: 20, borderBlock: "1px solid rgb(255 255 255 / 0.08)", background: GROUND.display.hex }}
        >
          <Readout style={{ color: t.faint }}>A scroll later, as her first photos send</Readout>
        </div>
        <div className="absolute inset-x-0 overflow-hidden" style={{ top: 856, height: 812 }}>
          <HubPhoneSending />
        </div>
        <div
          className="absolute inset-x-0"
          style={{ top: 1668, paddingInline: 20, paddingTop: 22, borderTop: "1px solid rgb(255 255 255 / 0.08)" }}
        >
          <Note ground="room" label="The seed is the light">
            {PROOF}
          </Note>
        </div>
      </SlideRoot>
    );
  return (
    <SlideRoot screen={screen} ground="room" style={{ background: GROUND.display.hex }}>
      <BrowserWindow
        width={1000}
        ground="room"
        url={`partyreel.com/dashboard/${PARTY.slug}`}
        style={{ position: "absolute", left: 48, top: 92 }}
      >
        <HubDesk />
      </BrowserWindow>
      <PhoneView width={300} ground="room" style={{ position: "absolute", right: 48, top: 92 }}>
        <HubPhoneSending />
      </PhoneView>
      <Readout className="absolute" style={{ right: 48, top: 742, width: 300, textAlign: "center", color: t.faint }}>
        A scroll later, as her photos send
      </Readout>
      <Note ground="room" label="The seed is the light" width={660} style={{ position: "absolute", left: 48, top: 780 }}>
        {PROOF}
      </Note>
    </SlideRoot>
  );
}
