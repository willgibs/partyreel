import type { GridMedia } from "@/components/app/media-grid";
import {
  hostEvent,
  NO_COUNTS,
} from "@/components/app/event-settings/testing/host-event";
import type { DoorCounts } from "@/lib/db/queries/event-doors";
import { marketingImage } from "@/lib/constants/marketing-media";

/**
 * ONE WEDDING, ON ITS NIGHT, BEHIND EVERY FRAME.
 *
 * Maya and Jay marry today, 2 October 2026. Maya opens Settings on the door
 * (a password, 31 guests already in, two at the door), then its event page; a
 * guest, Sam, holds the album open on his phone and presses Add; Maya's
 * Review holds twelve uploads; her Account is on an Event Pass.
 *
 * ★ THE SAME FACTS IN EVERY OPTION, so a frame differs from its neighbour by
 * the atoms alone. ★ NOTHING HERE IS A REAL PERSON, and every photograph is
 * one of the bootstrap stills every board reuses (no new asset to make or
 * track). ★ Copy is production's own wherever a component writes it; the
 * rest is placeholder judged for size and wrapping.
 */

export const NAME = "Maya & Jay's Wedding";
export const HOST = "Maya Okafor";
export const DATE = "2026-10-02";

export const EVENT = hostEvent({
  id: "7d0f3c9a-5b1e-4f6a-9c2d-8e7f6a5b4c3d",
  name: NAME,
  event_date: DATE,
  description:
    "Everything from tonight, in one place. Add what you take, whenever you get to it.",
  door: "password",
  visibility: "private",
  has_password: true,
  qr_token: "4f9c2a7e1b8d6c3f0a5e9d2b7c4a1f8e",
  qr_style: "classic",
});

export const JOIN_URL = `https://partyreel.com/e/${EVENT.qr_token}`;

/** Thirty-one in, two at the door: a door with people behind it says what a change does. */
export const COUNTS: DoorCounts = { ...NO_COUNTS, in: 31, waiting: 2 };

/** The stills the album, the cover and the queue are cut from. */
export const PHOTO = {
  toast: marketingImage("wedding-toast").src,
  golden: marketingImage("wedding-golden").src,
  table: marketingImage("reception-table").src,
  rings: marketingImage("wedding-rings").src,
  hall: marketingImage("reception-hall").src,
  arch: marketingImage("wedding-arch").src,
  petals: marketingImage("wedding-petals").src,
  dj: marketingImage("party-dj").src,
  lights: marketingImage("festival-lights").src,
  confetti: marketingImage("concert-confetti").src,
} as const;

/** The guest album's first rows, as the justified rows lay them (a width ratio each). */
export const ALBUM: readonly { src: string; ratio: number; pos?: string }[] = [
  { src: PHOTO.toast, ratio: 1.5 },
  { src: PHOTO.golden, ratio: 0.8, pos: "35% 50%" },
  { src: PHOTO.table, ratio: 1.5 },
  { src: PHOTO.rings, ratio: 1.2 },
  { src: PHOTO.petals, ratio: 0.75 },
  { src: PHOTO.hall, ratio: 1.5 },
  { src: PHOTO.arch, ratio: 0.75 },
  { src: PHOTO.dj, ratio: 1.33 },
  { src: PHOTO.lights, ratio: 1 },
  { src: PHOTO.confetti, ratio: 1.5 },
];

/**
 * REVIEW'S QUEUE: twelve uploads waiting on Maya, each credited to a guest
 * (a name only, never an address on a picture of a page).
 */
const SENDERS = ["Sam Reyes", "Ines Duarte", "Theo Park", "Priya Shah"];
const QUEUE_STILLS = [
  PHOTO.toast,
  PHOTO.golden,
  PHOTO.table,
  PHOTO.rings,
  PHOTO.petals,
  PHOTO.hall,
  PHOTO.arch,
  PHOTO.dj,
  PHOTO.lights,
  PHOTO.confetti,
  PHOTO.toast,
  PHOTO.rings,
];
export const QUEUE: GridMedia[] = QUEUE_STILLS.map((src, i) => ({
  id: `identity-queue-${i}`,
  type: "photo",
  url: src,
  downloadUrl: src,
  status: "pending",
  width: i % 3 === 1 ? 1200 : 1600,
  height: i % 3 === 1 ? 1600 : 1067,
  uploaderName: SENDERS[i % SENDERS.length],
  isVerified: true,
}));

/** Account and billing: Maya on an Event Pass, a third of its 75 GB used. */
export const ACCOUNT = {
  email: "maya@example.com",
  displayName: HOST,
  plan: "Event Pass",
  usedBytes: 24.6 * 1024 ** 3,
  capBytes: 75 * 1024 ** 3,
  expires: "2 October 2027",
  events: { used: 1, of: 1 },
  following: ["Sam Reyes", "Ines Duarte"],
} as const;
