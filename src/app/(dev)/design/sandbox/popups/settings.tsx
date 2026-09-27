"use client";

import type { ReactNode } from "react";
import { Lock, Trash2 } from "lucide-react";

import { PageHeading } from "@/components/shared/page-heading";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

import { EVENT } from "./fixtures";
import { HostBar, HostHub } from "./grounds";
import { type PhoneScene, Scenes } from "./scene";
import {
  BottomSheet,
  CentredDialog,
  FOCUSED,
  forSize,
  PageOnKeyboard,
  type Parts,
  PhoneScreen,
  SidePanel,
  type Size,
} from "./surfaces";

/**
 * SETTINGS: the event's own (`event-settings-sheet.tsx`), the longest popup in
 * the app. Its cards and words are production's; a phone is drawn at three
 * moments of one visit rather than three screens (there is one settings): the
 * top as it opens, the event's name focused with the keyboard up, and Guest
 * uploads, the card a host comes back for.
 *
 * ★ "SCROLLED TO GUEST UPLOADS" IS DRAWN BY STARTING AT THAT CARD, which is
 * what a scrolled surface shows (the head and the cards above it are off the
 * top), rather than scrolling a frame from the board's realm on every load.
 */

export type SettingsOption = "sheet" | "panel" | "page" | "dialog";
export type Moment = "top" | "name" | "uploads";

const OPTION_TITLE: Record<SettingsOption, string> = {
  sheet: "The one Sheet, as he picked it",
  panel: "A side panel, its own screen in a hand",
  page: "A settings page of its own",
  dialog: "A large dialog, its sections beside",
};

const MOMENT_TITLE: Record<Moment, string> = {
  top: "settings as it opens",
  name: "the event's name focused",
  uploads: "scrolled to Guest uploads",
};

/* ── the settings, production's cards ────────────────────────────────────── */

export function ProChip({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs text-muted-foreground">
      <Lock className="size-3" aria-hidden /> {label}
    </span>
  );
}

function Card({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <section className="space-y-4 rounded-xl border bg-card p-4">
      <div className="space-y-0.5">
        <h3 className="font-heading text-card-title font-medium">{title}</h3>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      {children}
    </section>
  );
}

function SwitchRow({
  label,
  description,
  on,
  chip,
}: {
  label: string;
  description?: string;
  on: boolean;
  chip?: ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="space-y-0.5">
        <p className="flex items-center gap-2 text-sm font-medium">
          {label} {chip}
        </p>
        {description && (
          <p className="text-xs text-pretty text-muted-foreground">
            {description}
          </p>
        )}
      </div>
      <Switch checked={on} tabIndex={-1} aria-label={label} />
    </div>
  );
}

function Details({ focused }: { focused: boolean }) {
  return (
    <Card
      title="Details"
      description="What guests see when they land on the join page."
    >
      <div className="space-y-2">
        <Label htmlFor="set-name">Event name</Label>
        <Input
          id="set-name"
          defaultValue={EVENT.name}
          readOnly
          tabIndex={-1}
          data-pop-field={focused ? "" : undefined}
          className={cn(focused && FOCUSED)}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="set-desc">
          Description{" "}
          <span className="font-normal text-muted-foreground">(optional)</span>
        </Label>
        <Textarea
          id="set-desc"
          rows={2}
          readOnly
          tabIndex={-1}
          defaultValue="Add every photo you take tonight, even the blurry ones."
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="set-date">
          Event date{" "}
          <span className="font-normal text-muted-foreground">(optional)</span>
        </Label>
        <Input
          id="set-date"
          defaultValue="14 June 2026"
          readOnly
          tabIndex={-1}
        />
        <p className="text-xs text-muted-foreground">
          For your reference only: events never expire.
        </p>
      </div>
    </Card>
  );
}

function Visibility({ lockAt }: { lockAt?: ReactNode }) {
  return (
    <Card
      title="Visibility & access"
      description="Control who can see the album."
    >
      <p className="text-sm font-medium">Who can see this album?</p>
      <div className="grid grid-cols-3 gap-1 rounded-lg bg-muted p-1 text-sm">
        <span className="rounded-md bg-background py-1.5 text-center font-medium shadow-layer">
          Public
        </span>
        <span className="relative flex items-center justify-center gap-1 py-1.5 text-muted-foreground">
          Password <Lock className="size-3" aria-hidden />
          {lockAt}
        </span>
        <span className="py-1.5 text-center text-muted-foreground">
          Private
        </span>
      </div>
      <p className="text-xs text-muted-foreground">
        Anyone with the link can view the album.
      </p>
    </Card>
  );
}

function Uploads() {
  return (
    <Card
      title="Guest uploads"
      description="Control whether and how guests contribute."
    >
      <SwitchRow
        label="Accepting uploads"
        description="Turn off to freeze the album. Guests can still view it."
        on
      />
      <SwitchRow
        label="Review uploads before they appear"
        description="Hold new photos for your approval instead of showing them live."
        on={false}
      />
      <SwitchRow
        label="Require verified emails"
        description="On (recommended): guests confirm their email once before they see the full album or add photos."
        on
      />
      <SwitchRow
        label="Require an upload to view"
        description="On: guests add one photo or video before they can see the full album, so nobody just looks."
        on={false}
      />
      <SwitchRow
        label="Video uploads"
        on={false}
        chip={<ProChip label="Video uploads Pro" />}
      />
    </Card>
  );
}

function Reel() {
  return (
    <Card
      title="Highlight reel"
      description="The album’s own reel, made from every photo guests can see."
    >
      <SwitchRow label="Show the reel" on />
    </Card>
  );
}

function Profile() {
  return (
    <Card
      title="Profile & guests"
      description="How this event shows up beyond its own link."
    >
      <SwitchRow label="Show on my profile" on={false} />
      <SwitchRow label="Show the guest list on the album" on />
    </Card>
  );
}

function Danger() {
  return (
    <Card
      title="Danger zone"
      description="Deleting an event removes it and frees up a slot on your plan."
    >
      <Button variant="destructive" size="sm" tabIndex={-1} className="w-fit">
        <Trash2 /> Delete event
      </Button>
    </Card>
  );
}

const SAVE = { label: "Save changes" } as const;

/** The six cards, from wherever the moment starts, with the form's one Save
 *  where `event-settings-form.tsx` puts it: after Guest uploads, right-aligned,
 *  live only once something changed (the name being typed). */
function Cards({ moment, lockAt }: { moment: Moment; lockAt?: ReactNode }) {
  return (
    <div className="flex flex-col gap-6 pb-6">
      {moment !== "uploads" && <Details focused={moment === "name"} />}
      {moment !== "uploads" && <Visibility lockAt={lockAt} />}
      <Uploads />
      <div className="flex justify-end">
        <Button tabIndex={-1} disabled={moment !== "name"}>
          Save changes
        </Button>
      </div>
      <Reel />
      <Profile />
      <Danger />
    </div>
  );
}

/** The settings as `Parts`: the one form every option lays out. `lockAt`
 *  is the Password lock chip's spot, which `plans` opens a plan from. */
export function settingsParts(moment: Moment, lockAt?: ReactNode): Parts {
  return {
    title: "Settings",
    description: EVENT.name,
    body: <Cards moment={moment} lockAt={lockAt} />,
    typing: moment === "name",
  };
}

/* ── the four shapes ─────────────────────────────────────────────────────── */

const SECTIONS = [
  "Details",
  "Visibility & access",
  "Guest uploads",
  "Highlight reel",
  "Profile & guests",
  "Danger zone",
] as const;

/** A settings page of its own: the host's chrome, the cards in a column. */
function SettingsPage({ size, moment }: { size: Size; moment: Moment }) {
  const parts = settingsParts(moment);
  return (
    <div
      data-pop-ground=""
      className="min-h-screen bg-background text-foreground"
    >
      <HostBar size={size} trail={[EVENT.name, "Settings"]} />
      <main
        data-pop-surface="page"
        className="mx-auto w-full max-w-2xl px-4 py-6"
      >
        {moment !== "uploads" && (
          <div className="mb-5">
            <PageHeading>Settings</PageHeading>
            <p className="mt-1 text-sm text-muted-foreground">{EVENT.name}</p>
          </div>
        )}
        {parts.body}
      </main>
    </div>
  );
}

/** A large dialog with its sections down the left (a desk), and in a hand the
 *  sections as a list, each its own screen: drawn at the one it opened to. */
function SectionsDialog({ moment }: { moment: Moment }) {
  const current = moment === "uploads" ? "Guest uploads" : "Details";
  const body = (
    <div className="grid grid-cols-[176px_1fr] gap-5">
      <nav className="flex flex-col gap-0.5 text-sm">
        {SECTIONS.map((s) => (
          <span
            key={s}
            className={cn(
              "rounded-[calc(var(--radius-float)_-_4px)] px-2.5 py-1.5",
              s === current
                ? "bg-muted font-medium text-foreground"
                : "text-muted-foreground",
            )}
          >
            {s}
          </span>
        ))}
      </nav>
      <div className="min-w-0">
        {current === "Details" ? <Details focused={false} /> : <Uploads />}
      </div>
    </div>
  );
  return (
    <CentredDialog
      parts={{
        title: "Settings",
        description: EVENT.name,
        body,
        act: SAVE,
        cancel: "Cancel",
      }}
      width="wide"
      scrollBody
    />
  );
}

function SectionsPhone({ moment }: { moment: Moment }) {
  if (moment === "top")
    return (
      <PhoneScreen
        bar="back"
        back={EVENT.name}
        parts={{
          title: "Settings",
          body: (
            <div
              data-pop-rows=""
              data-pop-noun="sections"
              className="divide-y divide-border rounded-xl border"
            >
              {SECTIONS.map((s) => (
                <p
                  key={s}
                  data-pop-row=""
                  className="flex h-12 items-center justify-between px-4 text-sm"
                >
                  {s} <span className="text-muted-foreground">›</span>
                </p>
              ))}
            </div>
          ),
        }}
      />
    );
  const section = moment === "name" ? "Details" : "Guest uploads";
  return (
    <PhoneScreen
      bar="back"
      back="Settings"
      parts={{
        title: section,
        body: moment === "name" ? <Details focused /> : <Uploads />,
        act: SAVE,
        typing: moment === "name",
      }}
    />
  );
}

function draw(option: SettingsOption, moment: Moment, size: Size): ReactNode {
  if (option === "page") {
    const page = <SettingsPage size={size} moment={moment} />;
    // A page's own field: the phone scrolls the page to it, keyboard up.
    return size === "phone" && moment === "name" ? (
      <PageOnKeyboard>{page}</PageOnKeyboard>
    ) : (
      page
    );
  }
  const parts = forSize(settingsParts(moment), size);
  const phone = size === "phone";
  const surface =
    option === "dialog" ? (
      phone ? (
        <SectionsPhone moment={moment} />
      ) : (
        <SectionsDialog moment={moment} />
      )
    ) : !phone ? (
      <SidePanel parts={parts} />
    ) : option === "sheet" ? (
      <BottomSheet parts={parts} />
    ) : (
      <PhoneScreen parts={parts} bar="back" back={EVENT.name} />
    );
  return <HostHub size={size} overlay={surface} />;
}

const MOMENTS: readonly Moment[] = ["top", "name", "uploads"];

export function SettingsPreview({ option }: { option: SettingsOption }) {
  const phones: PhoneScene[] = MOMENTS.map((moment) => ({
    title: MOMENT_TITLE[moment],
    node: draw(option, moment, "phone"),
  }));
  return (
    <Scenes
      id={`settings-${option}`}
      title={OPTION_TITLE[option]}
      laptop={draw(option, "top", "desk")}
      laptopTitle="settings as it opens"
      phones={phones}
    />
  );
}
