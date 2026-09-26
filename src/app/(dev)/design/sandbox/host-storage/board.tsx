"use client";

import "./host-storage.css";

import { ExplorationBoard } from "@/components/lab";
import type { BoardState } from "@/components/lab/board-spec";
import type { PreviewsFor } from "@/components/lab/exploration";

import { type PricesLayout, PricesShowcase, type RefusalOption, RefusalShowcase } from "./pricing";
import { HostGround, Scene, screenOf, type ScreenId } from "./scene";
import { HOST_STORAGE } from "./spec";
import { AccountScope } from "./storage-list";
import { AccountEntryPoints, AlbumScope, SheetScope } from "./surfaces";

/**
 * THE PREVIEWS, AND NOTHING ELSE: every option is the real host pieces at a
 * real viewport, one thing changed. The screen knob all five decisions share
 * lives in `scene.tsx`; a staged decision reads the earlier answers off the
 * board's own state (`where` before `order`, both before `goal`, `refusal`
 * before `prices`), the same "wears its parent's recommendation until he
 * answers" rule every exploration in the kit follows.
 */

const screen = (s: BoardState): ScreenId => screenOf(s.screen as string);

type WhereOption = "account" | "album" | "sheet";
const whereOf = (v: string | undefined): WhereOption =>
  v === "album" ? "album" : v === "sheet" ? "sheet" : "account";

type OrderOption = "flat" | "grouped" | "hybrid";
const orderOf = (v: string | undefined): OrderOption =>
  v === "grouped" ? "grouped" : v === "hybrid" ? "hybrid" : "flat";

type GoalOption = "live" | "plain" | "toast";

const refusalOf = (v: string | undefined): RefusalOption =>
  v === "swap" ? "swap" : v === "banner" ? "banner" : "inline";

/** A quiet backdrop for the `sheet` option and the pricing sheet: enough of a
 *  page behind the scrim that dimming it means something. */
function Backdrop() {
  return (
    <div className="space-y-3 opacity-90" aria-hidden>
      <p className="font-heading text-subsection">Dashboard</p>
      <div className="h-20 rounded-lg border border-border bg-muted/30" />
      <div className="h-20 rounded-lg border border-border bg-muted/30" />
    </div>
  );
}

function surfaceFor(
  where: WhereOption,
  order: OrderOption,
  goal: GoalOption | null,
  scr: ScreenId,
) {
  if (where === "album") return <AlbumScope goal={goal} screen={scr} />;
  if (where === "sheet")
    return <SheetScope order={order} goal={goal} screen={scr} />;
  return <AccountScope order={order} goal={goal} screen={scr} />;
}

/* ── decision 1: where ────────────────────────────────────────────────────── */

const where = (s: BoardState, option: WhereOption) => {
  const scr = screen(s);
  return (
    <Scene id={`where-${option}`} screen={scr} title="Where sizes live">
      <HostGround screen={scr}>
        {option === "sheet" && <Backdrop />}
        {option === "account" && <AccountEntryPoints />}
        {surfaceFor(option, "flat", null, scr)}
      </HostGround>
    </Scene>
  );
};

/* ── decision 2: order (reads `where`) ───────────────────────────────────── */

const order = (s: BoardState, option: OrderOption) => {
  const scr = screen(s);
  const w = whereOf(s.where as string);
  return (
    <Scene id={`order-${option}`} screen={scr} title="The order">
      <HostGround screen={scr}>
        {w === "sheet" && <Backdrop />}
        {w === "album" && (
          <p className="text-xs text-muted-foreground">
            One event only here: grouping has nothing to group, so this reads
            exactly like flat would.
          </p>
        )}
        {surfaceFor(w, option, null, scr)}
      </HostGround>
    </Scene>
  );
};

/* ── decision 3: goal (reads `where`, `order`) ───────────────────────────── */

const goal = (s: BoardState, option: GoalOption) => {
  const scr = screen(s);
  const w = whereOf(s.where as string);
  const o = orderOf(s.order as string);
  return (
    <Scene id={`goal-${option}`} screen={scr} title="The goal">
      <HostGround screen={scr}>
        {w === "sheet" && <Backdrop />}
        {surfaceFor(w, o, option, scr)}
      </HostGround>
    </Scene>
  );
};

/* ── decision 4: refusal ──────────────────────────────────────────────────── */

const refusal = (s: BoardState, option: RefusalOption) => {
  const scr = screen(s);
  return (
    <Scene
      id={`refusal-${option}`}
      screen={scr}
      title="The refusal"
      caption={
        option === "swap"
          ? "Tapping the too-small size replaces the whole sheet; this is what that screen shows"
          : undefined
      }
    >
      <HostGround screen={scr}>
        <AccountScope order="flat" goal={null} screen={scr} />
      </HostGround>
      <RefusalShowcase option={option} screen={scr} />
    </Scene>
  );
};

/* ── decision 5: prices (reads `refusal`) ────────────────────────────────── */

const prices = (s: BoardState, option: PricesLayout) => {
  const scr = screen(s);
  return (
    <Scene id={`prices-${option}`} screen={scr} title="The six prices">
      <HostGround screen={scr}>
        <AccountScope order="flat" goal={null} screen={scr} />
      </HostGround>
      <PricesShowcase
        layout={option}
        refusal={refusalOf(s.refusal as string)}
        screen={scr}
      />
    </Scene>
  );
};

const PREVIEWS: PreviewsFor<typeof HOST_STORAGE> = {
  "where.account": (s) => where(s, "account"),
  "where.album": (s) => where(s, "album"),
  "where.sheet": (s) => where(s, "sheet"),
  "order.flat": (s) => order(s, "flat"),
  "order.grouped": (s) => order(s, "grouped"),
  "order.hybrid": (s) => order(s, "hybrid"),
  "goal.live": (s) => goal(s, "live"),
  "goal.plain": (s) => goal(s, "plain"),
  "goal.toast": (s) => goal(s, "toast"),
  "refusal.inline": (s) => refusal(s, "inline"),
  "refusal.swap": (s) => refusal(s, "swap"),
  "refusal.banner": (s) => refusal(s, "banner"),
  "prices.rows": (s) => prices(s, "rows"),
  "prices.cards": (s) => prices(s, "cards"),
  "prices.matrix": (s) => prices(s, "matrix"),
};

export function HostStorageBoard() {
  return <ExplorationBoard spec={HOST_STORAGE} previews={PREVIEWS} />;
}
