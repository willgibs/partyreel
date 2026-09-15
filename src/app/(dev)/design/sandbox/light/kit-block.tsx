"use client";

import { FENCES, JOBS, LANDS, TREATMENTS, type JobId } from "./kit";

/**
 * THE KIT, AS THE BOARD'S FIRST BLOCK (round four, 2026-09-15).
 *
 * Will's note on round three: the board read as "a fun research report without
 * many applicable takeaways to carry into the platform". The research was not
 * the problem; its POSITION was. Three rounds of argument ended in a doctrine
 * at the bottom of thirteen thousand pixels, so the takeaway was the last thing
 * a reviewer reached and the first thing he needed.
 *
 * So the board opens with what to DO. Twelve treatments across three jobs, each
 * with its place, its section kinds, its frequency and its mount; the fences
 * that hold; and the bill of materials a wiring round types into files. Every
 * row links to the specimen that earns it, so the research is still there and
 * it is now underneath the conclusion instead of in front of it.
 *
 * ★ EVERY WORD HERE IS READ FROM kit.ts, which the composer and the treatment
 * specimens also read. A kit that can disagree with its own board is worse than
 * no kit, and three rounds of this board have found two numbers that had drifted
 * between a stage and its caption.
 */
const JOB_COLOR: Record<JobId, string> = {
  separate: "The depth cues",
  fill: "The fields",
  mark: "The moments",
};

function TreatmentRows({ job }: { job: JobId }) {
  const rows = TREATMENTS.filter((t) => t.job === job);
  return (
    <div className="flex flex-col">
      {rows.map((t) => (
        <div
          key={t.id}
          className="grid grid-cols-1 gap-x-4 gap-y-1 border-t border-border py-3 lg:grid-cols-[9rem_1fr_1fr] lg:py-2.5"
        >
          <div className="flex flex-col gap-0.5">
            <a
              href={`#${t.at}`}
              className="text-[12px] font-medium underline decoration-foreground/20 underline-offset-2 transition-colors duration-150 ease-emphasis hover:decoration-foreground/60 motion-reduce:transition-none"
            >
              {t.name}
            </a>
            <span className="text-[10px] leading-snug text-muted-foreground">
              {t.ships ? `ships: ${t.ships}` : "not built yet"}
            </span>
          </div>
          <p className="text-[11px] leading-relaxed text-muted-foreground">
            {t.is}
          </p>
          <div className="flex flex-col gap-0.5 text-[11px] leading-relaxed text-muted-foreground">
            <p>
              <span className="text-foreground">Its place: </span>
              {t.place}
            </p>
            <p>
              <span className="text-foreground">On: </span>
              {t.where}
            </p>
            <p>
              <span className="text-foreground">How often: </span>
              {t.often}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

export function KitBlock() {
  return (
    <div className="flex flex-col gap-5">
      <div className="max-w-2xl space-y-2">
        <h2 className="text-sm font-semibold tracking-tight">
          <span className="mr-2 text-muted-foreground tabular-nums">01</span>
          The kit: what to carry into the platform
        </h2>
        <div className="space-y-2 text-xs leading-relaxed text-muted-foreground">
          <p>
            Three explorations, one kit. The spill doctrine named five shapes
            the engine can make and proved them on production{"'"}s real
            grounds. The spill placements decided where a light is earned, and
            wrote the beam{"'"}s laws and the scarcity distance. This board
            asked what the whole system would be if it were designed today, and
            answered: three jobs, a lamp needs a place rather than an object,
            and the field at chapter scale is the aurora.
          </p>
          <p>
            A shape is not a treatment. A treatment is a shape, at a place, at a
            register, at a cadence, on a named kind of section, with a mount you
            can paste. That is what the three become together, and it is what a
            wiring round cuts from. Everything below this block is the evidence
            for one of these rows.
          </p>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        {JOBS.map((j) => (
          <div
            key={j.id}
            className="rounded-lg border border-border bg-card p-3"
          >
            <p className="text-[12px] font-medium">
              {j.name}
              <span className="ml-1.5 font-normal text-muted-foreground">
                {JOB_COLOR[j.id]}
              </span>
            </p>
            <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
              {j.is}
            </p>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-5">
        {JOBS.map((j) => (
          <div key={j.id} className="flex flex-col gap-1">
            <p className="text-[12px] font-medium">
              {j.name}
              <span className="ml-1.5 font-normal text-muted-foreground">
                {JOB_COLOR[j.id]}
              </span>
            </p>
            <TreatmentRows job={j.id} />
          </div>
        ))}
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <div className="flex flex-col gap-2">
          <h3 className="text-[13px] font-semibold">
            The fences, and the case behind each
          </h3>
          <p className="max-w-prose text-[11px] leading-relaxed text-muted-foreground">
            A fence with no case behind it is an opinion. Every line here is
            either a law the three explorations ruled, or something a specimen
            on this board falsified.
          </p>
          <ul className="flex flex-col gap-2.5 pt-1">
            {FENCES.map((f) => (
              <li key={f.rule} className="flex flex-col gap-0.5">
                <p className="text-[11px] font-medium">{f.rule}</p>
                <p className="text-[11px] leading-relaxed text-muted-foreground">
                  {f.because}
                </p>
              </li>
            ))}
          </ul>
        </div>

        <div className="flex flex-col gap-2">
          <h3 className="text-[13px] font-semibold">
            What a wiring round lands
          </h3>
          <p className="max-w-prose text-[11px] leading-relaxed text-muted-foreground">
            The bill of materials. Not one of these is a research finding: each
            row is a thing somebody types into a file, and the whole of it is
            seven rows.
          </p>
          <div className="flex flex-col pt-1">
            {LANDS.map((l) => (
              <div
                key={l.what}
                className="flex flex-col gap-0.5 border-t border-border py-2.5"
              >
                <p className="text-[11px] font-medium">{l.what}</p>
                <p className="text-[10px] text-muted-foreground">{l.where}</p>
                <p className="text-[11px] leading-relaxed text-muted-foreground">
                  {l.is}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
