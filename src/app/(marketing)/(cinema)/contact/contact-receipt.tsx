"use client";

import Link from "next/link";
import { useEffect, useId, useRef } from "react";

import { LearnChevron } from "@/components/marketing/sections/shared/learn-chevron";
import { Button } from "@/components/ui/button";
import {
  CONTACT_TOPICS,
  REPLY_LINE,
  type ContactTopicValue,
} from "@/lib/constants/contact";
import type { ContactInput } from "@/lib/validation/contact";

/**
 * THE RECEIPT (contact-page r1 `receipt=card`, Will: "The success state/transition
 * could be much more polished. Design magic opportunity, or at least a small
 * delight opportunity"): the card the note was written on becomes the receipt for
 * it. Nothing leaves the server a second time; what the sender holds is on the
 * card: a check that draws itself, the stamp postmarked with today's date, their
 * own words back (a topic, a subject, the address a reply goes to, which is also
 * where a mistyped email gets caught) and one onward link that belongs to their
 * topic.
 *
 * ★ The design stands complete at rest. Every arrival below is a
 * `motion-safe:starting:` transition (the visible state is the default and the
 * hidden one belongs to the arrival), so a reader who asked for less motion, a
 * throttled tab and a browser without @starting-style all meet the finished
 * card, never an empty one.
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

// A title is not a name: "Dr" would greet as "On its way, Dr."
const TITLES = /^(mr|mrs|ms|mx|miss|dr|prof|sir|madam)$/i;
const CLEAN_WORD = /^\p{L}[\p{L}’'-]*$/u;
/** Long enough to read as the note's opening, short enough to clamp to two lines. */
const EXCERPT_CHARS = 140;

/**
 * What the receipt shows of the form's values. Pure (the clock comes in), so each
 * rule is pinned by a test and none runs during a render.
 */
export function receiptFrom(
  values: Pick<
    ContactInput,
    "name" | "email" | "topic" | "subject" | "message"
  >,
  now: Date,
): ContactReceiptData {
  const first = values.name.trim().split(/\s+/)[0] ?? "";
  const subject = values.subject?.trim() ?? "";
  const message = values.message.replace(/\s+/g, " ").trim();
  return {
    greeting:
      first.length >= 2 && CLEAN_WORD.test(first) && !TITLES.test(first)
        ? first
        : null,
    email: values.email.trim(),
    topic: values.topic,
    excerpt: subject || message.slice(0, EXCERPT_CHARS),
    postmark: {
      month: now.toLocaleDateString("en-US", { month: "short" }).toUpperCase(),
      day: String(now.getDate()),
    },
  };
}

/**
 * One line of the card arriving: a fade, a rise of 6px and a 3px blur clearing,
 * the how-it-works stepper's grammar, each on its own delay so the card reads top
 * to bottom. The base `blur-[0px]` gives the filter transition an end to travel
 * to; the delay is inline because it is data (the beat), never a class per beat.
 */
const ARRIVE =
  "blur-[0px] transition-[opacity,filter,translate] duration-300 ease-emphasis motion-reduce:transition-none motion-safe:starting:translate-y-1.5 motion-safe:starting:opacity-0 motion-safe:starting:blur-[3px]";

function beat(ms: number) {
  return { transitionDelay: `${ms}ms` };
}

/**
 * The postmark: a date stamp inked over the postage stamp's lower corner, so the
 * note reads as posted (the stationery identity FormCard already wears). Ink, not
 * colour: `currentColor` at partial strength with multiply, so the photograph
 * shows through it the way ink sits on a print. It lands like a rubber stamp,
 * pressed in from larger and turned a little (the house bounce overshoots, then
 * settles), after the check has begun to draw.
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
  const heading = useRef<HTMLHeadingElement>(null);
  // The form this replaced held the focus: hand it to the receipt's heading, so a
  // keyboard or screen-reader user lands on the news rather than on a void.
  useEffect(() => {
    heading.current?.focus({ preventScroll: true });
  }, []);

  const topic = CONTACT_TOPICS.find((t) => t.value === receipt.topic);
  // While you wait: the topic's own first answer, else the shelf. A finished flow
  // returns somewhere useful (the bible's third), and the hint the sender saw
  // while writing is the most likely thing to spare them the wait.
  const next = topic?.hint?.links[0] ?? {
    href: "/help",
    label: "Browse the help center",
  };

  return (
    <div
      data-contact-receipt
      // The frame the form held (--frame, set by the form): kept from lg, where
      // the desk's rail and card keep their composition; in a hand the card
      // starts at it and condenses to the receipt's own height, so a 900px
      // sheet of white never sits around three short lines.
      className="flex min-h-0 flex-col items-start justify-center gap-3 py-2 transition-[min-height] duration-300 ease-emphasis motion-reduce:transition-none lg:min-h-[var(--frame)] motion-safe:starting:min-h-[var(--frame)]"
    >
      {/* The drawn check is the 10-success-check recipe (marketing.css ch. 2):
          data-state="in" fires on mount, the inline dasharray (24 ≈ path length
          + 1) scopes the draw to THIS icon, and success green is the sanctioned
          state accent. */}
      <span className="mkt-check text-success" data-state="in" aria-hidden>
        <svg
          width="28"
          height="28"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path
            d="M20 6 9 17l-5-5"
            style={{ strokeDasharray: 24, strokeDashoffset: 24 }}
          />
        </svg>
      </span>
      <div className={ARRIVE} style={beat(60)}>
        <h3
          ref={heading}
          tabIndex={-1}
          className="font-heading text-page outline-none"
        >
          <span className="sr-only">Message sent. </span>
          {receipt.greeting
            ? `On its way, ${receipt.greeting}.`
            : "On its way."}
        </h3>
        <p className="mt-1.5 text-pretty text-muted-foreground">{REPLY_LINE}</p>
      </div>
      <div className={`w-full ${ARRIVE}`} style={beat(140)}>
        <div className="rounded-xl border border-dashed bg-background/70 px-4 py-3 text-working">
          {topic && (
            <p className="flex items-center gap-2 font-medium">
              <topic.icon
                aria-hidden
                className="size-4 shrink-0 text-muted-foreground"
                strokeWidth={1.5}
              />
              {topic.label}
            </p>
          )}
          {receipt.excerpt && (
            <p className="mt-1 line-clamp-2 text-pretty break-words text-muted-foreground">
              {receipt.excerpt}
            </p>
          )}
          <p className="mt-2 text-caption break-words text-muted-foreground">
            Reply to{" "}
            <span className="font-medium text-foreground">{receipt.email}</span>
          </p>
        </div>
      </div>
      <div
        className={`flex flex-wrap items-center gap-x-5 gap-y-2 pt-1 ${ARRIVE}`}
        style={beat(220)}
      >
        <Button
          variant="outline"
          size="sm"
          className="bg-background"
          onClick={onAnother}
        >
          Send another
        </Button>
        <Link
          href={next.href}
          className="mkt-learn inline-flex items-center gap-1 text-working font-medium text-muted-foreground transition-colors duration-150 hover:text-foreground"
        >
          While you wait: {next.label}
          <LearnChevron />
        </Link>
      </div>
    </div>
  );
}
