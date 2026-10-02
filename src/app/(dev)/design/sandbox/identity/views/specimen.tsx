"use client";

import { type ReactNode, useEffect } from "react";
import {
  Columns3,
  Download,
  Heart,
  ImageUp,
  Images,
  LayoutGrid,
  MoreHorizontal,
  Plus,
  QrCode,
  Rows3,
  Share,
  Trash2,
  Users,
} from "lucide-react";
import { toast } from "sonner";

import { FeedSectionEmpty } from "@/components/app/event-feed/feed-section-empty";
import {
  Avatar,
  AvatarFallback,
  AvatarGroup,
  AvatarGroupCount,
} from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { GLASS } from "@/lib/glass";
import { cn } from "@/lib/utils";

import type { GroupId, Width } from "../model";
import { PHOTO } from "../fixtures";

/**
 * THE SPECIMEN: every atom of a family, in its states, on one sheet.
 *
 * ★ THE SAME MARKUP IN EVERY FAMILY. This file is production's atoms laid out
 * and nothing else: the family is the sheet the frame wears, so two specimens
 * differ by their family alone. The few words on it are its group names and
 * the state each pinned control holds; the layout keys off the frame's width
 * (`w`), never a breakpoint (a lab utility's breakpoint loses to production's
 * plain utility on the same element).
 *
 * ★ A PINNED STATE IS THE REAL RULE (`families/states.ts`): `data-demo` opens
 * the very selector a cursor or the keyboard opens, so a hover pinned here is
 * the hover a screen draws. The menu and the tooltip are production's own,
 * held open; the toast is a real one, from the page's own Toaster.
 */

const STATES = ["rest", "hover", "press", "focus", "off"] as const;

function demoOf(state: (typeof STATES)[number]): string | undefined {
  return state === "rest" || state === "off" ? undefined : state;
}

/** A group's name and its atoms. */
function Group({
  title,
  children,
  className,
}: {
  title: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("flex min-w-0 flex-col gap-5", className)}>
      <h2 className="text-label font-semibold text-muted-foreground uppercase">
        {title}
      </h2>
      {children}
    </section>
  );
}

/** A row of atoms with a quiet name under it. */
function Row({
  children,
  note,
  className,
}: {
  children: ReactNode;
  note?: string;
  className?: string;
}) {
  return (
    <div className="flex flex-col gap-2">
      <div className={cn("flex flex-wrap items-center gap-2.5", className)}>
        {children}
      </div>
      {note ? <p className="text-micro text-faint">{note}</p> : null}
    </div>
  );
}

/** One control pinned in each state, its state named under it. */
function States({ variant }: { variant: "default" | "outline" }) {
  return (
    <div className="grid grid-cols-5 gap-2">
      {STATES.map((s) => (
        <div key={s} className="flex flex-col items-start gap-1.5">
          <Button
            variant={variant}
            size="sm"
            data-demo={demoOf(s)}
            disabled={s === "off"}
            tabIndex={-1}
          >
            Add
          </Button>
          <span className="text-micro text-faint">{s}</span>
        </div>
      ))}
    </div>
  );
}

/* ── the groups ─────────────────────────────────────────────────────── */

export function Actions() {
  return (
    <Group title="Actions">
      <Row note="primary · secondary · outline · ghost · destructive">
        <Button>
          <ImageUp /> Add photos
        </Button>
        <Button variant="secondary">Print</Button>
        <Button variant="outline">Invite</Button>
        <Button variant="ghost">Skip</Button>
        <Button variant="destructive">
          <Trash2 /> Delete
        </Button>
      </Row>
      <States variant="default" />
      <States variant="outline" />
      <Row note="small · default · large · the 44px call to action">
        <Button size="sm">Small</Button>
        <Button>Default</Button>
        <Button size="lg">Large</Button>
        <Button size="cta" className="w-full">
          <ImageUp /> Add your photos
        </Button>
      </Row>
      <Row note="icon buttons, a link">
        <Button size="icon" aria-label="Add">
          <Plus />
        </Button>
        <Button size="icon" variant="outline" aria-label="Download">
          <Download />
        </Button>
        <Button size="icon" variant="ghost" aria-label="Like">
          <Heart />
        </Button>
        <Button
          size="icon"
          variant="ghost"
          aria-label="Share"
          data-demo="focus"
          tabIndex={-1}
        >
          <Share />
        </Button>
        <Button variant="link">See every guest</Button>
      </Row>
      <Row note="chips">
        <ToggleGroup
          type="multiple"
          variant="outline"
          size="sm"
          defaultValue={["photos"]}
        >
          <ToggleGroupItem value="photos">Photos</ToggleGroupItem>
          <ToggleGroupItem value="videos">Videos</ToggleGroupItem>
          <ToggleGroupItem value="liked">Liked</ToggleGroupItem>
          <ToggleGroupItem value="mine">Yours</ToggleGroupItem>
        </ToggleGroup>
      </Row>
      <Row note="the number doors">
        <div data-eh="numbers">
          <button type="button" data-eh="number-door">
            <span data-eh-n="word">
              <Images /> Photos
            </span>
            <b>214</b>
            <span data-eh-n="sub">12 tonight</span>
          </button>
          <button type="button" data-eh="number-door" data-amber="">
            <span data-eh-n="word">
              <Users /> Guests
            </span>
            <b>38</b>
            <span data-eh-n="sub">2 at the door</span>
          </button>
        </div>
      </Row>
    </Group>
  );
}

export function Fields() {
  return (
    <Group title="Fields and selection">
      <div className="flex flex-col gap-2">
        <Label htmlFor="sp-name">Event name</Label>
        <Input id="sp-name" defaultValue="Maya & Jay's Wedding" />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="sp-note">The welcome</Label>
        <Input
          id="sp-note"
          data-demo="focus"
          placeholder="A note guests read first"
          tabIndex={-1}
        />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="sp-link">Custom link</Label>
        <Input id="sp-link" aria-invalid defaultValue="maya-jay" />
        <p className="text-caption text-destructive">
          That link is taken. Try another.
        </p>
      </div>
      <Input disabled defaultValue="partyreel.com/e/maya-and-jay" />
      <Select defaultValue="password">
        <SelectTrigger className="w-full" aria-label="Who may join">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="password">A password</SelectItem>
          <SelectItem value="approve">You let each in</SelectItem>
          <SelectItem value="invite">Your invite list</SelectItem>
        </SelectContent>
      </Select>
      <div className="flex flex-col gap-3.5">
        {(
          [
            ["Accepting uploads", true, false],
            ["Review before they appear", false, false],
            ["Videos", true, true],
          ] as const
        ).map(([label, on, off]) => (
          <div key={label} className="flex items-center justify-between gap-4">
            <span className="text-sm">{label}</span>
            <Switch defaultChecked={on} disabled={off} aria-label={label} />
          </div>
        ))}
      </div>
      <Tabs defaultValue="album">
        <TabsList>
          <TabsTrigger value="album">Album</TabsTrigger>
          <TabsTrigger value="review">Review</TabsTrigger>
          <TabsTrigger value="reel">Reel</TabsTrigger>
        </TabsList>
      </Tabs>
      <ToggleGroup type="single" defaultValue="grid" aria-label="Layout">
        <ToggleGroupItem value="grid" aria-label="Grid">
          <LayoutGrid />
        </ToggleGroupItem>
        <ToggleGroupItem value="rows" aria-label="Rows">
          <Rows3 />
        </ToggleGroupItem>
        <ToggleGroupItem value="columns" aria-label="Columns">
          <Columns3 />
        </ToggleGroupItem>
      </ToggleGroup>
    </Group>
  );
}

/** A cover: a photograph with the media atoms on it. */
function Cover({ compact = false }: { compact?: boolean }) {
  return (
    <div
      data-on-photo=""
      className="relative isolate overflow-hidden rounded-xl"
      style={{ height: compact ? 210 : 196 }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- a bootstrap still, as every board draws one */}
      <img
        src={PHOTO.golden}
        alt=""
        className="absolute inset-0 -z-10 size-full object-cover"
        style={{ objectPosition: "50% 40%" }}
      />
      <div className="absolute inset-0 -z-10 bg-gradient-to-t from-black/55 via-black/10 to-transparent" />
      <div className="flex h-full flex-col justify-between p-4">
        <div className="flex items-start justify-between">
          <span data-eh="live" className={GLASS}>
            Live
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              data-eh="round"
              aria-label="Like"
              className={cn(GLASS, "flex size-10 items-center justify-center")}
            >
              <Heart className="size-4" />
            </button>
            <button
              type="button"
              data-eh="round"
              aria-label="More"
              className={cn(GLASS, "flex size-10 items-center justify-center")}
            >
              <MoreHorizontal className="size-4" />
            </button>
          </div>
        </div>
        <div className="flex items-end justify-between gap-3">
          <button
            type="button"
            data-eh="shutter"
            aria-label="Add photos, sending"
            style={{ "--p": "62%" } as React.CSSProperties}
          >
            <ImageUp />
          </button>
          <Button size="sm">Add photos</Button>
        </div>
      </div>
    </div>
  );
}

export function Surfaces({ toastHere = false }: { toastHere?: boolean }) {
  // A real toast, from the page's own Toaster (the root layout's), held up.
  // ★ A BEAT LATE, ON PURPOSE: the Toaster is the root layout's, a later
  // sibling of this page, so its own effect (the one that starts listening)
  // runs after this one, and a toast raised in the same pass is dropped.
  useEffect(() => {
    if (!toastHere) return;
    let id: string | number | undefined;
    const t = window.setTimeout(() => {
      id = toast("Photo hidden from the album", {
        duration: Infinity,
        action: { label: "Undo", onClick: () => {} },
      });
    }, 300);
    return () => {
      window.clearTimeout(t);
      if (id !== undefined) toast.dismiss(id);
    };
  }, [toastHere]);
  return (
    <Group title="Surfaces and layers">
      {/* The menu drops over the cover, so a layer's material is judged over
          a photograph, which is where a layer meets one in the product. */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <DropdownMenu open modal={false}>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <MoreHorizontal /> More
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="start"
              className="w-52"
              onCloseAutoFocus={(e) => e.preventDefault()}
            >
              <DropdownMenuItem>
                <Download /> Download the original
              </DropdownMenuItem>
              <DropdownMenuItem data-demo="hover">
                <Share /> Copy link
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Images /> Add to the reel
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive">
                <Trash2 /> Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Tooltip open>
            <TooltipTrigger asChild>
              <Button size="icon" variant="ghost" aria-label="Download">
                <Download />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="left">Download the original</TooltipContent>
          </Tooltip>
        </div>
        <Cover />
      </div>
      <Card size="sm">
        <CardHeader>
          <CardTitle>The highlight reel</CardTitle>
          <CardDescription>Plays every approved photo.</CardDescription>
          <CardAction>
            <Badge variant="secondary">On</Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="justify-between gap-2">
          <span className="text-caption text-muted-foreground">
            2 photos to go
          </span>
          <Button size="sm" variant="outline">
            Watch
          </Button>
        </CardFooter>
      </Card>
    </Group>
  );
}

export function Status() {
  return (
    <Group title="Status">
      <Row note="badges">
        <Badge>Pro</Badge>
        <Badge variant="secondary">Draft</Badge>
        <Badge variant="outline">Private</Badge>
        <Badge variant="success">Live</Badge>
        <Badge variant="warning">2 waiting</Badge>
        <Badge variant="destructive">Failed</Badge>
      </Row>
      <div className="flex flex-col gap-2">
        <div className="flex items-baseline justify-between text-caption">
          <span>Sending 5 of 8</span>
          <span className="text-muted-foreground tabular-nums">62%</span>
        </div>
        <Progress value={62} />
      </div>
      <div className="flex items-center gap-3">
        <Skeleton className="size-14 shrink-0" />
        <div className="flex flex-1 flex-col gap-2">
          <Skeleton className="h-3.5 w-4/5" />
          <Skeleton className="h-3.5 w-1/2" />
        </div>
      </div>
      <Row note="avatars · the code chip">
        <AvatarGroup>
          {["maya", "jay", "sam", "ines"].map((s) => (
            <Avatar key={s} seed={`identity-${s}`}>
              <AvatarFallback>{s[0].toUpperCase()}</AvatarFallback>
            </Avatar>
          ))}
          <AvatarGroupCount>+12</AvatarGroupCount>
        </AvatarGroup>
        <Avatar size="lg" seed="identity-host">
          <AvatarFallback>M</AvatarFallback>
        </Avatar>
        <span data-eh="code-chip" aria-label="The code">
          <QrCode />
        </span>
      </Row>
      <div className="rounded-xl ring-1 ring-foreground/10">
        <FeedSectionEmpty
          icon={Images}
          title="Nothing waiting"
          desc="Photos you hold for review land here."
          action={
            <Button size="sm" variant="outline">
              Open the album
            </Button>
          }
        />
      </div>
    </Group>
  );
}

/** The event's name in photo-filled type (event-header's), heading the sheet. */
function Masthead({ size }: { size: number }) {
  return (
    <div className="flex flex-col gap-1">
      <p
        data-eh="photo-type"
        style={
          {
            fontSize: size,
            "--eh-photo": `url(${PHOTO.confetti})`,
          } as React.CSSProperties
        }
      >
        Maya &amp; Jay
      </p>
      <p className="text-micro text-faint">photo-filled type</p>
    </div>
  );
}

/**
 * THE SHEET: at a desk, the four groups side by side under the family's
 * material; in a hand, one group a page (`part`), so each fits a phone.
 */
export function Specimen({ w, part }: { w: Width; part?: GroupId }) {
  if (w === 375) {
    return (
      <main className="min-h-screen bg-background px-5 pt-6 pb-10 text-foreground">
        {part === "surfaces" ? (
          <>
            {/* The toast stands at the top of the page, as the Toaster puts it. */}
            <div style={{ height: 136 }} aria-hidden />
            <Surfaces toastHere />
          </>
        ) : part === "fields" ? (
          <Fields />
        ) : part === "status" ? (
          <Status />
        ) : (
          <div className="flex flex-col gap-6">
            <Masthead size={46} />
            <Actions />
          </div>
        )}
      </main>
    );
  }
  return (
    <main className="min-h-screen bg-background px-10 pt-8 pb-10 text-foreground">
      {/* The toast floats at the top centre, beside the name. */}
      <div style={{ height: 128 }}>
        <Masthead size={72} />
      </div>
      <div className="grid grid-cols-4 gap-10">
        <Actions />
        <Fields />
        <Surfaces toastHere />
        <Status />
      </div>
    </main>
  );
}
