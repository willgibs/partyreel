"use client";

import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef } from "react";

import { LearnChevron } from "@/components/marketing/sections/shared/learn-chevron";
import { Button } from "@/components/ui/button";

/**
 * THE RECEIPT A PUBLIC FORM ENDS ON (contact-page r1 `receipt=card`, Will: "The success state/transition
 * could be much more polished. Design magic opportunity, or at least a small delight opportunity"; and
 * the careers form since mkt-polish, which ended on a toast and a bare drawn check). The card the note
 * was written on becomes the receipt for it. Nothing leaves the server a second time; what the sender
 * holds is on the card: a check that draws itself, their own words back (what it was about, its opening,
 * the address a reply goes to, which is also where a mistyped email gets caught), one onward link, and a
 * way to send another. Each form says what is its own (`contact-receipt.tsx`, `application-receipt.tsx`);
 * the card, its beats and its pure readings of a note live here once.
 *
 * ★ The design stands complete at rest. Every arrival below is a `motion-safe:starting:` transition (the
 * visible state is the default and the hidden one belongs to the arrival), so a reader who asked for less
 * motion, a throttled tab and a browser without @starting-style all meet the finished card, never an
 * empty one.
 */

// A title is not a name: "Dr" would greet as "On its way, Dr."
const TITLES = /^(mr|mrs|ms|mx|miss|dr|prof|sir|madam)$/i;
const CLEAN_WORD = /^\p{L}[\p{L}’'-]*$/u;
/** Long enough to read as the note's opening, short enough to clamp to two lines. */
const EXCERPT_CHARS = 140;

/** The sender's first name when it is a clean word, else null (the plain line greets nobody). Pure. */
export function greetingFrom(name: string): string | null {
  const first = name.trim().split(/\s+/)[0] ?? "";
  return first.length >= 2 && CLEAN_WORD.test(first) && !TITLES.test(first)
    ? first
    : null;
}

/** The subject when one was typed, else the note's opening words, whitespace collapsed. Pure. */
export function excerptFrom(message: string, subject?: string): string {
  const typed = subject?.trim() ?? "";
  return typed || message.replace(/\s+/g, " ").trim().slice(0, EXCERPT_CHARS);
}

/**
 * One line of the card arriving: a fade, a rise of 6px and a 3px blur clearing, the how-it-works stepper's
 * grammar, each on its own delay so the card reads top to bottom. The base `blur-[0px]` gives the filter
 * transition an end to travel to; the delay is inline because it is data (the beat), never a class per beat.
 */
const ARRIVE =
  "blur-[0px] transition-[opacity,filter,translate] duration-300 ease-emphasis motion-reduce:transition-none motion-safe:starting:translate-y-1.5 motion-safe:starting:opacity-0 motion-safe:starting:blur-[3px]";

function beat(ms: number) {
  return { transitionDelay: `${ms}ms` };
}

export type NoteReceiptProps = {
  /** What a screen reader hears first: the news, in two words ("Message sent."). */
  news: string;
  greeting: string | null;
  /** The one line under the heading: what happens next, and nothing the form cannot keep. */
  line: string;
  /** What the note was about (a topic, a role), with its mark when it has one. */
  about: { label: string; icon?: LucideIcon };
  excerpt: string;
  email: string;
  /** The onward link: somewhere useful while they wait. */
  next: { href: string; label: string };
  onAnother: () => void;
};

export function NoteReceipt({
  news,
  greeting,
  line,
  about,
  excerpt,
  email,
  next,
  onAnother,
}: NoteReceiptProps) {
  const heading = useRef<HTMLHeadingElement>(null);
  // The form this replaced held the focus: hand it to the receipt's heading, so a keyboard or
  // screen-reader user lands on the news rather than on a void.
  useEffect(() => {
    heading.current?.focus({ preventScroll: true });
  }, []);

  return (
    <div
      data-note-receipt
      // The frame the form held (--frame, set by `useReceiptSwap`): kept from lg, where a desk's rail and
      // card keep their composition; in a hand the card starts at it and condenses to the receipt's own
      // height, so a 900px sheet of white never sits around three short lines.
      className="flex min-h-0 flex-col items-start justify-center gap-3 py-2 transition-[min-height] duration-300 ease-emphasis motion-reduce:transition-none lg:min-h-[var(--frame)] motion-safe:starting:min-h-[var(--frame)]"
    >
      {/* The drawn check is the 10-success-check recipe (marketing.css ch. 2): data-state="in" fires on
          mount, the inline dasharray (24 ≈ path length + 1) scopes the draw to THIS icon, and success
          green is the sanctioned state accent. */}
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
          <span className="sr-only">{news} </span>
          {greeting ? `On its way, ${greeting}.` : "On its way."}
        </h3>
        <p className="mt-1.5 text-pretty text-muted-foreground">{line}</p>
      </div>
      <div className={`w-full ${ARRIVE}`} style={beat(140)}>
        <div className="rounded-xl border border-dashed bg-background/70 px-4 py-3 text-working">
          {about.label && (
            <p className="flex items-center gap-2 font-medium">
              {about.icon && (
                <about.icon
                  aria-hidden
                  className="size-4 shrink-0 text-muted-foreground"
                  strokeWidth={1.5}
                />
              )}
              {about.label}
            </p>
          )}
          {excerpt && (
            <p className="mt-1 line-clamp-2 text-pretty break-words text-muted-foreground">
              {excerpt}
            </p>
          )}
          <p className="mt-2 text-caption break-words text-muted-foreground">
            Reply to{" "}
            <span className="font-medium text-foreground">{email}</span>
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
