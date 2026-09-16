"use client";

import {
  ApplyToSite,
  type Mode,
  Stage,
  useLineCount,
  WalkPages,
} from "@/components/lab";
import { Caption } from "@/components/marketing/system/caption";
import { cn } from "@/lib/utils";

import { APPLY_BLOCKS } from "./apply";
import { BRIDGE, STAGE_POSTS } from "./bridge";
import { candidate, candidateSrc, CANDIDATES } from "./candidates";
import {
  BARRED_IDS,
  BARRED_POSTS,
  IDS_TOTAL,
  IDS_UNDER_RULE,
  POSTS_FILLED,
  POSTS_UNDER_RULE,
  ROUTE_SHIPS,
} from "./decision";
import {
  CHROME,
  FILE_COUNTS,
  liveExposure,
  MARKETING_PAGES,
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
import { CardPlate, SharePlate, PostRow, Tag, whatReplaces } from "./plates";
import { runbookFor, WIRING_ADDS } from "./runbook";
import {
  DERIVED,
  KIT_CONSTRAINTS,
  master,
  MASTERS,
  NOT_DERIVED,
} from "./shoot";
import { LICENCES } from "./sources";
import { MEDIA_KIT } from "./spec";

/**
 * THE EVIDENCE, SECTION BY SECTION (the migration wave, 2026-09-15).
 *
 * Each export below is one declared section's evidence and nothing else: the
 * template draws the number, the title, the asks it answers, the lede and the
 * collapsed argument, so a part that drew its own heading would be a second
 * header grammar on a board a reviewer walks beside four others.
 *
 * Round four folded five of these behind one `details` summary, because an
 * argument already made should not sit in front of the answer it produced. The
 * template answers that better: the answer is the FIRST screen now, each section
 * folds its own argument, and the index above them is a map of the whole board.
 * So the fold is gone and nothing it hid is gone with it.
 */

/* --------------------------------------------------------------------------
   Apply to the site.
   -------------------------------------------------------------------------- */

/**
 * ★ FOUR BLOCKS, ONE RADIO. The kit's ApplyToSite reads the tuner store rather
 * than local state, so the four buttons cannot show four independent "Applied"
 * states while exactly one block is live, and clearing from the dock's badge or
 * from another tab is reflected here on the next render. Round four carried the
 * four as bare pills in the dock; the wave's contract moves them onto the kit's
 * own Apply, which carries the walk line and the persistence warning with them,
 * and leaves the dock the badge that says what stands.
 */
export function ApplyPart() {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 rounded-lg border border-border bg-card p-4">
        {APPLY_BLOCKS.map((b) => (
          <div key={b.id} className="flex flex-col gap-1.5">
            <p className="text-[12px] font-medium">{b.label}</p>
            <ApplyToSite
              block={{
                label: `Media kit: ${b.label}`,
                css: b.css,
                what: b.what,
                pages: MEDIA_KIT.links.pages?.map((p) => p.path).join(", "),
              }}
            />
          </div>
        ))}
      </div>
      <WalkPages pages={MEDIA_KIT.links.pages ?? []} />
      <Caption className="text-[10px] leading-snug">
        Each block carries both namespaces: the twelve ids by file name, for the{" "}
        {ROUTES.length - 1} routes that read a frame directly, and all{" "}
        {BRIDGE.length} blog covers by slug, so a card wears the candidate its
        own row on the sheet shows. Not the app and not a guest link: no
        marketing still is referenced under the dashboard, the event page, the
        admin portal or the guest link, so a block changes nothing there.
      </Caption>
    </div>
  );
}

/* --------------------------------------------------------------------------
   The licences.
   -------------------------------------------------------------------------- */

export function LicencesPart() {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {LICENCES.map((s) => (
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
          <p className="mt-1.5 text-[10px] leading-snug text-muted-foreground">
            {s.note}
          </p>
          <Caption className="mt-1.5 text-[10px]">{s.url}</Caption>
        </div>
      ))}
    </div>
  );
}

/* --------------------------------------------------------------------------
   The exposure.
   -------------------------------------------------------------------------- */

export function ExposurePart() {
  const maxFiles = Math.max(...STAND_INS.map((s) => FILE_COUNTS[s.id] ?? 0));
  const widest = STAND_INS.reduce((a, b) =>
    (FILE_COUNTS[b.id] ?? 0) > (FILE_COUNTS[a.id] ?? 0) ? b : a,
  );
  const narrowest = STAND_INS.reduce((a, b) =>
    (FILE_COUNTS[b.id] ?? 0) < (FILE_COUNTS[a.id] ?? 0) ? b : a,
  );

  return (
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
            simply not true of either column: party-balloons leads on files and
            reception-hall on covers. Both ends are derived. */}
        <Caption className="text-[10px]">
          The bar is a share of the widest, which is {maxFiles} files.{" "}
          {widest.id} is that one: {liveExposure(widest.id)}. The narrowest,{" "}
          {narrowest.id}, is still {FILE_COUNTS[narrowest.id]} files and the
          footer of every page. Reach, rather than count, belongs to
          reception-table: it is the only id in both the footer and the nav, so
          it is on all {MARKETING_PAGES} marketing pages twice.
        </Caption>
      </div>
    </div>
  );
}

/* --------------------------------------------------------------------------
   The gap.
   -------------------------------------------------------------------------- */

export function GapPart() {
  return (
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
  );
}

/* --------------------------------------------------------------------------
   The bridge.
   -------------------------------------------------------------------------- */

/**
 * ★ THE STAGE SHOWS TODAY'S ROW ABOVE THE ROUTE'S ROW, AT THE REAL SIZE ON THE
 * REAL GROUND. Round three walked the running blog and measured it: the library
 * card is 320x400 with a 16 px gutter, three across at 1440, and /blog is in the
 * (cinema) group, so it is a DARK page. The stage before that drew 440 px plates
 * on paper, and it drew only the route's row, so at the default route (Mix,
 * where all three staged posts go to the shoot) the board's largest element
 * opened as three empty hatches.
 *
 * ★ AND THE TITLE REPORTS ITS OWN WRAP, MEASURED. The real card clamps its title
 * at two lines, so a title that needs three is CLIPPED on the site, and "it fits"
 * is the kind of claim a board asserts and never checks. `useLineCount` (the
 * kit's) reads the rendered box rather than counting characters, and re-reads on
 * `document.fonts.ready`, because the webfont lands after the first layout and
 * takes every wrap with it.
 */
function BridgeStage({
  mode,
  route,
  geometry,
}: {
  mode: Mode;
  route: Route;
  geometry: "card" | "share";
}) {
  const [titleRef, lines] = useLineCount();
  const shown = mode === "phone" ? 1 : geometry === "card" ? 3 : 2;

  return (
    <>
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
              <Caption className={mode === "phone" ? "text-[11px]" : "text-xs"}>
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
                {STAGE_POSTS.slice(0, shown).map((p, i) => {
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
                  const shareSlate =
                    which === "next" && next.kind === "ours"
                      ? `To be shot, ${master(p.shot).code}`
                      : undefined;
                  // The provenance line belongs UNDER the plate, never on it:
                  // the plate is the real card and the annotation is board
                  // chrome, and the whole point of this section is that the two
                  // are not the same thing.
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
                          crop={p.crop}
                          slate={slate}
                          titleRef={
                            which === "today" && i === 0 ? titleRef : undefined
                          }
                        />
                      ) : (
                        <SharePlate
                          src={src}
                          title={p.title}
                          slate={shareSlate}
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
        with a 16 px gutter, three across, on the cinema ground. The plate draws
        the cover, the scrim, the title and the byline; the real card also
        carries up to two tag chips in the top left, which this board holds no
        data for and will not invent. Both rows are cut at the same rung of the
        crop ladder, because the ladder is a function of the slug: swapping the
        photograph does not move it, and neither will the frontmatter edit that
        ships it.
        {geometry === "card" && lines !== null ? (
          <>
            {" "}
            The first title above measures {lines}{" "}
            {lines === 1 ? "line" : "lines"} as rendered, and the card clamps at
            two, so a longer title is cut on the site rather than wrapped.
          </>
        ) : null}
      </Caption>
    </>
  );
}

export function BridgePart({
  mode,
  route,
  geometry,
  setRoute,
}: {
  mode: Mode;
  route: Route;
  geometry: "card" | "share";
  setRoute: (route: Route) => void;
}) {
  const empty = BRIDGE.filter((p) => !p.candidate);

  return (
    <div data-mk-sheet className="flex flex-col gap-4">
      <Caption className="max-w-2xl leading-relaxed">
        {route === "licensed"
          ? `${POSTS_FILLED} of ${BRIDGE.length} filled, but ${POSTS_UNDER_RULE} of ${BRIDGE.length} under the rule: ${BARRED_POSTS.length} of them carry a face with no release. Fast, free, and still somebody else's party.`
          : route === "ours"
            ? `All ${BRIDGE.length} from the kit. Six verticals, ${MASTERS.length} masters, and the squares, portraits, clips and film cut from the same night.`
            : "Licensed on the details nobody studies, the shoot on everything a reader stops at. The bridge is dated: it ends when the kit lands."}
      </Caption>

      {/* WHAT THE ROUTE SHIPS, which is the question round two asked twice. The
          bridge is not a separate ruling: the route decides how many frames
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

      {/* The three posts are not a slice, they are the argument: two corporate
          posts and a conference post, wearing an empty wedding hall and two
          music festivals today, which is what choosing carefully out of eleven
          frames looks like. */}
      <BridgeStage mode={mode} route={route} geometry={geometry} />

      <div
        className={cn(
          "grid gap-x-5 gap-y-7",
          // Three across at most: at four, a 4:5 plate lands at 110 px, which is
          // too small to judge a photograph on, and judging the photograph is
          // the entire job of this sheet.
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
          The {empty.length} that stay empty, and what that means
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
        <ul className="mt-3 space-y-1.5 border-t border-destructive/30 pt-3">
          <li className="text-[11px] leading-snug">
            <span className="font-medium">
              And {BARRED_POSTS.length} more are filled by a frame the rule in
              question 1 bars.
            </span>{" "}
            <span className="text-muted-foreground">
              {BARRED_POSTS.map((p) => `/blog/${p.slug}`).join(", ")}. Each one
              carries a readable face and no release, so the honest count for
              Licensed is {POSTS_UNDER_RULE} of {BRIDGE.length}, and for the
              twelve ids it is {IDS_UNDER_RULE} of {IDS_TOTAL}:{" "}
              {BARRED_IDS.join(" and ")}, the dance floor and the DJ, which are
              the two frames a product about parties needs most.
            </span>
          </li>
        </ul>
      </div>
    </div>
  );
}

/* --------------------------------------------------------------------------
   The call sheet.
   -------------------------------------------------------------------------- */

export function CallSheetPart() {
  return (
    <div className="flex flex-col gap-3">
      {/* ★ THE EVIDENCE CARRIES THE TWO ANSWERS (the clarity round,
          2026-09-15). This sheet IS what "Shoot" means, so it says so, and each
          group's caption says what "Park" keeps instead: the frames that kind
          of event already has on the site. Labels only; no frame changed. */}
      <div>
        <h3 className="text-xs font-semibold">
          Shoot the {MASTERS.length} in one night
        </h3>
        <Caption className="mt-0.5 block text-[11px]">
          What the shoot is, frame by frame. Every card below is one photograph
          to take.
        </Caption>
      </div>
      {VERTICALS.map((v) => (
        <div key={v.id}>
          <div className="mb-2 flex items-baseline gap-2 border-b border-border pb-1.5">
            <h3 className="text-xs font-semibold">{v.label}</h3>
            <Caption className="text-[11px] tabular-nums">
              {MASTERS.filter((m) => m.vertical === v.id).length} frames to
              shoot. Park the shoot and this one keeps the{" "}
              {countByVertical(v.id)} it has on the site today
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

      {/* ONE NIGHT, NINE ROWS. Round two listed four derived rows because it had
          read four manifests. Reading the whole asset log end to end is what
          turned the kit from the most expensive ask on the list into the one
          that closes most of it. */}
      <div className="mt-2 flex flex-col gap-3">
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <h3 className="text-sm font-semibold">
            Shoot, and {DERIVED.length} rows of the asset log close with it
          </h3>
          <Caption className="text-[11px]">
            The log holds {DERIVED.length + NOT_DERIVED.length} rows. Three are
            not photography (the ruling, the shoot itself and a noise tile). The
            other {DERIVED.length} are crops, recrops, cuts or setups of the
            same night, so the kit is not the most expensive ask on the list, it
            is the one that closes the list.
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
    </div>
  );
}

/* --------------------------------------------------------------------------
   The record.
   -------------------------------------------------------------------------- */

export function RecordPart() {
  return (
    <div className="grid gap-3 lg:grid-cols-2">
      <div className="rounded-lg border border-border bg-card p-4">
        {/* ★ BOTH CARDS ARE WHAT "YES" LOOKS LIKE, so both say so, and the
            line above the fields is what "No" keeps (the clarity round,
            2026-09-15). Labels only: no field, count or claim moved. */}
        <Caption className="font-medium text-foreground">
          Yes, require the six facts: one photograph, filled in
        </Caption>
        <p className="mt-1.5 text-[11px] leading-snug text-muted-foreground">
          <span className="font-medium text-foreground">
            No, leave the entries as they are:
          </span>{" "}
          an entry on the site today says only &ldquo;unsplash (per lab-pack
          comment; provenance unverified)&rdquo;, and nothing else.
        </p>
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
              <dt className="text-[11px] font-medium tabular-nums">{field}</dt>
              <dd className="text-[11px] leading-snug break-words text-muted-foreground">
                {value}
              </dd>
            </div>
          ))}
        </dl>
        <p className="mt-2 text-[11px] leading-snug text-muted-foreground">
          <span className="font-medium text-foreground">people</span> is the
          field that does the work. No free tier supplies a model release, so an
          entry reading identifiable cannot sit on a page that makes a claim,
          and the test refuses one without a caution on it.
        </p>
      </div>
      <div className="rounded-lg border border-border bg-card p-4">
        <Caption className="font-medium text-foreground">
          Yes, require the six facts: what the test already refuses
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
          {/* ★ THE ENTITY IS KEPT OUT OF THIS RUN, AND THAT IS THE DURABLE
              FIX RATHER THAN AN EXPLICIT {" "}. Next 16's SWC drops the leading
              whitespace of a JSXText run that BOTH spans more than one source
              line AND holds an HTML entity, so `{n} staged` renders as
              "22staged"; board-jsx.test.ts caught this one the moment the wave
              widened it to the split files. A hand-placed space expression does
              fix it and prettier deletes it again on the next format when the
              line fits, which is how a guarded shape comes back. Rewording the
              possessive out of the run ("the cover and crop of each post")
              leaves nothing to reflow. */}
          The schema runs on {CANDIDATES.length} staged records. Two more suites
          keep the board honest: exposure.test.ts recomputes every number in the
          exposure from the tree, and bridge.test.ts recomputes the cover and
          crop of each post from the real resolver.
        </p>
      </div>
    </div>
  );
}

/* --------------------------------------------------------------------------
   The runbook.
   -------------------------------------------------------------------------- */

export function RunbookPart() {
  return (
    <div className="flex flex-col gap-4">
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
    </div>
  );
}
