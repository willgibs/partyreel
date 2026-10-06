import type { StagePhoto } from "./stage";
import { eventUrl } from "@/lib/events/share-urls";

import {
  type Item,
  itemFor,
  marksOf,
  quietLine,
  weekEvents,
} from "./attention";
import type { EventListRow } from "./events-view";
import type { GuestEventCardData } from "./guest-events";
import type { HomeContext, HomeEvent } from "./home-event";
import { DEFAULT_RULE, leadOf, type RuleId } from "./lead";
import { dateFace, dayOf, phaseOfEvent, whenOf } from "./when";

/**
 * THE DASHBOARD, COMPOSED (host-dashboard r1's four picks and its four carried calls, wired): what
 * leads, what the week holds, and the rows of everything else, from the facts the page read.
 * Pure, so the page and its tests compose the same page from the same facts, and nothing about what
 * shows is decided twice.
 *
 *   - THE STAGE leads with the party of the moment (`moment.ts`) or, with no party on its day, the event her rule picks
 *     (`lead.ts`: Newest, which is the moment, unless she chose another), lit by its own photographs.
 *   - THIS WEEK holds every other party within a week of its date, each with its one step or its quiet
 *     state (`attention.ts`).
 *   - EVERYTHING ELSE is the host's collection (`display.ts`, her Display menu), the stage's own event left
 *     out, the events you added to and the bin through the lens: rows only, which the section lays out by her Display.
 */

/** What the code card needs to open where the host stands: the permanent link and the code's look. */
export type ShareFacts = {
  /** The permanent qr_token URL: what the code encodes and what gets copied. */
  joinUrl: string;
  qrStyle: string;
};

/** A hosted event as the page read it: the rules' facts, and what its tile and its code draw. */
export type HostedEvent = HomeEvent & {
  qrToken: string;
  qrStyle: string;
  /** Presigned stills, its cover first (`getEventCardStills`); empty for an album with no photograph. */
  stills: string[];
  /** Open or Paused (`uploadsLabel`, the hub code's word): the rows view's state. */
  uploadsLabel: string;
  /** The rows view's full date: "October 3, 2026", "October 3–5, 2026", "No date set". */
  dateLabel: string;
  /**
   * When the host last pressed into it from her dashboard (`events.host_opened_at`); null or absent for one never
   * opened (a fixture built before the column need not say it).
   */
  openedAt?: string | null;
};

/** A binned event as the page read it. */
export type DeletedEvent = {
  id: string;
  name: string;
  date: string | null;
  /** The last day of its range, or null (absent reads as one day). */
  endDate?: string | null;
  dateLabel: string;
  coverUrl: string | null;
  deletedAt: string;
  /** "Deletes in 12 days" (`binCountdownLabel`). */
  countdown: string;
};

export type StageView = {
  event: HostedEvent;
  /** Its newest photographs: the live wall's on its day, its card's stills on any other. */
  photos: StagePhoto[];
  /** Who added to it, or null where it was not read. */
  guests: number | null;
  share: ShareFacts;
};

/** One party in the week, as its card draws it. */
export type WeekCard = {
  id: string;
  name: string;
  href: string;
  /** "Tomorrow", "Sunday", "Sat, Sep 26". */
  when: string;
  coverUrl: string | null;
  /** Its date (a range's first day) as an invitation sets it, before it has a photograph. */
  face: { weekday: string; month: string; day: string } | null;
  live: boolean;
  item: Item | null;
  /** What it says when nothing is asked of it. */
  quiet: string;
  share: ShareFacts;
};

export type HomeView = {
  stage: StageView | null;
  week: WeekCard[];
  /** Everything else: hosted (the stage's left out), guest and deleted; the events section lays the rows out by her Display. */
  events: {
    rows: EventListRow[];
  };
  /** The account has any event at all, hosted, added to or binned: the create teaser's opposite. */
  hasAny: boolean;
};

export type HomeInput = {
  ctx: HomeContext;
  /** Every live hosted event, newest made first. */
  hosted: readonly HostedEvent[];
  /** The events this account added to, already masked by their albums' own doors (`guestEventCardProps`). */
  guests: readonly GuestEventCardData[];
  deleted: readonly DeletedEvent[];
  siteUrl: string;
  /** What the stage's own reads found, for the event the moment picks; null where none were made. */
  stageReads: {
    id: string;
    photos: StagePhoto[] | null;
    guests: number | null;
  } | null;
  /** The rule she keeps for what leads the stage (host-dashboard r4); Newest, the moment, when not said. */
  rule?: RuleId;
  /** The viewer's calendar day of an instant (`dayInZone`), for the day an event was made; UTC when not said. */
  dayOfInstant?: (iso: string) => string;
};

const shareOf = (e: HostedEvent, siteUrl: string): ShareFacts => ({
  joinUrl: eventUrl(siteUrl, e.qrToken),
  qrStyle: e.qrStyle,
});

/** The stage's photographs as the page holds them: its stills, presigned, the cover first. */
const stillsAsPhotos = (e: HostedEvent): StagePhoto[] =>
  e.stills.map((url, i) => ({ id: `${e.id}:${i}`, url }));

/**
 * AN EVENT ON THE STAGE, as the page draws it: its own reads where the page made them (the wall on its day, who came
 * once it has had a day), else its stills and no guest number (an unread fact is never guessed).
 */
export function stageViewOf(
  e: HostedEvent,
  siteUrl: string,
  reads: { photos: StagePhoto[] | null; guests: number | null } | null = null,
): StageView {
  return {
    event: e,
    photos: reads?.photos ?? stillsAsPhotos(e),
    guests: reads?.guests ?? null,
    share: shareOf(e, siteUrl),
  };
}

/** A party in the week, as its card draws it. */
export function weekCardOf(
  e: HostedEvent,
  ctx: HomeContext,
  siteUrl: string,
): WeekCard {
  return {
    id: e.id,
    name: e.name,
    href: `/dashboard/${e.id}`,
    when: whenOf(e.date, ctx.today, ctx.evening, e.endDate),
    coverUrl: e.stills[0] ?? null,
    face: e.date ? dateFace(e.date) : null,
    live: phaseOfEvent(e, ctx.today) === "live",
    item: itemFor(e, ctx),
    quiet: quietLine(e, ctx),
    share: shareOf(e, siteUrl),
  };
}

/** A hosted event as her events list draws it; `inWeek` is whether the week's own card already says its step. */
export function hostedRowOf(
  e: HostedEvent,
  ctx: HomeContext,
  inWeek: boolean,
): EventListRow {
  return {
    id: e.id,
    kind: "hosted",
    name: e.name,
    href: `/dashboard/${e.id}`,
    coverUrl: e.stills[0] ?? null,
    stills: e.stills,
    dateLabel: e.dateLabel,
    when: whenOf(e.date, ctx.today, ctx.evening, e.endDate),
    face: e.date ? dateFace(e.date) : null,
    sortDate: e.createdAt,
    items: e.approved,
    pending: e.pending,
    waiting: e.waiting,
    statusLabel: e.uploadsLabel,
    byline: null,
    marks: marksOf(e, ctx, inWeek),
    day: dayOf(e),
    dated: e.date !== null,
    openedAt: e.openedAt ?? null,
  };
}

export function buildHomeView(input: HomeInput): HomeView {
  const { ctx, hosted, siteUrl } = input;
  const led = leadOf(
    hosted,
    ctx.today,
    input.rule ?? DEFAULT_RULE,
    input.dayOfInstant,
  );
  const lead = led?.event ?? null;

  const stage: StageView | null = lead
    ? stageViewOf(
        lead,
        siteUrl,
        input.stageReads?.id === lead.id ? input.stageReads : null,
      )
    : null;

  const week = weekEvents(hosted, ctx.today).filter((e) => e.id !== lead?.id);
  const inWeek = new Set(week.map((e) => e.id));

  const weekCards: WeekCard[] = week.map((e) => weekCardOf(e, ctx, siteUrl));

  const listed = hosted.filter((e) => e.id !== lead?.id);
  const hostedRows: EventListRow[] = listed.map((e) =>
    hostedRowOf(e, ctx, inWeek.has(e.id)),
  );

  const guestRows: EventListRow[] = [...input.guests]
    .sort((a, b) =>
      a.lastUploadAt < b.lastUploadAt
        ? 1
        : a.lastUploadAt > b.lastUploadAt
          ? -1
          : 0,
    )
    .map((g) => ({
      id: g.eventId,
      kind: "guest",
      name: g.name,
      href: g.href,
      coverUrl: g.coverUrl,
      stills: [],
      dateLabel: g.dateLabel,
      when: g.dateLabel,
      face: null,
      sortDate: g.lastUploadAt,
      items: 0,
      pending: 0,
      waiting: 0,
      statusLabel: g.accessible && g.passwordProtected ? "Password" : null,
      byline: g.byline,
      marks: null,
      // The day she last added to it, in UTC: a guest album is placed by her own newest upload.
      day: g.lastUploadAt.slice(0, 10),
      dated: true,
      openedAt: null,
    }));

  const deletedRows: EventListRow[] = input.deleted.map((d) => ({
    id: d.id,
    kind: "deleted",
    name: d.name,
    href: null,
    coverUrl: d.coverUrl,
    stills: [],
    dateLabel: d.dateLabel,
    when: whenOf(d.date, ctx.today, false, d.endDate),
    face: d.date ? dateFace(d.date) : null,
    sortDate: d.deletedAt,
    items: 0,
    pending: 0,
    waiting: 0,
    statusLabel: d.countdown,
    byline: null,
    marks: null,
    day: d.date,
    dated: d.date !== null,
    openedAt: null,
  }));

  return {
    stage,
    week: weekCards,
    events: {
      rows: [...hostedRows, ...guestRows, ...deletedRows],
    },
    hasAny:
      hosted.length > 0 || input.guests.length > 0 || input.deleted.length > 0,
  };
}
