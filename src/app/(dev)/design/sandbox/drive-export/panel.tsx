"use client";

import type { ReactNode } from "react";
import { Download, EyeOff, FolderUp, ImageDown, Unplug } from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Popup,
  PopupBody,
  PopupContent,
  PopupFooter,
  PopupHeader,
} from "@/components/ui/popup";
import { Switch } from "@/components/ui/switch";
import { formatCount } from "@/lib/format/count";
import { setNoun } from "@/lib/export/take-home";
import { PHONE_MAX_EDGE } from "@/lib/media/preview-size";
import { cn, formatBytes } from "@/lib/utils";

import { DriveName, FolderPicture } from "./chrome";
import {
  ALBUM_BYTES,
  ALBUM_COUNT,
  DRIVE_FREE,
  EVENT,
  HOST,
  photoAt,
  TOTAL_BYTES,
  TOTAL_COUNT,
} from "./fixtures";

/**
 * TAKE IT HOME, AS PRODUCTION OPENS IT, WITH GOOGLE DRIVE IN IT.
 *
 * The real `Popup` in its `plan` kind (`popup-kinds.ts`: wide at a desk, the
 * whole screen in a hand), its head and body, around production's two sets as
 * `take-home-panel.tsx` draws them (`SetCard` and `Mosaic`, quoted: a card is
 * the album's own picture, its name, what it is for, its facts and its one
 * act; at a desk Originals leads, in a hand Phone size does), then the clips
 * line and Include hidden items. Each way in adds Drive its own way.
 *
 * ★ THE PANEL'S STEPS (connecting, the final press) ARE THE SAME POPUP ONE
 * LEVEL IN (`PopupHeader`'s `up`), as Settings' pages are: Back returns to the
 * sets, the close closes it all.
 */

export type WayIn = "third" | "originals" | "row";

const PHOTO_PHONE_BYTES = 0.7 * 1024 ** 3;

/** The album's newest photographs in rows of one height: two rows of three at a desk, a row of four in a hand. */
function Mosaic({ from, wide }: { from: number; wide: boolean }) {
  const n = wide ? 6 : 4;
  return (
    <span
      aria-hidden
      className={cn(
        "grid gap-0.5 overflow-hidden rounded-[calc(var(--radius-float)-4px)] bg-muted",
        wide ? "aspect-[3/2] grid-cols-3 grid-rows-2" : "h-16 grid-cols-4",
      )}
    >
      {Array.from({ length: n }, (_, k) => (
        // eslint-disable-next-line @next/next/no-img-element -- a bootstrap still, the set's picture
        <img
          key={k}
          src={photoAt(from * 3 + k).src}
          alt=""
          draggable={false}
          className="size-full min-h-0 object-cover"
        />
      ))}
    </span>
  );
}

/** One set as production's `SetCard` draws it: picture, name, purpose, facts, act. */
function SetCard({
  name,
  purpose,
  facts,
  picture,
  acts,
  wide,
  read,
}: {
  name: ReactNode;
  purpose: string;
  facts: string;
  picture: ReactNode;
  acts: ReactNode;
  wide: boolean;
  read?: string;
}) {
  return (
    <div
      data-dx-read={read}
      data-dx-w={read ? "" : undefined}
      className="flex flex-col gap-2.5 rounded-float bg-card p-2 ring-1 ring-foreground/10"
    >
      {picture}
      <div
        className={cn(
          "flex gap-3 px-1.5 pb-1",
          wide ? "flex-col gap-0.5" : "items-center",
        )}
      >
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="font-heading text-lg">{name}</span>
          <span className="text-sm text-pretty text-muted-foreground">
            {purpose}
          </span>
          <span className="text-xs text-muted-foreground tabular-nums">
            {facts}
          </span>
        </div>
        <div
          className={cn(
            "flex shrink-0 gap-1.5",
            wide ? "mt-3 self-start" : "flex-col items-stretch",
          )}
        >
          {acts}
        </div>
      </div>
    </div>
  );
}

const originalsFacts = `${formatCount(TOTAL_COUNT)} · ${formatBytes(TOTAL_BYTES)} · a zip`;
const phoneFacts = `${formatCount(ALBUM_COUNT.photos)} photos · ${formatBytes(PHOTO_PHONE_BYTES)} · ${formatCount(PHONE_MAX_EDGE)} px`;

/** What the Drive way says it holds: before she connects, where it goes; after, whose Drive and its room. */
export function driveFacts(connected: boolean): string {
  return connected
    ? `${HOST.email} · ${formatBytes(DRIVE_FREE)} free`
    : `${formatCount(TOTAL_COUNT)} · ${formatBytes(TOTAL_BYTES)} · a folder in your Drive`;
}

function SendButton({
  lead = false,
  label = "Send to Drive",
}: {
  lead?: boolean;
  label?: string;
}) {
  return (
    <Button variant={lead ? "default" : "outline"} size="sm">
      <FolderUp /> {label}
    </Button>
  );
}

/**
 * THE SETS, WITH DRIVE ITS OWN WAY: a third card (at a desk a whole row of the
 * grid under the two, its picture beside its words; in a hand a third card in
 * the stack), a second act on Originals, or a line under the two.
 */
function Sets({
  desk,
  way,
  connected,
  note,
  drive,
}: {
  desk: boolean;
  way: WayIn;
  connected: boolean;
  /** A line under the Drive act (straight to Google's one line). */
  note?: string;
  /** The Drive card's words and act replaced (Inside Take it home: the send's own progress). */
  drive?: ReactNode;
}) {
  const originals = (
    <SetCard
      key="originals"
      name="Originals"
      purpose="Full size, to keep for good."
      facts={originalsFacts}
      picture={<Mosaic from={0} wide={desk} />}
      wide={desk}
      read={way === "originals" ? "Originals, with Drive beside" : undefined}
      acts={
        <>
          <Button variant={desk ? "default" : "outline"} size="sm">
            <Download /> Download
          </Button>
          {way === "originals" && <SendButton />}
        </>
      }
    />
  );
  const phone = (
    <SetCard
      key="phone"
      name="Phone size"
      purpose="Light enough to post tonight."
      facts={phoneFacts}
      picture={<Mosaic from={1} wide={desk} />}
      wide={desk}
      acts={
        <Button variant={desk ? "outline" : "default"} size="sm">
          {desk ? <Download /> : <ImageDown />}
          {desk ? "Download" : "Save"}
        </Button>
      }
    />
  );
  const driveWords = (
    <>
      <span className="font-heading text-lg">
        <DriveName className="gap-2 [&_svg]:size-[18px]" />
      </span>
      <span className="text-sm text-pretty text-muted-foreground">
        Every original, kept in your own Drive.
      </span>
      <span className="text-xs text-muted-foreground tabular-nums">
        {driveFacts(connected)}
      </span>
    </>
  );
  const driveCard =
    way !== "third" ? null : desk ? (
      <div
        key="drive"
        data-dx-read="the Drive card"
        data-dx-w=""
        className="col-span-2 grid grid-cols-[minmax(0,15rem)_1fr] gap-3 rounded-float bg-card p-2 ring-1 ring-foreground/10"
      >
        <FolderPicture wide />
        {drive ? (
          <div className="min-w-0 py-1 pr-2">{drive}</div>
        ) : (
          <div className="flex min-w-0 flex-col justify-center gap-0.5 py-1 pr-2">
            {driveWords}
            <div className="mt-3 flex flex-col items-start gap-1.5">
              <SendButton />
              {note ? (
                <span className="text-xs text-pretty text-muted-foreground">
                  {note}
                </span>
              ) : null}
            </div>
          </div>
        )}
      </div>
    ) : (
      <div
        key="drive"
        data-dx-read="the Drive card"
        data-dx-w=""
        className="flex flex-col gap-2.5 rounded-float bg-card p-2 ring-1 ring-foreground/10"
      >
        <FolderPicture wide={false} />
        {drive ? (
          <div className="px-1.5 pb-1">{drive}</div>
        ) : (
          <div className="flex items-center gap-3 px-1.5 pb-1">
            <div className="flex min-w-0 flex-1 flex-col gap-0.5">
              {driveWords}
            </div>
            <SendButton />
          </div>
        )}
        {note ? (
          <span className="px-1.5 pb-1 text-xs text-pretty text-muted-foreground">
            {note}
          </span>
        ) : null}
      </div>
    );
  const row =
    way === "row" ? (
      <div
        data-dx-read="the Drive row"
        data-dx-w=""
        className="flex items-center gap-3 rounded-float bg-card p-2.5 ring-1 ring-foreground/10"
      >
        <span className="flex size-9 shrink-0 items-center justify-center rounded-[calc(var(--radius-float)-4px)] bg-muted text-muted-foreground">
          <FolderUp className="size-4" />
        </span>
        <span className="flex min-w-0 flex-1 flex-col">
          <span className="text-sm font-medium">
            Send the originals to Google Drive
          </span>
          <span className="truncate text-xs text-muted-foreground tabular-nums">
            {driveFacts(connected)}
          </span>
        </span>
        <SendButton />
      </div>
    ) : null;
  const cards = desk ? [originals, phone] : [phone, originals];
  return (
    <>
      <div className={cn("gap-3", desk ? "grid grid-cols-2" : "flex flex-col")}>
        {cards}
        {driveCard}
      </div>
      {row}
    </>
  );
}

/** The panel's foot, as production's: the clips line and Include hidden items. */
function PanelFoot() {
  return (
    <>
      <p className="text-xs text-pretty text-muted-foreground">
        {`Clips come as they were taken: ${formatCount(ALBUM_COUNT.clips)} · ${formatBytes(ALBUM_BYTES.clips)}, with the originals.`}
      </p>
      <label className="flex items-center justify-between gap-3 text-sm">
        <span className="text-muted-foreground">Include hidden items</span>
        <Switch checked={false} aria-label="Include hidden items" />
      </label>
    </>
  );
}

/** The real popup, open, with its head; `up` makes it a level in. */
function Panel({
  title,
  description,
  up,
  children,
  footer,
}: {
  title: string;
  description?: string;
  up?: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <Popup open onOpenChange={() => {}}>
      <PopupContent kind="plan">
        <PopupHeader
          title={title}
          description={description}
          up={up ? { label: up, onUp: () => {} } : undefined}
        />
        <PopupBody className="flex flex-col gap-3">{children}</PopupBody>
        {footer ? <PopupFooter>{footer}</PopupFooter> : null}
      </PopupContent>
    </Popup>
  );
}

/** Take it home, open, with Drive its own way, before or after she connects. */
export function TakeHome({
  desk,
  way,
  connected,
  note,
  drive,
}: {
  desk: boolean;
  way: WayIn;
  connected: boolean;
  note?: string;
  drive?: ReactNode;
}) {
  return (
    <Panel
      title="Take it home"
      description={setNoun(ALBUM_COUNT.photos, ALBUM_COUNT.clips)}
    >
      <Sets
        desk={desk}
        way={way}
        connected={connected}
        note={note}
        drive={drive}
      />
      <PanelFoot />
    </Panel>
  );
}

/* ── connecting ───────────────────────────────────────────────────────── */

/** One promise line: its glyph and its words. */
function PromiseLine({
  icon,
  children,
}: {
  icon: ReactNode;
  children: ReactNode;
}) {
  return (
    <li className="flex items-start gap-3">
      <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-foreground [&_svg]:size-4">
        {icon}
      </span>
      <span className="pt-1.5 text-sm text-pretty">{children}</span>
    </li>
  );
}

/** Our promise, before Google's screen: what we make, what we see, how to end it. */
export function PromiseStep() {
  return (
    <Panel
      title="Send to Google Drive"
      up="Take it home"
      footer={
        <>
          <Button variant="outline">Not now</Button>
          <Button>Continue to Google</Button>
        </>
      }
    >
      <div data-dx-read="our promise" className="flex flex-col gap-4">
        <FolderPicture wide />
        <ul className="flex flex-col gap-3">
          <PromiseLine icon={<FolderUp />}>
            {`We make a Partyreel folder in your Drive and put ${EVENT.name} in it, every original.`}
          </PromiseLine>
          <PromiseLine icon={<EyeOff />}>
            We can only see what we put there. Never anything else in your
            Drive.
          </PromiseLine>
          <PromiseLine icon={<Unplug />}>
            Disconnect any time in Account. What we sent stays in your Drive.
          </PromiseLine>
        </ul>
        <p className="text-xs text-pretty text-muted-foreground">
          Google asks you to choose an account and to allow this next.
        </p>
      </div>
    </Panel>
  );
}

/** Google's lines, each said in our words first, so nothing on its screen surprises her. */
export function MirrorStep() {
  const line = (google: string, ours: string) => (
    <li className="flex flex-col gap-1 rounded-float bg-card p-3 ring-1 ring-foreground/10">
      <span className="text-xs text-muted-foreground">Google will say</span>
      <span className="text-sm font-medium text-pretty">{`“${google}”`}</span>
      <span className="text-sm text-pretty text-muted-foreground">{ours}</span>
    </li>
  );
  return (
    <Panel
      title="What Google will ask"
      up="Take it home"
      footer={
        <>
          <Button variant="outline">Not now</Button>
          <Button>Continue to Google</Button>
        </>
      }
    >
      <ul
        data-dx-read="Google's lines, said first"
        className="flex flex-col gap-2"
      >
        {line(
          "See, edit, create, and delete only the specific Google Drive files you use with this app",
          "Only the files Partyreel puts in your Drive: never anything else there.",
        )}
        {line(
          "See your primary Google Account email address",
          "So Account can show which Drive is connected.",
        )}
      </ul>
      <p className="text-xs text-pretty text-muted-foreground">
        Disconnect any time in Account. What we sent stays in your Drive.
      </p>
    </Panel>
  );
}

/**
 * THE FINAL PRESS, BACK FROM GOOGLE: whose Drive, its room, where the album
 * lands, and that the page can close.
 */
export function ConfirmStep() {
  return (
    <Panel
      title="Send to Google Drive"
      up="Take it home"
      footer={
        <Button>
          <FolderUp /> {`Send ${formatBytes(TOTAL_BYTES)}`}
        </Button>
      }
    >
      <div data-dx-read="the final press" className="flex flex-col gap-3">
        <div className="flex items-center gap-3 rounded-float bg-card p-3 ring-1 ring-foreground/10">
          <Avatar size="sm">
            <AvatarFallback className="text-[10px]">M</AvatarFallback>
          </Avatar>
          <span className="flex min-w-0 flex-1 flex-col">
            <span className="truncate text-sm font-medium">{HOST.email}</span>
            <span className="text-xs text-muted-foreground tabular-nums">
              {`Connected · ${formatBytes(DRIVE_FREE)} free in this Drive`}
            </span>
          </span>
          <Button variant="ghost" size="sm">
            Change
          </Button>
        </div>
        <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-sm">
          <dt className="text-muted-foreground">Sends</dt>
          <dd className="tabular-nums">
            {`${setNoun(ALBUM_COUNT.photos, ALBUM_COUNT.clips)} · ${formatBytes(TOTAL_BYTES)}, the originals`}
          </dd>
          <dt className="text-muted-foreground">Into</dt>
          <dd className="min-w-0 truncate">{`My Drive › Partyreel › ${EVENT.folder}`}</dd>
          <dt className="text-muted-foreground">Takes</dt>
          <dd>About 25 minutes</dd>
        </dl>
        <p className="text-xs text-pretty text-muted-foreground">
          You can close this page: it carries on, and we email you when every
          file is in your Drive and checked.
        </p>
      </div>
    </Panel>
  );
}

/**
 * GOOGLE'S OWN SCREEN, AS A STAND-IN: never drawn as Google's (no mark, no
 * look of theirs), only what it asks, so the step before it can be judged
 * against the words she will meet there.
 */
export function GoogleStandIn() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/60 p-6 text-foreground">
      <div
        data-dx-read="Google's own screen, a stand-in"
        className="flex w-full max-w-md flex-col gap-4 rounded-2xl border border-dashed border-foreground/25 bg-background p-6"
      >
        <span className="text-label font-semibold text-muted-foreground uppercase">
          {"Google’s own screen · a stand-in"}
        </span>
        <span className="text-base font-medium">
          Choose an account, then allow Partyreel to:
        </span>
        <ul className="flex list-disc flex-col gap-2 pl-5 text-sm text-pretty">
          <li>
            See, edit, create, and delete only the specific Google Drive files
            you use with this app
          </li>
          <li>See your primary Google Account email address</li>
        </ul>
        <span className="text-xs text-muted-foreground">
          Its Cancel returns her with nothing connected; its Continue returns
          her to Partyreel.
        </span>
      </div>
    </div>
  );
}
