"use client";

import {
  ContactFacts,
  ContactForm,
} from "@/app/(marketing)/(paper)/contact/contact-form";
import { PageHero } from "@/components/marketing/system/page-hero";
import { SectionShell } from "@/components/marketing/system/section-shell";
import { REPLY_LINE } from "@/lib/constants/contact";

import { Stationery, stopLinks } from "./pieces";

/**
 * DECISION 1: THE WAY IN. Does reaching a person require a form at all?
 *
 * All three share the real hero (PageHero, unedited) and the real
 * `ContactForm`/`ContactFacts` where they appear; only the grid beneath the
 * hero is rearranged. `routed` is today's own layout, read straight off
 * page.tsx.
 */
export type ReachShape = "routed" | "address" | "both";

function Hero() {
  return (
    <PageHero
      entrance="blur"
      scale="lg"
      eyebrow="Contact"
      heading="Talk to Partyreel."
      subhead={`An event you're planning, a plan you're weighing, something that broke. ${REPLY_LINE}`}
      className="border-b py-14 sm:py-20"
    />
  );
}

export function ReachPreview({ shape }: { shape: ReachShape }) {
  return (
    <div onClickCapture={stopLinks} className="bg-background text-foreground">
      <Hero />
      <SectionShell reveal="none" className="border-b">
        {shape === "routed" && (
          <div className="mx-auto grid max-w-5xl gap-10 lg:grid-cols-[1fr_1.6fr] lg:grid-rows-[auto_1fr] lg:gap-x-14 lg:gap-y-8">
            <div className="flex flex-col gap-5 lg:col-start-1 lg:row-start-1 lg:pt-2">
              <h2 className="font-heading text-prose">Send a note</h2>
              <p className="text-pretty text-muted-foreground">
                Pick a topic, say what&rsquo;s going on, and that&rsquo;s it.
              </p>
            </div>
            <div className="lg:col-start-2 lg:row-span-2 lg:row-start-1">
              <ContactForm />
            </div>
            <div className="lg:col-start-1 lg:row-start-2 lg:self-end">
              <ContactFacts />
            </div>
          </div>
        )}
        {shape === "address" && (
          <div className="mx-auto flex max-w-xl flex-col items-center gap-6 text-center">
            <h2 className="font-heading text-prose">Write to us directly</h2>
            <p className="max-w-md text-pretty text-muted-foreground">
              No form, no topic to pick: one address, and a promise on how
              long a reply takes.
            </p>
            <div className="w-full max-w-sm text-left">
              <ContactFacts />
            </div>
          </div>
        )}
        {shape === "both" && (
          <div className="mx-auto grid max-w-5xl gap-8 lg:grid-cols-2 lg:items-stretch">
            <div className="flex flex-col gap-5">
              <h2 className="font-heading text-prose">Send a note</h2>
              <ContactForm />
            </div>
            <div className="flex flex-col gap-5">
              <h2 className="font-heading text-prose">Write directly</h2>
              <Stationery
                label="Skip the form"
                stamp={false}
                className="flex flex-1 flex-col justify-center"
              >
                <ContactFacts />
              </Stationery>
            </div>
          </div>
        )}
      </SectionShell>
    </div>
  );
}
