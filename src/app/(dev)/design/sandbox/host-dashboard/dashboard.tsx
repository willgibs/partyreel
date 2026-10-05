"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { StorageMeter } from "@/components/app/dashboard/storage-meter";
import { WeekRow } from "@/components/app/dashboard/week-row";
import { effectiveStorageCap } from "@/lib/constants/tiers";
import { longDate } from "@/lib/dashboard/when";

import type { LeadProps, Leads, Picks } from "./chooser";
import { Collection, type CollectionStart } from "./collection";
import { CornerLead } from "./corner";
import { DeckLead } from "./deck";
import { HOSTS, type HostId, TODAY } from "./fixtures";
import { Head } from "./head";
import {
  type Answers,
  type ChooserWay,
  COUNT_WORDS,
  countSaid,
  factsOf,
  headLine,
  homeAround,
  leadWhyOf,
  partyOnItsDay,
  type RuleId,
  RULES,
  weekWithUndated,
} from "./model";
import { HostShell } from "./shell";
import { StandIn } from "./stand-in";
import { WordsLead } from "./words";

/**
 * ONE DASHBOARD, AS A HOST USES IT: production's head, stage and week over her
 * events, for one host, in the answers the board holds.
 *
 * ★ PRESS ANY EVENT AND IT OPENS. A press on an event (a tile, a row, a Recent
 * cover, the stage) opens a stand-in of its page, and the dashboard comes back
 * the way a kept route comes back (Next's `Activity`): her scroll, her layout
 * and the Recent row as she left them. What she opened joins her trail, which
 * Recent and the Last opened rule read.
 *
 * ★ THE RULE IS HERS AND THE STAGE FOLLOWS AT ONCE: pick Upcoming and the next
 * party takes the stage in the same frame, through production's own
 * composition around the new lead (`homeAround`). How she picks is the
 * `chooser` ask's: each direction draws the stage with its control
 * (`LEADS`).
 *
 * ★ A FRAME CAN OPEN SCROLLED TO HER EVENTS OR TO THE WEEK (`scroll`), the way
 * she scrolls to them under the stage, so a still of either is the page itself
 * at that scroll, never a picture of a part of it.
 */

export type Start = {
  /** Her opens, newest first; the host's own when not said. */
  trail?: readonly string[];
  /** The rule she keeps; Newest when not said. */
  rule?: RuleId;
  /** The chooser drawn in use as the frame opens. */
  ruleOpen?: boolean;
  /** Her events as she left them, a control drawn open. */
  collection?: CollectionStart;
  /** The frame opens scrolled to her events, or to the week. */
  scroll?: "events" | "week";
};

/** Each way of choosing what leads, drawn whole: the stage with its control. */
const LEADS: Record<ChooserWay, (p: LeadProps) => React.ReactNode> = {
  corner: CornerLead,
  words: WordsLead,
  deck: DeckLead,
};

const SCROLL_TO = {
  events: "[data-hd-collection]",
  week: "[data-week]",
} as const;

export function Dashboard({
  hostId,
  answers,
  wide,
  start = {},
}: {
  hostId: HostId;
  answers: Answers;
  wide: boolean;
  start?: Start;
}) {
  const host = HOSTS[hostId];
  const [trail, setTrail] = useState<string[]>(() => [
    ...(start.trail ?? host.trail),
  ]);
  const [open, setOpen] = useState<string | null>(null);
  const [rule, setRule] = useState<RuleId>(start.rule ?? "newest");
  const [ruleOpen, setRuleOpen] = useState(Boolean(start.ruleOpen));
  // Each visit to an event draws the stage afresh on the way back, as a route change would.
  const [visits, setVisits] = useState(0);
  const root = useRef<HTMLDivElement>(null);
  const saved = useRef(0);
  const details = answers.details;

  /* ── what leads ──────────────────────────────────────────────────────── */

  const leads = useMemo(
    () =>
      Object.fromEntries(
        RULES.map((r) => [r.id, leadWhyOf(host, r.id, trail)]),
      ) as Leads,
    [host, trail],
  );
  const lead = leads[rule]?.event ?? null;
  const view = useMemo(() => {
    const around = homeAround(host, lead?.id ?? null);
    const week = details === "week" ? weekWithUndated(around, host) : around;
    return details === "count" ? countSaid(week, COUNT_WORDS.other) : week;
  }, [host, lead?.id, details]);
  const picks = useMemo(
    () =>
      Object.fromEntries(
        RULES.map((r) => [r.id, leads[r.id]?.event ?? null]),
      ) as Picks,
    [leads],
  );
  const facts = useMemo(() => factsOf(host, trail), [host, trail]);
  const total = host.hosted.length + host.guests.length;
  // A party on its own day leads whatever the rule; with one event there is nothing to choose.
  const hand = host.hosted.length > 1 && !partyOnItsDay(host);

  /* ── into an event and back ──────────────────────────────────────────── */

  const winOf = () => root.current?.ownerDocument.defaultView ?? null;

  const openEvent = useCallback((id: string) => {
    const win = winOf();
    saved.current = win?.scrollY ?? 0;
    setTrail((t) => [id, ...t.filter((x) => x !== id)]);
    setOpen(id);
    setRuleOpen(false);
    setVisits((v) => v + 1);
    win?.scrollTo(0, 0);
  }, []);

  const back = useCallback(() => {
    setOpen(null);
    const win = winOf();
    win?.requestAnimationFrame(() =>
      win.requestAnimationFrame(() => win.scrollTo(0, saved.current)),
    );
  }, []);

  const idOf = useCallback(
    (href: string): string | null => {
      const own = href.match(/^\/dashboard\/([^/?#]+)/)?.[1];
      if (own && own !== "new") return own;
      return host.guests.find((g) => g.href === href)?.eventId ?? null;
    },
    [host],
  );

  const onNavigate = useCallback(
    (href: string | null) => {
      const id = href ? idOf(href) : null;
      if (id) openEvent(id);
      else back();
    },
    [idOf, openEvent, back],
  );

  function onClickCapture(e: React.MouseEvent) {
    const el = e.target as Element;
    const a = el.closest<HTMLAnchorElement>("a[href]");
    if (!a) return;
    const href = a.getAttribute("href") ?? "";
    const id = idOf(href);
    // The frame already keeps every link from navigating; this decides what the press means.
    if (id) openEvent(id);
  }

  /* ── a frame opened at her events or the week ────────────────────────── */

  const scroll = start.scroll;
  useEffect(() => {
    if (!scroll) return;
    const doc = root.current?.ownerDocument;
    const win = doc?.defaultView;
    if (!doc || !win) return;
    const place = () => {
      const top = doc.querySelector<HTMLElement>(SCROLL_TO[scroll]);
      // The app's bar stays at the top as the page scrolls, so the part starts under it.
      const bar =
        doc.querySelector("header")?.getBoundingClientRect().height ?? 0;
      if (top)
        win.scrollTo(
          0,
          Math.max(0, top.getBoundingClientRect().top + win.scrollY - bar - 16),
        );
    };
    // Once the stills have their size, and again once the faces have landed.
    const timers = [80, 400, 1200].map((ms) => win.setTimeout(place, ms));
    return () => timers.forEach((t) => win.clearTimeout(t));
    // Placed once, as the frame opens.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ── the page ────────────────────────────────────────────────────────── */

  const cap = effectiveStorageCap(host.plan.tier, host.plan.capBytes);
  const Lead = LEADS[answers.chooser];

  const storage = (
    // Drawn, not wired: its popover's plans lead to Checkout.
    <span inert>
      <StorageMeter
        activeBytes={host.plan.usedBytes}
        deletedBytes={0}
        storageCap={cap}
        makeRoom
        passExpiry={null}
        planName={host.plan.name}
        hasBilling={host.plan.tier !== "free"}
        isEventPass={host.plan.tier === "event_pass"}
        tier={host.plan.tier}
      />
    </span>
  );

  return (
    <HostShell host={host} onNavigate={onNavigate}>
      <div
        ref={root}
        onClickCapture={onClickCapture}
        data-hd-page={hostId}
        data-hd-lead={lead?.id ?? ""}
        data-hd-details={details}
      >
        {open && <StandIn host={host} id={open} wide={wide} onBack={back} />}
        <div hidden={open !== null}>
          {/* Production's own composition (`home.tsx`): wide like the album, the head, the stage, the week, the events. */}
          <div data-app-wide data-home="" className="space-y-7 lg:space-y-9">
            <Head
              day={longDate(TODAY)}
              line={headLine(host, details === "limit")}
              storage={storage}
              ringFirst={details === "ring"}
            />
            {view.stage && (
              <Lead
                key={visits}
                stage={view.stage}
                ctx={host.ctx}
                rule={rule}
                onRule={setRule}
                picks={picks}
                leads={leads}
                hand={hand}
                open={ruleOpen}
                onOpen={setRuleOpen}
                wide={wide}
                countWord={
                  details === "count" ? COUNT_WORDS.other : undefined
                }
              />
            )}
            <WeekRow cards={view.week} />
            <Collection
              view={view}
              facts={facts}
              trail={trail}
              total={total}
              wide={wide}
              start={start.collection}
            />
          </div>
        </div>
      </div>
    </HostShell>
  );
}
