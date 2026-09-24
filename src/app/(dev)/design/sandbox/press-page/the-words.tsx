"use client";

import { CopyButton } from "@/components/marketing/press/copy-button";
import { Eyebrow } from "@/components/marketing/system/eyebrow";
import { Container } from "@/components/shared/container";
import { PRESS_BOILERPLATE, PRESS_BOILERPLATE_SHORT } from "@/lib/constants/press";

import { FIXTURE_NAME, FIXTURE_TITLE, FixtureNote } from "./shared";

/**
 * DECISION 3: HOW THE WORDS HAND OVER. `paragraph-and-line` recreates the
 * real Words section verbatim (Eyebrow + CopyButton + blockquote, twice) on
 * the real PRESS_BOILERPLATE strings; `three-lengths` adds a third, longer
 * length as a LOCAL fixture paragraph (never added to constants/press.ts,
 * which is a read-only single source this board never edits); `founder-voice`
 * adds one attributed line under the fixture name every "named" option here
 * shares.
 */

/** The third length: a page-length account nobody has written yet, so this
 *  is preview fixture copy, not a draft awaiting a ship. Never lands in
 *  constants/press.ts without its own round. Its closing line retells the
 *  reel (the host-made, stored mp4 is gone) after reel-story.thesis's
 *  recommended "grows" option, "Every event has a reel" — that board is
 *  still open, so the line is a provisional stand-in, not final copy. */
const PAGE_LENGTH_FIXTURE = `${PRESS_BOILERPLATE} Every album lives at the same link for as long as the host keeps it: there is no cliff where a night's photos quietly expire, and no per-guest fee that punishes a bigger party. A host approves what stays, guests keep their own originals at full quality, and every event has a reel already: a live montage of everything the album shows, playing from the third photo with nothing to render and nothing to wait on.`;

const QUOTE = `"The best photos from any event are scattered across fifty phones nobody will ever see. We built the one place they all land."`;

function CopyBlock({
  label,
  value,
  copyLabel,
  large,
}: {
  label: string;
  value: string;
  copyLabel: string;
  large?: boolean;
}) {
  return (
    <div className="flex flex-col">
      <div className="flex items-baseline justify-between gap-4">
        <Eyebrow>{label}</Eyebrow>
        <CopyButton value={value} label={copyLabel} />
      </div>
      {large ? (
        <blockquote className="mt-4 border-l-2 border-foreground/20 pl-5 text-lg leading-8 text-pretty">
          {value}
        </blockquote>
      ) : (
        <p className="mt-4 text-pretty text-muted-foreground">{value}</p>
      )}
    </div>
  );
}

function QuickHits() {
  return (
    <dl className="mt-10 grid gap-6 border-t pt-6 sm:grid-cols-2">
      <div>
        <dt className="text-sm font-medium">Quote it freely</dt>
        <dd className="mt-1 text-sm text-pretty text-muted-foreground">
          Whole or in part, edited to fit your piece. No permission needed.
        </dd>
      </div>
      <div>
        <dt className="text-sm font-medium">Write the name this way</dt>
        <dd className="mt-1 text-sm text-pretty text-muted-foreground">
          Partyreel. One word, one capital P.
        </dd>
      </div>
    </dl>
  );
}

function ParagraphAndLine() {
  return (
    <div className="flex max-w-2xl flex-col">
      <CopyBlock label="The boilerplate" value={PRESS_BOILERPLATE} copyLabel="Copy the boilerplate" large />
      <div className="mt-10">
        <CopyBlock label="The one-liner" value={PRESS_BOILERPLATE_SHORT} copyLabel="Copy the one-liner" />
      </div>
      <QuickHits />
    </div>
  );
}

function ThreeLengths() {
  return (
    <div className="flex max-w-2xl flex-col gap-10">
      <CopyBlock label="A sentence" value={PRESS_BOILERPLATE_SHORT} copyLabel="Copy the sentence" />
      <CopyBlock label="A paragraph" value={PRESS_BOILERPLATE} copyLabel="Copy the paragraph" large />
      <CopyBlock label="A page" value={PAGE_LENGTH_FIXTURE} copyLabel="Copy the page" />
      <FixtureNote>
        The page length is preview copy, written for this board only: no
        round has drafted the real thing yet.
      </FixtureNote>
    </div>
  );
}

function FounderVoice() {
  return (
    <div className="flex max-w-2xl flex-col">
      <CopyBlock label="The boilerplate" value={PRESS_BOILERPLATE} copyLabel="Copy the boilerplate" large />
      <div className="mt-10">
        <CopyBlock label="The one-liner" value={PRESS_BOILERPLATE_SHORT} copyLabel="Copy the one-liner" />
      </div>
      <div className="mt-10 border-t pt-6">
        <Eyebrow>In their own words</Eyebrow>
        <blockquote className="mt-4 text-lg leading-8 text-pretty italic">{QUOTE}</blockquote>
        <p className="mt-3 text-sm font-medium">
          {FIXTURE_NAME}, <span className="text-muted-foreground">{FIXTURE_TITLE}</span>
        </p>
      </div>
      <QuickHits />
      <FixtureNote>
        {FIXTURE_NAME} is a fixture name for this board only, never a real
        person, the same name the founder-card and named-contact options
        (a-human) reuse.
      </FixtureNote>
    </div>
  );
}

export function WordsPreview({
  variant,
}: {
  variant: "paragraph-and-line" | "three-lengths" | "founder-voice";
}) {
  return (
    <Container className="py-10">
      {variant === "three-lengths" ? (
        <ThreeLengths />
      ) : variant === "founder-voice" ? (
        <FounderVoice />
      ) : (
        <ParagraphAndLine />
      )}
    </Container>
  );
}
