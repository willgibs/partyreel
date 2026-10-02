"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { HomeHead } from "@/components/app/dashboard/home-head";
import { StorageMeter } from "@/components/app/dashboard/storage-meter";
import { WeekRow } from "@/components/app/dashboard/week-row";
import { effectiveStorageCap } from "@/lib/constants/tiers";
import type { EventsView } from "@/lib/dashboard/events-view";
import { longDate } from "@/lib/dashboard/when";
import { formatCount } from "@/lib/format/count";

import {
  BuiltCollection,
  DisplayCollection,
  IndexCollection,
} from "./collection";
import { dayById, HOSTS, type HostId, TODAY } from "./fixtures";
import {
  type Answers,
  contenders,
  type Display,
  DISPLAY_DEFAULT,
  homeAround,
  type ListSort,
  partyOnItsDay,
  rests,
  ruleLead,
} from "./model";
import { HostShell } from "./shell";
import { StageSlot } from "./stage-slot";
import { StandIn } from "./stand-in";

/**
 * ONE DASHBOARD, AS A HOST USES IT: production's head, stage and week over the
 * collection an option draws, for one host, in the answers the board holds.
 *
 * ★ PRESS ANY EVENT AND IT OPENS. A press on an event (a tile, a row, a folded
 * year's thumbnail, the stage) opens a stand-in of its page, and Your events
 * comes back the way the option says a host comes back:
 *  - as built, production's page draws fresh (it is not kept between routes:
 *    no `cacheComponents` in `next.config.ts`), so a year she opened is folded
 *    again; the scroll comes back where it was, the kindest reading of Back;
 *  - every new option keeps the page as she left it, the way Next keeps a
 *    route it hides (its `Activity`): her scroll and an open year come back.
 * What she opened joins her trail, which `left` and Recent read.
 *
 * ★ A JOURNEY CAN BE PLAYED ONCE AS A FRAME OPENS (`journey`): open the year an
 * event sits in, press it, come back. A still of "back from her first 2025
 * wedding" is that journey played by the page itself, so what it shows is what
 * production's own components do, never a picture of it.
 *
 * ★ TWO PRESSES IN PRODUCTION'S EVENTS LIST CALL A SERVER FUNCTION, and a frame
 * must not: the view toggle writes its cookie (`setEventsViewAction`) and a
 * bin's Restore restores. Both are caught before they reach production; the
 * toggle is then honoured by drawing the section afresh in the view pressed.
 */

export type Journey = { back: string; year?: string };

export type Start = {
  /** Her opens, newest first; the host's own week when not said. */
  trail?: readonly string[];
  /** Played once as the frame opens. */
  journey?: Journey;
  /** The stage's Change list, drawn open (`pick=kept`). */
  pickOpen?: boolean;
  /** Steps already taken through the stage's contenders (`pick=step`). */
  step?: number;
  /** Her Display, and its menu drawn open (`events=display`). */
  display?: Display;
  displayOpen?: boolean;
};

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

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
  const days = useMemo(() => dayById(host), [host]);
  const [trail, setTrail] = useState<string[]>(() => [
    ...(start.trail ?? host.trail),
  ]);
  const [open, setOpen] = useState<string | null>(null);
  const [featured, setFeatured] = useState<string | null>(host.featured);
  const [pickOpen, setPickOpen] = useState(Boolean(start.pickOpen));
  const [step, setStep] = useState(start.step ?? 0);
  const [mount, setMount] = useState(0);
  // Each visit to an event draws the stage afresh on the way back, as a route change would:
  // a code card left open over it (its Everything opens the event) closes with the visit.
  const [visits, setVisits] = useState(0);
  const [builtView, setBuiltView] = useState<EventsView>("cards");
  const [display, setDisplay] = useState<Display>(
    start.display ?? DISPLAY_DEFAULT,
  );
  const [displayOpen, setDisplayOpen] = useState(Boolean(start.displayOpen));
  const [year, setYear] = useState("all");
  const [sort, setSort] = useState<ListSort>("date");
  const root = useRef<HTMLDivElement>(null);
  const saved = useRef(0);

  /* ── what leads ──────────────────────────────────────────────────────── */

  const rule = ruleLead(answers.lead, host, trail);
  const steps = contenders(answers.lead, host, trail);
  const hers =
    answers.pick === "kept" && featured !== null && !partyOnItsDay(host);
  const leadId =
    answers.pick === "step"
      ? (steps[step % steps.length]?.id ?? rule?.id ?? null)
      : hers
        ? featured
        : (rule?.id ?? null);
  const view = useMemo(() => homeAround(host, leadId), [host, leadId]);
  // Change lists the stage's contenders first, then what she opened, then the rest.
  const pickable = useMemo(() => {
    const order = [
      ...steps.map((e) => e.id),
      ...trail,
      ...host.hosted.map((e) => e.id),
    ];
    return [...new Set(order)]
      .map((id) => host.hosted.find((e) => e.id === id))
      .filter((e): e is NonNullable<typeof e> => Boolean(e));
  }, [steps, trail, host]);

  /* ── into an event and back ──────────────────────────────────────────── */

  const winOf = () => root.current?.ownerDocument.defaultView ?? null;

  const openEvent = useCallback((id: string) => {
    const win = winOf();
    saved.current = win?.scrollY ?? 0;
    setTrail((t) => [id, ...t.filter((x) => x !== id)]);
    setOpen(id);
    setVisits((v) => v + 1);
    win?.scrollTo(0, 0);
  }, []);

  const back = useCallback(() => {
    setOpen(null);
    // Production draws the page fresh after Back; every new option keeps it as she left it.
    if (answers.events === "built") setMount((m) => m + 1);
    const win = winOf();
    win?.requestAnimationFrame(() =>
      win.requestAnimationFrame(() => win.scrollTo(0, saved.current)),
    );
  }, [answers.events]);

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
    const toggle = el.closest<HTMLElement>(
      '[aria-label="How your events are shown"] button',
    );
    if (toggle) {
      e.stopPropagation();
      e.preventDefault();
      setBuiltView(
        toggle.getAttribute("aria-label") === "Rows" ? "rows" : "cards",
      );
      setMount((m) => m + 1);
      return;
    }
    if (el.closest("button")?.textContent?.trim() === "Restore") {
      e.stopPropagation();
      e.preventDefault();
      return;
    }
    const a = el.closest<HTMLAnchorElement>("a[href]");
    if (!a) return;
    const href = a.getAttribute("href") ?? "";
    const id = idOf(href);
    // The frame already keeps every link from navigating; this decides what the press means.
    if (id) openEvent(id);
    else if (href === "/dashboard" && open) back();
  }

  /* ── a journey, played once ──────────────────────────────────────────── */

  const journey = start.journey;
  useEffect(() => {
    if (!journey) return;
    let gone = false;
    const doc = root.current?.ownerDocument;
    const win = doc?.defaultView;
    if (!doc || !win) return;
    void (async () => {
      await wait(500);
      if (gone) return;
      if (journey.year) {
        doc
          .querySelector<HTMLButtonElement>(
            `[data-season="${journey.year}"] button[aria-expanded="false"]`,
          )
          ?.click();
        await wait(250);
      }
      const link = [
        ...doc.querySelectorAll<HTMLAnchorElement>(
          `[data-hd-collection] a[href="/dashboard/${journey.back}"]`,
        ),
      ].find(
        (a) =>
          !a.closest("[data-hd-recent]") &&
          a.getBoundingClientRect().height > 0 &&
          // An open year keeps its thumbnail line in place, invisible: the tile is the one she presses.
          win.getComputedStyle(a).visibility !== "hidden",
      );
      if (!link || gone) return;
      const top = link.getBoundingClientRect().top + win.scrollY;
      win.scrollTo(0, Math.max(0, top - win.innerHeight * 0.4));
      await wait(150);
      if (gone) return;
      openEvent(journey.back);
      await wait(250);
      if (!gone) back();
    })();
    return () => {
      gone = true;
    };
    // Played once, as the frame opens.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ── the page ────────────────────────────────────────────────────────── */

  const count = host.hosted.length;
  const cap = effectiveStorageCap(host.plan.tier, host.plan.capBytes);
  const line = `${count > 0 ? `${formatCount(count)} ${count === 1 ? "event" : "events"}` : "No events yet"} · ${host.plan.name}`;

  let collection: React.ReactNode;
  if (answers.events === "display")
    collection = (
      <DisplayCollection
        view={view}
        days={days}
        display={display}
        onDisplay={setDisplay}
        menuOpen={displayOpen}
        onMenuOpen={setDisplayOpen}
      />
    );
  else if (answers.events === "index")
    collection = (
      <IndexCollection
        view={view}
        days={days}
        wide={wide}
        year={year}
        onYear={setYear}
        sort={sort}
        onSort={setSort}
      />
    );
  else
    collection = (
      <BuiltCollection
        view={view}
        initialView={builtView}
        mount={mount}
        recent={answers.events === "recent"}
        trail={trail}
        wide={wide}
      />
    );

  return (
    <HostShell host={host} onNavigate={onNavigate}>
      <div
        ref={root}
        onClickCapture={onClickCapture}
        data-hd-page={hostId}
        data-hd-events={answers.events}
      >
        {open && <StandIn host={host} id={open} wide={wide} onBack={back} />}
        <div hidden={open !== null}>
          {/* Production's own composition (`home.tsx`): wide like the album, the head, the stage, the week, the events. */}
          <div data-app-wide data-home="" className="space-y-7 lg:space-y-9">
            <HomeHead
              day={longDate(TODAY)}
              line={line}
              storage={
                // Drawn, not wired: its popover's plans lead to Checkout.
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
              }
            />
            {view.stage && (
              <StageSlot
                key={visits}
                stage={view.stage}
                ctx={host.ctx}
                resting={rests(answers.lead, host)}
                pick={answers.pick}
                events={pickable}
                featured={hers}
                onFeature={setFeatured}
                pickOpen={pickOpen}
                onPickOpen={setPickOpen}
                step={step % Math.max(1, steps.length)}
                steps={steps.length}
                onStep={setStep}
              />
            )}
            <WeekRow cards={view.week} />
            {collection}
          </div>
        </div>
      </div>
    </HostShell>
  );
}
