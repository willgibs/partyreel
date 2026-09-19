"use client";

import Image from "next/image";
import Link from "next/link";
import type { MouseEvent, ReactNode } from "react";
import { useState } from "react";

import { LearnChevron } from "@/components/marketing/sections/shared/learn-chevron";
import { Caption } from "@/components/marketing/system/caption";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import {
  CONTACT_TOPICS,
  type ContactTopicValue,
} from "@/lib/constants/contact";
import { marketingImage } from "@/lib/constants/marketing-media";

/**
 * SHARED ATOMS FOR THE `contact-page` BOARD.
 *
 * Every option below is either the REAL production component (`ContactForm`,
 * `ContactFacts`, `PageHero`, `PaperChapter`, `MarketingHeader`, imported and
 * never edited) or a small presentational copy of one piece of it, made here
 * because the real component takes no prop for the thing being varied (the
 * topic field cannot be removed from the real form, the success card is not
 * exported, a persona cannot be typed into `defaultValues` from outside). A
 * copy never re-implements logic that already exists: the topic list, its
 * icons and its hints all read `CONTACT_TOPICS`, never a second copy of it.
 */

/** A press inside a preview is looking, not leaving (the loose-ends and
 *  privacy-hero precedent: `onClickCapture` on the option's own root). */
export function stopLinks(e: MouseEvent) {
  if ((e.target as HTMLElement).closest?.("a[href]")) e.preventDefault();
}

/** The field grammar contact-form.tsx uses on the gray panel: fields read
 *  bg-background (paper white) so they pop against the card. */
export const FIELD = "h-11 rounded-xl bg-background text-base md:text-base";

/**
 * THE STATIONERY CARD, quoted from contact-form.tsx's own (unexported)
 * `FormCard`: the gray panel, the postage stamp overhanging its corner, the
 * "A note to..." caption. Every option that keeps a card-shaped surface
 * reuses this shell so the one thing that changes is what stands inside it,
 * never the card's own identity.
 */
export function Stationery({
  label = "A note to Partyreel",
  stamp = true,
  className,
  children,
}: {
  label?: string;
  stamp?: boolean;
  className?: string;
  children: ReactNode;
}) {
  const img = marketingImage("party-balloons");
  return (
    <div
      className={`relative rounded-2xl border bg-muted/50 p-6 ring-1 ring-foreground/5 sm:p-8 ${className ?? ""}`}
    >
      {stamp && (
        <div
          aria-hidden
          className="absolute -top-4 right-6 rotate-3 sm:right-8"
        >
          <Image
            src={img.src}
            alt=""
            width={64}
            height={64}
            className="size-16 rounded-tile border-4 border-background object-cover shadow-lift"
          />
        </div>
      )}
      <Caption>{label}</Caption>
      <div className="mt-5">{children}</div>
    </div>
  );
}

/** One labelled row, for the field mocks a real react-hook-form field cannot
 *  stand in for outside its own form context. */
export function PlainField({
  label,
  optional,
  children,
}: {
  label: string;
  optional?: boolean;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2">
      <label className="text-sm leading-none font-medium">
        {label}
        {optional && (
          <span className="font-normal text-muted-foreground"> (optional)</span>
        )}
      </label>
      {children}
    </div>
  );
}

/**
 * THE TOPIC SELECT, live: the real seven `CONTACT_TOPICS`, the real trigger
 * rendering (SelectValue cannot resolve a label with the popper closed, so
 * the trigger is drawn by hand exactly as contact-form.tsx does), an
 * uncontrolled `useState` standing in for react-hook-form. `extra` draws one
 * more row ABOVE the seven, undrawn by the real list, for the `door` option.
 */
export function TopicField({
  defaultValue,
  optional = false,
  extra,
}: {
  defaultValue?: ContactTopicValue;
  optional?: boolean;
  extra?: { label: string };
}) {
  const [value, setValue] = useState<string | undefined>(defaultValue);
  const picked = CONTACT_TOPICS.find((t) => t.value === value);
  return (
    <div className="flex flex-col gap-2">
      <label className="text-sm leading-none font-medium">
        What&rsquo;s this about?
        {optional && (
          <span className="font-normal text-muted-foreground"> (optional)</span>
        )}
      </label>
      <Select value={value} onValueChange={(v) => v && setValue(v)}>
        <SelectTrigger className="w-full rounded-xl bg-background text-base data-[size=default]:h-11 md:text-base">
          {picked ? (
            <span className="flex items-center gap-2">
              <picked.icon aria-hidden className="size-4" strokeWidth={1.5} />
              {picked.label}
            </span>
          ) : (
            <span className="text-muted-foreground">Pick a topic</span>
          )}
        </SelectTrigger>
        <SelectContent
          data-mkt=""
          position="popper"
          className="surface-paper rounded-xl"
        >
          {extra && (
            <div className="flex items-center gap-2 rounded-lg px-2 py-2.5 text-sm font-medium text-foreground">
              {extra.label}
            </div>
          )}
          {CONTACT_TOPICS.map((topic) => (
            <SelectItem
              key={topic.value}
              value={topic.value}
              className="rounded-lg py-2.5"
            >
              <topic.icon aria-hidden className="size-4" strokeWidth={1.5} />
              {topic.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

/** The fastest-path hint, exactly as contact-form.tsx draws it: real data,
 *  swapped by a keyed remount so the entrance replays per pick. */
export function HintRow({
  hint,
}: {
  hint: { text: string; href: string; linkLabel: string };
}) {
  return (
    <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1 rounded-xl bg-background px-4 py-3 text-sm text-muted-foreground">
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
