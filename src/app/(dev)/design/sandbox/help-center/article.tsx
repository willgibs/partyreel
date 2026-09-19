"use client";

import { Camera, Lock } from "lucide-react";

import { Check, Checklist } from "@/components/marketing/help/checklist";
import { CategoryEmblem } from "@/components/marketing/help/help-emblems";
import { ARTICLE_BODY_ID, ArticleToc } from "@/components/marketing/reading/article-toc";
import { ChipToc } from "@/components/marketing/reading/chip-toc";
import { PaperChapter } from "@/components/marketing/system/paper-chapter";
import { Container } from "@/components/shared/container";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import { ARTICLES, readingTimeLabel } from "./fixtures";
import { Path, Step, Steps, stopLinks, UiLabel } from "./vocab";

/**
 * DECISION 3: THE ARTICLE. Prose-with-steps (as shipped), a checklist first,
 * or the real screen anchored beside each step — on the one guest how-to
 * this track's manifest names (`how-guests-join-and-upload`), the article
 * that already carries three real `<Steps>`. The "screen" option's three
 * illustrations are hand-built stand-ins from real primitives (`Button`,
 * `CategoryEmblem`) rather than a screenshot the lab has not verified pixel
 * for pixel against the shipped guest door — the manifest's binding is that
 * a picture of a real screen must be a picture of the shipped one, so a
 * lab-only illustration says plainly that it is a stand-in.
 */
export type ArticleShape = "prose" | "checklist" | "screen";

const ARTICLE = ARTICLES["how-guests-join-and-upload"];

const STEPS = [
  {
    title: "Scan the code, or tap the link",
    body: "Your phone's normal camera app reads the QR code and offers a link; tap it. Any modern phone browser works.",
  },
  {
    title: "Read the welcome",
    body: (
      <>
        The event&rsquo;s name, who&rsquo;s hosting, and how many photos are already
        inside. Tap <UiLabel>Continue</UiLabel>.
      </>
    ),
  },
  {
    title: "Enter the password or your email, if asked",
    body: "Most events ask for a quick email check; some add a password; a few ask for nothing.",
  },
];

function ScanScreen() {
  return (
    <div className="flex aspect-[9/16] w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-foreground/25 bg-muted/30 p-3">
      <Camera aria-hidden className="size-5 text-muted-foreground" />
      <CategoryEmblem slug="qr-and-invites" className="scale-75" />
    </div>
  );
}

function WelcomeScreen() {
  return (
    <div className="flex aspect-[9/16] w-full flex-col justify-end gap-2 rounded-xl border bg-card p-3 shadow-lift">
      <div className="h-2 w-3/4 rounded-full bg-foreground/15" />
      <div className="h-2 w-1/2 rounded-full bg-foreground/10" />
      <Button size="sm" className="mt-1.5 h-7 w-full text-xs">
        Continue
      </Button>
    </div>
  );
}

function GateScreen() {
  return (
    <div className="flex aspect-[9/16] w-full flex-col items-center justify-center gap-2 rounded-xl border bg-card p-3 shadow-lift">
      <Lock aria-hidden className="size-4 text-muted-foreground" />
      <div className="h-7 w-full rounded-lg border bg-muted/40" />
    </div>
  );
}

const SCREENS = [<ScanScreen key="scan" />, <WelcomeScreen key="welcome" />, <GateScreen key="gate" />];

function Body({ shape }: { shape: ArticleShape }) {
  if (shape === "checklist") {
    return (
      <Checklist id="help-center-board-checklist">
        {STEPS.map((step) => (
          <Check key={step.title} title={step.title}>
            {step.body}
          </Check>
        ))}
      </Checklist>
    );
  }
  return (
    <Steps>
      {STEPS.map((step, i) => (
        <Step key={step.title} title={step.title} screen={shape === "screen" ? SCREENS[i] : undefined}>
          {step.body}
        </Step>
      ))}
    </Steps>
  );
}

export function ArticlePreview({ shape }: { shape: ArticleShape }) {
  return (
    <div onClickCapture={stopLinks} className="bg-background text-foreground">
      <section className="bg-[#040405] pt-10 pb-0 text-white">
        <Container className="pb-16">
          <div className="max-w-2xl">
            <div className="flex items-center gap-2">
              <Badge variant="secondary">{ARTICLE.categoryTitle}</Badge>
            </div>
            <h1 className="mt-4 font-heading text-3xl text-balance">{ARTICLE.title}</h1>
            <p className="mt-4 text-sm text-white/60 tabular-nums">
              Updated September 1, 2026 &middot; {readingTimeLabel(ARTICLE.words)}
            </p>
            <div className="relative z-10 mt-8 -mb-10 rounded-2xl border bg-card p-5 text-foreground shadow-lift ring-1 ring-foreground/5">
              <p className="text-[11px] font-medium tracking-[0.14em] text-muted-foreground uppercase">
                In short
              </p>
              <p className="mt-1.5 leading-7 text-pretty">{ARTICLE.description}</p>
            </div>
          </div>
        </Container>
      </section>
      <PaperChapter>
        <Container className="py-16">
          <div className="mx-auto flex max-w-5xl flex-col gap-12 lg:flex-row lg:items-start lg:gap-16">
            <div className="max-w-2xl min-w-0">
              <ChipToc headings={ARTICLE.headings} />
              <article
                id={ARTICLE_BODY_ID}
                className="prose mt-8 max-w-none prose-help first:mt-0 prose-headings:font-heading"
              >
                <Path>Dashboard › Your event › Share</Path>
                <h2 id="joining">Joining</h2>
                <Body shape={shape} />
                <h2 id="adding-photos">Adding photos</h2>
                <p>
                  Tap <UiLabel>Add photos</UiLabel>. Your phone&rsquo;s own picker
                  opens, so you choose from your library the way you always do.
                </p>
              </article>
            </div>
            {ARTICLE.headings.length >= 2 && (
              <aside className="hidden shrink-0 lg:block lg:w-48 lg:self-stretch">
                <nav aria-label="On this page" className="sticky top-24">
                  <p className="text-xs font-medium tracking-[0.14em] text-muted-foreground uppercase">
                    On this page
                  </p>
                  <ArticleToc headings={ARTICLE.headings} progress={{ targetId: ARTICLE_BODY_ID }} />
                </nav>
              </aside>
            )}
          </div>
        </Container>
      </PaperChapter>
    </div>
  );
}
