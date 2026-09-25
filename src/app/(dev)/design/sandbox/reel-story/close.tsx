"use client";

import type { BoardState } from "@/components/lab/board-spec";
import { CtaBand } from "@/components/marketing/system/cta-band";
import { SectionLight } from "@/components/marketing/system/section-light";
import type { NavLink } from "@/lib/constants/marketing-nav";

import { CinemaRoom, linesLabel, linesOf, Scene, stopLinks } from "./scene";
import { screenOf } from "./screens";

/**
 * THE HOME'S CLOSE, ON ITS REAL PIECES: `cinema-close.tsx` is `SectionLight`
 * (the horizon, bottom edge, 58% reach) over `CtaBand` with the demo line and
 * the credit, and so is every option here. Only the heading, the line under it
 * and, where a direction needs one, a second button change (the big screen's
 * "Watch the demo reel", which takes the demo line's place). The credit stays
 * on all four: it is the page's last frame, and no option is about it.
 *
 * `reveal="none"` because the frame is judged at rest; the shipped close cuts
 * in on the cinema grammar, which changes when the words appear, never which.
 */

export type CloseId = "starts" | "every-photo" | "big-screen" | "hosting";

type CloseWords = { heading: string; subhead: string; secondary?: NavLink };

export const CLOSE_WORDS: Record<CloseId, CloseWords> = {
  starts: {
    heading: "Your next event starts here.",
    subhead: "Free to host, and every guest joins with one scan.",
  },
  "every-photo": {
    heading: "Get every photo from your next event.",
    subhead:
      "Guests scan one code, and everything they shoot lands in your album. Free to host.",
  },
  "big-screen": {
    heading: "Put your next event on the big screen.",
    subhead:
      "Free to host. Guests scan one code, and the highlight reel plays every photo as it lands.",
    // The one direction that ends on the reel offers the reel as the other
    // way in: the teaser's own destination (the `play` ask), a press away.
    secondary: { label: "Watch the demo reel", href: "/#reel" },
  },
  hosting: {
    heading: "Hosting something soon?",
    subhead:
      "Set it up free in a minute, and every guest's photos land in one album.",
  },
};

export function closePreview(s: BoardState, id: CloseId) {
  const screen = screenOf(s.screen);
  const words = CLOSE_WORDS[id];
  return (
    <Scene
      id={`close-${id}`}
      screen={screen}
      title="The home's close"
      measure={(root, win) => {
        const h2 = root.querySelector("h2");
        const sub = h2?.nextElementSibling ?? null;
        if (!h2 || !sub) return null;
        return `The heading takes ${linesLabel(linesOf(h2, win))}, the line under it ${linesLabel(linesOf(sub, win))}.`;
      }}
    >
      <CinemaRoom>
        <div onClickCapture={stopLinks}>
          <SectionLight placement="bottom" reach="58%">
            <CtaBand
              className="border-t"
              reveal="none"
              heading={words.heading}
              subhead={words.subhead}
              secondary={words.secondary}
              // A second button that opens the demo's reel stands where the
              // demo line would: two demo doors stacked is one too many.
              demoLink={!words.secondary}
              credit
            />
          </SectionLight>
        </div>
      </CinemaRoom>
    </Scene>
  );
}
