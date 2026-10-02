/**
 * THE CREDIT'S FACE AND DOOR, RESOLVED (crumbs-38; ROADMAP: "the viewer's credit takes a face and a door from an
 * `uploaderFace` (`avatarUrl`, `seed` from `seedFor`, `href` `/u/<slug>`)"). The one precedence rule names whose face
 * an upload's credit would wear (`resolveUploaderIdentity`'s `faceOwner`: the host, or a proved name's standing
 * account); this turns that owner into the face a credit draws, server-side, for a surface that shows faces.
 *
 * ★ A GUEST LEARNS NOTHING THE ALBUM DID NOT ALREADY SHOW HER (profiles-social.md's consent line: "a door only to a
 * page its owner published, a face only where the album already shows one, never an address"):
 *   - a FACE is the person's photograph and colour exactly as the album's own Guests list and "Hosted by" byline
 *     paint them (`withAvatarUrls`, `getHostAvatarSeed`): the avatar's public URL and `seedFor`'s hash, never a storage
 *     path and never an account id;
 *   - a DOOR is `/u/<slug>` only where a handle published a page (a profile is public by existence);
 *   - ★ a person the event BLOCKED is on no list and in no count (`event_blocked_guest_ids`), so on the guest's view a
 *     photograph of theirs the host restored keeps the plain disc and no door: its name, as before, and nothing more;
 *   - no address: nothing here reads one, and the face has no field for one.
 * The host's own viewer and Review take every confirmed sender's face, blocked or not: the host's look already shows
 * the host the person (`credit-look.tsx`), and the host blocked them knowingly.
 *
 * ★ A FACE IS A COURTESY, NEVER A GATE. A failed read here leaves the plain disc (captured), never a failed album:
 * the links answer the window whether or not a face could be read.
 *
 * ★ A FACE IS READ BY ACCOUNT, NOT BY MEDIA: the attribution read already carries each upload's account id (the
 * rule's own input), so one read of the window's distinct people (`profiles` by primary key, two columns) and, when
 * the host's own uploads are in it, the host's, never a second read of the window's media.
 */
import "server-only";

import { seedFor } from "@/lib/avatar/seed";
import { getBlockedGuestIds } from "@/lib/db/queries/event-blocks";
import { inChunks } from "@/lib/db/read-all";
import { mustQuery } from "@/lib/db/must-query";
import type {
  UploaderFace,
  UploaderIdentity,
} from "@/lib/media/uploader-identity";
import { captureError } from "@/lib/observability/sentry";
import { createAdminClient } from "@/lib/supabase/admin";
import { getAvatarUrl } from "@/lib/supabase/avatar-storage";
import type { RequestAuth } from "@/lib/supabase/request-auth";

/** Who is looking: a guest of the album (the consent line applies), or its host. */
export type FaceViewer = "guest" | "host";

/** Her own name and face, as her own uploads wear them on her own page. */
export type OwnCredit = { name: string | null; face: UploaderFace | null };

/**
 * HER OWN FACE, ON HER OWN PAGE (crumbs-45; build 36's red-team: "the owner's feed viewer credits his own upload
 * with a '?' disc"). Her Uploads feed marks her own events' uploads `isHost` (the confirm's words), and a host's
 * credit wears the byline's face everywhere else; there the host is the caller, so those uploads wear her own name
 * and face, read from her own row through her own client (`profiles_select_own`, no admin read for one's self):
 * her photograph and `seedFor`'s colour, and no name means no face, by the rule's case 1. NO DOOR: she is already
 * on her page. A courtesy, never a gate: a failed read leaves the plain credit, captured.
 */
export async function ownUploadCredit(auth: RequestAuth): Promise<OwnCredit> {
  const { supabase, user } = auth;
  if (!user) return { name: null, face: null };
  try {
    const row = await mustQuery(
      supabase
        .from("profiles")
        .select("display_name, avatar_updated_at")
        .eq("id", user.id)
        .maybeSingle(),
      "faces: own profile",
    );
    const name = row?.display_name?.trim() || null;
    if (name === null) return { name: null, face: null };
    return {
      name,
      face: {
        avatarUrl: await getAvatarUrl(user.id, row?.avatar_updated_at ?? null),
        seed: seedFor(user.id),
        href: null,
      },
    };
  } catch (error) {
    captureError("media", error, { seam: "own_upload_credit_fail_open" });
    return { name: null, face: null };
  }
}

type ProfileFace = { slug: string | null; avatarMarker: string | null };

/** One person's face, from their account id and their profile's two columns. */
async function faceOf(
  accountId: string,
  profile: ProfileFace,
): Promise<UploaderFace> {
  return {
    avatarUrl: await getAvatarUrl(accountId, profile.avatarMarker),
    seed: seedFor(accountId),
    href: profile.slug ? `/u/${encodeURIComponent(profile.slug)}` : null,
  };
}

/** The identity as a mapper reads it: the name, the flags, the address where it had one, the face. Never the owner. */
function withFace(
  who: UploaderIdentity,
  face: UploaderFace | null,
): UploaderIdentity {
  return {
    displayName: who.displayName,
    email: who.email,
    isHost: who.isHost,
    isVerified: who.isVerified,
    face,
  };
}

/**
 * These identities with their faces resolved for `viewer` (keyed as given: by media id). Every identity comes back,
 * its `faceOwner` replaced by its `face` (null where it has none, or where a read failed), so the account id the
 * rule carried never travels further than this function.
 */
export async function withUploaderFaces(
  eventId: string,
  identities: ReadonlyMap<string, UploaderIdentity>,
  viewer: FaceViewer,
): Promise<Map<string, UploaderIdentity>> {
  const accounts = new Set<string>();
  let anyHost = false;
  for (const who of identities.values()) {
    if (who.faceOwner?.kind === "account")
      accounts.add(who.faceOwner.accountId);
    else if (who.faceOwner?.kind === "host") anyHost = true;
  }

  let profiles = new Map<string, ProfileFace>();
  let host: { id: string; face: ProfileFace } | null = null;
  let blocked: ReadonlySet<string> = new Set();
  try {
    const admin = createAdminClient();
    const [rows, hostRow, blockedRows] = await Promise.all([
      accounts.size > 0
        ? inChunks(
            "faces: profiles",
            [...accounts],
            async (chunk) =>
              (await mustQuery(
                admin
                  .from("profiles")
                  .select("id, slug, avatar_updated_at")
                  .in("id", chunk),
                "faces: profiles",
              )) ?? [],
          )
        : Promise.resolve([]),
      anyHost
        ? mustQuery(
            admin
              .from("events")
              // Pinned to its foreign key: a junction table between events and profiles
              // (profile_shown_events) makes a bare `profiles(...)` embed ambiguous.
              .select(
                "host_id, profiles!events_host_id_fkey(slug, avatar_updated_at)",
              )
              .eq("id", eventId)
              .maybeSingle(),
            "faces: host",
          )
        : Promise.resolve(null),
      viewer === "guest" && accounts.size > 0
        ? getBlockedGuestIds(eventId)
        : Promise.resolve(new Set<string>()),
    ]);
    profiles = new Map(
      rows.map((p) => [
        p.id,
        { slug: p.slug, avatarMarker: p.avatar_updated_at },
      ]),
    );
    const hostProfile = hostRow?.profiles as {
      slug: string | null;
      avatar_updated_at: string | null;
    } | null;
    if (hostRow?.host_id && hostProfile) {
      host = {
        id: hostRow.host_id,
        face: {
          slug: hostProfile.slug,
          avatarMarker: hostProfile.avatar_updated_at,
        },
      };
    }
    blocked = blockedRows;
  } catch (error) {
    // The plain disc for everyone in this window, and a captured failure: a face never fails the album.
    captureError("media", error, { seam: "uploader_faces_fail_open", eventId });
    return new Map(
      [...identities].map(([id, who]) => [id, withFace(who, null)]),
    );
  }

  const out = new Map<string, UploaderIdentity>();
  await Promise.all(
    [...identities].map(async ([id, who]) => {
      const owner = who.faceOwner ?? null;
      let face: UploaderFace | null = null;
      if (owner?.kind === "host" && host) {
        face = await faceOf(host.id, host.face);
      } else if (owner?.kind === "account" && !blocked.has(owner.guestId)) {
        const profile = profiles.get(owner.accountId);
        if (profile) face = await faceOf(owner.accountId, profile);
      }
      out.set(id, withFace(who, face));
    }),
  );
  return out;
}
