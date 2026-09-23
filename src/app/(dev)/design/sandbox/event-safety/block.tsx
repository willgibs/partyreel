"use client";

import { type ReactNode } from "react";
import { Ban, DoorClosed, EyeOff, Images, Users } from "lucide-react";

import type { GridMedia } from "@/components/app/media-grid";
import { Button } from "@/components/ui/button";
import { floatingPanel } from "@/components/ui/floating-layer";
import { cn } from "@/lib/utils";

import { EVENT, type Person } from "./fixtures";
import { Face, SwitchRow } from "./host";
import type { ScreenId } from "./scene";

/**
 * THE BLOCK ITSELF: the sheet that says what leaves, the toast that undoes
 * it, and the menu row that asks a second time in place. Every one carries
 * the same facts, drawn from his answer ("Out, uploads removed"): the person
 * is out of THIS event, their uploads leave the album for Deleted (a host
 * removal, restorable), they come off the list and every count, and they meet
 * a plain closed door, never the word blocked.
 *
 * ★ A TYPED NAME HOLDS ON ONE BROWSER, AND THE SHEET SAYS SO WHERE IT IS
 * PRESSED. A block keys on the account, the confirmed address or the row,
 * never a device or an IP (device ids are capture-only, a venue shares one
 * IP), so on a names-only party it stops the browser Rick used and nothing
 * else. Require verified emails is offered right there, with its real cost:
 * everyone else who typed a name confirms an email at their next photo (the
 * mid-visit flip, `guest-flow.md`).
 */

const firstOf = (p: Person) => p.name.split(" ")[0];

/** A line of what leaves, with its glyph. */
function Leaves({ Icon, children }: { Icon: typeof Ban; children: ReactNode }) {
  return (
    <li className="flex items-start gap-3">
      <Icon className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden />
      <span className="text-sm text-pretty">{children}</span>
    </li>
  );
}

/** The uploads a block takes with it, as a strip of small tiles. */
function UploadStrip({ items }: { items: readonly GridMedia[] }) {
  return (
    <span className="mt-2 flex gap-1">
      {items.map((m) => (
        <span
          key={m.id}
          className="size-9 overflow-hidden bg-black/10"
          style={{ borderRadius: "var(--radius-tile)" }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element -- a local still standing in for a presigned photograph */}
          <img src={m.url} alt="" className="size-full object-cover" />
        </span>
      ))}
    </span>
  );
}

/**
 * THE ONE-BROWSER NOTE, with the switch that closes the gap. Drawn only for a
 * typed name on a party without Require verified emails.
 */
export function OneBrowserNote({
  person,
  compact = false,
}: {
  person: Person;
  compact?: boolean;
}) {
  return (
    <div className="space-y-3 rounded-lg border border-border bg-muted/40 p-3">
      <p className="text-sm text-pretty">
        <span className="font-medium">{`${person.name} typed a name, `}</span>
        <span className="text-muted-foreground">
          so this holds on the one browser they used. Under a new name, they
          could come back.
        </span>
      </p>
      {!compact && (
        <SwitchRow
          label="Require verified emails"
          description="Newcomers confirm an email first. Everyone who typed a name confirms one at their next photo."
          checked={false}
        />
      )}
    </div>
  );
}

/**
 * THE BLOCK'S SHEET (`confirm`), on the responsive Sheet: who, what leaves
 * with them, the one-browser note where it applies, then one red Block and a
 * way back out. Nothing happens until Block is pressed.
 */
export function BlockSheet({
  screen,
  person,
  uploads,
  typedParty,
}: {
  screen: ScreenId;
  person: Person;
  uploads: readonly GridMedia[];
  /** A names-only party: the note and its switch appear. */
  typedParty: boolean;
}) {
  const first = firstOf(person);
  return (
    <>
      <div className="es-scrim" />
      <div className="es-sheet" data-screen={screen} data-es-sheet>
        <div className="flex items-center gap-3 p-4 pb-0">
          <Face person={person} size="lg" />
          <div className="min-w-0">
            <p className="font-heading text-card-title font-medium text-foreground">
              {`Block ${person.name}?`}
            </p>
            <p className="truncate text-sm text-muted-foreground">
              {person.email ?? `From ${EVENT.name}`}
            </p>
          </div>
        </div>
        <ul className="flex flex-col gap-3.5 px-4">
          <Leaves Icon={DoorClosed}>
            {`They can't open the album, add or like anything in ${EVENT.name}.`}
          </Leaves>
          <Leaves Icon={Images}>
            {`Their ${uploads.length} uploads leave the album for Deleted, where you can restore any of them.`}
            <UploadStrip items={uploads} />
          </Leaves>
          <Leaves Icon={Users}>
            They come off the guest list and every count.
          </Leaves>
          <Leaves Icon={EyeOff}>
            They meet a closed album. Nothing tells them they were blocked.
          </Leaves>
        </ul>
        {typedParty && (
          <div className="px-4">
            <OneBrowserNote person={person} />
          </div>
        )}
        <div className="mt-auto flex flex-col gap-2 p-4">
          <Button
            variant="destructive"
            size="lg"
            className="w-full"
            tabIndex={-1}
            data-es-reach
          >
            <Ban /> {`Block ${first}`}
          </Button>
          <Button variant="ghost" size="lg" className="w-full" tabIndex={-1}>
            Cancel
          </Button>
        </div>
      </div>
    </>
  );
}

/**
 * AT ONCE, WITH UNDO (`undo`): the act has happened, and the toast is the only
 * record of it for the seconds it stands. The one-browser note has nowhere to
 * go but a second line under it.
 */
export function BlockToast({
  screen,
  person,
  uploads,
  typedParty,
}: {
  screen: ScreenId;
  person: Person;
  uploads: number;
  typedParty: boolean;
}) {
  return (
    <div className="es-toast" data-screen={screen} data-es-toast>
      <div className="flex items-start gap-3">
        <p className="min-w-0 flex-1">
          <span className="font-medium">
            {typedParty
              ? `${person.name} is out, on the browser they used.`
              : `${person.name} is out of this event.`}
          </span>{" "}
          <span className="text-muted-foreground">{`${uploads} uploads moved to Deleted.`}</span>
        </p>
        <Button size="sm" variant="outline" tabIndex={-1} data-es-reach className="shrink-0">
          Undo
        </Button>
      </div>
      {typedParty && (
        <p className="text-muted-foreground">
          A new name could get back in.{" "}
          <span className="font-medium text-foreground underline underline-offset-4">
            Require verified emails
          </span>
        </p>
      )}
    </div>
  );
}

/**
 * THE MENU ROW, ASKING A SECOND TIME IN PLACE (`inline`): the footer rail of
 * the person's menu grows into what leaves and one more tap. No sheet, no
 * toast, nothing left to dismiss.
 */
export function InlineConfirm({
  person,
  uploads,
  typedParty,
}: {
  person: Person;
  uploads: number;
  typedParty: boolean;
}) {
  const first = firstOf(person);
  return (
    <div className="space-y-2 px-2 py-2">
      <p className="text-sm text-pretty">
        <span className="font-medium text-destructive">{`Block ${first}?`}</span>{" "}
        <span className="text-muted-foreground">
          {`They go out, and their ${uploads} uploads move to Deleted.`}
          {typedParty && " Holds on the one browser used."}
        </span>
      </p>
      <div className="flex items-center justify-end gap-1.5">
        <Button variant="ghost" size="sm" tabIndex={-1}>
          Cancel
        </Button>
        <Button variant="destructive" size="sm" tabIndex={-1} data-es-reach>
          <Ban /> Block
        </Button>
      </div>
    </div>
  );
}

/**
 * THE WAY BACK, AS A CONFIRM (`ui/dialog.tsx`, centred, quoted): letting
 * someone back in, with whatever an option says about the uploads the block
 * removed. `body` is that option's sentence and control.
 */
export function UnblockDialog({
  screen,
  person,
  body,
  primary,
}: {
  screen: ScreenId;
  person: Person;
  body: ReactNode;
  primary: string;
}) {
  return (
    <>
      <div className="es-scrim" />
      <div
        className={cn("es-dialog", floatingPanel)}
        data-screen={screen}
        data-es-dialog
      >
        <div className="flex flex-col gap-2">
          <p className="font-heading text-card-title leading-none font-medium">
            {`Let ${person.name} back in?`}
          </p>
          <p className="text-sm text-muted-foreground">
            {`They can join ${EVENT.name} and add photos again.`}
          </p>
        </div>
        {body}
        <div className="es-dialog-foot">
          <Button variant="outline" tabIndex={-1}>
            Cancel
          </Button>
          <Button tabIndex={-1} data-es-reach>
            {primary}
          </Button>
        </div>
      </div>
    </>
  );
}
