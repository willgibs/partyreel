"use client";

import type { ReactNode } from "react";

import type { SlideProps } from "../../deck/contract";
import type { PhotoId } from "../../deck/media";
import { Wordmark } from "../marks";
import { CROWD, ON, Orb, type Tone } from "../system";
import { isDesk, Kicker, Pic, SlideGround } from "./kit";

/**
 * 08 DARK AND LIGHT. One rule decides a page's ground: daylight where people
 * gather and words are read, the room where the pictures are the subject.
 * Each page is wholly one ground; inside it, sections change by form and
 * scale, never by ground.
 */

type Page = {
  path: string;
  name: string;
  tone: Tone;
  why: string;
  photo?: PhotoId;
};

const MAP: Page[] = [
  { path: "/", name: "Home", tone: "paper", why: "The front door is people", photo: "wedding-toast" },
  { path: "/features/album", name: "The album", tone: "room", why: "A wall of photographs", photo: "concert-confetti" },
  { path: "/features/*", name: "Guests, the code, curation, privacy", tone: "paper", why: "How people take part", photo: "reception-table" },
  { path: "/events", name: "Events", tone: "paper", why: "Occasions are people", photo: "wedding-arch" },
  { path: "/reel", name: "The reel", tone: "room", why: "It plays", photo: "festival-lights" },
  { path: "/pricing", name: "Pricing", tone: "paper", why: "A plain conversation" },
  { path: "/help", name: "Help", tone: "paper", why: "Reading, calmly" },
  { path: "/about", name: "About", tone: "paper", why: "Who we are", photo: "party-balloons" },
  { path: "/blog", name: "Blog", tone: "paper", why: "Reading", photo: "wedding-rings" },
  { path: "/legal", name: "Legal", tone: "paper", why: "Reading" },
];

const bar = (tone: Tone, w: string | number, h: number, strong = false) => (
  <div
    style={{
      width: w,
      height: h,
      borderRadius: 1,
      backgroundColor: strong ? ON[tone].ink : ON[tone].step,
    }}
  />
);

/** A page in miniature: its ground and its first sections. */
function Thumb({ p, w, h }: { p: Page; w: number; h: number }) {
  const t = ON[p.tone];
  const s = w / 120;
  return (
    <div
      style={{
        width: w,
        height: h,
        backgroundColor: t.ground,
        borderRadius: 4,
        overflow: "hidden",
        boxShadow: p.tone === "paper" ? `inset 0 0 0 1px ${ON.paper.line}` : undefined,
        padding: 8 * s,
        display: "grid",
        alignContent: "start",
        gap: 6 * s,
      }}
    >
      <div className="flex items-center justify-between">
        <Wordmark height={6 * s} tone={p.tone} />
        {bar(p.tone, 14 * s, 4 * s)}
      </div>
      <div style={{ height: 4 * s }} />
      {bar(p.tone, "86%", 7 * s, true)}
      {bar(p.tone, "58%", 7 * s, true)}
      {p.tone === "paper" && p.photo && (
        <div className="flex" style={{ gap: 1 }}>
          {CROWD.slice(0, 9).map((c) => (
            <Orb key={c.seed} seed={c.seed} size={6 * s} />
          ))}
        </div>
      )}
      {p.photo ? (
        <Pic id={p.photo} style={{ width: "100%", height: h * (p.tone === "room" ? 0.42 : 0.3) }} />
      ) : (
        <div className="grid" style={{ gap: 4 * s, marginTop: 2 * s }}>
          {bar(p.tone, "100%", 3 * s)}
          {bar(p.tone, "92%", 3 * s)}
          {bar(p.tone, "96%", 3 * s)}
          {bar(p.tone, "70%", 3 * s)}
          {bar(p.tone, "100%", 3 * s)}
          {bar(p.tone, "84%", 3 * s)}
        </div>
      )}
      {bar(p.tone, "100%", 3 * s)}
      {bar(p.tone, "74%", 3 * s)}
    </div>
  );
}

/** The home page's rhythm, section by section, at a size that can be read. */
const RHYTHM: { k: string; line: string; draw: (w: number) => ReactNode }[] = [
  {
    k: "Opener",
    line: "Display type, then the trail: the page's one crowd.",
    draw: (w) => (
      <div className="grid" style={{ gap: 6, padding: "12px 12px" }}>
        {bar("paper", w * 0.8, 11, true)}
        {bar("paper", w * 0.55, 11, true)}
        <div className="flex" style={{ gap: 2, marginTop: 4 }}>
          {CROWD.slice(0, 14).map((c) => (
            <Orb key={c.seed} seed={c.seed} size={9} />
          ))}
        </div>
      </div>
    ),
  },
  {
    k: "Media band",
    line: "Photographs edge to edge at the album's gap, on the same paper.",
    draw: (w) => (
      <div className="flex" style={{ gap: 2, width: w }}>
        <Pic id="wedding-golden" style={{ flex: 1, height: 70 }} />
        <Pic id="reception-table" style={{ flex: 1, height: 70 }} />
        <Pic id="wedding-arch" style={{ flex: 1, height: 70 }} />
      </div>
    ),
  },
  {
    k: "Quiet",
    line: "The information, in columns, with nobody in it.",
    draw: (w) => (
      <div className="grid" style={{ gridTemplateColumns: "1fr 1fr 1fr", gap: 10, padding: "12px", width: w }}>
        {[0, 1, 2].map((i) => (
          <div key={i} className="grid" style={{ gap: 4 }}>
            {bar("paper", "70%", 5, true)}
            {bar("paper", "100%", 3)}
            {bar("paper", "90%", 3)}
          </div>
        ))}
      </div>
    ),
  },
  {
    k: "Close",
    line: "The word and everyone after it; the one call to act.",
    draw: () => (
      <div className="flex items-center justify-between" style={{ padding: "14px 12px" }}>
        <Wordmark height={16} />
        <div style={{ width: 46, height: 14, borderRadius: 6, backgroundColor: ON.paper.ink }} />
      </div>
    ),
  },
];

function Rhythm({ w }: { w: number }) {
  return (
    <div className="grid" style={{ gap: 8 }}>
      {RHYTHM.map((r) => (
        <div key={r.k} className="flex items-center" style={{ gap: 16 }}>
          <div
            style={{
              width: w,
              flex: "none",
              backgroundColor: ON.paper.ground,
              boxShadow: `inset 0 0 0 1px ${ON.paper.line}`,
              borderRadius: 3,
              overflow: "hidden",
            }}
          >
            {r.draw(w)}
          </div>
          <div>
            <p className="ev-title" style={{ fontSize: 14 }}>{r.k}</p>
            <p className="ev-body" style={{ fontSize: 13, color: ON.paper.muted, marginTop: 2 }}>
              {r.line}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

/** Today's home against this vision's: the grounds a reader crosses, in order. */
const TODAY: { label: string; fill: string; ink: string; flex: number }[] = [
  { label: "Cinema", fill: "#000000", ink: "#a1a1a5", flex: 1.4 },
  { label: "Paper", fill: "#f5f5f7", ink: "#4f4f53", flex: 1.6 },
  { label: "Cinema", fill: "#000000", ink: "#a1a1a5", flex: 1 },
  { label: "Paper", fill: "#f5f5f7", ink: "#4f4f53", flex: 0.9 },
  { label: "Ink", fill: "#1d1d20", ink: "#a1a1a5", flex: 0.8 },
];

function Strip({ w, today, compact = false }: { w: number; today: boolean; compact?: boolean }) {
  return (
    <div
      className="flex"
      style={{
        width: w,
        height: 44,
        borderRadius: 3,
        overflow: "hidden",
        boxShadow: `inset 0 0 0 1px ${ON.paper.line}`,
      }}
    >
      {today ? (
        TODAY.map((t, i) => (
          <div
            key={i}
            className="ev-label flex items-center justify-center"
            style={{ flex: t.flex, backgroundColor: t.fill, color: t.ink, fontSize: compact ? 8.5 : 9.5, letterSpacing: compact ? "0.04em" : undefined }}
          >
            {t.label}
          </div>
        ))
      ) : (
        <div className="flex flex-1 items-center" style={{ backgroundColor: ON.paper.ground, padding: "0 12px", gap: 10 }}>
          <Wordmark height={13} />
          <div className="flex" style={{ gap: 2 }}>
            {CROWD.slice(1, compact ? 6 : 12).map((c) => (
              <Orb key={c.seed} seed={c.seed} size={8} />
            ))}
          </div>
          <div className="flex flex-1" style={{ gap: 2, height: 28 }}>
            <Pic id="wedding-golden" style={{ flex: 1 }} />
            <Pic id="reception-table" style={{ flex: 1 }} />
            <Pic id="wedding-toast" style={{ flex: 1 }} />
          </div>
          {!compact && (
            <div style={{ width: 120, display: "grid", gap: 4 }}>
              {bar("paper", "100%", 3)}
              {bar("paper", "80%", 3)}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function TodayNow({ w, stacked = false }: { w: number; stacked?: boolean }) {
  const lw = stacked ? 0 : 78;
  return (
    // The strips' own width bounds the note under them, or it runs to the slide's edge.
    <div className="grid" style={{ gap: 10, width: w }}>
      <div className={stacked ? "grid" : "flex items-center"} style={{ gap: stacked ? 6 : 14 }}>
        <span className="ev-label" style={{ width: 64, color: ON.paper.muted }}>Today</span>
        <Strip w={w - lw} today compact={stacked} />
      </div>
      <div className={stacked ? "grid" : "flex items-center"} style={{ gap: stacked ? 6 : 14 }}>
        <span className="ev-label" style={{ width: 64, color: ON.paper.ink }}>Now</span>
        <Strip w={w - lw} today={false} compact={stacked} />
      </div>
      <p className="ev-body" style={{ fontSize: 13, color: ON.paper.muted, paddingLeft: lw }}>
        The home today cuts between cinema, paper and ink, and the three argue. Here it keeps
        one ground, and lets the photographs and the people set the pace.
      </p>
    </div>
  );
}

/** The map as a compact list (the phone): a ground chip, the page, its reason. */
function MapList() {
  return (
    <div className="grid" style={{ gridTemplateColumns: "1fr 1fr", columnGap: 14, rowGap: 14 }}>
      {MAP.map((p) => (
        <div key={p.path} className="flex items-start" style={{ gap: 10 }}>
          <div
            style={{
              width: 34,
              height: 48,
              flex: "none",
              borderRadius: 3,
              overflow: "hidden",
              backgroundColor: ON[p.tone].ground,
              boxShadow: p.tone === "paper" ? `inset 0 0 0 1px ${ON.paper.line}` : undefined,
              padding: 4,
              display: "grid",
              alignContent: "start",
              gap: 3,
            }}
          >
            {bar(p.tone, "80%", 3, true)}
            {p.photo ? <Pic id={p.photo} style={{ width: "100%", height: 16 }} /> : bar(p.tone, "100%", 2)}
          </div>
          <div>
            <p className="ev-title" style={{ fontSize: 13 }}>{p.name}</p>
            <p className="ev-body" style={{ fontSize: 12, color: ON.paper.muted, marginTop: 1 }}>
              {p.tone === "paper" ? "Light" : "Dark"} · {p.why}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

function MapGrid({ tw, th, cols }: { tw: number; th: number; cols: number }) {
  return (
    <div className="grid" style={{ gridTemplateColumns: `repeat(${cols}, ${tw}px)`, columnGap: 14, rowGap: 18 }}>
      {MAP.map((p) => (
        <div key={p.path}>
          <Thumb p={p} w={tw} h={th} />
          <p className="ev-title" style={{ fontSize: 13, marginTop: 8 }}>{p.name}</p>
          <p className="ev-body" style={{ fontSize: 11.5, color: ON.paper.muted, marginTop: 1 }}>
            {p.tone === "paper" ? "Light" : "Dark"} · {p.why}
          </p>
        </div>
      ))}
    </div>
  );
}

export function Pages({ screen }: SlideProps) {
  if (!isDesk(screen)) return <PagesPhone screen={screen} />;
  return (
    <SlideGround tone="paper" screen={screen}>
      <div className="absolute" style={{ left: 72, top: 96, width: 520 }}>
        <Kicker tone="paper">Dark and light</Kicker>
        <h2 className="ev-display" style={{ fontSize: 56, marginTop: 14, lineHeight: 0.96 }}>
          Daylight for people, the room for pictures.
        </h2>
        <p className="ev-body" style={{ fontSize: 15, marginTop: 18, color: ON.paper.ink }}>
          A page is wholly one ground, chosen by its subject: where people gather and words are
          read, daylight; where the photographs are the subject, the room, so a picture is the
          brightest thing on it. Inside a page, sections change by form and scale, never by ground.
        </p>
        <div style={{ marginTop: 26 }}>
          <Kicker tone="paper" style={{ marginBottom: 12 }}>
            The home, section by section
          </Kicker>
          <Rhythm w={230} />
        </div>
      </div>
      <div className="absolute" style={{ left: 664, top: 104 }}>
        <MapGrid tw={124} th={176} cols={5} />
        <div style={{ marginTop: 34 }}>
          <TodayNow w={676} />
        </div>
      </div>
    </SlideGround>
  );
}

function PagesPhone({ screen }: SlideProps) {
  return (
    <SlideGround tone="paper" screen={screen}>
      <div style={{ padding: "28px 20px 0" }}>
        <Kicker tone="paper">Dark and light</Kicker>
        <h2 className="ev-display" style={{ fontSize: 42, marginTop: 10, lineHeight: 0.96 }}>
          Daylight for people, the room for pictures.
        </h2>
        <p className="ev-body" style={{ fontSize: 14, marginTop: 14 }}>
          A page is wholly one ground, chosen by its subject: where people gather and words are
          read, daylight; where the photographs are the subject, the room. Inside a page, sections
          change by form and scale, never by ground.
        </p>
        <div style={{ marginTop: 24 }}>
          <MapList />
        </div>
        <div style={{ marginTop: 28 }}>
          <TodayNow w={335} stacked />
        </div>
        <div style={{ marginTop: 28 }}>
          <Kicker tone="paper" style={{ marginBottom: 12 }}>
            The home, section by section
          </Kicker>
          <Rhythm w={150} />
        </div>
      </div>
    </SlideGround>
  );
}
