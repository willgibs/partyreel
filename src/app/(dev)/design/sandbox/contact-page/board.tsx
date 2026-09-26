"use client";

import type { ReactNode } from "react";

import { ExplorationBoard, Frame } from "@/components/lab";
import type { PreviewsFor } from "@/components/lab/exploration";

import { BesidePreview, type BesideShape } from "./beside";
import { PageIdentityPreview, type PageShape } from "./page-identity";
import { ReachPreview, type ReachShape } from "./reach";
import { ReceiptPreview, type ReceiptShape } from "./receipt";
import { CONTACT_PAGE } from "./spec";
import { TopicPreview, type TopicShape } from "./topic";
import { UrgencyPreview, type UrgencyShape } from "./urgency";

/**
 * THE PREVIEWS, and nothing else: every option is the real page's own pieces
 * (PageHero, ContactForm, ContactFacts, MarketingHeader, PaperChapter) or a
 * small labelled copy of one piece the real component takes no prop for (the
 * manifest's "one-prop copy" allowance), drawn at both 1440 and 375
 * (`Widths`, the loose-ends and album-page convention: two real iframes,
 * stacked, so a Tailwind breakpoint resolves against the width being judged).
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
  render: () => ReactNode;
}) {
  return (
    <div className="flex min-w-0 flex-col gap-6">
      {(["desktop", "phone"] as const).map((mode) => (
        <Frame
          key={mode}
          id={`cp-${id}-${mode}`}
          w={mode === "desktop" ? 1440 : 375}
          h={mode === "desktop" ? desktopH : phoneH}
          title={mode === "desktop" ? "1440" : "375"}
        >
          {render()}
        </Frame>
      ))}
    </div>
  );
}

/* ── 1. The way in ─────────────────────────────────────────────────────── */

const REACH_H: Record<ReachShape, { d: number; p: number }> = {
  routed: { d: 1200, p: 1750 },
  address: { d: 760, p: 950 },
  both: { d: 1150, p: 2150 },
};

const reachPreview = (shape: ReachShape) => (
  <Widths
    id={`reach-${shape}`}
    desktopH={REACH_H[shape].d}
    phoneH={REACH_H[shape].p}
    render={() => <ReachPreview shape={shape} />}
  />
);

/* ── 2. The page's identity ────────────────────────────────────────────── */

const PAGE_H: Record<PageShape, { d: number; p: number }> = {
  desk: { d: 780, p: 1000 },
  cinema: { d: 880, p: 1050 },
  chapter: { d: 1350, p: 2350 },
};

const pagePreview = (shape: PageShape) => (
  <Widths
    id={`page-${shape}`}
    desktopH={PAGE_H[shape].d}
    phoneH={PAGE_H[shape].p}
    render={() => <PageIdentityPreview shape={shape} />}
  />
);

/* ── 3. The topic picker ───────────────────────────────────────────────── */

const TOPIC_H: Record<TopicShape, { d: number; p: number }> = {
  required: { d: 820, p: 900 },
  gone: { d: 700, p: 780 },
  optional: { d: 800, p: 880 },
};

const topicPreview = (shape: TopicShape) => (
  <Widths
    id={`topic-${shape}`}
    desktopH={TOPIC_H[shape].d}
    phoneH={TOPIC_H[shape].p}
    render={() => <TopicPreview shape={shape} />}
  />
);

/* ── 4. Something urgent ───────────────────────────────────────────────── */

const URGENCY_H: Record<UrgencyShape, { d: number; p: number }> = {
  one: { d: 620, p: 700 },
  door: { d: 740, p: 820 },
  stated: { d: 660, p: 740 },
};

const urgencyPreview = (shape: UrgencyShape) => (
  <Widths
    id={`urgency-${shape}`}
    desktopH={URGENCY_H[shape].d}
    phoneH={URGENCY_H[shape].p}
    render={() => <UrgencyPreview shape={shape} />}
  />
);

/* ── 5. The receipt ────────────────────────────────────────────────────── */

const RECEIPT_H: Record<ReceiptShape, { d: number; p: number }> = {
  card: { d: 560, p: 620 },
  email: { d: 780, p: 840 },
  reference: { d: 620, p: 680 },
  modal: { d: 640, p: 720 },
};

const receiptPreview = (shape: ReceiptShape) => (
  <Widths
    id={`receipt-${shape}`}
    desktopH={RECEIPT_H[shape].d}
    phoneH={RECEIPT_H[shape].p}
    render={() => <ReceiptPreview shape={shape} />}
  />
);

/* ── 6. Beside the form ────────────────────────────────────────────────── */

const BESIDE_H: Record<BesideShape, { d: number; p: number }> = {
  facts: { d: 780, p: 1550 },
  directory: { d: 900, p: 1750 },
  warm: { d: 820, p: 1600 },
};

const besidePreview = (shape: BesideShape) => (
  <Widths
    id={`beside-${shape}`}
    desktopH={BESIDE_H[shape].d}
    phoneH={BESIDE_H[shape].p}
    render={() => <BesidePreview shape={shape} />}
  />
);

const PREVIEWS: PreviewsFor<typeof CONTACT_PAGE> = {
  "reach.routed": reachPreview("routed"),
  "reach.address": reachPreview("address"),
  "reach.both": reachPreview("both"),

  "page.desk": pagePreview("desk"),
  "page.cinema": pagePreview("cinema"),
  "page.chapter": pagePreview("chapter"),

  "topic.required": topicPreview("required"),
  "topic.gone": topicPreview("gone"),
  "topic.optional": topicPreview("optional"),

  "urgency.one": urgencyPreview("one"),
  "urgency.door": urgencyPreview("door"),
  "urgency.stated": urgencyPreview("stated"),

  "receipt.card": receiptPreview("card"),
  "receipt.email": receiptPreview("email"),
  "receipt.reference": receiptPreview("reference"),
  "receipt.modal": receiptPreview("modal"),

  "beside.facts": besidePreview("facts"),
  "beside.directory": besidePreview("directory"),
  "beside.warm": besidePreview("warm"),
};

export function ContactPageBoard() {
  return <ExplorationBoard spec={CONTACT_PAGE} previews={PREVIEWS} />;
}
