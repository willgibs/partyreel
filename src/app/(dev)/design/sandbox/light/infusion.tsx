"use client";

import { Part, Takeaway } from "./shared";

/**
 * THE INFUSION PLAN (round four, 2026-09-15).
 *
 * Will: "the three explorations set our future visual identity that will be
 * progressively infused into the new marketing site. We should find the best
 * way to begin that infusion."
 *
 * The order is the whole answer, and it is not the order the work was done in.
 * Three constraints decide it:
 *
 *   1  ACHROMATIC FIRST. The separate job cannot collide with anything, because
 *      it has no colour to collide with. Every other phase puts light on
 *      surfaces whose separation is still doing the wrong job in dark, so
 *      landing it first is the only way the later phases are judged on
 *      themselves.
 *   2  ONE PAGE BEFORE EVERY PAGE. "One accent section per page" only has a
 *      meaning where a page has a ruled chapter map, and exactly one page does.
 *      The home arc is the proving ground and the rest of the site copies a
 *      pattern that has already survived a real page.
 *   3  A PHASE THAT NEEDS ANOTHER BOARD'S RULING WAITS FOR IT. Two do: paper
 *      waits for the palette ramp, and the feature pages wait for the media
 *      kit's art. Landing them early would mean landing them twice.
 *
 * Each phase below names what it lands, where, what it needs, and what goes
 * wrong if it lands out of order. A wiring round cuts its scope from one row.
 */
type Phase = {
  n: string;
  name: string;
  lands: string;
  where: string;
  needs: string;
  risk: string;
};

const PHASES: Phase[] = [
  {
    n: "1",
    name: "The floor",
    lands:
      "The separate job, whole: --shadow-lift and --shadow-layer with their per-ground alphas, the ring written into the elevation contract, and [data-lit] on the three surfaces the doctrine names.",
    where:
      "globals.css and the floating primitives. Every page inherits it, marketing and app alike, and the dashboard's event cards are the most visible change.",
    needs:
      "Nothing. No asset, no other board's ruling, and the block is already wearable on the real site from this board's Apply button.",
    risk: "Landing it late means every chromatic phase is judged on surfaces that are still separating badly in dark, so a field gets blamed for a shadow's job.",
  },
  {
    n: "2",
    name: "The two ends of the home arc",
    lands:
      "<SectionLight>, --aurora-cadence, and the aurora at the accent register on exactly two sections: the guest ledger near the top of chapter one, and the closer above the footer.",
    where:
      "/ only. Two call sites, one component, nothing else on the page moves.",
    needs:
      "The grain tile (a generated stand-in ships meanwhile), and the cadence ruling, because the sibling token multiplies whatever the lamp's clock is ruled to be.",
    risk: "The closer sits one scarcity distance above the footer seam, which is the hardest test the distance law has on any real page. If it survives there it survives anywhere, and if it does not, the identity register is dead before it costs anything.",
  },
  {
    n: "3",
    name: "Paper",
    lands:
      "--lamp-1..5 re-declared on .surface-paper, then the aurora on the paper chapters.",
    where:
      "/'s paper chapter, /help, /contact, and the pricing page's paper band.",
    needs:
      "The palette board's ruling on the paper ramp first, or in the same merge. The two interact directly: a lighter paper ground needs MORE alpha for the same presence, not less, so a register tuned against today's paper is wrong the moment the ramp moves.",
    risk: "Landing the paper five before the ramp means tuning five hues twice. Landing the aurora on paper before the five means shipping the dirty-rather-than-lit failure the paper register exists to prevent.",
  },
  {
    n: "4",
    name: "The feature pages",
    lands:
      "The seam on every feature hero that has a screen (ScreenLamp, re-registered as a named treatment rather than a one-off), the throw on plates that are present rather than live, and the lit face on the plates.",
    where: "/features/*.",
    needs:
      "The media kit's feature-page art, because these are the pages where the light is SAMPLED rather than housed and law 3 actually fires.",
    risk: "The sampler has to be chosen deliberately at every new call site: the DOM form taints on a raw presigned tile and silently returns the fallback five, with no error and no failing test. The tell is only that the colours look generic.",
  },
  {
    n: "5",
    name: "The moments",
    lands:
      "The bloom on the publish beat at the leaned five, and the sweep on an arrival.",
    where: "The reel's publish moment; the guest upload landing.",
    needs: "The publish beat's colour ruling.",
    risk: "A moment is the only part of the kit that touches app state, so it needs the app's own wiring rather than a CSS block. The reveal grammar is ratified as built, so anything inside it is an amendment with its own ruling rather than a tweak.",
  },
  {
    n: "6",
    name: "The app",
    lands:
      "Phase 1 already reaches the app. After it, the one bloom the app earns (the first event ever created, which happens exactly once per account) and nothing else.",
    where: "/dashboard, the event page.",
    needs: "The app's own design round, which Will's round-four note opens.",
    risk: "The app is where the frequency doctrine bites hardest: these are the screens a host opens every day, and theatre on a daily surface is the failure the whole NEVER list is guarding against. Light arrives here last and thinnest, on purpose.",
  },
];

export function InfusionPart({ rules }: { rules: string[] }) {
  return (
    <Part
      n="06"
      id="infusion"
      title="The infusion plan: the order the identity enters the site"
      rules={rules}
      lede={
        <>
          <p>
            Six phases, and the order is the whole proposal. Achromatic first,
            because the separate job has no colour to collide with and every
            other phase is judged badly until it lands. One page before every
            page, because {"“"}one accent section per page{"”"} only
            means something where a page has a ruled chapter map, and exactly
            one page does. And a phase that needs another board{"'"}s ruling
            waits for it: two do, and landing them early would mean landing them
            twice.
          </p>
          <p>
            A wiring round cuts its scope from one row. Nothing here needs the
            whole kit ruled at once.
          </p>
        </>
      }
    >
      <div className="flex flex-col">
        {PHASES.map((p) => (
          <div
            key={p.n}
            className="grid grid-cols-1 gap-x-5 gap-y-1.5 border-t border-border py-4 lg:grid-cols-[10rem_1fr_1fr]"
          >
            <div className="flex flex-col gap-0.5">
              <p className="text-[12px] font-medium">
                <span className="mr-1.5 text-muted-foreground tabular-nums">
                  {p.n}
                </span>
                {p.name}
              </p>
              <p className="text-[10px] leading-snug text-muted-foreground">
                {p.where}
              </p>
            </div>
            <p className="text-[11px] leading-relaxed text-muted-foreground">
              <span className="text-foreground">Lands: </span>
              {p.lands}
            </p>
            <div className="flex flex-col gap-1 text-[11px] leading-relaxed text-muted-foreground">
              <p>
                <span className="text-foreground">Needs: </span>
                {p.needs}
              </p>
              <p>
                <span className="text-foreground">Out of order: </span>
                {p.risk}
              </p>
            </div>
          </div>
        ))}
      </div>

      <Takeaway lands="phase 1, as one commit, in the next wiring round.">
        Begin with the floor. It is the only phase that needs nothing from any
        other board, it is already wearable on the real site from this board
        {"'"}s own Apply button, and it is the one phase whose absence makes
        every other phase harder to judge. Phase 2 is two call sites on one
        page after that, which is a deliberately small second step: the closer
        above the footer is the hardest test the scarcity distance has anywhere
        on the site, and it should be taken while the cost of being wrong is two
        lines.
      </Takeaway>
    </Part>
  );
}
