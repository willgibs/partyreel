import {
  hostEvent,
  NO_COUNTS,
  readyFacts,
} from "@/components/app/event-settings/testing/host-event";
import type { DoorCounts } from "@/lib/db/queries/event-doors";
import type { ReadyFacts } from "@/lib/events/readiness";
import { marketingImage } from "@/lib/constants/marketing-media";

/**
 * ONE WEDDING, ON ITS NIGHT, BEHIND EVERY FRAME.
 *
 * Maya and Jay marry today, 2 October 2026. An hour before the first guest,
 * Maya opens the hub: the album is still empty, the door asks for a password,
 * and tonight's checklist has the code left to send and two things worth
 * doing. Her Settings open on the door. A guest, Sam, holds the album open on
 * his phone and presses Add.
 *
 * ★ THE SAME FACTS IN EVERY FAMILY, so a frame differs from its neighbour by
 * the family alone. ★ NOTHING HERE IS A REAL PERSON, and every photograph is
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
  description: null,
  door: "password",
  visibility: "private",
  has_password: true,
  qr_token: "4f9c2a7e1b8d6c3f0a5e9d2b7c4a1f8e",
  qr_style: "classic",
});

export const JOIN_URL = `https://partyreel.com/e/${EVENT.qr_token}`;
export const PRETTY_URL = "https://partyreel.com/e/maya-and-jay";

/** Nobody in yet, nobody at the door: the party starts in an hour. */
export const COUNTS: DoorCounts = { ...NO_COUNTS, invited: 0 };

/**
 * TONIGHT'S CHECKLIST: the door is set (a password) and uploads are open, the
 * code was never opened (so it is the one thing a guest still needs), the
 * album is empty and the welcome unwritten (the two worth doing).
 */
export const READY: ReadyFacts = readyFacts({
  door: "password",
  hasPassword: true,
  eventDate: DATE,
  opened: 0,
  approved: 0,
  playable: 0,
  storagePct: 6,
});

/** The stills the album and the cover are cut from. */
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
