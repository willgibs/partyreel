"use client";

import { useId } from "react";

import {
  excerptFrom,
  greetingFrom,
  NoteReceipt,
} from "@/components/marketing/forms/note-receipt";
import {
  CONTACT_TOPICS,
  REPLY_LINE,
  type ContactTopicValue,
} from "@/lib/constants/contact";
import type { ContactInput } from "@/lib/validation/contact";

/**
 * /CONTACT'S RECEIPT: the public forms' one receipt (`NoteReceipt`, `components/marketing/forms/`) with
 * what is this form's own: the topic and its icon, the one reply promise (`REPLY_LINE`, the only true
 * timing), the topic's own first answer while they wait, and the postmark its stationery wears.
 */

export type ContactReceiptData = {
  /** The sender's first name, or null when what they typed is no clean first word. */
  greeting: string | null;
  email: string;
  topic: ContactTopicValue;
  /** The subject when one was typed, else the message's opening words. */
  excerpt: string;
  /** The day the note was sent, for the postmark. */
  postmark: { month: string; day: string };
};

/**
 * What the receipt shows of the form's values. Pure (the clock comes in), so each rule is pinned by a test
 * and none runs during a render.
 */
export function receiptFrom(
  values: Pick<
    ContactInput,
    "name" | "email" | "topic" | "subject" | "message"
  >,
  now: Date,
): ContactReceiptData {
  return {
    greeting: greetingFrom(values.name),
    email: values.email.trim(),
    topic: values.topic,
    excerpt: excerptFrom(values.message, values.subject),
    postmark: {
      month: now.toLocaleDateString("en-US", { month: "short" }).toUpperCase(),
      day: String(now.getDate()),
    },
  };
}

/**
 * The postmark: a date stamp inked over the postage stamp's lower corner, so the note reads as posted (the
 * stationery identity FormCard already wears). Ink, not colour: `currentColor` at partial strength with
 * multiply, so the photograph shows through it the way ink sits on a print. It lands like a rubber stamp,
 * pressed in from larger and turned a little (the house bounce overshoots, then settles), after the check
 * has begun to draw.
 */
export function Postmark({ date }: { date: ContactReceiptData["postmark"] }) {
  const id = useId();
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute -top-2 right-[66px] -rotate-12 text-foreground/75 mix-blend-multiply transition-[opacity,scale,rotate] delay-200 duration-[260ms] ease-[var(--mkt-ease-pop)] motion-reduce:transition-none sm:right-[74px] motion-safe:starting:scale-[1.7] motion-safe:starting:-rotate-[26deg] motion-safe:starting:opacity-0"
    >
      <svg width="72" height="72" viewBox="0 0 72 72" fill="none">
        <defs>
          {/* Two arcs for the ring's words: the top one runs clockwise so its
              letters stand up, the bottom one counter-clockwise so "SENT" reads
              upright too. */}
          <path id={`${id}-top`} d="M 11 36 A 25 25 0 0 1 61 36" />
          <path id={`${id}-bottom`} d="M 5 36 A 31 31 0 0 0 67 36" />
        </defs>
        <circle
          cx="36"
          cy="36"
          r="34"
          stroke="currentColor"
          strokeWidth="1.5"
        />
        <circle cx="36" cy="36" r="21" stroke="currentColor" strokeWidth="1" />
        <g
          fill="currentColor"
          className="font-heading"
          style={{ letterSpacing: "0.14em" }}
        >
          <text fontSize="6.5" textAnchor="middle">
            <textPath href={`#${id}-top`} startOffset="50%">
              PARTYREEL
            </textPath>
          </text>
          <text fontSize="6.5" textAnchor="middle">
            <textPath href={`#${id}-bottom`} startOffset="50%">
              SENT
            </textPath>
          </text>
          <text x="36" y="32" fontSize="8" textAnchor="middle">
            {date.month}
          </text>
          <text
            x="36"
            y="45"
            fontSize="14"
            textAnchor="middle"
            style={{ letterSpacing: 0 }}
          >
            {date.day}
          </text>
        </g>
      </svg>
    </div>
  );
}

export function ContactReceipt({
  receipt,
  onAnother,
}: {
  receipt: ContactReceiptData;
  onAnother: () => void;
}) {
  const topic = CONTACT_TOPICS.find((t) => t.value === receipt.topic);
  // While you wait: the topic's own first answer, else the shelf. A finished flow returns somewhere
  // useful (the bible's third), and the hint the sender saw while writing is the most likely thing to
  // spare them the wait.
  const next = topic?.hint?.links[0] ?? {
    href: "/help",
    label: "Browse the help center",
  };

  return (
    <NoteReceipt
      news="Message sent."
      greeting={receipt.greeting}
      line={REPLY_LINE}
      about={{ label: topic?.label ?? "", icon: topic?.icon }}
      excerpt={receipt.excerpt}
      email={receipt.email}
      next={next}
      onAnother={onAnother}
    />
  );
}
