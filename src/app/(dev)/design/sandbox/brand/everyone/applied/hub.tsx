"use client";

import type { SlideProps } from "../../deck/contract";
import { PARTY, Qr } from "../../deck/media";
import { Wordmark } from "../marks";
import { isDesk, Pic, SlideGround } from "../slides/kit";
import {
  AddRing,
  BASE,
  HOST,
  ON,
  Orb,
  PhoneShell,
  type StatusKind,
  StatusTag,
} from "../system";
import {
  Action,
  BrowserShell,
  Caption,
  Chevron,
  PrintGlyph,
  Scaled,
  ShareGlyph,
  StatusBar,
} from "./kit";

/**
 * 12 THE HUB, EMPTY. Maya's own event a minute after she made it: her cover,
 * the name, the code ready to share, and the album that starts here, wearing
 * the vision's atmosphere where the photographs will be: on the album's dark
 * well, the host stands alone, her own orb, lit, with the Add ringed in her
 * colour (one guest is a whole ring). "Just you so far" is the row's first
 * line, and every guest after her adds to it.
 *
 * ★ THE STATUS SET WHERE A HOST READS IT: production's readiness list ("Before
 * guests arrive") is where an empty hub has state, so its rows wear the tags:
 * done as success, the code nobody has opened yet as waiting, achromatic and
 * still (nothing is running). They sit in the list, never beside a person.
 *
 * ★ A STRESS TEST, KEPT ON PURPOSE: Maya's seed lands at hue 145 and success
 * is green at 152, so the host and a done row share a hue. They are told apart
 * by form alone (a lit round person, a flat square plate with a glyph and its
 * word), which is the system's claim seen at its hardest.
 */

const READY: { title: string; line: string; kind: StatusKind; word: string }[] = [
  { title: "Who can get in", line: "Anyone with the code, once their email is confirmed.", kind: "success", word: "Done" },
  { title: "What guests can add", line: "Uploads are open.", kind: "success", word: "Done" },
  { title: "The code", line: "Nobody has opened it yet.", kind: "waiting", word: "Not yet" },
];

/** The readiness list, its rows wearing the status set. */
function Ready({ font, tag, desk }: { font: number; tag: number; desk: boolean }) {
  return (
    <div>
      <p className="ev-title" style={{ fontSize: font + 3, color: BASE.ink.hex }}>
        Before guests arrive
      </p>
      <p className="ev-body" style={{ fontSize: font - 1, color: BASE.muted.hex, marginTop: 2 }}>
        Guests still need one more thing.
      </p>
      <ul style={{ marginTop: 10 }}>
        {READY.map((r, i) => (
          <li
            key={r.title}
            className="flex items-center justify-between"
            style={{ gap: 14, padding: `${desk ? 9 : 10}px 0`, borderTop: `1px solid ${ON.paper.line}` }}
          >
            <div className="ev-body min-w-0" style={{ fontSize: font }}>
              <p style={{ fontWeight: 550, color: BASE.ink.hex }}>{r.title}</p>
              <p style={{ fontSize: font - 1.5, color: BASE.muted.hex, marginTop: 1 }}>{r.line}</p>
            </div>
            <StatusTag
              kind={r.kind}
              size={tag}
              contrastLabel={desk && i === 2 ? "waiting word on its plate" : undefined}
            >
              {r.word}
            </StatusTag>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** The code on its white mat, the address under it, and the two ways out. */
function CodeCard({ qr, font, desk }: { qr: number; font: number; desk: boolean }) {
  return (
    <div
      className="flex items-center"
      style={{
        gap: desk ? 20 : 16,
        padding: desk ? 18 : 16,
        borderRadius: 12,
        backgroundColor: BASE.white.hex,
        boxShadow: `0 0 0 1px ${ON.paper.line}`,
      }}
    >
      <div style={{ padding: 4, flex: "none" }}>
        <Qr size={qr} color={BASE.ink.hex} />
      </div>
      <div className="min-w-0">
        <p className="ev-title" style={{ fontSize: font + 3, color: BASE.ink.hex }}>
          The code
        </p>
        <p className="ev-body text-balance" style={{ fontSize: font - 0.5, color: BASE.muted.hex, marginTop: 3, lineHeight: 1.4 }}>
          Share it to bring everyone in.
        </p>
        <p className="ev-body" style={{ fontSize: font - 1.5, color: BASE.ink.hex, marginTop: 10, fontWeight: 500 }}>
          {/* The address breaks after its /e/ or not at all: never inside the slug. */}
          {PARTY.url.split("/e/")[0]}/e/
          <wbr />
          <span className="whitespace-nowrap">{PARTY.url.split("/e/")[1]}</span>
        </p>
        <div className="flex" style={{ gap: 8, marginTop: 12 }}>
          <Action tone="paper" solid h={desk ? 36 : 36} font={font - 1}>
            <ShareGlyph size={13} />
            Invite
          </Action>
          <Action tone="paper" h={desk ? 36 : 36} font={font - 1}>
            <PrintGlyph size={13} />
            Print
          </Action>
        </div>
      </div>
    </div>
  );
}

/**
 * THE ALBUM BEFORE ITS FIRST PHOTOGRAPH: the dark well where pictures will be,
 * and the host alone on it. Her orb is the event's whole mix today.
 */
function Well({
  w,
  h,
  orb,
  head,
  font,
  add,
}: {
  w: number;
  h: number;
  orb: number;
  head: number;
  font: number;
  add: number;
}) {
  return (
    <div
      className="relative flex flex-col items-center"
      style={{ width: w, height: h, borderRadius: 12, backgroundColor: BASE.well.hex, paddingTop: h * 0.13 }}
    >
      <Orb seed={HOST.seed} size={orb} lit className="ev-arrive" title={HOST.name} />
      <p
        className="ev-head text-center"
        data-bd-contrast={font > 15 ? "the album's line on the well" : undefined}
        style={{ fontSize: head, color: BASE.roomInk.hex, marginTop: h * 0.07 }}
      >
        Your first album starts here
      </p>
      <p className="ev-body text-center" style={{ fontSize: font, color: BASE.roomMuted.hex, marginTop: 8, maxWidth: w * 0.8 }}>
        Add the first photos. Everyone who scans the code adds theirs.
      </p>
      <div className="absolute" style={{ left: "50%", bottom: h * 0.07, transform: "translateX(-50%)" }}>
        <AddRing people={[HOST]} size={add} ground={BASE.well.hex} />
      </div>
    </div>
  );
}

/** Maya, and the line the row starts with. */
function JustYou({ size, font }: { size: number; font: number }) {
  return (
    <div className="flex items-center" style={{ gap: 10 }}>
      <Orb seed={HOST.seed} size={size} initial="M" title={HOST.name} />
      <span className="ev-body" style={{ fontSize: font, color: BASE.ink.hex }}>
        Just you so far
      </span>
    </div>
  );
}

/* ── the hub at a desk (real 1440 wide) ────────────────────────────────── */

const DESK_H = 1000;

function HubDesk() {
  return (
    <div className="relative overflow-hidden" style={{ width: 1440, height: DESK_H, backgroundColor: ON.paper.ground }}>
      <div className="flex items-center justify-between" style={{ height: 62, paddingInline: 40 }}>
        <div className="flex items-center" style={{ gap: 26 }}>
          <Wordmark height={24} dot={HOST.seed} read="wordmark in the app, Maya's dot" />
          <span className="ev-body flex items-center" style={{ gap: 8, fontSize: 14.5, color: BASE.muted.hex }}>
            Your events
            <Chevron dir="right" size={10} color={BASE.faint.hex} />
            <span style={{ color: BASE.ink.hex, fontWeight: 550 }}>{PARTY.name}</span>
          </span>
        </div>
        <div className="flex items-center" style={{ gap: 18 }}>
          <span className="ev-body" style={{ fontSize: 14.5, color: BASE.ink.hex }}>Settings</span>
          <Orb seed={HOST.seed} size={32} initial="M" />
        </div>
      </div>
      <Pic id="wedding-arch" focus="50% 46%" style={{ width: 1440, height: 270, borderRadius: 0 }} />
      <div className="absolute" style={{ left: 56, top: 362 }}>
        <h1 className="ev-display" data-bd-read="the event's name" style={{ fontSize: 66, color: BASE.ink.hex }}>
          {PARTY.name}
        </h1>
        <p className="ev-body" style={{ fontSize: 16.5, color: BASE.muted.hex, marginTop: 10 }}>
          {PARTY.date} · {PARTY.kind}
        </p>
      </div>
      <div className="absolute" style={{ left: 928, top: 400 }}>
        <JustYou size={34} font={16} />
      </div>
      <div className="absolute" style={{ left: 56, top: 500 }}>
        <Well w={840} h={456} orb={160} head={36} font={16.5} add={60} />
      </div>
      <div className="absolute grid" style={{ left: 928, top: 500, width: 456, gap: 22 }}>
        <CodeCard qr={132} font={15} desk />
        <Ready font={15} tag={26} desk />
      </div>
    </div>
  );
}

/* ── the hub on a phone (real 375 wide) ────────────────────────────────── */

function HubPhone({ top, status = false }: { top: number; status?: boolean }) {
  return (
    <div className="relative overflow-hidden" style={{ width: 375, backgroundColor: ON.paper.ground }}>
      {status ? <StatusBar tone="paper" /> : <div style={{ height: top }} />}
      <div className="flex items-center justify-between" style={{ height: 48, paddingInline: 16 }}>
        <span className="ev-body flex items-center" style={{ gap: 4, fontSize: 15, color: BASE.ink.hex }}>
          <Chevron dir="left" size={16} weight={1.8} />
          Your events
        </span>
        <Orb seed={HOST.seed} size={30} initial="M" />
      </div>
      <Pic id="wedding-arch" focus="50% 46%" style={{ width: 375, height: 200, borderRadius: 0 }} />
      <div style={{ padding: "20px 16px 0" }}>
        <h1 className="ev-display" data-bd-read={status ? undefined : "the event's name, on a phone"} style={{ fontSize: 42, color: BASE.ink.hex }}>
          {PARTY.name}
        </h1>
        <p className="ev-body" style={{ fontSize: 15, color: BASE.muted.hex, marginTop: 6 }}>
          {PARTY.date} · {PARTY.kind}
        </p>
        <div style={{ marginTop: 14 }}>
          <JustYou size={28} font={15} />
        </div>
        <div style={{ marginTop: 18 }}>
          <Well w={343} h={396} orb={116} head={25} font={14.5} add={56} />
        </div>
        <div style={{ marginTop: 16 }}>
          <CodeCard qr={112} font={14.5} desk={false} />
        </div>
        <div style={{ marginTop: 22 }}>
          <Ready font={14.5} tag={24} desk={false} />
        </div>
      </div>
    </div>
  );
}

/* ── the slide ─────────────────────────────────────────────────────────── */

export function EmptyHub({ screen }: SlideProps) {
  if (!isDesk(screen)) {
    return (
      <SlideGround tone="paper" screen={screen} pad={false}>
        <HubPhone top={52} />
      </SlideGround>
    );
  }
  const bw = 986;
  const scale = bw / 1440;
  const pw = 284;
  return (
    <SlideGround tone="paper" screen={screen} pad={false} style={{ backgroundColor: BASE.step.hex }}>
      <div className="absolute" style={{ left: 52, top: 92 }}>
        <BrowserShell width={bw} height={Math.round(DESK_H * scale)} url="partyreel.com/dashboard">
          <Scaled w={1440} h={DESK_H} scale={scale}>
            <HubDesk />
          </Scaled>
        </BrowserShell>
        <Caption tone="paper" style={{ marginTop: 14 }}>
          Maya&apos;s hub, a minute old
        </Caption>
      </div>
      <div className="absolute" style={{ left: 1440 - 52 - pw - 18, top: 120 }}>
        <PhoneShell width={pw} tone="paper">
          <Scaled w={375} h={812} scale={pw / 375}>
            <HubPhone top={0} status />
          </Scaled>
        </PhoneShell>
        <Caption tone="paper" style={{ marginTop: 14 }}>
          On her phone
        </Caption>
      </div>
    </SlideGround>
  );
}
