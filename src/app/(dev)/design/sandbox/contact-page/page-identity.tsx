"use client";

import {
  ContactFacts,
  ContactForm,
} from "@/app/(marketing)/(paper)/contact/contact-form";
import { MarketingHeader } from "@/components/marketing/chrome/marketing-header";
import { PageHero } from "@/components/marketing/system/page-hero";
import { PaperChapter } from "@/components/marketing/system/paper-chapter";
import { REPLY_LINE } from "@/lib/constants/contact";

import { stopLinks } from "./pieces";

/**
 * DECISION 5: THE PAGE. /contact is the last `(paper)` page, forced light
 * under the light header, while every sibling utility page (`/help`,
 * `/press`, `/careers`) opens on the dark hero bible 16 asks of a utility
 * page. `desk` is today's own chrome (`MarketingHeader` with no skin,
 * `PageHero` unedited); `cinema` and `chapter` both wear the real dark hero
 * (`MarketingHeader skin="cinema" overlay`, the same PageHero at `entrance`
 * `cut`) and differ only in what opens the paper body underneath it: a plain
 * reading column, or the desk's own form and facts.
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
        A plain reading column carries the form here, the way a help
        article carries prose: no card, no stamp, no stationery identity.
      </div>
    </div>
  );
}

function DeskOpener() {
  return (
    <div className="mx-auto grid max-w-5xl gap-10 py-14 sm:py-20 lg:grid-cols-[1fr_1.6fr]">
      <div className="flex flex-col gap-5 lg:pt-2">
        <h2 className="font-heading text-prose">Send a note</h2>
        <p className="text-pretty text-muted-foreground">
          Pick a topic, say what&rsquo;s going on, and that&rsquo;s it.
        </p>
      </div>
      <ContactForm />
      <div className="lg:col-start-1">
        <ContactFacts />
      </div>
    </div>
  );
}

export function PageIdentityPreview({ shape }: { shape: PageShape }) {
  if (shape === "desk") {
    return (
      <div
        onClickCapture={stopLinks}
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
          className="border-b py-14 sm:py-20"
        />
        <GenericOpener />
      </div>
    );
  }

  return (
    <div
      onClickCapture={stopLinks}
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
        {shape === "cinema" ? <GenericOpener /> : <DeskOpener />}
      </PaperChapter>
    </div>
  );
}
