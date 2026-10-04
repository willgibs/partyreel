"use client";

import type { ReactNode } from "react";

import type { SlideProps } from "../../deck/contract";
import type { PhotoId } from "../../deck/media";
import { CROWD, GuestRow, ON, StatusTag, Toss } from "../system";
import { isDesk, Kicker, Pic, SlideGround } from "./kit";

/**
 * 07 TYPE, IMAGERY, MOTION. The two faces in real lines on a short ladder;
 * three rules for the photographs; the motion, each with its timing and its
 * rest.
 */

const LADDER = [
  {
    role: "Display",
    spec: "Fraunces 900 · soft 100 · opsz 144 · −3%",
    cls: "ev-display",
    size: 64,
    text: "The whole event, in one album.",
  },
  {
    role: "Headline",
    spec: "Fraunces 800 · soft 100 · opsz 72 · −2%",
    cls: "ev-head",
    size: 34,
    text: "Your first album starts here",
  },
  {
    role: "Title",
    spec: "Fraunces 700 · soft 100 · opsz by size",
    cls: "ev-title",
    size: 19,
    text: "Maya & Jay",
  },
  {
    role: "Body",
    spec: "Inter 400 · 16 on 23",
    cls: "ev-body",
    size: 16,
    text: "Your guests took the best photos and videos at your event.",
  },
  {
    role: "Readout",
    spec: "Inter 600 · caps · +8%",
    cls: "ev-label",
    size: 11,
    text: "31 guests · 1,284 photos",
  },
] as const;

const SHOTS: { id: PhotoId; rule: string; focus?: string }[] = [
  {
    id: "wedding-toast",
    rule: "From inside the crowd: eye level, a guest's view, never the stage's.",
    focus: "60% 45%",
  },
  {
    id: "party-dj",
    rule: "People before places: a room is only as good as who is in it.",
  },
  {
    id: "wedding-golden",
    rule: "The light they had: never graded toward a brand color.",
    focus: "50% 35%",
  },
];

const MOTION = [
  {
    what: "A guest arrives",
    how: "Up in 330 ms, 7% past full, then settles over 860 ms: quick to rise, slow to rest.",
  },
  {
    what: "The row makes room",
    how: "Neighbours step aside on the newcomer's own breath.",
  },
  {
    what: "The toss",
    how: "Once, at a moment worth it; 1.1 s, then everyone rests in the row.",
  },
  {
    what: "Status",
    how: "Never moves, except waiting's hatch while work truly runs.",
  },
  {
    what: "Reduced motion",
    how: "Everyone is already there; nothing loops; the hatch stands still.",
  },
] as const;

function Col({
  k,
  title,
  children,
  w,
}: {
  k: string;
  title: string;
  children: ReactNode;
  w: number;
}) {
  return (
    <div style={{ width: w }}>
      <Kicker tone="paper">{k}</Kicker>
      <h3
        className="ev-head"
        style={{ fontSize: 30, marginTop: 10, marginBottom: 20 }}
      >
        {title}
      </h3>
      {children}
    </div>
  );
}

/** The two faces, large: the loud one and the one to read. */
function Faces() {
  return (
    <div className="grid" style={{ gridTemplateColumns: "1fr 1fr", gap: 24 }}>
      <div>
        <p className="ev-display" style={{ fontSize: 92, lineHeight: 0.85 }}>
          Aa
        </p>
        <p className="ev-title" style={{ fontSize: 15, marginTop: 10 }}>
          Fraunces
        </p>
        <p
          className="ev-body"
          style={{ fontSize: 13, color: ON.paper.muted, marginTop: 2 }}
        >
          To be loud: the wordmark, display, headlines and every event&apos;s
          name. Its heaviest, softest cut: round like the people, never thin.
        </p>
      </div>
      <div>
        <p
          className="ev-body"
          style={{
            fontSize: 92,
            lineHeight: 0.85,
            fontWeight: 500,
            letterSpacing: "-0.04em",
          }}
        >
          Aa
        </p>
        <p className="ev-title" style={{ fontSize: 15, marginTop: 10 }}>
          Inter
        </p>
        <p
          className="ev-body"
          style={{ fontSize: 13, color: ON.paper.muted, marginTop: 2 }}
        >
          To read: every sentence, control and readout, unchanged from today.
        </p>
      </div>
    </div>
  );
}

function Ladder({ desk }: { desk: boolean }) {
  return (
    <div className="grid" style={{ gap: desk ? 16 : 14 }}>
      {LADDER.map((l) => (
        <div
          key={l.role}
          style={{ borderTop: `1px solid ${ON.paper.line}`, paddingTop: 8 }}
        >
          <p
            className="ev-label"
            style={{ color: ON.paper.muted, fontSize: 10 }}
          >
            {l.role} · {l.spec}
          </p>
          <p
            className={l.cls}
            style={{
              fontSize: desk
                ? l.size
                : ({ Display: 40, Headline: 27 }[l.role as string] ?? l.size),
              marginTop: 6,
              color: ON.paper.ink,
              lineHeight: l.role === "Display" ? 0.92 : undefined,
            }}
          >
            {l.text}
          </p>
        </div>
      ))}
    </div>
  );
}

function Shots({ w, h }: { w: number; h: number }) {
  return (
    <div className="grid" style={{ gap: 16 }}>
      {SHOTS.map((s) => (
        <div key={s.id} className="flex items-center" style={{ gap: 14 }}>
          <Pic
            id={s.id}
            focus={s.focus}
            style={{ width: w, height: h, flex: "none" }}
          />
          <p className="ev-body" style={{ fontSize: 14, color: ON.paper.ink }}>
            {s.rule}
          </p>
        </div>
      ))}
    </div>
  );
}

function MotionDemos({ w }: { w: number }) {
  return (
    <div>
      <div
        className="flex items-end justify-between"
        style={{ height: 104, marginBottom: 14 }}
      >
        <div style={{ paddingBottom: 6 }}>
          <GuestRow people={CROWD} max={5} total={31} size={36} pop />
        </div>
        <div className="relative" style={{ width: w * 0.42, height: 104 }}>
          <Toss
            people={CROWD.slice(0, 16)}
            w={w * 0.42}
            h={104}
            ox={w * 0.21}
            oy={104}
            min={7}
            max={15}
            reach={0.95}
            loop
          />
        </div>
      </div>
      <StatusTag kind="waiting" size={26} running>
        Uploading 3 of 12
      </StatusTag>
      <dl className="ev-body" style={{ marginTop: 16, fontSize: 14 }}>
        {MOTION.map((m) => (
          <div
            key={m.what}
            style={{
              padding: "8px 0",
              borderTop: `1px solid ${ON.paper.line}`,
            }}
          >
            <dt style={{ fontWeight: 600 }}>{m.what}</dt>
            <dd style={{ color: ON.paper.muted, marginTop: 2 }}>{m.how}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

export function Voice({ screen }: SlideProps) {
  if (!isDesk(screen)) return <VoicePhone screen={screen} />;
  return (
    <SlideGround tone="paper" screen={screen}>
      <div className="absolute flex" style={{ left: 72, top: 96, gap: 56 }}>
        <Col k="Type" title="Warm to shout, plain to read." w={500}>
          <Ladder desk />
          <div style={{ marginTop: 30 }}>
            <Faces />
          </div>
        </Col>
        <Col k="Imagery" title="Their photos, as they took them." w={330}>
          <Shots w={128} h={150} />
        </Col>
        <Col k="Motion" title="Social, and springy." w={354}>
          <MotionDemos w={354} />
        </Col>
      </div>
    </SlideGround>
  );
}

function VoicePhone({ screen }: SlideProps) {
  return (
    <SlideGround tone="paper" screen={screen}>
      <div className="grid" style={{ padding: "28px 20px 0", gap: 34 }}>
        <Col k="Type" title="Warm to shout, plain to read." w={335}>
          <Ladder desk={false} />
        </Col>
        <Col k="Imagery" title="Their photos, as they took them." w={335}>
          <Shots w={96} h={104} />
        </Col>
        <Col k="Motion" title="Social, and springy." w={335}>
          <MotionDemos w={335} />
        </Col>
      </div>
    </SlideGround>
  );
}
