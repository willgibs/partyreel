import { Skeleton } from "@/components/ui/skeleton";

import { requireDesignKey, withDesignKey } from "@/lib/design-gate/server";
import { EntryBlock } from "../gallery/gallery-ui";
import { itemById } from "../gallery/registry";
import { RefHeader, RefSection, Spec, Swatch } from "../reference/reference-ui";

// THE LIVE FOUNDATIONS REFERENCE. Every swatch fills with the REAL CSS var and
// every specimen uses the REAL utilities, so this page tracks globals.css by
// construction: edit a token, this updates. Inherits the root next-themes theme
// (toggle in the sidebar) to show light + dark truthfully.
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
    <main className="mx-auto w-full max-w-4xl px-6 pt-8 pb-20">
      <RefHeader
        eyebrow="Reference · live"
        title="Foundations"
        blurb="The design tokens, rendered from the real CSS variables. Toggle the theme in the sidebar to see light and dark; everything here flips with the app because it IS the app."
      />

      <RefSection
        title="Color"
        blurb="Grayscale surfaces and ink; color is reserved for state and for the media itself. Each swatch is the live var."
      >
        <div className="space-y-5">
          <SwatchGroup
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
            caption="Ink"
            tokens={[
              ["Foreground", "--foreground"],
              ["Muted foreground", "--muted-foreground"],
              ["Primary", "--primary"],
              ["Border", "--border"],
              ["Input", "--input"],
              ["Ring", "--ring"],
            ]}
          />
          <SwatchGroup
            caption="State (punctuation only, never a wash)"
            tokens={[
              ["Destructive", "--destructive"],
              ["Success", "--success"],
              ["Warning", "--warning"],
              ["Like", "--like"],
            ]}
          />
          <SwatchGroup
            caption="Gallery (always dark, theme-independent, so media is the hero)"
            tokens={[
              ["Gallery", "--gallery"],
              ["Gallery foreground", "--gallery-foreground"],
              ["Gallery muted", "--gallery-muted"],
              ["Gallery border", "--gallery-border"],
            ]}
          />
          <SwatchGroup
            caption="Charts (grayscale ramp)"
            tokens={[
              ["Chart 1", "--chart-1"],
              ["Chart 2", "--chart-2"],
              ["Chart 3", "--chart-3"],
              ["Chart 4", "--chart-4"],
              ["Chart 5", "--chart-5"],
            ]}
          />
        </div>
      </RefSection>

      <RefSection
        title="Type"
        blurb="Urbanist is the identity face (page titles, event names, marquees): bold at minus three percent tracking, via the font-heading utility. Inter carries everything functional. That split is the system rule."
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <Spec label="Identity" hint="font-heading · Urbanist 700">
            <div className="space-y-2">
              <p className="font-heading text-3xl">
                Maya &amp; Jay&rsquo;s Wedding
              </p>
              <p className="font-heading text-xl">Create an event</p>
              <p className="font-heading text-base">Your photos land here</p>
            </div>
          </Spec>
          <Spec label="Functional" hint="font-sans · Inter">
            <div className="space-y-2">
              <p className="text-sm font-semibold">Guest uploads</p>
              <p className="text-sm text-muted-foreground">
                Body copy, labels, controls, and section headings stay in Inter.
                Only identity moments opt into the heading face.
              </p>
              <p className="text-xs text-muted-foreground">
                Smaller supporting text, captions, and metadata.
              </p>
            </div>
          </Spec>
        </div>
      </RefSection>

      <RefSection
        title="Radius"
        blurb="Sharp surfaces, round actions: the radius contrast itself signals what is pressable. One root knob (--radius) scales the surface family."
      >
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <RadiusBox
            name="Surface"
            hint="--radius · 2px"
            className="rounded-lg"
          />
          <RadiusBox
            name="Tile"
            hint="--radius-tile · 3px"
            className="rounded-[var(--radius-tile)]"
          />
          <RadiusBox
            name="Float"
            hint="--radius-float · 8px"
            className="rounded-[var(--radius-float)]"
          />
          <RadiusBox
            name="Action"
            hint="--radius-action · 16px"
            className="rounded-[var(--radius-action)]"
          />
        </div>
      </RefSection>

      <RefSection
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
          <Spec label="Durations" hint="under 300ms">
            <ul className="space-y-1 text-sm text-muted-foreground">
              <li>Press feedback: 100 to 160ms</li>
              <li>Tooltips, popovers: 125 to 200ms</li>
              <li>Dropdowns, selects: 150 to 250ms</li>
              <li>Sheets, reveals: 200 to 280ms (exits faster)</li>
            </ul>
          </Spec>
          <Spec label="Shimmer" hint="--animate-shimmer · linear">
            <div className="space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-20 w-full" />
            </div>
          </Spec>
        </div>
      </RefSection>

      <RefSection
        title="Elevation"
        blurb="One depth technique per mode: in light, a single soft shadow on the floating layer; in dark, no shadows, lighter surface steps do the lifting."
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <Spec label="Floating layer" hint="shadow-float">
            <div className="flex h-24 items-center justify-center rounded-[var(--radius-float)] bg-popover shadow-float">
              <span className="text-sm text-muted-foreground">
                Menu / tooltip / toast
              </span>
            </div>
          </Spec>
          <Spec label="Surface steps" hint="bg / card / popover">
            <div className="space-y-2">
              <div className="rounded-lg bg-background p-2 text-center text-xs text-muted-foreground">
                background
                <div className="mt-2 rounded-lg bg-card p-2">
                  card
                  <div className="mt-2 rounded-lg bg-popover p-2">popover</div>
                </div>
              </div>
            </div>
          </Spec>
        </div>
      </RefSection>

      <RefSection
        title="Light"
        blurb="SPILL is light from a lit thing; BEAM is the live subject lit at its edge. Five lamps, our palette; the engine (Glow) reads them from these tokens, and the turbulence filter it warps through mounts once, in the root layout."
      >
        <div className="space-y-5">
          <SwatchGroup
            caption="The lamp set (--lamp-1..5; the literals JavaScript needs live in components/dev/lamp-set.ts)"
            tokens={[
              ["Lamp 1", "--lamp-1"],
              ["Lamp 2", "--lamp-2"],
              ["Lamp 3", "--lamp-3"],
              ["Lamp 4", "--lamp-4"],
              ["Lamp 5", "--lamp-5"],
            ]}
          />
          {glow && (
            <EntryBlock
              item={glow}
              link={(href) => withDesignKey(href, key)}
            />
          )}
        </div>
      </RefSection>
    </main>
  );
}

function SwatchGroup({
  caption,
  tokens,
}: {
  caption: string;
  tokens: [string, string][];
}) {
  return (
    <div>
      <p className="mb-2 text-[11px] font-medium text-muted-foreground">
        {caption}
      </p>
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-6">
        {tokens.map(([name, varName]) => (
          <Swatch key={varName} name={name} varName={varName} />
        ))}
      </div>
    </div>
  );
}

function RadiusBox({
  name,
  hint,
  className,
}: {
  name: string;
  hint: string;
  className: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div
        className={`mx-auto size-16 border-2 border-foreground ${className}`}
      />
      <p className="mt-3 text-center text-[13px] font-medium">{name}</p>
      <p className="text-center font-mono text-[10px] text-muted-foreground">
        {hint}
      </p>
    </div>
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
      <p className="mt-3 truncate font-mono text-[10px] text-muted-foreground">
        {value}
      </p>
    </div>
  );
}
