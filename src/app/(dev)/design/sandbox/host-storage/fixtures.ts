import { MARKETING_IMAGES } from "@/lib/constants/marketing-media";
import { GIGABYTE, planById } from "@/lib/constants/tiers";

/**
 * THIS BOARD'S OWN FIXTURES, NOT `sandbox/gallery-fixtures.ts` (the manifest):
 * this board's whole subject is "who added it", at one host's scale. Every door
 * asks for a name, so every item below carries a real typed name, and
 * `isVerified: false` marks the ones nobody confirmed, never a null name.
 *
 * ★ ONE HOST, FOUR EVENTS, AND A REASON THE BYTES ADD UP. Priya Anand shoots
 * weddings and runs each client's event page herself (`HostUpload`'s own
 * copy: "a batch from your photographer"), so most of the heavy video below is
 * hers, host-uploaded, across three clients' weddings; the fourth event is her
 * own kid's birthday, small and mostly photos. That is what makes 110 GB
 * plausible on ONE account without inventing thousands of rows: a handful of
 * near-the-ceiling 4K files (`MAX_UPLOAD_BYTES` = 10 GB/file, `lib/media/
 * limits.ts`) do almost all of the work, exactly as `selectForAutoReduce`
 * (`lib/media/auto-reduce.ts`) already assumes when it reduces largest-first.
 *
 * Every still is one of the fourteen bootstrap photographs every other board
 * reuses (`MARKETING_IMAGES`) — no new asset, no rights to track.
 */

export type StorageItem = {
  id: string;
  type: "photo" | "video";
  url: string;
  fileSizeBytes: number;
  /** Video only. */
  durationSeconds?: number;
  eventId: string;
  eventName: string;
  dateLabel: string;
  uploaderName: string;
  isHost: boolean;
  isVerified: boolean;
};

const MB = 1024 ** 2;
const gb = (n: number) => Math.round(n * GIGABYTE);
const mb = (n: number) => Math.round(n * MB);

/** "34:20" from a count of seconds. */
export function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

const HOST = { name: "Priya Anand", isHost: true, isVerified: true } as const;
const UPLOADERS = {
  host: HOST,
  marcus: { name: "Marcus Lee", isHost: false, isVerified: false },
  deja: { name: "Deja W.", isHost: false, isVerified: false },
  ren: { name: "Ren Fischer", isHost: false, isVerified: true },
  sam: { name: "Sam Okafor", isHost: false, isVerified: true },
} as const;
type UploaderKey = keyof typeof UPLOADERS;

export const EVENTS = [
  { id: "e1", name: "The Alvarez–Cho Wedding", dateLabel: "14 Jun 2026" },
  { id: "e2", name: "Whitfield Wedding, Lake House", dateLabel: "2 Jul 2026" },
  { id: "e3", name: "Ito–Park Wedding", dateLabel: "19 Aug 2026" },
  { id: "e4", name: "Nora's First Birthday", dateLabel: "30 Aug 2026" },
] as const;
type EventId = (typeof EVENTS)[number]["id"];
const eventOf = (id: EventId) => EVENTS.find((e) => e.id === id)!;

let imgAt = 0;
/** Cycles the fourteen bootstrap stills for visual variety across 64 rows. */
function nextImage(): string {
  const img = MARKETING_IMAGES[imgAt % MARKETING_IMAGES.length];
  imgAt += 1;
  return img.src;
}

type VideoSeed = {
  id: string;
  event: EventId;
  gb: number;
  by: UploaderKey;
  seconds: number;
};
type PhotoSeed = { id: string; event: EventId; mb: number; by: UploaderKey };

const VIDEOS: VideoSeed[] = [
  // The Alvarez–Cho Wedding — nine files, almost all Priya's own coverage.
  { id: "ceremony-4k", event: "e1", gb: 9.4, by: "host", seconds: 34 * 60 + 20 },
  { id: "reception-drone", event: "e1", gb: 8.1, by: "host", seconds: 22 * 60 + 10 },
  { id: "dance-floor-montage", event: "e1", gb: 5.2, by: "host", seconds: 9 * 60 + 5 },
  { id: "first-dance", event: "e1", gb: 4.6, by: "host", seconds: 7 * 60 + 40 },
  { id: "rehearsal-dinner", event: "e1", gb: 3.9, by: "host", seconds: 14 * 60 + 15 },
  { id: "speeches", event: "e1", gb: 3.4, by: "host", seconds: 12 * 60 + 5 },
  { id: "family-interviews", event: "e1", gb: 2.8, by: "host", seconds: 8 * 60 + 30 },
  { id: "highlight-teaser", event: "e1", gb: 2.6, by: "host", seconds: 2 * 60 + 40 },
  { id: "guest-toast", event: "e1", gb: 1.2, by: "marcus", seconds: 2 * 60 + 50 },

  // Whitfield Wedding, Lake House — eight files.
  { id: "ceremony-lakeside", event: "e2", gb: 8.9, by: "host", seconds: 29 * 60 + 50 },
  { id: "reception-toasts", event: "e2", gb: 6.7, by: "host", seconds: 19 * 60 + 15 },
  { id: "cocktail-hour", event: "e2", gb: 4.4, by: "host", seconds: 13 * 60 + 25 },
  { id: "getting-ready", event: "e2", gb: 3.8, by: "host", seconds: 9 * 60 + 30 },
  { id: "venue-drone-sunset", event: "e2", gb: 3.6, by: "host", seconds: 4 * 60 + 5 },
  { id: "bridal-prep", event: "e2", gb: 3.1, by: "host", seconds: 8 * 60 + 50 },
  { id: "family-dance", event: "e2", gb: 2.9, by: "ren", seconds: 5 * 60 + 20 },
  { id: "fireworks", event: "e2", gb: 1.6, by: "deja", seconds: 3 * 60 },

  // Ito–Park Wedding — seven files.
  { id: "ceremony", event: "e3", gb: 9.1, by: "host", seconds: 31 * 60 },
  { id: "after-party", event: "e3", gb: 4.9, by: "host", seconds: 16 * 60 + 20 },
  { id: "ceremony-b-cam", event: "e3", gb: 4.4, by: "host", seconds: 30 * 60 + 40 },
  { id: "reception-speeches", event: "e3", gb: 5.4, by: "host", seconds: 16 * 60 + 40 },
  { id: "drone-venue", event: "e3", gb: 4.2, by: "host", seconds: 8 * 60 + 15 },
  { id: "venue-tour", event: "e3", gb: 3.3, by: "host", seconds: 6 * 60 + 5 },
  { id: "guest-dance", event: "e3", gb: 2.1, by: "marcus", seconds: 4 * 60 + 10 },

  // Nora's First Birthday — two small clips.
  { id: "cake-smash", event: "e4", gb: 0.58, by: "host", seconds: 1 * 60 + 40 },
  { id: "backyard-games", event: "e4", gb: 0.41, by: "sam", seconds: 1 * 60 + 5 },
];

const PHOTOS: PhotoSeed[] = [
  // The Alvarez–Cho Wedding.
  { id: "p01", event: "e1", mb: 8.4, by: "host" },
  { id: "p02", event: "e1", mb: 7.6, by: "host" },
  { id: "p03", event: "e1", mb: 6.9, by: "marcus" },
  { id: "p04", event: "e1", mb: 9.0, by: "host" },
  { id: "p05", event: "e1", mb: 5.8, by: "deja" },
  { id: "p06", event: "e1", mb: 7.1, by: "host" },
  { id: "p07", event: "e1", mb: 6.4, by: "host" },
  { id: "p08", event: "e1", mb: 8.8, by: "marcus" },
  { id: "p09", event: "e1", mb: 7.3, by: "host" },
  { id: "p10", event: "e1", mb: 6.0, by: "deja" },

  // Whitfield Wedding.
  { id: "p11", event: "e2", mb: 7.8, by: "host" },
  { id: "p12", event: "e2", mb: 6.5, by: "host" },
  { id: "p13", event: "e2", mb: 8.2, by: "ren" },
  { id: "p14", event: "e2", mb: 5.9, by: "host" },
  { id: "p15", event: "e2", mb: 7.0, by: "host" },
  { id: "p16", event: "e2", mb: 6.3, by: "deja" },
  { id: "p17", event: "e2", mb: 8.6, by: "host" },
  { id: "p18", event: "e2", mb: 5.4, by: "ren" },
  { id: "p19", event: "e2", mb: 7.7, by: "host" },
  { id: "p20", event: "e2", mb: 6.1, by: "host" },

  // Ito–Park Wedding.
  { id: "p21", event: "e3", mb: 9.2, by: "host" },
  { id: "p22", event: "e3", mb: 7.9, by: "host" },
  { id: "p23", event: "e3", mb: 6.6, by: "marcus" },
  { id: "p24", event: "e3", mb: 8.3, by: "host" },
  { id: "p25", event: "e3", mb: 5.7, by: "host" },
  { id: "p26", event: "e3", mb: 7.4, by: "marcus" },
  { id: "p27", event: "e3", mb: 6.8, by: "host" },
  { id: "p28", event: "e3", mb: 9.0, by: "host" },
  { id: "p29", event: "e3", mb: 5.2, by: "host" },
  { id: "p30", event: "e3", mb: 7.6, by: "host" },

  // Nora's First Birthday.
  { id: "p31", event: "e4", mb: 3.1, by: "host" },
  { id: "p32", event: "e4", mb: 4.6, by: "sam" },
  { id: "p33", event: "e4", mb: 2.9, by: "host" },
  { id: "p34", event: "e4", mb: 5.2, by: "host" },
  { id: "p35", event: "e4", mb: 3.8, by: "sam" },
  { id: "p36", event: "e4", mb: 4.1, by: "host" },
  { id: "p37", event: "e4", mb: 2.7, by: "host" },
  { id: "p38", event: "e4", mb: 4.9, by: "host" },
];

function toItem(seed: VideoSeed | PhotoSeed): StorageItem {
  const event = eventOf(seed.event);
  const who = UPLOADERS[seed.by];
  const isVideo = "seconds" in seed;
  return {
    id: seed.id,
    type: isVideo ? "video" : "photo",
    url: nextImage(),
    fileSizeBytes: isVideo ? gb(seed.gb) : mb((seed as PhotoSeed).mb),
    durationSeconds: isVideo ? (seed as VideoSeed).seconds : undefined,
    eventId: event.id,
    eventName: event.name,
    dateLabel: event.dateLabel,
    uploaderName: who.name,
    isHost: who.isHost,
    isVerified: who.isVerified,
  };
}

/** Every item across every event, largest-first is NOT assumed here: the
 *  `order` decision's own showcase sorts it however that surface reads. */
export const STORAGE_ITEMS: StorageItem[] = [...VIDEOS, ...PHOTOS].map(toItem);

export function totalBytes(items: readonly StorageItem[]): number {
  return items.reduce((sum, i) => sum + i.fileSizeBytes, 0);
}

/** The account's real total, over ALL four events — the one number every
 *  surface below reads rather than re-typing. */
export const TOTAL_ACTIVE_BYTES = totalBytes(STORAGE_ITEMS);

/** The plan-switch story every option is drawn over: Pro 500 GB today, Pro
 *  100 GB tapped and refused because the account would not fit under it. */
export const CURRENT_PLAN = planById("pro_500");
export const TARGET_PLAN = planById("pro_100");
export const GAP_BYTES = Math.max(
  0,
  TOTAL_ACTIVE_BYTES - TARGET_PLAN.storageBytes,
);

/** Ranked largest-first, ties broken by insertion order (`order=flat`). */
export function largestFirst(
  items: readonly StorageItem[] = STORAGE_ITEMS,
): StorageItem[] {
  return [...items].sort((a, b) => b.fileSizeBytes - a.fileSizeBytes);
}

export type EventGroup = {
  eventId: string;
  eventName: string;
  dateLabel: string;
  totalBytes: number;
  items: StorageItem[];
};

/** One event, its total, its own items largest-first (`order=grouped`). */
export function groupedByEvent(
  items: readonly StorageItem[] = STORAGE_ITEMS,
): EventGroup[] {
  return EVENTS.map((event) => {
    const own = largestFirst(items.filter((i) => i.eventId === event.id));
    return {
      eventId: event.id,
      eventName: event.name,
      dateLabel: event.dateLabel,
      totalBytes: totalBytes(own),
      items: own,
    };
  }).filter((g) => g.items.length > 0);
}

/** The single event `where=album` scopes to: the heaviest one, so the option
 *  that can only see one event at a time is judged on the event most worth
 *  seeing sizes for. */
export const ALBUM_SCOPE_EVENT_ID: EventId = "e1";
export const ALBUM_SCOPE_ITEMS = largestFirst(
  STORAGE_ITEMS.filter((i) => i.eventId === ALBUM_SCOPE_EVENT_ID),
);
