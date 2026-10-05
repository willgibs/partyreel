"use client";

import {
  lazy,
  Suspense,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import Image from "next/image";

import {
  ContactReceipt,
  Postmark,
  receiptFrom,
} from "@/app/(marketing)/(cinema)/contact/contact-receipt";
import { TextSwap } from "@/components/marketing/sections/features/shared/text-swap";
import { ConfettiBurst } from "@/components/marketing/sections/shared/confetti-burst";
import { HowItWorksStepper } from "@/components/marketing/sections/shared/how-it-works-stepper";
import { TextsReveal } from "@/components/marketing/sections/shared/texts-reveal";
import { Caption } from "@/components/marketing/system/caption";
import { Reveal } from "@/components/marketing/system/reveal";
import { SectionShell } from "@/components/marketing/system/section-shell";
import { StatBand } from "@/components/marketing/system/stat-band";
import { Button } from "@/components/ui/button";
import { marketingImage } from "@/lib/constants/marketing-media";
import { SECTION_HEADERS } from "@/lib/constants/marketing-voice";

import { LIBRARY_STATS } from "@/app/(dev)/design/reference/marketing-sample-data";
import { DevicePair, type Probe } from "../device-frames";

/**
 * The interactive corner of the marketing library: the specimens whose whole
 * point is an entrance or a beat, so they need a Replay, a Fire, or an Open.
 * Re-mounting by key is the honest replay (the components arm on mount, as
 * they do in production); nothing here is a copy of a component.
 *
 * Each demo returns BARE content: since the gallery round (2026-09-12) the
 * Stage supplies the frame, the label, the mono hint and the light-and-dark
 * split, so a control that restated its own specimen's name was saying the
 * heading twice. The entries that mount these live in gallery-demos.tsx.
 */

const SampleReelOverlay = lazy(
  () =>
    import("@/components/marketing/sections/shared/sample-reel-overlay.lazy"),
);

function useRun() {
  const [run, setRun] = useState(0);
  return { run, replay: () => setRun((n) => n + 1) };
}

/** Reveal: three staggered lines behind the observer, replayed by re-mount. */
export function RevealDemo() {
  const { run, replay } = useRun();
  return (
    <div className="space-y-3">
      <Reveal key={run} className="space-y-2">
        {[
          "Every phone in the room",
          "feeds one album,",
          "and the album is yours.",
        ].map((line, i) => (
          <p
            key={line}
            data-mkt-reveal
            style={{ "--i": i } as CSSProperties}
            className="text-lg font-medium"
          >
            {line}
          </p>
        ))}
      </Reveal>
      <Button variant="outline" size="sm" onClick={replay}>
        Replay
      </Button>
    </div>
  );
}

/** TextsReveal: the class-keyed sibling of Reveal (.mkt-lines / .mkt-line). */
export function TextsRevealDemo() {
  const { run, replay } = useRun();
  return (
    <div className="space-y-3">
      <TextsReveal key={run} className="space-y-1">
        {["One scan.", "No app.", "Everything in one place."].map((line, i) => (
          <p
            key={line}
            className="mkt-line text-lg font-medium"
            style={{ "--i": i } as CSSProperties}
          >
            {line}
          </p>
        ))}
      </TextsReveal>
      <Button variant="outline" size="sm" onClick={replay}>
        Replay
      </Button>
    </div>
  );
}

/** StatBand in both animations; the final digits always server-render. */
export function StatBandDemo({ animate }: { animate: "spin" | "pop" }) {
  const { run, replay } = useRun();
  return (
    <div className="space-y-4">
      <StatBand key={run} stats={LIBRARY_STATS} animate={animate} />
      <Button variant="outline" size="sm" onClick={replay}>
        Replay
      </Button>
    </div>
  );
}

/** ConfettiBurst on a relative stage, colliding with the pill it celebrates. */
export function ConfettiDemo() {
  const [fire, setFire] = useState(0);
  const targetRef = useRef<HTMLDivElement | null>(null);
  return (
    <div className="space-y-3">
      <div className="relative flex h-40 items-end justify-center overflow-hidden rounded-lg bg-gallery pb-6">
        <ConfettiBurst fire={fire} targetRef={targetRef} />
        <div
          ref={targetRef}
          className="rounded-full bg-foreground px-4 py-1.5 text-sm font-medium text-background"
        >
          Reel ready
        </div>
      </div>
      <Button variant="outline" size="sm" onClick={() => setFire((n) => n + 1)}>
        Fire
      </Button>
    </div>
  );
}

/** The sample reel overlay, loaded lazily the way the hero loads it. */
export function OverlayDemo() {
  const [open, setOpen] = useState(false);
  return (
    <div className="space-y-3">
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        Open the sample reel
      </Button>
      {open && (
        <Suspense fallback={null}>
          <SampleReelOverlay onClose={() => setOpen(false)} />
        </Suspense>
      )}
    </div>
  );
}

const SWAP_VALUES = ["Filling live", "Held for review", "Published"];

/** TextSwap: the imperative blur-swap island; Next hands it the next value. */
export function TextSwapDemo() {
  const [i, setI] = useState(0);
  return (
    <div className="flex items-center gap-4">
      <TextSwap value={SWAP_VALUES[i]} className="text-sm font-medium" />
      <Button
        variant="outline"
        size="sm"
        onClick={() => setI((n) => (n + 1) % SWAP_VALUES.length)}
      >
        Next
      </Button>
    </div>
  );
}

/**
 * THE CINEMA ROOM A SECTION STANDS IN, AT A SCREEN OF ITS OWN: the wrapper `(cinema)/layout.tsx` gives every marketing
 * page (the descendant-scoped dark, the skin the chapters read, the ink), around a scene a `Frame` draws, so a section
 * that answers to the window (`sm:`, `lg:`, a clamp) is judged at the screens it is read at, whatever width the reader's
 * own window is. The family's page already wears this wrapper for the specimens drawn in the column.
 */
function CinemaRoom({ children }: { children: ReactNode }) {
  return (
    <div
      className="dark min-h-screen overflow-x-clip bg-background text-foreground"
      data-mkt=""
      data-mkt-skin="cinema"
    >
      {children}
    </div>
  );
}

/**
 * The stepper's frame caption, read off the frame: how many numbers stand on its rail, which is pressed, and whether
 * the picture sits beside the step's words (a desk) or under them (a hand).
 */
const readStepper: Probe = (root) => {
  const doc = root.ownerDocument;
  const rail = [...doc.querySelectorAll<HTMLElement>("button[aria-pressed]")];
  const heading = doc.querySelector<HTMLElement>("h3");
  const copy = heading?.parentElement;
  const picture = copy?.nextElementSibling;
  if (rail.length === 0 || !copy || !picture) return null;
  const at = rail.findIndex((b) => b.getAttribute("aria-pressed") === "true");
  const words = copy.getBoundingClientRect();
  const art = picture.getBoundingClientRect();
  if (words.width === 0 || art.width === 0) return null;
  const beside = art.left >= words.right - 1;
  return `step ${at + 1} of ${rail.length}, the picture ${beside ? "beside" : "under"} its words`;
};

/**
 * THE HOME'S HOW-IT-WORKS STEPPER, IN ITS SECTION, AT BOTH SCREENS (`film-strip.tsx` mounts it under the conveyor; the
 * strip is the home's own, so the section is drawn with its shell and the stepper). One step on screen at a time: press a
 * number, or Replay for the arrival.
 */
export function HowItWorksStepperDemo({
  perspective = "host",
}: {
  perspective?: "host" | "guest";
}) {
  return (
    <DevicePair
      id={`how-it-works-stepper-${perspective}`}
      read={readStepper}
      scene={() => (
        <CinemaRoom>
          <SectionShell
            eyebrow="How it works"
            heading={SECTION_HEADERS.howItWorks.line}
            width="wide"
            className="pb-10 sm:pb-12"
          >
            <HowItWorksStepper
              perspective={perspective}
              className="mt-14 sm:mt-16"
            />
          </SectionShell>
        </CinemaRoom>
      )}
      captions={{
        desk: "the home's section, at a laptop",
        hand: "the home's section, in a hand",
      }}
      note="Press a number: only that step is in the page. The door at the foot is a link, which the frame holds."
    />
  );
}

/** The day the specimens' postmark says: fixed, so the stamp is the same on every load. */
const SENT = new Date(2026, 9, 5, 14, 30);

/** Sam: a clean first word, a typed subject, a topic with its own first answer. */
const SAM = receiptFrom(
  {
    name: "Sam Okafor",
    email: "sam@example.com",
    topic: "billing",
    subject: "Storage for a 300-guest wedding",
    message: "Working out which plan covers a full weekend of video.",
  },
  SENT,
);

/** A title for a name and no subject: the plain greeting, and the message's own opening, clamped to two lines. */
const NO_NAME = receiptFrom(
  {
    name: "Dr. Priya Nair",
    email: "priya.nair@example.com",
    topic: "privacy",
    subject: undefined,
    message:
      "My daughter is in three of the photographs from the christening and we had agreed with the family that none of them would be shared beyond the people in the room, so I would like to know how to have them taken out of the album and how I can be sure they are gone from everywhere.",
  },
  SENT,
);

export type ReceiptKind = "named" | "plain";

/**
 * The contact page's card, standing in for `contact-form.tsx`'s own (its `FormCard` is the page's, not exported): the
 * stamp over the corner, the postmark inked across it, the caption. What stands in it is the real receipt, and a press of
 * Send another plays the arrival again, as the form would take the card back.
 */
function ReceiptCard({ kind }: { kind: ReceiptKind }) {
  const [shown, setShown] = useState(0);
  const receipt = kind === "named" ? SAM : NO_NAME;
  const stamp = marketingImage("party-balloons");
  return (
    <div className="mx-auto max-w-xl px-5 pt-16 pb-12">
      <div className="relative rounded-2xl border bg-muted/50 p-6 ring-1 ring-foreground/5 sm:p-8">
        <div
          aria-hidden
          className="absolute -top-4 right-6 rotate-3 sm:right-8"
        >
          <Image
            src={stamp.src}
            alt=""
            width={64}
            height={64}
            className="size-16 rounded-tile border-4 border-background object-cover shadow-lift"
          />
        </div>
        <Postmark key={shown} date={receipt.postmark} />
        <Caption>A note to Partyreel</Caption>
        <div className="mt-5">
          <ContactReceipt
            key={shown}
            receipt={receipt}
            onAnother={() => setShown((n) => n + 1)}
          />
        </div>
      </div>
    </div>
  );
}

/** The receipt's frame caption, read off the frame: its heading as the sender reads it, its topic and the card's width. */
const readReceipt: Probe = (root) => {
  const doc = root.ownerDocument;
  const heading = doc.querySelector<HTMLElement>("[data-note-receipt] h3");
  const card = doc.querySelector<HTMLElement>("[data-note-receipt]")?.parentElement
    ?.parentElement;
  if (!heading || !card) return null;
  // The heading's own words, after the sentence only a screen reader hears ("Message sent.").
  const said = heading.lastChild?.textContent?.trim();
  return `${said ?? ""} the card ${Math.round(card.getBoundingClientRect().width)} wide`;
};

/**
 * THE CONTACT PAGE'S RECEIPT AT BOTH SCREENS: the real `ContactReceipt` and its postmark on the page's card, over the two
 * ways a note reads back (a first name and a subject; a title and no subject, the message's own opening clamped).
 */
export function ContactReceiptDemo({ kind }: { kind: ReceiptKind }) {
  return (
    <DevicePair
      id={`contact-receipt-${kind}`}
      read={readReceipt}
      scene={() => (
        <CinemaRoom>
          <ReceiptCard kind={kind} />
        </CinemaRoom>
      )}
      note="The card is the form's, sent. Send another plays the receipt's arrival again; the link under it is a link, which the frame holds."
    />
  );
}
