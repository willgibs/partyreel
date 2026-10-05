"use client";

import type { ReactNode } from "react";

import type { SlideProps } from "../../deck/contract";
import { PARTY } from "../../deck/media";
import {
  BASE,
  colorsOf,
  CROWD,
  GuestRow,
  HOUSE,
  ON,
  Orb,
  ratio,
  STATUS,
  STATUS_HUE,
  type StatusKind,
  StatusTag,
  swatch,
  type Tone,
} from "../system";
import { isDesk, Kicker, Pic, SlideGround } from "./kit";

/**
 * 04 COLOR AND STATUS. Three columns that answer three questions: what the
 * chrome is (grey, printed), where colour comes from (people, and the house
 * before them), and how a state looks (a flat tag), with the tags drawn in
 * place beside the people so the difference is seen rather than claimed.
 */

const GREYS: { name: string; s: ReturnType<typeof swatch>; role: string }[] = [
  { name: "Paper", s: BASE.paper, role: "Every light page" },
  { name: "Card", s: BASE.card, role: "A surface on paper" },
  { name: "Ink", s: BASE.ink, role: "Words on paper" },
  { name: "Muted", s: BASE.muted, role: "Second words" },
  { name: "Room", s: BASE.room, role: "Every dark page" },
  { name: "Display", s: BASE.display, role: "Every pop-out" },
];

const EXAMPLE = CROWD[3];

const TODAY_WARNING = swatch(0.8, 0.14, 80);

function SwatchRow({
  name,
  s,
  role,
  tone,
}: {
  name: string;
  s: ReturnType<typeof swatch>;
  role: string;
  tone: Tone;
}) {
  return (
    <div
      className="flex items-center"
      style={{
        gap: 14,
        padding: "8px 0",
        borderTop: `1px solid ${ON[tone].line}`,
      }}
    >
      <span
        className="ev-chip"
        style={{
          width: 46,
          height: 34,
          backgroundColor: s.hex,
          boxShadow: `inset 0 0 0 1px ${ON[tone].line}`,
        }}
      />
      <div className="ev-body" style={{ fontSize: 13, lineHeight: 1.35 }}>
        <p style={{ fontWeight: 600, color: ON[tone].ink }}>
          {name}{" "}
          <span style={{ fontWeight: 400, color: ON[tone].muted }}>
            · {role}
          </span>
        </p>
        <p className="ev-num" style={{ color: ON[tone].muted }}>
          {s.print}
        </p>
      </div>
    </div>
  );
}

function SwatchCell({
  name,
  s,
  tone,
}: {
  name: string;
  s: ReturnType<typeof swatch>;
  tone: Tone;
}) {
  return (
    <div className="flex items-center" style={{ gap: 10 }}>
      <span
        className="ev-chip"
        style={{
          width: 34,
          height: 34,
          backgroundColor: s.hex,
          boxShadow: `inset 0 0 0 1px ${ON[tone].line}`,
        }}
      />
      <div className="ev-body" style={{ fontSize: 12, lineHeight: 1.3 }}>
        <p style={{ fontWeight: 600 }}>{name}</p>
        <p className="ev-num" style={{ color: ON[tone].muted }}>
          {s.print.replace("oklch(", "").replace(")", "")}
        </p>
      </div>
    </div>
  );
}

function Source({ desk }: { desk: boolean }) {
  const c = colorsOf(EXAMPLE.seed);
  const step = (k: string, v: ReactNode) => (
    <div>
      <p className="ev-label" style={{ color: ON.paper.muted, fontSize: 10 }}>
        {k}
      </p>
      <p className="ev-body ev-num" style={{ fontSize: 13, marginTop: 3 }}>
        {v}
      </p>
    </div>
  );
  return (
    <div className="flex items-center" style={{ gap: desk ? 18 : 14 }}>
      <Orb
        seed={EXAMPLE.seed}
        size={desk ? 92 : 76}
        initial={EXAMPLE.name.slice(0, 1)}
      />
      <div className="grid" style={{ gap: 8 }}>
        {step("A person", EXAMPLE.name)}
        {step("Their seed, hashed", `hue ${Math.round(c.hue)}°`)}
        {step("Their color", c.print)}
      </div>
    </div>
  );
}

function House({ desk }: { desk: boolean }) {
  return (
    <div className="flex" style={{ gap: desk ? 14 : 10 }}>
      {HOUSE.map((h) => (
        <div
          key={h.hue}
          className="flex flex-col items-start"
          style={{ gap: 7 }}
        >
          <Orb seed={`house:${h.hue}`} size={desk ? 50 : 46} />
          <p
            className="ev-body ev-num"
            style={{
              fontSize: desk ? 11 : 10,
              lineHeight: 1.3,
              color: ON.paper.muted,
            }}
          >
            {h.name}
            <br />
            {`${h.l} ${h.c} ${h.hue}`}
          </p>
        </div>
      ))}
    </div>
  );
}

function Tags({
  tone,
  label,
  stacked = false,
}: {
  tone: Tone;
  label: (k: StatusKind) => string;
  stacked?: boolean;
}) {
  const words: Record<StatusKind, string> = {
    waiting: "In review",
    success: "Approved",
    error: "Too large",
  };
  return (
    <div className="grid" style={{ gap: stacked ? 16 : 12 }}>
      {(Object.keys(STATUS) as StatusKind[]).map((k) => (
        <div
          key={k}
          className={
            stacked ? "flex flex-col items-start" : "flex items-center"
          }
          style={{ gap: stacked ? 8 : 14 }}
        >
          <StatusTag
            kind={k}
            tone={tone}
            size={32}
            contrastLabel={label(k)}
            style={{ minWidth: 150 }}
          >
            {words[k]}
          </StatusTag>
          <p
            className="ev-body ev-num"
            style={{ fontSize: 12, color: ON[tone].muted, lineHeight: 1.35 }}
          >
            {k === "waiting"
              ? "Ink, no hue"
              : `Glyph ${STATUS_HUE[k][tone === "room" ? "room" : "paper"].print}`}{" "}
            ·{" "}
            <span style={{ color: ON[tone].ink, fontWeight: 600 }}>
              {k === "waiting"
                ? ratio(ON[tone].ink, ON[tone].ground)
                : ratio(
                    STATUS_HUE[k][tone === "room" ? "room" : "paper"].hex,
                    ON[tone].ground,
                  )}
            </span>
            <br />
            {STATUS[k].meaning}
          </p>
        </div>
      ))}
    </div>
  );
}

/** The tags where they live: beside the people, in a host's lists. */
function InSitu({ tone }: { tone: Tone }) {
  const t = ON[tone];
  return (
    <div
      style={{ backgroundColor: t.card, borderRadius: 8, padding: "6px 16px" }}
    >
      <div
        className="flex items-center justify-between"
        style={{ padding: "12px 0", borderBottom: `1px solid ${t.line}` }}
      >
        <div>
          <p className="ev-title" style={{ fontSize: 15 }}>
            {PARTY.name}
          </p>
          <div style={{ marginTop: 8 }}>
            <GuestRow
              people={CROWD}
              max={7}
              total={PARTY.guests}
              size={24}
              tone={tone}
            />
          </div>
        </div>
        <StatusTag kind="waiting" tone={tone} size={24}>
          12 in review
        </StatusTag>
      </div>
      <div
        className="flex items-center justify-between"
        style={{ padding: "12px 0", borderBottom: `1px solid ${t.line}` }}
      >
        <div className="flex items-center" style={{ gap: 12 }}>
          <Pic id="wedding-rings" style={{ width: 44, height: 44 }} />
          <div className="flex items-center" style={{ gap: 8 }}>
            <Orb seed={CROWD[2].seed} size={22} initial="P" />
            <span className="ev-body" style={{ fontSize: 13 }}>
              Priya
            </span>
          </div>
        </div>
        <StatusTag kind="success" tone={tone} size={24}>
          Approved
        </StatusTag>
      </div>
      <div
        className="flex items-center justify-between"
        style={{ padding: "12px 0" }}
      >
        <div className="flex items-center" style={{ gap: 8 }}>
          <Orb seed={CROWD[4].seed} size={22} initial="S" />
          <span className="ev-body" style={{ fontSize: 13 }}>
            Sam&apos;s 4K video
          </span>
        </div>
        <StatusTag kind="error" tone={tone} size={24}>
          Too large
        </StatusTag>
      </div>
    </div>
  );
}

function Today() {
  return (
    <div className="flex items-center" style={{ gap: 16 }}>
      <span className="ev-label" style={{ color: ON.paper.muted }}>
        Today
      </span>
      <span
        className="ev-label inline-flex items-center"
        style={{ gap: 7, color: ON.paper.ink }}
      >
        <span
          style={{
            width: 7,
            height: 7,
            borderRadius: 9999,
            backgroundColor: TODAY_WARNING.hex,
            boxShadow: `0 0 6px ${TODAY_WARNING.hex}`,
          }}
        />
        Waiting
      </span>
      <span
        className="ev-body ev-num"
        style={{ fontSize: 12, color: ON.paper.muted }}
      >
        {TODAY_WARNING.print}
      </span>
    </div>
  );
}

const WHY =
  "Waiting has no color: nothing has happened yet, so it can never read as the brand, as today's amber did.";

/** Words on each ground, measured by the deck (the caption prints the ratio). */
function ContrastRows() {
  const row = (tone: Tone, fg: string, label: string) => (
    <div
      className="flex items-center justify-between"
      style={{
        backgroundColor: ON[tone].ground,
        padding: "9px 12px",
        borderRadius: 2,
        boxShadow:
          tone === "paper" ? `inset 0 0 0 1px ${ON.paper.line}` : undefined,
      }}
    >
      <span
        className="ev-body"
        style={{ fontSize: 13, color: fg }}
        data-bd-contrast={label}
      >
        {label}
      </span>
      <span
        className="ev-body ev-num"
        style={{ fontSize: 13, fontWeight: 600, color: fg }}
      >
        {ratio(fg, ON[tone].ground)}
      </span>
    </div>
  );
  return (
    <div className="grid" style={{ gap: 6 }}>
      {row("paper", ON.paper.ink, "Ink on paper")}
      {row("paper", ON.paper.muted, "Muted on paper")}
      {row("room", ON.room.ink, "Paper in the room")}
      {row("room", ON.room.muted, "Muted in the room")}
    </div>
  );
}

/** The tags in the room: waiting turns over to a paper plate. */
function RoomStrip() {
  return (
    <div
      className="flex items-center"
      style={{
        backgroundColor: ON.room.ground,
        padding: "12px 14px",
        borderRadius: 8,
        gap: 10,
      }}
    >
      <StatusTag
        kind="waiting"
        tone="room"
        size={24}
        contrastLabel="waiting word in the room"
      >
        Develops at 9
      </StatusTag>
      <StatusTag kind="success" tone="room" size={24}>
        Sent
      </StatusTag>
      <StatusTag kind="error" tone="room" size={24}>
        Failed
      </StatusTag>
    </div>
  );
}

export function Color({ screen }: SlideProps) {
  if (!isDesk(screen)) return <ColorPhone screen={screen} />;
  return (
    <SlideGround tone="paper" screen={screen}>
      <div className="absolute" style={{ left: 72, top: 96, width: 320 }}>
        <Kicker tone="paper">The base</Kicker>
        <h3
          className="ev-head"
          style={{ fontSize: 30, marginTop: 12, marginBottom: 18 }}
        >
          Grey, so every guest reads true.
        </h3>
        {GREYS.map((g) => (
          <SwatchRow key={g.name} {...g} tone="paper" />
        ))}
        <div style={{ marginTop: 22 }}>
          <ContrastRows />
        </div>
      </div>
      <div className="absolute" style={{ left: 452, top: 96, width: 440 }}>
        <Kicker tone="paper">The source</Kicker>
        <h3
          className="ev-head"
          style={{ fontSize: 30, marginTop: 12, marginBottom: 22 }}
        >
          Color comes from people.
        </h3>
        <Source desk />
        <div style={{ marginTop: 30 }}>
          <Kicker tone="paper" style={{ marginBottom: 12 }}>
            The house mix, before anyone arrives
          </Kicker>
          <House desk />
        </div>
        <div style={{ marginTop: 28 }}>
          <Kicker tone="paper" style={{ marginBottom: 12 }}>
            {PARTY.name}: {PARTY.guests} guests, one mix
          </Kicker>
          <GuestRow people={CROWD} max={7} size={18} initials={false} />
        </div>
        <p
          className="ev-head"
          style={{ fontSize: 22, marginTop: 34, lineHeight: 1.15 }}
        >
          Every orb is someone: never decoration, never a state, never over a
          photograph.
        </p>
      </div>
      <div className="absolute" style={{ left: 952, top: 96, width: 416 }}>
        <Kicker tone="paper">Status</Kicker>
        <h3
          className="ev-head"
          style={{ fontSize: 30, marginTop: 12, marginBottom: 18 }}
        >
          A state is a tag, never a light.
        </h3>
        <Tags tone="paper" label={(k) => `${k} word on its plate`} />
        <div style={{ marginTop: 20 }}>
          <InSitu tone="paper" />
        </div>
        <div style={{ marginTop: 12 }}>
          <RoomStrip />
        </div>
        <div style={{ marginTop: 18 }}>
          <Today />
        </div>
        <p
          className="ev-body"
          style={{ fontSize: 13.5, marginTop: 10, color: ON.paper.ink }}
        >
          {WHY}
        </p>
      </div>
    </SlideGround>
  );
}

function ColorPhone({ screen }: SlideProps) {
  return (
    <SlideGround tone="paper" screen={screen}>
      <div style={{ padding: "28px 20px 0" }}>
        <Kicker tone="paper">Status</Kicker>
        <h3
          className="ev-head"
          style={{ fontSize: 28, marginTop: 10, marginBottom: 16 }}
        >
          A state is a tag, never a light.
        </h3>
        <Tags tone="paper" label={(k) => `${k} word on its plate`} stacked />
        <div style={{ marginTop: 18 }}>
          <InSitu tone="paper" />
        </div>
        <div style={{ marginTop: 10 }}>
          <RoomStrip />
        </div>
        <div style={{ marginTop: 14 }}>
          <Today />
        </div>
        <p className="ev-body" style={{ fontSize: 14, marginTop: 12 }}>
          {WHY}
        </p>
        <div style={{ marginTop: 32 }}>
          <Kicker tone="paper">The source</Kicker>
          <h3
            className="ev-head"
            style={{ fontSize: 28, marginTop: 10, marginBottom: 16 }}
          >
            Color comes from people.
          </h3>
          <Source desk={false} />
          <div style={{ marginTop: 20 }}>
            <Kicker tone="paper" style={{ marginBottom: 10 }}>
              The house mix, before anyone arrives
            </Kicker>
            <House desk={false} />
          </div>
          <div style={{ marginTop: 20 }}>
            <Kicker tone="paper" style={{ marginBottom: 10 }}>
              {PARTY.name}: {PARTY.guests} guests
            </Kicker>
            <GuestRow
              people={CROWD}
              max={14}
              total={31}
              size={24}
              initials={false}
            />
          </div>
        </div>
        <div style={{ marginTop: 32 }}>
          <Kicker tone="paper">The base</Kicker>
          <h3
            className="ev-head"
            style={{ fontSize: 28, marginTop: 10, marginBottom: 14 }}
          >
            Grey, so every guest reads true.
          </h3>
          <div
            className="grid"
            style={{ gridTemplateColumns: "1fr 1fr", gap: 12 }}
          >
            {GREYS.map((g) => (
              <SwatchCell key={g.name} name={g.name} s={g.s} tone="paper" />
            ))}
          </div>
          <div style={{ marginTop: 16 }}>
            <ContrastRows />
          </div>
        </div>
      </div>
    </SlideGround>
  );
}
