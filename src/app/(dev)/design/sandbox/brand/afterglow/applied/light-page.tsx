"use client";

import type { CSSProperties, ReactNode } from "react";

import { partiesLine, passHoldsLine } from "@/components/app/pricing/holds";
import { PRO_LINE } from "@/lib/constants/marketing-voice";
import {
  EVENT_PASS_RENEWAL_PRICE_LABEL,
  MAX_EVENTS,
  planById,
  plansForTier,
} from "@/lib/constants/tiers";
import { formatBytes } from "@/lib/utils";

import type { SlideProps } from "../../deck/contract";
import type { PhotoId } from "../../deck/media";
import { ink, SlideRoot } from "../root";
import { Bloom, GROUND, HOUSE, lightOfPhotos, LitPhoto, Readout } from "../system";
import { BrowserWindow, Btn, Glyph, Note, PhoneView, SiteFooter, SiteNav } from "./kit";

/**
 * 11 A LIGHT PAGE: /pricing on paper, where people read and decide. The page
 * is paper to its last pixel (the foot included, its top edge lit in paper's
 * register); the plans are paper cards with ink words; and the one light is
 * the Pro card's Bloom, the light of the photographs on it (a golden-hour
 * wedding, a birthday, a concert, a toast: Pro is for more events, so its
 * light is several events'), in paper's register: born thin and bright at the
 * card's edge and spent within a few millimetres, so it reads as light on
 * paper and never as a stain. The ticks are ink; a plan is never a status.
 *
 * ★ EVERY PRICE AND LIMIT IS READ FROM ITS ONE HOME (`tiers.ts`, the voice's
 * `PRO_LINE`, `holds.ts`), never typed here.
 */

const free = planById("free");
const pass = planById("event_pass");
const proSizes = plansForTier("pro");
const pro = proSizes[0];

/** Production's Pro stack: four events' photographs, so its light is several events'. */
const STACK: readonly PhotoId[] = ["wedding-golden", "party-balloons", "concert-confetti", "wedding-toast"];
const PRO_LIGHT = lightOfPhotos(STACK);

const H1 = "Start free, upgrade for video and more room.";
const SUB = "No per-guest fees. Plans are sized by storage, so pick the room your event actually needs.";

/* ── the parts of a plan ──────────────────────────────────────────────────── */

function Item({ children, limit = false }: { children: ReactNode; limit?: boolean }) {
  const t = ink("paper");
  return (
    <li className="flex items-start" style={{ gap: 9, fontSize: 14, lineHeight: 1.45, color: limit ? t.faint : t.fg }}>
      <Glyph name={limit ? "dash" : "check"} size={16} weight={2} style={{ marginTop: 1.5, color: limit ? t.faint : t.fg }} />
      <span>{children}</span>
    </li>
  );
}

function Stats({ items }: { items: readonly (readonly [string, string])[] }) {
  const t = ink("paper");
  return (
    <div className="flex" style={{ borderTop: "1px solid rgb(20 20 22 / 0.08)", borderBottom: "1px solid rgb(20 20 22 / 0.08)" }}>
      {items.map(([value, label], i) => (
        <div
          key={label}
          className="flex flex-1 flex-col"
          style={{ padding: "10px 0 9px", paddingLeft: i ? 14 : 0, borderLeft: i ? "1px solid rgb(20 20 22 / 0.08)" : undefined }}
        >
          <span className="ag-num" style={{ fontSize: 15, fontWeight: 600 }}>
            {value}
          </span>
          <Readout style={{ color: t.faint, marginTop: 2 }}>{label}</Readout>
        </div>
      ))}
    </div>
  );
}

/** A segmented control in paper's own greys: the chosen segment is a lifted card, never a hue. */
function Segments({ options, on, style }: { options: readonly string[]; on: string; style?: CSSProperties }) {
  return (
    <span className="ag-seg" style={style}>
      {options.map((o) => (
        <span key={o} data-on={o === on ? "" : undefined}>
          {o}
        </span>
      ))}
    </span>
  );
}

function Price({ label, size }: { label: string; size: number }) {
  // "$29 one-time" and "$9/mo": the figure loud, its terms small.
  const m = label.match(/^(\$\d+)(.*)$/);
  return (
    <p className="ag-title ag-num" style={{ fontSize: size, letterSpacing: "-0.04em" }}>
      {m ? m[1] : label}
      {m && m[2] ? (
        <span style={{ fontSize: Math.round(size * 0.42), letterSpacing: "-0.01em", marginLeft: m[2].startsWith("/") ? 1 : 8 }}>
          {m[2].trim()}
        </span>
      ) : null}
    </p>
  );
}

const card: CSSProperties = {
  background: GROUND.paperCard.hex,
  borderRadius: 18,
  boxShadow: "0 0 0 1px rgb(20 20 22 / 0.08), 0 1px 2px rgb(20 20 22 / 0.04)",
};

/** The photographs on the Pro card: the source of its light. */
function Stack({ size }: { size: number }) {
  return (
    <div className="relative" style={{ width: size * 2.3, height: size * 1.06 }}>
      {STACK.map((id, i) => (
        <LitPhoto
          key={id}
          id={id}
          ground="paper"
          style={{
            position: "absolute",
            left: i * size * 0.43,
            top: [6, 1, 3, 7][i],
            width: size,
            height: size,
            borderRadius: 3,
            transform: `rotate(${[-8, -3, 3, 8][i]}deg)`,
            boxShadow: "0 0 0 2.5px #ffffff, 0 4px 12px -3px rgb(20 20 22 / 0.3)",
          }}
        />
      ))}
    </div>
  );
}

function FreeCard({ compact = false }: { compact?: boolean }) {
  const t = ink("paper");
  return (
    <div className="flex h-full flex-col" style={{ ...card, padding: compact ? 22 : 28 }}>
      <div className="flex items-baseline justify-between">
        <p className="ag-subtitle" style={{ fontSize: compact ? 22 : 26 }}>
          {free.name}
        </p>
        {compact ? <Price label={free.priceLabel} size={34} /> : null}
      </div>
      <p className="ag-body" style={{ color: t.muted, marginTop: 6, fontSize: 14 }}>
        The full experience, for a dinner or a birthday at home.
      </p>
      {compact ? null : (
        <>
          <div style={{ marginTop: 18 }}>
            <Price label={free.priceLabel} size={50} />
          </div>
          <div style={{ marginTop: 16 }}>
            <Stats items={[[formatBytes(free.storageBytes), "Storage"], [`${MAX_EVENTS.free}`, "Event"]]} />
          </div>
          <ul className="flex flex-col" style={{ gap: 7, marginTop: 18 }}>
            <Item>{MAX_EVENTS.free} event, every guest, the album and the reel</Item>
            <Item>Every gate and a custom link</Item>
            <Item>No watermark on photos or the album</Item>
            <Item limit>Photos only</Item>
            <Item limit>A small mark on clips</Item>
          </ul>
        </>
      )}
      <div style={{ marginTop: compact ? 16 : "auto", paddingTop: compact ? 0 : 20 }}>
        <Btn ground="paper" kind="secondary" size="md" wide>
          Start free
        </Btn>
      </div>
    </div>
  );
}

function ProCard({ phone = false }: { phone?: boolean }) {
  const t = ink("paper");
  return (
    <Bloom light={PRO_LIGHT} ground="paper" radius={18} blur={phone ? 16 : 20} spread={3} style={{ height: "100%" }}>
      <div className="flex h-full flex-col" style={{ ...card, padding: 28 }}>
        <div className="flex items-start justify-between">
          <div>
            <p className="ag-subtitle" style={{ fontSize: 26 }}>
              Pro
            </p>
            <p className="ag-body" style={{ color: t.muted, marginTop: 6, fontSize: 14 }}>
              {PRO_LINE}
            </p>
          </div>
          <div style={{ marginTop: -4, marginRight: 4 }}>
            <Stack size={phone ? 46 : 50} />
          </div>
        </div>
        <div style={{ marginTop: 18 }}>
          <Price label={pro.priceLabel} size={50} />
        </div>
        <div style={{ marginTop: 16 }}>
          <Segments options={proSizes.map((p) => formatBytes(p.storageBytes))} on={formatBytes(pro.storageBytes)} style={{ width: "100%" }} />
          <p className="ag-caption" style={{ color: t.muted, marginTop: 8 }}>
            {partiesLine(pro)}.
          </p>
        </div>
        <ul className="flex flex-col" style={{ gap: 7, marginTop: 16 }}>
          <Item>Everything in {free.name}</Item>
          <Item>Photos and video</Item>
          <Item>Unlimited events, one album each</Item>
          <Item>Clips with no watermark</Item>
        </ul>
        <div style={{ marginTop: "auto", paddingTop: 20 }}>
          <Btn ground="paper" size="md" wide>
            Get Pro at {pro.priceLabel}
          </Btn>
          <p className="ag-caption" style={{ color: t.muted, marginTop: 9, textAlign: "center" }}>
            Change size or cancel any time from your account.
          </p>
        </div>
      </div>
    </Bloom>
  );
}

function PassCard({ compact = false }: { compact?: boolean }) {
  const t = ink("paper");
  return (
    <div className="flex h-full flex-col" style={{ ...card, padding: compact ? 22 : 28 }}>
      <div className="flex items-baseline justify-between">
        <p className="ag-subtitle" style={{ fontSize: compact ? 22 : 26 }}>
          {pass.name}
        </p>
        {compact ? <Price label={pass.priceLabel} size={34} /> : null}
      </div>
      <p className="ag-body" style={{ color: t.muted, marginTop: 6, fontSize: 14 }}>
        {passHoldsLine(pass.storageBytes)}, kept a year.
      </p>
      {compact ? null : (
        <>
          <div style={{ marginTop: 18 }}>
            <Price label={pass.priceLabel} size={50} />
          </div>
          <div style={{ marginTop: 16 }}>
            <Stats items={[[formatBytes(pass.storageBytes), "Storage"], [`${MAX_EVENTS.event_pass}`, "Event"]]} />
          </div>
          <ul className="flex flex-col" style={{ gap: 7, marginTop: 18 }}>
            <Item>One payment, no subscription</Item>
            <Item>Photos and video, like Pro</Item>
            <Item>Clips with no watermark</Item>
            <Item>Passes stack: each one adds an event and {formatBytes(pass.storageBytes)}</Item>
          </ul>
        </>
      )}
      <div style={{ marginTop: compact ? 16 : "auto", paddingTop: compact ? 0 : 20 }}>
        <Btn ground="paper" kind="secondary" size="md" wide>
          Buy a pass
        </Btn>
        <p className="ag-caption" style={{ color: t.muted, marginTop: 9, textAlign: "center" }}>
          Renew for {EVENT_PASS_RENEWAL_PRICE_LABEL} a year, or let it lapse.
        </p>
      </div>
    </div>
  );
}

/* ── the page ─────────────────────────────────────────────────────────────── */

function Head({ phone }: { phone: boolean }) {
  const t = ink("paper");
  return (
    <div className="flex flex-col items-center text-center">
      <Readout style={{ color: t.faint }}>Pricing</Readout>
      <h1
        className="ag-title"
        data-bd-contrast={phone ? undefined : "the H1 on paper"}
        aria-label={H1}
        style={{ fontSize: phone ? 35 : 50, marginTop: phone ? 12 : 14, color: t.fg }}
      >
        {phone ? (
          <>
            <span className="block">Start free, upgrade</span>
            <span className="block">for video and</span>
            <span className="block">more room.</span>
          </>
        ) : (
          <>
            <span className="block">Start free, upgrade for</span>
            <span className="block">video and more room.</span>
          </>
        )}
      </h1>
      <p
        className="ag-lede"
        data-bd-contrast={phone ? undefined : "the subhead on paper"}
        style={{ fontSize: phone ? 15.5 : 17.5, lineHeight: 1.5, color: t.muted, marginTop: phone ? 14 : 16, maxWidth: phone ? 320 : 520 }}
      >
        {SUB}
      </p>
      <div
        className={phone ? "flex flex-col items-center" : "flex items-center"}
        style={{ gap: phone ? 10 : 14, marginTop: phone ? 20 : 24 }}
      >
        <Segments options={["Monthly", "Yearly"]} on="Monthly" />
        <Readout style={{ color: t.muted }}>Yearly: two months free</Readout>
      </div>
    </div>
  );
}

/** The first screen at a desk, drawn at 1440 by 900. */
function PricingDesk() {
  const t = ink("paper");
  const w = 376;
  const gap = 24;
  const x0 = (1440 - 3 * w - 2 * gap) / 2;
  return (
    <div className="absolute inset-0 overflow-hidden" style={{ background: GROUND.paper.hex, color: t.fg }}>
      <SiteNav ground="paper" screen="desk" active="Pricing" />
      <div className="absolute inset-x-0" style={{ top: 104 }}>
        <Head phone={false} />
      </div>
      {[FreeCard, ProCard, PassCard].map((C, i) => (
        <div key={i} className="absolute" style={{ left: x0 + i * (w + gap), top: 392, width: w, height: 492 }}>
          <C />
        </div>
      ))}
    </div>
  );
}

/** The site's own questions (`pricing-faq-data.ts`), quiet: no light, ink on paper. */
const QUESTIONS = [
  "Can I run one big event without a subscription?",
  "Do my events expire?",
  "Can I cancel Pro anytime?",
] as const;

function Questions() {
  const t = ink("paper");
  return (
    <div>
      <Readout style={{ color: t.faint }}>Questions</Readout>
      <h2 className="ag-title" style={{ fontSize: 25, marginTop: 10 }}>
        The fine print, in plain words.
      </h2>
      <div className="flex flex-col" style={{ marginTop: 16, borderTop: "1px solid rgb(20 20 22 / 0.09)" }}>
        {QUESTIONS.map((q) => (
          <div
            key={q}
            className="flex items-center justify-between"
            style={{ gap: 16, padding: "14px 0", borderBottom: "1px solid rgb(20 20 22 / 0.09)", fontSize: 15, fontWeight: 500 }}
          >
            {q}
            <Glyph name="down" size={16} weight={2} style={{ color: t.faint }} />
          </div>
        ))}
      </div>
    </div>
  );
}

const PRICING_PHONE_H = 1996;
/** The phone's last screenful: the plans past the lit card, the questions, the foot. */
const FOOT_VIEW = PRICING_PHONE_H - 812;

/** The page on a phone, drawn at 375 wide, to its foot. */
function PricingPhone() {
  const t = ink("paper");
  const foot = 1680;
  return (
    <div className="absolute inset-0 overflow-hidden" style={{ background: GROUND.paper.hex, color: t.fg }}>
      <SiteNav ground="paper" screen="phone" active="Pricing" />
      <div className="absolute inset-x-0" style={{ top: 130 }}>
        <Head phone />
      </div>
      <div className="absolute" style={{ left: 20, right: 20, top: 470, height: 506 }}>
        <ProCard phone />
      </div>
      <div className="absolute" style={{ left: 20, right: 20, top: 1004 }}>
        <FreeCard compact />
      </div>
      <div className="absolute" style={{ left: 20, right: 20, top: 1184 }}>
        <PassCard compact />
      </div>
      <div className="absolute" style={{ left: 20, right: 20, top: 1416 }}>
        <Questions />
      </div>
      <SiteFooter ground="paper" screen="phone" light={HOUSE} height={PRICING_PHONE_H - foot} style={{ top: foot }} />
    </div>
  );
}

const PROOF =
  "On paper the light is a thin bright edge and a short glow, round the one card that is the point, lit by its own photographs. The rest is ink on paper, the foot included.";

export function LightPageSlide({ screen }: SlideProps) {
  const t = ink("paper");
  if (screen === "375")
    return (
      <SlideRoot screen={screen} ground="paper">
        <div className="absolute inset-x-0 top-0 overflow-hidden" style={{ height: 812 }}>
          <PricingPhone />
        </div>
        <div
          className="absolute inset-x-0 flex items-center"
          style={{ top: 812, height: 44, paddingInline: 20, borderBlock: "1px solid rgb(20 20 22 / 0.1)", background: "#e9e9ec" }}
        >
          <Readout style={{ color: t.faint }}>A scroll later: its last screenful</Readout>
        </div>
        <div className="absolute inset-x-0 overflow-hidden" style={{ top: 856, height: 812 }}>
          <div className="absolute inset-x-0" style={{ top: -FOOT_VIEW, height: PRICING_PHONE_H }}>
            <PricingPhone />
          </div>
        </div>
        <div
          className="absolute inset-x-0"
          style={{ top: 1668, paddingInline: 20, paddingTop: 22, borderTop: "1px solid rgb(20 20 22 / 0.1)" }}
        >
          <Note ground="paper" label="Light on paper">
            {PROOF}
          </Note>
        </div>
      </SlideRoot>
    );
  return (
    <SlideRoot screen={screen} ground="paper" style={{ background: "#e9e9ec" }}>
      <BrowserWindow width={1000} ground="paper" url="partyreel.com/pricing" style={{ position: "absolute", left: 48, top: 92 }}>
        <PricingDesk />
      </BrowserWindow>
      <PhoneView
        width={300}
        ground="paper"
        pageH={PRICING_PHONE_H}
        scroll={FOOT_VIEW}
        style={{ position: "absolute", right: 48, top: 92 }}
      >
        <PricingPhone />
      </PhoneView>
      <Readout className="absolute" style={{ right: 48, top: 742, width: 300, textAlign: "center", color: t.faint }}>
        Its last screenful, 375 wide
      </Readout>
      <Note ground="paper" label="Light on paper" width={640} style={{ position: "absolute", left: 48, top: 780 }}>
        {PROOF}
      </Note>
    </SlideRoot>
  );
}
