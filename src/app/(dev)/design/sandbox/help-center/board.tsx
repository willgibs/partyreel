"use client";

import type { ReactNode } from "react";

import { ExplorationBoard, Frame } from "@/components/lab";
import type { BoardState } from "@/components/lab/board-spec";
import type { PreviewsFor } from "@/components/lab/exploration";

import { type ArticleShape, ArticlePreview } from "./article";
import { type DeadEndShape, DeadEndPreview } from "./dead-end";
import { type FeedbackShape, FeedbackPreview } from "./feedback";
import { type ProductShape, FromProductPreview } from "./from-product";
import { type HubShape, HubPreview } from "./hub";
import { HELP_CENTER } from "./spec";
import { type SearchShape, SearchPreview } from "./search";
import { type WhoFirstShape, WhoFirstPreview } from "./who-first";

/**
 * THE PREVIEWS: every option is the real help pieces (`PageHero`,
 * `CategoryEmblem`, `HelpFactsBand`-adjacent fixtures, `ChipToc`/`ArticleToc`,
 * `Checklist`, `ArticleFeedback`, `ReportDialog`, `HelpPaletteProvider` +
 * `HelpSearchTrigger`) or a hand-authored one-prop copy where the real
 * component takes no prop for what is being varied, drawn at both 1440 and
 * 375 (the contact-page and press-page convention: two real iframes,
 * stacked, so a Tailwind breakpoint resolves against the width being
 * judged).
 */
function Widths({
  id,
  desktopH,
  phoneH,
  render,
}: {
  id: string;
  desktopH: number;
  phoneH: number;
  render: (mode: "desktop" | "phone") => ReactNode;
}) {
  return (
    <div className="flex min-w-0 flex-col gap-6">
      {(["desktop", "phone"] as const).map((mode) => (
        <Frame
          key={mode}
          id={`hc-${id}-${mode}`}
          w={mode === "desktop" ? 1440 : 375}
          h={mode === "desktop" ? desktopH : phoneH}
          title={mode === "desktop" ? "1440" : "375"}
        >
          {render(mode)}
        </Frame>
      ))}
    </div>
  );
}

function whoFirstOf(v: unknown): WhoFirstShape {
  return v === "host" || v === "split" || v === "context" ? v : "context";
}

/* ── 1. Who first ─────────────────────────────────────────────────────── */

const WHO_FIRST_H: Record<WhoFirstShape, { d: number; p: number }> = {
  host: { d: 620, p: 720 },
  split: { d: 680, p: 820 },
  context: { d: 620, p: 760 },
};

const whoFirstPreview = (shape: WhoFirstShape) => (
  <Widths
    id={`who-first-${shape}`}
    desktopH={WHO_FIRST_H[shape].d}
    phoneH={WHO_FIRST_H[shape].p}
    render={(mode) => <WhoFirstPreview shape={shape} mode={mode} />}
  />
);

/* ── 2. The hub (staged after who-first) ─────────────────────────────── */

// Measured against the real rendered iframes (`contentDocument.scrollHeight`),
// never guessed: `hybrid`'s desktop frame ran 48 px taller than its first
// declared height, which the demo gate's pixel diff missed but a real read
// of the DOM caught (PROGRAM.md, "measure every tile before it ships").
const HUB_H: Record<HubShape, { d: number; p: number }> = {
  sheet: { d: 2150, p: 3550 },
  doors: { d: 1350, p: 1950 },
  hybrid: { d: 2610, p: 4200 },
};

// A named function, never a factory RETURNING an arrow (the `react/display-name`
// false positive a `(shape) => (state) => <jsx/>` shape trips): the PREVIEWS map
// below wraps the call in its own inline arrow instead, the guest-upload idiom.
function hubScreen(shape: HubShape, state: BoardState) {
  return (
    <Widths
      id={`hub-${shape}`}
      desktopH={HUB_H[shape].d}
      phoneH={HUB_H[shape].p}
      render={(mode) => (
        <HubPreview shape={shape} mode={mode} whoFirst={whoFirstOf(state["who-first"])} />
      )}
    />
  );
}

/* ── 3. The article ───────────────────────────────────────────────────── */

// Measured the same way: the identity recheck's three added steps (name,
// confirm, first photo, 2026-09-22) pushed every shape taller again — prose
// +220/+40, checklist +310/+198, and `screen`'s three new illustrations the
// most, desktop +756 px, phone +2072 px.
const ARTICLE_H: Record<ArticleShape, { d: number; p: number }> = {
  prose: { d: 1370, p: 1790 },
  checklist: { d: 1410, p: 1898 },
  screen: { d: 2326, p: 5052 },
};

const articlePreview = (shape: ArticleShape) => (
  <Widths
    id={`article-${shape}`}
    desktopH={ARTICLE_H[shape].d}
    phoneH={ARTICLE_H[shape].p}
    render={() => <ArticlePreview shape={shape} />}
  />
);

/* ── 4. From the product ─────────────────────────────────────────────── */

const PRODUCT_H: Record<ProductShape, { d: number; p: number }> = {
  none: { d: 280, p: 300 },
  menu: { d: 340, p: 360 },
  contextual: { d: 280, p: 300 },
};

const fromProductPreview = (shape: ProductShape) => (
  <Widths
    id={`from-product-${shape}`}
    desktopH={PRODUCT_H[shape].d}
    phoneH={PRODUCT_H[shape].p}
    render={() => <FromProductPreview shape={shape} />}
  />
);

/* ── 5. Feedback ──────────────────────────────────────────────────────── */

const FEEDBACK_H: Record<FeedbackShape, { d: number; p: number }> = {
  ephemeral: { d: 260, p: 300 },
  beacon: { d: 300, p: 340 },
  routed: { d: 320, p: 380 },
};

const feedbackPreview = (shape: FeedbackShape) => (
  <Widths
    id={`feedback-${shape}`}
    desktopH={FEEDBACK_H[shape].d}
    phoneH={FEEDBACK_H[shape].p}
    render={() => <FeedbackPreview shape={shape} />}
  />
);

/* ── 6. The dead end ──────────────────────────────────────────────────── */

const DEAD_END_H: Record<DeadEndShape, { d: number; p: number }> = {
  blank: { d: 560, p: 640 },
  band: { d: 600, p: 680 },
  rung: { d: 640, p: 720 },
};

const deadEndPreview = (shape: DeadEndShape) => (
  <Widths
    id={`dead-end-${shape}`}
    desktopH={DEAD_END_H[shape].d}
    phoneH={DEAD_END_H[shape].p}
    render={() => <DeadEndPreview shape={shape} />}
  />
);

/* ── 7. Search ────────────────────────────────────────────────────────── */

const SEARCH_H: Record<SearchShape, { d: number; p: number }> = {
  local: { d: 220, p: 260 },
  sitewide: { d: 220, p: 260 },
  visible: { d: 420, p: 560 },
};

const searchPreview = (shape: SearchShape) => (
  <Widths
    id={`search-${shape}`}
    desktopH={SEARCH_H[shape].d}
    phoneH={SEARCH_H[shape].p}
    render={() => <SearchPreview shape={shape} />}
  />
);

const PREVIEWS: PreviewsFor<typeof HELP_CENTER> = {
  "who-first.host": whoFirstPreview("host"),
  "who-first.split": whoFirstPreview("split"),
  "who-first.context": whoFirstPreview("context"),

  "hub.sheet": (s) => hubScreen("sheet", s),
  "hub.doors": (s) => hubScreen("doors", s),
  "hub.hybrid": (s) => hubScreen("hybrid", s),

  "article.prose": articlePreview("prose"),
  "article.checklist": articlePreview("checklist"),
  "article.screen": articlePreview("screen"),

  "from-product.none": fromProductPreview("none"),
  "from-product.menu": fromProductPreview("menu"),
  "from-product.contextual": fromProductPreview("contextual"),

  "feedback.ephemeral": feedbackPreview("ephemeral"),
  "feedback.beacon": feedbackPreview("beacon"),
  "feedback.routed": feedbackPreview("routed"),

  "dead-end.blank": deadEndPreview("blank"),
  "dead-end.band": deadEndPreview("band"),
  "dead-end.rung": deadEndPreview("rung"),

  "search.local": searchPreview("local"),
  "search.sitewide": searchPreview("sitewide"),
  "search.visible": searchPreview("visible"),
};

export function HelpCenterBoard() {
  return <ExplorationBoard spec={HELP_CENTER} previews={PREVIEWS} />;
}
