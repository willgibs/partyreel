"use client";

// the board's own sheet; it leaves with the board when the ruling lands.
import "./board.css";

import Image from "next/image";
import { useState, useSyncExternalStore, type CSSProperties } from "react";

import {
  BoardMeta,
  clearCandidate,
  setCandidateCss,
  Stage,
  Toggle,
  useTunerCandidate,
  type Mode,
} from "@/components/dev/board";
import { Caption } from "@/components/marketing/system/caption";
import { cn } from "@/lib/utils";

import { BRIDGE_CSS, EXPOSURE_CSS, MIX_CSS, SHOOT_CSS, WALK } from "./apply";
import { BRIDGE, routeOutcome, STAGE_POSTS, type BridgePost } from "./bridge";
import {
  candidate,
  candidateSrc,
  CANDIDATES,
  IDENTIFIABLE,
} from "./candidates";
import {
  ASKS,
  BARRED_IDS,
  BARRED_POSTS,
  IDS_TOTAL,
  IDS_UNDER_RULE,
  POSTS_FILLED,
  POSTS_UNDER_RULE,
  RECOMMENDATION,
  ROUTE_SHIPS,
} from "./decision";
import {
  CHROME,
  FILE_COUNTS,
  liveExposure,
  MARKETING_PAGES,
  PRODUCTION_FILES,
  ROUTES,
} from "./exposure";
import {
  countByVertical,
  MANIFEST_BY_ID,
  REELS,
  type Route,
  STAND_INS,
  VERTICALS,
} from "./kit";
import { runbookFor, WIRING_ADDS } from "./runbook";
import {
  DERIVED,
  KIT_CONSTRAINTS,
  master,
  MASTERS,
  NOT_DERIVED,
} from "./shoot";
import { SOURCES } from "./sources";

/**
 * THE MEDIA-KIT BOARD, ROUND THREE (2026-09-15).
 *
 * Round one surveyed the licenses and found the thing that settles the round:
 * Unsplash's terms exclude recognisable people, so the twelve stills were never
 * covered by the license they claim. Round two measured the exposure, mapped all
 * 23 posts and handed the running site four blocks it can wear. Round three is
 * the walk taken before Will takes it, and it changed four things.
 *
 * WHAT ROUND THREE CHANGED, AND WHY EACH CHANGE IS HERE:
 *
 *  1. THE DECISION IS THE FIRST THING ON THE BOARD. Two rounds of evidence sat in
 *     front of the four words a ruling actually is. The verdict block at the top
 *     is the whole ruling surface: four questions, their one-word answers, the
 *     recommendation marked, and a link into the section that argues each. A
 *     reviewer who reads nothing else can still rule, and everything below it is
 *     there to be disagreed with rather than to be waded through.
 *  2. FIVE ASKS BECAME FOUR. The route decides the bridge (Licensed ships twelve
 *     swaps, Mix ships two, Ours ships none), so asking both was asking the same
 *     question twice. The consequence is a table now (ROUTE_SHIPS) instead.
 *  3. ★ THE RULE TAKES BACK PART OF THE LICENSED ROUTE, AND THE BOARD SAYS THE
 *     SMALLER NUMBER. Ask 1 bars a recognisable face without a release. Four of
 *     the 22 staged frames carry one, two of them are the swap for a manifest id
 *     and three carry a blog post, so Licensed fills ten of twelve and eighteen
 *     of 23, not twelve and 21. Round two printed the raw counts and was
 *     optimistic by exactly what its own rule takes away. decision.ts computes
 *     both numbers and decision.test.ts pins them to the batch.
 *  4. ★ THE STAGE WAS SHOWING THE WRONG SIZE ON THE WRONG GROUND, AND AT THE
 *     DEFAULT ROUTE IT WAS SHOWING NOTHING. It drew 4:5 plates at about 440 px
 *     on the PAPER ground; the real blog card is 320x400 and /blog is a CINEMA
 *     page. And because the three posts it stages all go to the shoot under Mix,
 *     the board's largest element opened as three empty hatches. It is now the
 *     real card at the real size on the real ground, with today's row above the
 *     route's row, so it is a comparison at every route and never a blank.
 *
 * THE SHEET IS BOARD CHROME AND THE PLATES ARE REAL. A contact sheet is a
 * reviewing instrument and wants the reader's own width; "does this frame survive
 * where it lands" is a geometry question, so the two plate shapes on this board
 * are the production ones: the blog card's 4:5 with the slug-derived ladder
 * position, and the share card's 1200x630 CENTRE crop, which ignores the ladder.
 *
 * Keyframes live in board.css under `mk-`. No mono face anywhere: data sits on
 * the body face with tabular figures and every label is the Caption atom.
 */

const QUESTION =
  "No stock at launch and every frame ours or under a license we can name: what the rule says, where the frames come from until the kit exists, and what the kit is when it is shot.";

const DEPARTURES = [
  "Bible 18 says no stock on a marketing surface, and the rule is already broken in production on a larger scale than round one reported: the twelve are in 40 production files and 22 routes, and four of them are in the footer of every marketing page. That is the only reason the Licensed route exists at all.",
  "Licensed no longer survives its own column, and round three says so rather than leaving it as an equal third. Under ask 1 it fills ten of the twelve ids and eighteen of the 23 posts, the two it cannot fill are the dance floor and the DJ, and it has nothing at all for the corporate and conference half of the business. It stays on the board to be walked, because walking it is what kills it, not to be chosen.",
  "Round one's board said the blog covers were hashed out of a pool. They are not. All 23 posts set `cover:` in frontmatter and 22 of the 23 differ from what the hash would give, so every miscast cover was chosen by a person out of eleven wedding and festival frames. The correction is on the board because it changes what the fix is: 23 frontmatter lines, not twelve files.",
  "Round one said re-rendering a recorded reel needs a code edit in the parity page. It does not: both recipes are already in that page's clip-set picker, in order. runbook.test.ts pins it.",
  "The perfect version of this system is neither licensed nor generated: it is one real event, hosted and shot with releases signed at the door, which is the only sourcing that makes the product's own claim literally true. Round three found it is also the cheapest: nine of the twelve rows in the asset log are crops, cuts or setups of that one night, and one of them is the demo event's own seed, so the event that produces the kit can BE the demo event the live QR already points at. The hero-river board reached the same idea from the other end.",
];

const ASSETS = [
  "36 event photographs, six per vertical (weddings, birthdays, corporate, conferences, festivals, trips), 1600 px long edge, a third portrait, one dark warm grade, the call sheet on this board (codes W1 to T6). Four of the 36 are the palette board's hard cases (W5 high key, W3 low key, W2 candle warm, S4 stage cool) and three show a guest holding a phone up (K3, S3, T4). Replaces all twelve stand-ins by id.",
  "24 squares at 512x512, 6 to 35 KB webp, crops of the 24 masters marked 512 square rather than a second shoot. Replaces FRAMES in sandbox/home-hero/shared.tsx (ASSETS row 2).",
  "10 portrait crops at 512x640 and 12 portraits at 720x900, recrops of the same masters, for the burst's tall third and the river's stream (ASSETS rows 9 and 12). Ten, not the log's eight: hero-burst raised the count in its round two.",
  "A hand-and-phone cutout, PNG with alpha, 1200 px long edge, the screen area transparent, two grips. The ONE item on the list that is a separate setup: shoot it at the same event, against the darkest wall, in the same low warm light as K3 (ASSETS row 8).",
  "8 vertical clips, 3 to 5 s, 1080x1920, silent, each with its own poster, filmed at the same events, and the film cut from that footage (ASSETS rows 4 and 1).",
  "Two frames shot knowing they will be laid over each other, both dark and low contrast at the touching edge, for the light board's depth cue (ASSETS row 11). W3 and C1 on the call sheet already are that pair; they need no second setup, only the intent.",
  "The demo event's curated folder (ASSETS row 5): if the shoot is run AS a Partyreel event, the guests' own uploads are the seed, and the live QR on every hero board points at a real album instead of fixtures.",
];

/* --------------------------------------------------------------------------
   Provenance, typeset as a fact. It is what the round is about, so it is never
   behind a hover and never a footnote.
   -------------------------------------------------------------------------- */

function Tag({
  tone,
  children,
}: {
  tone: "gap" | "named" | "ours" | "face" | "empty";
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-1.5 py-px text-[10px] font-medium",
        tone === "gap" && "bg-destructive/10 text-destructive",
        tone === "face" && "bg-destructive/15 text-destructive",
        tone === "named" && "bg-muted text-muted-foreground",
        tone === "empty" &&
          "border border-dashed border-border text-muted-foreground",
        tone === "ours" && "bg-foreground text-background",
      )}
    >
      {children}
    </span>
  );
}

function CandidateLine({ keyName }: { keyName: string }) {
  const c = candidate(keyName);
  return (
    <div className="mt-1.5 space-y-0.5">
      <div className="flex flex-wrap items-center gap-1">
        <Tag tone="named">CC0 1.0</Tag>
        {c.people === "identifiable" ? (
          <Tag tone="face">A face, no release</Tag>
        ) : (
          <Tag tone="named">
            {c.people === "none" ? "Nobody in frame" : "Nobody recognisable"}
          </Tag>
        )}
        {c.staged === 2 && <Tag tone="named">Second search</Tag>}
      </div>
      <p className="text-[10px] leading-snug text-muted-foreground tabular-nums">
        {c.author}, Wikimedia Commons, retrieved 2026-09-14
      </p>
      {c.caution && (
        <p className="rounded border border-destructive/30 bg-destructive/5 px-1.5 py-1 text-[10px] leading-snug text-destructive">
          {c.caution}
        </p>
      )}
    </div>
  );
}

/* --------------------------------------------------------------------------
   The two production geometries.
   -------------------------------------------------------------------------- */

/** Mirrors post-card.tsx: aspect-4/5, object-cover, the coverFor object-position,
 *  the bottom scrim, white type. Not the component itself, because PostCard is a
 *  Link that would navigate out of the lab and it cannot swap its own source.
 *
 *  ★ `full` IS THE REAL CARD, `sheet` IS A THUMBNAIL OF IT. Measured on the
 *  running blog at 1440: the library card is 320 by 400 with a 16 px gutter,
 *  three across, its title `text-lg` (18 px) over a `p-5` block with the byline
 *  under it. The contact sheet below runs plates at about 220 px, where 18 px
 *  type would be a different composition, so the sheet steps the type down and
 *  drops the byline and the stage does not. The tag chips in the real card's top
 *  left are the one thing neither draws (the board holds no tag data, and
 *  inventing two would be a worse lie than leaving the corner empty). */
function CardPlate({
  src,
  title,
  crop,
  slate,
  full = false,
}: {
  src: string | null;
  title: string;
  crop: string;
  slate?: string;
  /** Draw it at the real card's type and padding, for the stage. */
  full?: boolean;
}) {
  return (
    <div className="relative aspect-4/5 overflow-hidden bg-muted">
      {src ? (
        <Image
          src={src}
          alt=""
          fill
          sizes={full ? "320px" : "(max-width: 640px) 45vw, 220px"}
          className="object-cover"
          style={{ objectPosition: crop }}
        />
      ) : (
        <div
          className={cn(
            "absolute inset-0 grid place-items-center bg-[repeating-linear-gradient(135deg,transparent,transparent_7px,var(--border)_7px,var(--border)_8px)] text-center",
            full ? "p-5" : "p-3",
          )}
        >
          <Caption
            className={cn("leading-snug", full ? "text-xs" : "text-[10px]")}
          >
            {slate ?? "Nothing to show"}
          </Caption>
        </div>
      )}
      {src && (
        <>
          <span
            aria-hidden
            className="absolute inset-0 bg-linear-to-t from-black/85 via-black/40 to-black/10"
          />
          <span
            className={cn(
              "absolute inset-x-0 bottom-0 flex flex-col",
              full ? "gap-2 p-5" : "p-3",
            )}
          >
            <span
              className={cn(
                "line-clamp-2 font-heading leading-tight text-balance text-white",
                full ? "text-lg" : "text-[13px]",
              )}
            >
              {title}
            </span>
            {full && (
              <span className="text-xs text-white/65">
                <span className="font-medium text-white">Partyreel Team</span>
              </span>
            )}
          </span>
        </>
      )}
    </div>
  );
}

/** Mirrors blog/[slug]/opengraph-image.tsx at 1200x630: a flat 30 percent base, a
 *  two-stop gradient, the mark top left, the title and byline bottom left.
 *  ★ Sizes are cqw of 1200 so the mock is geometrically exact at any width, and
 *  ★ the cover carries NO object-position, because the real card does not either:
 *  the share image is always the middle of a frame composed for a 4:5 ladder. */
function SharePlate({
  src,
  title,
  slate,
}: {
  src: string | null;
  title: string;
  slate?: string;
}) {
  const cq = (px: number) => `${((px / 1200) * 100).toFixed(3)}cqw`;
  return (
    <div
      className="relative aspect-[40/21] overflow-hidden bg-[#0d0d0d]"
      style={{ containerType: "inline-size" }}
    >
      {src ? (
        <Image
          src={src}
          alt=""
          fill
          sizes="(max-width: 640px) 92vw, 420px"
          className="object-cover"
        />
      ) : (
        <div className="absolute inset-0 bg-[repeating-linear-gradient(135deg,transparent,transparent_7px,#1f1f1f_7px,#1f1f1f_8px)]" />
      )}
      <span aria-hidden className="absolute inset-0 bg-black/30" />
      <span
        aria-hidden
        className="absolute inset-0 bg-linear-to-t from-black/90 to-transparent to-60%"
      />
      <span
        className="absolute flex items-center"
        style={{ top: cq(80), left: cq(80), gap: cq(20) }}
      >
        <span
          className="grid place-items-center bg-[#fafafa]"
          style={{ width: cq(56), height: cq(56), borderRadius: cq(14) }}
        />
        <span style={{ fontSize: cq(28), color: "#e4e4e7" }}>
          Partyreel Blog
        </span>
      </span>
      <span
        className="absolute inset-x-0 bottom-0 flex flex-col"
        style={{ padding: `0 ${cq(80)} ${cq(80)}`, gap: cq(22) }}
      >
        <span
          className="font-heading font-bold text-[#fafafa]"
          style={{
            fontSize: cq(58),
            lineHeight: 1.08,
            letterSpacing: "-0.02em",
          }}
        >
          {title}
        </span>
        <span style={{ fontSize: cq(28), color: "#d4d4d8" }}>
          {slate ?? "Will Gibson"}
        </span>
      </span>
    </div>
  );
}

/** The stage's share plate: the same SharePlate, with the slate the Ours route
 *  wants. Split out so the stage's cell renders one expression either way. */
function SharePlateStage({
  src,
  title,
  next,
  which,
  shot,
}: {
  src: string | null;
  title: string;
  next: { kind: "ours" } | { kind: "licensed"; key: string | null };
  which: "today" | "next";
  shot: string;
}) {
  return (
    <SharePlate
      src={src}
      title={title}
      slate={
        which === "next" && next.kind === "ours"
          ? `To be shot, ${master(shot).code}`
          : undefined
      }
    />
  );
}

/* --------------------------------------------------------------------------
   The bridge, post by post.
   -------------------------------------------------------------------------- */

/** The route's outcome (bridge.ts, shared with the sheet and the tests) plus the
 *  master frame the slate names, which only the board needs. */
function whatReplaces(post: BridgePost, route: Route) {
  const out = routeOutcome(post, route);
  return out.kind === "ours"
    ? { kind: "ours" as const, master: master(post.shot) }
    : out;
}

function PostRow({
  post,
  route,
  geometry,
  index,
}: {
  post: BridgePost;
  route: Route;
  geometry: "card" | "share";
  index: number;
}) {
  const current = MANIFEST_BY_ID.get(post.cover);
  const next = whatReplaces(post, route);
  const Plate = geometry === "card" ? CardPlate : SharePlate;
  const slate =
    next.kind === "ours"
      ? `To be shot, ${next.master.code}: ${next.master.subject}`
      : post.candidate
        ? undefined
        : post.why;

  if (!current) return null;

  return (
    <div className="flex flex-col">
      <div
        className={cn(
          "grid gap-2",
          geometry === "card" ? "grid-cols-2" : "grid-cols-1",
        )}
      >
        <div>
          <Caption className="mb-1 block text-[10px]">Today</Caption>
          {geometry === "card" ? (
            <CardPlate src={current.src} title={post.title} crop={post.crop} />
          ) : (
            <SharePlate src={current.src} title={post.title} />
          )}
          <p className="mt-1 text-[10px] leading-snug text-muted-foreground tabular-nums">
            {post.cover} at {geometry === "card" ? post.crop : "centre"}
          </p>
        </div>
        <div
          key={`${route}-${next.kind}`}
          data-mkt-develop
          style={{ "--i": index % 4 } as CSSProperties}
        >
          <Caption className="mb-1 block text-[10px]">
            {next.kind === "ours" ? "Shot" : "Bridge"}
          </Caption>
          {next.kind === "licensed" && next.key ? (
            <>
              <Plate
                src={candidateSrc(next.key)}
                title={post.title}
                crop="50% 50%"
              />
              <CandidateLine keyName={next.key} />
            </>
          ) : (
            <Plate src={null} title={post.title} crop="50% 50%" slate={slate} />
          )}
        </div>
      </div>
      <p className="mt-2 text-[11px] leading-tight font-medium">{post.title}</p>
      <p className="mt-0.5 text-[11px] leading-snug text-muted-foreground">
        <span className="uppercase">{post.vertical}</span>. {post.why}
      </p>
    </div>
  );
}

/* --------------------------------------------------------------------------
   The board.
   -------------------------------------------------------------------------- */

/* The blocks, in walking order: what is wrong, the recommendation, then the two
   routes it sits between. Round two led with the exposure and ended on the
   recommendation, which is the order an argument is BUILT in rather than the
   order it is READ in. */
const APPLY: { id: string; label: string; css: string; note: string }[] = [
  {
    id: "mk-exposure",
    label: "The exposure",
    css: EXPOSURE_CSS,
    note: "Every frame with no provenance, outlined and drained. Media is the colour, so this is the site with everything we do not own taken out of it. Start here.",
  },
  {
    id: "mk-mix",
    label: "Mix",
    css: MIX_CSS,
    note: "The recommendation: licensed on the two details nobody studies, the slate on the ten that carry the argument. This is the site in the weeks between the ruling and the shoot.",
  },
  {
    id: "mk-ours",
    label: "Ours",
    css: SHOOT_CSS,
    note: "Every frame replaced by the slate of the shot that replaces it. This is the site saying what the shoot costs, page by page.",
  },
  {
    id: "mk-licensed",
    label: "Licensed",
    css: BRIDGE_CSS,
    note: `The staged CC0 batch swapped in by id, everywhere the twelve appear. Walk it to see why it loses: ${BARRED_IDS.join(" and ")} are filled here by frames with a face and no release, so two of these twelve cannot ship under ask 1.`,
  },
];

/** The route toggle, recommendation first. */
const ROUTE_OPTIONS: { id: Route; label: string }[] = [
  { id: "mix", label: "Mix" },
  { id: "ours", label: "Ours" },
  { id: "licensed", label: "Licensed" },
];

/* The lab key, read without an effect. The URL never changes under this board,
   so the store never notifies: subscribe is a no-op that returns a no-op. */
const subscribeNever = () => () => {};
const readLabKey = () =>
  new URLSearchParams(window.location.search).get("key") ?? "";
const readNoLabKey = () => "";

/**
 * THE VERDICT BLOCK: the four questions, their one-word answers, and a way into
 * the section that argues each. This is the board's actual product; everything
 * under it is the evidence for disagreeing with a line of it.
 */
function Verdict() {
  return (
    <section
      id="mk-decision"
      className="flex flex-col gap-3 rounded-lg border border-foreground/25 bg-card p-5"
    >
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <h2 className="text-sm font-semibold">
          Four answers, and the board is done
        </h2>
        <Caption className="text-[11px]">
          Every number below is computed from the staged batch and the real
          posts, not typed into a sentence
        </Caption>
      </div>
      <p className="max-w-3xl text-xs leading-relaxed">{RECOMMENDATION}</p>
      <ol className="mt-1 flex flex-col divide-y divide-border border-y border-border">
        {ASKS.map((a, i) => (
          <li
            key={a.id}
            className="grid gap-x-4 gap-y-2 py-3 sm:grid-cols-[minmax(0,1fr)_11rem] sm:items-start"
          >
            <div>
              <p className="text-[11px] leading-snug">
                <span className="font-medium tabular-nums">{i + 1}.</span>{" "}
                {a.question}
              </p>
              <p className="mt-1 text-[11px] leading-snug text-muted-foreground">
                {a.because}{" "}
                <a
                  href={a.href}
                  className="font-medium text-foreground underline decoration-border underline-offset-2 transition-colors duration-150 hover:decoration-foreground"
                >
                  See it
                </a>
              </p>
            </div>
            <div className="flex flex-wrap gap-1 sm:justify-end">
              {a.options.map((o) => (
                <span
                  key={o}
                  className={cn(
                    "rounded-full px-2 py-0.5 text-[11px]",
                    o === a.recommend
                      ? "bg-foreground font-medium text-background"
                      : "border border-border text-muted-foreground",
                  )}
                >
                  {o}
                </span>
              ))}
            </div>
          </li>
        ))}
      </ol>
      <Caption className="text-[10px]">
        The filled word is this board&rsquo;s recommendation, not a default.
        Round two asked a fifth question, the bridge; the route answers it, so
        the consequence is the table under the routes instead of a word of
        Will&rsquo;s.
      </Caption>
    </section>
  );
}

export function MediaKitBoard() {
  const [route, setRoute] = useState<Route>("mix");
  const [geometry, setGeometry] = useState<"card" | "share">("card");
  const [mode, setMode] = useState<Mode>("desktop");
  const applied = useTunerCandidate();

  // The lab key, so "walk it on" can be a LINK rather than a path to retype: the
  // candidate block renders only where the tuner island mounts, and that island
  // mounts only when the page arrives with ?key=. useSyncExternalStore rather
  // than an effect: the server snapshot is the empty string, so the first paint
  // matches the server and the key arrives with hydration, with no setState in
  // an effect to cascade a render (the lint rule that catches exactly that).
  const labKey = useSyncExternalStore(subscribeNever, readLabKey, readNoLabKey);
  const walkHref = (p: string) =>
    labKey ? `${p}?key=${encodeURIComponent(labKey)}` : p;

  const empty = BRIDGE.filter((p) => !p.candidate);
  const stagedTwo = CANDIDATES.filter((c) => c.staged === 2).length;
  const maxFiles = Math.max(...STAND_INS.map((s) => FILE_COUNTS[s.id] ?? 0));
  const widest = STAND_INS.reduce((a, b) =>
    (FILE_COUNTS[b.id] ?? 0) > (FILE_COUNTS[a.id] ?? 0) ? b : a,
  );
  const narrowest = STAND_INS.reduce((a, b) =>
    (FILE_COUNTS[b.id] ?? 0) < (FILE_COUNTS[a.id] ?? 0) ? b : a,
  );

  return (
    <div className="flex flex-col gap-10 py-4">
      <Verdict />

      <div className="max-w-2xl space-y-3 text-xs leading-relaxed text-muted-foreground">
        <p>
          All twelve stills in the manifest carry one line, &ldquo;unsplash (per
          lab-pack comment; provenance unverified)&rdquo;, with no author, no
          source and no retrieval date. Reading the license settles it faster
          than a provenance hunt would: Unsplash&rsquo;s terms say the license
          &ldquo;does not include the right to use ... People&rsquo;s images if
          they are recognizable in the Images&rdquo;, and all twelve are full of
          recognisable people. Even in the best case the license never covered
          the thing that makes them worth having. Not a filing problem. A
          sourcing problem.
        </p>
        <p>
          Round one measured the blast radius as the blog. It is the site. The
          twelve are referenced in {PRODUCTION_FILES} production files across{" "}
          {ROUTES.length} routes, and four of them sit in the footer strip and
          two in the nav panel, both of which live in the group layouts, so they
          are on all {MARKETING_PAGES} marketing pages before a reader scrolls.
          Apply &ldquo;The exposure&rdquo; below and walk the site to see it.
        </p>
        <p>
          The second, harder search closed all four holes round one could not
          fill: searching by the scene rather than by the words on a manifest
          entry found a dance floor, a table with people at it, real balloons
          and a portrait: {stagedTwo} more frames, {CANDIDATES.length} staged in
          all. That moves the argument rather than winning it. Of the{" "}
          {CANDIDATES.length} staged frames,{" "}
          {CANDIDATES.length - IDENTIFIABLE.length} work only because nobody in
          them is recognisable, and the {IDENTIFIABLE.length} with a face are
          the {IDENTIFIABLE.length} that need a release nobody here holds. The
          frames worth anything to this product are the ones with faces in them,
          and saying yes to ask 1 is what takes them off the table: under the
          rule the batch fills {IDS_UNDER_RULE} of the {IDS_TOTAL} ids and{" "}
          {POSTS_UNDER_RULE} of the 23 posts, not {IDS_TOTAL} and {POSTS_FILLED}
          .
        </p>
      </div>

      {/* APPLY TO THE SITE. A photograph board's candidate is not a token block,
          so what it hands the site is the swap itself. */}
      <section
        id="mk-apply"
        className="flex flex-col gap-2 rounded-lg border border-border bg-card p-4"
      >
        <div className="flex flex-wrap items-baseline gap-2">
          <h2 className="text-sm font-semibold">Apply to the site</h2>
          <Caption className="text-[11px]">
            One block at a time, on every lab page, every marketing page and the
            host app. Chrome and Safari only: a stylesheet replacing the content
            of an image is their behaviour, and Firefox simply shows
            today&rsquo;s frame.
          </Caption>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {APPLY.map((a) => (
            <button
              key={a.id}
              type="button"
              onClick={() => setCandidateCss(a.label, a.css)}
              className={cn(
                "rounded-md border px-2.5 py-1 text-xs font-medium transition-transform duration-150 ease-emphasis active:scale-[0.97] motion-reduce:transition-none motion-reduce:active:scale-100",
                applied?.label === a.label
                  ? "border-foreground bg-foreground text-background"
                  : "border-border hover:bg-secondary",
              )}
            >
              {a.label}
            </button>
          ))}
          <button
            type="button"
            onClick={clearCandidate}
            className="rounded-md border border-border px-2.5 py-1 text-xs transition-transform duration-150 ease-emphasis hover:bg-secondary active:scale-[0.97] motion-reduce:transition-none motion-reduce:active:scale-100"
          >
            Clear
          </button>
          {applied && <Tag tone="ours">Applied: {applied.label}</Tag>}
        </div>
        <ul className="mt-1 space-y-0.5">
          {APPLY.map((a) => (
            <li
              key={a.id}
              className="text-[11px] leading-snug text-muted-foreground"
            >
              <span className="font-medium text-foreground">{a.label}.</span>{" "}
              {a.note}
            </li>
          ))}
        </ul>
        {/* The walk is LINKS, not a sentence to retype. Each one carries the lab
            key, because the candidate block renders only where the tuner island
            mounts and that island needs it; each opens in a new tab so the board
            and the applied block both stay where they are. */}
        <div className="mt-1 flex flex-wrap items-baseline gap-x-2 gap-y-1">
          <Caption className="text-[11px]">Walk it on</Caption>
          {WALK.map((p) => (
            <a
              key={p}
              href={walkHref(p)}
              target="_blank"
              rel="noreferrer"
              className="rounded border border-border px-1.5 py-0.5 text-[11px] transition-colors duration-150 hover:bg-secondary"
            >
              {p}
            </a>
          ))}
          <Caption className="text-[11px]">
            in a new tab. The footer and the nav carry a frame on every one of
            them, so the argument is there before a scroll.
          </Caption>
        </div>
        <Caption className="text-[10px]">
          Not the app, and not a guest link: no marketing still is referenced
          anywhere under the dashboard, the event page, the admin portal or{" "}
          {"/e/[qr_token]"}, so a block changes nothing there and walking them
          proves nothing. Every surface this ruling touches is a marketing one.
        </Caption>
      </section>

      {/* THE EXPOSURE, MEASURED. */}
      <section id="mk-exposure" className="flex flex-col gap-3">
        <div>
          <h2 className="text-sm font-semibold">
            Where the twelve actually are
          </h2>
          <Caption className="mt-1">
            Production files per id, recomputed from the tree by
            exposure.test.ts so the numbers cannot go stale on the board. The
            bar is a share of the widest, which is {maxFiles} files.
          </Caption>
        </div>
        <div className="grid gap-6 rounded-lg border border-border bg-card p-4 sm:grid-cols-[minmax(0,22rem)_minmax(0,1fr)]">
          <ul className="space-y-1">
            {STAND_INS.map((s) => {
              const n = FILE_COUNTS[s.id] ?? 0;
              return (
                <li key={s.id} className="flex items-center gap-2">
                  <span className="w-28 shrink-0 text-[11px]">{s.id}</span>
                  <span className="h-2 flex-1 rounded-[1px] bg-muted">
                    <span
                      className="block h-2 rounded-[1px] bg-foreground"
                      style={{ width: `${(n / maxFiles) * 100}%` }}
                    />
                  </span>
                  <span className="w-6 text-right text-[11px] text-muted-foreground tabular-nums">
                    {n}
                  </span>
                </li>
              );
            })}
          </ul>
          <div className="space-y-2">
            {CHROME.map((c) => (
              <div key={c.file}>
                <p className="text-[11px] font-medium">{c.where}</p>
                <p className="text-[11px] leading-snug text-muted-foreground">
                  {c.ids.join(", ")}
                </p>
              </div>
            ))}
            <div>
              <p className="text-[11px] font-medium">
                {ROUTES.length} routes reach a still
              </p>
              <p className="text-[11px] leading-snug text-muted-foreground">
                {ROUTES.join("  ")}
              </p>
            </div>
            {/* Round two wrote "wedding-golden is the widest" by hand and it was
                simply not true of either column: party-balloons leads on files
                and reception-hall on covers. Both ends are derived now. */}
            <Caption className="text-[10px]">
              {widest.id} is the widest: {liveExposure(widest.id)}. The
              narrowest, {narrowest.id}, is still {FILE_COUNTS[narrowest.id]}{" "}
              files and the footer of every page. Reach, rather than count,
              belongs to reception-table: it is the only id in both the footer
              and the nav, so it is on all {MARKETING_PAGES} marketing pages
              twice.
            </Caption>
          </div>
        </div>
      </section>

      {/* THE GAP, by vertical. */}
      <section id="mk-gap" className="flex flex-col gap-3">
        <div>
          <h2 className="text-sm font-semibold">The gap, by vertical</h2>
          <Caption className="mt-1">
            Six frames per vertical is the kit. Three of the six verticals the
            product sells to have nothing at all, which is what a person picking
            covers out of eleven frames has to work with.
          </Caption>
        </div>
        <ul className="grid gap-x-6 gap-y-1.5 rounded-lg border border-border bg-card p-4 sm:grid-cols-2">
          {VERTICALS.map((v) => {
            const have = countByVertical(v.id);
            return (
              <li key={v.id} className="flex items-center gap-2">
                <span className="w-24 shrink-0 text-[11px] text-muted-foreground">
                  {v.label}
                </span>
                <span className="flex h-2 flex-1 gap-px">
                  {Array.from({ length: Math.max(6, have) }, (_, i) => (
                    <span
                      key={i}
                      className={cn(
                        "flex-1 rounded-[1px]",
                        i >= 6
                          ? "bg-foreground/40"
                          : i < have
                            ? "bg-foreground"
                            : "bg-muted",
                      )}
                    />
                  ))}
                </span>
                <span className="w-5 text-right text-[11px] text-muted-foreground tabular-nums">
                  {have}
                </span>
              </li>
            );
          })}
        </ul>
      </section>

      {/* THE BRIDGE. The controls sit here because this is what they steer. */}
      <section id="mk-bridge" data-mk-sheet className="flex flex-col gap-4">
        <div>
          <h2 className="text-sm font-semibold">The bridge, post by post</h2>
          <Caption className="mt-1">
            All 23 posts, today above or beside what replaces it, at the real
            geometry of the surface it lands on. The share card is the one a
            stranger sees first and it ignores the crop ladder entirely. The two
            percentages under each plate are the cover&rsquo;s object-position:
            the rung of the crop ladder that slug sits on, which is how one
            photograph dresses six posts and is recognisable in all six.
          </Caption>
          <p className="mt-2 max-w-2xl text-xs leading-relaxed text-muted-foreground">
            The bridge is a per-post job, not a per-frame one. Every one of the
            23 posts sets its own <span className="font-medium">cover</span> in
            frontmatter and 22 of the 23 differ from what the fallback hash
            would give, so nobody hashed these: a person chose each one out of
            eleven wedding and festival frames, which is exactly why the
            conference post is a music festival. {POSTS_FILLED} of the 23 have a
            candidate below, {empty.length} are left empty on purpose, and{" "}
            {BARRED_POSTS.length} of the {POSTS_FILLED} are filled by a frame
            that ask 1 will not let ship.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Toggle
            ariaLabel="Route"
            options={ROUTE_OPTIONS}
            value={route}
            onChange={setRoute}
          />
          <Toggle
            ariaLabel="Geometry"
            options={[
              { id: "card" as const, label: "Card 4:5" },
              { id: "share" as const, label: "Share 1200x630" },
            ]}
            value={geometry}
            onChange={setGeometry}
          />
          <Toggle
            ariaLabel="Viewport"
            options={[
              { id: "desktop" as Mode, label: "Desktop" },
              { id: "phone" as Mode, label: "Phone 375" },
            ]}
            value={mode}
            onChange={setMode}
          />
          <Caption className="max-w-sm text-[11px]">
            {route === "licensed"
              ? `${POSTS_FILLED} of 23 filled, but ${POSTS_UNDER_RULE} of 23 under the rule: ${BARRED_POSTS.length} of them carry a face with no release. Fast, free, and still somebody else's party.`
              : route === "ours"
                ? "All 23 from the kit. Six verticals, 36 masters, and the squares, portraits, clips and film cut from the same night."
                : "Licensed on the details nobody studies, the shoot on everything a reader stops at. The bridge is dated: it ends when the kit lands."}
          </Caption>
        </div>

        {/* WHAT THE ROUTE SHIPS, which is the question round two asked twice.
            The bridge is not a separate ruling: the route decides how many frames
            change and when, so the consequence is a table rather than a word. */}
        <div className="overflow-x-auto rounded-lg border border-border bg-card">
          <table className="w-full min-w-[46rem] border-collapse text-left">
            <thead>
              <tr className="border-b border-border">
                {[
                  "Route",
                  "What ships",
                  "On the blog",
                  "Cost",
                  "How it ends",
                ].map((h) => (
                  <th key={h} className="px-3 py-2">
                    <Caption className="text-[10px]">{h}</Caption>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ROUTE_SHIPS.map((r) => (
                <tr
                  key={r.route}
                  className={cn(
                    "border-b border-border align-top last:border-b-0",
                    route === r.route && "bg-secondary/60",
                  )}
                >
                  <td className="px-3 py-2">
                    <span className="flex flex-wrap items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setRoute(r.route)}
                        className="text-[11px] font-medium underline decoration-border underline-offset-2 transition-colors duration-150 hover:decoration-foreground"
                      >
                        {r.label}
                      </button>
                      {!r.legal && <Tag tone="gap">Not shippable</Tag>}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-[11px] leading-snug text-muted-foreground">
                    {r.ships}
                  </td>
                  <td className="px-3 py-2 text-[11px] leading-snug text-muted-foreground tabular-nums">
                    {r.blog}
                  </td>
                  <td className="px-3 py-2 text-[11px] leading-snug text-muted-foreground">
                    {r.cost}
                  </td>
                  <td className="px-3 py-2 text-[11px] leading-snug text-muted-foreground">
                    {r.ends}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* WHERE THEY LAND, AT THE REAL SIZE ON THE REAL GROUND.
            ★ Both of those were wrong until round three walked the running blog
            and measured it: the library card is 320x400 with a 16 px gutter,
            three across at 1440, and /blog is in the (cinema) group, so it is a
            DARK page. This stage drew 440 px plates on paper. And it drew only
            the route's row, so at the default route (Mix, where all three of
            these posts go to the shoot) the board's largest element opened as
            three empty hatches. Today's row above the route's row fixes both: it
            is a comparison at every route, and it is never blank.

            The three posts are not a slice, they are the argument: two corporate
            posts and a conference post, wearing an empty wedding hall and two
            music festivals today, which is what choosing carefully out of eleven
            frames looks like. */}
        <Stage
          mode={mode}
          ground="cinema"
          height={
            geometry === "card"
              ? mode === "phone"
                ? 1040
                : 1000
              : mode === "phone"
                ? 560
                : 740
          }
        >
          <div
            className={cn(
              "flex h-full flex-col justify-center",
              mode === "phone" ? "gap-4 px-4 py-4" : "gap-5 py-6",
            )}
          >
            {(
              [
                ["On the blog today", "today"],
                [
                  route === "licensed"
                    ? "Licensed, the staged batch"
                    : route === "ours"
                      ? "Ours, the shot that replaces it"
                      : "Mix, the recommendation",
                  "next",
                ],
              ] as const
            ).map(([label, which]) => (
              <div
                key={which}
                className={cn(
                  "flex flex-col gap-2",
                  mode === "phone" ? "" : "mx-auto w-[992px]",
                )}
              >
                <Caption
                  className={mode === "phone" ? "text-[11px]" : "text-xs"}
                >
                  {label}
                </Caption>
                <div
                  className={cn(
                    "grid gap-4",
                    mode === "phone"
                      ? "grid-cols-1"
                      : geometry === "card"
                        ? "grid-cols-3"
                        : "grid-cols-2",
                  )}
                >
                  {STAGE_POSTS.slice(
                    0,
                    mode === "phone" ? 1 : geometry === "card" ? 3 : 2,
                  ).map((p) => {
                    const next = whatReplaces(p, route);
                    const current = MANIFEST_BY_ID.get(p.cover);
                    const src =
                      which === "today"
                        ? (current?.src ?? null)
                        : next.kind === "licensed" && next.key
                          ? candidateSrc(next.key)
                          : null;
                    const slate =
                      which === "today"
                        ? undefined
                        : next.kind === "ours"
                          ? `To be shot, ${master(p.shot).code}: ${master(p.shot).subject}`
                          : p.why;
                    // The provenance line belongs UNDER the plate, never on it:
                    // the plate is the real card and the annotation is board
                    // chrome, and the whole point of this section is that the
                    // two are not the same thing.
                    const licensed =
                      which === "next" && next.kind === "licensed" && next.key
                        ? candidate(next.key)
                        : null;
                    const note =
                      which === "today" ? (
                        <>
                          {p.cover} at {p.crop}, license unverified
                        </>
                      ) : licensed ? (
                        <span className="inline-flex flex-wrap items-center gap-1">
                          <Tag tone="named">CC0 1.0</Tag>
                          {licensed.people === "identifiable" ? (
                            <Tag tone="face">A face, no release</Tag>
                          ) : (
                            <span>{licensed.author}, Wikimedia Commons</span>
                          )}
                        </span>
                      ) : null;
                    return (
                      <div key={p.slug} className="flex flex-col gap-1.5">
                        {geometry === "card" ? (
                          <CardPlate
                            full
                            src={src}
                            title={p.title}
                            crop={which === "today" ? p.crop : "50% 50%"}
                            slate={slate}
                          />
                        ) : (
                          <SharePlateStage
                            src={src}
                            title={p.title}
                            next={next}
                            which={which}
                            shot={p.shot}
                          />
                        )}
                        <p className="min-h-4 text-[11px] leading-snug text-muted-foreground tabular-nums">
                          {note}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </Stage>
        <Caption className="text-[10px]">
          Measured on the running blog at 1440: the library card is 320 by 400
          with a 16 px gutter, three across, on the cinema ground. The plate
          draws the cover, the scrim, the title and the byline; the real card
          also carries up to two tag chips in the top left, which this board
          holds no data for and will not invent.
        </Caption>

        <div
          className={cn(
            "grid gap-x-5 gap-y-7",
            // Three across at most: at four, a 4:5 plate lands at 110 px, which
            // is too small to judge a photograph on, and judging the photograph
            // is the entire job of this sheet.
            geometry === "card"
              ? "grid-cols-1 sm:grid-cols-2 xl:grid-cols-3"
              : "grid-cols-1 lg:grid-cols-2",
          )}
        >
          {BRIDGE.map((p, i) => (
            <PostRow
              key={p.slug}
              post={p}
              route={route}
              geometry={geometry}
              index={i}
            />
          ))}
        </div>

        <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-4">
          <Caption className="font-medium text-foreground">
            The two that stay empty, and what that means
          </Caption>
          <ul className="mt-2 space-y-1.5">
            {empty.map((p) => (
              <li key={p.slug} className="text-[11px] leading-snug">
                <span className="font-medium">/blog/{p.slug}</span>
                <span className="text-muted-foreground"> {p.why}</span>
              </li>
            ))}
          </ul>
          <Caption className="mt-2 text-[10px]">
            Both are the corporate and conference end of the product, which is
            the half of the business a licensed corpus cannot dress at all.
            Trips it covers perfectly, because travel is what photographers give
            away.
          </Caption>
          <ul className="mt-3 space-y-1.5 border-t border-destructive/30 pt-3">
            <li className="text-[11px] leading-snug">
              <span className="font-medium">
                And {BARRED_POSTS.length} more are filled by a frame ask 1 bars.
              </span>{" "}
              <span className="text-muted-foreground">
                {BARRED_POSTS.map((p) => `/blog/${p.slug}`).join(", ")}. Each
                one carries a readable face and no release, so the honest count
                for Licensed is {POSTS_UNDER_RULE} of 23, and for the twelve ids
                it is {IDS_UNDER_RULE} of {IDS_TOTAL}:{" "}
                {BARRED_IDS.join(" and ")}, the dance floor and the DJ, which
                are the two frames a product about parties needs most.
              </span>
            </li>
          </ul>
        </div>
      </section>

      {/* THE CALL SHEET. */}
      <section id="mk-kit" className="flex flex-col gap-3">
        <div>
          <h2 className="text-sm font-semibold">The kit, as a call sheet</h2>
          <Caption className="mt-1">
            36 masters, six per vertical. Each one names what happens in the
            frame, where the camera is, what the light is doing, and the crops
            it has to survive, so it can be shot from rather than argued with.
            Four are the palette board&rsquo;s hard cases and three are the
            phone-up frames every round-three hero variation wants.
          </Caption>
        </div>
        {VERTICALS.map((v) => (
          <div key={v.id}>
            <div className="mb-2 flex items-baseline gap-2 border-b border-border pb-1.5">
              <h3 className="text-xs font-semibold">{v.label}</h3>
              <Caption className="text-[11px] tabular-nums">
                {MASTERS.filter((m) => m.vertical === v.id).length} frames,{" "}
                {countByVertical(v.id)} in the manifest today
              </Caption>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {MASTERS.filter((m) => m.vertical === v.id).map((m) => (
                <div
                  key={m.code}
                  className="flex flex-col rounded-lg border border-border p-3"
                >
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="rounded bg-foreground px-1.5 py-px text-[10px] font-medium text-background tabular-nums">
                      {m.code}
                    </span>
                    <Tag tone="named">{m.orientation}</Tag>
                    {m.hardCase && <Tag tone="ours">{m.hardCase}</Tag>}
                    {m.phoneUp && <Tag tone="ours">phone up</Tag>}
                  </div>
                  <p className="mt-1.5 text-[11px] leading-snug font-medium">
                    {m.subject}
                  </p>
                  <dl className="mt-1.5 space-y-1">
                    <div>
                      <dt className="sr-only">Framing</dt>
                      <dd className="text-[11px] leading-snug text-muted-foreground">
                        <span className="font-medium text-foreground">
                          Frame.
                        </span>{" "}
                        {m.framing}
                      </dd>
                    </div>
                    <div>
                      <dt className="sr-only">Light</dt>
                      <dd className="text-[11px] leading-snug text-muted-foreground">
                        <span className="font-medium text-foreground">
                          Light.
                        </span>{" "}
                        {m.light}
                      </dd>
                    </div>
                  </dl>
                  <p className="mt-1.5 text-[10px] leading-snug text-muted-foreground">
                    Survives: {m.crops.join("; ")}
                  </p>
                  <p className="mt-1 text-[10px] leading-snug">
                    {m.replaces.length ? (
                      <>
                        Replaces{" "}
                        <span className="font-medium">
                          {m.replaces.join(", ")}
                        </span>
                      </>
                    ) : (
                      <span className="text-muted-foreground">
                        New ground: nothing in the manifest does this job
                      </span>
                    )}
                  </p>
                </div>
              ))}
            </div>
          </div>
        ))}

        {/* ONE NIGHT, NINE ROWS. Round two listed four derived rows because it
            had read four manifests. Reading the whole asset log end to end is
            what turned the kit from the most expensive ask on the list into the
            one that closes most of it. */}
        <div className="mt-2 flex flex-col gap-3">
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <h3 className="text-sm font-semibold">
              One night, {DERIVED.length} rows of the asset log
            </h3>
            <Caption className="text-[11px]">
              The log holds {DERIVED.length + NOT_DERIVED.length} rows. Three
              are not photography (the ruling, the shoot itself and a noise
              tile). The other {DERIVED.length} are crops, recrops, cuts or
              setups of the same night, so the kit is not the most expensive ask
              on the list, it is the one that closes the list.
            </Caption>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {DERIVED.map((d) => (
              <div
                key={d.row}
                className="rounded-lg border border-border bg-card p-3"
              >
                <div className="flex flex-wrap items-baseline gap-2">
                  <span className="rounded bg-foreground px-1.5 py-px text-[10px] font-medium text-background tabular-nums">
                    Row {d.row}
                  </span>
                  <span className="text-xs font-medium">{d.what}</span>
                  <Caption className="text-[10px]">{d.askedBy}</Caption>
                </div>
                <p className="mt-1.5 text-[11px] leading-snug text-muted-foreground">
                  {d.spec}
                </p>
                <p className="mt-1 text-[11px] leading-snug">
                  <span className="font-medium">From.</span> {d.from}
                </p>
                <p className="mt-1 text-[10px] leading-snug text-muted-foreground">
                  Replaces {d.replaces}
                </p>
              </div>
            ))}
          </div>
          <ul className="flex flex-wrap gap-x-5 gap-y-1">
            {NOT_DERIVED.map((n) => (
              <li
                key={n.row}
                className="text-[10px] leading-snug text-muted-foreground"
              >
                <span className="font-medium text-foreground tabular-nums">
                  Row {n.row}
                </span>{" "}
                {n.what}, not from the shoot: {n.why}
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-lg border border-border bg-card p-4">
          <Caption className="font-medium text-foreground">
            What a frame must survive, and the surface that decides it
          </Caption>
          <ul className="mt-2 space-y-1.5">
            {KIT_CONSTRAINTS.map((c, i) => (
              <li key={i} className="flex gap-2 text-[11px] leading-snug">
                <span className="w-3 shrink-0 text-right text-muted-foreground tabular-nums">
                  {i + 1}
                </span>
                <span>
                  <span className="font-medium">{c.rule}.</span>{" "}
                  <span className="text-muted-foreground">{c.because}.</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* THE RECORD. The schema prototyped, with a real row in it. */}
      <section id="mk-record" className="flex flex-col gap-3">
        <div>
          <h2 className="text-sm font-semibold">The record, prototyped</h2>
          <Caption className="mt-1">
            The six fields the rule adds to a manifest entry, running on{" "}
            {CANDIDATES.length} staged records with provenance.test.ts refusing
            a record that is missing one. The rule is not a proposal on this
            board; it is a suite you can watch pass.
          </Caption>
        </div>
        <div className="grid gap-3 lg:grid-cols-2">
          <div className="rounded-lg border border-border bg-card p-4">
            <Caption className="font-medium text-foreground">
              One record, as the test reads it
            </Caption>
            <dl className="mt-2 space-y-1">
              {(
                [
                  ["author", candidate("bridge-dancefloor").author],
                  ["sourceUrl", candidate("bridge-dancefloor").sourceUrl],
                  ["license", "CC0 1.0"],
                  [
                    "clause",
                    "You can copy, modify, distribute and perform the work, even for commercial purposes, all without asking permission.",
                  ],
                  ["retrieved", "2026-09-14"],
                  ["people", candidate("bridge-dancefloor").people],
                ] as const
              ).map(([field, value]) => (
                <div
                  key={field}
                  className="grid grid-cols-[5.5rem_minmax(0,1fr)] gap-2"
                >
                  <dt className="text-[11px] font-medium tabular-nums">
                    {field}
                  </dt>
                  <dd className="text-[11px] leading-snug break-words text-muted-foreground">
                    {value}
                  </dd>
                </div>
              ))}
            </dl>
            <p className="mt-2 text-[11px] leading-snug text-muted-foreground">
              <span className="font-medium text-foreground">people</span> is the
              field that does the work. No free tier supplies a model release,
              so an entry reading identifiable cannot sit on a page that makes a
              claim, and the test refuses one without a caution on it.
            </p>
          </div>
          <div className="rounded-lg border border-border bg-card p-4">
            <Caption className="font-medium text-foreground">
              What the suite asserts today
            </Caption>
            <ul className="mt-2 space-y-1">
              {[
                "Every staged file exists, is under 300 KB and is 1200 px on the long edge.",
                "Nothing sits in the directory without a record, and no record without a file.",
                "candidates.ts and provenance.json agree field by field, so the two copies cannot drift.",
                "Every record carries all six required fields, and the license clause is quoted rather than named.",
                "Every file predates 5 June 2017, which is the entire basis of the batch being CC0 at all.",
                "A frame with an identifiable face carries a caution, without exception.",
                "Every staged frame is used by the bridge, so nothing is staged and forgotten.",
              ].map((line, i) => (
                <li
                  key={i}
                  className="flex gap-2 text-[11px] leading-snug text-muted-foreground"
                >
                  <span className="w-3 shrink-0 text-right tabular-nums">
                    {i + 1}
                  </span>
                  <span>{line}</span>
                </li>
              ))}
            </ul>
            <p className="mt-2 text-[11px] leading-snug">
              Two more suites keep the board honest: exposure.test.ts recomputes
              every number above from the tree, and bridge.test.ts recomputes
              each post&rsquo;s cover and crop from the real resolver.
            </p>
          </div>
        </div>
      </section>

      {/* THE RUNBOOK. */}
      <section id="mk-runbook" className="flex flex-col gap-3">
        <div>
          <h2 className="text-sm font-semibold">
            Re-rendering the two recorded reels
          </h2>
          <Caption className="mt-1">
            A media swap invalidates both recorded loops, and the engine encodes
            in a browser, so this is a person at a machine with Chrome. It is
            not, however, a code edit: both recipes are already in the parity
            page&rsquo;s own clip-set picker, in order, and runbook.test.ts
            keeps that true.
          </Caption>
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          {REELS.map((r) => (
            <div key={r.id} className="rounded-lg border border-border p-3">
              <p className="text-xs font-medium">{r.id}</p>
              <Caption className="mt-0.5 text-[11px] tabular-nums">
                {r.orientation}, {r.durationSeconds.toFixed(2)} s, style{" "}
                {r.recipe.styleId}, seed {r.recipe.seed},{" "}
                {r.recipe.clipIds.length} clips
              </Caption>
              <ol className="mt-2 space-y-1.5">
                {runbookFor(r.id).map((s) => (
                  <li key={s.n} className="flex gap-2">
                    <span className="w-3 shrink-0 text-right text-[11px] text-muted-foreground tabular-nums">
                      {s.n}
                    </span>
                    <span className="text-[11px] leading-snug">
                      <span className="font-medium">{s.do}.</span>{" "}
                      <span className="text-muted-foreground">{s.detail}</span>
                      {s.friction && (
                        <span className="mt-0.5 block rounded border border-border bg-muted/50 px-1.5 py-1 text-[10px] leading-snug text-muted-foreground">
                          Friction: {s.friction}
                        </span>
                      )}
                    </span>
                  </li>
                ))}
              </ol>
              <Caption className="mt-2 text-[10px]">
                Clips: {r.recipe.clipIds.join(", ")}. Every one of them is a
                stand-in, so the swap invalidates this recording.
              </Caption>
            </div>
          ))}
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <Caption className="font-medium text-foreground">
            What the wiring round adds, in the order it bites
          </Caption>
          <ul className="mt-2 space-y-1">
            {WIRING_ADDS.map((line, i) => (
              <li
                key={i}
                className="flex gap-2 text-[11px] leading-snug text-muted-foreground"
              >
                <span className="w-3 shrink-0 text-right tabular-nums">
                  {i + 1}
                </span>
                <span>{line}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* THE SOURCES, condensed. The full survey is the spec. */}
      <section id="mk-sources" className="flex flex-col gap-3">
        <div>
          <h2 className="text-sm font-semibold">
            The sources, clause by clause
          </h2>
          <Caption className="mt-1">
            Quoted from each license page on the date recorded. What each also
            forbids, and why the four refusals fail us, are in
            docs/specs/media-kit.md section 4.
          </Caption>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {SOURCES.map((s) => (
            <div
              key={s.name}
              className={cn(
                "rounded-lg border p-3",
                s.verdict === "allowed"
                  ? "border-border"
                  : "border-destructive/40 bg-destructive/5",
              )}
            >
              <div className="flex items-baseline justify-between gap-2">
                <p className="text-xs font-medium">{s.name}</p>
                <Tag tone={s.verdict === "allowed" ? "named" : "gap"}>
                  {s.verdict === "allowed" ? "Allowed" : "Not allowed"}
                </Tag>
              </div>
              <p className="mt-1.5 text-[11px] leading-snug italic">
                &ldquo;{s.clause}&rdquo;
              </p>
              <Caption className="mt-1.5 text-[10px]">
                {s.url}, read {s.retrieved}
              </Caption>
            </div>
          ))}
        </div>
      </section>

      <BoardMeta
        question={QUESTION}
        /* Recommendation first, and the one that no longer survives its own
           column last, with the reason on it rather than in a footnote. */
        candidates={[
          {
            name: "Mix, the recommendation",
            rationale:
              "Ours on every frame a reader stops at (the hero, the reel clips, the four posts riding one empty hall), licensed on the two details that are furniture. It is the only route that changes anything the week it is chosen AND ships nothing the rule forbids. The bridge is dated: it is deleted the day the kit lands, not left because it still looks fine.",
          },
          {
            name: "Ours",
            rationale:
              "36 masters across six verticals, shot in one night at an event we host with releases at the door, and the squares, the portraits, the clips, the film, the cutout and the demo seed cut from the same footage. The rule taken literally, the only route that makes the product's own claim true, and the route that closes nine of the twelve rows in the asset log.",
          },
          {
            name: "Licensed, on the board to be walked rather than chosen",
            rationale: `The staged batch, ${CANDIDATES.length} frames, all CC0, none of Will's time. It satisfies the letter of bible 18 without its point: ${CANDIDATES.length - IDENTIFIABLE.length} of the ${CANDIDATES.length} work only because nobody in them is recognisable, and the ${IDENTIFIABLE.length} worth having need a release nobody holds. Under ask 1 it fills ${IDS_UNDER_RULE} of the ${IDS_TOTAL} ids and ${POSTS_UNDER_RULE} of the 23 posts, the two it misses are the dance floor and the DJ, and it has nothing at all for the corporate and conference half of the business. Apply it and walk /blog: the walk is the argument against it.`,
          },
        ]}
        asks={ASKS.map(
          (a) =>
            `${a.question} Options: ${a.options.join(" or ")}. This board recommends ${a.recommend}.`,
        )}
        departures={DEPARTURES}
        assets={ASSETS}
      />
    </div>
  );
}
