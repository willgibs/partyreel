import "server-only";

import type { GuestListItem } from "@/components/social/guest-list";
import type { RowRhythm } from "@/components/shared/album-window-plan";
import { getEvent } from "@/lib/db/queries/events";
import type { GuestEvent } from "@/lib/db/queries/guest-events";
import {
  getGalleryStats,
  getHostAvatarSeed,
} from "@/lib/db/queries/guest-events-admin";
import { getEventGuestList } from "@/lib/db/queries/social";
import { albumWaits } from "@/lib/disposable/waiting.server";
import { pageDoor } from "@/lib/events/closed-door.server";
import { uploadsWait } from "@/lib/guest/upload-tracker";
import {
  resolveGalleryDecision,
  type GalleryDecision,
} from "@/lib/events/gallery-access";
import { streamGallerySeed } from "@/lib/events/gallery-access.server";
import type { GallerySeed } from "@/lib/events/gallery-seed";
import {
  guestAlbumOrder,
  shownSort,
  type GuestAlbumOrder,
} from "@/lib/shared/album-order";
import type { RowStep } from "@/lib/shared/album-rows";
import { getSiteUrl } from "@/lib/site-url";
import { splitGuestList, withAvatarUrls } from "@/lib/social/cards";

/**
 * SEE IT AS A GUEST: HER ALBUM AS A LET-IN GUEST MEETS IT, READ FOR HER (event-header r2, `rooms=over`; Will: "As a
 * guest screen is a really cool idea").
 *
 * ★ A TRUE GUEST'S READ, NEVER THE OWNER'S. The host's session is the owner everywhere: the guest page asks whether
 * she is (`isRequestOwner`) and answers her with the owner's album (her own uploads hers to delete, the reel's owner
 * extras, no door), and every SQL home exempts her from the seal (`e.host_id = auth.uid()`). So this read never asks
 * that question of what it shows:
 *   - the album's contents are the guests' own reads (`streamGallerySeed`: the service role with the seal's app half,
 *     `unsealedFilter`, and approved items only, so no held, hidden or sealed shot is in it whoever asks), behind the
 *     door's own pass, which the door issues to whoever it lets through (her, as the host) and nothing else forges;
 *   - what a guest may see is the decision for a guest past every step (`letInGuestDecision`: never the owner, the
 *     password known, an email confirmed, a photo added), so a gated album reads as a guest let in reads it;
 *   - nothing of hers rides it: no list of her own uploads, no follow card, no name step.
 *
 * ★ IT WRITES NOTHING AND MINTS NOTHING. No visit is counted (`recordLinkHit` is the guest page's alone, and her
 * Views would count her own look), no ticket is read or written, no claim is made; the one write anywhere under it is
 * the album's own develop when one is due (`developIfDue`), which any guest's first read runs, so the album she sees
 * is the one they would.
 *
 * Proved first, the way every hub read is: `getEvent` through RLS answers only her own live event (null for one gone,
 * never hers, or no id at all), and only then is the door asked.
 */

export type AsGuestRead = {
  /** The album as the door shows it to someone it let in. Its pass never leaves the server (it is stripped here). */
  event: GuestEvent;
  /** The permanent link (the code, Invite, the reel's plate). */
  joinUrl: string;
  /** The album's first paint, streamed: the guests' own seed, laid in the order a guest's album opens in. */
  galleryPromise: Promise<GallerySeed>;
  /**
   * The order a guest's album opens in (album-order, event-zone): the guest page's own answer, its turn read in the
   * party's zone and handed on as an instant, so the view lays the album as a guest who never chose meets it.
   */
  albumOrder: GuestAlbumOrder;
  /**
   * The cover's counts, as a guest's are counted (the album's approved total, THE ONE COUNT of guests), and what the album
   * holds by kind (`getGalleryStats`'s `kinds`), so the cover's count names it from the first byte (crumbs-88).
   */
  stats: {
    approvedTotal: number;
    guestCount: number;
    kinds?: { photos: number; videos: number } | null;
  };
  /** The byline's face, as the guest page resolves it (never the host's raw id). */
  host: { avatarUrl: string | null; seed: string | null } | null;
  /** The named Guests section under the album, as a guest reads it. */
  guests: GuestListItem[];
  /** Only me: nobody but her gets in, so every guest meets the shut door. */
  shut: boolean;
  /**
   * Whether anything waits in an album still empty to the eye (`albumWaits`), known before the first paint as the guest
   * page knows it, so the cover's Add says a newcomer's words from the first byte, never "the first photo" over shots
   * that wait.
   */
  waitingOnArrival: boolean;
  /**
   * The party's zone (`events.time_zone`) for words only, as the guest page hands its own (`PartyZoneContext`): a far
   * party's develop time is said in both clocks. Null where it has none, and every time is then her own clock.
   */
  partyZone: string | null;
};

/**
 * What a guest past every step of the door and the album's own gates gets: never the owner's answer (the resolver
 * answers the owner first, so `isOwner` is false here by construction, and a test holds it).
 */
export function letInGuestDecision(
  event: Pick<
    GuestEvent,
    | "visibility"
    | "require_verified_email"
    | "require_upload_to_view"
    | "accepting_uploads"
  >,
): GalleryDecision {
  return resolveGalleryDecision(event, {
    isOwner: false,
    isAuthed: true,
    isUnlocked: true,
    hasContributed: true,
    canContribute: event.accepting_uploads,
  });
}

export async function readAsGuest(
  eventId: string,
  firstPaint: {
    step: RowStep;
    rhythm: RowRhythm;
    seed: number;
    width: number | null;
  },
): Promise<AsGuestRead | null> {
  // Hers, live, and an id at all (`getEvent` answers a malformed one null before any read).
  const hosted = await getEvent(eventId);
  if (!hosted) return null;
  // The door's own resolution of this request: her, as the host, let through with its pass (what the album's
  // reads ask for behind a gate). Anything else is no album to show.
  const door = await pageDoor(hosted.qr_token);
  if (!door || door.decision.kind !== "through") return null;
  const event = door.event;
  const siteUrl = await getSiteUrl();
  const joinUrl = `${siteUrl.replace(/\/+$/, "")}/e/${event.qr_token}`;
  // ★ ONLY ME SHUTS EVERYONE BUT HER: no guest is let in to read, so a guest's view is the shut door.
  const shut = event.door === "private";
  const decision = letInGuestDecision(event);
  // ★ THE ORDER A GUEST'S ALBUM OPENS IN (album-order, event-zone; the ROADMAP's "hands LiveGallery no order"): the
  // guest page's own answer, its turn at 9 am the morning after in the party's zone (her row's own, read through RLS
  // above), so after the turn she sees the night in order as every guest does. Nobody here chose an order, so the
  // turn's own is the one shown, and the seed links the first paint of it.
  const albumOrder = guestAlbumOrder({
    facts: {
      eventDate: event.event_date,
      eventEndDate: event.event_end_date ?? null,
      developsAt: event.develops_at ?? null,
    },
    zone: hosted.time_zone,
    chosen: null,
  });
  const galleryPromise = shut
    ? Promise.resolve<GallerySeed>({ kind: "locked" })
    : streamGallerySeed(event, decision, {
        ...firstPaint,
        sort: shownSort(albumOrder),
      });

  const [stats, hostAvatar, entries] = await Promise.all([
    shut
      ? Promise.resolve({ approvedTotal: 0, guestCount: 0 })
      : getGalleryStats(event),
    !shut && event.host_display_name?.trim()
      ? getHostAvatarSeed(event.id)
      : Promise.resolve(null),
    // The named Guests section is the album's at full access (a person the host blocked is on no list).
    !shut && decision.access === "full"
      ? getEventGuestList(event.id, { includeUnverified: true })
      : Promise.resolve([]),
  ]);
  const { cards, unverified } = splitGuestList(entries);
  const guests = [...(await withAvatarUrls(cards)), ...unverified];
  // ★ ANYTHING WAITING IN AN ALBUM STILL EMPTY TO THE EYE, ASKED AS THE GUEST PAGE ASKS IT (crumbs-43's
  // `waitingOnArrival`, crumbs-86): only where it decides the Add's words (full access, uploads open, an album whose
  // uploads wait, nothing visible yet), so the first byte already says what the live source would say a moment later.
  const waitingOnArrival =
    !shut &&
    decision.access === "full" &&
    event.accepting_uploads &&
    uploadsWait(event).waits &&
    stats.approvedTotal === 0
      ? await albumWaits(event.id)
      : false;

  return {
    // ★ THE PASS NEVER LEAVES THE SERVER (the guest page's own rule): it is the proof the album's reads ask for,
    // issued to this request alone, and a client holds nothing it could present.
    event: { ...event, doorPass: null },
    joinUrl,
    galleryPromise,
    albumOrder,
    stats,
    host: hostAvatar
      ? { avatarUrl: hostAvatar.avatarUrl, seed: hostAvatar.seed }
      : null,
    guests,
    shut,
    waitingOnArrival,
    // Her row's own zone, read through RLS above; a lock hides nothing from her, and Only me shows no time at all.
    partyZone: shut ? null : (hosted.time_zone ?? null),
  };
}
