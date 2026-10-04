"use client";

import type { SlideProps } from "../../deck/contract";
import { PARTY, type PhotoId } from "../../deck/media";
import { WordAndEveryone } from "../marks";
import { isDesk, Kicker, Pic, SlideGround } from "./kit";

/**
 * 01 COVER. The album first (four of Maya & Jay's photographs, the way the
 * album shows them), then the word and its full stop, which keeps going:
 * the plus one becomes everyone. The trail is the event's guest row at the
 * full stop's own size, in arrival order, running off the page because the
 * guest list is never closed.
 */

const BAND: { id: PhotoId; focus?: string }[] = [
  { id: "wedding-golden", focus: "50% 40%" },
  { id: "reception-table" },
  { id: "wedding-toast", focus: "60% 50%" },
  { id: "wedding-arch", focus: "50% 60%" },
];

export function Cover({ screen }: SlideProps) {
  if (!isDesk(screen)) return <CoverPhone screen={screen} />;
  return (
    <SlideGround tone="paper" screen={screen}>
      <div
        className="absolute flex"
        style={{ left: 0, top: 56, width: 1440, height: 430, gap: 3 }}
      >
        {BAND.map((b) => (
          <Pic
            key={b.id}
            id={b.id}
            focus={b.focus}
            style={{ flex: 1, height: "100%" }}
          />
        ))}
      </div>
      <div className="absolute" style={{ left: 72, top: 548 }}>
        <WordAndEveryone height={128} count={PARTY.guests - 1} />
      </div>
      <div
        className="absolute flex items-baseline justify-between"
        style={{ left: 72, right: 72, top: 754 }}
      >
        <p className="ev-head" style={{ fontSize: 48 }}>
          Every guest brings a color.
        </p>
        <Kicker tone="paper">Everyone&apos;s Color · a brand vision</Kicker>
      </div>
    </SlideGround>
  );
}

function CoverPhone({ screen }: SlideProps) {
  const wm = 56;
  return (
    <SlideGround tone="paper" screen={screen}>
      <div
        className="absolute grid"
        style={{
          left: 0,
          top: 52,
          width: 375,
          height: 404,
          gap: 3,
          gridTemplateColumns: "1fr 1fr",
        }}
      >
        {BAND.map((b) => (
          <Pic key={b.id} id={b.id} focus={b.focus} style={{ height: 200.5 }} />
        ))}
      </div>
      <div className="absolute" style={{ left: 20, top: 500 }}>
        <WordAndEveryone height={wm} count={10} gap={5} />
      </div>
      <div
        className="absolute"
        style={{ left: 20, right: 20, top: 500 + wm + 40 }}
      >
        <p className="ev-head" style={{ fontSize: 36 }}>
          Every guest
          <br />
          brings a color.
        </p>
        <Kicker tone="paper" style={{ marginTop: 18 }}>
          Everyone&apos;s Color · a brand vision
        </Kicker>
      </div>
    </SlideGround>
  );
}
