"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown, ChevronUp, X } from "lucide-react";

import { settingsPageHref } from "@/components/app/event-settings/settings-pages";
import { useHostAdd } from "@/components/app/host-add-provider";
import {
  PricingSheet,
  type PricingPlanFacts,
} from "@/components/app/pricing/pricing-sheet";
import { useEventShare } from "@/components/app/share/event-share-provider";
import { InviteButton } from "@/components/app/share/invite-button";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { trackAttrs } from "@/lib/analytics/events";
import { playableCount, REEL_MINIMUM } from "@/lib/event/reel-progress";
import {
  CHECKLIST_OFF_COOKIE,
  CHECKLIST_OFF_SECONDS,
  checklistOffPath,
  type Readiness,
  type ReadyAction,
  type ReadyFacts,
  type ReadyItem,
  readiness,
  readyHead,
  readyNext,
} from "@/lib/events/readiness";
import { formatCount } from "@/lib/format/count";
import { RangeText } from "@/lib/format/range-text";
import { cn } from "@/lib/utils";

import { useHostAlbum, useHubCounts, useHubEntries } from "./host-album";

/**
 * THE FACTS WITH THE ALBUM'S OWN COUNTS OVER THEM: the album's count and how many of its items can play,
 * read off the page's album store (the Reel card's own reading, `useLiveReel`), so a photo that lands
 * while the host looks ticks the first photos with nothing refreshed. Outside the hub's store (the
 * Library) the server's facts stand as they were read.
 */
export function useLiveReadyFacts(facts: ReadyFacts): ReadyFacts {
  const album = useHostAlbum();
  const counts = useHubCounts(album);
  const entries = useHubEntries(album);
  return {
    ...facts,
    approved: counts?.album ?? facts.approved,
    playable: entries ? playableCount(entries, REEL_MINIMUM) : facts.playable,
  };
}

/**
 * THE CHECKLIST AT THE HEAD OF THE HUB, ONE LINE (Will, event-ready `list=head`, 2026-10-02; create-wizard r5's
 * `arrival=done`, 2026-10-07): under the cards on every visit, folded to one line from her first, "Ready for guests"
 * with the one thing worth doing next and its door beside it (the share's Invite on a new event), Show opening the
 * rest; gone once nothing is left. It retired the launch list, which left with the first photo, done or not, and the
 * whole list a new event met her with, "2 of 3", the halfway her trial run felt.
 *
 * ★ ONE FUNCTION UNDER IT (`lib/events/readiness.ts`): Settings' rail, the Settings card and the dashboard's stage
 * read the same items, so a tick here is a tick there. Its facts are the server's, with the album's own live counts
 * laid over them (the page's album store, as the Review and Reel cards read it), so the first photos tick the moment
 * the reel starts playing, with nothing refreshed.
 *
 * ★ READY FIRST, THEN WHAT IS WORTH DOING. A new event is ready the minute Create makes it (a guest who scanned could
 * get in and add), so the line greets her made event as ready and names the next thing worth doing as what it
 * brings (`readyNext`): the code's share first ("Your code is all they need"), then the first photos, then the welcome.
 * While a guest still needs something (a door nobody can pass, paused uploads, a full shelf) the line says that
 * first, ringed, in its own words. How the checklist enters the event is the event-page board's to draw; this is the
 * line, and the list behind it.
 *
 * ★ IT LEAVES ON A LATER VISIT, NEVER UNDER HER EYES: a line she finishes while looking stays, ticked, until she
 * leaves; the next visit no longer draws it. And from the day after the event's date it is not drawn at all
 * (`checklistOver`): getting ready is moot once the party has happened.
 *
 * ★ SHE MAY DISMISS IT, AND IT STAYS GONE FOR THAT EVENT (Will, 2026-10-07: a confident host need not "always have to
 * stare at a pending checklist"): the line's quiet close puts it away for good in this browser, the page told by a
 * cookie on the event's own pages (`CHECKLIST_OFF_COOKIE`), so it is never drawn and never flashes on a later visit.
 * Anything that truly needs her says so in its own place (the door's corner, Review's count, a paused code).
 *
 * ★ IT READS ITS OWN WIDTH, NOT THE SCREEN'S: a container query lays the line's words and the list's rows out where
 * it has the room (the hub at a desk) and stacks them where it has not (a phone).
 */
export function EventChecklist({
  eventId,
  facts,
  over,
  plan,
  dismissed = false,
}: {
  eventId: string;
  /** The event's facts as the server read them; the album's live counts ride over them. */
  facts: ReadyFacts;
  /** The event's date is behind the viewer's today (`checklistOver`): the list is not drawn. */
  over: boolean;
  /** What the room row's plan sheet opens on. */
  plan: PricingPlanFacts;
  /** She dismissed it for this event, as the page read it from her browser (`CHECKLIST_OFF_COOKIE`). */
  dismissed?: boolean;
}) {
  const live = useLiveReadyFacts(facts);
  const r = readiness(live);
  const [gone, setGone] = useState(dismissed);
  const left = !over && !gone && r.left.length > 0;

  // Drawn once with something left, it stays for the visit (the header's "never under her eyes").
  const [seen, setSeen] = useState(left);
  if (left && !seen) setSeen(true);
  const [open, setOpen] = useState(false);

  // Focus follows the fold: the control pressed is gone with the shape it stood in.
  const toggle = useRef<HTMLButtonElement | null>(null);
  const toggled = useRef(false);
  useEffect(() => {
    if (!toggled.current) return;
    toggled.current = false;
    toggle.current?.focus({ preventScroll: true });
  }, [open]);

  if (over || gone || (!left && !seen)) return null;

  const flip = (next: boolean) => {
    toggled.current = true;
    setOpen(next);
  };

  /** Put away for good, in this browser: the page is told on her next visit, and focus moves on with her. */
  const dismiss = (line: HTMLElement | null) => {
    try {
      document.cookie = `${CHECKLIST_OFF_COOKIE}=1; Path=${checklistOffPath(eventId)}; Max-Age=${CHECKLIST_OFF_SECONDS}; SameSite=Lax`;
    } catch {
      // No cookie jar: it is gone for this visit, and comes back on the next.
    }
    // The control she pressed leaves with the line: her focus goes on to what follows it on the page.
    const after = line?.nextElementSibling?.querySelector<HTMLElement>(
      "a[href], button:not([disabled]), [tabindex]:not([tabindex='-1'])",
    );
    setGone(true);
    after?.focus({ preventScroll: true });
  };

  if (!open) {
    return (
      <ChecklistLine
        r={r}
        eventId={eventId}
        plan={plan}
        toggleRef={toggle}
        onShow={() => flip(true)}
        onDismiss={dismiss}
      />
    );
  }
  return (
    <ChecklistList
      r={r}
      eventId={eventId}
      plan={plan}
      toggleRef={toggle}
      onHide={() => flip(false)}
    />
  );
}

function Tick({ done }: { done: boolean }) {
  return done ? (
    <span
      aria-hidden
      className="mt-px flex size-5 shrink-0 items-center justify-center rounded-full bg-success text-success-foreground"
    >
      <Check className="size-3.5" strokeWidth={3} />
    </span>
  ) : (
    <span
      aria-hidden
      className="mt-px size-5 shrink-0 rounded-full ring-[1.5px] ring-foreground/25 ring-inset"
    />
  );
}

/** What a guest needs, done of how many: a full bar is ready. */
function Bar({ r }: { r: Readiness }) {
  const pct = Math.round((r.needed.done / r.needed.of) * 100);
  return (
    <span
      aria-hidden
      className="block h-1.5 overflow-hidden rounded-full bg-muted"
    >
      <span
        className={cn(
          "block h-full rounded-full transition-[width,background-color] duration-300 ease-emphasis motion-reduce:transition-none",
          r.ready ? "bg-success" : "bg-foreground/70",
        )}
        style={{ width: `${Math.max(pct, 4)}%` }}
      />
    </span>
  );
}

/**
 * One row: its tick, its title and its line, and the doors that finish it. One door stands beside the
 * line; two stand under it, indented past the tick, so a phone's line keeps its width (the code's
 * Invite and Print beside it left the line three words wide at 375).
 */
function Row({
  item,
  eventId,
  plan,
}: {
  item: ReadyItem;
  eventId: string;
  plan: PricingPlanFacts;
}) {
  const under = item.actions.length > 1;
  return (
    <li
      data-checklist-item={item.id}
      data-done={item.done ? "" : undefined}
      className={cn(
        "flex gap-3 px-4 py-3 @3xl:flex-col @3xl:gap-2 @3xl:py-3.5",
        under ? "flex-col gap-2" : "items-start",
      )}
    >
      <span className="flex min-w-0 flex-1 items-start gap-3 @3xl:w-full">
        <Tick done={item.done} />
        <span className="min-w-0 flex-1 space-y-0.5">
          <span
            className={cn(
              "block text-sm font-medium",
              item.done && "text-muted-foreground",
            )}
          >
            <span className="sr-only">{item.done ? "Done: " : "To do: "}</span>
            {item.title}
          </span>
          <span className="block text-caption text-pretty text-muted-foreground">
            <RangeText text={item.line} />
          </span>
        </span>
      </span>
      {item.actions.length > 0 ? (
        <span
          className={cn(
            "flex shrink-0 flex-wrap gap-1.5 @3xl:justify-start @3xl:pl-8",
            under ? "pl-8" : "justify-end",
          )}
        >
          {item.actions.map((action, i) => (
            <ActionDoor
              key={action.to}
              action={action}
              primary={item.essential && i === 0}
              eventId={eventId}
              plan={plan}
            />
          ))}
        </span>
      ) : null}
    </li>
  );
}

/** A Settings page this item is finished on: `door`, `adds` or `event`. */
type PageTarget = Extract<ReadyAction["to"], "door" | "adds" | "event">;

/**
 * THE DOOR THAT FINISHES A ROW, each a real destination: a Settings page opened over the album (a link
 * that is real, so a modified click opens it in a tab, as the Settings card's does), the album's own
 * uploader, the code card, the print sheet in a tab of its own (the album survives the print dialog),
 * and the plans where the host stands.
 */
function ActionDoor({
  action,
  primary,
  eventId,
  plan,
}: {
  action: ReadyAction;
  primary: boolean;
  eventId: string;
  plan: PricingPlanFacts;
}) {
  const variant = primary ? "default" : "outline";
  switch (action.to) {
    case "door":
    case "adds":
    case "event":
      return (
        <SettingsDoor
          page={action.to}
          label={action.label}
          variant={variant}
          eventId={eventId}
        />
      );
    case "add-photos":
      return <AddPhotosDoor label={action.label} variant={variant} />;
    case "invite":
      // Every door onto the code card reads Invite and is this one button (`share=card`).
      return <InviteButton location="hub-checklist" />;
    case "print":
      return (
        <Button size="sm" variant={variant} asChild>
          <Link
            href={`/dashboard/${eventId}/print`}
            target="_blank"
            rel="noopener noreferrer"
            {...trackAttrs("cta_click", {
              cta: "print-stock",
              location: "hub-checklist",
            })}
          >
            {action.label}
          </Link>
        </Button>
      );
    case "plans":
      return (
        <PricingSheet
          trigger={{ kind: "room" }}
          plan={plan}
          returnTo={`/dashboard/${eventId}`}
        >
          <Button size="sm" variant={variant}>
            {action.label}
          </Button>
        </PricingSheet>
      );
  }
}

function SettingsDoor({
  page,
  label,
  variant,
  eventId,
}: {
  page: PageTarget;
  label: string;
  variant: "default" | "outline";
  eventId: string;
}) {
  const { openSheet, openSettingsPage } = useEventShare();
  return (
    <Button size="sm" variant={variant} asChild>
      <Link
        href={settingsPageHref(eventId, page)}
        onClick={(e) => {
          // A modified click is a real navigation, as the Settings card's is.
          if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
          e.preventDefault();
          openSheet("settings");
          openSettingsPage(page);
        }}
        {...trackAttrs("cta_click", {
          cta: `checklist-${page}`,
          location: "hub-checklist",
        })}
      >
        {label}
      </Link>
    </Button>
  );
}

function AddPhotosDoor({
  label,
  variant,
}: {
  label: string;
  variant: "default" | "outline";
}) {
  const add = useHostAdd();
  return (
    <Button
      size="sm"
      variant={variant}
      // The album's own uploader, opened and brought into view (the Reel card's door does the same).
      onClick={add?.openAdd}
      disabled={!add}
      {...trackAttrs("cta_click", {
        cta: "add-photos",
        location: "hub-checklist",
      })}
    >
      {label}
    </Button>
  );
}

/** One group of the list: its name and its rows (what a guest needs, or what is worth doing). */
function Group({
  label,
  items,
  wide,
  eventId,
  plan,
  first,
}: {
  label: string;
  items: readonly ReadyItem[];
  /** Its share of the row where the list has the room: its columns. */
  wide: string;
  eventId: string;
  plan: PricingPlanFacts;
  /** The first group: no rule over it where the two stand side by side. */
  first: boolean;
}) {
  if (items.length === 0) return null;
  return (
    <div
      className={cn(
        "border-t border-border",
        !first && "@3xl:border-t-0 @3xl:border-l",
      )}
    >
      <p className="px-4 pt-2.5 text-label font-semibold text-muted-foreground uppercase @3xl:pt-3">
        {label}
      </p>
      <ol
        aria-label={label}
        className={cn(
          "divide-y divide-border @3xl:grid @3xl:divide-x @3xl:divide-y-0",
          wide,
        )}
      >
        {items.map((item) => (
          <Row key={item.id} item={item} eventId={eventId} plan={plan} />
        ))}
      </ol>
    </div>
  );
}

/**
 * The whole list behind the line: its head, its bar and its two groups. ★ ONCE SHE IS READY, WHAT IS WORTH DOING
 * LEADS (r5's `done`, as the board drew it): what a guest needs stands under it, every row ticked, the event set; while
 * a guest still needs something, that leads instead.
 */
function ChecklistList({
  r,
  eventId,
  plan,
  toggleRef,
  onHide,
}: {
  r: Readiness;
  eventId: string;
  plan: PricingPlanFacts;
  toggleRef: React.Ref<HTMLButtonElement>;
  /** Folds it back to its one line. */
  onHide: () => void;
}) {
  const head = readyHead(r);
  const needed = r.items.filter((i) => i.essential);
  const worth = r.items.filter((i) => !i.essential);
  const groups = [
    {
      label: "What a guest needs",
      items: needed,
      wide: needed.length > 2 ? "@3xl:grid-cols-3" : "@3xl:grid-cols-2",
    },
    {
      label: "Worth doing",
      items: worth,
      wide: worth.length > 3 ? "@3xl:grid-cols-4" : "@3xl:grid-cols-3",
    },
  ];
  if (r.ready) groups.reverse();
  // Side by side, each group takes the row's width by how many rows it holds, whichever leads.
  const cols = `${groups[0]!.items.length || 1}fr ${groups[1]!.items.length || 1}fr`;
  return (
    <Card
      size="sm"
      role="region"
      data-checklist=""
      data-ready={r.ready ? "" : undefined}
      aria-label={head.title}
      className="@container gap-0 py-0"
    >
      <div className="space-y-2.5 px-4 pt-3.5 pb-3">
        <div className="flex items-start justify-between gap-3">
          <div data-checklist-head="" className="min-w-0 space-y-0.5">
            <h2 className="flex items-center gap-1.5 font-heading text-card-title">
              {r.ready ? (
                <Check
                  className="size-4 shrink-0 text-success"
                  strokeWidth={3}
                  aria-hidden
                />
              ) : null}
              {head.title}
            </h2>
            <p className="text-caption text-pretty text-muted-foreground">
              {head.line}
            </p>
          </div>
          <span className="flex shrink-0 items-center gap-1">
            <span className="pt-1 text-xs text-muted-foreground tabular-nums">
              <span className="sr-only">What guests need: </span>
              {`${formatCount(r.needed.done)} of ${formatCount(r.needed.of)}`}
            </span>
            <Button
              ref={toggleRef}
              size="icon-sm"
              variant="ghost"
              aria-expanded
              aria-label="Fold the checklist"
              onClick={onHide}
              // Expanded is its only state: the ghost's open fill would read as pressed for good.
              className="text-muted-foreground aria-expanded:bg-transparent aria-expanded:text-muted-foreground"
            >
              <ChevronUp />
            </Button>
          </span>
        </div>
        <Bar r={r} />
      </div>
      <div
        style={{ "--checklist-cols": cols } as React.CSSProperties}
        className="@3xl:grid @3xl:grid-cols-(--checklist-cols)"
      >
        {groups.map((g, i) => (
          <Group
            key={g.label}
            label={g.label}
            items={g.items}
            wide={g.wide}
            eventId={eventId}
            plan={plan}
            first={i === 0}
          />
        ))}
      </div>
    </Card>
  );
}

/**
 * THE LINE, as she meets it on every visit: its mark (the head's tick once ready, a ring for how far she is until
 * then), the head and what comes next, said as what it brings, with that thing's one door raised over the line, and
 * Show. ★ THE WHOLE LINE IS THE TOGGLE (a summary that opens its list): a phone's thumb meets it anywhere, the door the
 * one place it does not (a sibling over the toggle's band, never a button inside a button), and at a phone's width the
 * word Show gives its room to the words, its chevron staying.
 */
function ChecklistLine({
  r,
  eventId,
  plan,
  toggleRef,
  onShow,
  onDismiss,
}: {
  r: Readiness;
  eventId: string;
  plan: PricingPlanFacts;
  toggleRef: React.Ref<HTMLButtonElement>;
  onShow: () => void;
  /** Puts the line away for this event, handed the line so focus can go on past it. */
  onDismiss: (line: HTMLElement | null) => void;
}) {
  const lineRef = useRef<HTMLDivElement | null>(null);
  const head = readyHead(r);
  const next = readyNext(r);
  const words = next ? next.words : head.line;
  const action = next?.item.actions[0] ?? null;
  return (
    <Card
      ref={lineRef}
      size="sm"
      role="region"
      data-checklist=""
      data-checklist-folded=""
      data-ready={r.ready ? "" : undefined}
      data-checklist-next={next?.item.id}
      aria-label={head.title}
      className="@container relative gap-0 py-0"
    >
      <button
        ref={toggleRef}
        type="button"
        aria-expanded={false}
        // The line's own words are beside it, not in it: its name says them, the visible Show last (label in name).
        aria-label={`${head.title}. ${words} Show`}
        onClick={onShow}
        className="absolute inset-0 focus-halo rounded-[inherit] transition-colors duration-150 outline-none hover:bg-muted/40 motion-reduce:transition-none"
      />
      <span className="pointer-events-none relative flex items-center gap-3 px-4 py-2.5">
        {r.ready ? (
          <Check
            className="size-4 shrink-0 text-success"
            strokeWidth={3}
            aria-hidden
          />
        ) : (
          <Ring r={r} />
        )}
        <span
          data-checklist-head=""
          aria-hidden
          className="min-w-0 flex-1 text-sm text-pretty @xl:flex @xl:items-baseline @xl:gap-1.5"
        >
          <span className="block font-medium @xl:shrink-0">{head.title}</span>
          <span className="block text-muted-foreground">{words}</span>
        </span>
        {action && next ? (
          <span className="pointer-events-auto relative shrink-0">
            <ActionDoor
              action={action}
              primary={next.item.essential}
              eventId={eventId}
              plan={plan}
            />
          </span>
        ) : null}
        <span
          aria-hidden
          className="flex shrink-0 items-center gap-1 text-xs font-medium text-muted-foreground"
        >
          <span className="max-sm:hidden">Show</span>
          <ChevronDown className="size-4" />
        </span>
        {/* The quiet close: put away for good for this event (the header says why), raised over the line's band. */}
        <Button
          type="button"
          size="icon-sm"
          variant="ghost"
          aria-label="Dismiss the checklist"
          data-checklist-dismiss=""
          onClick={() => onDismiss(lineRef.current)}
          className="pointer-events-auto relative -mr-2 shrink-0 text-muted-foreground"
          {...trackAttrs("cta_click", {
            cta: "checklist-dismiss",
            location: "hub-checklist",
          })}
        >
          <X />
        </Button>
      </span>
    </Card>
  );
}

/** A small progress ring: the folded line's one glance at how far she is. */
function Ring({ r }: { r: Readiness }) {
  const R = 8;
  const C = 2 * Math.PI * R;
  const pct = r.needed.done / r.needed.of;
  return (
    <svg viewBox="0 0 20 20" aria-hidden className="size-5 shrink-0 -rotate-90">
      <circle
        cx="10"
        cy="10"
        r={R}
        fill="none"
        strokeWidth="2.5"
        className="stroke-muted"
      />
      <circle
        cx="10"
        cy="10"
        r={R}
        fill="none"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeDasharray={`${C * pct} ${C}`}
        className={r.ready ? "stroke-success" : "stroke-foreground/70"}
      />
    </svg>
  );
}
