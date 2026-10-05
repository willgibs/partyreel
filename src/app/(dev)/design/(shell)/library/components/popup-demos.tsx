"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { Camera, FolderOpen, ImageUp } from "lucide-react";

import { CodeCard, readableLink } from "@/components/app/share/code-card";
import type { GuestListItem } from "@/components/social/guest-list";
import { GuestPeek } from "@/components/social/guest-peek";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popup,
  PopupBody,
  PopupClose,
  PopupContent,
  PopupFooter,
  PopupHeader,
  PopupTrigger,
} from "@/components/ui/popup";
import type { PopupKind } from "@/components/ui/popup-kinds";
import {
  ResponsiveMenu,
  ResponsiveMenuItem,
  ResponsiveMenuNote,
} from "@/components/ui/responsive-menu";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";

import { PricingSheetScene } from "../compositions/pricing-demos";
import { BehindThePopup, DevicePair, KeyboardStandIn } from "../device-frames";

/**
 * THE POPUPS, BY KIND, AT BOTH SCREENS (`popup-kinds.ts`'s one table, drawn: every kind is a place on the screen, and the
 * place is read from the row for the width it opens at).
 *
 * Each kind stands in a real viewport at a laptop and at a phone over a stand-in album page, drawn open from its first
 * commit and closed by its own control (Replay opens it again). The five kinds `PopupContent` draws wear stand-in words;
 * the three that are primitives of their own are the real ones: the choice is `ResponsiveMenu` (a menu under its
 * button, its rows at the thumb), the share is the code card and the peek is the look (`GuestPeek`), and the plan is
 * the real plans' sheet over its inert doors. A kind with a field in it (the form, the settings' name) takes the
 * keyboard on the phone (`KeyboardStandIn`).
 *
 * ★ EVERY WORD HERE IS A STAND-IN AND EVERY SHAPE IS THE ROW'S: the captions under each frame are read off the popup
 * standing in it (`data-kind`, `data-shape` and its box), never off the table that chose them.
 */

/** The kinds a field takes: the form's, and the settings' event name. */
export const KEYBOARD_KINDS: readonly PopupKind[] = ["form", "settings"];

/** The look's one name: a confirmed account with a page of its own. */
const PRIYA: GuestListItem = {
  id: "library-priya",
  displayName: "Priya Anand",
  slug: "priya",
  avatarMarker: null,
  avatarUrl: null,
  seed: "library-priya",
};

const GUESTS = [
  ["Priya Anand", "Confirmed their email"],
  ["Tom Reyes", "Unverified: anyone can type a name"],
  ["Grace Okafor", "Confirmed their email"],
  ["Jordan Lee", "Confirmed their email"],
  ["Arjun Rao", "Unverified: anyone can type a name"],
  ["Maya Bell", "Confirmed their email"],
  ["Sam Ito", "Confirmed their email"],
  ["Lena Fox", "Unverified: anyone can type a name"],
  ["Noor Haddad", "Confirmed their email"],
  ["Ben Walsh", "Confirmed their email"],
] as const;

/** A popup drawn open, closed by its own control; Replay (the pair's) remounts it open. */
function useOpen() {
  const [open, setOpen] = useState(true);
  return { open, setOpen };
}

function ListScene() {
  const { open, setOpen } = useOpen();
  return (
    <>
      <BehindThePopup />
      <Popup open={open} onOpenChange={setOpen}>
        <PopupContent kind="list">
          <PopupHeader
            title="Guests"
            description="31 here, 2 at the door"
            back="Album"
          />
          <PopupBody className="space-y-1">
            {GUESTS.map(([name, line]) => (
              <div key={name} className="flex items-center gap-3 py-1.5">
                <Avatar seed={`library-${name}`}>
                  <AvatarFallback>{name.slice(0, 1)}</AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{name}</p>
                  <p className="truncate text-caption text-muted-foreground">
                    {line}
                  </p>
                </div>
              </div>
            ))}
          </PopupBody>
        </PopupContent>
      </Popup>
    </>
  );
}

function ConfirmScene() {
  const { open, setOpen } = useOpen();
  return (
    <>
      <BehindThePopup />
      <Popup open={open} onOpenChange={setOpen}>
        <PopupContent kind="confirm" size="md">
          <PopupHeader
            title={"Delete “Maya & Jay’s wedding”?"}
            description="This removes the event and everything guests uploaded from your album right away. It moves to Deleted, where you can restore it for 30 days before it is deleted for good."
          />
          <PopupBody>
            <ul className="space-y-1.5 text-sm text-muted-foreground">
              <li>412 photos and 18 videos</li>
              <li>The code and the link guests use</li>
              <li>What 31 guests added</li>
            </ul>
          </PopupBody>
          <PopupFooter>
            <PopupClose asChild>
              <Button variant="outline">Cancel</Button>
            </PopupClose>
            <Button variant="destructive">Delete event</Button>
          </PopupFooter>
        </PopupContent>
      </Popup>
    </>
  );
}

function FormScene() {
  const { open, setOpen } = useOpen();
  return (
    <>
      <BehindThePopup />
      <Popup open={open} onOpenChange={setOpen}>
        <PopupContent kind="form">
          <PopupHeader
            title="Report this photo"
            description="Tell us what's wrong and our team will review it. The host is never told who reported."
          />
          <PopupBody className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="library-report-what">What is wrong?</Label>
              <Textarea
                id="library-report-what"
                rows={3}
                placeholder="A little more, if you can"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="library-report-email">Your email</Label>
              <Input
                id="library-report-email"
                type="email"
                placeholder="you@example.com"
              />
            </div>
          </PopupBody>
          <PopupFooter>
            <PopupClose asChild>
              <Button variant="outline">Cancel</Button>
            </PopupClose>
            <Button>Send report</Button>
          </PopupFooter>
        </PopupContent>
      </Popup>
    </>
  );
}

/** The choice: the real responsive menu, anchored to the button that asked (the stand-in page's Add photos). */
function ChoiceScene() {
  const { open, setOpen } = useOpen();
  const anchor = useRef<HTMLButtonElement>(null);
  return (
    <>
      <BehindThePopup
        action={
          <Button ref={anchor} size="sm" onClick={() => setOpen(true)}>
            <ImageUp /> Add photos
          </Button>
        }
      />
      <ResponsiveMenu
        open={open}
        onOpenChange={setOpen}
        anchor={anchor}
        title="Add photos"
        align="end"
      >
        <ResponsiveMenuItem icon={<Camera />}>Take a photo</ResponsiveMenuItem>
        <ResponsiveMenuItem icon={<ImageUp />} hint="1,204">
          Choose from your library
        </ResponsiveMenuItem>
        <ResponsiveMenuItem icon={<FolderOpen />}>
          Browse files
        </ResponsiveMenuItem>
        <ResponsiveMenuNote>
          Photos and videos, up to 200 MB each.
        </ResponsiveMenuNote>
      </ResponsiveMenu>
    </>
  );
}

const JOIN = "https://partyreel.com/e/7f3a9c2e5b8d4f1a9e6c3b7d2a5f8e1c";

/** The share: the real code card, white for a scanner at both widths. */
function ShareScene() {
  const { open, setOpen } = useOpen();
  return (
    <>
      <BehindThePopup />
      <CodeCard
        open={open}
        onOpenChange={setOpen}
        eventName={"Maya & Jay’s wedding"}
        joinUrl={JOIN}
        prettyUrl={readableLink(JOIN)}
        qrStyle="classic"
        who="host"
        onEverything={() => {}}
        location="library"
      />
    </>
  );
}

/** The settings: a panel beside the screen at a desk, the whole screen under a back arrow in a hand. */
function SettingsScene() {
  const { open, setOpen } = useOpen();
  return (
    <>
      <BehindThePopup />
      <Popup open={open} onOpenChange={setOpen}>
        <PopupContent kind="settings">
          <PopupHeader
            title="Settings"
            description={"Maya & Jay’s wedding"}
            back="Album"
          />
          <PopupBody className="space-y-5">
            <div className="space-y-1.5">
              <Label htmlFor="library-settings-name">Event name</Label>
              <Input
                id="library-settings-name"
                defaultValue={"Maya & Jay’s wedding"}
              />
            </div>
            <div className="flex items-center justify-between gap-4">
              <div className="min-w-0">
                <p className="text-sm font-medium">
                  Hold new photos for review
                </p>
                <p className="text-caption text-muted-foreground">
                  Nothing joins the album until you approve it.
                </p>
              </div>
              <Switch aria-label="Hold new photos for review" />
            </div>
            <div className="flex items-center justify-between gap-4">
              <div className="min-w-0">
                <p className="text-sm font-medium">Videos</p>
                <p className="text-caption text-muted-foreground">
                  From you and every guest.
                </p>
              </div>
              <Switch defaultChecked aria-label="Videos" />
            </div>
          </PopupBody>
          <PopupFooter>
            <PopupClose asChild>
              <Button>Done</Button>
            </PopupClose>
          </PopupFooter>
        </PopupContent>
      </Popup>
    </>
  );
}

/**
 * The peek: the real look over a name in a stand-in guest list, opened for the reader as it is on a press (a card beside
 * the name at a desk, the sheet in a hand). Follow is not offered (a write), and the profile link is a link, which the
 * frame holds.
 */
function PeekScene() {
  const name = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    // The press that opens it, once the scene's quiet arrival is under way: a click, never a focus.
    const timer = window.setTimeout(() => name.current?.click(), 250);
    return () => window.clearTimeout(timer);
  }, []);
  return (
    <BehindThePopup>
      <GuestPeek item={PRIYA} canFollow={false}>
        <button
          ref={name}
          type="button"
          className="flex h-8 items-center gap-2 rounded-full border border-border bg-background py-1 pr-3 pl-1 text-sm"
        >
          <Avatar size="sm" seed="library-priya">
            <AvatarFallback>P</AvatarFallback>
          </Avatar>
          Priya Anand
        </button>
      </GuestPeek>
    </BehindThePopup>
  );
}

function KindScene({ kind }: { kind: PopupKind }): ReactNode {
  switch (kind) {
    case "list":
      return <ListScene />;
    case "confirm":
      return <ConfirmScene />;
    case "form":
      return <FormScene />;
    case "choice":
      return <ChoiceScene />;
    case "share":
      return <ShareScene />;
    case "plan":
      return <PricingSheetScene state="locked" />;
    case "settings":
      return <SettingsScene />;
    case "peek":
      return <PeekScene />;
  }
}

const NOTES: Record<PopupKind, string> = {
  list: "A place she moves through: beside the screen at a desk, the whole screen under a back arrow in a hand, whose Back closes it.",
  confirm:
    "An alert dialog: it stops the person to ask one thing and starts on its safe answer. Wider (size md) when it lists what leaves.",
  form: "One question with a field in it: centred, standing in the band the keyboard leaves in a hand. Switch the keyboard up to see it.",
  choice:
    "A quick choice: a menu under the button that asked at a desk, its rows at the thumb with Cancel beneath in a hand. A row is the act.",
  share:
    "The code card, white for a scanner: a card in the middle at a desk, the whole screen in a hand.",
  plan: "A decision with money in it: cards stacked in a wide dialog at a desk, the whole screen under a close in a hand. The doors are inert.",
  settings:
    "His panel at a desk, the whole screen in a hand; a field in it takes the keyboard, so switch it up.",
  peek: "A look at a name: a card beside the name at a desk, the sheet in a hand.",
};

/** One kind of popup at both screens: its row's shapes, read off the frames. */
export function PopupKindDemo({ kind }: { kind: PopupKind }) {
  return (
    <DevicePair
      id={`popup-${kind}`}
      keyboard={KEYBOARD_KINDS.includes(kind)}
      scene={({ keyboard }) => (
        <>
          <KindScene kind={kind} />
          <KeyboardStandIn up={keyboard} />
        </>
      )}
      note={NOTES[kind]}
    />
  );
}

/* ── The arrival guard ────────────────────────────────────────────────────── */

const sleep = (ms: number) =>
  new Promise<void>((resolve) => window.setTimeout(resolve, ms));

/** Waits for an element to stand in the document, a frame at a time, for a second at most. */
async function stands(
  find: () => HTMLElement | null,
): Promise<HTMLElement | null> {
  for (let i = 0; i < 60; i++) {
    const el = find();
    if (el) return el;
    await new Promise((resolve) => requestAnimationFrame(resolve));
  }
  return null;
}

/**
 * The press a finger makes, in the order a touch makes it: down, up, then the click it ends in. Dispatched on the element
 * itself, so the page's capture listeners (the popup's guard) and the element's own handler hear it as they hear one.
 */
function press(target: HTMLElement) {
  const box = target.getBoundingClientRect();
  const at = {
    bubbles: true,
    cancelable: true,
    composed: true,
    clientX: box.left + box.width / 2,
    clientY: box.top + box.height / 2,
  };
  const touch = { ...at, pointerId: 7, pointerType: "touch", isPrimary: true };
  target.dispatchEvent(new PointerEvent("pointerdown", touch));
  target.dispatchEvent(new MouseEvent("mousedown", { ...at, detail: 1 }));
  target.dispatchEvent(new PointerEvent("pointerup", touch));
  target.dispatchEvent(new MouseEvent("mouseup", { ...at, detail: 1 }));
  target.dispatchEvent(new MouseEvent("click", { ...at, detail: 1 }));
}

type Heard = { after: number; heard: number } | null;

/**
 * A TAP THAT LANDS WHILE THE LAYER ARRIVES, PLAYED (`PopupContent`'s `arriving` guard, crumbs-23 and crumbs-26).
 *
 * A layer a tap opened fades in where the finger just was, and it is hit-testable from its first frame, so the second tap
 * of a double tap lands inside it: on the destructive answer of a confirmation, here. The guard takes no tap (nor the
 * press, nor the click it ends in) until the layer's own entrance has run out. This opens the real popup and presses the
 * real button the way a finger does, 60 ms after it stands (mid-arrival) and 700 ms after (settled), and reports what
 * the button heard, counted by the button's own handler. Nothing is faked past the events: the guard is the component's.
 */
export function ArrivalGuardDemo() {
  const [open, setOpen] = useState(false);
  const [presses, setPresses] = useState(0);
  const [heard, setHeard] = useState<Heard>(null);
  const running = useRef(false);

  async function play(after: number) {
    if (running.current) return;
    running.current = true;
    setHeard(null);
    setPresses(0);
    // An open layer has no arrival to meet: it goes out first, so the next one stands afresh.
    if (open) {
      setOpen(false);
      await sleep(400);
    }
    setOpen(true);
    const layer = await stands(() =>
      document.querySelector<HTMLElement>("[data-arrival-layer]"),
    );
    const answer = layer?.querySelector<HTMLElement>("[data-arrival-answer]");
    if (!layer || !answer) {
      running.current = false;
      return;
    }
    await sleep(after);
    // Counted by the answer's own handler, read once the press has had its turn.
    const before = Number(answer.dataset.pressed ?? 0);
    press(answer);
    await sleep(80);
    setHeard({ after, heard: Number(answer.dataset.pressed ?? 0) - before });
    running.current = false;
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" size="sm" onClick={() => void play(60)}>
          Open it and tap Delete 60 ms later
        </Button>
        <Button variant="outline" size="sm" onClick={() => void play(700)}>
          Open it and tap Delete 700 ms later
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            setHeard(null);
            setPresses(0);
            setOpen(true);
          }}
        >
          Just open it
        </Button>
      </div>
      <p role="status" className="min-h-10 text-sm text-muted-foreground">
        {heard === null
          ? "Press one: the popup opens and a finger's press lands on Delete."
          : heard.heard === 0
            ? `At ${heard.after} ms the layer was still arriving: the press, its mouse events and its click were swallowed, and Delete heard nothing.`
            : heard.after < 200
              ? `At ${heard.after} ms Delete heard the tap: nothing was arriving, since reduced motion makes the entrance a frame.`
              : `At ${heard.after} ms the layer had settled: Delete heard the tap (${heard.heard}).`}
      </p>
      <Popup open={open} onOpenChange={setOpen}>
        <PopupContent kind="confirm" data-arrival-layer="">
          <PopupHeader
            title="Delete this photo?"
            description="Nothing is deleted here: Delete only counts the presses it hears."
          />
          <PopupBody>
            <p className="text-sm text-muted-foreground">
              Delete was pressed{" "}
              <span
                data-arrival-count=""
                className="font-medium text-foreground tabular-nums"
              >
                {presses}
              </span>{" "}
              {presses === 1 ? "time" : "times"}.
            </p>
          </PopupBody>
          <PopupFooter>
            <PopupClose asChild>
              <Button variant="outline">Cancel</Button>
            </PopupClose>
            <Button
              variant="destructive"
              data-arrival-answer=""
              data-pressed={presses}
              onClick={() => setPresses((n) => n + 1)}
            >
              Delete
            </Button>
          </PopupFooter>
        </PopupContent>
      </Popup>
    </div>
  );
}

/* ── The size axis ────────────────────────────────────────────────────────── */

/** One confirmation at one size, opened by a press in the page: the live layer at the reader's own width. */
export function PopupSizeSample({ size }: { size: "sm" | "md" | "lg" }) {
  return (
    <Popup>
      <PopupTrigger asChild>
        <Button variant="outline" size="sm">
          Open {size}
        </Button>
      </PopupTrigger>
      <PopupContent kind="confirm" size={size}>
        <PopupHeader
          title="Remove this guest?"
          description="Their photos stay in the album."
        />
        <PopupFooter>
          <PopupClose asChild>
            <Button variant="outline">Cancel</Button>
          </PopupClose>
          <Button variant="destructive">Remove</Button>
        </PopupFooter>
      </PopupContent>
    </Popup>
  );
}
