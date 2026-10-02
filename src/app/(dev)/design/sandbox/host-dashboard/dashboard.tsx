"use client";

import { CalendarPlus } from "lucide-react";
import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { formatCount } from "@/lib/format/count";
import { cn } from "@/lib/utils";

import { LiveStrip, SinceStrip } from "./arrivals";
import { DeskList, NeedsLine, ThreeRow, WeekRow } from "./attention";
import { Covers, Index, type Marks, Seasons } from "./collection";
import { type DashEvent, type HostId, hostAt } from "./fixtures";
import type { MomentId } from "./knobs";
import {
  bellItems,
  itemFor,
  longDate,
  momentEvent,
  pageItems,
  phaseOf,
  type Rule,
  storagePct,
  weekEvents,
} from "./model";
import { ScrollHere } from "./scene";
import { HostShell } from "./shell";
import { Stage } from "./stage";
import { StorageRing, useWide } from "./ui";

/**
 * ONE DASHBOARD, COMPOSED FROM THE BOARD'S FOUR ANSWERS.
 *
 * Every frame on the board is this page: what it is for decides what leads
 * and in what order the rest follows; the attention rule decides what reaches
 * the page and what the bell holds; the collection is drawn one of three
 * ways; and Just arrived's place is taken by the stage's live wall, a strip,
 * or nothing. A staged question is drawn wearing the answers it waits on
 * (the step hands every preview the board's state), so a pick on one
 * question is what the next is judged inside.
 */

export type Purpose = "stage" | "shelf" | "desk";
export type CollectionView = "covers" | "seasons" | "index";
export type ArrivalsWay = "none" | "live" | "since";

export type Answers = {
  purpose: Purpose;
  needs: Rule;
  events: CollectionView;
  arrivals: ArrivalsWay;
};

/** A mark's words: the count waiting said short, or the step the page asks. */
const markText = (line: string) =>
  line
    .replace(/^(\d[\d,]*) people at the door$/, "$1 at the door")
    .replace(/^(\d[\d,]*) uploads? to review$/, "$1 to review");

function Head({
  title,
  sub,
  host,
}: {
  title: ReactNode;
  sub?: ReactNode;
  host: ReturnType<typeof hostAt>;
}) {
  const wide = useWide();
  return (
    <div className="flex items-center justify-between gap-4">
      <div
        className={cn(
          "min-w-0",
          wide ? "flex items-baseline gap-4" : "space-y-0.5",
        )}
      >
        {title}
        {sub}
      </div>
      <div className="flex shrink-0 items-center gap-1">
        {wide && <StorageRing pct={storagePct(host)} plan={host.plan.name} />}
        <Button tabIndex={-1} size={wide ? "default" : "sm"}>
          <CalendarPlus /> New event
        </Button>
      </div>
    </div>
  );
}

export function Dashboard({
  hostId,
  moment,
  answers,
  bellOpen = false,
  focus = "top",
}: {
  hostId: HostId;
  moment: MomentId;
  answers: Answers;
  bellOpen?: boolean;
  /** Where the frame opens: the page's top, or scrolled to the collection. */
  focus?: "top" | "collection";
}) {
  const wide = useWide();
  const host = hostAt(hostId, moment);
  const { purpose, needs, events, arrivals } = answers;
  const page = pageItems(host, needs);
  const bell = bellItems(host, needs);
  const onPage = new Set(page.map((i) => i.key));
  const lead = purpose === "stage" ? momentEvent(host) : null;

  const marksOf = (e: DashEvent): Marks => {
    const live = phaseOf(e.date, host.today) === "live";
    const item = itemFor(e, host);
    if (!item) return { live, state: null };
    if (item.kind === "door" || item.kind === "review")
      return { live, state: { tone: "waiting", text: markText(item.line) } };
    return onPage.has(item.key)
      ? { live, state: { tone: "setup", text: item.line } }
      : { live, state: null };
  };

  const Collection =
    events === "seasons" ? Seasons : events === "index" ? Index : Covers;
  // ★ UNDER A STAGE THE LIST IS EVERYTHING ELSE: the event on the stage is not
  // drawn a second time right under itself (at one event it was the whole list).
  const listed =
    purpose === "stage" && lead
      ? { ...host, events: host.events.filter((e) => e.id !== lead.event.id) }
      : host;
  const collectionTitle =
    purpose === "shelf"
      ? undefined
      : purpose === "stage"
        ? "Everything else"
        : "Your events";
  const collection = (
    <>
      {focus === "collection" && <ScrollHere />}
      <Collection host={listed} marksOf={marksOf} title={collectionTitle} />
    </>
  );

  const strips = (
    <>
      {arrivals === "live" && purpose !== "stage" && <LiveStrip host={host} />}
      {arrivals === "since" && (
        <SinceStrip
          host={host}
          omit={purpose === "stage" ? (lead?.event.id ?? null) : null}
        />
      )}
    </>
  );

  const count = `${formatCount(host.events.length)} ${host.events.length === 1 ? "event" : "events"}`;

  let body: ReactNode;
  if (purpose === "stage") {
    const step =
      lead &&
      (() => {
        const item = itemFor(lead.event, host);
        return item && onPage.has(item.key) ? item : null;
      })();
    const week = weekEvents(host).filter((e) => e.id !== lead?.event.id);
    body = (
      <>
        <Head
          host={host}
          title={
            <h1
              className={cn(
                "font-heading",
                wide ? "text-page" : "text-subsection",
              )}
            >
              {longDate(host.today)}
            </h1>
          }
          sub={
            <p className="text-sm text-muted-foreground">{`${count} · ${host.plan.name}`}</p>
          }
        />
        {lead && (
          <Stage
            host={host}
            event={lead.event}
            phase={lead.phase}
            step={step ?? null}
            media={arrivals === "live" ? "wall" : "calm"}
          />
        )}
        {strips}
        {needs === "week" && <WeekRow host={host} events={week} items={page} />}
        {needs === "three" && (
          <ThreeRow
            host={host}
            items={page}
            onStage={lead?.event.id ?? null}
            more={Math.max(0, bell.length - page.length)}
          />
        )}
        {collection}
      </>
    );
  } else if (purpose === "shelf") {
    body = (
      <>
        <Head
          host={host}
          title={
            <h1 className="flex items-baseline gap-2.5">
              <span
                className={cn(
                  "font-heading",
                  wide ? "text-page" : "text-subsection",
                )}
              >
                Your events
              </span>
              <span className="text-sm text-muted-foreground tabular-nums">
                {formatCount(host.events.length)}
              </span>
            </h1>
          }
          sub={<NeedsLine items={page} rule={needs} />}
        />
        {strips}
        {collection}
      </>
    );
  } else {
    const list = needs === "bell" ? bell : page;
    body = (
      <>
        <Head
          host={host}
          title={
            <h1 className="flex items-baseline gap-2.5">
              <span
                className={cn(
                  "font-heading",
                  wide ? "text-page" : "text-subsection",
                )}
              >
                What needs you
              </span>
              <span className="text-sm text-muted-foreground tabular-nums">
                {formatCount(list.length)}
              </span>
            </h1>
          }
          sub={
            <p className="text-sm text-muted-foreground">{`${longDate(host.today)} · ${count}`}</p>
          }
        />
        <DeskList
          host={host}
          items={list}
          more={Math.max(0, bell.length - list.length)}
        />
        {strips}
        {collection}
      </>
    );
  }

  return (
    // The bell's panel is drawn open at a desk only: in a hand it covers the
    // page whose answer it is being compared with.
    <HostShell host={host} bell={bell} bellOpen={bellOpen && wide}>
      <div
        data-hd-page={purpose}
        className={cn(wide ? "space-y-7" : "space-y-6")}
      >
        {body}
      </div>
    </HostShell>
  );
}
