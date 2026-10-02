"use client";

import { type ReactNode } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronLeft,
  ChevronRight,
  QrCode,
  Sparkles,
  X,
} from "lucide-react";

import { AddsPage } from "@/components/app/event-settings/adds-page";
import { DoorPage } from "@/components/app/event-settings/door-page";
import { EventPage } from "@/components/app/event-settings/event-page";
import { ReelPage } from "@/components/app/event-settings/reel-page";
import {
  SAVES_NOTE,
  SettingsNote,
} from "@/components/app/event-settings/settings-furniture";
import { SettingsRows } from "@/components/app/event-settings/settings-rows";
import {
  SettingsProvider,
  type SettingsWrites,
  useSettings,
} from "@/components/app/event-settings/settings-state";
import { Button } from "@/components/ui/button";
import {
  settingsSentence,
  SETTINGS_GROUP_TITLES,
  type SettingsGroup,
} from "@/lib/events/guest-experience-summary";
import { cn } from "@/lib/utils";

import { headOf } from "./checklist";
import { countsAt, eventAt, type Moment } from "./fixtures";
import type { Readiness, ReadyItemId } from "./readiness";
import type { ScreenId } from "./scene";

/**
 * SETTINGS, AS A HOST OPENS IT: production's provider, rows and pages, fed
 * one moment of Maya's 30th and writing through inert fakes (the Library's own
 * arrangement: every press answers after a round trip and changes nothing), in
 * the settings kind's two shapes, a panel from the right at a desk and the
 * whole screen under a back arrow in a hand.
 *
 * The panel itself is quoted rather than opened: its head, body and widths are
 * the kind's own (`popup.tsx`, `floating-layer.ts`'s `panel` and `screen`),
 * kept by hand. A portalled `Frame` hands a Radix layer its own body now
 * (`portal-container.tsx`), so production's `Popup` could mount here, but it
 * picks its shape off the LAB's window (`useMediaQuery`), so on a laptop a 375
 * frame would still open the desk's panel. Mounting it is ROADMAP's line.
 *
 * ★ THE STEPS ARE THE CHECKLIST, IN SETTINGS' OWN WORDS: the four groups in
 * the order a guest meets them, each ticked by the same function that ticks
 * the checklist (`readiness.ts`: the door, uploads, the reel's first photos,
 * the welcome), and the code as a fifth. So a host who picks `guide=steps`
 * reads one answer whether she looks at the hub or at Settings.
 */

const settle = <T,>(value: T) =>
  new Promise<T>((resolve) => setTimeout(() => resolve(value), 350));

/** Settings' four writes, answering after a round trip and changing nothing. */
const WRITES: SettingsWrites = {
  updateEvent: async () => settle({ ok: true as const }),
  setDoor: async (_id, door) =>
    settle({
      ok: true as const,
      emailHeld: door === "approve" || door === "invite",
      admitted: 0,
    }),
  setReel: async (input) =>
    settle({
      ok: true as const,
      defaults: {
        showReel: input.showReel ?? true,
        styleId: input.styleId ?? null,
        holdSec: input.holdSec ?? null,
      },
    }),
  setProfile: async () => settle({ ok: true as const }),
};

/** Production's provider over one moment of the 30th. */
export function Provided({ m, children }: { m: Moment; children: ReactNode }) {
  return (
    <SettingsProvider
      event={eventAt(m)}
      tier="pro"
      counts={countsAt(m)}
      pendingCount={0}
      social={{ displayInProfile: false, hostHasSlug: true }}
      reelSample={null}
      writes={WRITES}
    >
      {children}
    </SettingsProvider>
  );
}

/* ── the panel, quoted ───────────────────────────────────────────────────── */

/**
 * The settings kind at the screen's width: a panel from the right over the
 * page at a desk (its scrim, its 28rem, its hairline), the whole screen in a
 * hand under the bar's back arrow. `up` is a page one level in.
 */
export function SettingsPanel({
  screen,
  title,
  up,
  children,
}: {
  screen: ScreenId;
  title: string;
  /** One level in: where the back arrow goes up to. */
  up?: string;
  children: ReactNode;
}) {
  if (screen === "375") {
    return (
      <div
        data-er-panel="screen"
        className="fixed inset-0 z-50 flex flex-col bg-background text-sm text-popover-foreground [--er-ground:var(--background)]"
      >
        <div className="shrink-0 border-b">
          <div className="grid h-13 grid-cols-[minmax(auto,1fr)_auto_minmax(0,1fr)] items-center gap-2 px-2">
            <Button
              variant="ghost"
              size="sm"
              tabIndex={-1}
              className="max-w-[40vw] gap-0.5 justify-self-start px-1.5 text-muted-foreground"
            >
              <ChevronLeft className="size-5" />
              <span className="truncate">{up ?? "Maya's 30th"}</span>
            </Button>
            <span
              data-er-panel-title
              className="max-w-[55vw] truncate text-center font-heading text-base text-foreground"
            >
              {title}
            </span>
            <span aria-hidden />
          </div>
          {/* ★ A LINE THAT REPEATS THE ARROW IS NOT DRAWN, ONLY HEARD (`popup.tsx`'s
              `echoesArrow`, crumbs-42). Settings gives the event's name as both
              its description and its back label, so in a hand the arrow already
              says it and the line stays for a screen reader. A page one level in
              has no description. */}
          {up ? null : <p className="sr-only">{"Maya's 30th"}</p>}
        </div>
        <div className="min-h-0 flex-1 space-y-6 overflow-y-auto overscroll-contain px-4 pt-4 pb-6 *:shrink-0">
          {children}
        </div>
      </div>
    );
  }
  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/10 backdrop-blur-xs" />
      <div
        data-er-panel="panel"
        className="fixed inset-y-0 right-0 z-50 flex w-3/4 max-w-md flex-col overflow-hidden border-l bg-popover text-sm text-popover-foreground shadow-layer [--er-ground:var(--popover)]"
      >
        <div className="relative flex shrink-0 flex-col gap-1 p-4 pr-12">
          {up ? (
            <Button
              variant="ghost"
              size="sm"
              tabIndex={-1}
              className="-mt-1 mb-1 -ml-2 gap-0.5 self-start px-1.5 text-muted-foreground"
            >
              <ChevronLeft className="size-4" />
              {up}
            </Button>
          ) : null}
          <span
            data-er-panel-title
            className="font-heading text-card-title text-pretty text-foreground"
          >
            {title}
          </span>
          {up ? null : (
            <span className="text-sm text-pretty text-muted-foreground">
              {"Maya's 30th"}
            </span>
          )}
          <Button
            variant="ghost"
            size="icon-sm"
            tabIndex={-1}
            className="absolute top-3 right-3"
          >
            <X />
            <span className="sr-only">Close</span>
          </Button>
        </div>
        <div className="min-h-0 flex-1 space-y-6 overflow-y-auto overscroll-contain px-4 pb-6 *:shrink-0">
          {children}
        </div>
      </div>
    </>
  );
}

/* ── today: the four rows ────────────────────────────────────────────────── */

/** Production's rows, as Settings opens. */
export function TodayRows() {
  return <SettingsRows onOpenPage={() => {}} />;
}

/* ── the steps: the rows, numbered down one rail and ticked ──────────────── */

const GROUP_ITEM: Record<SettingsGroup, ReadyItemId> = {
  door: "door",
  adds: "adds",
  reel: "photos",
  event: "welcome",
};

const GROUPS: readonly SettingsGroup[] = ["door", "adds", "reel", "event"];

/**
 * One step on the rail: the number (a tick once ready) joined to the next by
 * the door page's own line, the group's title, its sentence with the live
 * words drawn as the rows draw them, and its page behind the chevron.
 */
function RailStep({
  n,
  done,
  last,
  title,
  line,
  live,
  foot,
}: {
  n: number;
  done: boolean;
  last?: boolean;
  title: string;
  line: ReactNode;
  live?: boolean;
  foot?: ReactNode;
}) {
  return (
    <li
      data-er-step={n}
      data-done={done ? "" : undefined}
      className="relative flex gap-3 px-4 py-3"
    >
      <span className="relative flex w-5 shrink-0 justify-center self-stretch">
        {!last && (
          <span
            aria-hidden
            className={cn(
              "absolute top-7 -bottom-4 w-px",
              done ? "bg-success/50" : "bg-border",
            )}
          />
        )}
        {done ? (
          <span
            aria-hidden
            className="relative mt-0.5 flex size-5 items-center justify-center rounded-full bg-success text-success-foreground"
          >
            <Check className="size-3" strokeWidth={3} />
          </span>
        ) : (
          <span
            aria-hidden
            className="relative mt-0.5 flex size-5 items-center justify-center rounded-full bg-muted text-[11px] font-semibold text-muted-foreground tabular-nums"
          >
            {n}
          </span>
        )}
      </span>
      <span className="min-w-0 flex-1 space-y-0.5">
        <span className="block text-sm font-medium">
          <span className="sr-only">{`Step ${n}: `}</span>
          {title}
        </span>
        <span
          className={cn(
            "block text-caption leading-5 text-pretty text-muted-foreground",
            live && "[&_[data-er-word]]:font-medium",
          )}
        >
          {line}
        </span>
        {foot}
      </span>
      <ChevronRight
        aria-hidden
        className="mt-0.5 size-4 shrink-0 self-center text-muted-foreground"
      />
    </li>
  );
}

/** A sentence's parts, the live words underlined as the rows draw them (quoted, not pressable). */
function Sentence({ group }: { group: SettingsGroup }) {
  const s = useSettings();
  const parts = settingsSentence(group, s.facts);
  return (
    <>
      {parts.map((p, i) =>
        p.word ? (
          <span
            key={i}
            data-er-word=""
            className="font-medium text-foreground underline decoration-foreground/35 decoration-dotted decoration-2 underline-offset-4"
          >
            {p.text}
          </span>
        ) : (
          <span key={i}>{p.text}</span>
        ),
      )}
    </>
  );
}

/** What a step not ready still wants, in Settings' own terms. */
function wants(group: SettingsGroup, r: Readiness): string {
  const item = r.items.find((i) => i.id === GROUP_ITEM[group])!;
  if (group === "reel")
    return item.line.startsWith("An album")
      ? "It starts at two photos; none yet."
      : item.line;
  if (group === "event") {
    if (item.line.startsWith("The date under")) return "No date or note yet.";
    return item.line.startsWith("Write") ? "No note yet." : "No date yet.";
  }
  return item.line;
}

/** The rows as steps, and the code as a fifth: Settings read as the checklist. */
export function StepRail({ r }: { r: Readiness }) {
  const itemOf = (id: ReadyItemId) => r.items.find((i) => i.id === id)!;
  const code = itemOf("code");
  const head = headOf(r);
  return (
    <div className="space-y-1.5">
      <div data-er-rail-head className="space-y-0.5 px-1 pb-1">
        <span className="flex items-center gap-1.5 text-sm font-medium">
          {r.ready ? (
            <Check
              className="size-4 shrink-0 text-success"
              strokeWidth={3}
              aria-hidden
            />
          ) : null}
          {head.title}
        </span>
        <span className="block text-caption text-muted-foreground">
          {head.line}
        </span>
      </div>
      <ol className="divide-y divide-border overflow-hidden rounded-lg bg-card text-card-foreground ring-1 ring-foreground/10">
        {GROUPS.map((group, i) => {
          const item = itemOf(GROUP_ITEM[group]);
          return (
            <RailStep
              key={group}
              n={i + 1}
              done={item.done}
              title={SETTINGS_GROUP_TITLES[group]}
              line={
                item.done ? (
                  <Sentence group={group} />
                ) : (
                  // A step not ready says what it still wants, after where it stands.
                  <>
                    <Sentence group={group} />{" "}
                    <span className="text-foreground">{wants(group, r)}</span>
                  </>
                )
              }
              live
            />
          );
        })}
        <RailStep
          n={5}
          last
          done={code.done}
          title="The code"
          line={code.line}
          foot={
            code.done ? null : (
              <span className="flex gap-1.5 pt-2">
                <Button size="sm" tabIndex={-1}>
                  Print
                </Button>
                <Button size="sm" variant="outline" tabIndex={-1}>
                  <QrCode /> Share
                </Button>
              </span>
            )
          }
        />
      </ol>
      <SettingsNote>{SAVES_NOTE}</SettingsNote>
    </div>
  );
}

/** A page one level in, as the steps end it: the page's own card, then Next. */
export function StepPage({ group, n }: { group: SettingsGroup; n: number }) {
  const next = GROUPS[n] as SettingsGroup | undefined;
  return (
    <div className="space-y-4">
      <PageOf group={group} />
      <Button data-er-next size="cta" className="w-full" tabIndex={-1}>
        {next ? `Next: ${SETTINGS_GROUP_TITLES[next]}` : "Next: The code"}
        <ArrowRight />
      </Button>
    </div>
  );
}

/** Production's page for a group. */
export function PageOf({ group }: { group: SettingsGroup }) {
  if (group === "door") return <DoorPage guestsHref="#guests" />;
  if (group === "adds") return <AddsPage />;
  if (group === "reel") return <ReelPage />;
  return <EventPage />;
}

/* ── the pass: a walk of its own ─────────────────────────────────────────── */

/** The way into the pass, over the rows. */
export function PassEntry({ r }: { r: Readiness }) {
  return (
    <div
      data-er-pass-entry
      className="flex items-center gap-3 rounded-xl bg-card px-4 py-3 text-card-foreground ring-1 ring-foreground/10"
    >
      <span
        aria-hidden
        className="flex size-9 shrink-0 items-center justify-center rounded-full bg-brand/15 text-brand"
      >
        <Sparkles className="size-4" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-medium">
          Set it up, step by step
        </span>
        <span className="block text-caption text-muted-foreground">
          {r.ready
            ? "Five questions, in the order a guest meets them. Ready for guests already."
            : "Five questions, in the order a guest meets them."}
        </span>
      </span>
      <Button size="sm" tabIndex={-1} className="shrink-0">
        Set it up
      </Button>
    </div>
  );
}

const PASS_QUESTIONS: readonly string[] = [
  "Who can get in?",
  "What can guests add?",
  "The highlight reel",
  "The date and a note",
  "Get the code out",
];

/**
 * ONE SCREEN OF THE PASS: its progress, its question as the title, the real
 * page as its body, and Back and Next held at the foot. It stands in the same
 * panel as Settings, with nothing else on screen.
 */
export function PassStep({ step }: { step: number }) {
  const group = GROUPS[step - 1] as SettingsGroup;
  return (
    <div className="flex min-h-full flex-col gap-4">
      <div data-er-progress className="space-y-2">
        <span className="flex gap-1" aria-hidden>
          {PASS_QUESTIONS.map((q, i) => (
            <span
              key={q}
              className={cn(
                "h-1 flex-1 rounded-full",
                i < step ? "bg-foreground/70" : "bg-muted",
              )}
            />
          ))}
        </span>
        <span className="block text-xs text-muted-foreground tabular-nums">
          {`Step ${step} of ${PASS_QUESTIONS.length}`}
        </span>
      </div>
      <h3 className="font-heading text-subsection">
        {PASS_QUESTIONS[step - 1]}
      </h3>
      <PageOf group={group} />
      <div className="sticky bottom-0 mt-auto flex gap-2 bg-gradient-to-t from-[var(--er-ground)] via-[var(--er-ground)] to-transparent pt-4">
        <Button variant="outline" size="cta" className="flex-1" tabIndex={-1}>
          <ArrowLeft /> Back
        </Button>
        <Button data-er-next size="cta" className="flex-[2]" tabIndex={-1}>
          Next <ArrowRight />
        </Button>
      </div>
    </div>
  );
}
