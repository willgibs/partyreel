import { CopyCheck, EyeOff, ListChecks, type LucideIcon } from "lucide-react";
import type { CSSProperties } from "react";

import {
  BulkBarMock,
  SelectTile,
} from "@/components/marketing/sections/shared/bulk-select-mock";
import { LearnMoreLink } from "@/components/marketing/sections/shared/learn-more-link";
import { Reveal } from "@/components/marketing/system/reveal";
import { SectionShell } from "@/components/marketing/system/section-shell";
import { SECTION_HEADERS } from "@/lib/constants/marketing-voice";

/**
 * QUIET-MEDIUM (the loud/quiet map): the host-control story as three controls
 * in restrained UI vocabulary (hairline icon chips) beside ONE compact,
 * product-real mock of the app's select mode. Per Will's curation note the
 * frame carries a guest-side benefit (the subhead: curation is what makes the
 * gallery worth scrolling), and the light privacy hint lives in "Hidden stays
 * hidden".
 *
 * ★ THE SPLIT IS MIRRORED, AND THE MOCK IS SMALL (Will's second pass,
 * 2026-09-01: "no two sections back to back should feel repetitive", and the
 * paper chapter must not run three centred sections in a row). Curation and
 * privacy shipped as two centred icon layouts and read alike. The album above
 * is now a left masthead with the print set below-RIGHT, so this section's
 * visual sits on the LEFT with the controls stacked on the right, and the
 * visual is a palm-sized select-mode card (four tiles, two chosen, the
 * floating bar) rather than another framed grid. The paper chapter's shapes
 * are then masthead + print, a mirrored split, and a numbered ledger. The
 * header stays centred: it sits between two left-aligned ones.
 */

const GUEST_LINE =
  "Your guests just see the good part: one clean album, the best of everyone's camera roll.";

// `tint` = the app's REAL action colors (approve green, hide amber, the reel
// violet on the sweep), per the 2026-08-25 achromatic ruling: accents where
// they add clarity — here they teach the product's universal action-color
// system before the visitor ever signs in. Icon-stroke only; chrome stays ink.
const CONTROLS: {
  icon: LucideIcon;
  title: string;
  body: string;
  tint: string;
}[] = [
  {
    icon: ListChecks,
    title: "Approve in one scroll",
    body: "Review new uploads in a single pass, and hold anything for approval before it goes public.",
    tint: "text-success",
  },
  {
    icon: EyeOff,
    title: "Hide with a tap",
    body: "Tuck a photo away instantly. Hidden stays hidden, and guests never see it.",
    tint: "text-warning",
  },
  {
    icon: CopyCheck,
    title: "Bulk select",
    body: "Sweep up dozens at once to feature, hide, or download together.",
    tint: "text-reel",
  },
];

// Not the album's eight: the two visuals one section apart must not show the
// same photographs.
const MOCK_TILES: { id: string; selected: boolean }[] = [
  { id: "wedding-rings", selected: true },
  { id: "reception-hall", selected: false },
  { id: "festival-lights", selected: true },
  { id: "wedding-arch", selected: false },
];

export function Curation() {
  const selectedCount = MOCK_TILES.filter((t) => t.selected).length;
  return (
    <SectionShell
      eyebrow="Curation"
      heading={SECTION_HEADERS.curation.line}
      subhead={GUEST_LINE}
    >
      {/* ONE CHOREOGRAPHY (R4): the header's three lines hold slots 0-2; the
          mock lands at 3 with the first control, the controls run 3-5, and
          the pointer closes the cascade at 6. Body and pointer share ONE
          Reveal on purpose: a second observer would restart the count. */}
      <Reveal className="mx-auto mt-12 grid max-w-4xl items-center gap-x-12 gap-y-10 lg:grid-cols-[minmax(0,21rem)_1fr]">
        <div
          data-mkt-reveal
          aria-hidden
          className="relative mx-auto mb-5 w-full max-w-[21rem] rounded-2xl border bg-card p-4 ring-1 ring-foreground/5"
          style={{ "--i": 3 } as CSSProperties}
        >
          <div className="grid grid-cols-2 gap-1.5">
            {MOCK_TILES.map((tile) => (
              <SelectTile
                key={tile.id}
                id={tile.id}
                selected={tile.selected}
                sizes="(min-width: 640px) 160px, 45vw"
              />
            ))}
          </div>
          {/* The bar the selection summons, riding the card's bottom edge the
              way the app's floating bar rides the bottom of the screen. */}
          <span className="absolute inset-x-0 -bottom-5 flex justify-center">
            <BulkBarMock count={selectedCount} />
          </span>
        </div>
        <div className="flex flex-col gap-8">
          {CONTROLS.map((item, i) => (
            <div
              key={item.title}
              data-mkt-reveal
              className="flex items-start gap-4"
              style={{ "--i": i + 3 } as CSSProperties}
            >
              <span
                className={`flex size-10 shrink-0 items-center justify-center rounded-lg border ${item.tint}`}
              >
                <item.icon className="size-5" strokeWidth={1.5} />
              </span>
              <div>
                {/* The H3 TIER (Will's checkpoint note: titles blended with body,
                    font-medium was overriding font-heading's 700): the heading
                    face at full weight, two sizes under the h2. */}
                <h3 className="font-heading text-lg sm:text-xl">
                  {item.title}
                </h3>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                  {item.body}
                </p>
              </div>
            </div>
          ))}
          {/* The ladder pointer (expansion round): the full curation story. */}
          <div data-mkt-reveal style={{ "--i": 6 } as CSSProperties}>
            <LearnMoreLink href="/features/curation">
              How curation works
            </LearnMoreLink>
          </div>
        </div>
      </Reveal>
    </SectionShell>
  );
}
