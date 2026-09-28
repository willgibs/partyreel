"use client";

import { type ReactNode, useEffect, useRef } from "react";
import {
  ChevronRight,
  Clapperboard,
  DoorClosed,
  Globe,
  type LucideIcon,
  MailCheck,
  UserCheck,
  Users,
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
import { guestExperienceSummary } from "@/lib/events/guest-experience-summary";
import { VISIBILITY_HINTS } from "@/lib/events/visibility-labels";
import { UPLOAD_CAP_PRESETS } from "@/lib/media/limits";
import { cn } from "@/lib/utils";

import { EVENT } from "./fixtures";
import { Hub, SwitchRow } from "./host";
import { PopupQuote } from "./kinds";
import type { ScreenId } from "./scene";

/**
 * THE EVENT'S SETTINGS, AS THE SETTINGS KIND (`event-settings-sheet.tsx`:
 * `PopupContent kind="settings" routed`, popups-wiring `3e7952e3`): his
 * unfocused panel beside the album at a desk, and in a hand the whole screen
 * under a back arrow that names the event. The shape is read off the one table
 * (`kinds.tsx`), so this board moves when the kind does. The cards inside are
 * `EventSettingsForm`'s in its own order with its own words (Details, Visibility
 * & access, Guest uploads, its one Save), then the instant cards and the Danger
 * zone last, redrawn from the same primitives (`Card`, `Switch`, the shipped
 * `VisibilitySelector` itself, the summary line from `guestExperienceSummary`):
 * the real form needs a `FormProvider`, a Server Function and `ConfirmSwitch`'s
 * dialog, and a proposal has to stand inside its cards.
 *
 * ★ EVERY DOOR ON THIS BOARD IS FREE ON EVERY PLAN (his answer, "Both free on
 * every plan"), so no lock chip and no upgrade prompt appears anywhere here;
 * Maya's plan carries video, so the cards show none of their own either.
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
 * four labels this long do not fit the panel's 28rem across without being cut
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
      <p className="text-sm leading-none font-medium">
        Who can see this album?
      </p>
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
 * GUEST UPLOADS, the shipped card (`uploads-section.tsx`) in its own order and
 * words: pause, the size cap, Review, the two that shape the door (each a
 * `ConfirmSwitch`, its shield after the label), whatever a decision adds, the
 * live line that says what a guest will meet, and the video status.
 * `verifiedLock` is the reason Require verified emails cannot be turned off
 * while approving or a list needs it; `door` false leaves the two door
 * switches out (they moved into The door).
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
        <CardDescription>
          Control whether and how guests contribute.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <SwitchRow
          label="Accepting uploads"
          description="Turn off to freeze the album. Guests can still view it."
          checked
        />
        <div className="grid gap-2">
          <p className="text-sm leading-none font-medium">
            Max size per upload
          </p>
          <span className="flex h-8 w-full items-center rounded-lg border border-input px-2.5 text-sm">
            {UPLOAD_CAP_PRESETS[0].label}
          </span>
          <p className="text-sm text-muted-foreground">
            Cap how large any single guest upload can be, so one guest
            can&rsquo;t fill your storage. Your own uploads aren&rsquo;t
            affected.
          </p>
        </div>
        <SwitchRow
          label="Review uploads before they appear"
          description="Hold new photos for your approval instead of showing them live."
          checked={false}
          guarded
        />
        {door && (
          <>
            <SwitchRow
              label="Require verified emails"
              description="On (recommended): guests confirm their email once before they see the full album or add photos (a few previews show first), so every upload has a verified email behind it. Off: guests type a display name and add photos straight away, with nothing to prove who they are."
              checked
              locked={verifiedLock}
              guarded
            />
            <SwitchRow
              label="Require an upload to view"
              description="On: guests add one photo or video before they can see the full album, so nobody just looks. Off (the default): the album opens once a guest has given a name, or confirmed their email."
              checked={false}
              guarded
            />
          </>
        )}
        {extra}
        <p className="text-sm text-muted-foreground">
          {guestExperienceSummary({
            visibility: "open",
            requireVerifiedEmail: true,
            acceptingUploads: true,
            requireUploadToView: false,
          })}
        </p>
        <div className="flex items-center justify-between gap-4">
          <div className="space-y-0.5">
            <p className="text-sm font-medium">Video uploads</p>
            <p className="text-sm text-muted-foreground">
              Guests and you can upload photos and video.
            </p>
          </div>
          <span className="shrink-0 rounded-full border border-border px-2.5 py-0.5 text-xs text-muted-foreground">
            Photos &amp; video
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * A ROW THAT OPENS SOMETHING, inside a card: a label, its value, a chevron.
 * The Blocked row wears it.
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
 * SCROLLS ITS OWN CONTAINER TO ITSELF, ONCE THE FRAME HAS SETTLED. A card a
 * decision is about can sit below the fold of the settings' own scroller, and
 * a picture that starts on the Details card shows the wrong question. It
 * scrolls the nearest scrolling ancestor (the panel's or the screen's body),
 * else the frame's own window, and re-runs as the webfont lands; a second run
 * is a no-op.
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
        if (
          (oy === "auto" || oy === "scroll") &&
          box.scrollHeight > box.clientHeight
        )
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

/** A card the decision is not about, folded to its head (the order is still the form's). */
function FoldedCard({
  title,
  Icon,
  description,
  destructive = false,
}: {
  title: string;
  Icon?: LucideIcon;
  description: string;
  destructive?: boolean;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className={cn(destructive && "text-destructive")}>
          {Icon ? (
            <span className="flex items-center gap-2">
              <Icon className="size-4 text-muted-foreground" aria-hidden />
              {title}
            </span>
          ) : (
            title
          )}
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
    </Card>
  );
}

/**
 * THE SETTINGS OVER THE HUB, IN THE SETTINGS KIND: its title and the event it
 * governs (a hand's bar also naming the event its back arrow returns to), then
 * the form's cards with the decision's own drawn between Details and the Save,
 * then the reel, Profile & guests and the Danger zone, folded to their heads
 * because nothing here is about them. `overlay` is what a decision stands over
 * the settings (the blocked list, a confirm).
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
          <PopupQuote
            kind="settings"
            screen={screen}
            title="Settings"
            description={EVENT.name}
            back={EVENT.name}
            bodyClassName="flex flex-col gap-6 pb-6"
          >
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Details</CardTitle>
                  <CardDescription>
                    What guests see when they land on the join page.
                  </CardDescription>
                </CardHeader>
              </Card>
              {children}
              <div className="flex justify-end">
                <Button tabIndex={-1}>Save changes</Button>
              </div>
            </div>
            <FoldedCard
              title="Highlight reel"
              Icon={Clapperboard}
              description="The album’s own reel, made from every photo guests can see."
            />
            <FoldedCard
              title="Profile & guests"
              Icon={Users}
              description="How this event shows up beyond its own link."
            />
            <FoldedCard
              title="Danger zone"
              description="Deleting an event removes it and frees up a slot on your plan."
              destructive
            />
          </PopupQuote>
          {overlay}
        </>
      }
    />
  );
}
