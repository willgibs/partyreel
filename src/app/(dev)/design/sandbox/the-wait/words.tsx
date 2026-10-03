"use client";

import { Check, ChevronLeft } from "lucide-react";

import {
  SettingsCard,
  SettingsNote,
  StackSetting,
  SwitchSetting,
} from "@/components/app/event-settings/settings-furniture";
import { Button } from "@/components/ui/button";
import { formatCount } from "@/lib/format/count";
import { cn } from "@/lib/utils";

import { AlbumHead, GuestPage, type RowItem, Rows } from "./album";
import {
  albumStills,
  DEV,
  DEVELOP,
  MORNING,
  PARTY_STILLS,
  ROLL,
} from "./fixtures";
import { WaitPage } from "./guest";
import { HostFrame } from "./host";
import type { ModelId } from "./model";
import { DevelopRow, SettingsPage, TheRest } from "./settings";
import { FACTS, Wait, type WaitId } from "./wait";

/**
 * THE WORDS: the preset's name where a host picks it and a guest meets it, and
 * whether approval may stand with a develop time (and what a guest's photo
 * says while it waits twice). Every frame is the page it is said on.
 */

export type NameId = "disposable" | "film" | "darkroom";
export type BothId = "never" | "under" | "own";

/** Each name, as each of its places says it. */
const NAME: Record<
  NameId,
  { card: string; line: string; cover: string; wait: string; morning: string }
> = {
  disposable: {
    card: "Disposable",
    line: `A roll of ${ROLL} each, everyone's at ${DEVELOP.at}.`,
    cover: `Disposable · develops ${DEVELOP.at}`,
    wait: "Developing",
    morning: `Your disposable developed · ${MORNING.shots} photos`,
  },
  film: {
    card: "Film",
    line: `Shoot on film: ${ROLL} each, developed at ${DEVELOP.at}.`,
    cover: `Film · develops ${DEVELOP.at}`,
    wait: "Developing",
    morning: `The film's developed · ${MORNING.shots} photos`,
  },
  darkroom: {
    card: "Darkroom",
    line: `Everyone's photos stay in the darkroom until ${DEVELOP.at}.`,
    cover: `In the darkroom until ${DEVELOP.at}`,
    wait: "In the darkroom",
    morning: `Out of the darkroom · ${MORNING.shots} photos`,
  },
};

/* ── the preset's name ─────────────────────────────────────────────────── */

/**
 * EACH NAME'S PICTURE, the one place a name draws rather than says: the
 * camera's reel of rounded frames for Disposable (the camera as built), a strip
 * with its sprockets for Film (what the word promises), the dark frames under
 * the safelight's red for Darkroom (the wait it names). One of hers lit in each.
 */
function NamePic({ name, className }: { name: NameId; className?: string }) {
  const frames = PARTY_STILLS.slice(3, 9);
  return (
    <span
      className={cn(
        "tw-well flex items-center justify-center gap-1.5 px-3",
        className,
      )}
      data-light={name === "darkroom" ? "safe" : undefined}
      data-tw-name-pic={name}
    >
      {frames.map((f, i) => {
        const lit = i === 2;
        return (
          <span
            key={f.id}
            className={cn(
              "relative aspect-square w-9 shrink-0 overflow-hidden",
              name === "disposable" && "rounded-[9px]",
              name === "film" && "rounded-[2px]",
              name === "darkroom" && "rounded-[3px]",
              lit
                ? "shadow-[0_0_0_1.5px_#fff]"
                : "bg-white/[0.07] shadow-[inset_0_0_0_1px_rgb(255_255_255/0.08)]",
            )}
          >
            {lit && (
              // eslint-disable-next-line @next/next/no-img-element -- a guest's shot, lit
              <img
                src={f.src}
                alt=""
                className="absolute inset-0 size-full object-cover"
              />
            )}
          </span>
        );
      })}
      {name === "film" && (
        <>
          <span
            aria-hidden
            className="absolute inset-x-2 top-1.5 h-1.5 bg-[repeating-linear-gradient(90deg,rgb(255_255_255/0.22)_0_5px,transparent_5px_11px)]"
          />
          <span
            aria-hidden
            className="absolute inset-x-2 bottom-1.5 h-1.5 bg-[repeating-linear-gradient(90deg,rgb(255_255_255/0.22)_0_5px,transparent_5px_11px)]"
          />
        </>
      )}
    </span>
  );
}

/** A live album's picture: the party's photographs, every one lit. */
function AlbumPic({ className }: { className?: string }) {
  return (
    <span
      className={cn("tw-well grid grid-cols-4 gap-[3px] p-[3px]", className)}
    >
      {PARTY_STILLS.slice(0, 8).map((f) => (
        <span key={f.id} className="relative overflow-hidden rounded-[3px]">
          {/* eslint-disable-next-line @next/next/no-img-element -- a party still, the card's picture */}
          <img
            src={f.src}
            alt=""
            className="absolute inset-0 size-full object-cover"
          />
        </span>
      ))}
    </span>
  );
}

/** Create's step, quoted: the question up top, the cards in the middle, Continue at the foot. */
function CreateStep({
  name,
  model,
  wide,
}: {
  name: NameId;
  model: ModelId;
  wide: boolean;
}) {
  const n = NAME[name];
  const cards: { id: string; title: string; line: string }[] =
    model === "styles"
      ? [
          {
            id: "live",
            title: "Live",
            line: "Every photo shows the moment it's added.",
          },
          {
            id: "approval",
            title: "Reviewed",
            line: "You let each photo in first.",
          },
          { id: "preset", title: n.card, line: n.line },
        ]
      : [
          {
            id: "live",
            title: "An album",
            line: "Guests add as many as they like, live.",
          },
          { id: "preset", title: n.card, line: n.line },
        ];
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <div className="flex h-14 items-center gap-1 px-3 text-sm text-muted-foreground">
        <ChevronLeft className="size-5" aria-hidden /> Back
        <span className="ml-auto flex gap-1">
          {[0, 1, 2, 3].map((i) => (
            <span
              key={i}
              className={cn(
                "h-1 w-6 rounded-full",
                i <= 1 ? "bg-foreground" : "bg-muted",
              )}
            />
          ))}
        </span>
      </div>
      <div
        className={cn(
          "flex flex-1 flex-col px-5 pb-8",
          wide && "mx-auto w-full max-w-2xl",
        )}
      >
        <p className="mt-4 font-heading text-section text-balance">
          How will guests add photos?
        </p>
        <div
          className={cn(
            "my-auto gap-3 py-8",
            wide ? "grid grid-cols-2" : "flex flex-col",
          )}
        >
          {cards.map((c) => {
            const on = c.id === "preset";
            return (
              <div
                key={c.id}
                className={cn(
                  "overflow-hidden rounded-2xl border",
                  on
                    ? "border-foreground/50 ring-1 ring-foreground/25"
                    : "border-border",
                  wide &&
                    cards.length === 3 &&
                    c.id === "preset" &&
                    "col-span-2",
                )}
              >
                {on ? (
                  <NamePic name={name} className="tw-flush h-24" />
                ) : (
                  <AlbumPic className="tw-flush h-24" />
                )}
                <div className="flex items-center gap-3 px-3.5 py-3">
                  <span className="min-w-0 flex-1">
                    <span
                      className="block font-heading text-base"
                      data-tw-word={on ? "" : undefined}
                    >
                      {c.title}
                    </span>
                    <span className="block text-caption text-pretty text-muted-foreground">
                      {c.line}
                    </span>
                  </span>
                  <span
                    className={cn(
                      "flex size-5 shrink-0 items-center justify-center rounded-full border",
                      on
                        ? "border-foreground bg-foreground text-background"
                        : "border-muted-foreground/50",
                    )}
                  >
                    {on && <Check className="size-3" aria-hidden />}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
        <Button type="button" size="cta" className="w-full" tabIndex={-1}>
          Continue
        </Button>
      </div>
    </div>
  );
}

export function NameFrame({
  name,
  model,
  beat,
  wide,
}: {
  name: NameId;
  model: ModelId;
  beat: "create" | "cover" | "morning";
  wide: boolean;
}) {
  const n = NAME[name];
  if (beat === "create")
    return <CreateStep name={name} model={model} wide={wide} />;
  if (beat === "cover")
    return (
      <GuestPage
        wide={wide}
        mediaCount={0}
        // ★ THE ALBUM'S CAMERA, WITH HERS WAITING: the wait below is Priya's own six (`FACTS.developing`), so her uploads'
        // round stands beside the camera's Add as it does on every developing frame (the carried call `round`).
        waitingHers={FACTS.developing.hers.length}
        sealed
        camera
        eyebrow={<span data-tw-word="">{n.cover}</span>}
      >
        <Wait
          id="sheet"
          facts={FACTS.developing}
          words={{
            title: n.wait,
            clock: `Develops at ${DEVELOP.at}`,
            mine: n.wait,
          }}
          wide={wide}
          light={name === "darkroom" ? "safe" : undefined}
        />
      </GuestPage>
    );
  const items: RowItem[] = albumStills(wide ? 18 : 8, 2).map((s, i) => ({
    kind: "photo",
    still: s,
    key: `${s.id}-${i}`,
    arrived: i < 4,
  }));
  return (
    <GuestPage
      wide={wide}
      ground={{ kind: "stills", stills: albumStills(6, 3) }}
      mediaCount={MORNING.shots}
      camera
      reel="premiere"
      eyebrow={<span>{n.card}</span>}
    >
      <p className="mb-3 px-0.5 text-sm font-medium" data-tw-word="">
        {n.morning}
      </p>
      <AlbumHead count={MORNING.shots} />
      <Rows items={items} perRow={wide ? 6 : 2} />
    </GuestPage>
  );
}

/* ── approval and a develop ────────────────────────────────────────────── */

function BothSettings({ both, wide }: { both: BothId; wide: boolean }) {
  return (
    <SettingsPage wide={wide} title="What guests can add">
      <SettingsCard>
        {both === "own" && (
          <SwitchSetting
            label="Approve each photo"
            line="You see each one first, whatever the timing."
            checked
            onCheckedChange={() => {}}
          />
        )}
        <StackSetting
          label="When everyone sees what's added"
          line={`At a develop time: ${DEVELOP.at} the morning after.`}
        >
          <DevelopRow />
          {both === "under" && (
            <label className="flex items-center justify-between gap-3 rounded-lg border px-3 py-2">
              <span className="text-sm" data-tw-word="">
                Approve each first
              </span>
              <span className="flex h-5 w-9 items-center rounded-full bg-foreground p-0.5">
                <span className="ml-auto size-4 rounded-full bg-background" />
              </span>
            </label>
          )}
        </StackSetting>
        <TheRest />
      </SettingsCard>
      {both === "never" && (
        <SettingsNote>
          <span data-tw-word="">
            {`Before ${DEVELOP.at}, lift your cover on the hub to take anything out.`}
          </span>
        </SettingsNote>
      )}
      {both !== "never" && (
        <SettingsNote>
          <span data-tw-word="">
            {"Guests' photos wait for you first, then for the develop."}
          </span>
        </SettingsNote>
      )}
    </SettingsPage>
  );
}

/** Priya's album where her photo waits twice: for Maya, then for 9 am. It is the album's camera (`FACTS.developing`). */
function TwiceWait({ wait, wide }: { wait: WaitId; wide: boolean }) {
  return (
    <GuestPage
      wide={wide}
      mediaCount={0}
      waitingHers={FACTS.developing.hers.length}
      camera
    >
      <Wait
        id={wait}
        facts={FACTS.developing}
        words={{
          title: "Waiting for Maya, then developing",
          clock: `Maya checks each, then all at ${DEVELOP.at}`,
          mine: "Waiting for Maya",
        }}
        wide={wide}
        landing
      />
      <p className="mt-3 px-0.5 text-sm text-muted-foreground" data-tw-word="">
        {`${formatCount(23)} of the ${formatCount(DEV.waiting)} still wait for Maya's check.`}
      </p>
    </GuestPage>
  );
}

export function BothFrame({
  both,
  model,
  wait,
  beat,
  wide,
}: {
  both: BothId;
  model: ModelId;
  wait: WaitId;
  beat: "settings" | "guest" | "host";
  wide: boolean;
}) {
  if (beat === "settings") return <BothSettings both={both} wide={wide} />;
  if (beat === "guest")
    return both === "never" ? (
      <WaitPage
        model={model}
        wait={wait}
        album="developing"
        wide={wide}
        moment="landing"
      />
    ) : (
      <TwiceWait wait={wait} wide={wide} />
    );
  return (
    <HostFrame
      cover="guests"
      model={model}
      wait={wait}
      beat={both === "never" ? "lifted" : "held"}
      wide={wide}
    />
  );
}
