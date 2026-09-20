"use client";

import type { ReactNode } from "react";

import { ReelPicture } from "@/components/marketing/sections/how-it-works/host-pictures";
import { StepPicture } from "@/components/marketing/sections/how-it-works/step-picture";
import { HOW_IT_WORKS } from "@/lib/constants/how-it-works";

import { Screen } from "./shells";
import { ClosingDoors } from "./welcome";

/**
 * `FILM`: THE TOUR AS THE MARKETING SITE'S OWN TWELVE PICTURES, ONE PER STEP,
 * IN MOTION, THE COPY LAID OVER THEM.
 *
 * ★ THE PICTURES ARE QUOTED, NOT REDRAWN. Every frame here is `StepPicture`,
 * the exact component `/how-it-works` renders (step-picture.tsx): the same
 * `create`, `share` and `fill` pictures `HOW_IT_WORKS` already curates for
 * this very tutorial (lib/constants/how-it-works.ts, "derived from the
 * host's six... so the story a host reads inside the app and the story they
 * read on the site cannot drift"). `stage`, a file over, is the real
 * contender that builds its own visuals instead; this shape is the other
 * bet, that the tour is more alive wearing the pictures the site already
 * spent a whole board on rather than a fourth register invented for one
 * screen each.
 *
 * ★ "OVER", BUILT AS AN OVERLAP, NEVER A DARKENED PHOTOGRAPH. Six of the
 * twelve pictures are bright app panels on white, not full-bleed photographs
 * a scrim can sit on; a dark gradient poured over `CreatePicture` would fight
 * its own paper ground rather than read as cinema. So the copy is a real
 * `bg-card` plate overlapping the picture's bottom edge instead, the exact
 * device `SharePicture` already uses for its own QR card
 * (host-pictures.tsx, "the overlap is real, so it is the case `shadow-lift`
 * was ruled for") — this just runs it full width and puts a headline in it
 * rather than a code.
 *
 * ★ THE MOTION IS THE ONE THING THIS FILE ADDS TO A PICTURE THE MARKETING
 * SITE ALREADY DREW: a slow, continuous drift (`.ad-film-live`,
 * app-door.css), reduced-motion-safe by construction (the class's only
 * declaration lives inside `@media (prefers-reduced-motion: no-preference)`,
 * bible 14). The frame that clips it is a SEPARATE element from the one that
 * scales, so the picture pans inside a fixed window instead of growing past
 * its own rounded corner.
 */

const [CREATE, SHARE, FILL] = HOW_IT_WORKS;

/** One picture, breathing, with its step's words overlapping its foot. */
function FilmBeat({
  n,
  of,
  label,
  title,
  body,
  children,
}: {
  n: number;
  of: number;
  label: string;
  title: string;
  body: string;
  children: ReactNode;
}) {
  return (
    <Screen n={n} of={of} label={label}>
      <div className="relative mx-auto w-full max-w-lg pb-10">
        <div className="relative overflow-hidden rounded-2xl">
          <div className="ad-film-live">{children}</div>
        </div>
        <div className="absolute inset-x-4 -bottom-2 rounded-xl border bg-card p-4 shadow-lift ring-1 ring-foreground/5">
          <h2 className="font-heading text-subsection">{title}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{body}</p>
        </div>
      </div>
    </Screen>
  );
}

/** The close: the reel picture, one more beat of motion, then the doors. */
function FilmClose({ n, of }: { n: number; of: number }) {
  return (
    <Screen n={n} of={of} label="You're all set">
      <div className="mx-auto flex w-full max-w-lg flex-col gap-4">
        <div className="relative pb-10">
          <div className="relative overflow-hidden rounded-2xl">
            <div className="ad-film-live">
              <ReelPicture />
            </div>
          </div>
          <div className="absolute inset-x-4 -bottom-2 rounded-xl border bg-card p-4 text-center shadow-lift ring-1 ring-foreground/5">
            <h2 className="font-heading text-subsection">
              You&rsquo;re all set
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Create your first event and share the code.
            </p>
          </div>
        </div>
        <div className="flex flex-col gap-3">
          <ClosingDoors />
        </div>
      </div>
    </Screen>
  );
}

/* ── the whole shape, screens 2 to 5 (screen 1, the name, is welcome.tsx's) ── */

export function FilmSteps({ of }: { of: number }) {
  return (
    <>
      <FilmBeat n={2} of={of} label="The code, in motion" title={CREATE.title} body={CREATE.body}>
        <StepPicture id="create" />
      </FilmBeat>
      <FilmBeat n={3} of={of} label="The share, in motion" title={SHARE.title} body={SHARE.body}>
        <StepPicture id="share" />
      </FilmBeat>
      <FilmBeat n={4} of={of} label="The album, in motion" title={FILL.title} body={FILL.body}>
        <StepPicture id="fill" />
      </FilmBeat>
      <FilmClose n={5} of={of} />
    </>
  );
}
