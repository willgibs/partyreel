"use client";

import type { CSSProperties, ReactNode } from "react";

import { passHoldsLine } from "@/components/app/pricing/holds";
import { PRO_LINE } from "@/lib/constants/marketing-voice";
import { EVENT_PASS_RENEWAL_PRICE_LABEL, MAX_EVENTS, planById } from "@/lib/constants/tiers";
import { formatBytes } from "@/lib/utils";

import { HEAD } from "../../deck/deck";
import { Display, type Screen, SlideRoot } from "../parts";
import { edgeCode, EdgeArrow, EVENTS, GROUND, Print, Strip, type StripFrame } from "../system";
import { Pill, SiteClose, SiteNav } from "./kit";

/**
 * 11 A LIGHT PAGE (/pricing): paper, the page's whole ground, footer too.
 * The three plans are three prints, each with its facts printed on its edge
 * the way a stock prints its own: Free a single print (one event), Pro a
 * strip of three frames, each a different event's album in its own light
 * (unlimited events, one album each), the Event Pass a single print kept a
 * year. Prices in the display face, lists on the edge's arrow, never on a
 * status tick: a plan's line is a fact, not a state.
 *
 * Every price and limit is read from `tiers.ts`, never typed here.
 */

const FREE = planById("free");
const PRO = [planById("pro_50"), planById("pro_200"), planById("pro_1tb")] as const;
const PRO_YEAR = planById("pro_50_yr");
const PASS = planById("event_pass");

const PRICING_LINE = "Start free, upgrade for video and more room.";
const PRICING_SUB = "No per-guest fees. Plans are sized by storage, so pick the room your event actually needs.";

/** A price label's number and its tail ("$9" and "/mo", "$29" and "one-time"). */
function splitPrice(label: string): [string, string] {
  const m = label.match(/^(\$[\d,]+)\s*(.*)$/);
  return m ? [m[1], m[2]] : [label, ""];
}

/** Pro's strip: three events, an album each, each frame credited to its event. */
const PRO_FRAMES: readonly StripFrame[] = [
  { photo: "wedding-toast", n: edgeCode(EVENTS[0].seed), who: { name: EVENTS[0].name, seed: EVENTS[0].seed } },
  { photo: "party-dj", n: edgeCode(EVENTS[1].seed), who: { name: EVENTS[1].name, seed: EVENTS[1].seed } },
  { photo: "reception-hall", n: edgeCode(EVENTS[3].seed), who: { name: EVENTS[3].name, seed: EVENTS[3].seed } },
];

type Plan = {
  key: string;
  name: string;
  price: string;
  line: string;
  points: readonly string[];
  limits?: readonly string[];
  /** The list a phone keeps (the same facts, fewer of them). */
  short: readonly string[];
  note?: string;
  action: string;
  primary?: boolean;
};

const PLANS: readonly Plan[] = [
  {
    key: "free",
    name: FREE.name,
    price: FREE.priceLabel,
    line: "The full experience, for a dinner or a birthday at home.",
    points: [
      `${MAX_EVENTS.free} event, every guest, the album and the reel`,
      "Every gate and a custom link",
      "No watermark on photos or the album",
    ],
    limits: ["Photos only", "A small mark on clips"],
    short: [`${MAX_EVENTS.free} event, every guest, the album and the reel`, "Every gate and a custom link"],
    action: "Start free",
  },
  {
    key: "pro",
    name: "Pro",
    price: PRO[0].priceLabel,
    line: PRO_LINE,
    points: [
      `Everything in ${FREE.name}`,
      "Photos and video",
      "Unlimited events, one album each",
      "Clips with no watermark",
      "Never removed for inactivity",
    ],
    short: ["Photos and video", "Unlimited events, one album each", "Clips with no watermark"],
    note: `Or ${PRO_YEAR.priceLabel.replace("/yr", "")} a year, two months free.`,
    action: `Get Pro at ${PRO[0].priceLabel}`,
    primary: true,
  },
  {
    key: "pass",
    name: PASS.name,
    price: PASS.priceLabel,
    line: `${passHoldsLine(PASS.storageBytes)}.`,
    points: [
      "One payment, no subscription",
      "Photos and video, like Pro",
      "Clips with no watermark",
      `Passes stack: each adds an event and ${formatBytes(PASS.storageBytes)}`,
    ],
    short: ["One payment, no subscription", "Photos and video, like Pro"],
    note: `Kept about a year. Renew for ${EVENT_PASS_RENEWAL_PRICE_LABEL} a year, or let it lapse.`,
    action: "Buy a pass",
  },
];

/** The picture a plan sits under: a print, or for Pro a strip of three albums. */
function PlanPicture({
  plan,
  w,
  edgeSize,
  ratio = w > 360 ? 2.75 : 3,
  compact = false,
}: {
  plan: Plan;
  w: number;
  edgeSize: number;
  ratio?: number;
  /** A small print: its edge drops the plan's name, which sits beside it. */
  compact?: boolean;
}) {
  const border = Math.max(6, Math.round(w * 0.035));
  if (plan.key === "pro") {
    // The strip stands exactly as tall as its neighbours' prints, so the three
    // pictures share one line along their foot.
    const printH = border + Math.round((w - 2 * border) / ratio) + Math.max(border, Math.round(edgeSize * 2.3));
    const fh = printH - Math.round(edgeSize * 2.4) - Math.round(edgeSize * 2.6);
    const pad = 10;
    const gap = 6;
    const count = w > 360 ? 3 : 2;
    const frameW = Math.floor((w - pad * 2 - gap * (count - 1)) / count);
    return (
      <Strip
        frames={PRO_FRAMES.slice(0, count)}
        frameW={frameW}
        ratio={frameW / fh}
        gap={gap}
        pad={pad}
        edgeSize={edgeSize}
        top={["Pro", formatBytes(PRO[0].storageBytes), "Unlimited events", "Photos and video"]}
        style={{ width: w }}
      />
    );
  }
  const free = plan.key === "free";
  return (
    <Print
      photo={free ? "party-balloons" : "wedding-golden"}
      focus={free ? "50% 30%" : "55% 45%"}
      w={w}
      ratio={ratio}
      border={border}
      edge={[
        ...(compact ? [] : [free ? FREE.name : PASS.name]),
        ...(free
          ? [formatBytes(FREE.storageBytes), `${MAX_EVENTS.free} event`]
          : [formatBytes(PASS.storageBytes), `${MAX_EVENTS.event_pass} event`, "A year"]),
      ]}
      edgeSize={edgeSize}
      flat
      read={`${plan.name}'s print and its edge`}
    />
  );
}

/** A plan's list, on the edge's arrow. */
function Points({ plan, size, phone = false }: { plan: Plan; size: number; phone?: boolean }) {
  const lead = Math.round(size * 1.5);
  const row = (t: string, limit: boolean): ReactNode => (
    <li
      key={t}
      className="cs-read"
      style={{ display: "flex", gap: 10, fontSize: size, lineHeight: `${lead}px`, color: limit ? GROUND.faint.hex : undefined }}
    >
      <span className="cs-edge" style={{ height: lead, fontSize: size * 0.78, flex: "none", width: size * 0.5 }} aria-hidden>
        {limit ? <span style={{ width: "0.7em", height: 1.5, background: "currentColor", display: "block" }} /> : <EdgeArrow />}
      </span>
      <span>{t}</span>
    </li>
  );
  return (
    <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "grid", gap: 4 }}>
      {(phone ? plan.short : plan.points).map((t) => row(t, false))}
      {(phone ? plan.limits?.slice(0, 1) : plan.limits)?.map((t) => row(t, true))}
    </ul>
  );
}

/** Pro's size, picked on one row: each size and its price, exact. */
function Sizes({ size }: { size: number }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(3, 1fr)",
        padding: 3,
        borderRadius: 11,
        background: GROUND.sheet.hex,
        boxShadow: "inset 0 0 0 1px rgb(22 18 15 / 0.08)",
      }}
      aria-label="Pro's size"
    >
      {PRO.map((p, i) => (
        <span
          key={p.id}
          className="cs-read"
          style={{
            display: "flex",
            alignItems: "baseline",
            justifyContent: "center",
            gap: 6,
            height: Math.round(size * 2.4),
            lineHeight: `${Math.round(size * 2.4)}px`,
            borderRadius: 8,
            fontSize: size,
            fontWeight: 600,
            background: i === 0 ? GROUND.print.hex : undefined,
            boxShadow: i === 0 ? "0 1px 2px rgb(22 18 15 / 0.12), 0 0 0 1px rgb(22 18 15 / 0.06)" : undefined,
            color: i === 0 ? GROUND.ink.hex : GROUND.ink2.hex,
          }}
        >
          {formatBytes(p.storageBytes)}
          <span style={{ fontWeight: 500, color: GROUND.ink2.hex }}>{splitPrice(p.priceLabel)[0]}</span>
        </span>
      ))}
    </div>
  );
}

function PlanColumn({ plan, w, phone = false, style }: { plan: Plan; w: number; phone?: boolean; style?: CSSProperties }) {
  const [num, tail] = splitPrice(plan.price);
  const body = phone ? 15 : 14;
  return (
    <div style={{ width: w, display: "flex", flexDirection: "column", ...style }}>
      <PlanPicture plan={plan} w={w} edgeSize={phone ? 9 : 10} />
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginTop: phone ? 18 : 20 }}>
        <Display as="h2" size={phone ? 28 : 30} style={{ lineHeight: 1 }}>
          {plan.name}
        </Display>
        <span style={{ display: "inline-flex", alignItems: "baseline", gap: 6 }} data-bd-read={`${plan.name}'s price`}>
          <span className="cs-display cs-tnum" style={{ fontSize: phone ? 40 : 44, letterSpacing: "-0.03em", lineHeight: 1 }}>
            {num}
          </span>
          {tail && (
            <span className="cs-read cs-muted" style={{ fontSize: 14, fontWeight: 500 }}>
              {tail}
            </span>
          )}
        </span>
      </div>
      <p className="cs-read cs-muted" style={{ margin: "6px 0 0", fontSize: body, lineHeight: `${Math.round(body * 1.45)}px` }}>
        {plan.line}
      </p>
      <div style={{ marginTop: phone ? 14 : 16 }}>
        <Points plan={plan} size={body} phone={phone} />
      </div>
      {plan.key === "pro" && (
        <div style={{ marginTop: 16 }}>
          <Sizes size={13} />
        </div>
      )}
      {plan.note && (
        <p className="cs-read cs-muted" style={{ margin: "10px 0 0", fontSize: 13, lineHeight: "19px" }}>
          {plan.note}
        </p>
      )}
      <div style={{ marginTop: phone ? 16 : "auto", paddingTop: phone ? 0 : 16 }}>
        <Pill size={15} tone={plan.primary ? "ink" : "line"} wide>
          {plan.action}
        </Pill>
      </div>
    </div>
  );
}

/**
 * A PLAN AS A ROW, for a phone: its print beside its name, price and line.
 * The print's edge carries the plan's facts, so the row needs no list.
 */
function PlanRow({ plan }: { plan: Plan }) {
  const [num, tail] = splitPrice(plan.price);
  return (
    <div style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
      <PlanPicture plan={plan} w={150} edgeSize={9} ratio={1} compact />
      <div style={{ flex: 1, minWidth: 0 }}>
        <Display as="h2" size={24} style={{ lineHeight: 1 }}>
          {plan.name}
        </Display>
        <span style={{ display: "inline-flex", alignItems: "baseline", gap: 5, marginTop: 6 }} data-bd-read={`${plan.name}'s price`}>
          <span className="cs-display cs-tnum" style={{ fontSize: 32, letterSpacing: "-0.03em", lineHeight: 1 }}>
            {num}
          </span>
          {tail && (
            <span className="cs-read cs-muted" style={{ fontSize: 13, fontWeight: 500 }}>
              {tail}
            </span>
          )}
        </span>
        <p className="cs-read cs-muted" style={{ margin: "8px 0 0", fontSize: 14, lineHeight: "20px" }}>
          {plan.line}
        </p>
        {plan.note && (
          <p className="cs-read cs-muted" style={{ margin: "6px 0 0", fontSize: 13, lineHeight: "19px" }}>
            {plan.note}
          </p>
        )}
        <div style={{ marginTop: 12 }}>
          <Pill size={14} tone="line" wide>
            {plan.action}
          </Pill>
        </div>
      </div>
    </div>
  );
}

/** Monthly or yearly, the page's one switch. */
function Cadence() {
  return (
    <div style={{ display: "inline-flex", alignItems: "center", gap: 12 }}>
      <span
        style={{
          display: "inline-flex",
          padding: 3,
          borderRadius: 11,
          background: GROUND.sheet.hex,
          boxShadow: "inset 0 0 0 1px rgb(22 18 15 / 0.08)",
        }}
      >
        {["Monthly", "Yearly"].map((t, i) => (
          <span
            key={t}
            className="cs-read"
            style={{
              height: 34,
              lineHeight: "34px",
              padding: "0 16px",
              borderRadius: 8,
              fontSize: 14,
              fontWeight: 600,
              background: i === 0 ? GROUND.print.hex : undefined,
              boxShadow: i === 0 ? "0 1px 2px rgb(22 18 15 / 0.12), 0 0 0 1px rgb(22 18 15 / 0.06)" : undefined,
              color: i === 0 ? GROUND.ink.hex : GROUND.ink2.hex,
            }}
          >
            {t}
          </span>
        ))}
      </span>
      <span className="cs-read cs-muted" style={{ fontSize: 13 }}>
        Yearly is two months free
      </span>
    </div>
  );
}

export function LightPage({ layout, top = 0 }: { layout: "desk" | "phone"; top?: number }) {
  return layout === "desk" ? <LightDesk top={top} /> : <LightPhone top={top} />;
}

function LightDesk({ top }: { top: number }) {
  const colW = 400;
  const gap = 56;
  return (
    <div style={{ position: "relative", width: 1440, height: 900 }}>
      <div style={{ position: "absolute", left: 0, right: 0, top }}>
        <SiteNav layout="desk" current="Pricing" />
      </div>
      <div className="absolute" style={{ left: 64, right: 64, top: top + 96 }}>
        <Display as="h1" size={50} style={{ lineHeight: 1 }}>
          <span data-bd-read="h1, the page's own line">{PRICING_LINE}</span>
        </Display>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 16 }}>
          <p className="cs-read cs-muted" style={{ margin: 0, fontSize: 17, lineHeight: "26px" }}>
            {PRICING_SUB}
          </p>
          <Cadence />
        </div>
      </div>
      <div className="absolute" style={{ left: 64, top: top + 238, display: "flex", gap, height: 556 }}>
        {PLANS.map((p) => (
          <PlanColumn key={p.key} plan={p} w={colW} />
        ))}
      </div>
    </div>
  );
}

function LightPhone({ top }: { top: number }) {
  return (
    <div style={{ position: "relative", width: 375 }}>
      <div style={{ height: top }} />
      <SiteNav layout="phone" />
      <div style={{ padding: "26px 16px 0" }}>
        <Display as="h1" size={36} style={{ lineHeight: 1 }}>
          <span data-bd-read="h1, the page's own line">{PRICING_LINE}</span>
        </Display>
        <p className="cs-read cs-muted" style={{ margin: "14px 0 0", fontSize: 16, lineHeight: "24px" }}>
          {PRICING_SUB}
        </p>
        <div style={{ marginTop: 28 }}>
          <PlanColumn plan={PLANS[1]} w={343} phone />
        </div>
        <div style={{ display: "grid", gap: 26, marginTop: 40, paddingTop: 28, borderTop: "1px solid rgb(22 18 15 / 0.1)" }}>
          <PlanRow plan={PLANS[0]} />
          <PlanRow plan={PLANS[2]} />
        </div>
      </div>
      <div style={{ marginTop: 48 }}>
        <SiteClose layout="phone" />
      </div>
    </div>
  );
}

/* ── the slide ───────────────────────────────────────────────────────────── */

export function LightPageSlide({ screen }: { screen: Screen }) {
  const desk = screen === "1440";
  return (
    <SlideRoot screen={screen}>
      <div style={{ position: "absolute", left: 0, top: 0 }}>
        <LightPage layout={desk ? "desk" : "phone"} top={HEAD[screen]} />
      </div>
    </SlideRoot>
  );
}
