"use client";

// the board's own sheet; it leaves with the board when the ruling lands.
import "./board.css";

import Image from "next/image";
import { useState, type CSSProperties } from "react";

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

import {
  BRIDGE_CSS,
  EXPOSURE_CSS,
  MIX_CSS,
  SHOOT_CSS,
  WALK,
} from "./apply";
import { BRIDGE, type BridgePost } from "./bridge";
import { candidate, candidateSrc, CANDIDATES, IDENTIFIABLE } from "./candidates";
import {
  CHROME,
  FILE_COUNTS,
  liveExposure,
  MARKETING_PAGES,
  PRODUCTION_FILES,
  ROUTES,
} from "./exposure";
import { countByVertical, MANIFEST_BY_ID, REELS, type Route, STAND_INS, VERTICALS } from "./kit";
import { runbookFor, WIRING_ADDS } from "./runbook";
import { DERIVED, KIT_CONSTRAINTS, master, MASTERS } from "./shoot";
import { SOURCES } from "./sources";

/**
 * THE MEDIA-KIT BOARD, ROUND TWO (2026-09-14).
 *
 * Round one surveyed the licenses and found the thing that settles the round:
 * Unsplash's terms exclude recognisable people, so the twelve stills were never
 * covered by the license they claim. That argument holds and is now the header.
 * This round turns the survey into the two things a ruling can be made on.
 *
 * WHAT CHANGED, AND WHY EACH CHANGE IS HERE:
 *
 *  1. The exposure was understated. Round one counted the blog. The twelve are in
 *     40 production files, 22 routes, and the footer and nav of every marketing
 *     page. "Apply to the site" now hands the running site a block that outlines
 *     and drains every frame we cannot name, so the walk IS the argument.
 *  2. The bridge was argued per FRAME and belongs per POST. Every one of the 23
 *     posts carries an explicit `cover:`; the fallback pool never fires. Nobody
 *     hashed those covers. A person picked each one out of eleven frames, which
 *     is why the conference post is a music festival.
 *  3. The second, harder search closed all four holes. That MOVES the argument
 *     rather than winning it: the corpus can dress the site, and the four frames
 *     worth having are the four with a face in them, which is the four that need
 *     a release nobody holds.
 *  4. The kit is a call sheet now, not a shot list: framing, light and the crops
 *     each frame has to survive, so it can be shot from rather than argued with.
 *  5. The runbook said a re-render needed a code edit. It does not; both recipes
 *     are in the parity page's own picker, and a test keeps that true.
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

const ASKS = [
  "The rule, yes or no: author, source, license clause, retrieval date and a people field required on every manifest entry, and a recognisable face may not ship without a release (spec 1.2 and 1.4).",
  "The allowed list, yes or strike one: CC0, Pexels, Pixabay, Mixkit and Coverr in, Unsplash and CC BY out.",
  "The route, one word: Licensed, Ours or Mix. The recommendation is Mix.",
  "The bridge, ship or hold: 23 posts recovered by hand, 21 filled and 2 left empty on purpose.",
  "The kit, shoot or park: 36 masters, six per vertical, with the squares, the portraits, the clips and the film cut from the same night.",
];

const DEPARTURES = [
  "Bible 18 says no stock on a marketing surface, and the rule is already broken in production on a larger scale than round one reported: the twelve are in 40 production files and 22 routes, and four of them are in the footer of every marketing page. That is the only reason the Licensed route exists at all.",
  "Round one's board said the blog covers were hashed out of a pool. They are not. All 23 posts set `cover:` in frontmatter and 22 of the 23 differ from what the hash would give, so every miscast cover was chosen by a person out of eleven wedding and festival frames. The correction is on the board because it changes what the fix is: 23 frontmatter lines, not twelve files.",
  "Round one said re-rendering a recorded reel needs a code edit in the parity page. It does not: both recipes are already in that page's clip-set picker, in order. runbook.test.ts pins it.",
  "The perfect version of this system is neither licensed nor generated: it is one real event, hosted and shot with releases signed at the door, which is the only sourcing that makes the product's own claim literally true. It sits inside the Ours route rather than as a fourth column.",
];

const ASSETS = [
  "36 event photographs, six per vertical (weddings, birthdays, corporate, conferences, festivals, trips), 1600 px long edge, a third portrait, one dark warm grade, the call sheet on this board (codes W1 to T6). Four of the 36 are the palette board's hard cases (W5 high key, W3 low key, W2 candle warm, S4 stage cool) and three show a guest holding a phone up (K3, S3, T4). Replaces all twelve stand-ins by id.",
  "24 squares at 512x512, 6 to 35 KB webp, crops of the 24 masters marked 512 square rather than a second shoot. Replaces FRAMES in sandbox/home-hero/shared.tsx (ASSETS row 2).",
  "8 portrait crops at 512x640 and 12 portraits at 720x900, recrops of the same masters, for the burst's tall third and the river's stream (ASSETS rows 9 and 12).",
  "A hand-and-phone cutout, PNG with alpha, 1200 px long edge, the screen area transparent, two grips. The ONE item on the list that is a separate setup: shoot it at the same event, against the darkest wall, in the same low warm light as K3 (ASSETS row 8).",
  "8 vertical clips, 3 to 5 s, 1080x1920, silent, each with its own poster, filmed at the same events, and the film cut from that footage (ASSETS rows 4 and 1).",
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
        tone === "empty" && "border border-dashed border-border text-muted-foreground",
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
 *  Link that would navigate out of the lab and it cannot swap its own source. */
function CardPlate({
  src,
  title,
  crop,
  slate,
}: {
  src: string | null;
  title: string;
  crop: string;
  slate?: string;
}) {
  return (
    <div className="relative aspect-4/5 overflow-hidden bg-muted">
      {src ? (
        <Image
          src={src}
          alt=""
          fill
          sizes="(max-width: 640px) 45vw, 220px"
          className="object-cover"
          style={{ objectPosition: crop }}
        />
      ) : (
        <div className="absolute inset-0 grid place-items-center bg-[repeating-linear-gradient(135deg,transparent,transparent_7px,var(--border)_7px,var(--border)_8px)] p-3 text-center">
          <Caption className="text-[10px] leading-snug">
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
          <span className="absolute inset-x-0 bottom-0 p-3">
            <span className="line-clamp-2 font-heading text-[13px] leading-tight text-balance text-white">
              {title}
            </span>
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
        <Image src={src} alt="" fill sizes="(max-width: 640px) 92vw, 420px" className="object-cover" />
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
          style={{ fontSize: cq(58), lineHeight: 1.08, letterSpacing: "-0.02em" }}
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

/* --------------------------------------------------------------------------
   The bridge, post by post.
   -------------------------------------------------------------------------- */

function whatReplaces(post: BridgePost, route: Route) {
  // ★ The shoot's frame comes from the POST's vertical (bridge.ts `shot`), never
  // from the cover it carries today. Inheriting today's id would hand the
  // conference post a festival frame again, in the route that exists to end
  // exactly that.
  const shot = { kind: "ours" as const, master: master(post.shot) };
  if (route === "ours") return shot;
  if (route === "licensed") return { kind: "licensed" as const, key: post.candidate };
  // Mix: licensed only where the photograph is furniture, which on the blog is
  // the two details nobody studies; everything else goes to the shoot.
  const furniture =
    post.candidate === "wedding-rings" || post.candidate === "wedding-arch";
  return furniture ? { kind: "licensed" as const, key: post.candidate } : shot;
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

const APPLY: { id: string; label: string; css: string; note: string }[] = [
  {
    id: "mk-exposure",
    label: "The exposure",
    css: EXPOSURE_CSS,
    note: "Every frame with no provenance, outlined and drained. Media is the colour, so this is the site with everything we do not own taken out of it.",
  },
  {
    id: "mk-licensed",
    label: "Licensed",
    css: BRIDGE_CSS,
    note: "The staged CC0 batch swapped in by id, everywhere the twelve appear.",
  },
  {
    id: "mk-ours",
    label: "Ours",
    css: SHOOT_CSS,
    note: "Every frame replaced by the slate of the shot that replaces it. This is the site saying what the shoot costs, page by page.",
  },
  {
    id: "mk-mix",
    label: "Mix",
    css: MIX_CSS,
    note: "The recommendation: licensed on the two details, the slate on the ten that carry the argument.",
  },
];

export function MediaKitBoard() {
  const [route, setRoute] = useState<Route>("mix");
  const [geometry, setGeometry] = useState<"card" | "share">("card");
  const [mode, setMode] = useState<Mode>("desktop");
  const applied = useTunerCandidate();

  const filled = BRIDGE.filter((p) => p.candidate).length;
  const empty = BRIDGE.filter((p) => !p.candidate);
  const stagedTwo = CANDIDATES.filter((c) => c.staged === 2).length;

  return (
    <div className="flex flex-col gap-10 py-4">
      <div className="max-w-2xl space-y-3 text-xs leading-relaxed text-muted-foreground">
        <p>
          All twelve stills in the manifest carry one line, &ldquo;unsplash (per
          lab-pack comment; provenance unverified)&rdquo;, with no author, no
          source and no retrieval date. Reading the license settles it faster than
          a provenance hunt would: Unsplash&rsquo;s terms say the license
          &ldquo;does not include the right to use ... People&rsquo;s images if
          they are recognizable in the Images&rdquo;, and all twelve are full of
          recognisable people. Even in the best case the license never covered the
          thing that makes them worth having. Not a filing problem. A sourcing
          problem.
        </p>
        <p>
          Round one measured the blast radius as the blog. It is the site. The
          twelve are referenced in {PRODUCTION_FILES} production files across{" "}
          {ROUTES.length} routes, and four of them sit in the footer strip and two
          in the nav panel, both of which live in the group layouts, so they are on
          all {MARKETING_PAGES}{" "}marketing pages before a reader scrolls. Apply
          &ldquo;The exposure&rdquo; below and walk the site to see it.
        </p>
        <p>
          The second, harder search closed all four holes round one could not
          fill: searching by the scene rather than by the words on a manifest
          entry found a dance floor, a table with people at it, real balloons and a
          portrait: {stagedTwo} more frames, {CANDIDATES.length} staged in all.
          That moves the argument rather than winning it. Of the{" "}
          {CANDIDATES.length} staged frames,{" "}
          {CANDIDATES.length - IDENTIFIABLE.length} work only because nobody in
          them is recognisable, and the {IDENTIFIABLE.length} with a face are the{" "}
          {IDENTIFIABLE.length} that need a release nobody here holds. The frames
          worth anything to this product are the ones with faces in them.
        </p>
        <p>
          And the bridge is a per-post job, not a per-frame one. Every one of the
          23 posts sets its own <span className="font-medium">cover</span> in
          frontmatter and 22 of the 23 differ from what the fallback hash would
          give, so nobody hashed these: a person chose each one out of eleven
          wedding and festival frames, which is exactly why the conference post is
          a music festival. {filled} of the 23 have a candidate below and{" "}
          {empty.length} are left empty on purpose.
        </p>
      </div>

      {/* APPLY TO THE SITE. A photograph board's candidate is not a token block,
          so what it hands the site is the swap itself. */}
      <section className="flex flex-col gap-2 rounded-lg border border-border bg-card p-4">
        <div className="flex flex-wrap items-baseline gap-2">
          <h2 className="text-sm font-semibold">Apply to the site</h2>
          <Caption className="text-[11px]">
            One block at a time, on every lab page, every marketing page and the
            host app. Chrome and Safari only: a stylesheet replacing the content of
            an image is their behaviour, and Firefox simply shows today&rsquo;s
            frame.
          </Caption>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {APPLY.map((a) => (
            <button
              key={a.id}
              type="button"
              onClick={() => setCandidateCss(a.label, a.css)}
              className={cn(
                "rounded-md border px-2.5 py-1 text-xs font-medium transition-transform duration-150 ease-emphasis active:scale-[0.97]",
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
            className="rounded-md border border-border px-2.5 py-1 text-xs transition-transform duration-150 ease-emphasis active:scale-[0.97] hover:bg-secondary"
          >
            Clear
          </button>
          {applied && (
            <Tag tone="ours">Applied: {applied.label}</Tag>
          )}
        </div>
        <ul className="mt-1 space-y-0.5">
          {APPLY.map((a) => (
            <li key={a.id} className="text-[11px] leading-snug text-muted-foreground">
              <span className="font-medium text-foreground">{a.label}.</span>{" "}
              {a.note}
            </li>
          ))}
        </ul>
        <Caption className="mt-1 text-[11px]">
          Walk it on {WALK.join(", ")}. The footer and the nav carry a frame on
          every one of them.
        </Caption>
      </section>

      {/* THE EXPOSURE, MEASURED. */}
      <section className="flex flex-col gap-3">
        <div>
          <h2 className="text-sm font-semibold">Where the twelve actually are</h2>
          <Caption className="mt-1">
            Production files per id, recomputed from the tree by exposure.test.ts
            so the numbers cannot go stale on the board.
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
                      style={{ width: `${(n / 30) * 100}%` }}
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
            <Caption className="text-[10px]">
              {liveExposure("wedding-golden")} is the widest; the narrowest,
              festival-lights, is still {FILE_COUNTS["festival-lights"]} files and
              the footer of every page.
            </Caption>
          </div>
        </div>
      </section>

      {/* THE GAP, by vertical. */}
      <section className="flex flex-col gap-3">
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
      <section data-mk-sheet className="flex flex-col gap-4">
        <div>
          <h2 className="text-sm font-semibold">
            The bridge, post by post
          </h2>
          <Caption className="mt-1">
            All 23 posts, today above or beside what replaces it, at the real
            geometry of the surface it lands on. The share card is the one a
            stranger sees first and it ignores the crop ladder entirely.
          </Caption>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Toggle
            ariaLabel="Route"
            options={[
              { id: "licensed" as Route, label: "Licensed" },
              { id: "ours" as Route, label: "Ours" },
              { id: "mix" as Route, label: "Mix" },
            ]}
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
              ? `${filled} of 23 filled under a named license, ${empty.length} left empty. Fast, free, and still somebody else's party.`
              : route === "ours"
                ? "All 23 from the kit. Six verticals, 36 masters, and the squares, portraits, clips and film cut from the same night."
                : "Licensed on the details nobody studies, the shoot on everything a reader stops at. The bridge is dated: it ends when the kit lands."}
          </Caption>
        </div>

        {/* WHERE THEY LAND, at a real viewport on the paper ground the blog is. */}
        {/* Heights are sized to the PLATE, not to a viewport: a 4:5 card at a
            third of 1440 is 550 px tall, so a 560 stage clipped the bottom of
            every one of them (caught by walking the preview, not by the build). */}
        <Stage
          mode={mode}
          ground="paper"
          height={
            geometry === "card"
              ? mode === "phone"
                ? 540
                : 660
              : mode === "phone"
                ? 300
                : 380
          }
        >
          <div
            className={cn(
              "grid h-full items-center gap-[var(--gap-gallery)]",
              mode === "phone" ? "grid-cols-1 px-4 py-3" : "grid-cols-3 p-8",
            )}
          >
            {BRIDGE.slice(2, 5)
              .slice(0, mode === "phone" ? 1 : 3)
              .map((p) => {
                const next = whatReplaces(p, route);
                const src =
                  next.kind === "licensed" && next.key
                    ? candidateSrc(next.key)
                    : null;
                const current = MANIFEST_BY_ID.get(p.cover);
                return geometry === "card" ? (
                  <CardPlate
                    key={p.slug}
                    src={src ?? (next.kind === "ours" ? null : current?.src ?? null)}
                    title={p.title}
                    crop={p.crop}
                    slate={
                      next.kind === "ours"
                        ? `To be shot, ${master(p.shot).code}: ${master(p.shot).subject}`
                        : p.why
                    }
                  />
                ) : (
                  <SharePlate
                    key={p.slug}
                    src={src ?? (next.kind === "ours" ? null : current?.src ?? null)}
                    title={p.title}
                    slate={next.kind === "ours" ? "To be shot" : undefined}
                  />
                );
              })}
          </div>
        </Stage>

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
            Both are the corporate and conference end of the product, which is the
            half of the business a licensed corpus cannot dress at all. Trips it
            covers perfectly, because travel is what photographers give away.
          </Caption>
        </div>
      </section>

      {/* THE CALL SHEET. */}
      <section className="flex flex-col gap-3">
        <div>
          <h2 className="text-sm font-semibold">The kit, as a call sheet</h2>
          <Caption className="mt-1">
            36 masters, six per vertical. Each one names what happens in the frame,
            where the camera is, what the light is doing, and the crops it has to
            survive, so it can be shot from rather than argued with. Four are the
            palette board&rsquo;s hard cases and three are the phone-up frames every
            round-three hero variation wants.
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

        <div className="grid gap-3 sm:grid-cols-2">
          {DERIVED.map((d) => (
            <div key={d.row} className="rounded-lg border border-border bg-card p-3">
              <div className="flex items-baseline gap-2">
                <span className="text-xs font-medium">{d.what}</span>
                <Caption className="text-[10px] tabular-nums">
                  ASSETS row {d.row}, {d.askedBy}
                </Caption>
              </div>
              <p className="mt-1 text-[11px] leading-snug text-muted-foreground">
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
      <section className="flex flex-col gap-3">
        <div>
          <h2 className="text-sm font-semibold">The record, prototyped</h2>
          <Caption className="mt-1">
            The six fields the rule adds to a manifest entry, running on{" "}
            {CANDIDATES.length} staged records with provenance.test.ts refusing a
            record that is missing one. The rule is not a proposal on this board;
            it is a suite you can watch pass.
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
                <div key={field} className="grid grid-cols-[5.5rem_minmax(0,1fr)] gap-2">
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
              field that does the work. No free tier supplies a model release, so
              an entry reading identifiable cannot sit on a page that makes a
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
              every number above from the tree, and bridge.test.ts recomputes each
              post&rsquo;s cover and crop from the real resolver.
            </p>
          </div>
        </div>
      </section>

      {/* THE RUNBOOK. */}
      <section className="flex flex-col gap-3">
        <div>
          <h2 className="text-sm font-semibold">
            Re-rendering the two recorded reels
          </h2>
          <Caption className="mt-1">
            A media swap invalidates both recorded loops, and the engine encodes in
            a browser, so this is a person at a machine with Chrome. It is not,
            however, a code edit: both recipes are already in the parity
            page&rsquo;s own clip-set picker, in order, and runbook.test.ts keeps
            that true.
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
      <section className="flex flex-col gap-3">
        <div>
          <h2 className="text-sm font-semibold">The sources, clause by clause</h2>
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
        candidates={[
          {
            name: "Licensed",
            rationale: `The staged batch, ${CANDIDATES.length} frames, all CC0, none of Will's time. It dresses the whole site now and satisfies the letter of bible 18 without its point: ${CANDIDATES.length - IDENTIFIABLE.length} of the ${CANDIDATES.length} work only because nobody in them is recognisable, and it cannot dress a conference or an office party at all.`,
          },
          {
            name: "Ours",
            rationale:
              "36 masters across six verticals, shot in one or two nights with releases at the door, and the squares, portraits, clips and film cut from the same footage. The rule taken literally, and the only route that makes the product's own claim true.",
          },
          {
            name: "Mix",
            rationale:
              "Ours on every frame a reader stops at (the hero, the reel clips, the four posts riding one empty hall), licensed on the details that are furniture. The bridge is dated: it is deleted the day the kit lands, not left because it still looks fine.",
          },
        ]}
        asks={ASKS}
        departures={DEPARTURES}
        assets={ASSETS}
      />
    </div>
  );
}
