"use client";

import type { ScreenId } from "../knobs";
import { Story } from "../scene";
import { SignIn, SiteFoot, SiteHead } from "../surfaces";
import { SocialCard } from "./card";
import { pasteFor, WORDMARKS, type WordmarkId } from "./candidates";
import { WordSheet } from "./sheet";

/**
 * ONE WORDMARK'S FRAMES: the word itself on both grounds, then production's
 * own surfaces signing with it (the site's head in the room, the sign-in page
 * on paper, the site's foot on its slab), each wearing the drawing as the
 * frame's paste, so production's `Logo` draws it wherever it stands, and the
 * social card, which draws the path itself, at the display cut.
 */
export function WordStory({
  id,
  screen,
}: {
  id: WordmarkId;
  screen: ScreenId;
}) {
  const mark = WORDMARKS[id];
  const css = pasteFor(mark.small);
  const desk = screen === "1440";
  return (
    <Story
      screen={screen}
      sheet={{
        id: `bm-word-${id}-sheet-${screen}`,
        title: "The word, on paper and in the room",
        h: desk ? 640 : 1060,
        node: <WordSheet mark={mark} screen={screen} />,
      }}
      frames={[
        {
          id: `bm-word-${id}-site-${screen}`,
          title: "The site's first screen, in the room",
          css,
          node: <SiteHead screen={screen} />,
        },
        {
          id: `bm-word-${id}-signin-${screen}`,
          title: "Sign in, on paper",
          css,
          node: <SignIn screen={screen} />,
        },
        {
          id: `bm-word-${id}-foot-${screen}`,
          title: "The site's foot, on its slab",
          css,
          h: desk ? 900 : 1300,
          node: <SiteFoot />,
        },
        {
          id: `bm-word-${id}-card-${screen}`,
          title: "The social card, where a link unfurls",
          w: 1200,
          h: 630,
          node: <SocialCard mark={mark.display} />,
        },
      ]}
    />
  );
}
