"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { Check, ChevronDown, ChevronUp } from "lucide-react";

import { settingsPageHref } from "@/components/app/event-settings/settings-pages";
import { useHostAdd } from "@/components/app/host-add-provider";
import {
  PricingSheet,
  type PricingPlanFacts,
} from "@/components/app/pricing/pricing-sheet";
import { useEventShare } from "@/components/app/share/event-share-provider";
import { InviteButton } from "@/components/app/share/invite-button";
import { Button } from "@/components/ui/button";
import { trackAttrs } from "@/lib/analytics/events";
import { playableCount, REEL_MINIMUM } from "@/lib/event/reel-progress";
import {
  type Readiness,
  type ReadyAction,
  type ReadyFacts,
  type ReadyItem,
  readiness,
  readyHead,
} from "@/lib/events/readiness";
import { formatCount } from "@/lib/format/count";
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
 * THE CHECKLIST AT THE HEAD OF THE HUB, UNTIL IT IS DONE (Will, event-ready `list=head`, 2026-10-02):
 * under the cards on every visit, the whole list while the album is empty, folded to one line once it
 * has photos, and gone once everything is done. It retired the launch list, which left with the first
 * photo, done or not, with the code never opened and the note unwritten.
 *
 * ★ ONE FUNCTION UNDER IT (`lib/events/readiness.ts`): Settings' rail and Create's hand-off read the same
 * items, so a tick here is a tick there. Its facts are the server's, with the album's own live counts laid
 * over them (the page's album store, as the Review and Reel cards read it), so the first photos tick the
 * moment the reel starts playing, with nothing refreshed.
 *
 * ★ TWO GROUPS, ONE BAR. What a guest needs (the door, uploads, the code) is what the bar measures, so a
 * full bar IS ready; what is worth doing (the first photos, the welcome) sits under its own label and
 * never holds the bar back. A done row stays, ticked and quiet: a host reads her whole event and sees it
 * set, rather than a to-do list that empties into nothing. A row not done carries the one or two doors
 * that finish it, and nothing else does.
 *
 * ★ IT LEAVES ON A LATER VISIT, NEVER UNDER HER EYES: a list she finishes while looking stays, every row
 * ticked, until she leaves; the next visit no longer draws it. And from the day after the event's date it
 * is not drawn at all (`checklistOver`): before guests arrive is moot once they have.
 *
 * ★ IT READS ITS OWN WIDTH, NOT THE SCREEN'S: a container query lays the rows side by side where the list
 * has the room (the hub at a desk) and stacks them where it has not (a phone).
 */
export function EventChecklist({
  eventId,
  facts,
  over,
  plan,
}: {
  eventId: string;
  /** The event's facts as the server read them; the album's live counts ride over them. */
  facts: ReadyFacts;
  /** The event's date is behind the viewer's today (`checklistOver`): the list is not drawn. */
  over: boolean;
  /** What the room row's plan sheet opens on. */
  plan: PricingPlanFacts;
}) {
  const live = useLiveReadyFacts(facts);
  const r = readiness(live);
  const left = !over && r.left.length > 0;

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

  if (over || (!left && !seen)) return null;

  const hasPhotos = live.approved > 0;
  const flip = (next: boolean) => {
    toggled.current = true;
    setOpen(next);
  };

  if (hasPhotos && !open) {
    return <ChecklistLine r={r} toggleRef={toggle} onShow={() => flip(true)} />;
  }
  return (
    <ChecklistList
      r={r}
      eventId={eventId}
      plan={plan}
      toggleRef={toggle}
      onHide={hasPhotos ? () => flip(false) : undefined}
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
            {item.line}
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

/** The whole list: its head, its bar and its two groups. */
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
  /** Folds it back to one line (only once the album has photos). */
  onHide?: () => void;
}) {
  const head = readyHead(r);
  const needed = r.items.filter((i) => i.essential);
  const worth = r.items.filter((i) => !i.essential);
  return (
    <section
      data-checklist=""
      data-ready={r.ready ? "" : undefined}
      aria-label={head.title}
      className="@container overflow-hidden rounded-xl bg-card text-card-foreground ring-1 ring-foreground/10"
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
            {onHide ? (
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
            ) : null}
          </span>
        </div>
        <Bar r={r} />
      </div>
      <div className="border-t border-border @3xl:grid @3xl:grid-cols-[3fr_2fr]">
        <div>
          {/* Side by side, both groups are named, so their rows start level. */}
          <p className="hidden px-4 pt-3 text-label font-semibold text-muted-foreground uppercase @3xl:block">
            What a guest needs
          </p>
          <ol
            aria-label="What a guest needs"
            className="divide-y divide-border @3xl:grid @3xl:grid-cols-3 @3xl:divide-x @3xl:divide-y-0"
          >
            {needed.map((item) => (
              <Row key={item.id} item={item} eventId={eventId} plan={plan} />
            ))}
          </ol>
        </div>
        {worth.length > 0 ? (
          <div className="border-t border-border @3xl:border-t-0 @3xl:border-l">
            <p className="px-4 pt-2.5 text-label font-semibold text-muted-foreground uppercase @3xl:pt-3">
              Worth doing
            </p>
            <ol
              aria-label="Worth doing"
              className="divide-y divide-border @3xl:grid @3xl:grid-cols-2 @3xl:divide-x @3xl:divide-y-0"
            >
              {worth.map((item) => (
                <Row key={item.id} item={item} eventId={eventId} plan={plan} />
              ))}
            </ol>
          </div>
        ) : null}
      </div>
    </section>
  );
}

const lower = (s: string) => s.charAt(0).toLowerCase() + s.slice(1);

/** The folded line's words after the head: what a guest still needs, or what is worth doing. */
function foldedWords(r: Readiness): ReactNode {
  if (!r.ready) {
    return `: ${r.left
      .filter((i) => i.essential)
      .map((i) => lower(i.title))
      .join(", ")}`;
  }
  const worth = r.left.filter((i) => !i.essential).length;
  return worth > 0
    ? `, ${formatCount(worth)} worth doing`
    : ": everything is set";
}

/**
 * THE LIST FOLDED TO ONE LINE, once the album has photos: the album takes the page back, and what is
 * left stays one tap away above it, with a ring for how far she is. ★ THE WHOLE LINE IS THE TOGGLE (a
 * summary that opens its list): a phone's thumb meets it anywhere, and at a phone's width the word Show
 * gives its room to what is left, its chevron staying.
 */
function ChecklistLine({
  r,
  toggleRef,
  onShow,
}: {
  r: Readiness;
  toggleRef: React.Ref<HTMLButtonElement>;
  onShow: () => void;
}) {
  const head = readyHead(r);
  return (
    <section
      data-checklist=""
      data-checklist-folded=""
      data-ready={r.ready ? "" : undefined}
      aria-label={head.title}
      className="rounded-xl bg-card text-card-foreground ring-1 ring-foreground/10"
    >
      <button
        ref={toggleRef}
        type="button"
        aria-expanded={false}
        onClick={onShow}
        className="flex w-full items-center gap-3 rounded-xl px-4 py-2.5 text-left transition-colors duration-150 outline-none hover:bg-muted/40 focus-visible:ring-2 focus-visible:ring-ring/50 motion-reduce:transition-none"
      >
        <Ring r={r} />
        <span
          data-checklist-head=""
          className="line-clamp-2 min-w-0 flex-1 text-sm font-medium"
        >
          {head.title}
          <span className="font-normal text-muted-foreground">
            {foldedWords(r)}
          </span>
        </span>
        <span className="flex shrink-0 items-center gap-1 text-xs font-medium text-muted-foreground">
          <span className="max-sm:sr-only">Show</span>
          <ChevronDown className="size-4" aria-hidden />
        </span>
      </button>
    </section>
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
