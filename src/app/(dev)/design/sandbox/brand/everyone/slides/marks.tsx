"use client";

import type { SlideProps } from "../../deck/contract";
import { AppIcon, Lockup, Wordmark } from "../marks";
import { CROWD, HOST, ON } from "../system";
import { isDesk, Kicker, SlideGround } from "./kit";

/**
 * 03 WORDMARK AND ICON. The word on its main ground (paper) and on the other
 * (the room); the full stop shown as whoever is looking; the icon at its
 * artboard and at the three sizes a phone draws it; the lockup.
 */

const DOTS = [
  { dot: "house:25", who: "The house, in print" },
  { dot: CROWD[3].seed, who: "Theo, signed in" },
  { dot: HOST.seed, who: "Maya's event" },
  { dot: "house:255", who: "A visitor, fresh each visit" },
] as const;

function Line({ children, tone, w }: { children: string; tone: "paper" | "room"; w?: number }) {
  return (
    <p className="ev-body" style={{ fontSize: 15, color: ON[tone].muted, maxWidth: w }}>
      {children}
    </p>
  );
}

function IconSizes({ tone }: { tone: "paper" | "room" }) {
  return (
    <div className="flex items-end" style={{ gap: 28 }}>
      {[180, 60, 29].map((s) => (
        <div key={s} className="flex flex-col items-center" style={{ gap: 10 }}>
          <AppIcon size={s} read={`icon at ${s}`} />
          <span className="ev-label ev-num" style={{ color: ON[tone].muted }}>
            {s} px
          </span>
        </div>
      ))}
    </div>
  );
}

export function Marks({ screen }: SlideProps) {
  if (!isDesk(screen)) return <MarksPhone screen={screen} />;
  return (
    <SlideGround tone="paper" screen={screen}>
      <div className="absolute" style={{ left: 72, top: 96 }}>
        <Kicker tone="paper">The wordmark</Kicker>
        <div style={{ marginTop: 26 }}>
          <Wordmark height={150} read="wordmark on paper" />
        </div>
        <div style={{ marginTop: 26 }}>
          <Line tone="paper" w={640}>
            A word and a person. Lowercase, so no letter stands taller than the rest; the full
            stop is a guest, seeded, so it is whoever is looking.
          </Line>
        </div>
        <div className="flex" style={{ gap: 40, marginTop: 40 }}>
          {DOTS.map((d) => (
            <div key={d.who} className="flex flex-col" style={{ gap: 10 }}>
              <Wordmark height={30} dot={d.dot} />
              <span className="ev-body" style={{ fontSize: 13, color: ON.paper.muted }}>
                {d.who}
              </span>
            </div>
          ))}
        </div>
        <div style={{ marginTop: 64 }}>
          <Kicker tone="paper">The lockup</Kicker>
          <div style={{ marginTop: 20 }}>
            <Lockup height={84} read="lockup" />
          </div>
          <div style={{ marginTop: 18 }}>
            <Line tone="paper" w={600}>
              The party, then the word and its plus one. The icon leads where the word cannot fit.
            </Line>
          </div>
        </div>
      </div>
      <div
        className="absolute"
        style={{
          left: 896,
          top: 56,
          right: 0,
          bottom: 0,
          backgroundColor: ON.room.ground,
          color: ON.room.ink,
          padding: "40px 56px",
        }}
      >
        <Kicker tone="room">The icon</Kicker>
        <div className="flex items-start" style={{ gap: 22, marginTop: 22 }}>
          <AppIcon size={264} read="icon, 1024 artboard" />
          <div style={{ paddingTop: 6 }}>
            <Line tone="room" w={150}>
              A party of three: three house guests leaning in for the photo, each parted by the
              tile&apos;s own color.
            </Line>
          </div>
        </div>
        <div style={{ marginTop: 30 }}>
          <IconSizes tone="room" />
        </div>
        <div style={{ marginTop: 34 }}>
          <Wordmark height={54} tone="room" read="wordmark in the room" />
        </div>
        <div style={{ marginTop: 14 }}>
          <Line tone="room" w={400}>
            In the room the letters turn to paper; the full stop stays a person.
          </Line>
        </div>
      </div>
    </SlideGround>
  );
}

function MarksPhone({ screen }: SlideProps) {
  return (
    <SlideGround tone="paper" screen={screen} className="flex flex-col">
      <div style={{ padding: "28px 20px 0" }}>
        <Kicker tone="paper">The wordmark</Kicker>
        <div style={{ marginTop: 18 }}>
          <Wordmark height={68} read="wordmark on paper" />
        </div>
        <div style={{ marginTop: 16 }}>
          <Line tone="paper">
            A word and a person. Lowercase, so no letter stands taller than the rest; the full
            stop is a guest, seeded, so it is whoever is looking.
          </Line>
        </div>
        <div className="grid" style={{ gridTemplateColumns: "1fr 1fr", gap: 18, marginTop: 22 }}>
          {DOTS.map((d) => (
            <div key={d.who} className="flex flex-col" style={{ gap: 8 }}>
              <Wordmark height={26} dot={d.dot} />
              <span className="ev-body" style={{ fontSize: 12, color: ON.paper.muted }}>
                {d.who}
              </span>
            </div>
          ))}
        </div>
        <div style={{ marginTop: 30 }}>
          <Kicker tone="paper">The lockup</Kicker>
          <div style={{ marginTop: 14 }}>
            <Lockup height={58} read="lockup" />
          </div>
        </div>
      </div>
      <div
        style={{
          marginTop: 32,
          flex: 1,
          backgroundColor: ON.room.ground,
          color: ON.room.ink,
          padding: "28px 20px 36px",
        }}
      >
        <Kicker tone="room">The icon</Kicker>
        <div style={{ marginTop: 18 }}>
          <AppIcon size={200} read="icon, 1024 artboard" />
        </div>
        <div style={{ marginTop: 14 }}>
          <Line tone="room">
            A party of three: three house guests leaning in for the photo, each parted by the
            tile&apos;s own color.
          </Line>
        </div>
        <div style={{ marginTop: 22 }}>
          <IconSizes tone="room" />
        </div>
        <div style={{ marginTop: 30 }}>
          <Wordmark height={44} tone="room" read="wordmark in the room" />
        </div>
      </div>
    </SlideGround>
  );
}
