"use client";

import "./host-storage.css";

import { ExplorationBoard } from "@/components/lab";
import type { BoardState } from "@/components/lab/board-spec";
import type { PreviewsFor } from "@/components/lab/exploration";

import { type PricesLayout, PricesShowcase, type RefusalOption, RefusalShowcase } from "./pricing";
import { HostGround, Scene, screenOf, type ScreenId } from "./scene";
import { HOST_STORAGE } from "./spec";
import { AccountScope } from "./storage-list";

/**
 * THE PREVIEWS, AND NOTHING ELSE: every option is the real host pieces at a
 * real viewport, one thing changed. The screen knob all four decisions share
 * lives in `scene.tsx`; a staged decision reads the earlier answers off the
 * board's own state (`order` before `goal`, `refusal` before `prices`), the
 * same "wears its parent's recommendation until he answers" rule every
 * exploration in the kit follows. Every list is the account-wide one: where
 * it opens moved to the `popups` board's `lists`, every option kept.
 */

const screen = (s: BoardState): ScreenId => screenOf(s.screen as string);

type OrderOption = "flat" | "grouped" | "hybrid";
const orderOf = (v: string | undefined): OrderOption =>
  v === "grouped" ? "grouped" : v === "hybrid" ? "hybrid" : "flat";

type GoalOption = "live" | "plain" | "toast";

const refusalOf = (v: string | undefined): RefusalOption =>
  v === "swap" ? "swap" : v === "banner" ? "banner" : "inline";

/* ── decision 1: order ───────────────────────────────────────────────────── */

const order = (s: BoardState, option: OrderOption) => {
  const scr = screen(s);
  return (
    <Scene id={`order-${option}`} screen={scr} title="The order">
      <HostGround screen={scr}>
        <AccountScope order={option} goal={null} screen={scr} />
      </HostGround>
    </Scene>
  );
};

/* ── decision 2: goal (reads `order`) ────────────────────────────────────── */

const goal = (s: BoardState, option: GoalOption) => {
  const scr = screen(s);
  const o = orderOf(s.order as string);
  return (
    <Scene id={`goal-${option}`} screen={scr} title="The goal">
      <HostGround screen={scr}>
        <AccountScope order={o} goal={option} screen={scr} />
      </HostGround>
    </Scene>
  );
};

/* ── decision 3: refusal ──────────────────────────────────────────────────── */

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

/* ── decision 4: prices (reads `refusal`) ────────────────────────────────── */

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
