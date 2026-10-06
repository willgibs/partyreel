"use client";

import type { CSSProperties, ReactNode } from "react";

import type { SlideProps } from "../../deck/contract";
import { PARTY, type PhotoId } from "../../deck/media";
import { Btn, Glyph, Scaled, SiteFooter, SiteNav } from "../kit";
import { SlideRoot } from "../root";
import {
  type Ground,
  type Lamp,
  lightOf,
  LitPhoto,
  Readout,
  type Source,
  tone,
  unOlive,
  yellowness,
} from "../system";
import { cardOf, groundOf, inkOf, useTake } from "../take";
import { Caption, Heading, Label, useMeasure } from "./parts";

/**
 * 08 DARK AND LIGHT: WHERE PHOTOGRAPHS PLAY, THE ROOM; WHERE PEOPLE READ AND
 * DECIDE, PAPER.
 *
 * Two pictures. The site as a row of real pages, each drawn whole at 1440 and
 * shrunk the way a screenshot is: four in the room (the hero lit by its
 * photographs, the footer's Seam), four on the take's paper (Pricing's one lit
 * subject where the take stands it, every footer where the take puts it), and
 * one paper footer close up, since a footer's form cannot be judged at a
 * thumbnail's size. Then the round's whole point, side by side: the same lit
 * card on paper as round one drew it and as this take draws it.
 *
 * ★ ROUND ONE'S PANEL IS ROUND ONE'S OWN DRAWING, not a strawman: its paper
 * register (`a7d519a79`: the room's light lifted to L 0.85 to read on white)
 * and its touchpoints' sizing, through the very bloom the room still uses, so
 * the stain it shows is the stain round one shipped.
 */

/* ── the pages, each drawn whole at 1440 ───────────────────────────────────── */

const PAGE_W = 1440;
const PAGE_H = 1840;
const FOOT_H = 380;

type PageId = "home" | "features" | "events" | "reel" | "pricing" | "help" | "about" | "blog";

const PAGES: readonly { id: PageId; name: string; ground: Ground; why: string }[] = [
  { id: "home", name: "Home", ground: "room", why: "The reel plays" },
  { id: "features", name: "Features", ground: "room", why: "Albums play" },
  { id: "events", name: "Events", ground: "room", why: "Every party's photos" },
  { id: "reel", name: "Reel", ground: "room", why: "The reel itself" },
  { id: "pricing", name: "Pricing", ground: "paper", why: "Deciding" },
  { id: "help", name: "Help", ground: "paper", why: "Reading" },
  { id: "about", name: "About", ground: "paper", why: "A story, read" },
  { id: "blog", name: "Blog", ground: "paper", why: "Reading" },
];

const abs = (s: CSSProperties): CSSProperties => ({ position: "absolute", ...s });

/** A page's ground, its nav and its foot; the page's own sections go between. */
function Page({
  ground,
  active,
  foot,
  children,
}: {
  ground: Ground;
  active?: "Features" | "Events" | "Pricing";
  foot: Source;
  children: ReactNode;
}) {
  const take = useTake();
  return (
    <div
      className="relative overflow-hidden"
      style={{ width: PAGE_W, height: PAGE_H, background: groundOf(take, ground).hex, color: inkOf(take, ground).fg }}
    >
      <SiteNav ground={ground} screen="desk" active={active} />
      {children}
      <SiteFooter page={ground} screen="desk" source={foot} height={FOOT_H} style={{ bottom: 0 }} />
    </div>
  );
}

/** A page's opening words: an eyebrow, a title and a lede, at the site's sizes. */
function Opener({
  ground,
  eyebrow,
  title,
  lede,
  x = 96,
  y = 190,
  w = 640,
  size = 64,
}: {
  ground: Ground;
  eyebrow?: string;
  title: string;
  lede?: string;
  x?: number;
  y?: number;
  w?: number;
  size?: number;
}) {
  const t = inkOf(useTake(), ground);
  return (
    <div style={abs({ left: x, top: y, width: w })}>
      {eyebrow ? <Readout style={{ color: t.faint, fontSize: 13 }}>{eyebrow}</Readout> : null}
      <p className="ag-title" style={{ fontSize: size, color: t.fg, marginTop: eyebrow ? 18 : 0, textWrap: "balance" }}>
        {title}
      </p>
      {lede ? (
        <p className="ag-lede" style={{ fontSize: 20, color: t.muted, marginTop: 22, textWrap: "pretty" }}>
          {lede}
        </p>
      ) : null}
    </div>
  );
}

/** A quiet section: three columns of a head and a line, the page between its lights. */
function Quiet({ ground, y, heads }: { ground: Ground; y: number; heads: readonly [string, string][] }) {
  const t = inkOf(useTake(), ground);
  return (
    <div className="flex" style={abs({ left: 96, right: 96, top: y, gap: 56 })}>
      {heads.map(([h, line]) => (
        <div key={h} className="flex-1">
          <p className="ag-subtitle" style={{ fontSize: 26, color: t.fg }}>
            {h}
          </p>
          <p style={{ fontSize: 17, lineHeight: 1.55, color: t.muted, marginTop: 12 }}>{line}</p>
        </div>
      ))}
    </div>
  );
}

/** A row of photographs at their own widths, one height. */
function PhotoRow({ ids, y, h, ground }: { ids: readonly PhotoId[]; y: number; h: number; ground: Ground }) {
  return (
    <div className="flex" style={abs({ left: 96, right: 96, top: y, height: h, gap: 12 })}>
      {ids.map((id) => (
        <LitPhoto key={id} id={id} ground={ground} style={{ flex: id === "wedding-petals" ? 0.67 : 1.5, height: h }} />
      ))}
    </div>
  );
}

const HOW: readonly [string, string][] = [
  ["Share one code", "Put it on the tables. Guests scan it; there is nothing to install."],
  ["Everyone adds", "Photos and videos land in one album, live, as the party happens."],
  ["Keep it all", "Curate, download the originals, and share the link with everyone."],
];

function HomePage() {
  const take = useTake();
  const { Bloom } = take.light;
  const ph = 430;
  return (
    <Page ground="room" foot={{ photos: ["party-balloons", "wedding-toast", "reception-table"] }}>
      <Opener
        ground="room"
        title="The whole event, in one album."
        lede="Your guests took the best photos and videos at your event. Partyreel collects them with one easy link."
        y={200}
        w={560}
        size={76}
      />
      <div className="flex" style={abs({ left: 96, top: 600, gap: 14 })}>
        <Btn ground="room" size="lg">
          Start free
        </Btn>
        <Btn ground="room" kind="secondary" size="lg">
          See how it works
        </Btn>
      </div>
      <div style={abs({ left: 720, top: 180, width: 624, height: ph })}>
        <Bloom source={{ photo: "party-balloons" }} ground="room" size={624} radius={4} ignite={false}>
          <LitPhoto id="party-balloons" ground="room" style={{ width: 624, height: ph }} />
        </Bloom>
      </div>
      <Quiet ground="room" y={790} heads={HOW} />
      <PhotoRow ids={["wedding-toast", "reception-table", "wedding-petals", "party-dj"]} y={1050} h={310} ground="room" />
    </Page>
  );
}

function FeaturesPage() {
  const take = useTake();
  const { Seam } = take.light;
  const h = 300;
  return (
    <Page ground="room" active="Features" foot={{ photos: ["reception-table", "wedding-rings"] }}>
      <Opener ground="room" eyebrow="The live album" title="Every photo, from every guest, in one place." y={190} w={900} size={66} />
      <PhotoRow ids={["reception-table", "wedding-rings", "wedding-toast"]} y={470} h={h} ground="room" />
      <div style={abs({ left: 96, right: 96, top: 470 + h + 2, height: 160 })}>
        <Seam source={{ photos: ["reception-table", "wedding-rings", "wedding-toast"] }} ground="room" reach={150} width={1248} />
      </div>
      <Quiet ground="room" y={1000} heads={HOW} />
    </Page>
  );
}

function EventsPage() {
  const take = useTake();
  const { Seam } = take.light;
  const cover = 560;
  return (
    <Page ground="room" active="Events" foot={{ photo: "wedding-golden" }}>
      <LitPhoto id="wedding-golden" ground="room" focus="50% 40%" style={abs({ left: 0, right: 0, top: 80, height: cover, borderRadius: 0 })} />
      <div style={abs({ left: 0, right: 0, top: 80 + cover, height: 180 })}>
        <Seam source={{ photo: "wedding-golden" }} ground="room" reach={170} width={PAGE_W} />
      </div>
      <Opener ground="room" eyebrow="Weddings" title="Every guest's view of the day." y={760} w={760} size={60} />
      <PhotoRow ids={["wedding-rings", "wedding-petals", "wedding-arch"]} y={1040} h={360} ground="room" />
    </Page>
  );
}

function ReelPage() {
  const take = useTake();
  const { Bloom } = take.light;
  const w = 960;
  const h = 540;
  return (
    <Page ground="room" foot={{ photo: "festival-lights" }}>
      <Opener ground="room" eyebrow="The reel" title="Everyone's photos, live as they land." x={240} y={180} w={960} size={60} />
      <div style={abs({ left: (PAGE_W - w) / 2, top: 440, width: w, height: h })}>
        <Bloom source={{ photo: "festival-lights" }} ground="room" size={w} radius={4} ignite={false}>
          <LitPhoto id="festival-lights" ground="room" style={{ width: w, height: h }} />
        </Bloom>
      </div>
      <Quiet ground="room" y={1180} heads={HOW} />
    </Page>
  );
}

const PRO: readonly PhotoId[] = ["wedding-toast", "party-balloons", "reception-table"];

function PlanCard({
  name,
  price,
  per,
  lines,
  ground,
  subject,
}: {
  name: string;
  price: string;
  per: string;
  lines: readonly string[];
  ground: Ground;
  subject?: boolean;
}) {
  const take = useTake();
  const t = inkOf(take, ground);
  const { Bloom } = take.light;
  const w = 384;
  const stripW = w - 64;
  const stripH = 120;
  return (
    <div
      style={{
        width: w,
        height: subject ? 640 : 600,
        padding: 32,
        borderRadius: 18,
        background: cardOf(take, ground).hex,
        boxShadow: ground === "paper" ? "inset 0 0 0 1px rgb(20 20 22 / 0.09)" : undefined,
        color: t.fg,
      }}
    >
      <p className="ag-subtitle" style={{ fontSize: 26, color: t.fg }}>
        {name}
      </p>
      <p style={{ marginTop: 16 }}>
        <span className="ag-title ag-num" style={{ fontSize: 54, color: t.fg }}>
          {price}
        </span>
        <span style={{ fontSize: 17, color: t.muted, marginLeft: 8 }}>{per}</span>
      </p>
      {subject ? (
        // The page's one light: the plan's photographs, lit the take's way.
        <div style={{ marginTop: 34, width: stripW, height: stripH }}>
          <Bloom source={{ photos: PRO }} ground={ground} size={stripW} radius={4} ignite={false}>
            <div className="flex" style={{ gap: 6, width: stripW, height: stripH }}>
              {PRO.map((id) => (
                <LitPhoto key={id} id={id} ground={ground} style={{ flex: 1, height: stripH }} />
              ))}
            </div>
          </Bloom>
        </div>
      ) : null}
      <div className="flex flex-col" style={{ gap: 14, marginTop: subject ? 40 : 34 }}>
        {lines.map((l) => (
          <span key={l} className="flex items-center" style={{ gap: 12, fontSize: 17, color: t.muted }}>
            <Glyph name="check" size={18} weight={2.2} style={{ color: t.fg }} />
            {l}
          </span>
        ))}
      </div>
      <div style={{ marginTop: 36 }}>
        <Btn ground={ground} kind={subject ? "primary" : "secondary"} size="lg" wide>
          {subject ? "Start with Pro" : "Choose"}
        </Btn>
      </div>
    </div>
  );
}

function PricingPage() {
  const take = useTake();
  const subject = take.onPaper.subject;
  return (
    <Page ground="paper" active="Pricing" foot={{ photos: PRO }}>
      <Opener ground="paper" title="Start free, upgrade for video and more room." x={220} y={180} w={1000} size={60} />
      <div className="flex items-start justify-center" style={abs({ left: 0, right: 0, top: 440, gap: 28 })}>
        <PlanCard name="Free" price="$0" per="forever" lines={["100 MB", "1 event", "Photos"]} ground="paper" />
        <PlanCard
          name="Pro"
          price="$9"
          per="a month"
          lines={["50 GB of room", "Video, any length", "Every event"]}
          ground={subject}
          subject
        />
        <PlanCard name="Event Pass" price="$29" per="once" lines={["25 GB", "1 event", "Renew for $19 a year"]} ground="paper" />
      </div>
      <Quiet
        ground="paper"
        y={1240}
        heads={[
          ["Do guests need an app?", "No. They scan the code and add photos in the browser."],
          ["Who can see the album?", "Anyone with the link, until you say otherwise."],
          ["What if I run out of room?", "Nothing is lost. You choose what to keep."],
        ]}
      />
    </Page>
  );
}

function HelpPage() {
  const t = inkOf(useTake(), "paper");
  const topics = [
    "Sharing the code",
    "Adding photos as a guest",
    "Approving what lands",
    "Downloading the originals",
    "Video and storage",
    "Deleting an event",
  ];
  return (
    <Page ground="paper" foot={{ house: true }}>
      <Opener ground="paper" title="How can we help?" x={240} y={200} w={960} size={64} />
      <div
        className="flex items-center"
        style={abs({
          left: 240,
          right: 240,
          top: 330,
          height: 64,
          gap: 14,
          paddingInline: 24,
          borderRadius: 999,
          background: "#ffffff",
          boxShadow: "inset 0 0 0 1px rgb(20 20 22 / 0.12)",
          color: t.faint,
          fontSize: 19,
        })}
      >
        <Glyph name="search" size={22} />
        Search help
      </div>
      <div className="grid grid-cols-2" style={abs({ left: 240, right: 240, top: 480, columnGap: 48 })}>
        {topics.map((x) => (
          <div
            key={x}
            className="flex items-center justify-between"
            style={{ height: 96, borderBottom: "1px solid rgb(20 20 22 / 0.09)", fontSize: 21, color: t.fg }}
          >
            {x}
            <Glyph name="chevron" size={20} style={{ transform: "rotate(-90deg)", color: t.faint }} />
          </div>
        ))}
      </div>
      <Quiet
        ground="paper"
        y={1040}
        heads={[
          ["For hosts", "Set up an event, print the code, curate the album."],
          ["For guests", "Scan, add, and see everyone's photos land."],
          ["Your data", "Unlisted by default, and yours until you delete it."],
        ]}
      />
    </Page>
  );
}

function AboutPage() {
  const t = inkOf(useTake(), "paper");
  return (
    <Page ground="paper" foot={{ photo: "wedding-petals" }}>
      <Opener
        ground="paper"
        eyebrow="About"
        title="We built the album we wanted at our own wedding."
        x={240}
        y={190}
        w={960}
        size={60}
      />
      <LitPhoto id="wedding-petals" ground="paper" focus="50% 38%" style={abs({ left: 240, right: 240, top: 470, height: 560 })} />
      <div style={abs({ left: 240, width: 760, top: 1100 })}>
        {[
          "The best photos of our day were on our guests' phones, and most of them never reached us.",
          "So we made one link that everyone can add to, no app and no account, and an album that keeps every photo where the party can see it.",
        ].map((p) => (
          <p key={p} style={{ fontSize: 21, lineHeight: 1.6, color: t.muted, marginBottom: 26 }}>
            {p}
          </p>
        ))}
      </div>
    </Page>
  );
}

function BlogPage() {
  const t = inkOf(useTake(), "paper");
  const posts: readonly [PhotoId, string][] = [
    ["wedding-arch", "How to get every guest's photos"],
    ["party-balloons", "A birthday, told by forty phones"],
    ["concert-confetti", "What to print on the table card"],
  ];
  return (
    <Page ground="paper" foot={{ photos: posts.map((p) => p[0]) }}>
      <Opener ground="paper" title="Stories" x={96} y={190} w={800} size={64} />
      <div className="flex" style={abs({ left: 96, right: 96, top: 340, gap: 36 })}>
        {posts.map(([id, title]) => (
          <div key={id} className="flex-1">
            <LitPhoto id={id} ground="paper" style={{ width: "100%", height: 280 }} />
            <p className="ag-subtitle" style={{ fontSize: 26, color: t.fg, marginTop: 22 }}>
              {title}
            </p>
            <p style={{ fontSize: 16, color: t.faint, marginTop: 8 }}>5 min read</p>
          </div>
        ))}
      </div>
      <Quiet
        ground="paper"
        y={900}
        heads={[
          ["Hosting", "Small things that make a big album."],
          ["Guests", "How people share at parties now."],
          ["Product", "What we shipped, and why."],
        ]}
      />
    </Page>
  );
}

const DRAW: Record<PageId, () => ReactNode> = {
  home: HomePage,
  features: FeaturesPage,
  events: EventsPage,
  reel: ReelPage,
  pricing: PricingPage,
  help: HelpPage,
  about: AboutPage,
  blog: BlogPage,
};

/** A page, shrunk to a thumbnail the way a screenshot is, with its name and its job under it. */
function Thumb({ p, w, desk }: { p: (typeof PAGES)[number]; w: number; desk: boolean }) {
  const take = useTake();
  const t = inkOf(take, "paper");
  const scale = w / PAGE_W;
  const Draw = DRAW[p.id];
  return (
    <div style={{ width: w }}>
      <Scaled
        w={PAGE_W}
        view={PAGE_H}
        scale={scale}
        style={{
          borderRadius: 4,
          boxShadow:
            p.ground === "room"
              ? "0 1px 2px rgb(0 0 0 / 0.14), 0 10px 22px -12px rgb(0 0 0 / 0.5)"
              : "0 0 0 1px rgb(20 20 22 / 0.1), 0 1px 2px rgb(20 20 22 / 0.06), 0 10px 22px -14px rgb(20 20 22 / 0.3)",
        }}
      >
        <Draw />
      </Scaled>
      <p className="ag-body" style={{ fontSize: desk ? 13.5 : 12.5, fontWeight: 600, color: t.fg, marginTop: desk ? 12 : 9 }}>
        {p.name}
      </p>
      <p
        className="ag-caption"
        style={{ color: t.faint, marginTop: 1, fontSize: desk ? 12 : 11, lineHeight: 1.3, textWrap: "balance" }}
      >
        {p.why}
      </p>
    </div>
  );
}

/**
 * A PAPER PAGE'S FOOTER, ENLARGED: the same Pricing page as its thumbnail,
 * drawn at `scale` and cropped to the footer's top-left (the last of the page
 * above it, the footer's top edge and its light, the wordmark), because at a
 * thumbnail's size a footer's form cannot be judged. Every paper page shares
 * the one footer, so one detail speaks for the four.
 */
function FootDetail({
  w,
  h,
  scale,
  thumb,
  above,
}: {
  w: number;
  h: number;
  scale: number;
  /** The thumbnails' width, so the caption says how much closer this is. */
  thumb: number;
  /** The share of the crop above the footer's top edge (the page's last section). */
  above: number;
}) {
  const t = inkOf(useTake(), "paper");
  const x0 = 56;
  const y0 = PAGE_H - FOOT_H - Math.round((h / scale) * above);
  const times = Math.round(scale / (thumb / PAGE_W));
  return (
    <div style={{ width: w }}>
      <div
        className="relative overflow-hidden"
        style={{
          width: w,
          height: h,
          borderRadius: 4,
          boxShadow: "0 0 0 1px rgb(20 20 22 / 0.1), 0 1px 2px rgb(20 20 22 / 0.06), 0 10px 22px -14px rgb(20 20 22 / 0.3)",
        }}
      >
        <div
          className="absolute top-0 left-0"
          style={{
            width: PAGE_W,
            height: PAGE_H,
            transform: `scale(${scale}) translate(${-x0}px, ${-y0}px)`,
            transformOrigin: "0 0",
          }}
        >
          <PricingPage />
        </div>
      </div>
      <p className="ag-body" style={{ fontSize: 13.5, fontWeight: 600, color: t.fg, marginTop: 12 }}>
        A paper page&apos;s footer
      </p>
      <p className="ag-caption ag-num" style={{ color: t.faint, marginTop: 1, fontSize: 12, lineHeight: 1.3 }}>
        Pricing, {times}× its thumbnail
      </p>
    </div>
  );
}

/* ── round one's paper beside this take's ──────────────────────────────────── */

/**
 * ★ THE COMPARISON IS A LIT CARD, NEVER A SEAM. A band of light under a
 * photograph is a band in every take (round one's pastel and Cast's fall
 * read alike at a glance), while round one's paper Bloom was a halo all
 * round and no take draws one: Aperture plates it in the dark, Ink screens
 * it in ink, Cast throws it down and to the right. The section that tells
 * the four apart at a glance is the one the slide draws.
 */
const SECTION_PHOTO: PhotoId = "wedding-toast";

/** Round one's paper register for the Ring and the Bloom, verbatim (`a7d519a79`, system.tsx). */
const R1_PAPER = { l: 0.85, lift: 0.05, c: 0.14, boost: 1.3 } as const;

/** A lamp in round one's paper register, as round one's `lampTone` read it. */
function roundOneTone(lamp: Lamp) {
  const r = R1_PAPER;
  const h = unOlive(lamp.h);
  const l = Math.min(0.95, r.l + r.lift * yellowness(h) + (lamp.dl ?? 0));
  const own = lamp.c === undefined ? r.c : lamp.c * r.boost;
  return tone(l, Math.min(r.c, Math.max(0.13, own)), h).oklch;
}

/** Round one's paper Bloom light: the photograph's hues round a conic, as `conicOf` lays them. */
function roundOneConic(source: Source) {
  const light = lightOf(source);
  const total = light.reduce((s, x) => s + x.w, 0);
  let acc = 0;
  const at = light.map((x) => {
    const c = acc + x.w / total / 2;
    acc += x.w / total;
    return c;
  });
  const c = light.map(roundOneTone);
  const last = light.length - 1;
  const stops = [
    `${c[last]} ${((at[last] - 1) * 360).toFixed(1)}deg`,
    ...c.map((col, i) => `${col} ${(at[i] * 360).toFixed(1)}deg`),
    `${c[0]} ${((at[0] + 1) * 360).toFixed(1)}deg`,
  ];
  return `conic-gradient(in oklab from 300deg, ${stops.join(", ")})`;
}

/**
 * Round one's paper Bloom round a subject, as its touchpoints sized it: the
 * pastel conic, blurred a seventh of the subject, at full strength, through
 * the room's own bloom (`.ag-bloom`).
 */
function RoundOneBloom({ size, radius, children }: { size: number; radius: number; children: ReactNode }) {
  const vars = {
    "--ag-conic": roundOneConic({ photo: SECTION_PHOTO }),
    "--ag-spread": `${Math.round(size * 0.02)}px`,
    "--ag-blur": `${Math.round(size * 0.14)}px`,
    "--ag-radius": `${radius}px`,
    "--ag-rest": 1,
  } as CSSProperties;
  return (
    <div className="ag-bloom" style={vars}>
      <div aria-hidden className="ag-bloom-light" />
      <div className="ag-bloom-subject">{children}</div>
    </div>
  );
}

/**
 * THE LIT CARD BOTH PANELS DRAW: a paper page's one live subject, the album's
 * newest photograph in its Bloom, the event beside it. Only the light differs.
 */
function LitSection({ w, mine, stack }: { w: number; mine: boolean; stack: boolean }) {
  const take = useTake();
  const t = inkOf(take, "paper");
  const { Bloom } = take.light;
  const pad = stack ? 28 : 36;
  const pw = stack ? Math.min(196, w - pad * 2) : Math.round(w * 0.4);
  const ph = Math.round(pw * 0.667);
  // A take's paper form reaches up to an eighth past its subject, and a
  // falling light leans right and down, so the words keep clear of both.
  const clear = Math.round(pw * 0.19);
  const photo = <LitPhoto id={SECTION_PHOTO} ground="paper" style={{ width: pw, height: ph }} />;
  return (
    <div
      className={stack ? "flex flex-col" : "flex items-center"}
      style={{
        width: w,
        padding: pad,
        gap: clear,
        borderRadius: 8,
        background: cardOf(take, "paper").hex,
        boxShadow: "0 0 0 1px rgb(20 20 22 / 0.08), 0 1px 2px rgb(20 20 22 / 0.05)",
        isolation: "isolate",
      }}
    >
      <div className="shrink-0" style={{ width: pw, height: ph, alignSelf: stack ? "center" : undefined }}>
        {mine ? (
          <Bloom source={{ photo: SECTION_PHOTO }} ground="paper" size={pw} radius={2} ignite={false}>
            {photo}
          </Bloom>
        ) : (
          <RoundOneBloom size={pw} radius={2}>
            {photo}
          </RoundOneBloom>
        )}
      </div>
      <div>
        <Readout style={{ color: t.faint }}>Just added</Readout>
        <p className="ag-subtitle" style={{ fontSize: 22, color: t.fg, marginTop: 8 }}>
          {PARTY.name}
        </p>
        <p style={{ fontSize: 13.5, color: t.muted, marginTop: 4 }}>
          {PARTY.photos.toLocaleString("en-US")} photos from {PARTY.guests} guests
        </p>
        {stack ? null : (
          <div style={{ marginTop: 16 }}>
            <Btn ground="paper" kind="secondary" size="sm">
              Open the album
            </Btn>
          </div>
        )}
      </div>
    </div>
  );
}

function Compare({ w, gap, stack }: { w: number; gap: number; stack: boolean }) {
  const take = useTake();
  const pw = stack ? w : Math.floor((w - gap) / 2);
  const panels = [
    { mine: false, label: "Round one", line: take.words.roundOne },
    { mine: true, label: take.name, line: take.words.thisTake },
  ];
  return (
    <div className={stack ? "flex flex-col" : "flex"} style={{ gap }}>
      {panels.map((p) => (
        <div key={p.label} style={{ width: pw }}>
          <Label ground="paper">{p.label}</Label>
          <div style={{ marginTop: 12 }}>
            <LitSection w={pw} mine={p.mine} stack={stack} />
          </div>
          <Caption ground="paper" width={pw} style={{ marginTop: 12 }}>
            {p.line}
          </Caption>
        </div>
      ))}
    </div>
  );
}

/* ── the slide ─────────────────────────────────────────────────────────────── */

export function PagesSlide({ screen }: SlideProps) {
  const take = useTake();
  const m = useMeasure();
  const t = inkOf(take, "paper");
  const title = "Where photographs play, the room. Where people read and decide, paper.";

  if (m.desk) {
    // Three columns: the room's pages, paper's pages, and one paper footer
    // close up with the rhythm paragraph under it (it is about that footer).
    // The comparison sits under the two groups, a panel under each.
    const group = 36;
    const gap = 12;
    const side = 216;
    const tw = Math.floor((m.inner - group * 2 - side - gap * 6) / 8);
    const th = Math.round((tw * PAGE_H) / PAGE_W);
    const groupW = tw * 4 + gap * 3;
    const sideX = m.pad + groupW * 2 + group * 2;
    const room = PAGES.filter((p) => p.ground === "room");
    const paper = PAGES.filter((p) => p.ground === "paper");
    const row = 250;
    const low = 544;
    return (
      <SlideRoot screen={screen} ground="paper">
        <div className="absolute" style={{ left: m.pad, top: m.top }}>
          <Heading ground="paper" kicker="Dark and light" title={title} width={820} />
        </div>
        <div className="absolute flex" style={{ left: m.pad, top: row, gap: group }}>
          {[room, paper].map((g) => (
            <div key={g[0].ground} className="flex" style={{ gap }}>
              {g.map((p) => (
                <Thumb key={p.id} p={p} w={tw} desk />
              ))}
            </div>
          ))}
        </div>
        <div className="absolute" style={{ left: sideX, top: row }}>
          <FootDetail w={m.w - m.pad - sideX} h={th} scale={0.44} thumb={tw} above={0.28} />
        </div>
        <p
          className="ag-body absolute"
          data-bd-contrast="the rhythm"
          style={{ left: sideX, top: low + 26, width: m.w - m.pad - sideX, fontSize: 14, lineHeight: 1.55, color: t.muted, textWrap: "pretty" }}
        >
          {take.words.rhythm}
        </p>
        <div className="absolute" style={{ left: m.pad, top: low }}>
          {/* A panel under each group of pages: one grid. */}
          <Compare w={groupW * 2 + group} gap={group} stack={false} />
        </div>
      </SlideRoot>
    );
  }

  const gap = 10;
  const tw = Math.floor((m.inner - gap * 3) / 4);
  return (
    <SlideRoot screen={screen} ground="paper">
      <div className="absolute" style={{ left: m.pad, top: m.top, width: m.inner }}>
        <Heading ground="paper" kicker="Dark and light" title={title} />
        <p
          className="ag-body"
          data-bd-contrast="the rhythm"
          style={{ fontSize: 15, lineHeight: 1.55, color: t.muted, marginTop: 14, textWrap: "pretty" }}
        >
          {take.words.rhythm}
        </p>
        <div className="grid" style={{ gridTemplateColumns: `repeat(4, ${tw}px)`, columnGap: gap, rowGap: 22, marginTop: 32 }}>
          {PAGES.map((p) => (
            <Thumb key={p.id} p={p} w={tw} desk={false} />
          ))}
        </div>
        <div style={{ marginTop: 26 }}>
          <FootDetail w={m.inner} h={108} scale={0.46} thumb={tw} above={0.1} />
        </div>
        <div style={{ marginTop: 40 }}>
          <Compare w={m.inner} gap={36} stack />
        </div>
      </div>
    </SlideRoot>
  );
}
