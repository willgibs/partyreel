"use client";

import { type ReactNode, useEffect, useRef } from "react";
import {
  ChevronRight,
  DoorClosed,
  Globe,
  type LucideIcon,
  MailCheck,
  UserCheck,
} from "lucide-react";

import { VisibilitySelector } from "@/components/app/visibility-selector";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { VISIBILITY_HINTS } from "@/lib/events/visibility-labels";
import { UPLOAD_CAP_PRESETS } from "@/lib/media/limits";
import { cn } from "@/lib/utils";

import { EVENT } from "./fixtures";
import { Hub, SwitchRow } from "./host";
import type { ScreenId } from "./scene";

/**
 * THE EVENT'S SETTINGS SHEET, QUOTED (`event-settings-sheet.tsx` over
 * `EventSettingsForm`): the responsive Sheet over the hub, its header, and the
 * cards in the form's own order. The real form needs a `FormProvider`, a
 * server action and `ConfirmSwitch`'s dialog, and a portal would leave the
 * frame, so the cards are redrawn from the same primitives (`Card`, `Switch`,
 * the shipped `VisibilitySelector` itself) with the shipped words.
 *
 * ★ EVERY DOOR ON THIS BOARD IS FREE ON EVERY PLAN (his answer, "Both free on
 * every plan"), so no lock chip and no upgrade prompt appears anywhere here.
 */

export type JoinId = "anyone" | "approve" | "closed" | "list";

const JOIN: readonly {
  id: JoinId;
  label: string;
  Icon: LucideIcon;
  hint: string;
}[] = [
  {
    id: "anyone",
    label: "Anyone with the link",
    Icon: Globe,
    hint: "Anyone with the link or the code can join.",
  },
  {
    id: "approve",
    label: "Approve newcomers",
    Icon: UserCheck,
    hint: "Newcomers confirm an email, then wait for you to let them in.",
  },
  {
    id: "closed",
    label: "Closed to newcomers",
    Icon: DoorClosed,
    hint: "Everyone already in keeps going. Nobody new can join.",
  },
  {
    id: "list",
    label: "An invite list",
    Icon: MailCheck,
    hint: "Only the addresses on your list can confirm in.",
  },
];

/** Approving and a list both work on a proved address, so they hold the switch on. */
export const needsVerified = (join: JoinId) =>
  join === "approve" || join === "list";

/**
 * "WHO CAN JOIN?" as the visibility selector's own material: the muted track
 * and the lifted segment (`visibility-selector.tsx`), stood on end because
 * four labels this long do not fit the sheet's 28rem across without being cut
 * ("Approve newc..." was the first draft's finding). Its hint line speaks for
 * the chosen one, the way `VISIBILITY_HINTS` does for visibility.
 */
export function JoinChoice({
  value,
  after,
}: {
  value: JoinId;
  /** What stands under the hint for the chosen one (a count, the list). */
  after?: ReactNode;
}) {
  const chosen = JOIN.find((j) => j.id === value)!;
  return (
    <div className="space-y-3">
      <p className="text-sm leading-none font-medium">Who can join?</p>
      <div className="flex flex-col gap-1 rounded-lg bg-muted p-1">
        {JOIN.map(({ id, label, Icon }) => (
          <span
            key={id}
            data-state={id === value ? "on" : "off"}
            className={cn(
              "flex items-center gap-2 rounded-md px-2.5 py-1.5 text-sm font-medium text-muted-foreground",
              "data-[state=on]:bg-background data-[state=on]:text-foreground",
            )}
          >
            <Icon className="size-3.5 shrink-0" aria-hidden />
            {label}
          </span>
        ))}
      </div>
      <p className="text-sm text-muted-foreground">{chosen.hint}</p>
      {after}
    </div>
  );
}

/** The visibility row exactly as the form draws it: the selector and its hint. */
function WhoCanSee() {
  return (
    <div className="space-y-3">
      <p className="text-sm leading-none font-medium">Who can see this album?</p>
      <VisibilitySelector value="open" onValueChange={() => {}} />
      <p className="text-sm text-muted-foreground">{VISIBILITY_HINTS.open}</p>
    </div>
  );
}

/** Visibility & access, with whatever a decision adds under the selector. */
export function AccessCard({
  children,
  title = "Visibility & access",
  description = "Control who can see the album.",
}: {
  children?: ReactNode;
  title?: string;
  description?: string;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <WhoCanSee />
        {children}
      </CardContent>
    </Card>
  );
}

/**
 * GUEST UPLOADS, the shipped card's switches in the shipped order: pause,
 * the size cap, Review, the two that shape the door, then whatever a decision
 * adds. `verifiedLock` is the reason Require verified emails cannot be turned
 * off while approving or a list needs it; `door` false leaves the two
 * door switches out (they moved into The door).
 */
export function UploadsCard({
  verifiedLock,
  door = true,
  extra,
}: {
  verifiedLock?: string;
  door?: boolean;
  extra?: ReactNode;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Guest uploads</CardTitle>
        <CardDescription>Control whether and how guests contribute.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <SwitchRow
          label="Accepting uploads"
          description="Turn off to freeze the album. Guests can still view it."
          checked
        />
        <div className="space-y-1.5">
          <p className="text-sm leading-none font-medium">Max size per upload</p>
          <span className="flex h-8 w-full items-center rounded-lg border border-input px-2.5 text-sm">
            {UPLOAD_CAP_PRESETS[0].label}
          </span>
        </div>
        <SwitchRow
          label="Review uploads before they appear"
          description="Hold new photos for your approval instead of showing them live."
          checked={false}
        />
        {door && (
          <>
            <SwitchRow
              label="Require verified emails"
              description="Guests confirm their email once before they see the full album or add photos."
              checked
              locked={verifiedLock}
            />
            <SwitchRow
              label="Require an upload to view"
              description="Guests add one photo or video before they can see the full album."
              checked={false}
            />
          </>
        )}
        {extra}
      </CardContent>
    </Card>
  );
}

/**
 * A ROW THAT OPENS SOMETHING, inside a card: a label, its value, a chevron.
 * The Blocked row and the invite list's Edit both wear it.
 */
export function OpenRow({
  label,
  value,
  reach,
}: {
  label: string;
  value: string;
  reach?: boolean;
}) {
  return (
    <span
      data-es-reach={reach ? "" : undefined}
      className="flex items-center justify-between gap-3 rounded-lg border border-border px-3 py-2.5"
    >
      <span className="text-sm font-medium">{label}</span>
      <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
        {value}
        <ChevronRight className="size-4" aria-hidden />
      </span>
    </span>
  );
}

/**
 * SCROLLS ITS OWN CONTAINER TO ITSELF, ONCE THE FRAME HAS SETTLED. A sheet's
 * card a decision is about can sit below the fold of a phone's bottom sheet,
 * and a picture that starts on the Details card shows the wrong question. It
 * scrolls the nearest scrolling ancestor (the sheet), else the frame's own
 * window, and re-runs as the webfont lands; a second run is a no-op.
 */
export function ScrollHere({ offset = 12 }: { offset?: number }) {
  const ref = useRef<HTMLSpanElement | null>(null);
  useEffect(() => {
    const el = ref.current;
    const win = el?.ownerDocument.defaultView;
    if (!el || !win) return;
    const go = () => {
      let box: HTMLElement | null = el.parentElement;
      while (box) {
        const oy = win.getComputedStyle(box).overflowY;
        if ((oy === "auto" || oy === "scroll") && box.scrollHeight > box.clientHeight)
          break;
        box = box.parentElement;
      }
      const top = el.getBoundingClientRect().top;
      if (box) box.scrollTop += top - box.getBoundingClientRect().top - offset;
      else win.scrollTo(0, win.scrollY + top - offset);
    };
    go();
    const timers = [150, 600, 1500].map((ms) => win.setTimeout(go, ms));
    win.document.fonts?.ready.then(go).catch(() => {});
    return () => timers.forEach((t) => win.clearTimeout(t));
  }, [offset]);
  return <span ref={ref} aria-hidden className="block h-0" />;
}

/**
 * THE SHEET ITSELF over the hub: the scrim, the responsive panel (`es-sheet`,
 * a bottom sheet in a hand and a side panel at a desk), its title and the
 * event it governs, then the cards. The Details card stands first, folded to
 * its fields, because it is first in the real form.
 */
export function SettingsSheet({
  screen,
  children,
  overlay,
}: {
  screen: ScreenId;
  children: ReactNode;
  overlay?: ReactNode;
}) {
  return (
    <Hub
      screen={screen}
      overlay={
        <>
          <div className="es-scrim" />
          <div className="es-sheet" data-screen={screen} data-es-sheet>
            <div className="flex flex-col gap-0.5 p-4">
              <p className="font-heading text-card-title font-medium text-foreground">
                Settings
              </p>
              <p className="text-sm text-muted-foreground">{EVENT.name}</p>
            </div>
            <div className="flex flex-col gap-6 px-4 pb-6">
              <Card>
                <CardHeader>
                  <CardTitle>Details</CardTitle>
                  <CardDescription>
                    {`${EVENT.name} · ${EVENT.date}`}
                  </CardDescription>
                </CardHeader>
              </Card>
              {children}
              <div className="flex justify-end">
                <Button size="sm" tabIndex={-1}>
                  Save changes
                </Button>
              </div>
            </div>
          </div>
          {overlay}
        </>
      }
    />
  );
}
