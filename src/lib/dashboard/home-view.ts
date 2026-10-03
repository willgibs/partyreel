import type { StagePhoto } from "./stage";
import { eventUrl } from "@/lib/events/share-urls";

import {
  type Item,
  itemFor,
  marksOf,
  quietLine,
  weekEvents,
} from "./attention";
import type { EventListRow, EventSeason } from "./events-view";
import type { GuestEventCardData } from "./guest-events";
import type { HomeContext, HomeEvent } from "./home-event";
import { momentEvent } from "./moment";
import { seasonsOf } from "./seasons";
import { dateFace, phaseOfEvent, whenOf } from "./when";

/**
 * THE DASHBOARD, COMPOSED (host-dashboard r1's four picks and its four carried calls, wired): what
 * leads, what the week holds, and how everything else groups by when, from the facts the page read.
 * Pure, so the page and its tests compose the same page from the same facts, and nothing about what
 * shows is decided twice.
 *
 *   - THE STAGE leads with the party of the moment (`moment.ts`), lit by its own photographs.
 *   - THIS WEEK holds every other party within a week of its date, each with its one step or its quiet
 *     state (`attention.ts`).
 *   - EVERYTHING ELSE groups by when (`seasons.ts`), the stage's own event left out, the events you
 *     added to and the bin through the lens.
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
  /** The rows view's full date: "October 3, 2026", "No date set". */
  dateLabel: string;
};

/** A binned event as the page read it. */
export type DeletedEvent = {
  id: string;
  name: string;
  date: string | null;
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
  /** Its date as an invitation sets it, before it has a photograph. */
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
  /** Everything else: hosted (the stage's left out), guest and deleted, and the groups by when. */
  events: {
    rows: EventListRow[];
    seasons: EventSeason[];
    /** "Everything else" under a stage, "Your events" without one. */
    title: string;
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
};

const shareOf = (e: HostedEvent, siteUrl: string): ShareFacts => ({
  joinUrl: eventUrl(siteUrl, e.qrToken),
  qrStyle: e.qrStyle,
});

/** The stage's photographs as the page holds them: its stills, presigned, the cover first. */
const stillsAsPhotos = (e: HostedEvent): StagePhoto[] =>
  e.stills.map((url, i) => ({ id: `${e.id}:${i}`, url }));

export function buildHomeView(input: HomeInput): HomeView {
  const { ctx, hosted, siteUrl } = input;
  const moment = momentEvent(hosted, ctx.today);
  const lead = moment?.event ?? null;

  const stage: StageView | null = lead
    ? {
        event: lead,
        photos:
          input.stageReads?.id === lead.id && input.stageReads.photos
            ? input.stageReads.photos
            : stillsAsPhotos(lead),
        guests:
          input.stageReads?.id === lead.id ? input.stageReads.guests : null,
        share: shareOf(lead, siteUrl),
      }
    : null;

  const week = weekEvents(hosted, ctx.today).filter((e) => e.id !== lead?.id);
  const inWeek = new Set(week.map((e) => e.id));

  const weekCards: WeekCard[] = week.map((e) => ({
    id: e.id,
    name: e.name,
    href: `/dashboard/${e.id}`,
    when: whenOf(e.date, ctx.today, ctx.evening),
    coverUrl: e.stills[0] ?? null,
    face: e.date ? dateFace(e.date) : null,
    live: phaseOfEvent(e, ctx.today) === "live",
    item: itemFor(e, ctx),
    quiet: quietLine(e, ctx),
    share: shareOf(e, siteUrl),
  }));

  const listed = hosted.filter((e) => e.id !== lead?.id);
  const hostedRows: EventListRow[] = listed.map((e) => ({
    id: e.id,
    kind: "hosted",
    name: e.name,
    href: `/dashboard/${e.id}`,
    coverUrl: e.stills[0] ?? null,
    stills: e.stills,
    dateLabel: e.dateLabel,
    when: whenOf(e.date, ctx.today, ctx.evening),
    face: e.date ? dateFace(e.date) : null,
    sortDate: e.createdAt,
    items: e.approved,
    pending: e.pending,
    waiting: e.waiting,
    statusLabel: e.uploadsLabel,
    byline: null,
    marks: marksOf(e, ctx, inWeek.has(e.id)),
    seasonId: null,
  }));
  const seasons = seasonsOf(listed, ctx.today);
  const seasonOf = new Map(
    seasons.flatMap((s) => s.ids.map((id) => [id, s.id] as const)),
  );
  for (const row of hostedRows) row.seasonId = seasonOf.get(row.id) ?? null;

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
      seasonId: "guest",
    }));
  if (guestRows.length > 0)
    seasons.push({
      id: "guest",
      label: "As a guest",
      size: "medium",
      ids: guestRows.map((r) => r.id),
    });

  const deletedRows: EventListRow[] = input.deleted.map((d) => ({
    id: d.id,
    kind: "deleted",
    name: d.name,
    href: null,
    coverUrl: d.coverUrl,
    stills: [],
    dateLabel: d.dateLabel,
    when: whenOf(d.date, ctx.today),
    face: d.date ? dateFace(d.date) : null,
    sortDate: d.deletedAt,
    items: 0,
    pending: 0,
    waiting: 0,
    statusLabel: d.countdown,
    byline: null,
    marks: null,
    seasonId: null,
  }));

  return {
    stage,
    week: weekCards,
    events: {
      rows: [...hostedRows, ...guestRows, ...deletedRows],
      seasons,
      title: stage ? "Everything else" : "Your events",
    },
    hasAny:
      hosted.length > 0 || input.guests.length > 0 || input.deleted.length > 0,
  };
}
