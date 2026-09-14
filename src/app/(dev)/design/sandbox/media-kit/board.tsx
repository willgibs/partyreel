"use client";

// the board's own sheet; it leaves with the board when the ruling lands.
import "./board.css";

import Image from "next/image";
import { useState, type CSSProperties } from "react";

import { BoardMeta, Stage, Toggle, type Mode } from "@/components/dev/board";
import { Caption } from "@/components/marketing/system/caption";
import { coverFor } from "@/lib/content/blog-covers";
import { cn } from "@/lib/utils";

import {
  KIT_CONSTRAINTS,
  liveExposure,
  MANIFEST_BY_ID,
  MISCAST,
  REELS,
  type Route,
  SHOT_LIST,
  STAND_INS,
  type StandIn,
  VERTICALS,
} from "./kit";
import { SOURCES } from "./sources";

/**
 * THE MEDIA-KIT BOARD (the review wave, 2026-09-14). A contact sheet: the twelve
 * stand-ins grouped by the vertical they serve, and under each one the frame that
 * would replace it under the route being argued. The provenance line under every
 * frame is the point of the board, so it is never hidden behind a hover.
 *
 * THE THREE ROUTES ARE NOT THREE SHADES OF ONE ANSWER (the wave's rule). Licensed
 * buys time and satisfies the letter of bible 18 without satisfying its point; Ours
 * is the rule taken literally and costs two shoots; Mix is the plan of record, and
 * the only one with a date on it. The sheet swaps in place, so all three are judged
 * on the same twelve positions.
 *
 * WHY THE SHEET IS BOARD CHROME AND ONLY THE PLATES ARE STAGED: a contact sheet is a
 * reviewing instrument and wants real pixels at the reader's own width, while "does
 * this frame survive where it actually lands" is a viewport question. So the sheet is
 * responsive and the Stage carries the one surface these frames are publicly on
 * today, the blog plate, at its production geometry and its real derived crop.
 *
 * Keyframes live in board.css under `mk-`. No mono face anywhere (bible 7 retiring):
 * data sits on the body face with tabular figures and every label is the Caption atom.
 */

const QUESTION =
  "No stock at launch and every frame ours or under a license we can name: which sources are allowed, what the kit Will makes himself looks like, and whether a candidate first batch replaces the twelve unverified stills.";

const ASKS = [
  "The rule as written: author, source and retrieval date REQUIRED on every manifest entry, and an entry missing them cannot ship (spec section 1).",
  "The allowed list: Pexels, Pixabay, Mixkit, Coverr and CC0 in, Unsplash out, each on the clause quoted above. Yes to the list, or strike a source.",
  "The route: Licensed, Ours, or Mix. The recommendation is Mix, with the frames marked ours in the sheet.",
  "The first batch, item by item: OK to stage as the bridge on the blog pool, or not at all.",
  "The kit: 36 masters, six per vertical, and the 24 squares, the 8 clips and the film derived from them rather than asked for separately.",
];

const DEPARTURES = [
  "Bible 18 says no stock on a marketing surface, and the blog covers are a marketing surface: eleven unverified frames are live on 23 posts, their OG cards and the RSS enclosures right now. The rule is already broken in production, which is the only reason the Licensed route exists at all.",
  "The perfect version of this system is neither licensed nor generated: it is one real event, shot, with releases, which is the only sourcing that makes the product's own claim literally true. It sits inside the Ours route rather than as a fourth column, and the spec recommends it.",
];

const ASSETS = [
  "36 event photographs, six per vertical (weddings, birthdays, corporate, conferences, festivals, trips), 1600 px long edge, a third portrait, one grade, the shot lists on this board. Replaces all twelve stand-ins and feeds the three hero asks.",
  "8 vertical clips, 3 to 5 s, 1080 x 1920, silent, each with its own poster at 1080 x 1920. Replaces the three currentTime ranges cut out of hero-candidate-01.",
  "24 square crops at 512 px, derived from the 36 rather than shot separately. Replaces the corridor's FRAMES.",
];

/* --------------------------------------------------------------------------
   The frame: one plate, its id, and its provenance under it. The provenance is
   what the whole round is about, so it is typeset as a fact, never a tooltip.
   -------------------------------------------------------------------------- */

function Provenance({
  tone,
  lines,
}: {
  tone: "gap" | "named" | "ours";
  lines: string[];
}) {
  return (
    <div className="mt-1.5 space-y-0.5">
      <span
        className={cn(
          "inline-flex items-center gap-1 rounded-full px-1.5 py-px text-[10px] font-medium",
          tone === "gap" && "bg-destructive/10 text-destructive",
          tone === "named" && "bg-muted text-muted-foreground",
          tone === "ours" && "bg-foreground text-background",
        )}
      >
        {tone === "gap"
          ? "Unverified"
          : tone === "named"
            ? "Named license"
            : "Ours"}
      </span>
      {lines.map((line, i) => (
        <p
          key={i}
          className="text-[10px] leading-snug text-muted-foreground tabular-nums"
        >
          {line}
        </p>
      ))}
    </div>
  );
}

function Plate({
  src,
  alt,
  className,
}: {
  src: string;
  alt: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "relative aspect-4/5 overflow-hidden rounded-[var(--radius-tile)] bg-muted",
        className,
      )}
    >
      <Image
        src={src}
        alt={alt}
        fill
        sizes="(max-width: 640px) 45vw, 220px"
        className="object-cover"
      />
    </div>
  );
}

/** One column of the contact sheet: what ships now, and what replaces it.
 *  The lower half is KEYED BY ROUTE so React remounts it on a switch, which is
 *  what re-fires the house develop beat: flipping the route develops the new
 *  answer in across the row rather than hard-cutting it. `column` is the index
 *  within the row, which is what the stagger reads. */
function SheetFrame({
  n,
  column,
  standIn,
  route,
}: {
  n: number;
  column: number;
  standIn: StandIn;
  route: Route;
}) {
  const current = MANIFEST_BY_ID.get(standIn.id);
  const effective =
    route === "mix" ? standIn.mix.route : (route as "licensed" | "ours");
  const licensed = standIn.licensed;

  if (!current) return null;

  return (
    <div className="flex flex-col">
      <Plate src={current.src} alt={current.subject} />
      <p className="mt-1.5 text-[11px] leading-tight font-medium">
        <span className="mr-1.5 inline-flex size-4 items-center justify-center rounded bg-muted text-[9px] tabular-nums">
          {n + 1}
        </span>
        {standIn.id}
      </p>
      <Provenance
        tone="gap"
        lines={[
          current.credit.license,
          `No author, no source, no date. Live: ${liveExposure(standIn.id).join("; ")}.`,
        ]}
      />

      <div
        aria-hidden
        className="my-2.5 h-px w-full bg-linear-to-r from-border via-border to-transparent"
      />

      <div
        key={effective}
        data-mkt-develop
        style={{ "--i": column } as CSSProperties}
      >
        {effective === "licensed" ? (
          licensed ? (
            <>
              <Plate
                src={`/design/media-kit/${licensed.file}`}
                alt={licensed.subject}
              />
              <p className="mt-1.5 text-[11px] leading-tight font-medium">
                {licensed.subject}
              </p>
              <Provenance
                tone="named"
                lines={[
                  `${licensed.author}, ${licensed.source}`,
                  `${licensed.license}, retrieved ${licensed.retrieved}`,
                ]}
              />
              {licensed.caution && (
                <p className="mt-1 rounded border border-destructive/30 bg-destructive/5 px-1.5 py-1 text-[10px] leading-snug text-destructive">
                  {licensed.caution}
                </p>
              )}
            </>
          ) : (
            <div className="flex aspect-4/5 items-center justify-center rounded-[var(--radius-tile)] border border-dashed border-border p-3 text-center">
              <Caption className="text-[10px] leading-snug">
                {standIn.noCandidate ??
                  "No candidate staged: nothing in the corpus was worth proposing."}
              </Caption>
            </div>
          )
        ) : (
          <div className="flex flex-col rounded-[var(--radius-tile)] border border-border bg-card p-3">
            <Caption className="text-[10px] font-medium text-foreground">
              The shot
            </Caption>
            <p className="mt-1 text-[11px] leading-snug">{standIn.ours}</p>
            <Provenance
              tone="ours"
              lines={[
                route === "mix"
                  ? `Mix sends this to the shoot: ${standIn.mix.why}.`
                  : "1600 px long edge, one grade, in the batch of 36.",
              ]}
            />
          </div>
        )}
      </div>
    </div>
  );
}

/* --------------------------------------------------------------------------
   The gap: the six verticals against what the manifest holds, and the seven
   posts whose cover comes from a vertical we do not own.
   -------------------------------------------------------------------------- */

function TheGap() {
  const counts = VERTICALS.map((v) => ({
    ...v,
    have: STAND_INS.filter((s) => s.vertical === v.id).length,
  }));

  return (
    <div className="grid gap-6 rounded-lg border border-border bg-card p-4 sm:grid-cols-[minmax(0,15rem)_minmax(0,1fr)]">
      <div>
        <Caption className="font-medium text-foreground">
          What the manifest holds, by vertical
        </Caption>
        <ul className="mt-2 space-y-1.5">
          {counts.map((c) => (
            <li key={c.id} className="flex items-center gap-2">
              <span className="w-20 shrink-0 text-[11px] text-muted-foreground">
                {c.label}
              </span>
              <span className="flex h-2 flex-1 gap-px">
                {Array.from({ length: 6 }, (_, i) => (
                  <span
                    key={i}
                    className={cn(
                      "flex-1 rounded-[1px]",
                      i < c.have ? "bg-foreground" : "bg-muted",
                    )}
                  />
                ))}
              </span>
              <span className="w-5 text-right text-[11px] text-muted-foreground tabular-nums">
                {c.have}
              </span>
            </li>
          ))}
        </ul>
        <Caption className="mt-2.5 text-[10px]">
          Six frames per vertical is the kit. Three of the six verticals the
          product sells to have nothing at all.
        </Caption>
      </div>

      <div>
        <Caption className="font-medium text-foreground">
          What that costs on the blog, today
        </Caption>
        <ul className="mt-2 space-y-1">
          {MISCAST.map((m) => (
            <li key={m.slug} className="text-[11px] leading-snug">
              <span className="font-medium">/blog/{m.slug}</span>
              <span className="text-muted-foreground">
                {" "}
                takes {m.cover}: {m.reads}.
              </span>
            </li>
          ))}
        </ul>
        <Caption className="mt-2.5 text-[10px]">
          Seven of 23 posts. Nobody chose these: blog-covers.ts hashes the slug
          into an eleven-frame pool, and the pool has no corporate, conference or
          trip frame to hash into.
        </Caption>
      </div>
    </div>
  );
}

/* --------------------------------------------------------------------------
   In place: the production blog plate, at its real geometry and its real
   slug-derived crop, on the paper ground the blog body actually is.
   -------------------------------------------------------------------------- */

/** Mirrors post-card.tsx (aspect-4/5, object-cover, the coverFor object-position,
 *  the bottom scrim, white type). Not the component itself: PostCard is a Link
 *  that would navigate out of the lab, and the board has to swap its source per
 *  route, which the production card rightly does not allow. */
function BlogPlate({
  slug,
  title,
  route,
}: {
  slug: string;
  title: string;
  route: Route;
}) {
  const cover = coverFor(slug);
  const standIn = STAND_INS.find((s) => s.id === cover.imageId);
  const effective =
    route === "mix" && standIn
      ? standIn.mix.route
      : (route as "licensed" | "ours");
  const replacement =
    effective === "licensed" && standIn?.licensed
      ? `/design/media-kit/${standIn.licensed.file}`
      : null;
  const toShoot = effective === "ours" ? standIn?.ours.split(". ")[0] : null;

  return (
    <div className="relative aspect-4/5 overflow-hidden bg-muted">
      <Image
        src={replacement ?? cover.src}
        alt=""
        fill
        sizes="(max-width: 640px) 92vw, 30vw"
        className="object-cover"
        style={{ objectPosition: cover.objectPosition }}
      />
      {toShoot && (
        <div className="absolute inset-0 flex items-start bg-black/55 p-4 backdrop-blur-[2px]">
          <p className="text-[11px] leading-snug text-white/90">
            To be shot: {toShoot}.
          </p>
        </div>
      )}
      <span
        aria-hidden
        className="absolute inset-0 bg-linear-to-t from-black/85 via-black/40 to-black/10"
      />
      <span className="absolute inset-x-0 bottom-0 flex flex-col gap-1.5 p-4 sm:p-5">
        <span className="line-clamp-2 font-heading text-base leading-tight text-balance text-white sm:text-lg">
          {title}
        </span>
        <span className="text-[11px] text-white/70 tabular-nums">
          {cover.imageId} at {cover.objectPosition}
        </span>
      </span>
    </div>
  );
}

const IN_PLACE: { slug: string; title: string }[] = [
  { slug: "company-offsite-photos", title: "Company offsite photos" },
  {
    slug: "conference-photo-sharing-no-app",
    title: "Conference photo sharing with no app",
  },
  {
    slug: "family-reunion-photo-sharing",
    title: "Family reunion photo sharing",
  },
];

/* -------------------------------------------------------------------------- */

export function MediaKitBoard() {
  const [route, setRoute] = useState<Route>("mix");
  const [mode, setMode] = useState<Mode>("desktop");

  const staged = STAND_INS.filter((s) => s.licensed).length;
  const oursInMix = STAND_INS.filter((s) => s.mix.route === "ours").length;

  return (
    <div className="flex flex-col gap-8 py-4">
      <div className="max-w-2xl space-y-3 text-xs leading-relaxed text-muted-foreground">
        <p>
          Bible 18 was written down at this wave: every frame is ours, no stock
          at launch. The twelve stills in the manifest all carry one line,
          &ldquo;unsplash (per lab-pack comment; provenance unverified)&rdquo;,
          with no author, no source and no retrieval date, and the lab pack they
          were copied from is gone from the tree. Eleven of them are live right
          now, across 23 blog posts, the OG cards those posts syndicate, and the
          RSS enclosures.
        </p>
        <p>
          Reading the license settles it faster than any provenance hunt would.
          Unsplash&rsquo;s terms say the license &ldquo;does not include the
          right to use ... People&rsquo;s images if they are recognizable in the
          Images&rdquo;. All twelve are full of recognizable people: a couple, a
          toast, a dance floor, a crowd. So even in the best case, where all
          twelve really are Unsplash and were taken in good faith, the license
          never covered the thing that makes them worth having. Not a filing
          problem. A sourcing problem.
        </p>
        <p>
          So the question is where the frames come from. Three routes: buy time
          with a batch under a license we can name, make the kit, or split them,
          which is the recommendation. The sheet swaps in place, so all three are
          judged on the same twelve positions with the provenance line under
          each.
        </p>
        <p>
          The staged batch is eight of twelve, all CC0, and the four holes are
          the more useful half of it: searching the best freely licensed corpus
          for party balloons returns hot air balloons, six out of six, and for a
          dance floor it returns a desert, an elderly couple and a rope on a
          stage. It lives under public/design/, which nothing scans and no
          marketing surface reads. A proposal, not a wiring: the stand-ins stay
          until a wiring round.
        </p>
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
            ? `${staged} of 12 staged under a named license. Fast, free, and still somebody else's party.`
            : route === "ours"
              ? "All twelve made. Six verticals, 36 masters; the squares, the clips and the film come out of the same take."
              : `${oursInMix} made, ${12 - oursInMix} licensed as a dated bridge. The bridge frames are the ones a reader never studies.`}
        </Caption>
      </div>

      <TheGap />

      {/* THE CONTACT SHEET, grouped by vertical so the holes are the argument. */}
      <section data-mk-sheet className="flex flex-col gap-6">
        <div>
          <h2 className="text-sm font-semibold">The contact sheet</h2>
          <Caption className="mt-1">
            Current above, replacement below, provenance under both, grouped by
            the vertical each frame serves.
          </Caption>
        </div>

        {VERTICALS.map((v) => {
          const rows = STAND_INS.filter((s) => s.vertical === v.id);
          return (
            <div key={v.id}>
              <div className="mb-2.5 flex items-baseline gap-2 border-b border-border pb-1.5">
                <h3 className="text-xs font-semibold">{v.label}</h3>
                <Caption className="text-[11px] tabular-nums">
                  {rows.length} of 6 in the manifest
                </Caption>
              </div>
              {rows.length ? (
                <div className="grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-3 lg:grid-cols-4">
                  {rows.map((s, i) => (
                    <SheetFrame
                      key={s.id}
                      n={STAND_INS.indexOf(s)}
                      column={i % 4}
                      standIn={s}
                      route={route}
                    />
                  ))}
                </div>
              ) : (
                <div className="rounded-lg border border-dashed border-border p-4">
                  <Caption className="text-[11px]">
                    Nothing at all. Six frames to make: {SHOT_LIST[v.id].join("; ")}.
                  </Caption>
                </div>
              )}
            </div>
          );
        })}
      </section>

      {/* WHERE THEY ACTUALLY LAND. The stage is the paper ground the blog body
          is, at a real viewport, with the production crop from coverFor. */}
      <section className="flex flex-col gap-3">
        <div>
          <h2 className="text-sm font-semibold">In place</h2>
          <Caption className="mt-1">
            The blog plate at its production geometry on the paper ground, with
            the crop blog-covers.ts derives from the slug. Three of the seven
            miscast posts.
          </Caption>
        </div>
        <Stage mode={mode} ground="paper" height={mode === "phone" ? 640 : 560}>
          <div
            className={cn(
              "grid h-full items-center gap-[var(--gap-gallery)] p-8",
              mode === "phone" ? "grid-cols-1" : "grid-cols-3",
            )}
          >
            {(mode === "phone" ? IN_PLACE.slice(0, 1) : IN_PLACE).map((p) => (
              <BlogPlate
                key={p.slug}
                slug={p.slug}
                title={p.title}
                route={route}
              />
            ))}
          </div>
        </Stage>
      </section>

      {/* THE REELS. Two recorded recipes pinned to clip ids that are about to be
          replaced; a re-render is a lab job in a browser, not a CLI job. */}
      <section className="flex flex-col gap-3">
        <div>
          <h2 className="text-sm font-semibold">The two reels</h2>
          <Caption className="mt-1">
            Both recipes are pinned to stand-in ids. Swapping the media does not
            re-render them: the engine encodes in a browser, driven from
            /design/reel-parity, and the ffmpeg finish is run by hand.
          </Caption>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {REELS.map((r) => (
            <div key={r.id} className="rounded-lg border border-border p-3">
              <p className="text-xs font-medium">{r.id}</p>
              <Caption className="mt-0.5 text-[11px] tabular-nums">
                {r.orientation}, {r.durationSeconds.toFixed(2)} s, style{" "}
                {r.recipe.styleId}, seed {r.recipe.seed}
              </Caption>
              <ul className="mt-2 space-y-1">
                {r.recipe.clipIds.map((id, i) => {
                  const s = STAND_INS.find((x) => x.id === id);
                  const eff =
                    route === "mix" && s
                      ? s.mix.route
                      : (route as "licensed" | "ours");
                  return (
                    <li
                      key={`${id}-${i}`}
                      className="flex items-baseline gap-2 text-[11px]"
                    >
                      <span className="w-4 shrink-0 text-right text-muted-foreground tabular-nums">
                        {i + 1}
                      </span>
                      <span className="font-medium">{id}</span>
                      <span className="text-muted-foreground">
                        {eff === "ours"
                          ? "from the shoot"
                          : s?.licensed
                            ? `${s.licensed.source}, ${s.licensed.license}`
                            : "no candidate staged"}
                      </span>
                    </li>
                  );
                })}
              </ul>
              <Caption className="mt-2 text-[11px]">{r.recipe.finish}</Caption>
            </div>
          ))}
        </div>
      </section>

      {/* THE SOURCES, clause by clause, so a ruling can be made here rather than
          in a tab. The full survey is docs/specs/media-kit.md section 4. */}
      <section className="flex flex-col gap-3">
        <div>
          <h2 className="text-sm font-semibold">
            The sources, clause by clause
          </h2>
          <Caption className="mt-1">
            Quoted from each license page on the date recorded. What each one
            forbids, and the two that fail us, are in the spec.
          </Caption>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
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
                <span
                  className={cn(
                    "rounded-full px-1.5 py-px text-[10px] font-medium",
                    s.verdict === "allowed"
                      ? "bg-muted text-muted-foreground"
                      : "bg-destructive/10 text-destructive",
                  )}
                >
                  {s.verdict === "allowed" ? "Allowed" : "Not allowed"}
                </span>
              </div>
              <p className="mt-1.5 text-[11px] leading-snug italic">
                &ldquo;{s.clause}&rdquo;
              </p>
              <Caption className="mt-1.5 text-[10px]">
                {s.url}, read {s.retrieved}
              </Caption>
              <p className="mt-1.5 text-[11px] leading-snug text-muted-foreground">
                {s.note}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* THE KIT. The three hero asks are one library at three crops, which is
          the whole reason for writing the plan down. */}
      <section className="flex flex-col gap-3">
        <div>
          <h2 className="text-sm font-semibold">The kit Will makes</h2>
          <Caption className="mt-1">
            36 masters, six per vertical. hero-source asked for 24 squares at
            512, hero-gathering for 36 photographs at 1600 and 8 vertical clips,
            hero-reel for a 15 to 20 s film. Those are not four deliveries: they
            are one library at three crops and one cut.
          </Caption>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {VERTICALS.map((v) => (
            <div key={v.id} className="rounded-lg border border-border p-3">
              <p className="text-xs font-medium">{v.label}</p>
              <ol className="mt-1.5 space-y-1">
                {SHOT_LIST[v.id].map((shot, i) => (
                  <li
                    key={i}
                    className="flex gap-2 text-[11px] leading-snug text-muted-foreground"
                  >
                    <span className="w-3 shrink-0 text-right tabular-nums">
                      {i + 1}
                    </span>
                    <span>{shot}</span>
                  </li>
                ))}
              </ol>
            </div>
          ))}
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <Caption className="font-medium text-foreground">
            What a frame must survive before it enters the manifest
          </Caption>
          <ul className="mt-2 space-y-1.5">
            {KIT_CONSTRAINTS.map((c, i) => (
              <li
                key={i}
                className="flex gap-2 text-[11px] leading-snug text-muted-foreground"
              >
                <span className="w-3 shrink-0 text-right tabular-nums">
                  {i + 1}
                </span>
                <span>{c}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <BoardMeta
        question={QUESTION}
        candidates={[
          {
            name: "Licensed",
            rationale:
              "A batch under a license we can name, staged today, none of Will's time. It satisfies the letter of bible 18 and not its point: the frames are still somebody else's party.",
          },
          {
            name: "Ours",
            rationale:
              "36 masters across six verticals, made by Will, with the squares, clips and film derived from them. The rule taken literally, and the only route that makes the product's own claim true.",
          },
          {
            name: "Mix",
            rationale:
              "Ours on the frames a reader studies (the hero, the reel clips, the four posts riding one empty hall), licensed on the frames that are furniture. The bridge is dated: it ends when the kit lands.",
          },
        ]}
        asks={ASKS}
        departures={DEPARTURES}
        assets={ASSETS}
      />
    </div>
  );
}
