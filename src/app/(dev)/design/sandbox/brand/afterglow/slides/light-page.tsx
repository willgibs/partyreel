"use client";

import type { CSSProperties, ReactNode } from "react";

import { yearlySavingTag } from "@/components/app/pricing/cadence";
import { partiesLine, passHoldsLine } from "@/components/app/pricing/holds";
import { PRO_LINE } from "@/lib/constants/marketing-voice";
import {
  EVENT_PASS_RENEWAL_PRICE_LABEL,
  MAX_EVENTS,
  planById,
  plansForTier,
  TIER_NAMES,
} from "@/lib/constants/tiers";
import { formatBytes } from "@/lib/utils";

import type { SlideProps } from "../../deck/contract";
import type { PhotoId } from "../../deck/media";
import { Btn, Glyph, SiteFooter, SiteNav } from "../kit";
import { SlideRoot } from "../root";
import { type Ground, LitPhoto, Readout, ROOM, type Source } from "../system";
import { cardOf, groundOf, inkOf, useInk, useTake } from "../take";
import { DeskStage, deskOf, PhoneStage, ruleOf } from "./c-parts";

/**
 * 11 A LIGHT PAGE: /pricing, on the take's paper, where people read and
 * decide. This is where light on anything light is judged.
 *
 * The page is paper to its edges; Free and the Event Pass are quiet paper
 * cards with ink words; and the one live subject is the Pro card, drawn on the
 * take's `onPaper.subject` (Aperture: a piece of the room; Ink and Cast:
 * paper). It carries the page's one light: a strip of three photographs, three
 * events, inside the take's Bloom on that ground. A scroll later the page ends
 * on its foot, the take's own (`SiteFooter` follows `onPaper.foot`), lit by
 * the same photographs.
 *
 * ★ THE PRO CARD RISES BY ITS PHOTOGRAPHS: the strip stands in a band above
 * the other cards' tops, so every card's name, price and button share one
 * line and only the photographs (and their light) stand above the row.
 *
 * ★ THE PRO CARD CLIPS WHAT IT HOLDS (the lead's rule), its corner kept: a
 * room card's Bloom would otherwise spill its glow onto the page, which is the
 * one thing Aperture forbids. So the strip keeps an eighth of its width clear
 * on every side inside the card (the take contract's margin), and a paper
 * form (a screen, a cast shadow) is spent before the card's edge.
 *
 * ★ EVERY PRICE AND LIMIT IS READ FROM ITS ONE HOME (`tiers.ts`, the voice's
 * `PRO_LINE`, `holds.ts`), never typed here. A plan is never a status: its
 * ticks are ink, never the Ready green.
 */

const free = planById("free");
const pass = planById("event_pass");
const proSizes = plansForTier("pro");
const pro = proSizes[0];

/**
 * Three events (a concert, a golden-hour couple, a toast), cool to warm, so
 * where a take lays its hues round the strip from the top-left key (Aperture's
 * ring puts the warm arc top-right and the cool one left) each hue stands
 * beside the photograph it came from.
 */
const STRIP: readonly PhotoId[] = [
  "concert-confetti",
  "wedding-golden",
  "wedding-toast",
];
const SOURCE: Source = { photos: STRIP };

const H1 = "Start free, upgrade for video and more room.";

/** A size whose figure never breaks from its unit ("25 GB", never "25 / GB"). */
const roomOf = (bytes: number) => formatBytes(bytes).replace(" ", "\u00a0");

/** The page's left and right edge at a desk: the nav's own. */
const MARGIN = 72;

/* ── the parts of a plan ──────────────────────────────────────────────────── */

function Item({
  ground,
  children,
  limit = false,
  size,
}: {
  ground: Ground;
  children: ReactNode;
  limit?: boolean;
  size: number;
}) {
  const t = useInk(ground);
  return (
    <li
      className="flex items-start"
      style={{
        gap: 9,
        fontSize: size,
        lineHeight: 1.42,
        color: limit ? t.faint : t.fg,
      }}
    >
      <Glyph
        name={limit ? "dash" : "check"}
        size={size + 2}
        weight={2}
        style={{ marginTop: 1, color: limit ? t.faint : t.fg }}
      />
      <span>{children}</span>
    </li>
  );
}

/** "$29 one-time" and "$9/mo": the figure loud, its terms small. */
function Price({
  label,
  size,
  ground,
  contrast,
}: {
  label: string;
  size: number;
  ground: Ground;
  contrast?: string;
}) {
  const t = useInk(ground);
  const m = label.match(/^(\$\d+)(.*)$/);
  const terms = m?.[2]?.trim();
  return (
    <p
      className="ag-title ag-num"
      data-bd-contrast={contrast}
      style={{ fontSize: size, letterSpacing: "-0.04em", color: t.fg }}
    >
      {m ? m[1] : label}
      {terms ? (
        <span
          style={{
            fontSize: Math.round(size * 0.36),
            letterSpacing: "-0.01em",
            marginLeft: terms.startsWith("/") ? 1 : 7,
            color: t.muted,
          }}
        >
          {terms}
        </span>
      ) : null}
    </p>
  );
}

/** A segmented control in its ground's own greys: the chosen segment lifted, never a hue. */
function Segments({
  ground,
  options,
  on,
  style,
}: {
  ground: Ground;
  options: readonly string[];
  on: string;
  style?: CSSProperties;
}) {
  if (ground === "paper")
    return (
      <span className="ag-seg" style={style}>
        {options.map((o) => (
          <span key={o} data-on={o === on ? "" : undefined}>
            {o}
          </span>
        ))}
      </span>
    );
  // The room's greys: the paper control's construction, inverted.
  return (
    <span
      className="inline-flex"
      style={{
        padding: 4,
        borderRadius: 11,
        background: "rgb(255 255 255 / 0.06)",
        boxShadow: "inset 0 0 0 1px rgb(255 255 255 / 0.05)",
        ...style,
      }}
    >
      {options.map((o) => (
        <span
          key={o}
          style={{
            flex: 1,
            padding: "7px 16px",
            borderRadius: 8,
            fontSize: 14,
            fontWeight: 500,
            textAlign: "center",
            whiteSpace: "nowrap",
            color: o === on ? "#f5f5f6" : "rgb(245 245 246 / 0.55)",
            background: o === on ? "#27272c" : undefined,
            boxShadow:
              o === on
                ? "inset 0 1px 0 rgb(255 255 255 / 0.08), 0 1px 3px rgb(0 0 0 / 0.4)"
                : undefined,
          }}
        >
          {o}
        </span>
      ))}
    </span>
  );
}

/**
 * A plan card's surface. ★ ITS GROUND IS PAINTED AS A BACKGROUND COLOUR, so the
 * deck's contrast reader finds the card behind its words (a gradient alone
 * reads as transparent and the reader would fall through to the page).
 */
function surface(ground: Ground, card: string): CSSProperties {
  // A piece of the room is the room's own near-black, lit only along its top
  // edge: a lifted card would be a paler dark, and light reads as light only
  // against the darkest thing round it.
  if (ground === "room")
    return {
      backgroundColor: ROOM.room.hex,
      boxShadow:
        "inset 0 1px 0 rgb(255 255 255 / 0.1), 0 1px 2px rgb(20 20 22 / 0.12), 0 22px 44px -22px rgb(20 20 22 / 0.5)",
    };
  return {
    backgroundColor: card,
    boxShadow: "0 0 0 1px rgb(20 20 22 / 0.08), 0 1px 2px rgb(20 20 22 / 0.04)",
  };
}

/** A card's measure, at a desk or on a phone. */
type Fit = {
  pad: number;
  name: number;
  body: number;
  price: number;
  item: number;
  /** The line under the name, held at two lines so every price shares a row. */
  lineH: number;
};

const DESK_FIT: Fit = {
  pad: 28,
  name: 26,
  body: 14,
  price: 50,
  item: 14,
  lineH: 42,
};
const PHONE_FIT: Fit = {
  pad: 22,
  name: 24,
  body: 14,
  price: 44,
  item: 14,
  lineH: 40,
};

/** The head every plan shares: its name, its line (two lines' room) and its price. */
function PlanHead({
  ground,
  fit,
  name,
  line,
  price,
  contrast,
}: {
  ground: Ground;
  fit: Fit;
  name: string;
  line: string;
  price: string;
  contrast?: string;
}) {
  const t = useInk(ground);
  return (
    <>
      <p className="ag-subtitle" style={{ fontSize: fit.name, color: t.fg }}>
        {name}
      </p>
      <p
        className="ag-body"
        style={{
          color: t.muted,
          marginTop: 6,
          fontSize: fit.body,
          lineHeight: 1.5,
          minHeight: fit.lineH,
          textWrap: "pretty",
        }}
      >
        {line}
      </p>
      <div style={{ marginTop: 14 }}>
        <Price
          label={price}
          size={fit.price}
          ground={ground}
          contrast={contrast}
        />
      </div>
    </>
  );
}

/** A plan's foot: its button, and one line under it. */
function PlanFoot({
  ground,
  kind,
  label,
  note,
}: {
  ground: Ground;
  kind: "primary" | "secondary";
  label: string;
  note: string;
}) {
  const t = useInk(ground);
  return (
    <div style={{ marginTop: "auto", paddingTop: 16 }}>
      <Btn ground={ground} kind={kind} size="md" wide>
        {label}
      </Btn>
      <p
        className="ag-caption"
        style={{ color: t.muted, marginTop: 9, textAlign: "center" }}
      >
        {note}
      </p>
    </div>
  );
}

function FreeCard({ fit, compact = false }: { fit: Fit; compact?: boolean }) {
  const take = useTake();
  const t = inkOf(take, "paper");
  return (
    <div
      className="flex h-full flex-col"
      style={{
        ...surface("paper", cardOf(take, "paper").hex),
        borderRadius: 18,
        padding: fit.pad,
        color: t.fg,
      }}
    >
      <PlanHead
        ground="paper"
        fit={compact ? { ...fit, lineH: 0 } : fit}
        name={TIER_NAMES.free}
        line="The full experience, for a dinner or a birthday at home."
        price={free.priceLabel}
      />
      <Readout style={{ color: t.faint, marginTop: 8 }}>
        {roomOf(free.storageBytes)} · {MAX_EVENTS.free} event
      </Readout>
      {compact ? null : (
        <ul className="flex flex-col" style={{ gap: 6, marginTop: 18 }}>
          <Item ground="paper" size={fit.item}>
            {MAX_EVENTS.free} event, every guest, the album and the reel
          </Item>
          <Item ground="paper" size={fit.item}>
            Every gate and a custom link
          </Item>
          <Item ground="paper" size={fit.item}>
            No watermark on photos or the album
          </Item>
          <Item ground="paper" size={fit.item} limit>
            Photos only
          </Item>
          <Item ground="paper" size={fit.item} limit>
            A small mark on clips
          </Item>
        </ul>
      )}
      <PlanFoot
        ground="paper"
        kind="secondary"
        label="Start free"
        note="No card. Upgrade when you want video or more room."
      />
    </div>
  );
}

function PassCard({ fit, compact = false }: { fit: Fit; compact?: boolean }) {
  const take = useTake();
  const t = inkOf(take, "paper");
  return (
    <div
      className="flex h-full flex-col"
      style={{
        ...surface("paper", cardOf(take, "paper").hex),
        borderRadius: 18,
        padding: fit.pad,
        color: t.fg,
      }}
    >
      <PlanHead
        ground="paper"
        fit={compact ? { ...fit, lineH: 0 } : fit}
        name={TIER_NAMES.event_pass}
        line={`${passHoldsLine(pass.storageBytes)}, kept a year.`}
        price={pass.priceLabel}
      />
      <Readout style={{ color: t.faint, marginTop: 8 }}>
        {roomOf(pass.storageBytes)} · {MAX_EVENTS.event_pass} event
      </Readout>
      {compact ? null : (
        <ul className="flex flex-col" style={{ gap: 6, marginTop: 18 }}>
          <Item ground="paper" size={fit.item}>
            One payment, no subscription
          </Item>
          <Item ground="paper" size={fit.item}>
            Photos and video, like Pro
          </Item>
          <Item ground="paper" size={fit.item}>
            Clips with no watermark
          </Item>
          <Item ground="paper" size={fit.item}>
            Passes stack: each adds an event and {roomOf(pass.storageBytes)}
          </Item>
        </ul>
      )}
      <PlanFoot
        ground="paper"
        kind="secondary"
        label="Buy a pass"
        note={`Renew for ${EVENT_PASS_RENEWAL_PRICE_LABEL} a year, or let it lapse.`}
      />
    </div>
  );
}

/**
 * THE STRIP: three square prints edge to edge, the page's one live subject,
 * inside the take's Bloom on the card's ground. On paper each print keeps a
 * hairline and no lift: a grey shadow under it would muddy whatever the take
 * lays round it.
 *
 * ★ SQUARE, NOT 3:2: a light is the subject's own shape blurred, so a thin
 * strip gives a thin, dim light (a 65 px band under a 36 px blur keeps barely
 * two thirds of its peak) and square prints give the Bloom a body to glow
 * from at every take's reach.
 */
function Strip({ ground, width }: { ground: Ground; width: number }) {
  const take = useTake();
  const { Bloom } = take.light;
  const gap = 4;
  const pw = (width - gap * (STRIP.length - 1)) / STRIP.length;
  const ph = Math.round(pw);
  return (
    <Bloom source={SOURCE} ground={ground} size={width} radius={2}>
      <div className="flex" style={{ gap, width, height: ph }}>
        {STRIP.map((id) => (
          <LitPhoto
            key={id}
            id={id}
            ground={ground}
            style={{
              width: pw,
              height: ph,
              boxShadow:
                ground === "paper"
                  ? "0 0 0 1px rgb(20 20 22 / 0.06)"
                  : undefined,
            }}
          />
        ))}
      </div>
    </Bloom>
  );
}

/** The strip's height at a width (three square prints, 4 px apart). */
const stripH = (width: number) => Math.round((width - 8) / 3);

/** How far a take's light may reach past the strip: the take contract's eighth. */
const reachOf = (width: number) => Math.round(width / 8);

/**
 * The band the strip stands in: its light's reach clear above and below it,
 * and a breath of bare stock past that (8 px to the card's top, 10 to the
 * plan's name), so a screen or a cast shadow is spent on the card, never cut
 * by its edge, and never reaches a word.
 */
const bandOf = (width: number) =>
  reachOf(width) + 8 + stripH(width) + reachOf(width) + 10;

/** The strip's width in a card: an eighth of the card clear on either side. */
const stripW = (card: number) => card - 2 * Math.round(card / 8);

/** How far the Pro card rises above the row: its band, less the padding the others start with. */
const riseOf = (card: number, fit: Fit) => bandOf(stripW(card)) - fit.pad;

/**
 * THE PRO CARD, the one live subject: on the take's subject ground, the strip
 * of photographs in its band at the top, then the plan as every card says it.
 */
function ProCard({ fit, width }: { fit: Fit; width: number }) {
  const take = useTake();
  const ground = take.onPaper.subject;
  const t = inkOf(take, ground);
  const sw = stripW(width);
  return (
    <div
      className="flex h-full flex-col overflow-hidden"
      style={{
        ...surface(ground, cardOf(take, ground).hex),
        borderRadius: 18,
        color: t.fg,
      }}
    >
      {/* ★ The strip keeps its own box (items-start): a stretched holder
          would hand the take a taller subject, and its light would frame
          the empty band under the prints. */}
      <div
        className="flex shrink-0 items-start justify-center"
        style={{ height: bandOf(sw), paddingTop: reachOf(sw) + 8 }}
      >
        <Strip ground={ground} width={sw} />
      </div>
      <div
        className="flex flex-1 flex-col"
        style={{ padding: fit.pad, paddingTop: 0 }}
      >
        <PlanHead
          ground={ground}
          fit={fit}
          name={TIER_NAMES.pro}
          line={PRO_LINE}
          price={pro.priceLabel}
          contrast={fit === DESK_FIT ? "Pro's price on its card" : undefined}
        />
        <div style={{ marginTop: 14 }}>
          <Segments
            ground={ground}
            options={proSizes.map((p) => roomOf(p.storageBytes))}
            on={roomOf(pro.storageBytes)}
            style={{ width: "100%" }}
          />
          <p
            className="ag-caption"
            style={{ color: t.muted, marginTop: 7, textAlign: "center" }}
          >
            {partiesLine(pro)}.
          </p>
        </div>
        <ul className="flex flex-col" style={{ gap: 6, marginTop: 16 }}>
          <Item ground={ground} size={fit.item}>
            Everything in {TIER_NAMES.free}
          </Item>
          <Item ground={ground} size={fit.item}>
            Photos and video
          </Item>
          <Item ground={ground} size={fit.item}>
            Unlimited events, one album each
          </Item>
          <Item ground={ground} size={fit.item}>
            Clips with no watermark
          </Item>
        </ul>
        <PlanFoot
          ground={ground}
          kind="primary"
          label={`Get Pro at ${pro.priceLabel}`}
          note="Change size or cancel any time from your account."
        />
      </div>
    </div>
  );
}

/* ── the page ─────────────────────────────────────────────────────────────── */

/**
 * The cadence: a control above the row, since it changes only what Pro costs,
 * its saving computed from the prices (`yearlySavingTag`), never typed.
 */
function Cadence({ stacked = false }: { stacked?: boolean }) {
  const t = useInk("paper");
  const saving = yearlySavingTag();
  return (
    <div
      className={stacked ? "flex flex-col items-center" : "flex items-center"}
      style={{ gap: stacked ? 10 : 14 }}
    >
      <Segments ground="paper" options={["Monthly", "Yearly"]} on="Monthly" />
      {saving ? (
        <Readout style={{ color: t.muted }}>Yearly: {saving}</Readout>
      ) : null}
    </div>
  );
}

/** The cards at a desk. */
const DESK_CARD = { w: 376, gap: 24, bottom: 884 } as const;

/** The first screen at a desk, drawn at 1440 by 900. */
function PricingDesk() {
  const take = useTake();
  const t = inkOf(take, "paper");
  const { w, gap, bottom } = DESK_CARD;
  const x0 = (1440 - 3 * w - 2 * gap) / 2;
  const rowTop = 402;
  return (
    <div
      className="absolute inset-0 overflow-hidden"
      style={{ background: groundOf(take, "paper").hex, color: t.fg }}
    >
      <SiteNav ground="paper" screen="desk" active="Pricing" />
      <div
        className="absolute inset-x-0 flex flex-col items-center"
        style={{ top: 112, paddingInline: MARGIN }}
      >
        <h1
          className="ag-title"
          aria-label={H1}
          data-bd-contrast="the H1 on paper"
          style={{ fontSize: 48, color: t.fg, textAlign: "center" }}
        >
          {H1}
        </h1>
        <div style={{ marginTop: 24 }}>
          <Cadence />
        </div>
      </div>
      <div
        className="absolute"
        style={{ left: x0, top: rowTop, width: w, bottom: 900 - bottom }}
      >
        <FreeCard fit={DESK_FIT} />
      </div>
      <div
        className="absolute"
        style={{
          left: x0 + w + gap,
          top: rowTop - riseOf(w, DESK_FIT),
          width: w,
          bottom: 900 - bottom,
        }}
      >
        <ProCard fit={DESK_FIT} width={w} />
      </div>
      <div
        className="absolute"
        style={{
          left: x0 + 2 * (w + gap),
          top: rowTop,
          width: w,
          bottom: 900 - bottom,
        }}
      >
        <PassCard fit={DESK_FIT} />
      </div>
    </div>
  );
}

/** The site's own questions (`pricing-faq-data.ts`), quiet: ink on paper, no light. */
const QUESTIONS = [
  "Can I run one big event without a subscription?",
  "Do my events expire?",
  "Can I cancel Pro anytime?",
] as const;

function Questions() {
  const t = useInk("paper");
  return (
    <div>
      <Readout style={{ color: t.faint }}>Questions</Readout>
      <h2
        className="ag-title"
        style={{ fontSize: 26, marginTop: 10, color: t.fg }}
      >
        The fine print, in plain words.
      </h2>
      <div
        className="flex flex-col"
        style={{ marginTop: 18, borderTop: `1px solid ${ruleOf("paper")}` }}
      >
        {QUESTIONS.map((q) => (
          <div
            key={q}
            className="flex items-center justify-between"
            style={{
              gap: 16,
              padding: "15px 0",
              borderBottom: `1px solid ${ruleOf("paper")}`,
              fontSize: 15,
              fontWeight: 500,
              color: t.fg,
            }}
          >
            {q}
            <Glyph
              name="down"
              size={16}
              weight={2}
              style={{ color: t.faint }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

/** The page on a phone, drawn at 375 wide, to its foot. */
const PHONE = {
  page: 2268,
  pro: { top: 352, h: 620 },
  free: 996,
  pass: 1324,
  questions: 1656,
  foot: 1936,
} as const;
/** Where the last screenful starts. */
const LAST = PHONE.page - 812;

/**
 * `part` draws only what a window shows: the phone slide shows the page's top
 * and its last screenful in two windows, and a whole second page behind the
 * first would read its words to the deck's caption twice.
 */
function PricingPhone({ part = "all" }: { part?: "all" | "top" | "tail" }) {
  const take = useTake();
  const t = inkOf(take, "paper");
  const top = part !== "tail";
  const tail = part !== "top";
  return (
    <div
      className="absolute inset-x-0 top-0 overflow-hidden"
      style={{
        height: PHONE.page,
        background: groundOf(take, "paper").hex,
        color: t.fg,
      }}
    >
      {top ? (
        <>
          <SiteNav ground="paper" screen="phone" active="Pricing" />
          <div
            className="absolute flex flex-col items-center"
            style={{ left: 20, right: 20, top: 134 }}
          >
            <h1
              className="ag-title"
              aria-label={H1}
              data-bd-read="the phone's H1"
              style={{
                fontSize: 34,
                color: t.fg,
                textAlign: "center",
                textWrap: "balance",
              }}
            >
              {H1}
            </h1>
            <div style={{ marginTop: 20 }}>
              <Cadence stacked />
            </div>
          </div>
          <div
            className="absolute"
            style={{
              left: 20,
              right: 20,
              top: PHONE.pro.top,
              height: PHONE.pro.h,
            }}
          >
            <ProCard fit={PHONE_FIT} width={335} />
          </div>
        </>
      ) : null}
      {part === "all" ? (
        <>
          <div
            className="absolute"
            style={{ left: 20, right: 20, top: PHONE.free }}
          >
            <FreeCard fit={PHONE_FIT} compact />
          </div>
          <div
            className="absolute"
            style={{ left: 20, right: 20, top: PHONE.pass }}
          >
            <PassCard fit={PHONE_FIT} compact />
          </div>
        </>
      ) : null}
      {tail ? (
        <>
          <div
            className="absolute"
            style={{ left: 20, right: 20, top: PHONE.questions }}
          >
            <Questions />
          </div>
          <SiteFooter
            page="paper"
            screen="phone"
            source={SOURCE}
            height={PHONE.page - PHONE.foot}
            style={{ top: PHONE.foot }}
          />
        </>
      ) : null}
    </div>
  );
}

const LABEL = "Light on paper";

export function LightPageSlide({ screen }: SlideProps) {
  const take = useTake();
  const t = inkOf(take, "paper");
  const note = take.words.notes.lightPage;
  if (screen === "375") {
    // The first screen and its Pro card, a scroll's break, then the last
    // screenful: the questions and the foot.
    const first = PHONE.pro.top + PHONE.pro.h + 20;
    const gapH = 44;
    const tail = PHONE.page - (PHONE.questions - 36);
    return (
      <SlideRoot screen={screen} ground="paper">
        <PhoneStage
          ground="paper"
          pageH={first + gapH + tail}
          page={
            <>
              <div
                className="absolute inset-x-0 top-0 overflow-hidden"
                style={{ height: first }}
              >
                <PricingPhone part="top" />
              </div>
              <div
                className="absolute inset-x-0 flex items-center"
                style={{
                  top: first,
                  height: gapH,
                  paddingInline: 20,
                  background: deskOf(take, "paper"),
                  borderBlock: `1px solid ${ruleOf("paper")}`,
                }}
              >
                <Readout style={{ color: t.faint }}>
                  A scroll later: its last screenful
                </Readout>
              </div>
              <div
                className="absolute inset-x-0 overflow-hidden"
                style={{ top: first + gapH, height: tail }}
              >
                <div
                  className="absolute inset-x-0"
                  style={{
                    top: -(PHONE.questions - 36),
                    height: PHONE.page,
                  }}
                >
                  <PricingPhone part="tail" />
                </div>
              </div>
            </>
          }
          label={LABEL}
          note={note}
        />
      </SlideRoot>
    );
  }
  return (
    <SlideRoot
      screen={screen}
      ground="paper"
      style={{ background: deskOf(take, "paper") }}
    >
      <DeskStage
        ground="paper"
        url="partyreel.com/pricing"
        page={<PricingDesk />}
        phone={<PricingPhone />}
        phonePage={PHONE.page}
        phoneScroll={LAST}
        phoneCaption="Its last screenful, 375 wide"
        label={LABEL}
        note={note}
      />
    </SlideRoot>
  );
}
