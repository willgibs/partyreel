"use client";

import {
  PRO_LINE,
  SECTION_HEADERS,
} from "@/lib/constants/marketing-voice";
import type { CSSProperties, ReactNode } from "react";

import {
  EVENT_PASS_RENEWAL_PRICE_LABEL,
  friendlyCapacity,
  MAX_EVENTS,
  type Plan,
  planById,
  plansForTier,
} from "@/lib/constants/tiers";
import { formatCount } from "@/lib/format/count";
import { formatBytes } from "@/lib/utils";

import type { SlideProps } from "../../deck/contract";
import { isDesk, Kicker, Pic, SlideGround } from "../slides/kit";
import { BASE, HOUSE_ROW, ON, Orb } from "../system";
import { Action, IncludeGlyph, LimitGlyph, SiteNav, SiteNavPhone } from "./kit";

/**
 * 11 A LIGHT PAGE: /pricing, in daylight. Three plans on grey chrome: every
 * card the same paper, every mark in ink, every price and limit read straight
 * from `tiers.ts`. Pro carries the page's only colour, and it is people: the
 * house mix, the five house guests who stand in wherever there is no event,
 * here because Pro is for a host with many events still to come. No badge
 * says "most popular": the people say which plan is for hosting again.
 *
 * ★ A CHECK IN A PLAN'S LIST IS INK, NEVER GREEN. It is a fact about the plan,
 * not a state, and green on this page would read as "done" on a page where
 * nothing has happened yet. Status keeps its colours for work.
 */

const FREE = planById("free");
const PASS = planById("event_pass");
const PRO_SIZES = plansForTier("pro");
const PRO = PRO_SIZES[0];

/** "$9/mo" as its number and its cadence, so the number can be the display face. */
function splitPrice(label: string): [string, string] {
  const m = label.match(/^(\$\d+)(.*)$/);
  return m ? [m[1], m[2].replace(/^\//, "/ ").trim()] : [label, ""];
}

const FREE_ITEMS: { t: string; limit?: boolean }[] = [
  { t: `${MAX_EVENTS.free} event, every guest, the album and the reel` },
  { t: "Every gate and a custom link" },
  { t: "Photos only", limit: true },
];
const PRO_ITEMS = [
  "Photos and video",
  `${MAX_EVENTS.pro === null ? "Unlimited events" : "More events"}, one album each`,
  "Clips with no watermark",
];
const PASS_ITEMS = [
  "One payment, no subscription",
  "Photos and video, like Pro",
  `Renew for ${EVENT_PASS_RENEWAL_PRICE_LABEL} a year`,
];

function Item({ children, limit = false, font }: { children: string; limit?: boolean; font: number }) {
  return (
    <li className="flex items-start" style={{ gap: 10 }}>
      <span style={{ paddingTop: font * 0.28 }}>
        {limit ? <LimitGlyph size={12} color={BASE.muted.hex} /> : <IncludeGlyph size={12} color={BASE.ink.hex} />}
      </span>
      <span style={{ color: limit ? BASE.muted.hex : BASE.ink.hex }}>{children}</span>
    </li>
  );
}

function Price({ label, size, read }: { label: string; size: number; read?: string }) {
  const [n, per] = splitPrice(label);
  return (
    <p className="flex items-baseline" style={{ gap: 6 }}>
      <span
        className="ev-display ev-num"
        data-bd-contrast={read}
        style={{ fontSize: size, color: BASE.ink.hex, letterSpacing: "-0.02em" }}
      >
        {n}
      </span>
      {per && (
        <span className="ev-body" style={{ fontSize: size * 0.3, color: BASE.muted.hex }}>
          {per}
        </span>
      )}
    </p>
  );
}

/**
 * What a plan holds, in the numbers a host thinks in: its room, about how
 * many photographs, and hours of video where the plan takes video (the site's
 * own estimate, `friendlyCapacity`).
 */
function Holds({ plan, video, font }: { plan: Plan; video: boolean; font: number }) {
  const cap = friendlyCapacity(plan.storageBytes);
  const stats = [
    { v: formatBytes(plan.storageBytes), k: "Storage" },
    { v: `≈ ${formatCount(cap.photos)}`, k: "Photos" },
    ...(video ? [{ v: `${formatCount(Math.round(cap.videoMinutes / 60))} h`, k: "Video" }] : []),
  ];
  return (
    <div
      className="flex"
      style={{ gap: 30, paddingTop: 14, borderTop: `1px solid ${ON.paper.line}` }}
    >
      {stats.map((st) => (
        <div key={st.k}>
          <p className="ev-body ev-num" style={{ fontSize: font + 1, fontWeight: 600, color: BASE.ink.hex }}>
            {st.v}
          </p>
          <p className="ev-label" style={{ color: BASE.muted.hex, marginTop: 5 }}>
            {st.k}
          </p>
        </div>
      ))}
    </div>
  );
}

/** Pro's size, as one choice of three: the room and its price, the use under it. */
function SizeChoice({ plans, pick, font }: { plans: readonly Plan[]; pick: Plan; font: number }) {
  return (
    <div>
      <div
        className="grid"
        style={{
          gridTemplateColumns: `repeat(${plans.length}, 1fr)`,
          gap: 3,
          padding: 3,
          borderRadius: 8,
          backgroundColor: BASE.step.hex,
        }}
      >
        {plans.map((p) => {
          const on = p.id === pick.id;
          return (
            <div
              key={p.id}
              className="flex flex-col items-center"
              style={{
                padding: "7px 0 6px",
                borderRadius: 6,
                backgroundColor: on ? BASE.card.hex : "transparent",
                boxShadow: on ? `0 1px 2px rgb(0 0 0 / 0.08), 0 0 0 1px ${ON.paper.line}` : undefined,
              }}
            >
              <span className="ev-body ev-num" style={{ fontSize: font, fontWeight: 600, color: BASE.ink.hex }}>
                {formatBytes(p.storageBytes)}
              </span>
              <span className="ev-body ev-num" style={{ fontSize: font - 1.5, color: BASE.muted.hex, marginTop: 1 }}>
                {splitPrice(p.priceLabel)[0]}
              </span>
            </div>
          );
        })}
      </div>
      <p className="ev-body" style={{ fontSize: font - 0.5, color: BASE.muted.hex, marginTop: 8 }}>
        {pick.use}, {formatBytes(pick.storageBytes)}
      </p>
    </div>
  );
}

/** The house mix as a line: the five house guests, parted by the card's own white. */
function HouseLine({ size }: { size: number }) {
  return (
    <div className="ev-row" style={{ ["--ev-row-overlap" as string]: `${-Math.round(size * 0.22)}px` }}>
      {HOUSE_ROW.map((p, i) => (
        <Orb
          key={p.seed}
          seed={p.seed}
          size={size}
          ring={Math.max(2, Math.round(size * 0.09))}
          ringColor={BASE.card.hex}
          style={{ zIndex: 5 - i }}
          title={`A house guest, ${p.name.toLowerCase()}`}
        />
      ))}
    </div>
  );
}

function Card({
  children,
  pad,
  pro = false,
  style,
}: {
  children: ReactNode;
  pad: number;
  pro?: boolean;
  style?: CSSProperties;
}) {
  return (
    <div
      className="flex flex-col"
      style={{
        padding: pad,
        borderRadius: 12,
        backgroundColor: BASE.card.hex,
        boxShadow: pro
          ? `0 0 0 1.5px ${BASE.ink.hex}, 0 18px 40px -26px rgb(0 0 0 / 0.35)`
          : `0 0 0 1px ${ON.paper.line}`,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

function Cards({ desk }: { desk: boolean }) {
  const f = desk ? 14.5 : 15;
  const pad = desk ? 24 : 22;
  const priceSize = desk ? 50 : 50;
  const title = (t: string) => (
    <h2 className="ev-title" style={{ fontSize: desk ? 24 : 23, color: BASE.ink.hex }}>
      {t}
    </h2>
  );
  const line = (t: string, contrast?: string) => (
    <p className="ev-body" data-bd-contrast={contrast} style={{ fontSize: f, color: BASE.muted.hex, marginTop: 6 }}>
      {t}
    </p>
  );
  const list = (items: { t: string; limit?: boolean }[]) => (
    <ul className="ev-body grid" style={{ gap: desk ? 8 : 9, fontSize: f, marginTop: desk ? 16 : 18 }}>
      {items.map((it) => (
        <Item key={it.t} limit={it.limit} font={f}>
          {it.t}
        </Item>
      ))}
    </ul>
  );
  const free = (
    <Card pad={pad} key="free">
      {title(FREE.name)}
      {line("The full experience, for a dinner or a birthday at home.", desk ? "plan line on its card" : undefined)}
      <div style={{ marginTop: 14 }}>
        <Price label={FREE.priceLabel} size={priceSize} read={desk ? "price on its card" : undefined} />
      </div>
      {list(FREE_ITEMS)}
      {/* At a desk the cards share Pro's height, so the room is spent on what the plan holds. */}
      {desk && (
        <div style={{ marginTop: "auto", paddingTop: 20 }}>
          <Holds plan={FREE} video={false} font={f} />
        </div>
      )}
      <div style={{ marginTop: desk ? undefined : "auto", paddingTop: desk ? 18 : 20 }}>
        <Action tone="paper" h={44} font={15} style={{ width: "100%" }}>
          Start free
        </Action>
      </div>
    </Card>
  );
  const pro = (
    <Card pad={pad} pro key="pro">
      <div className="flex items-center justify-between">
        {title("Pro")}
        <HouseLine size={desk ? 22 : 22} />
      </div>
      {line(PRO_LINE)}
      <div style={{ marginTop: 14 }}>
        <Price label={PRO.priceLabel} size={priceSize} />
      </div>
      <div style={{ marginTop: 14 }}>
        <SizeChoice plans={PRO_SIZES} pick={PRO} font={desk ? 13.5 : 14} />
      </div>
      {list(PRO_ITEMS.map((t) => ({ t })))}
      <div style={{ marginTop: "auto", paddingTop: 20 }}>
        <Action tone="paper" solid h={44} font={15} style={{ width: "100%" }} contrastLabel={desk ? "Get Pro on its plate" : undefined}>
          Get Pro at {PRO.priceLabel}
        </Action>
      </div>
    </Card>
  );
  const pass = (
    <Card pad={pad} key="pass">
      {title(PASS.name)}
      {line(`${PASS.use}, kept a year.`)}
      <div style={{ marginTop: 14 }}>
        <Price label={PASS.priceLabel} size={priceSize} />
      </div>
      {list(PASS_ITEMS.map((t) => ({ t })))}
      {desk && (
        <div style={{ marginTop: "auto", paddingTop: 20 }}>
          <Holds plan={PASS} video font={f} />
        </div>
      )}
      <div style={{ marginTop: desk ? undefined : "auto", paddingTop: desk ? 18 : 20 }}>
        <Action tone="paper" h={44} font={15} style={{ width: "100%" }}>
          Buy a pass
        </Action>
      </div>
    </Card>
  );
  return desk ? (
    <div className="grid" style={{ gridTemplateColumns: "1fr 1fr 1fr", gap: 24, alignItems: "stretch" }}>
      {free}
      {pro}
      {pass}
    </div>
  ) : (
    <div className="grid" style={{ gap: 16 }}>
      {pro}
      {free}
      {pass}
    </div>
  );
}

/** Monthly or yearly: a grey choice, and the saving in words (an offer, never a status). */
function Cadence({ desk }: { desk: boolean }) {
  return (
    <div className={desk ? "flex items-center" : "flex flex-col items-start"} style={{ gap: desk ? 14 : 10 }}>
      <div className="grid" style={{ gridTemplateColumns: "1fr 1fr", gap: 3, padding: 3, borderRadius: 9, backgroundColor: BASE.step.hex }}>
        {["Monthly", "Yearly"].map((c, i) => (
          <span
            key={c}
            className="ev-body flex items-center justify-center"
            style={{
              height: 34,
              padding: "0 18px",
              borderRadius: 7,
              fontSize: 14.5,
              fontWeight: 550,
              color: i === 0 ? BASE.ink.hex : BASE.muted.hex,
              backgroundColor: i === 0 ? BASE.card.hex : "transparent",
              boxShadow: i === 0 ? `0 1px 2px rgb(0 0 0 / 0.08), 0 0 0 1px ${ON.paper.line}` : undefined,
            }}
          >
            {c}
          </span>
        ))}
      </div>
      <span className="ev-body" style={{ fontSize: desk ? 14.5 : 14, color: BASE.muted.hex }}>
        Yearly is two months free
      </span>
    </div>
  );
}

const SUB = "No per-guest fees. Plans are sized by storage, so pick the room your event actually needs.";
const H1 = SECTION_HEADERS.pricing.line;

function PricingDesk() {
  return (
    <SlideGround tone="paper" screen="1440" pad={false}>
      <div className="absolute" style={{ left: 0, top: 56 }}>
        <SiteNav tone="paper" dot="house:305" h={72} />
      </div>
      <div className="absolute" style={{ left: 56, top: 150, width: 600 }}>
        <Kicker tone="paper">Pricing</Kicker>
        <h1 className="ev-display" data-bd-read="H1 on paper" style={{ fontSize: 66, marginTop: 14, color: BASE.ink.hex }}>
          {H1}
        </h1>
        <p className="ev-body" data-bd-contrast="subline on paper" style={{ fontSize: 18, lineHeight: 1.5, marginTop: 18, color: BASE.muted.hex, width: 540 }}>
          {SUB}
        </p>
        <div style={{ marginTop: 22 }}>
          <Cadence desk />
        </div>
      </div>
      {/* Position inline: the photograph's own class is unlayered and would beat a utility. */}
      <Pic id="reception-hall" focus="50% 55%" style={{ position: "absolute", left: 712, top: 150, width: 672, height: 284 }} />
      <div className="absolute" style={{ left: 56, right: 56, top: 462 }}>
        <Cards desk />
      </div>
    </SlideGround>
  );
}

function PricingPhone() {
  return (
    <SlideGround tone="paper" screen="375" pad={false}>
      <div style={{ height: 52 }} />
      <SiteNavPhone tone="paper" dot="house:305" />
      <div style={{ padding: "26px 20px 0" }}>
        <Kicker tone="paper">Pricing</Kicker>
        <h1 className="ev-display" data-bd-read="H1 on paper, on a phone" style={{ fontSize: 40, marginTop: 12, color: BASE.ink.hex }}>
          {H1}
        </h1>
        <p className="ev-body" style={{ fontSize: 16, lineHeight: 1.5, marginTop: 14, color: BASE.muted.hex }}>
          {SUB}
        </p>
        <div style={{ marginTop: 18 }}>
          <Cadence desk={false} />
        </div>
      </div>
      <Pic id="reception-hall" focus="50% 55%" style={{ marginTop: 26, width: 375, height: 170, borderRadius: 0 }} />
      <div style={{ padding: "22px 20px 0" }}>
        <Cards desk={false} />
      </div>
    </SlideGround>
  );
}

export function PricingPage({ screen }: SlideProps) {
  return isDesk(screen) ? <PricingDesk /> : <PricingPhone />;
}
