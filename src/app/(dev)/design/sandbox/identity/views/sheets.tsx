"use client";

import { type ReactNode, useState } from "react";
import {
  Columns3,
  Download,
  Globe,
  Heart,
  ImageUp,
  LayoutGrid,
  Lock,
  Play,
  Plus,
  QrCode,
  Rows3,
  UserRound,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { CodeChip } from "@/components/ui/code-chip";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Shutter } from "@/components/ui/shutter";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { cn } from "@/lib/utils";

import { PHOTO } from "../fixtures";
import type { GroundId, SheetView, Width } from "../model";

import { Check, PhotoSurface, Radio, RadioCard, Slider } from "./atoms";
import { Ground } from "./ground";

/**
 * THE SHEETS: every atom of one part, in every state, on paper and in the
 * room: the system's actions, its fields, and every layer the room and the
 * light edge are asked about.
 *
 * ★ THE SAME MARKUP UNDER EVERY OPTION. This file is production's atoms (and
 * the stand-ins) laid out and nothing else: an option is the stylesheet the
 * frame wears, so two sheets differ by their option alone. The words on it
 * are a part's name, a row's atom and the state each holds, in the lab's own
 * quiet type (never a role the voice dresses).
 *
 * ★ A PINNED STATE IS THE REAL RULE (`sheet/states.ts`): `data-demo` opens the
 * selector a cursor or the keyboard opens; `disabled`, `aria-busy` and
 * `aria-invalid` are the attributes a wired atom sets. The menus, popover and
 * tooltips are production's own, held open; the toasts are real, each from
 * its ground's own Toaster.
 *
 * ★ AT A DESK ONE SHEET HOLDS PAPER AND THE ROOM SIDE BY SIDE; IN A HAND A
 * SHEET IS TWO PHONE PAGES IN ONE GROUND (`page` 1 and 2), each a real 812px
 * screen, so a phone's frames are phones rather than one strip too tall to
 * read. The layout keys off the frame's width, never a breakpoint (a lab
 * utility's breakpoint loses to production's plain utility on one element).
 */

const STATES = [
  "rest",
  "hover",
  "press",
  "focus",
  "off",
  "loading",
  "error",
] as const;
type StateId = (typeof STATES)[number];

/** Which half of a sheet a phone page draws; a desk draws both (0). */
type Page = 0 | 1 | 2;
const shows = (page: Page, half: 1 | 2) => page === 0 || page === half;

/**
 * The attributes that pin a state on any atom; a working key carries the
 * words it would say while it works (`data-working`), which the scene shows
 * where the working state is the one that says them.
 */
function pin(s: StateId, working?: string): Record<string, unknown> {
  switch (s) {
    case "hover":
    case "press":
    case "focus":
      return { "data-demo": s, tabIndex: -1 };
    case "off":
      return { disabled: true };
    case "loading":
      return { "aria-busy": true, "data-working": working };
    case "error":
      return { "aria-invalid": true };
    default:
      return {};
  }
}

/* ── the sheet's own furniture (lab type, never the voice's) ──────────── */

function Note({ children }: { children: ReactNode }) {
  return <span className="text-[10px] leading-3 text-faint">{children}</span>;
}

function Part({
  title,
  children,
  className,
}: {
  title: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("flex min-w-0 flex-col gap-2.5", className)}>
      <h3 className="text-[11px] leading-4 font-medium text-muted-foreground">
        {title}
      </h3>
      {children}
    </section>
  );
}

type GridRow = { name: string; draw: (s: StateId) => ReactNode };

/**
 * One atom in each of the seven states. At a desk a row an atom, the states
 * named over the columns; in a hand two rows an atom (rest to focus, then off,
 * loading and error), the states named once, over the first atom.
 */
function StateGrid({ rows, w }: { rows: GridRow[]; w: Width }) {
  if (w === 1440)
    return (
      <div
        className="grid items-center gap-x-2 gap-y-3"
        style={{ gridTemplateColumns: "64px repeat(7, minmax(0, 1fr))" }}
      >
        <span />
        {STATES.map((s) => (
          <Note key={s}>{s}</Note>
        ))}
        {rows.map((r) => (
          <DeskRow key={r.name} row={r} />
        ))}
      </div>
    );
  return (
    <div className="flex flex-col gap-3.5">
      {rows.map((r, i) => (
        <div key={r.name} className="flex flex-col gap-1.5">
          <Note>{r.name}</Note>
          <div className="grid grid-cols-4 items-center gap-x-2 gap-y-2">
            {STATES.map((s) => (
              <div
                key={s}
                className="flex min-w-0 flex-col items-start gap-0.5"
              >
                {r.draw(s)}
                {i === 0 ? <Note>{s}</Note> : null}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function DeskRow({ row }: { row: GridRow }) {
  return (
    <>
      <Note>{row.name}</Note>
      {STATES.map((s) => (
        <div key={s} className="flex min-w-0 items-center">
          {row.draw(s)}
        </div>
      ))}
    </>
  );
}

/* ── ACTIONS ──────────────────────────────────────────────────────────── */

function ActionsSheet({ w, page }: { w: Width; page: Page }) {
  const desk = w === 1440;
  return (
    <div className="flex flex-col gap-5">
      {shows(page, 1) ? (
        <StateGrid
          w={w}
          rows={[
            {
              name: "primary",
              draw: (s) => <Button {...pin(s, "Adding")}>Add</Button>,
            },
            {
              name: "outline",
              draw: (s) => (
                <Button variant="outline" {...pin(s, "Inviting")}>
                  Invite
                </Button>
              ),
            },
            {
              name: "secondary",
              draw: (s) => (
                <Button variant="secondary" {...pin(s, "Printing")}>
                  Print
                </Button>
              ),
            },
            {
              name: "ghost",
              draw: (s) => (
                <Button variant="ghost" {...pin(s, "Skipping")}>
                  Skip
                </Button>
              ),
            },
            {
              name: "delete",
              draw: (s) => (
                <Button variant="destructive" {...pin(s, "Deleting")}>
                  Delete
                </Button>
              ),
            },
            {
              name: "dial",
              draw: (s) => (
                <Button
                  size="icon"
                  variant="outline"
                  aria-label="Add"
                  {...pin(s)}
                >
                  <Plus />
                </Button>
              ),
            },
          ]}
        />
      ) : null}
      {shows(page, 2) ? (
        <>
          <div
            className={cn("grid gap-5", desk ? "grid-cols-2" : "grid-cols-1")}
          >
            <Part title="Sizes, and the 44px call to action">
              <div className="flex flex-wrap items-center gap-2">
                <Button size="xs">Add</Button>
                <Button size="sm">Add</Button>
                <Button>Add</Button>
                <Button size="lg">Add</Button>
                <Button size="icon-sm" variant="ghost" aria-label="Like">
                  <Heart />
                </Button>
                <Button size="icon" variant="secondary" aria-label="Download">
                  <Download />
                </Button>
              </div>
              <Button size="cta" className="w-full">
                <ImageUp /> Add your photos
              </Button>
            </Part>
            <Part title="Chips (on, hover, focus, off), segments and a link">
              <ToggleGroup
                type="multiple"
                variant="outline"
                size="sm"
                defaultValue={["photos"]}
                aria-label="Show"
              >
                <ToggleGroupItem value="photos">Photos</ToggleGroupItem>
                <ToggleGroupItem value="videos" data-demo="hover">
                  Videos
                </ToggleGroupItem>
                <ToggleGroupItem value="liked" data-demo="focus" tabIndex={-1}>
                  Liked
                </ToggleGroupItem>
                <ToggleGroupItem value="mine" disabled>
                  Yours
                </ToggleGroupItem>
              </ToggleGroup>
              <div className="flex flex-wrap items-center gap-3">
                <ToggleGroup
                  type="single"
                  defaultValue="private"
                  aria-label="What the link opens"
                >
                  <ToggleGroupItem value="public">
                    <Globe /> Public
                  </ToggleGroupItem>
                  <ToggleGroupItem value="private">
                    <Lock /> Private
                  </ToggleGroupItem>
                  <ToggleGroupItem value="me" data-demo="hover">
                    <UserRound /> Only me
                  </ToggleGroupItem>
                </ToggleGroup>
                <ToggleGroup
                  type="single"
                  defaultValue="grid"
                  aria-label="Layout"
                >
                  <ToggleGroupItem value="grid" aria-label="Grid">
                    <LayoutGrid />
                  </ToggleGroupItem>
                  <ToggleGroupItem
                    value="rows"
                    aria-label="Rows"
                    data-demo="focus"
                    tabIndex={-1}
                  >
                    <Rows3 />
                  </ToggleGroupItem>
                  <ToggleGroupItem value="columns" aria-label="Columns">
                    <Columns3 />
                  </ToggleGroupItem>
                </ToggleGroup>
              </div>
              <div className="flex items-center gap-5">
                <Button variant="link">See every guest</Button>
                <Button variant="link" data-demo="hover">
                  See every guest
                </Button>
              </div>
            </Part>
          </div>
          <Part title="On a photograph: the white primary, glass rounds (rest, focus), the shutter (idle, sending, sent), the code as a chip (rest, focus)">
            <div
              className={cn("flex gap-4", desk ? "items-stretch" : "flex-col")}
            >
              <PhotoSurface
                src={PHOTO.golden}
                pos="50% 38%"
                className="flex-1 rounded-[var(--radius-tile)]"
                style={{ height: desk ? 132 : 196 }}
              >
                <div
                  className={cn(
                    "flex h-full items-center gap-3 px-4",
                    desk
                      ? "justify-between"
                      : "flex-wrap content-center justify-center",
                  )}
                >
                  <div className="flex items-center gap-2">
                    <Button variant="on-photo" size="cta">
                      <ImageUp /> Add photos
                    </Button>
                    <Button
                      variant="glass"
                      size="icon-cta"
                      aria-label="Watch the reel"
                    >
                      <Play className="fill-current" />
                    </Button>
                    <Button
                      variant="glass"
                      size="icon-cta"
                      aria-label="Invite"
                      data-demo="focus"
                      tabIndex={-1}
                    >
                      <QrCode />
                    </Button>
                  </div>
                  <div className="flex items-center gap-4">
                    <Shutter aria-label="Add photos" />
                    <Shutter
                      state="sending"
                      progress={0.62}
                      count={3}
                      aria-label="Add photos, 3 sending"
                    />
                    <Shutter
                      state="done"
                      progress={1}
                      aria-label="Add photos, all sent"
                    />
                  </div>
                </div>
              </PhotoSurface>
              <div
                className={cn(
                  "flex items-center justify-center gap-5",
                  desk ? "flex-col px-3" : "justify-start py-1",
                )}
              >
                <CodeChip aria-label="Show the code" />
                <CodeChip
                  aria-label="Show the code"
                  data-demo="focus"
                  tabIndex={-1}
                />
                {desk ? null : <Note>the code as a chip: rest, focus</Note>}
              </div>
            </div>
          </Part>
        </>
      ) : null}
    </div>
  );
}

/* ── FIELDS ───────────────────────────────────────────────────────────── */

function Field({
  label,
  line,
  error,
  children,
}: {
  label: string;
  line?: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div className="flex min-w-0 flex-col gap-1.5">
      <Label>{label}</Label>
      {children}
      {error ? (
        <p className="text-caption text-destructive">{error}</p>
      ) : line ? (
        <p className="text-caption text-muted-foreground">{line}</p>
      ) : null}
    </div>
  );
}

/**
 * A field checking what was typed: the field itself busy, in the wrapper and
 * beside the status slot a wired field draws where its answer will be (the
 * proposed hooks `field-wrap` and `field-status`, `sheet/loading.ts`).
 */
export function Checking({
  value,
  label,
}: {
  value: string;
  label?: string;
}) {
  return (
    <div data-slot="field-wrap">
      <Input defaultValue={value} aria-busy aria-label={label} />
      <span data-slot="field-status" data-working="Checking" aria-hidden />
    </div>
  );
}

function FieldsSheet({ w, page }: { w: Width; page: Page }) {
  const desk = w === 1440;
  const [door, setDoor] = useState("password");
  return (
    <div className="flex flex-col gap-5">
      {shows(page, 1) ? (
        <>
          <div
            className={cn(
              "grid gap-x-4",
              desk ? "grid-cols-3 gap-y-4" : "grid-cols-1 gap-y-3",
            )}
          >
            <Field label="Event name">
              <Input defaultValue="Maya & Jay's Wedding" />
            </Field>
            <Field label="Custom link" line="hover">
              <Input defaultValue="maya-and-jay" data-demo="hover" />
            </Field>
            <Field label="A note for guests" line="focus">
              <Input
                defaultValue="Dance floor opens at nine"
                data-demo="focus"
                tabIndex={-1}
              />
            </Field>
            <Field label="Album address" line="off">
              <Input disabled defaultValue="partyreel.com/e/maya-and-jay" />
            </Field>
            <Field label="Custom link" line="Checking it is free…">
              <Checking value="mayajay" />
            </Field>
            <Field label="Custom link" error="That link is taken. Try another.">
              <Input aria-invalid defaultValue="maya-jay" />
            </Field>
          </div>
          <div
            className={cn(
              "grid gap-4",
              desk ? "grid-cols-[1.4fr_1fr_1fr]" : "grid-cols-2",
            )}
          >
            {desk ? (
              <Field label="The welcome">
                <Textarea
                  rows={2}
                  defaultValue="Everything from tonight, in one place."
                />
              </Field>
            ) : null}
            <Field label="Who may join">
              <Select defaultValue="password">
                <SelectTrigger className="w-full" aria-label="Who may join">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="password">A password</SelectItem>
                  <SelectItem value="approve">You let each in</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Field label="Largest upload" line="focus">
              <Select defaultValue="250">
                <SelectTrigger
                  className="w-full"
                  aria-label="Largest upload"
                  data-demo="focus"
                  tabIndex={-1}
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="250">250 MB</SelectItem>
                </SelectContent>
              </Select>
            </Field>
          </div>
        </>
      ) : null}
      {shows(page, 2) ? (
        <div className={cn("grid gap-5", desk ? "grid-cols-2" : "grid-cols-1")}>
          {desk ? null : (
            <Field label="The welcome">
              <Textarea
                rows={2}
                defaultValue="Everything from tonight, in one place."
              />
            </Field>
          )}
          <Part title="Switches: off, on, focus, held off, held on">
            <div className="flex flex-wrap items-center gap-4">
              <Switch aria-label="Off" />
              <Switch aria-label="On" defaultChecked />
              <Switch
                aria-label="Focus"
                defaultChecked
                data-demo="focus"
                tabIndex={-1}
              />
              <Switch aria-label="Held off" disabled />
              <Switch aria-label="Held on" disabled defaultChecked />
            </div>
          </Part>
          <Part title="Checks: off, on, hover, focus, held, error">
            <div className="flex flex-wrap items-center gap-4">
              <Check label="Off" />
              <Check label="On" checked />
              <Check label="Hover" demo="hover" />
              <Check label="Focus" checked demo="focus" />
              <Check label="Held" checked disabled />
              <Check label="Error" invalid />
            </div>
          </Part>
          <Part title="Radios (on, off, hover, focus, held), and radio cards">
            <div className="flex flex-wrap items-center gap-4">
              <Radio checked label="Chosen" />
              <Radio checked={false} label="Not chosen" />
              <Radio checked={false} label="Hover" demo="hover" />
              <Radio checked label="Focus" demo="focus" />
              <Radio checked={false} label="Held" disabled />
            </div>
            <div className="flex flex-col gap-1.5">
              <RadioCard
                checked={door === "password"}
                onPick={() => setDoor("password")}
                title="A password"
                line="Guests type it once, at the door."
              />
              <RadioCard
                checked={door === "approve"}
                onPick={() => setDoor("approve")}
                title="You let each in"
                line="They wait at the door until you say yes."
              />
            </div>
          </Part>
          <Part title="A slider (rest, focus, held) and tabs (on, hover, focus)">
            <div className="flex flex-col gap-3 pr-2">
              <Slider value={62} label="Size" />
              <Slider value={35} label="Hold" demo="focus" />
              <Slider value={50} label="Held" disabled />
            </div>
            <Tabs defaultValue="album">
              <TabsList>
                <TabsTrigger value="album">Album</TabsTrigger>
                <TabsTrigger value="review" data-demo="hover">
                  Review
                </TabsTrigger>
                <TabsTrigger value="reel" data-demo="focus" tabIndex={-1}>
                  Reel
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </Part>
        </div>
      ) : null}
    </div>
  );
}

/* ── WORKING ──────────────────────────────────────────────────────────── */

/**
 * One thing working, twice: moving, and still as reduced motion leaves it
 * (`.identity-still`, the global guard on a subtree), so every option's still
 * is judged beside its loop. At a desk the two stand side by side; in a hand
 * the still sits under the loop.
 */
function WorkRow({
  title,
  w,
  draw,
}: {
  title: string;
  w: Width;
  draw: () => ReactNode;
}) {
  const desk = w === 1440;
  return (
    <Part title={title}>
      <div
        className={cn(
          "grid gap-x-6 gap-y-3",
          desk ? "grid-cols-2" : "grid-cols-1",
        )}
      >
        <div className="flex min-w-0 flex-col gap-1.5">
          <Note>moving</Note>
          {draw()}
        </div>
        <div className="identity-still flex min-w-0 flex-col gap-1.5">
          <Note>still, as reduced motion leaves it</Note>
          {draw()}
        </div>
      </div>
    </Part>
  );
}

/**
 * THE LOADING ASK'S THREE (the r5 brief: "on a primary, a quiet key, and a
 * field checking what was typed"): Account's Save on the name she typed,
 * Manage billing opening Stripe beside Change plan at rest, and a custom link
 * being checked. Each carries the words it would say (`data-working`).
 */
function WorkingSheet({ w }: { w: Width }) {
  return (
    <div className="flex flex-col gap-6">
      <WorkRow
        w={w}
        title="A primary: Save, on the name she typed"
        draw={() => (
          <div className="flex gap-2">
            <Input defaultValue="Maya Okafor-Reyes" aria-label="Display name" />
            <Button aria-busy data-working="Saving">
              Save
            </Button>
          </div>
        )}
      />
      <WorkRow
        w={w}
        title="A quiet key: Manage billing, opening the billing portal"
        draw={() => (
          <div className="flex flex-wrap items-center gap-2">
            <Button size="sm">Change plan</Button>
            <Button
              size="sm"
              variant="outline"
              aria-busy
              data-working="Opening billing"
            >
              Manage billing
            </Button>
          </div>
        )}
      />
      <WorkRow
        w={w}
        title="A field checking what was typed: a custom link"
        draw={() => (
          <div className="flex flex-col gap-1.5">
            <Checking value="maya-and-jay" label="Custom link" />
            <p className="text-caption text-muted-foreground">
              Checking it is free…
            </p>
          </div>
        )}
      />
    </div>
  );
}

/* ── the sheet, on its grounds ────────────────────────────────────────── */

const TITLE: Record<SheetView, string> = {
  actions: "Actions, every state",
  fields: "Fields and toggles, every state",
  working: "Working, moving and still",
};

function SheetOn({ view, w, page }: { view: SheetView; w: Width; page: Page }) {
  if (view === "working") return <WorkingSheet w={w} />;
  return view === "actions" ? (
    <ActionsSheet w={w} page={page} />
  ) : (
    <FieldsSheet w={w} page={page} />
  );
}

/**
 * At a desk, paper and the room side by side in one frame; in a hand, one
 * page of the sheet on the frame's own ground (the working sheet is one
 * page).
 */
export function Sheet({
  view,
  w,
  ground,
  page,
}: {
  view: SheetView;
  w: Width;
  ground: GroundId;
  page: 1 | 2;
}) {
  const desk = w === 1440;
  const grounds: GroundId[] = desk ? ["paper", "room"] : [ground];
  const at: Page = desk ? 0 : page;
  const paged = !desk && view !== "working";
  return (
    <main
      className="grid min-h-screen"
      style={{
        gridTemplateColumns: `repeat(${grounds.length}, minmax(0, 1fr))`,
      }}
    >
      {grounds.map((g, i) => (
        <Ground
          key={g}
          g={g}
          side={grounds.length === 2 ? (i === 0 ? "left" : "right") : undefined}
          className={desk ? "px-8 pt-6 pb-8" : "px-5 pt-5 pb-8"}
        >
          <header
            className="flex items-baseline justify-between gap-3"
            style={{ marginBottom: 20 }}
          >
            <span className="text-[11px] leading-4 font-medium text-foreground">
              {paged ? `${TITLE[view]}, ${page} of 2` : TITLE[view]}
            </span>
            <span className="text-[11px] leading-4 text-faint">
              {g === "paper" ? "On paper" : "In the room"}
            </span>
          </header>
          <SheetOn view={view} w={w} page={at} />
        </Ground>
      ))}
    </main>
  );
}
