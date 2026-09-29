"use client";

import type { ReactNode } from "react";
import {
  BadgeCheck,
  EyeOff,
  Flag,
  Images,
  MailQuestion,
  Play,
  ShieldAlert,
  Upload,
  UserRound,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { GLASS_MARK } from "@/lib/glass";
import { cn } from "@/lib/utils";

import {
  type Entry,
  type HarmShape,
  isHarmKind,
  KIND_CHIP,
  kindOf,
  MOVED_AT,
  MOVED_BY_YOU,
  type OneReport,
  type ProofShape,
  stillOf,
  whenOf,
} from "./fixtures";

/**
 * EVERY FACT A REPORT CARRIES, AS ONE SET OF PARTS EVERY SHAPE IS BUILT FROM.
 *
 * Will's note on round one's `look`: "Each report should provide all the
 * context needed to handle or make a decision." So the facts are authored
 * once, here, and each queue shape decides only how much room it gives them:
 * a sheet puts every one on its row, a pane puts every one beside the report
 * in focus, a grid puts the words and three facts under the tile and the rest
 * on its peek. A shape can never quietly carry fewer facts than another,
 * because there is only one list of them.
 *
 * ★ `data-tri-fact` IS HOW THE BOARD COUNTS THEM. Each fact that can be read
 * without a tap carries it, and the caption under a frame reads how many are
 * on screen for the first report (board.tsx), so "every fact at a glance" is
 * a measured claim rather than a promise in the option's words.
 *
 * ★ NOTHING HERE CALLS AN ACTION. `ReportReviewList` imports two live
 * service-role writes at module scope, so every button on this board is a
 * look-alike on the same `Button` primitives, with the same words.
 */

/* ── The world a fact is read in ────────────────────────────────────────── */

export type FactWorld = { harm: HarmShape; proof: ProofShape };

/** A report's kind is on screen only where the form asked one. */
export const kindShown = (w: FactWorld) => w.harm !== "eye";

/**
 * Whether the operator can ask this report's reporter for more: only through
 * the confirmed address the report keeps until it closes, so a signed-in
 * guest's, or (under `confirm`) one she confirmed as she reported.
 */
export function canAsk(r: OneReport, proof: ProofShape): boolean {
  if (proof === "none") return false;
  if (proof === "account") return r.reporter === "account";
  return r.reporter === "account" || Boolean(r.confirmed);
}

/**
 * ★ NEVER FOR THE WORST KIND. The runbook asks for as little human contact
 * with that content as possible, and asking a stranger to send proof of it
 * would invite exactly what must never be sent. So the button is absent there
 * whatever the reporter left, and only where the kind is known.
 */
export const askable = (e: Entry, w: FactWorld) =>
  canAsk(e.reports[0], w.proof) && !(kindShown(w) && kindOf(e) === "sexual");

/* ── The frame ──────────────────────────────────────────────────────────── */

/**
 * The reported frame. 4:5 by default (the review queue's uniform box), a
 * video's still wearing the glass play mark, an album report its album's name
 * in the box, a person their initial.
 *
 * `covered`: the worst kind arrives with its frame behind a blur and one
 * control to look (the runbook's "keep human viewing to a minimum"). Only a
 * report whose kind was asked can be covered: the eye has nothing to go on.
 */
export function Still({
  entry,
  className,
  covered = false,
  big = false,
  mini = false,
}: {
  entry: Entry;
  className?: string;
  covered?: boolean;
  /** The peek's and the pane's size: its marks grow with it. */
  big?: boolean;
  /** A list's thumbnail, too small for an album's name: its glyph alone. */
  mini?: boolean;
}) {
  const still = stillOf(entry);
  return (
    <div
      data-tri-frame={still ? "" : undefined}
      className={cn(
        "relative aspect-[4/5] shrink-0 overflow-hidden rounded-tile bg-muted",
        className,
      )}
    >
      {still ? (
        // eslint-disable-next-line @next/next/no-img-element -- a local still standing in for a presigned original
        <img
          src={still.src}
          alt=""
          draggable={false}
          className={cn(
            "size-full object-cover",
            covered && "scale-110 blur-xl brightness-75",
          )}
        />
      ) : entry.subject === "person" ? (
        <span className="flex size-full items-center justify-center font-heading text-card-title font-medium text-muted-foreground">
          {entry.person?.name.slice(0, 1)}
        </span>
      ) : mini ? (
        <span className="flex size-full items-center justify-center">
          <Images className="size-4 text-muted-foreground" aria-hidden />
        </span>
      ) : (
        <span className="flex size-full flex-col justify-end gap-0.5 p-2">
          <Images className="size-3.5 text-muted-foreground" aria-hidden />
          <span className="line-clamp-2 text-caption font-medium">
            {entry.album?.name}
          </span>
        </span>
      )}
      {entry.media?.type === "video" && !covered ? (
        <span
          aria-hidden
          className={cn(
            "absolute top-1/2 left-1/2 flex -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full text-white",
            big ? "size-12" : "size-7",
            GLASS_MARK,
          )}
        >
          <Play
            className={cn(
              "translate-x-px fill-current",
              big ? "size-5" : "size-3",
            )}
          />
        </span>
      ) : null}
      {covered ? (
        <span className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 p-2 text-center text-white">
          <EyeOff className={big ? "size-6" : "size-4"} aria-hidden />
          {big ? (
            <>
              <span className="text-working font-medium">Covered</span>
              <span className="max-w-56 text-caption text-white/80">
                The runbook: look only to confirm it, never to study it.
              </span>
              <span className="mt-1 rounded-full bg-white/15 px-3 py-1 text-caption font-medium">
                View once
              </span>
            </>
          ) : (
            <span className="text-micro font-medium">Covered</span>
          )}
        </span>
      ) : null}
    </div>
  );
}

/* ── The words ──────────────────────────────────────────────────────────── */

/** What a wordless report prints in its place (`reason=marked`, round one). */
export const NO_REASON = "No reason provided.";

/**
 * The newest report's words, or the muted line round one picked. Several
 * reports on one photo say how many more, and the ones that open whole (the
 * pane, the peek) list every reason under the first.
 */
export function Words({
  entry,
  clamp,
  all = false,
  className,
}: {
  entry: Entry;
  /** Lines before the text is cut, in the denser shapes. */
  clamp?: 1 | 2 | 3;
  /** Every report's words, one under the next. */
  all?: boolean;
  className?: string;
}) {
  const [first, ...rest] = entry.reports;
  const line = (r: OneReport, key?: string) =>
    r.reason ? (
      <p
        key={key}
        className={cn(
          clamp === 1 && "line-clamp-1",
          clamp === 2 && "line-clamp-2",
          clamp === 3 && "line-clamp-3",
        )}
      >
        {r.reason}
      </p>
    ) : (
      <p key={key} className="text-muted-foreground">
        {NO_REASON}
      </p>
    );
  return (
    <div data-tri-fact="words" className={cn("text-working", className)}>
      {line(first)}
      {rest.length > 0 && all ? (
        <div className="mt-2 space-y-2 border-l-2 pl-3">
          {rest.map((r) => (
            <div key={r.id}>
              {line(r)}
              <p className="text-caption text-muted-foreground">
                {r.when}, {reporterWords(r)}
              </p>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}

/* ── The facts ──────────────────────────────────────────────────────────── */

export const reporterWords = (r: OneReport) =>
  r.reporter === "account" ? "a signed-in guest" : "a signed-out guest";

/** Who reported it, and whether she can be asked. */
export function reporterLine(e: Entry, w: FactWorld): string {
  const r = e.reports[0];
  const who = r.reporter === "account" ? "Signed-in guest" : "Signed-out guest";
  if (w.proof === "none") return who;
  return canAsk(r, w.proof) ? `${who}, can be asked` : `${who}, can't be asked`;
}

/** The uploader in one line: her name, and what else is known of her here. */
export function uploaderParts(e: Entry): string[] {
  const u = e.uploader;
  if (!u) return [];
  const parts = [`${u.name}${u.verified ? "" : ", unverified"}`];
  parts.push(`${u.more} more here`);
  if (u.otherReports > 0)
    parts.push(
      `${u.otherReports} other report${u.otherReports === 1 ? "" : "s"}`,
    );
  if (u.heldOthers > 0) parts.push(`${u.heldOthers} of hers held`);
  return parts;
}

/** What the report is about, in two words. */
export function subjectWords(e: Entry): string {
  if (e.subject === "person") return "A person";
  if (e.subject === "album") return "The whole album";
  return e.media?.type === "video" ? "A video" : "A photo";
}

/** Where the thing reported is right now, as the chip says it. */
export function nowWords(e: Entry): string | null {
  if (e.held) return "Held";
  if (e.state === "hidden") return "Hidden by the host";
  if (e.state === "withdrawn") return "Taken back by its uploader";
  return null;
}

/** The chip for a photo that is already gone, or held. Nothing while it is up. */
export function NowChip({ entry }: { entry: Entry }) {
  const words = nowWords(entry);
  if (!words) return null;
  return (
    <Badge
      data-tri-fact="now"
      variant={entry.held ? "info" : "secondary"}
      className="font-normal"
    >
      {words}
    </Badge>
  );
}

/** The kind, where the form asked one. */
export function KindChip({ entry, world }: { entry: Entry; world: FactWorld }) {
  if (!kindShown(world)) {
    // Today's world: only the operator's own press says harm.
    if (!MOVED_BY_YOU.has(entry.id)) return null;
    return (
      <Badge variant="destructive" className="font-normal">
        You moved it here, {MOVED_AT}
      </Badge>
    );
  }
  const kind = kindOf(entry);
  if (!isHarmKind(kind)) return null;
  return (
    <Badge
      data-tri-fact="kind"
      variant={kind === "sexual" ? "destructive" : "warning"}
    >
      {KIND_CHIP[kind]}
    </Badge>
  );
}

/** How many reports name the one thing, when it is more than one. */
export function CountChip({ entry }: { entry: Entry }) {
  if (entry.reports.length < 2) return null;
  return (
    <Badge
      data-tri-fact="count"
      variant="outline"
      className="gap-1 font-normal"
    >
      <Flag aria-hidden />
      {entry.reports.length} reports
    </Badge>
  );
}

/** One fact, with its glyph. */
function Fact({
  icon,
  id,
  children,
  className,
}: {
  icon: ReactNode;
  id: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      data-tri-fact={id}
      className={cn("flex min-w-0 items-center gap-1.5", className)}
    >
      <span className="shrink-0 text-muted-foreground/80 [&>svg]:size-3.5">
        {icon}
      </span>
      <span className="min-w-0 truncate">{children}</span>
    </span>
  );
}

/**
 * The facts, as lines. `stack` puts one under the next (a sheet's column, a
 * card); otherwise they run in one wrapping line (a tile's foot).
 */
export function FactLines({
  entry,
  world,
  only,
  className,
}: {
  entry: Entry;
  world: FactWorld;
  /** A subset, for the shapes that carry the rest on a tap. */
  only?: readonly ("who" | "uploader" | "album")[];
  className?: string;
}) {
  const want = (k: "who" | "uploader" | "album") => !only || only.includes(k);
  const up = uploaderParts(entry);
  return (
    <div
      className={cn(
        "flex min-w-0 flex-col gap-1 text-caption text-muted-foreground",
        className,
      )}
    >
      {want("who") ? (
        <Fact
          id="who"
          icon={
            entry.reports[0].reporter === "account" ? (
              <BadgeCheck />
            ) : (
              <UserRound />
            )
          }
        >
          {reporterLine(entry, world)}, {whenOf(entry)}
        </Fact>
      ) : null}
      {want("uploader") && up.length > 0 ? (
        <Fact id="uploader" icon={<Upload />}>
          {up.join(" · ")}
        </Fact>
      ) : null}
      {want("album") && entry.album ? (
        <Fact id="album" icon={<Images />}>
          {entry.album.name} · {entry.album.uploads} uploads ·{" "}
          {entry.album.host}
        </Fact>
      ) : null}
      {want("album") && entry.person ? (
        <Fact id="album" icon={<UserRound />}>
          {entry.person.name},{" "}
          {entry.person.slug ? `@${entry.person.slug}` : "no public handle"} ·
          profile is up
        </Fact>
      ) : null}
    </div>
  );
}

/* ── The verbs ──────────────────────────────────────────────────────────── */

/**
 * WHAT AN OPERATOR CAN DO TO ONE REPORT, AS ROUND ONE LEFT IT: Dismiss is one
 * press with Add a note beside it and Remove opens the portal's one confirm
 * with an optional note (`verdict=note`); an item carries Hold for forensics,
 * which opens that confirm filled in (`escalate=door`); an album report's
 * verb is Action and a person's Mark actioned, as the page says them today.
 * Two verbs are this round's: It's harm (today's world only, where the
 * operator's eye is the only sorter) and Ask for proof (where `proof` lets
 * the reporter be reached).
 */
export function Verbs({
  entry,
  world,
  front,
  size = "sm",
  className,
}: {
  entry: Entry;
  world: FactWorld;
  /** At the front already: no It's harm to press. */
  front: boolean;
  size?: "sm" | "default";
  className?: string;
}) {
  const remove =
    entry.subject === "person"
      ? "Mark actioned"
      : entry.subject === "album"
        ? "Action…"
        : "Remove…";
  return (
    <div
      data-tri-verbs
      className={cn("flex flex-wrap items-center gap-2", className)}
    >
      <Button type="button" variant="outline" size={size}>
        Dismiss
      </Button>
      <Button type="button" variant="destructive" size={size}>
        {remove}
      </Button>
      {askable(entry, world) ? (
        <Button type="button" variant="outline" size={size} data-tri-ask>
          <MailQuestion />
          Ask for proof
        </Button>
      ) : null}
      {entry.subject === "item" ? (
        <Button type="button" variant="ghost" size={size}>
          <ShieldAlert />
          Hold for forensics
        </Button>
      ) : null}
      {!front && !kindShown(world) ? (
        <Button type="button" variant="ghost" size={size} data-tri-move>
          It&rsquo;s harm
          <kbd className="ml-0.5 rounded border px-1 text-micro text-muted-foreground">
            H
          </kbd>
        </Button>
      ) : null}
      <span className="text-caption text-muted-foreground underline underline-offset-4">
        Add a note
      </span>
    </div>
  );
}

/* ── The report whole ───────────────────────────────────────────────────── */

/** One labelled fact, for the shapes that open a report whole. */
function FactRow({
  label,
  id,
  children,
}: {
  label: string;
  id: string;
  children: ReactNode;
}) {
  return (
    <div data-tri-fact={id} className="grid grid-cols-[7.5rem_1fr] gap-3">
      <dt className="text-caption text-muted-foreground">{label}</dt>
      <dd className="min-w-0 text-working">{children}</dd>
    </div>
  );
}

/**
 * Every fact, labelled: the pane beside its list and the peek beside its
 * photograph draw the same list, so a report opened whole says the same
 * things whichever shape opened it.
 */
export function FactList({ entry, world }: { entry: Entry; world: FactWorld }) {
  const up = uploaderParts(entry);
  return (
    <dl className="space-y-1.5">
      <FactRow label="Reported by" id="who">
        {reporterLine(entry, world)}
      </FactRow>
      {up.length > 0 ? (
        <FactRow label="Sent by" id="uploader">
          {up.join(" · ")}
        </FactRow>
      ) : null}
      {entry.album ? (
        <FactRow label="Album" id="album">
          {entry.album.name}, {entry.album.uploads} uploads,{" "}
          {entry.album.guests} guests
          <span className="block text-caption text-muted-foreground">
            {entry.album.host}
          </span>
        </FactRow>
      ) : null}
      {entry.person ? (
        <FactRow label="Profile" id="album">
          {entry.person.name},{" "}
          {entry.person.slug ? `@${entry.person.slug}` : "no public handle"}
        </FactRow>
      ) : null}
      <FactRow label="Now" id="now">
        {nowWords(entry) ?? (entry.subject === "item" ? "In the album" : "Up")}
      </FactRow>
    </dl>
  );
}

/**
 * THE REPORT WHOLE: the frame at a size to judge, every report's words, every
 * fact labelled, and the verbs. The pane draws it beside the list; the grid,
 * the sheet and the albums draw it on their peek.
 */
export function ReportWhole({
  entry,
  world,
  front,
  frameWidth = 300,
  children,
}: {
  entry: Entry;
  world: FactWorld;
  front: boolean;
  frameWidth?: number;
  /** Anything a later ask stacks under the facts (the proof thread). */
  children?: ReactNode;
}) {
  const covered = kindShown(world) && kindOf(entry) === "sexual";
  return (
    <div className="flex min-w-0 gap-6">
      {/* A fixed column, so the words beside it never squeeze the frame. */}
      <div className="shrink-0" style={{ width: frameWidth }}>
        <Still
          entry={entry}
          covered={covered}
          big
          className="w-full rounded-lg"
        />
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-caption text-muted-foreground">
            {subjectWords(entry)}, {whenOf(entry)}
          </span>
          <KindChip entry={entry} world={world} />
          <CountChip entry={entry} />
          <NowChip entry={entry} />
        </div>
        <Words entry={entry} all className="text-reading" />
        <FactList entry={entry} world={world} />
        {children}
        <Verbs entry={entry} world={world} front={front} />
      </div>
    </div>
  );
}
