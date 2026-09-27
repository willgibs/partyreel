"use client";

import type { ReactNode } from "react";
import { ArrowUpRight, Check } from "lucide-react";

import { PageHeading } from "@/components/shared/page-heading";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { PRO_BENEFITS, PRO_ROWS } from "./fixtures";
import { AccountPage, Dashboard, HostBar, HostHub, OverLimit } from "./grounds";
import { type PhoneScene, Scenes } from "./scene";
import { settingsParts } from "./settings";
import {
  BottomSheet,
  CentredDialog,
  type Parts,
  PhoneScreen,
  SidePanel,
  type Size,
} from "./surfaces";

/**
 * PLANS: the pricing sheet (`pricing-sheet.tsx`), opened from nine places.
 * Three are drawn: Maya out of room on her dashboard (a Free host, Free beside
 * Pro 100 GB), the Password lock in Settings (a second sheet over the settings
 * sheet today), and a Pro host changing size from her account (six prices).
 * The headlines, cards, pass line and foot are production's, verbatim.
 */

export type PlanOption = "sheet" | "wide" | "page";
export type PlanScreen = "room" | "lock" | "pro";

export const planAtOf = (v: string | undefined): PlanScreen =>
  v === "lock" || v === "pro" ? v : "room";

const OPTION_TITLE: Record<PlanOption, string> = {
  sheet: "The one Sheet, as today",
  wide: "A wide dialog, its own screen in a hand",
  page: "A plan page of its own",
};

const SCREEN_TITLE: Record<PlanScreen, string> = {
  room: "out of room, from the dashboard",
  lock: "the Password lock, from Settings",
  pro: "a Pro host changing size",
};

const HEAD: Record<PlanScreen, { title: string; sub: string }> = {
  room: {
    title: "You are out of room",
    sub: "Pro 100 GB holds about 25,600 photos or 11 hours of video, and your guests can keep going.",
  },
  lock: {
    title: "Password locks are on every paid plan",
    sub: "On Free, anyone holding the link can open the album.",
  },
  pro: {
    title: "You are on Pro already",
    sub: "Change your size, or switch between monthly and yearly, here. Your card, invoices and cancelling stay in the billing portal.",
  },
};

/* ── the plans, production's cards ───────────────────────────────────────── */

function PlanCard({
  name,
  price,
  holds,
  ink = false,
  children,
}: {
  name: string;
  price: string;
  holds: string;
  ink?: boolean;
  children?: ReactNode;
}) {
  return (
    <div
      className={cn(
        "flex min-w-0 flex-1 flex-col gap-3 rounded-xl border p-4",
        ink ? "border-transparent bg-foreground" : "bg-card",
      )}
    >
      <div className="space-y-1">
        <p
          className={cn(
            "text-sm font-medium",
            ink ? "text-background" : "text-foreground",
          )}
        >
          {name}
        </p>
        <p
          className={cn(
            "font-heading text-subsection tabular-nums",
            ink && "text-background",
          )}
        >
          {price}
        </p>
        <p className={cn("text-xs", ink ? "text-background/70" : "text-faint")}>
          {holds}
        </p>
      </div>
      {children}
    </div>
  );
}

/** Free beside Pro 100 GB, the pass on one line under them. */
function FreePlans({ wide = false }: { wide?: boolean }) {
  return (
    <div className="space-y-3">
      <div className={cn("flex gap-3", wide && "gap-4")}>
        <PlanCard name="Free" price="$0" holds="about 512 photos">
          <span className="mt-auto inline-flex h-7 items-center justify-center rounded-action-sm border border-border text-xs text-muted-foreground">
            Your plan
          </span>
        </PlanCard>
        <PlanCard
          name="Pro 100 GB"
          price="$9/mo"
          holds="about 25,600 photos or 11 hours of video"
          ink
        >
          <ul className="space-y-1.5">
            {PRO_BENEFITS.map((line) => (
              <li key={line} className="flex items-start gap-2 text-xs">
                <Check
                  className="mt-0.5 size-3.5 shrink-0 text-background/70"
                  strokeWidth={2}
                  aria-hidden
                />
                <span className="text-background/80">{line}</span>
              </li>
            ))}
          </ul>
          <Button
            size="sm"
            variant="secondary"
            className="mt-auto w-full"
            tabIndex={-1}
            data-pop-primary=""
          >
            Get Pro 100 GB
          </Button>
        </PlanCard>
      </div>
      <div className="flex items-center justify-between gap-3 rounded-xl border border-dashed p-3">
        <p className="min-w-0 text-xs text-muted-foreground">
          <span className="font-medium text-foreground">Event Pass</span> one
          event, paid once: $24 for 75 GB.
        </p>
        <Button size="sm" variant="outline" className="shrink-0" tabIndex={-1}>
          Buy a pass
        </Button>
      </div>
    </div>
  );
}

/** `pro-price-list.tsx`: six prices, size first, hers marked. */
function ProRows() {
  return (
    <div className="space-y-3">
      <ul
        data-pop-rows=""
        data-pop-noun="prices"
        className="divide-y divide-border rounded-xl border"
      >
        {PRO_ROWS.map((p, i) => (
          <li
            key={p.id}
            data-pop-row=""
            className="flex min-h-12 items-center justify-between gap-3 px-3 py-2"
          >
            <div className="min-w-0">
              <p className="text-sm font-medium text-foreground">{p.name}</p>
              <p className="text-xs text-muted-foreground tabular-nums">
                {p.price}
              </p>
            </div>
            {p.state === "current" ? (
              <span className="inline-flex h-7 items-center rounded-action-sm border border-border px-2.5 text-xs text-muted-foreground">
                Your plan
              </span>
            ) : (
              <Button
                size="sm"
                variant="outline"
                className="shrink-0"
                tabIndex={-1}
                data-pop-primary={i === 2 ? "" : undefined}
              >
                Switch
              </Button>
            )}
          </li>
        ))}
      </ul>
      <Button variant="outline" className="w-full" tabIndex={-1}>
        Manage billing
      </Button>
    </div>
  );
}

const FOOT = (
  <span className="flex items-center gap-1 text-xs text-muted-foreground">
    See every plan <ArrowUpRight className="size-3.5" aria-hidden />
  </span>
);

function planParts(screen: PlanScreen, wide = false): Parts {
  return {
    title: HEAD[screen].title,
    description: HEAD[screen].sub,
    body: screen === "pro" ? <ProRows /> : <FreePlans wide={wide} />,
    after: FOOT,
  };
}

/* ── what each plan opens over ───────────────────────────────────────────── */

function ground(
  screen: PlanScreen,
  size: Size,
  overlay?: ReactNode,
): ReactNode {
  const phone = size === "phone";
  if (screen === "room")
    return <Dashboard size={size} banner={<OverLimit />} overlay={overlay} />;
  if (screen === "pro")
    return <AccountPage size={size} plan="pro" overlay={overlay} />;
  // The lock is pressed inside Settings, so Settings is open under the plan.
  const settings = settingsParts("top");
  return (
    <HostHub
      size={size}
      overlay={
        <>
          {phone ? (
            <BottomSheet parts={settings} />
          ) : (
            <SidePanel parts={settings} />
          )}
          {overlay}
        </>
      }
    />
  );
}

/** A plan page of its own: the host's chrome, the plans with room. */
function PlanPage({ screen, size }: { screen: PlanScreen; size: Size }) {
  const parts = planParts(screen, size === "desk");
  return (
    <div
      data-pop-ground=""
      className="min-h-screen bg-background text-foreground"
    >
      <HostBar size={size} trail={["Account", "Plan"]} />
      <main
        data-pop-surface="page"
        className="mx-auto w-full max-w-3xl space-y-5 px-4 py-8"
      >
        <div className="space-y-1.5">
          <PageHeading>{parts.title}</PageHeading>
          <p className="text-sm text-pretty text-muted-foreground">
            {parts.description}
          </p>
        </div>
        {parts.body}
        {FOOT}
      </main>
    </div>
  );
}

function draw(option: PlanOption, screen: PlanScreen, size: Size): ReactNode {
  if (option === "page") return <PlanPage screen={screen} size={size} />;
  const phone = size === "phone";
  const parts = planParts(screen, option === "wide" && !phone);
  const surface =
    option === "wide" ? (
      phone ? (
        <PhoneScreen parts={parts} bar="close" />
      ) : (
        <CentredDialog parts={parts} width="lg" scrollBody />
      )
    ) : phone ? (
      <BottomSheet parts={parts} />
    ) : (
      <SidePanel parts={parts} />
    );
  return ground(screen, size, surface);
}

const PHONES: readonly PlanScreen[] = ["room", "lock", "pro"];

export function PlansPreview({
  option,
  at,
}: {
  option: PlanOption;
  at: PlanScreen;
}) {
  const phones: PhoneScene[] = PHONES.map((screen) => ({
    title: SCREEN_TITLE[screen],
    node: draw(option, screen, "phone"),
  }));
  return (
    <Scenes
      id={`plans-${option}-${at}`}
      title={OPTION_TITLE[option]}
      laptop={draw(option, at, "desk")}
      laptopTitle={SCREEN_TITLE[at]}
      phones={phones}
    />
  );
}
