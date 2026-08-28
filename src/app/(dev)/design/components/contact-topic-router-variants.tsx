"use client";

import Link from "next/link";
import { useState, type ReactNode } from "react";

import { LearnChevron } from "@/components/marketing/sections/shared/learn-chevron";
import {
  CONTACT_TOPICS,
  type ContactTopicValue,
} from "@/lib/constants/contact";
import { cn } from "@/lib/utils";

/**
 * Touchpoint: CONTACT TOPIC ROUTER (the contact round, 2026-08-28).
 *
 * The rebuilt /contact form's first field is the round's creative element: a
 * REQUIRED topic picker that routes the note (the structured value feeds the
 * admin chip, the notify-email tag, and future support routing) and swaps a
 * fastest-path deflection hint inside the form. Two treatments of the SAME
 * field, both on the ink-inversion selected state and both driving the same
 * hint strip; /contact shipped with V1.
 *
 *  V1 ICON PILLS — a wrap of rounded-full chips, icon + label inline. Reads as
 *     conversation tags; compact enough to leave the form's first fold calm.
 *  V2 SEGMENTED TILES — a bento grid of rounded-xl tiles, icon over label.
 *     Bigger tap targets and a stronger "pick your door" moment, at the cost
 *     of more vertical room before the fields.
 */

function HintStrip({ topic }: { topic: ContactTopicValue | null }) {
  const hint = CONTACT_TOPICS.find((t) => t.value === topic)?.hint ?? null;
  if (!hint) return null;
  return (
    <div
      key={topic}
      className="flex flex-wrap items-baseline gap-x-2 gap-y-1 rounded-xl bg-muted/50 px-4 py-3 text-sm text-muted-foreground duration-200 animate-in fade-in slide-in-from-bottom-1 motion-reduce:animate-none"
    >
      <span className="text-pretty">{hint.text}</span>
      <Link
        href={hint.href}
        className="mkt-learn inline-flex items-center gap-1 font-medium text-foreground"
      >
        {hint.linkLabel}
        <LearnChevron />
      </Link>
    </div>
  );
}

function Frame({
  name,
  note,
  children,
}: {
  name: string;
  note: string;
  children: ReactNode;
}) {
  return (
    <section className="flex flex-col gap-3">
      <div>
        <h3 className="font-heading text-lg font-medium">{name}</h3>
        <p className="text-sm text-muted-foreground">{note}</p>
      </div>
      <div className="rounded-2xl border bg-card p-6 ring-1 ring-foreground/5 sm:p-8">
        {children}
      </div>
    </section>
  );
}

function IconPills() {
  const [picked, setPicked] = useState<ContactTopicValue | null>(null);
  return (
    <div className="flex flex-col gap-5">
      <p className="text-sm font-medium">What&rsquo;s this about?</p>
      <div role="radiogroup" aria-label="Topic" className="flex flex-wrap gap-2">
        {CONTACT_TOPICS.map((topic) => (
          /* cn() off state, not :has(:checked) — the shipped form's engine
             note applies here too (a Chromium-embedded engine fails :has
             invalidation on the React-controlled checked flip). */
          <label
            key={topic.value}
            className={cn(
              "ease-emphasis inline-flex h-10 cursor-pointer items-center gap-2 rounded-full border px-4 text-sm font-medium transition-[background-color,border-color,color,transform] duration-150 select-none has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring/40 active:scale-[0.97] motion-reduce:transition-none",
              picked === topic.value
                ? "border-foreground bg-foreground text-background"
                : "bg-background text-muted-foreground hover:border-foreground/30 hover:text-foreground",
            )}
          >
            <input
              type="radio"
              className="sr-only"
              name="lab-topic-pills"
              value={topic.value}
              checked={picked === topic.value}
              onChange={() => setPicked(topic.value)}
            />
            <topic.icon aria-hidden className="size-4" strokeWidth={1.5} />
            {topic.label}
          </label>
        ))}
      </div>
      <HintStrip topic={picked} />
    </div>
  );
}

function SegmentedTiles() {
  const [picked, setPicked] = useState<ContactTopicValue | null>(null);
  return (
    <div className="flex flex-col gap-5">
      <p className="text-sm font-medium">What&rsquo;s this about?</p>
      <div
        role="radiogroup"
        aria-label="Topic"
        className="grid grid-cols-2 gap-2 sm:grid-cols-4"
      >
        {CONTACT_TOPICS.map((topic) => (
          <label
            key={topic.value}
            className={cn(
              "ease-emphasis flex cursor-pointer flex-col items-start gap-2.5 rounded-xl border p-4 text-sm font-medium transition-[background-color,border-color,color,transform] duration-150 select-none has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring/40 active:scale-[0.98] motion-reduce:transition-none",
              picked === topic.value
                ? "border-foreground bg-foreground text-background"
                : "bg-background text-muted-foreground hover:border-foreground/30 hover:text-foreground",
            )}
          >
            <input
              type="radio"
              className="sr-only"
              name="lab-topic-tiles"
              value={topic.value}
              checked={picked === topic.value}
              onChange={() => setPicked(topic.value)}
            />
            <topic.icon aria-hidden className="size-5" strokeWidth={1.5} />
            <span className="text-pretty">{topic.label}</span>
          </label>
        ))}
      </div>
      <HintStrip topic={picked} />
    </div>
  );
}

export function ContactTopicRouterVariants() {
  return (
    <div className="flex flex-col gap-10">
      <Frame
        name="V1 · Icon pills (shipped)"
        note="Conversation tags: compact, keeps the first fold calm, reads inline with the fields below."
      >
        <IconPills />
      </Frame>
      <Frame
        name="V2 · Segmented tiles"
        note="Pick your door: bigger targets and a stronger opening moment, at the cost of vertical room."
      >
        <SegmentedTiles />
      </Frame>
    </div>
  );
}
