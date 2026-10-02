import { randomInt } from "node:crypto";

import type { Metadata } from "next";
import { cookies, headers } from "next/headers";
import { z } from "zod";
import { after } from "next/server";

import { DOOR_MAIN } from "@/components/guest/door/door-page";
import { ShutDoor } from "@/components/guest/door/shut-door";
import { EventExperience } from "@/components/guest/event-experience";
import {
  ALBUM_WIDTH_COOKIE,
  parseAlbumWidth,
} from "@/components/shared/album-window-plan";
import { GuestHeader } from "@/components/guest/guest-header";
import { ClaimAsk } from "@/components/shared/claim-ask";
import {
  GuestList,
  GUEST_LIST_FACES_THRESHOLD,
} from "@/components/social/guest-list";
import { isLikelyBot } from "@/lib/analytics/bots";
import { recordLinkHit } from "@/lib/db/mutations/analytics";
import {
  listAccountMediaIds,
  listOwnerMediaIds,
} from "@/lib/db/mutations/guest-media";
import {
  getGalleryStats,
  getHostAvatarSeed,
  getOpenAlbumItemForCard,
} from "@/lib/db/queries/guest-events-admin";
import type { GuestEvent } from "@/lib/db/queries/guest-events";
import { getProfileMenu } from "@/lib/db/queries/profile";
import {
  getEventGuestList,
  getHostCard,
  getMyFollowing,
  isFollowing,
} from "@/lib/db/queries/social";
import { splitGuestList, withAvatarUrls } from "@/lib/social/cards";
import { isDemoToken } from "@/lib/demo";
import {
  doorGalleryDecision,
  resolveGalleryDecision,
} from "@/lib/events/gallery-access";
import { pageDoor } from "@/lib/events/closed-door.server";
import { isRequestOwner } from "@/lib/events/gallery-access-owner.server";
import {
  resolveViewerDecision,
  streamGallerySeed,
} from "@/lib/events/gallery-access.server";
import { isUnlocked } from "@/lib/events/unlock-cookie";
import {
  EVENT_CARD_ALT,
  EVENT_CARD_SIZE,
  eventCardPath,
  privateEventCardPath,
} from "@/lib/guest/event-card";
import { doorArrival } from "@/lib/guest/entry-steps";
import { readGuestSessionCookie } from "@/lib/guest/session-cookie";
import { welcomeSeenIn } from "@/lib/guest/use-welcome-seen-cookie";
import { hasWaitingUploads } from "@/lib/guest/waiting-on-arrival.server";
import { PHOTO_PARAM, readPhotoParam } from "@/lib/media/share-save";
import { presignDownload } from "@/lib/r2/presign";
import {
  resolveRowStep,
  TILE_SIZE_COOKIE,
} from "@/lib/shared/tile-size-cookie";
import { getSiteUrl } from "@/lib/site-url";
import { getRequestAuth } from "@/lib/supabase/request-auth";
import { needsDisplayName } from "@/lib/welcome";

import { notFoundMetadata } from "./not-found.metadata";
import { GuestNotFoundScreen } from "./not-found.screen";

// Event state + gallery are read per request via the qr_token RPCs.
export const dynamic = "force-dynamic";

// The qr_token is an opaque capability — noindex (don't index join links), but emit OG
// so a pasted link previews. Visibility decides what leaks: a PRIVATE event reveals
// nothing (generic title); a PASSWORD event shows its NAME (it's link-shared, the name
// isn't the secret) but no description; OPEN gets the full unfurl, one invitation for
// every open event whatever its identity switch (below). The IMAGE is the event's own
// card (`/e/<token>/card`), or, for a link to one photograph on an album anyone may open,
// that photograph (`photoCard` below). ★ EVERY SHUT DOOR gets the private event's metadata
// (a block, a decline, a closed door and Only me alike, `closed-door.server.ts`): the tab's
// title is as much the door as the page is. ★ AND THE PRIVATE ALBUM'S CARD, never the
// event's own: every closed door names `privateEventCardPath` (generic by its address),
// because the event's card answers the event's own visibility to everyone (the edge shares
// it), so an open event's is named, and naming it here would tell her what the door hides.
export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}): Promise<Metadata> {
  const { token } = await params;
  const door = await pageDoor(token);
  // ★ A LINK THAT NAMES NOTHING IS TITLED AS THE NOT-FOUND IT IS, "Event not found" and noindex (build 28's
  // red-team: this branch said "Join event"). The not-found's own metadata (`not-found.metadata.ts`), so the two
  // never disagree. The page answers it at 200 (a soft 404, below), so this noindex is all that keeps a dead link
  // out of an index.
  if (!door) return notFoundMetadata;
  if (door.decision.kind === "shut") {
    return {
      title: "Private event",
      robots: { index: false },
      openGraph: { images: [privateCardImage(token)] },
      twitter: {
        card: "summary_large_image",
        images: [privateCardImage(token)],
      },
    };
  }

  const event = door.event;
  // ★ A GATED ALBUM UNFURLS AS A PASSWORD ALBUM DOES: its name, and no invitation to add photos (the
  // door stands first). Its image is the private album's card, since the card route answers the
  // event's own door to everyone and a gated album reads there as private (the safe side).
  const gated = event.visibility === "private";
  const card = gated ? privateCardImage(token) : eventCardImage(event.qr_token);
  if (event.visibility === "password" || gated) {
    const title = event.name;
    return {
      title,
      robots: { index: false, follow: false },
      openGraph: {
        title,
        url: `/e/${event.qr_token}`,
        type: "website",
        images: [card],
      },
      twitter: { card: "summary_large_image", title, images: [card] },
    };
  }

  // ★ A PASTED LINK INVITES, IT DOES NOT WARN: every open event unfurls the same
  // invitation, never a line announcing its email step in the group chat. Leaving
  // the warning out is a trade made WITH ITS COST IN VIEW: more taps, and a share
  // of guests bounce at the email step. Do NOT hedge this back toward a warning:
  // an event that requires a verified email still gates the guest after the tap,
  // and that cost was weighed, not missed. The gate itself is honest where it
  // happens, at the entry modal's account step.
  const description = "Photos and videos from the day. Add yours.";

  const photo = await photoCard(event, (await searchParams)[PHOTO_PARAM]);
  if (photo) {
    const title = `A photo from ${event.name}`;
    return {
      title,
      description,
      robots: { index: false, follow: false },
      openGraph: {
        title,
        description,
        url: `/e/${event.qr_token}`,
        type: "website",
        images: [photo],
      },
      twitter: {
        card: "summary_large_image",
        title,
        description,
        images: [photo],
      },
    };
  }

  const title = `Add photos to ${event.name}`;
  return {
    title,
    description,
    robots: { index: false, follow: false },
    openGraph: {
      title,
      description,
      url: `/e/${event.qr_token}`,
      type: "website",
      images: [card],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [card],
    },
  };
}

/** The event's own card (the route beside this page draws it). */
function eventCardImage(qrToken: string) {
  return cardImage(eventCardPath(qrToken));
}

/** The private album's card, by the address the visitor arrived on: every closed door names it. */
function privateCardImage(token: string) {
  return cardImage(privateEventCardPath(token));
}

function cardImage(url: string) {
  return { url, ...EVENT_CARD_SIZE, alt: EVENT_CARD_ALT, type: "image/png" };
}

const photoIdSchema = z.uuid();

/**
 * ★ ONE PHOTOGRAPH'S LINK CARD: `/e/<token>?photo=<id>` (the media viewer's own address for a
 * photograph) unfurls as that photograph, titled "A photo from <event>", its preview presigned here
 * on the server. Only where the link alone opens the whole album: an OPEN event with no email or
 * upload gate an anonymous visitor would meet (an unfurler IS an anonymous visitor), so a gated
 * album keeps the event card. An id that is malformed, unknown, held, hidden or another event's
 * keeps the event card too, with no sign it exists. A video unfurls as its poster, or as the event
 * card when it has none (a player file is no image).
 */
async function photoCard(
  event: GuestEvent,
  raw: string | string[] | undefined,
): Promise<{
  url: string;
  width?: number;
  height?: number;
  alt: string;
} | null> {
  // The viewer's own reading of the address (share-save.ts), so the card and the viewer answer the
  // same links; then the column's own type, since a malformed id must never reach the query as an
  // error (every media id is a uuid).
  const value = Array.isArray(raw) ? raw[0] : raw;
  const shaped = value
    ? readPhotoParam(`?${PHOTO_PARAM}=${encodeURIComponent(value)}`)
    : null;
  const parsed = photoIdSchema.safeParse(shaped);
  if (!parsed.success) return null;
  const anonymous = resolveGalleryDecision(event, {
    isOwner: false,
    isAuthed: false,
    isUnlocked: false,
    hasContributed: false,
    canContribute: event.accepting_uploads,
  });
  if (anonymous.access !== "full") return null;
  const item = await getOpenAlbumItemForCard(event, parsed.data);
  if (!item) return null;
  const key =
    item.previewKey ?? (item.type === "photo" ? item.originalKey : null);
  if (!key) return null;
  try {
    const url = await presignDownload({ key, stable: true });
    return {
      url,
      ...(item.width && item.height
        ? { width: item.width, height: item.height }
        : {}),
      alt: `A photo from ${event.name}`,
    };
  } catch {
    // A failed presign keeps the event's own card: a link preview is never worth an error page.
    return null;
  }
}

// The unified guest EVENT page — a scanned QR lands here. The opaque qr_token IS the
// capability (database-security.md). State is a function of the door, then the album's own gates:
//   shut                 → the shut screen (no name/gallery/upload), an early return here; someone
//                          the invite list does not name reads it too, with her own ask
//   waiting / ask / a gate's newcomer
//                        → EventExperience renders the door's step via the entry modal, over nothing
//                          real (access `none`)
//   password / account   → EventExperience renders the gate via the entry modal; an unsatisfied gate
//                          resolves to access `none` (locked backdrop) or `teaser` (capped preview)
//   open + anon / full   → header + action row (save / invite) + upload + live gallery
// (accepting_uploads off → view-only: the upload panel is gone, leaving the action row +
//  a "uploads closed" line + the gallery. EventExperience handles that layout branch.)
export default async function GuestEventPage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  /** Next always hands it; optional so a test that renders the page needs no address. */
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { token } = await params;

  // ★ THE DOOR DECIDES FIRST (the doors, event-settings r1; `closed-door.server.ts`): who this
  // request is at this album's door, from the account and this browser's ticket, and the event as
  // the door lets them meet it. Missing or deleted is the not-found (don't leak existence).
  //
  // ★ AND THIS PAGE DRAWS IT ITSELF, NEVER THROUGH `notFound()` (stale-link). A `notFound()` thrown
  // while a page renders is served as Next's error shell: an empty body until the script has run,
  // so a stale QR code on a cold phone was a white page for six seconds (Slow 4G, 4x CPU), and for a
  // reader with no script for good. Drawn here it is in the HTML, the segment's own screen in the
  // same layout, at 200 and noindex: a soft 404 (gone-link-soft). Next gives a page no status of its
  // own, and the 404 the proxy once set before this rendered was answered on Vercel with the site's
  // /404, never this screen (marketing-content.md, "The 404 pages").
  // The screen itself, never the not-found's lazy boundary: this page reaches every client part of it
  // already (through the shut door), so a found album's HTML stays byte for byte, where importing the
  // boundary widened two references on every album load.
  const door = await pageDoor(token);
  if (!door) return <GuestNotFoundScreen />;
  const event = door.event;
  // Read above the shut door's return: a pure check of the qr_token alone,
  // and GuestHeader wants it on EVERY branch (the Demo mark).
  const isDemo = isDemoToken(event.qr_token);

  // Record-on-view: count this QR/join-link visit (aggregate, no PII). Bot-filtered
  // at ingest and deferred via after() so it never blocks the guest. Success path
  // only — and NOT in generateMetadata (which also runs for unfurls/prefetch).
  const userAgent = (await headers()).get("user-agent");
  if (!isLikelyBot(userAgent)) {
    after(() => recordLinkHit(event.id, "qr_scan"));
  }

  // ★ THE SHUT DOOR: one screen for every newcomer turned away (an Only me album, a closed door, a
  // decline, a block: event-safety `newcomer=same`), with one line more for someone who was in
  // (locked-door `previous=private`: the host made it private). An account or confirmed address the
  // event blocked, and a ticket a block holds, meet it word for word (Will's "Sneaky block"), with
  // the same work (`closed-door.server.ts`).
  //
  // ★ IT IS THE DOORWAY, SHUT (`door/shut-door.tsx`, locked-door r2's `family=doorway`): the door the
  // welcome and the wait stand at, with the light under it. It keeps the REAL GuestHeader (not the
  // failure bar): this render holds a live qr_token and event id, so the header can resolve a session
  // and a returning host meets their own menu.
  //
  // ★ SOMEONE THE INVITE LIST DOES NOT NAME meets it too, with her own foot (`locked-door` r2 places
  // `unlisted=ask` there): "Ask Maya to let me in", or "Use a different email". The message above it
  // names nothing whoever reads it (Will, 2026-10-02: the door shows only what is shown today); the
  // ask names the host she asks, as it always has.
  const unlistedAsk =
    door.decision.kind === "ask" && door.decision.gate === "invite";
  // ★ WHERE THE DOOR'S LIGHT STARTS ITS TURN (locked-door r3, `idle=turn`: "rather than being a static
  // predictable color every time"): a fresh place on the rainbow per visit, drawn here so the first paint and
  // the hydration agree (`doorway.css`'s `--door-phase`).
  const doorPhase = randomInt(1000) / 1000;
  if (door.decision.kind === "shut" || unlistedAsk) {
    const { user } = await getRequestAuth();
    return (
      <div data-guest-page="" className="flex min-h-full flex-1 flex-col">
        <GuestHeader
          qrToken={event.qr_token}
          eventId={event.id}
          isDemo={isDemo}
        />
        <main className={DOOR_MAIN}>
          <ShutDoor
            previous={door.decision.kind === "shut" && door.decision.previous}
            signedIn={Boolean(user)}
            phase={doorPhase}
            returnTo={`/e/${event.qr_token}`}
            ask={
              unlistedAsk
                ? {
                    qrToken: event.qr_token,
                    hostName: event.host_display_name,
                  }
                : null
            }
          />
        </main>
      </div>
    );
  }

  // ★ THE DOOR'S OWN ANSWER, where it holds the request (the held door, the ask, a newcomer's email
  // step), with nothing real behind it; otherwise the album's own gates decide below. `admitted` is
  // the door's word that this request is already past it, which passes the password without it.
  const doorDecision = doorGalleryDecision(door.decision);
  const admitted = door.decision.kind === "through" && door.decision.admitted;
  const doorGate =
    door.decision.kind === "newcomer" ? door.decision.gate : null;

  // Password unlock state, feeding the access resolution + the entry modal's password step. The
  // password gate is not a full-page early-return: the entry modal (in EventExperience)
  // owns it, so a not-yet-unlocked password event resolves to access `none` (a locked backdrop with
  // the modal over it). Someone already in passes it without the password (the one rule for everyone
  // already in).
  const unlocked =
    event.visibility === "password"
      ? admitted || (await isUnlocked(event.id))
      : true;

  // Open, or password + unlocked. Resolve this viewer's gallery ACCESS (none/teaser/full) and load
  // exactly that much media server-side, so the withheld set never reaches the browser (the gated-
  // gallery security core). The album's routes (`/api/album/guest/{sync,media,manifest}`) re-resolve
  // the SAME decision on every ask, so the poll and the links enforce what the page did.
  const siteUrl = await getSiteUrl();
  // Canonical (qr_token) link for the in-page share + the media poll, never the slug the guest may
  // have arrived on (the media RPC + downstream RPCs match qr_token only).
  const joinUrl = `${siteUrl.replace(/\/+$/, "")}/e/${event.qr_token}`;

  // Auth state for the gate (+ the name nudge). Skipped for the demo (always full, never gates). We
  // run getUser() for EVERY non-private event (not just the accepting-uploads path): the gate must
  // know whether the viewer is signed in. For the anonymous majority it's a cheap local null, and the
  // owner select runs ONLY when signed in. Authorize with getUser(), never getSession().
  //
  // ★ THE OWNER IS ASKED THE WAY THE ALBUM'S READS ASK (`isRequestOwner`, one answer per render):
  // the page and its seed can never disagree about the host. They did, and it crashed the host's
  // own password album (build 10): the page let the owner in, the seed's cookie-only gate refused.
  let isAuthed = false;
  let isOwner = false;
  let userId: string | null = null;
  if (!isDemo) {
    const { user } = await getRequestAuth();
    if (user) {
      userId = user.id;
      isAuthed = Boolean(user.email_confirmed_at);
      isOwner = await isRequestOwner(event.id);
    }
  }
  /* ──────────────────────────────────────────────────────────────────────
     THE DECISION, AND THE COOKIE THAT LETS THE SERVER MAKE IT. Require an
     upload to view is enforced here, not in the browser, so the render has to
     know WHICH guest is asking: the `pr_guest_<eventId>` cookie carries that
     session token, because an RSC cannot read the localStorage copy. A guest
     whose browser holds a token but no cookie yet (a session minted before the
     cookie existed) resolves as uncontributed for exactly one render, and
     `EventExperience`'s heal POSTs the poll once with the stored token before
     the arrival beat to true it up.
     ────────────────────────────────────────────────────────────────────── */
  const cookieSessionToken = isDemo
    ? null
    : await readGuestSessionCookie(event.id);
  // `withAlbumFull`: the page is the one reader of the album's fullness (the
  // lightbox's last-removal line), so it alone pays the gate's second read.
  const decision = isDemo
    ? { access: "full" as const, gate: null, albumFull: false }
    : doorDecision
      ? { ...doorDecision, albumFull: false }
      : await resolveViewerDecision(
          event,
          {
            isOwner,
            isAuthed,
            isUnlocked: unlocked,
            userId,
            sessionToken: cookieSessionToken,
          },
          { withAlbumFull: true },
        );
  const access = decision.access;
  /* ────────────────────────────────────────────────────────────────────────
     THE ALBUM'S FIRST PAINT, DECIDED BEFORE ANY BYTE: the density step the
     shared `pr_tile_size` cookie holds (a returning guest's pick), the width
     the album last laid its rows at (`pr_album_w`, which makes that width's
     class exact: nothing on the first screen moves at hydration), and the
     visit's seed for the rhythm's feature rows (a fresh draw per visit, held
     by the album for the visit). The seed loader lays the first paint with all
     three, so the links it embeds are exactly the tiles the first paint draws.
     ──────────────────────────────────────────────────────────────────────── */
  const cookieJar = await cookies();
  const rowStep = resolveRowStep(cookieJar.get(TILE_SIZE_COOKIE)?.value);
  const albumWidth = parseAlbumWidth(cookieJar.get(ALBUM_WIDTH_COOKIE)?.value);
  const rhythmSeed = randomInt(1_000_000);
  // Deliberately NOT awaited: the album's seed (the manifest and the first
  // paint's links) streams in behind the shell, which paints first; the live
  // gallery resolves it inside its Suspense boundary. ★ Streamed through
  // `streamGallerySeed`, never a bare `loadGallerySeed`: a seed that fails while
  // the reads below are still awaited must never be an unhandled rejection.
  const galleryPromise = streamGallerySeed(event, decision, {
    step: rowStep,
    rhythm: "double",
    seed: rhythmSeed,
    width: albumWidth,
  });

  // Header stats: cheap awaited read (numbers only — never identities).
  // For a LOCKED password event this still returns counts: the entry tease
  // (the sheet says "N photos are waiting"; the header shows name only).
  // Its media count is the same request-scoped head count the gallery payload
  // carries (`countApprovedMedia`), so the header's seed and the gallery's
  // first report are one number.
  //
  // ★ NO REEL READ HERE: the live reel stores nothing, and its facts ride the
  // gallery payload itself (`reel`, gallery-reel.ts), streamed with the album
  // rather than awaited in the shell.
  //
  // A GUEST'S OWN PHOTOGRAPHS ride alongside them (a guest can delete any photo
  // they personally uploaded, with no time limit). For a
  // SIGNED-IN viewer the answer is here: one indexed read of the media ids
  // whose guest row belongs to this account in this event. Never a client
  // claim, and deliberately NOT in the gallery payload or its ETag — that
  // fingerprint is per ACCESS and shared between viewers, while this list is
  // per person. The ANONYMOUS half cannot be answered here at all: that
  // identity is a session token in the browser's own storage, so LiveGallery
  // asks `/api/guests/mine` for it. Skipped at access `none` (there is nothing
  // rendered to remove) and in the demo (nothing there is real).
  // ★ THE ALBUM'S OWNER IS NEVER HER OWN GUEST (crumbs-32): her own here are the
  // host's uploads, no guest row behind them, so hers is the host's read, and
  // each Delete goes to her Deleted, as the hub's would.
  const [stats, canDeleteIds] = await Promise.all([
    getGalleryStats(event),
    userId && !isDemo && access !== "none"
      ? isOwner
        ? listOwnerMediaIds(event.id)
        : listAccountMediaIds({ eventId: event.id, userId })
      : Promise.resolve<string[]>([]),
  ]);

  // LOCKED REDACTION (the name-only rule): at access `none` the page must
  // reveal the event NAME + media COUNT only, and props serialize into the RSC
  // flight payload whether or not the UI renders them - so blank the host name
  // + description + DATE (and skip the avatar read) BEFORE they reach the
  // client. The date is in the redaction because the entry welcome's byline
  // would otherwise show it on a locked page.
  //
  // ★ THE DOOR SHOWS ONLY WHAT IT SHOWED (Will, 2026-10-02, on `locked-door` r2's doorway: "Only what's
  // shown today"). A DOOR THAT ANSWERS TO THE HOST NAMES THE HOST: the held door, the ask and the email
  // step where the host lets each guest in or a list keeps say who lets her in ("Maya will let you in"),
  // and their welcome's byline names her (with no date); a password step names nobody; the shut door
  // names nothing (above). The door's own re-read gives a gate the album's name and its host
  // (`closed-door.server.ts`).
  //
  // ★ AND THE DOOR'S PASS NEVER LEAVES THE SERVER: it is the proof the album's own
  // reads ask for, issued to this request alone (`lib/event/door/pass.server.ts`).
  const shellEvent: GuestEvent =
    access === "none"
      ? {
          ...event,
          host_display_name: doorDecision ? event.host_display_name : null,
          description: null,
          event_date: null,
          // The slug is only ever said by the reel's code plate, which a locked page never draws.
          custom_slug: null,
          doorPass: null,
        }
      : { ...event, doorPass: null };

  // Host avatar + seed for the "Hosted by" byline: a server-side admin read so host_id stays off the
  // client (only the presigned URL and the one-way hash are passed down — `seedFor`).
  // Gated on a set name, since the byline hides without one, so this is a no-op for nameless-host
  // events (an event with no set host name has no byline to colour either).
  const hostAvatar = shellEvent.host_display_name?.trim()
    ? await getHostAvatarSeed(event.id)
    : null;
  const hostAvatarUrl = hostAvatar?.avatarUrl ?? null;
  const hostSeed = hostAvatar?.seed ?? null;

  // The named Guests section (profiles-social.md): ONLY at full access (a teaser viewer
  // hasn't finished the gate; a locked page reveals name + count only), never in
  // the demo. It is ALWAYS ON (Will, event-safety `room=always`): no host key to
  // read, and a person the host blocked is on no list. Composed HERE as a slot:
  // EventExperience is a client island and must never receive storage markers,
  // only hydrated public avatar URLs.
  let guestListSlot: React.ReactNode = null;
  if (access === "full" && !isDemo) {
    // ★ NAME-ONLY GUESTS ARE ON IT, listed with the unverified mark. They
    // arrive after the profile cards as
    // `{ kind: "unverified" }` entries, which `withAvatarUrls` must not touch:
    // there is no avatar and no seed to resolve for a name nobody proved.
    const guestList = await getEventGuestList(event.id, {
      includeUnverified: true,
    });
    if (guestList.length > 0) {
      // The union splits before hydration (lib/social/cards.ts owns why): only a
      // profile card has an avatar to resolve, and the unverified half rejoins
      // as-is, after it, in the query's own order.
      const { cards, unverified } = splitGuestList(guestList);
      const items = [...(await withAvatarUrls(cards)), ...unverified];
      // Above the threshold the list condenses to a row of faces that says
      // "N guests added photos" itself, so the heading drops its pill: the
      // number renders once.
      const listSaysCount = items.length > GUEST_LIST_FACES_THRESHOLD;
      // A Follow on somebody else's chip, only where it is not a no-op: one
      // owner-scoped read, and only for a signed-in viewer.
      const followingIds = userId
        ? new Set((await getMyFollowing()).map((f) => f.id))
        : undefined;
      guestListSlot = (
        <section aria-label="Guests" className="mt-10 space-y-3">
          <h2 className="flex items-center gap-1.5">
            <span className="text-label font-semibold text-muted-foreground uppercase">
              Guests
            </span>
            {!listSaysCount && (
              <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-muted px-1 text-[10px] font-semibold text-muted-foreground tabular-nums">
                {items.length}
              </span>
            )}
          </h2>
          <GuestList
            items={items}
            viewerId={userId}
            followingIds={followingIds}
          />
        </section>
      );
    }
  }

  // The host as a public card, for the capture flow's follow moment. Only where
  // it can be acted on: a full-access, non-demo album with a host to follow.
  // ★ AND WHETHER SHE FOLLOWS THEM, read beside it (crumbs-28): the moment's
  // Follow started on Follow for a guest who already follows the host. One
  // head count, for a signed-in guest alone (nobody signed out follows anyone,
  // and the host is never her own guest); the keep's code typed in place
  // refreshes the page, so this render knows who confirmed.
  const hostCard =
    access === "full" && !isDemo ? await getHostCard(event.id) : null;
  const followsHost =
    hostCard && userId && !isOwner ? await isFollowing(hostCard.id) : false;

  // Display-name nudge: a SIGNED-IN viewer without a public display name is asked for one at the
  // DOOR, as its name step in `profile` mode, rather than in an inline card halfway down the album.
  //
  // ★ COMPUTED AT `teaser` TOO, so never narrow this to `access === "full"`. A confirmed account
  // held at the UPLOAD step resolves `teaser`, and the door still has to know whether to ask them
  // their name on the way past: a full-only check would answer "they have one" and skip it.
  let needsName = false;
  if (isAuthed && userId && event.accepting_uploads && access !== "none") {
    const menu = await getProfileMenu(userId);
    needsName = needsDisplayName(menu.displayName);
  }

  // ★ HER WAITING UPLOADS ON AN EMPTY HELD ALBUM, KNOWN BEFORE THE FIRST PAINT (crumbs-43): the album's one Add is
  // the row's while something of hers waits for the host, and her tracker learns an earlier visit's waiting rows
  // only after mount, so the page asks here, where it decides anything (`waiting-on-arrival.server.ts` says why).
  const waitingOnArrival =
    !isDemo &&
    !isOwner &&
    access === "full" &&
    event.accepting_uploads &&
    event.moderation_mode === "hold_for_approval" &&
    stats.approvedTotal === 0
      ? await hasWaitingUploads({
          eventId: event.id,
          userId,
          ticket: cookieSessionToken,
        })
      : false;

  // ★ THE OWNER ARRIVING FOR HER REEL (`?reel`, the hub's Reel card's door): the page says so before
  // any script runs, so the album's shell stands the reel's black from the first byte rather than the
  // album flashing under a view still loading (`event-experience.tsx`'s curtain). The owner alone: she
  // never owes the door, where a guest's welcome comes first and the reel waits behind it.
  // The parameter is `reel-url.ts`'s `REEL_PARAM`, spelled here because that module is the client's (a
  // server import of it would be a client reference, not the string).
  const reelAsked =
    isOwner && !isDemo && (await searchParams)?.reel !== undefined;

  /* ★ THE FIRST BYTE IS THE DOOR (door-reveal; Will's live walk: "entered the address, full guest album was
     visible before gate appeared over it (big bug)", and his rule: "the album is never visible before any
     door/gate that should be encountered first"). The page decides what a newcomer meets before any script
     runs: the welcome's flag is a cookie now, so a newcomer at a Public album gets the welcome's open door in
     this very HTML (the album laid out under it, inert, its words held), every gate its door at rest, and a
     sheet step that comes first the door's scrim over the album; a returning guest who owes nothing gets her
     album at once (`doorArrival`, `entry-steps.ts`). Never for the owner, who meets no door. */
  const welcomeSeen = !isDemo && welcomeSeenIn(cookieJar, event.qr_token);
  const arrival = doorArrival({
    gate: decision.gate,
    access,
    isOwner,
    isDemo,
    welcomeSeen,
    isVerified: isAuthed,
    needsName,
    ticketHeld: Boolean(cookieSessionToken),
    uploadsOpen: event.accepting_uploads,
    requireUpload: event.require_upload_to_view,
    hasContributed: event.require_upload_to_view
      ? decision.gate !== "upload"
      : false,
  });

  return (
    // `data-guest-page`: while the door stands as the page over the album, the page holds to one screen
    // (`door/doorway.css`'s stage rules), so nothing scrolls past the door.
    <div data-guest-page="" className="flex min-h-full flex-1 flex-col">
      {/* event.qr_token, NOT the raw `token` route param: `token` may be a
          CUSTOM SLUG, and the header's sign-out clears the stored session by
          this key while EventExperience below reads it by the canonical
          qr_token. Mismatched keys meant sign-out on a slug URL removed a key
          that was never written, leaving the previous guest's upload
          capability live on a shared phone. ★ Past the door the album's
          cover stands under it, and the header stands on the photograph
          (`over`); a door that is the page keeps today's paper bar, the
          welcome's included (the album only waits under it). */}
      <GuestHeader
        qrToken={event.qr_token}
        eventId={event.id}
        isDemo={isDemo}
        over={access !== "none" && arrival.face === null}
      />
      <EventExperience
        event={shellEvent}
        qrToken={event.qr_token}
        joinUrl={joinUrl}
        galleryPromise={galleryPromise}
        stats={stats}
        isDemo={isDemo}
        access={access}
        gate={decision.gate}
        needsName={needsName}
        hostAvatarUrl={hostAvatarUrl}
        hostSeed={hostSeed}
        isOwner={isOwner}
        doorGate={doorGate}
        guestListSlot={guestListSlot}
        canDeleteIds={canDeleteIds}
        isAuthed={Boolean(userId)}
        // Identity keys on a CONFIRMED account, never a uid alone: an
        // unconfirmed session still carries a typed name.
        isVerified={isAuthed}
        hostCard={
          hostCard
            ? { ...hostCard, seed: hostSeed, following: followsHost }
            : null
        }
        initialRowStep={rowStep}
        firstPaintWidth={albumWidth}
        rhythmSeed={rhythmSeed}
        albumFull={decision.albumFull}
        waitingOnArrival={waitingOnArrival}
        reelAsked={reelAsked}
        welcomeSeen={welcomeSeen}
        arrival={arrival}
        doorPhase={doorPhase}
      />
      {/* ★ WHAT THIS PHONE'S CLAIM WOULD NOT TAKE IN SILENCE (shared-claims): a ticket typed under a
          name at odds with the account, asked about once the door and its sheets are down
          (`claim-ask.tsx`). Beside the album's own claim (EventExperience's `useConfirmReturn`), so
          never in the demo, and never for the album's host, who is no guest here. */}
      {!isDemo && !isOwner && <ClaimAsk />}
    </div>
  );
}
