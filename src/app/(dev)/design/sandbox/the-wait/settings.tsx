"use client";

import type { ReactNode } from "react";
import {
  Camera,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock,
  Images,
  X,
} from "lucide-react";

import { CaptureAndReveal } from "@/components/app/event-settings/camera-settings";
import {
  SettingsCard,
  StackSetting,
  SwitchSetting,
} from "@/components/app/event-settings/settings-furniture";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

import { DEVELOP, EVENT, PARTY_STILLS, ROLL } from "./fixtures";
import { HubBehind } from "./host";
import type { ModelId } from "./model";

/**
 * MAYA'S SETTINGS, AS EACH MODEL ASKS IT: the page "What guests can add" as
 * production opens it (a page under Settings' back arrow, the whole screen in
 * a hand and a panel at a desk), its group in production's furniture.
 *
 *  - `questions` mounts production's own control, `CaptureAndReveal`, as built;
 *  - `styles` asks one named album, its two answers under Customize;
 *  - `time` asks only when everyone sees, on one track, the camera a row away;
 *  - `apart` keeps approval a switch of its own and the disposable a mode.
 *
 * Every frame holds the developing album's answer (the camera and 9 am), the
 * wedding's own, so the four differ in how they ask and nothing else.
 */

/** 9 am the morning after the party, in the frame's own zone, as the control would default it. */
const DEVELOPS_AT = (() => {
  const [y, m, d] = EVENT.date.split("-").map(Number);
  return new Date(y!, m! - 1, d! + 1, 9, 0, 0, 0).toISOString();
})();

/** The page production opens a group on: a bar with Settings' back arrow in a hand, a panel at a desk. */
export function SettingsPage({
  wide,
  title,
  children,
}: {
  wide: boolean;
  title: string;
  children: ReactNode;
}) {
  const body = (
    <>
      <div className="grid h-13 shrink-0 grid-cols-[minmax(auto,1fr)_auto_minmax(0,1fr)] items-center gap-2 border-b px-2">
        <span className="flex items-center gap-0.5 px-1.5 text-sm text-muted-foreground">
          <ChevronLeft className="size-5" aria-hidden /> Settings
        </span>
        <p
          className="truncate text-center font-heading text-base"
          data-tw-settings-title=""
        >
          {title}
        </p>
        {wide ? (
          <X
            className="size-4 justify-self-end text-muted-foreground"
            aria-hidden
          />
        ) : (
          <span aria-hidden />
        )}
      </div>
      <div
        className="space-y-6 overflow-hidden px-4 pt-4 pb-6"
        data-tw-settings=""
      >
        {children}
      </div>
    </>
  );
  if (!wide)
    return (
      <div className="min-h-screen bg-background text-foreground">{body}</div>
    );
  return (
    <div className="relative min-h-screen text-foreground">
      <div aria-hidden inert className="pointer-events-none">
        <HubBehind />
      </div>
      <div className="fixed inset-0 z-50 bg-black/40" aria-hidden />
      <div className="fixed inset-y-0 right-0 z-50 w-[440px] overflow-hidden border-l bg-background shadow-layer">
        {body}
      </div>
    </div>
  );
}

/** The rest of the group, as production lays it under the control. */
export function TheRest() {
  return (
    <>
      <SwitchSetting
        label="Accepting uploads"
        line="Turn off to freeze the album. Guests can still view it."
        checked
        onCheckedChange={() => {}}
      />
      <SwitchSetting
        label="Videos"
        line="Guests can add videos up to 10 GB each."
        checked
        onCheckedChange={() => {}}
      />
    </>
  );
}

/* ── two questions, as built ───────────────────────────────────────────── */

function AsBuilt({ wide }: { wide: boolean }) {
  return (
    <SettingsPage wide={wide} title="What guests can add">
      <SettingsCard label="What guests can add">
        <CaptureAndReveal
          value={{ capture: "camera", review: false, developsAt: DEVELOPS_AT }}
          rollSize={ROLL}
          eventDate={EVENT.date}
          heldCount={0}
          savingCapture={false}
          savingReveal={false}
          onSave={() => {}}
        />
        <TheRest />
      </SettingsCard>
    </SettingsPage>
  );
}

/* ── album styles ──────────────────────────────────────────────────────── */

type StyleId = "live" | "approval" | "disposable";

const STYLES: { id: StyleId; name: string; line: string }[] = [
  {
    id: "live",
    name: "Live",
    line: "Every photo shows the moment it's added.",
  },
  {
    id: "approval",
    name: "Reviewed",
    line: "You let each photo in before anyone sees it.",
  },
  {
    id: "disposable",
    name: "Disposable",
    line: `A roll of ${ROLL} each, everyone's at once at ${DEVELOP.at}.`,
  },
];

/** A style's picture: a small album in its own light, drawn from the party's photographs. */
function StylePic({ id }: { id: StyleId }) {
  const stills = PARTY_STILLS.slice(0, 6);
  return (
    <span className="tw-style-pic grid h-[72px] w-[88px] shrink-0 grid-cols-3 gap-[2px] p-[3px]">
      {stills.map((s, i) => {
        const lit =
          id === "live" ? true : id === "approval" ? i % 3 !== 2 : i === 1;
        return (
          <span
            key={s.id}
            className="relative overflow-hidden rounded-[2px] bg-white/10"
          >
            {lit && (
              // eslint-disable-next-line @next/next/no-img-element -- a party still, the style's picture
              <img
                src={s.src}
                alt=""
                className={cn(
                  "absolute inset-0 size-full object-cover",
                  id === "approval" && i % 3 === 1 && "opacity-40",
                )}
              />
            )}
            {id === "approval" && i % 3 === 2 && (
              <Clock
                className="absolute inset-0 m-auto size-3 text-white/60"
                aria-hidden
              />
            )}
          </span>
        );
      })}
    </span>
  );
}

function Styles({ wide }: { wide: boolean }) {
  const on: StyleId = "disposable";
  return (
    <SettingsPage wide={wide} title="Album style">
      <div
        className="space-y-2"
        role="radiogroup"
        aria-label="Album style"
        data-tw-styles=""
      >
        {STYLES.map((s) => (
          <div
            key={s.id}
            data-state={s.id === on ? "on" : "off"}
            className={cn(
              "flex items-center gap-3 rounded-xl border p-2.5",
              s.id === on
                ? "border-foreground/40 bg-muted/40 ring-1 ring-foreground/20"
                : "border-border",
            )}
          >
            <StylePic id={s.id} />
            <span className="min-w-0 flex-1">
              <span className="block font-heading text-base">{s.name}</span>
              <span className="block text-caption text-pretty text-muted-foreground">
                {s.line}
              </span>
            </span>
            {s.id === on && <Check className="size-4 shrink-0" aria-hidden />}
          </div>
        ))}
      </div>
      <SettingsCard>
        <StackSetting
          label="Develop time"
          line="Everyone's photos appear at once."
        >
          <DevelopRow />
        </StackSetting>
        <TheRest />
      </SettingsCard>
      <p className="flex items-center justify-between px-1 text-sm text-muted-foreground">
        Customize how guests add and when everyone sees
        <ChevronRight className="size-4" aria-hidden />
      </p>
    </SettingsPage>
  );
}

/** The develop time and Develop now, in production's field. */
export function DevelopRow() {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Input
        type="text"
        readOnly
        value={`Sun, Oct 11, ${DEVELOP.at}`}
        className="max-w-48"
        tabIndex={-1}
      />
      <Button type="button" size="sm" variant="outline" tabIndex={-1}>
        Develop now
      </Button>
    </div>
  );
}

/* ── one question of time ──────────────────────────────────────────────── */

const STOPS = [
  { id: "live", name: "Right away", line: "As it's added" },
  { id: "approve", name: "As you approve", line: "One at a time" },
  { id: "develop", name: `At ${DEVELOP.at}`, line: "All at once" },
] as const;

/**
 * THE TRACK: the one question as a line from now to later, three stops on it,
 * and under it a picture of what the stop does to the night (everyone's dark
 * until the develop, hers lit).
 */
function Time({ wide }: { wide: boolean }) {
  return (
    <SettingsPage wide={wide} title="What guests can add">
      <SettingsCard>
        <StackSetting
          label="When does everyone see what's added?"
          line="Until then each guest sees only her own, developing."
        >
          <div className="tw-track" role="radiogroup" data-tw-track="">
            {STOPS.map((s) => (
              <span
                key={s.id}
                className="tw-track-stop"
                data-on={s.id === "develop" ? "" : undefined}
              >
                <span className="text-sm font-medium">{s.name}</span>
                <span className="text-caption text-muted-foreground">
                  {s.line}
                </span>
              </span>
            ))}
          </div>
          <NightPicture />
          <DevelopRow />
        </StackSetting>
        <div className="flex items-center gap-3 px-4 py-3" data-tw-adds-row="">
          <Camera className="size-4 text-muted-foreground" aria-hidden />
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-medium">How guests add</span>
            <span className="block text-caption text-muted-foreground">
              {`The album's camera, ${ROLL} shots each`}
            </span>
          </span>
          <ChevronRight className="size-4 text-muted-foreground" aria-hidden />
        </div>
        <TheRest />
      </SettingsCard>
    </SettingsPage>
  );
}

/** What the develop does to the night, as a strip: everyone's dark until 9 am, then all at once. */
function NightPicture() {
  const cells = 18;
  return (
    <div
      className="tw-well flex items-center gap-2 px-3 py-2.5"
      data-tw-night-pic=""
    >
      <div className="grid flex-1 grid-cols-9 gap-[3px]">
        {Array.from({ length: cells }, (_, i) => {
          const hers = i === 4 || i === 11;
          return (
            <span key={i} className="tw-cell" data-mine={hers ? "" : undefined}>
              {hers && (
                // eslint-disable-next-line @next/next/no-img-element -- a guest's own photograph, lit
                <img src={PARTY_STILLS[i]!.src} alt="" />
              )}
            </span>
          );
        })}
      </div>
      <span className="tw-muted shrink-0 text-xs">{`→ ${DEVELOP.at}`}</span>
    </div>
  );
}

/* ── approval apart ────────────────────────────────────────────────────── */

function Apart({ wide }: { wide: boolean }) {
  return (
    <SettingsPage wide={wide} title="What guests can add">
      <SettingsCard>
        <SwitchSetting
          label="Disposable camera"
          line={`A roll of ${ROLL} each, hidden until it develops.`}
          checked
          onCheckedChange={() => {}}
          after={
            <div className="pl-0.5">
              <DevelopRow />
            </div>
          }
        />
        <SwitchSetting
          label="Approve each photo"
          line="A check before anything shows. Guests still see their own in the album."
          checked={false}
          onCheckedChange={() => {}}
        />
        <TheRest />
      </SettingsCard>
      <p className="flex items-center gap-2 px-1 text-caption text-muted-foreground">
        <Images className="size-3.5" aria-hidden />
        Approval is a check, never a wait: approved photos show at once.
      </p>
    </SettingsPage>
  );
}

/** Maya's Settings as a model asks it. */
export function ModelSettings({
  model,
  wide,
}: {
  model: ModelId;
  wide: boolean;
}) {
  if (model === "styles") return <Styles wide={wide} />;
  if (model === "time") return <Time wide={wide} />;
  if (model === "apart") return <Apart wide={wide} />;
  return <AsBuilt wide={wide} />;
}
