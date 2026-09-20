import { Skeleton } from "@/components/ui/skeleton";

import { requireDesignKey, withDesignKey } from "@/lib/design-gate/server";
import { PageHeader } from "@/app/(dev)/design/(shell)/_shell/page-header";
import { Pager } from "@/app/(dev)/design/(shell)/_shell/pager";
import { Section, Sub } from "@/app/(dev)/design/(shell)/_shell/section";
import { Tag } from "@/app/(dev)/design/(shell)/_shell/tag";
import { EntryBlock } from "@/app/(dev)/design/gallery/gallery-ui";
import { itemById } from "@/app/(dev)/design/gallery/registry";
import { Specimen } from "@/app/(dev)/design/gallery/specimen";
import { Column, Swatch } from "@/app/(dev)/design/reference/reference-ui";

import { BrightEdge } from "./bright-edge";
import { ElevationLegend } from "./elevation-legend";
import { RadiusLadder } from "./radius-ladder";
import { TypeLadder } from "./type-ladder";

/**
 * THE TOKENS. Every swatch fills with the REAL CSS var and every specimen uses
 * the REAL utilities, so this page tracks the theme by construction: edit a
 * token, this updates. It inherits the root next-themes theme (the toggle is
 * in the top bar), and any block's split button shows light and dark at once.
 *
 * Every token GROUP is a heading with an anchor (the Library x Lab round,
 * 2026-09-15), so the table of contents is a list of the token families and a
 * ruling can link straight at "the lamp set" rather than at the page.
 */
export default async function FoundationsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const key = await requireDesignKey(searchParams);
  // Glow is the one COMPONENT on a page of tokens, so it is declared like every
  // other library component (foundations/gallery-demos.tsx) and rendered here
  // through the gallery block: its variants, its config panel and its permalink
  // all come from that one entry.
  const glow = itemById("glow");

  return (
    <Column>
      <PageHeader
        title="Foundations"
        description="The design tokens, rendered from the real CSS variables. Everything here flips with the app because it IS the app: these are the same vars every surface reads."
        meta={[
          ["source", "src/app/theme.css"],
          ["themes", "light and dark, per block"],
        ]}
      />

      <Section
        id="color"
        title="Color"
        blurb="Grayscale surfaces and ink; color is reserved for state and for the media itself. Each swatch is the live var."
      >
        <div className="space-y-1">
          <SwatchGroup
            id="surfaces"
            caption="Surfaces"
            tokens={[
              ["Background", "--background"],
              ["Card", "--card"],
              ["Popover", "--popover"],
              ["Muted", "--muted"],
              ["Secondary", "--secondary"],
              ["Accent", "--accent"],
            ]}
          />
          <SwatchGroup
            id="ink"
            caption="Ink"
            tokens={[
              ["Foreground", "--foreground"],
              ["Muted foreground", "--muted-foreground"],
              // The third text step (the palette's round eight): `text-faint`,
              // for a timestamp, a caption or a hint. A token rather than an
              // alpha of the step above, so it is ONE grey on the page, on a
              // card and on the panel. Captions only; it is under 4.5:1.
              ["Faint", "--faint"],
              ["Primary", "--primary"],
              ["Border", "--border"],
              ["Input", "--input"],
              ["Ring", "--ring"],
            ]}
          />
          <SwatchGroup
            id="state"
            caption="State"
            blurb="Punctuation only, never a wash."
            tokens={[
              ["Destructive", "--destructive"],
              ["Success", "--success"],
              ["Warning", "--warning"],
              ["Like", "--like"],
            ]}
          />
          <SwatchGroup
            id="gallery-ground"
            caption="Gallery"
            blurb="Always dark and theme-independent, so media is the hero."
            tokens={[
              ["Gallery", "--gallery"],
              ["Gallery foreground", "--gallery-foreground"],
              ["Gallery muted", "--gallery-muted"],
              ["Gallery border", "--gallery-border"],
            ]}
          />
          <SwatchGroup
            id="charts"
            caption="Charts"
            blurb="A grayscale ramp; the data carries the meaning, not the hue."
            tokens={[
              ["Chart 1", "--chart-1"],
              ["Chart 2", "--chart-2"],
              ["Chart 3", "--chart-3"],
              ["Chart 4", "--chart-4"],
              ["Chart 5", "--chart-5"],
            ]}
          />
        </div>
      </Section>

      <Section
        id="type"
        title="Type"
        blurb="Urbanist is the identity face and Inter carries everything functional. Two faces, no third, and one sixteen-step ladder under both halves of the site: ten heading steps, then six for the sentences under them."
      >
        <Sub
          id="ladder"
          title="The ladder"
          blurb="Sixteen steps, one set, and the law is the order: every heading stays above the one it heads and nothing goes under the floor, at a phone and at 1440. The desktop ends are the sizes Will ruled; each phone end is the rung that keeps the order, so marketing travels further than the app, the card step travels not at all, and of the six body steps only marketing's copy travels. Every line below is the real utility class at true size, and every number is read back off the live token, so this page cannot drift from theme.css. Resize the window and the last column moves."
        >
          <TypeLadder />
          <p className="mt-3 max-w-2xl text-sm text-muted-foreground">
            A dead link joins the set rather than sitting outside it: its title
            takes the prose step on marketing and the page step inside the app.
            Nothing in the heading face may wear a stock size (text-3xl) or an
            arbitrary one, and the policy refuses both; a heading the ladder
            cannot name is a heading whose role has not been decided yet. Under
            the hairline the same law holds for sentences: a body size resolves
            to 10, 12, 14 or 16 or it is off the ladder, an uppercase label
            carries no tracking of its own because the label step carries it,
            and marketing&rsquo;s 18 is reachable only through the copy step.
            The only type set off all of it is drawn inside a picture (a phone,
            a printed sign, an asset plate), sized in em to whatever it rides,
            or named in the policy&rsquo;s own allow-list with a reason and a
            count.
          </p>
        </Sub>
        <Sub
          id="faces"
          title="The two faces"
          blurb="The ladder is the heading face only. Everything functional stays in Inter at the body sizes, which is most of the product."
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <Specimen label="Identity" hint="font-heading · Urbanist 700">
              <div className="space-y-2">
                <p className="font-heading text-section">
                  Maya &amp; Jay&rsquo;s Wedding
                </p>
                <p className="font-heading text-subsection">Create an event</p>
                <p className="font-heading text-card-title font-semibold">
                  Your photos land here
                </p>
              </div>
            </Specimen>
            <Specimen label="Functional" hint="font-sans · Inter">
              <div className="space-y-2">
                <p className="text-sm font-semibold">Guest uploads</p>
                <p className="text-sm text-muted-foreground">
                  Body copy, labels, controls, and section headings stay in
                  Inter. Only identity moments opt into the heading face.
                </p>
                <p className="text-xs text-muted-foreground">
                  Smaller supporting text, captions, and metadata.
                </p>
              </div>
            </Specimen>
          </div>
        </Sub>
      </Section>

      <Section
        id="radius"
        title="Radius"
        blurb="Family C (Will's ruling, 2026-09-18): a surface, a photograph, a floating layer and an action, one token each, and a control is still twice as round as the surface under it, so the contrast still says what is pressable. The derived steps climb in quarters of --radius, and the top two are dropped. Every number below is read off the specimen it captions, so the tuner's knobs move it live."
      >
        <RadiusLadder />
      </Section>

      <Section
        id="motion"
        title="Motion"
        blurb="Strong custom curves only (the built-ins are too weak). UI stays under 300ms; exits run faster than enters. Hover a track to play its curve."
      >
        <div className="grid gap-3 sm:grid-cols-3">
          <EaseDemo
            name="Emphasis"
            hint="enter / exit"
            varName="--ease-emphasis"
            value="cubic-bezier(.23,1,.32,1)"
          />
          <EaseDemo
            name="In-out strong"
            hint="on-screen movement"
            varName="--ease-in-out-strong"
            value="cubic-bezier(.77,0,.175,1)"
          />
          <EaseDemo
            name="Drawer"
            hint="sheets (iOS curve)"
            varName="--ease-drawer"
            value="cubic-bezier(.32,.72,0,1)"
          />
        </div>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <Specimen label="Durations" hint="under 300ms">
            <ul className="space-y-1 text-sm text-muted-foreground">
              <li>Press feedback: 100 to 160ms</li>
              <li>Tooltips, popovers: 125 to 200ms</li>
              <li>Dropdowns, selects: 150 to 250ms</li>
              <li>Sheets, reveals: 200 to 280ms (exits faster)</li>
            </ul>
          </Specimen>
          <Specimen label="Shimmer" hint="--animate-shimmer · linear">
            <div className="space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-20 w-full" />
            </div>
          </Specimen>
        </div>
      </Section>

      <Section
        id="elevation"
        title="Elevation"
        aside={<Tag badge="updated" />}
        blurb="Four techniques, one per height, and one screen uses all of them at once: the lighter panel, the thin outline, a small shadow where one object really overlaps another, and a larger one under anything that floats. A surface lying flat takes neither shadow, in either mode. Split the block to read it in light and dark at once."
      >
        {/* The legend Will said finally made the system legible (2026-09-17),
            on the light board's own scene. A sibling client component in the
            type-ladder pattern: the scene measures its room and prints the two
            live tokens, so nothing here can drift from globals.css. */}
        <Specimen label="The four heights" hint="step · ring · lift · layer">
          <ElevationLegend />
        </Specimen>
        {/* The step on its own: the three surfaces a panel can be, nested, so
            the ladder is readable without the scene around it. */}
        <div className="mt-3">
          <Specimen label="Surface steps" hint="bg / card / popover">
            <div className="space-y-2">
              <div className="rounded-lg bg-background p-2 text-center text-xs text-muted-foreground">
                background
                <div className="mt-2 rounded-lg bg-card p-2">
                  card
                  <div className="mt-2 rounded-lg bg-popover p-2">popover</div>
                </div>
              </div>
            </div>
          </Specimen>
        </div>
      </Section>

      <Section
        id="bright-edge"
        title="The bright edge"
        aside={<Tag badge="new" />}
        blurb="One pixel of light catching the bevel of a surface lit from above: brightest along the top, falling away down the sides, nothing at the foot. Three kinds of surface take it (a photograph or a video, a framed screen, the QR card) and nothing else does. It is material, not elevation and not a lamp, and it exists on dark grounds only. Each surface is at true size beside its own top left corner at four times the size. If it ever reads as a frame, it is too strong."
      >
        {/* The light board's face step, kept and polished (Will, 2026-09-17).
            The rule is [data-lit] in globals.css; bright-edge.tsx says why
            this sheet forces its own two grounds instead of using the split. */}
        <BrightEdge />
      </Section>

      <Section
        id="light"
        title="Light"
        blurb="SPILL is light from a lit thing; BEAM is the live subject lit at its edge. Five lamps, our palette; the engine (Glow) reads them from these tokens, and the turbulence filter it warps through mounts once, in the root layout."
      >
        <SwatchGroup
          id="lamps"
          caption="The lamp set"
          blurb="--lamp-1..5; the literals JavaScript needs live in components/dev/lamp-set.ts."
          tokens={[
            ["Lamp 1", "--lamp-1"],
            ["Lamp 2", "--lamp-2"],
            ["Lamp 3", "--lamp-3"],
            ["Lamp 4", "--lamp-4"],
            ["Lamp 5", "--lamp-5"],
          ]}
        />
        {glow && (
          <div className="pt-6">
            <EntryBlock item={glow} link={(href) => withDesignKey(href, key)} />
          </div>
        )}
      </Section>

      <Pager />
    </Column>
  );
}

function SwatchGroup({
  id,
  caption,
  blurb,
  tokens,
}: {
  id: string;
  caption: string;
  blurb?: string;
  tokens: [string, string][];
}) {
  return (
    <Sub id={id} title={caption} blurb={blurb}>
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-6">
        {tokens.map(([name, varName]) => (
          <Swatch key={varName} name={name} varName={varName} />
        ))}
      </div>
    </Sub>
  );
}

function EaseDemo({
  name,
  hint,
  varName,
  value,
}: {
  name: string;
  hint: string;
  varName: string;
  value: string;
}) {
  return (
    <div className="group rounded-xl border border-border bg-card p-4">
      <p className="text-[13px] font-medium">{name}</p>
      <p className="text-[11px] text-muted-foreground">{hint}</p>
      <div className="relative mt-4 h-1 rounded-full bg-muted">
        {/* 700ms is a deliberately SLOWED curve demo for legibility, NOT a UI
            duration (real UI stays under 300ms). Do not "fix" it down or copy. */}
        <span
          className="absolute top-1/2 left-0 size-3 -translate-y-1/2 rounded-full bg-foreground transition-transform duration-700 group-hover:translate-x-[calc(100%-0.75rem)]"
          style={{ transitionTimingFunction: `var(${varName})` }}
        />
      </div>
      <p className="mt-3 truncate text-[10px] text-muted-foreground tabular-nums">
        {value}
      </p>
    </div>
  );
}
