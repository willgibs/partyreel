"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { HomeHead } from "@/components/app/dashboard/home-head";
import { StorageMeter } from "@/components/app/dashboard/storage-meter";
import { WeekRow } from "@/components/app/dashboard/week-row";
import { effectiveStorageCap } from "@/lib/constants/tiers";
import { longDate } from "@/lib/dashboard/when";
import { formatCount } from "@/lib/format/count";

import { Collection, type CollectionStart } from "./collection";
import { HOSTS, type HostId, TODAY } from "./fixtures";
import {
  type Answers,
  factsOf,
  homeAround,
  leadOf,
  partyOnItsDay,
  type RuleId,
  RULES,
} from "./model";
import { HeadCustomize, SettingsPage } from "./prefs";
import { HostShell } from "./shell";
import { type Picks, StageSlot } from "./stage-slot";
import { StandIn } from "./stand-in";

/**
 * ONE DASHBOARD, AS A HOST USES IT: production's head, stage and week over her
 * events, for one host, in the answers the board holds.
 *
 * ★ PRESS ANY EVENT AND IT OPENS. A press on an event (a tile, a row, a Recent
 * cover, the stage) opens a stand-in of its page, and Your events comes back
 * the way a kept route comes back (Next's `Activity`): her scroll, her layout,
 * her filter and the Recent row as she left it. What she opened joins her
 * trail, which Recent and the Last opened rule read.
 *
 * ★ THE RULE IS HERS AND THE STAGE FOLLOWS AT ONCE: pick Upcoming and the next
 * party takes the stage in the same frame, through production's own
 * composition around the new lead (`homeAround`).
 *
 * ★ A FRAME CAN OPEN SCROLLED TO HER EVENTS (`scroll: "events"`), the way she
 * scrolls to them under the stage, so a still of the collection is the page
 * itself at that scroll, never a picture of a part of it.
 */

export type Start = {
  /** Her opens, newest first; the host's own when not said. */
  trail?: readonly string[];
  /** The rule she keeps; Newest when not said. */
  rule?: RuleId;
  /** The rule's control drawn open (the corner's menu, the head's Customize). */
  ruleOpen?: boolean;
  /** The page opens on Settings (`rule=settings`). */
  settings?: boolean;
  /** Her events as she left them, a control drawn open. */
  collection?: CollectionStart;
  /** The frame opens scrolled to her events. */
  scroll?: "events";
  /** She has just come from Create: the empty stage's light ignites once. */
  fresh?: boolean;
};

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
  const [page, setPage] = useState<"home" | "settings">(
    start.settings ? "settings" : "home",
  );
  const [rule, setRule] = useState<RuleId>(start.rule ?? "newest");
  const [ruleOpen, setRuleOpen] = useState(Boolean(start.ruleOpen));
  const [recentShown, setRecentShown] = useState(true);
  // Each visit to an event draws the stage afresh on the way back, as a route change would.
  const [visits, setVisits] = useState(0);
  const root = useRef<HTMLDivElement>(null);
  const saved = useRef(0);

  /* ── what leads ──────────────────────────────────────────────────────── */

  const lead = leadOf(host, rule, trail);
  const view = useMemo(
    () => homeAround(host, lead?.id ?? null),
    [host, lead?.id],
  );
  const picks = useMemo(
    () =>
      Object.fromEntries(
        RULES.map((r) => [r.id, leadOf(host, r.id, trail)]),
      ) as Picks,
    [host, trail],
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
    setPage("home");
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

  /* ── a frame opened at her events ────────────────────────────────────── */

  const scroll = start.scroll;
  useEffect(() => {
    if (scroll !== "events") return;
    const doc = root.current?.ownerDocument;
    const win = doc?.defaultView;
    if (!doc || !win) return;
    const place = () => {
      const top = doc.querySelector<HTMLElement>("[data-hd-collection]");
      if (top)
        win.scrollTo(
          0,
          Math.max(0, top.getBoundingClientRect().top + win.scrollY - 20),
        );
    };
    // Once the stills have their size, and again once the faces have landed.
    const timers = [80, 400, 1200].map((ms) => win.setTimeout(place, ms));
    return () => timers.forEach((t) => win.clearTimeout(t));
    // Placed once, as the frame opens.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ── the page ────────────────────────────────────────────────────────── */

  const count = host.hosted.length;
  const cap = effectiveStorageCap(host.plan.tier, host.plan.capBytes);
  const line = `${count > 0 ? `${formatCount(count)} ${count === 1 ? "event" : "events"}` : "No events yet"} · ${host.plan.name}`;
  const ruleProps = {
    rule,
    onRule: setRule,
    picks,
    ends: host.ends,
    today: host.ctx.today,
  };

  const storage = (
    <span className="flex items-center gap-1">
      {hand && answers.rule === "head" && (
        <HeadCustomize
          {...ruleProps}
          open={ruleOpen}
          onOpen={setRuleOpen}
          recent={recentShown}
          onRecent={setRecentShown}
        />
      )}
      {/* Drawn, not wired: its popover's plans lead to Checkout. */}
      <span inert>
        <StorageMeter
          storageUsed={host.plan.usedBytes}
          storageCap={cap}
          storagePct={host.ctx.storagePct}
          standbyBytes={0}
          overBudget={false}
          passExpiry={null}
          planName={host.plan.name}
          hasBilling={host.plan.tier !== "free"}
          isEventPass={host.plan.tier === "event_pass"}
          tier={host.plan.tier}
        />
      </span>
    </span>
  );

  return (
    <HostShell host={host} onNavigate={onNavigate}>
      <div
        ref={root}
        onClickCapture={onClickCapture}
        data-hd-page={hostId}
        data-hd-events={answers.events}
        data-hd-lead={lead?.id ?? ""}
      >
        {open && <StandIn host={host} id={open} wide={wide} onBack={back} />}
        {!open && page === "settings" && (
          <SettingsPage {...ruleProps} wide={wide} onBack={back} />
        )}
        <div hidden={open !== null || page === "settings"}>
          {/* Production's own composition (`home.tsx`): wide like the album, the head, the stage, the week, the events. */}
          <div data-app-wide data-home="" className="space-y-7 lg:space-y-9">
            <HomeHead day={longDate(TODAY)} line={line} storage={storage} />
            {view.stage && (
              <StageSlot
                key={visits}
                stage={view.stage}
                ctx={host.ctx}
                ends={host.ends}
                stageWay={answers.stage}
                ruleWay={answers.rule}
                rule={rule}
                onRule={setRule}
                picks={picks}
                hand={hand}
                open={answers.rule === "corner" && ruleOpen}
                onOpen={setRuleOpen}
                onSettings={() => {
                  saved.current = winOf()?.scrollY ?? 0;
                  setPage("settings");
                  winOf()?.scrollTo(0, 0);
                }}
                fresh={Boolean(start.fresh) && visits === 0}
              />
            )}
            <WeekRow cards={view.week} />
            <Collection
              way={answers.events}
              view={view}
              facts={facts}
              trail={recentShown ? trail : []}
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
