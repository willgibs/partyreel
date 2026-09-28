"use client";

import {
  ContactFacts,
  ContactForm,
} from "@/app/(marketing)/(paper)/contact/contact-form";
import { MarketingHeader } from "@/components/marketing/chrome/marketing-header";
import { PageHero } from "@/components/marketing/system/page-hero";
import { PaperChapter } from "@/components/marketing/system/paper-chapter";
import { SectionShell } from "@/components/marketing/system/section-shell";
import { REPLY_LINE } from "@/lib/constants/contact";

import { stopLinks, stopSubmits } from "./pieces";

/**
 * DECISION 5: THE PAGE. /contact is the last `(paper)` page, forced light
 * under the light header, while every sibling utility page (`/help`,
 * `/press`, `/careers`) opens on the dark hero every utility page asks
 * for. `desk` is the page as it ships (`MarketingHeader` with no skin, the
 * light `PageHero`, then the form chapter: "Send a note", the stationery
 * form and its facts); `cinema` and `chapter` both wear the real dark hero
 * (`MarketingHeader skin="cinema" overlay`, the same PageHero at `entrance`
 * `cut`) and differ only in what opens the paper body underneath it: a plain
 * reading column, or that same form chapter. So `desk` and `chapter` differ
 * in the hero alone, which is the whole of this decision.
 */
export type PageShape = "desk" | "cinema" | "chapter";

const HEADING = "Talk to Partyreel.";
const SUBHEAD = `An event you're planning, a plan you're weighing, something that broke. ${REPLY_LINE}`;

function GenericOpener() {
  return (
    <div className="mx-auto max-w-2xl py-14 text-center sm:py-20">
      <h2 className="font-heading text-prose">Send a note</h2>
      <p className="mt-3 text-pretty text-muted-foreground">
        Pick a topic, say what&rsquo;s going on, and that&rsquo;s it.
      </p>
      <div className="mt-8 rounded-xl border bg-card/40 p-6 text-left text-sm text-muted-foreground">
        A plain reading column carries the form here, the way a help article
        carries prose: no card, no stamp, no stationery identity.
      </div>
    </div>
  );
}

/**
 * contact/page.tsx's form chapter, its three placed children and their
 * classes quoted: heading, form, then the facts on a phone; header and facts
 * stacked left of the form from lg. The page passes the form its `?about=`
 * map, which a preview has no article to fill, so the form here is the one a
 * visitor meets arriving without one.
 */
function FormChapter() {
  return (
    <SectionShell reveal="none" className="border-b">
      <div className="mx-auto grid max-w-5xl gap-10 lg:grid-cols-[1fr_1.6fr] lg:grid-rows-[auto_1fr] lg:gap-x-14 lg:gap-y-8">
        <div className="flex flex-col gap-5 lg:col-start-1 lg:row-start-1 lg:pt-2">
          <h2 className="font-heading text-prose">Send a note</h2>
          <p className="text-pretty text-muted-foreground">
            Pick a topic so it lands in the right place, say what&rsquo;s going
            on, and that&rsquo;s it.
          </p>
        </div>
        <div className="lg:col-start-2 lg:row-span-2 lg:row-start-1">
          <ContactForm />
        </div>
        <div className="lg:col-start-1 lg:row-start-2 lg:self-end">
          <ContactFacts />
        </div>
      </div>
    </SectionShell>
  );
}

export function PageIdentityPreview({ shape }: { shape: PageShape }) {
  if (shape === "desk") {
    return (
      <div
        onClickCapture={stopLinks}
        onSubmitCapture={stopSubmits}
        className="surface-paper bg-background text-foreground"
        data-mkt=""
        data-mkt-skin="paper"
      >
        <MarketingHeader />
        <PageHero
          entrance="blur"
          scale="lg"
          eyebrow="Contact"
          heading={HEADING}
          subhead={SUBHEAD}
          className="border-b py-20 sm:py-28"
        />
        <FormChapter />
      </div>
    );
  }

  return (
    <div
      onClickCapture={stopLinks}
      onSubmitCapture={stopSubmits}
      className="dark flex flex-col bg-background text-foreground"
      data-mkt=""
      data-mkt-skin="cinema"
    >
      <MarketingHeader skin="cinema" overlay />
      <PageHero
        entrance="cut"
        scale="lg"
        eyebrow="Contact"
        heading={HEADING}
        subhead={SUBHEAD}
        className="relative -mt-[var(--mkt-header-h,4rem)] pt-[calc(var(--mkt-header-h,4rem)+3.5rem)] pb-14 sm:pb-20"
      />
      <PaperChapter>
        {shape === "cinema" ? <GenericOpener /> : <FormChapter />}
      </PaperChapter>
    </div>
  );
}
