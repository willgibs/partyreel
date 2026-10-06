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
import { Photo, type PhotoId } from "../../deck/media";
import { Btn, Glyph, SiteFooter, SiteNav } from "../kit";
import { SlideRoot } from "../root";
import { type Ground, Readout, ROOM, type Source } from "../system";
import { cardOf, groundOf, inkOf, useInk, useTake } from "../take";
import { DeskStage, deskOf, PhoneStage, ruleOf } from "./c-parts";

/**
 * 11 A LIGHT PAGE: /pricing, on the take's paper, where people read and
 * decide. This is where light on anything light is judged.
 *
 * The page is paper to its edges; Free and the Event Pass are quiet paper
 * cards with ink words; and the one live subject is the Pro card, drawn on the
 * take's `onPaper.subject` (Aperture: a piece of the room; Ink and Cast:
 * paper). It carries the page's one light: one wide strip of three
 * photographs, three events, inside the take's Bloom on that ground. The page
 * ends on its footer, the take's own (`SiteFooter` follows `onPaper.foot`),
 * lit by the same photographs.
 *
 * ★ THE PRO CARD RISES BY ITS PHOTOGRAPHS: the strip stands in a band above
 * the other cards' tops, so every card's name, price and button share one
 * line and only the photographs (and their light) stand above the row.
 *
 * ★ THE PRO CARD CLIPS WHAT IT HOLDS (the lead's rule), its corner kept: a
 * room card's Bloom would otherwise spill its glow onto the page, which is the
 * one thing Aperture forbids. So the strip is inset a sixth of the card from
 * either side and its light's reach plus bare card from the top, and every
 * take's form (a glow, a printed mat, a cast colour) is spent inside the card.
 *
 * ★ EVERY PRICE AND LIMIT IS READ FROM ITS ONE HOME (`tiers.ts`, the voice's
 * `PRO_LINE`, `holds.ts`, `cadence.ts`), never typed here. A plan is never a
 * status: its ticks are ink, never the Ready green.
 */

const free = planById("free");
const pass = planById("event_pass");
const proSizes = plansForTier("pro");
const pro = proSizes[0];

/**
 * Three events (a concert, a golden-hour couple, a toast), cool to warm, so
 * where a take lays its hues round the strip from the top-left key (Aperture's
 * ring puts the warm arc top-right and the cool one left) each hue stands
 * beside the photograph it came from. Each frame's crop keeps its subject.
 */
const STRIP: readonly { id: PhotoId; focus?: string }[] = [
  { id: "concert-confetti" },
  { id: "wedding-golden", focus: "56% 50%" },
  { id: "wedding-toast", focus: "64% 50%" },
];
const SOURCE: Source = { photos: STRIP.map((s) => s.id) };

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

/**
 * "$29 one-time" and "$9/mo": the figure loud, its terms small. `ink` prints
 * the whole price in a take's own ink (`take.inkFor`), where it gives one.
 */
function Price({
  label,
  size,
  ground,
  ink,
  contrast,
}: {
  label: string;
  size: number;
  ground: Ground;
  ink?: string;
  contrast?: string;
}) {
  const t = useInk(ground);
  const m = label.match(/^(\$\d+)(.*)$/);
  const terms = m?.[2]?.trim();
  return (
    <p
      className="ag-title ag-num"
      data-bd-contrast={contrast}
      style={{ fontSize: size, letterSpacing: "-0.04em", color: ink ?? t.fg }}
    >
      {m ? m[1] : label}
      {terms ? (
        <span
          style={{
            fontSize: Math.round(size * 0.36),
            letterSpacing: "-0.01em",
            marginLeft: terms.startsWith("/") ? 1 : 7,
            color: ink ?? t.muted,
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
  /** Bare card above and below the strip's light. */
  air: number;
};

const DESK_FIT: Fit = {
  pad: 28,
  name: 26,
  body: 14,
  price: 50,
  item: 14,
  lineH: 42,
  air: 20,
};
const PHONE_FIT: Fit = {
  pad: 22,
  name: 24,
  body: 14,
  price: 44,
  item: 14,
  lineH: 0,
  air: 14,
};

/** The head every plan shares: its name, its line (two lines' room) and its price. */
function PlanHead({
  ground,
  fit,
  name,
  line,
  price,
  priceInk,
  contrast,
}: {
  ground: Ground;
  fit: Fit;
  name: string;
  line: string;
  price: string;
  priceInk?: string;
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
          ink={priceInk}
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

function FreeCard() {
  const take = useTake();
  const t = inkOf(take, "paper");
  const fit = DESK_FIT;
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
        fit={fit}
        name={TIER_NAMES.free}
        line="The full experience, for a dinner or a birthday at home."
        price={free.priceLabel}
      />
      <Readout style={{ color: t.faint, marginTop: 8 }}>
        {roomOf(free.storageBytes)} · {MAX_EVENTS.free} event
      </Readout>
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
      <PlanFoot
        ground="paper"
        kind="secondary"
        label="Start free"
        note="No card. Upgrade when you want video or more room."
      />
    </div>
  );
}

function PassCard() {
  const take = useTake();
  const t = inkOf(take, "paper");
  const fit = DESK_FIT;
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
        fit={fit}
        name={TIER_NAMES.event_pass}
        line={`${passHoldsLine(pass.storageBytes)}, kept a year.`}
        price={pass.priceLabel}
      />
      <Readout style={{ color: t.faint, marginTop: 8 }}>
        {roomOf(pass.storageBytes)} · {MAX_EVENTS.event_pass} event
      </Readout>
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
 * A QUIET PLAN ON A PHONE, half the column: its name, its price, its room and
 * its button, so the two quiet plans stand side by side under the one live
 * subject and the whole page fits a phone's slide.
 */
function QuietCard({
  name,
  price,
  room,
  cta,
}: {
  name: string;
  price: string;
  room: string;
  cta: string;
}) {
  const take = useTake();
  const t = inkOf(take, "paper");
  return (
    <div
      className="flex h-full flex-col"
      style={{
        ...surface("paper", cardOf(take, "paper").hex),
        borderRadius: 16,
        padding: 16,
        color: t.fg,
      }}
    >
      <p className="ag-subtitle" style={{ fontSize: 19, color: t.fg }}>
        {name}
      </p>
      <div style={{ marginTop: 10 }}>
        <Price label={price} size={34} ground="paper" />
      </div>
      <Readout style={{ color: t.faint, marginTop: 6 }}>{room}</Readout>
      <div style={{ marginTop: "auto", paddingTop: 12 }}>
        <Btn ground="paper" kind="secondary" size="sm" wide>
          {cta}
        </Btn>
      </div>
    </div>
  );
}

/* ── the one live subject ─────────────────────────────────────────────────── */

/** The strip's height at a width: three square frames. */
const stripH = (width: number) => Math.round(width / 3);

/** How far a take's light may reach past the strip: the take contract's eighth of its larger side. */
const reachOf = (width: number) => Math.round(width / 8);

/** The strip's width in a card: inset a sixth of the card from either side. */
const stripW = (card: number) => card - 2 * Math.round(card / 6);

/** Above and below the strip: its light's reach, then bare card. */
const marginOf = (sw: number, fit: Fit) => reachOf(sw) + fit.air;

/** The band the strip stands in at the card's head. */
const bandOf = (sw: number, fit: Fit) => marginOf(sw, fit) * 2 + stripH(sw);

/** How far the Pro card rises above the row: its band, less the padding the others start with. */
const riseOf = (card: number, fit: Fit) => bandOf(stripW(card), fit) - fit.pad;

/**
 * THE STRIP: three photographs joined edge to edge into one wide print, the
 * page's one live subject, inside the take's Bloom on the card's ground. One
 * object with one outline and one lit edge (in the room the bevel of light
 * along its top; on paper a hairline and no lift, since a grey shadow under it
 * would muddy whatever the take lays round it), so the light is one light round
 * one thing, never three thumbnails' three halos.
 *
 * ★ EACH FRAME SQUARE, THE STRIP 3:1: a light is its subject's own shape, so a
 * thin band gives a thin, dim light; three squares joined give the Bloom a
 * body to glow from at every take's reach and still read as one wide strip.
 * Each frame overlaps the next by a pixel, so no seam of the print's dark
 * ground shows between them at a fractional scale.
 */
function Strip({ ground, width }: { ground: Ground; width: number }) {
  const take = useTake();
  const { Bloom } = take.light;
  const h = stripH(width);
  const edges = STRIP.map((_, i) => Math.round((width * i) / STRIP.length));
  return (
    <Bloom source={SOURCE} ground={ground} size={width} radius={2}>
      <div
        className="ag-photo"
        data-ground={ground}
        style={{
          width,
          height: h,
          boxShadow:
            ground === "paper" ? "0 0 0 1px rgb(20 20 22 / 0.08)" : undefined,
        }}
      >
        {STRIP.map((s, i) => {
          const right = i === STRIP.length - 1 ? width : edges[i + 1] + 1;
          return (
            <div
              key={s.id}
              className="absolute inset-y-0 overflow-hidden"
              style={{ left: edges[i], width: right - edges[i] }}
            >
              <Photo id={s.id} focus={s.focus} />
            </div>
          );
        })}
      </div>
    </Bloom>
  );
}

/**
 * THE PRO CARD, the one live subject: on the take's subject ground, the strip
 * in its band at the head, then the plan as every card says it. On paper its
 * price alone prints in the take's own ink, where the take gives one.
 */
function ProCard({ fit, width }: { fit: Fit; width: number }) {
  const take = useTake();
  const ground = take.onPaper.subject;
  const t = inkOf(take, ground);
  const sw = stripW(width);
  const priceInk = ground === "paper" ? take.inkFor?.(SOURCE) : undefined;
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
          the empty band under the print. */}
      <div
        className="flex shrink-0 items-start justify-center"
        style={{ height: bandOf(sw, fit), paddingTop: marginOf(sw, fit) }}
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
          priceInk={priceInk}
          contrast={fit === DESK_FIT ? "Pro's price on its card" : undefined}
        />
        <div style={{ marginTop: 12 }}>
          <Segments
            ground={ground}
            options={proSizes.map((p) => roomOf(p.storageBytes))}
            on={roomOf(pro.storageBytes)}
            style={{ width: "100%" }}
          />
          <p
            className="ag-caption"
            style={{ color: t.muted, marginTop: 5, textAlign: "center" }}
          >
            {partiesLine(pro)}.
          </p>
        </div>
        <ul className="flex flex-col" style={{ gap: 6, marginTop: 12 }}>
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
const DESK_CARD = { w: 376, gap: 24, top: 410, bottom: 884 } as const;

/** The first screen at a desk, drawn at 1440 by 900. */
function PricingDesk() {
  const take = useTake();
  const t = inkOf(take, "paper");
  const { w, gap, top, bottom } = DESK_CARD;
  const x0 = (1440 - 3 * w - 2 * gap) / 2;
  return (
    <div
      className="absolute inset-0 overflow-hidden"
      style={{ background: groundOf(take, "paper").hex, color: t.fg }}
    >
      <SiteNav ground="paper" screen="desk" active="Pricing" />
      <div
        className="absolute inset-x-0 flex flex-col items-center"
        style={{ top: 108, paddingInline: MARGIN }}
      >
        <h1
          className="ag-title"
          aria-label={H1}
          data-bd-contrast="the H1 on paper"
          style={{ fontSize: 48, color: t.fg, textAlign: "center" }}
        >
          {H1}
        </h1>
        <div style={{ marginTop: 22 }}>
          <Cadence />
        </div>
      </div>
      <div
        className="absolute"
        style={{ left: x0, top, width: w, bottom: 900 - bottom }}
      >
        <FreeCard />
      </div>
      <div
        className="absolute"
        style={{
          left: x0 + w + gap,
          top: top - riseOf(w, DESK_FIT),
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
          top,
          width: w,
          bottom: 900 - bottom,
        }}
      >
        <PassCard />
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

/** The questions, closed: the heading says what they are, so no label over it. */
function Questions() {
  const t = useInk("paper");
  return (
    <div>
      <h2 className="ag-title" style={{ fontSize: 26, color: t.fg }}>
        The fine print, in plain words.
      </h2>
      <div
        className="flex flex-col"
        style={{ marginTop: 16, borderTop: `1px solid ${ruleOf("paper")}` }}
      >
        {QUESTIONS.map((q) => (
          <div
            key={q}
            className="flex items-center justify-between"
            style={{
              gap: 16,
              padding: "12px 0",
              borderBottom: `1px solid ${ruleOf("paper")}`,
              fontSize: 15,
              fontWeight: 500,
              lineHeight: 1.4,
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

/**
 * THE PAGE ON A PHONE, drawn at 375 wide and short enough to stand whole on a
 * phone's slide: the head, the Pro card, the two quiet plans side by side, the
 * questions, the footer. Each section's top is set from the measured height
 * of the one above.
 */
const PHONE = {
  /** The Pro card: 28 px under the cadence. */
  pro: { top: 320, h: 568 },
  /** The quiet plans: 16 px under the Pro card. */
  quiet: { top: 904, h: 166 },
  /** The questions: 28 px under the quiet plans. */
  questions: 1098,
  /** The footer: 32 px under the last question. */
  foot: 1333,
  /** The page's end: the footer's words and 24 px under its last line. */
  page: 1657,
} as const;

/**
 * ★ THE DESK'S PHONE SHOWS THE LAST SCREENFUL FROM A CLEAN EDGE: scrolled so
 * the quiet plans stand 8 px under the status bar (a card cut by the bar
 * reads as a sliver of words), which leaves the footer's last line 21 px
 * above the screen's foot.
 */
const PHONE_SCROLL = PHONE.quiet.top - 54 - 8;

function PricingPhone() {
  const take = useTake();
  const t = inkOf(take, "paper");
  return (
    <div
      className="absolute inset-x-0 top-0 overflow-hidden"
      style={{
        height: PHONE.page,
        background: groundOf(take, "paper").hex,
        color: t.fg,
      }}
    >
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
      <div
        className="absolute grid"
        style={{
          left: 20,
          right: 20,
          top: PHONE.quiet.top,
          height: PHONE.quiet.h,
          gridTemplateColumns: "1fr 1fr",
          gap: 12,
        }}
      >
        <QuietCard
          name={TIER_NAMES.free}
          price={free.priceLabel}
          room={`${roomOf(free.storageBytes)} · ${MAX_EVENTS.free} event`}
          cta="Start free"
        />
        <QuietCard
          name={TIER_NAMES.event_pass}
          price={pass.priceLabel}
          room={`${roomOf(pass.storageBytes)} · ${MAX_EVENTS.event_pass} event`}
          cta="Buy a pass"
        />
      </div>
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
    </div>
  );
}

const LABEL = "Light on paper";

export function LightPageSlide({ screen }: SlideProps) {
  const take = useTake();
  const note = take.words.notes.lightPage;
  if (screen === "375")
    return (
      <SlideRoot screen={screen} ground="paper">
        <PhoneStage
          ground="paper"
          pageH={PHONE.page}
          page={<PricingPhone />}
          label={LABEL}
          note={note}
        />
      </SlideRoot>
    );
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
        phoneScroll={PHONE_SCROLL}
        phoneCaption="A scroll later"
        label={LABEL}
        note={note}
      />
    </SlideRoot>
  );
}
