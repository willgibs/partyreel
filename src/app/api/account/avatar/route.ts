import { NextResponse } from "next/server";

import { captureError } from "@/lib/observability/sentry";
import { createAdminClient } from "@/lib/supabase/admin";
import { removeAvatar, uploadAvatar } from "@/lib/supabase/avatar-storage";
import { createClient } from "@/lib/supabase/server";
import {
  AVATAR_CONTENT_TYPE,
  AVATAR_MAX_BYTES,
  isWebp,
} from "@/lib/validation/avatar";

// The Supabase admin client + cookie auth need Node; this route reads auth cookies, uploads the
// avatar object, and writes the marker.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Account avatar upload / remove.
//
// The avatar is cropped + re-encoded to a small webp CLIENT-side, POSTed here as the raw blob,
// validated (content-type + size + magic bytes), and uploaded to a DETERMINISTIC per-user object
// in the Supabase Storage `avatars` bucket (<id>/avatar.webp) that overwrites in place — so
// replacing an avatar can never orphan the old one. The bytes bypass create_media entirely
// (avatars are account metadata, not event media: no storage-cap accounting, no ledger).
//
// profiles.avatar_updated_at is the existence marker. It is SERVICE-ROLE-write-only, so it's
// written here via the admin client AFTER the object lands — keeping the marker in lockstep with
// the stored object (the route is the only thing that touches both).

async function getAuthedUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

const UNAUTHORIZED = NextResponse.json(
  { ok: false, code: "unauthorized", message: "Sign in to update your photo." },
  { status: 401 },
);

export async function POST(request: Request) {
  const user = await getAuthedUser();
  if (!user) return UNAUTHORIZED;

  // Only ever accept/store webp (canvas raster output → no SVG/XSS surface). Tolerate a
  // charset suffix / casing, but nothing other than image/webp.
  const contentType = (request.headers.get("content-type") ?? "")
    .split(";")[0]
    .trim()
    .toLowerCase();
  if (contentType !== AVATAR_CONTENT_TYPE) {
    return NextResponse.json(
      {
        ok: false,
        code: "unsupported_type",
        message: "Avatar must be a WebP image.",
      },
      { status: 415 },
    );
  }

  // Fast reject on the declared length before buffering (the header can lie — re-checked below).
  const declared = Number(request.headers.get("content-length"));
  if (Number.isFinite(declared) && declared > AVATAR_MAX_BYTES) {
    return NextResponse.json(
      { ok: false, code: "too_large", message: "That image is too large." },
      { status: 413 },
    );
  }

  const bytes = new Uint8Array(await request.arrayBuffer());
  // Authoritative checks on the ACTUAL bytes: non-empty, within cap, and really a WebP.
  if (
    bytes.byteLength === 0 ||
    bytes.byteLength > AVATAR_MAX_BYTES ||
    !isWebp(bytes)
  ) {
    return NextResponse.json(
      {
        ok: false,
        code: "invalid_image",
        message: "We couldn't process that image.",
      },
      { status: 422 },
    );
  }

  try {
    // 1) Object first — the deterministic path overwrites any existing avatar in place.
    await uploadAvatar(user.id, bytes);
    // 2) Then flip the marker (service-role), only once the object is durably stored.
    const { error } = await createAdminClient()
      .from("profiles")
      .update({ avatar_updated_at: new Date().toISOString() })
      .eq("id", user.id);
    if (error) throw error;
  } catch (err) {
    captureError("account", err, { op: "avatar_upload" });
    return NextResponse.json(
      {
        ok: false,
        code: "server_error",
        message: "Couldn't save your photo. Try again.",
      },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE() {
  const user = await getAuthedUser();
  if (!user) return UNAUTHORIZED;

  try {
    // Object FIRST, then the marker — this ordering is the zero-orphan rule. removeAvatar treats
    // an absent object as success (idempotent). If we cleared the marker first and the delete
    // failed, the object would be orphaned: avatars live in their own Storage bucket the media
    // cron never touches.
    await removeAvatar(user.id);
    const { error } = await createAdminClient()
      .from("profiles")
      .update({ avatar_updated_at: null })
      .eq("id", user.id);
    if (error) throw error;
  } catch (err) {
    captureError("account", err, { op: "avatar_remove" });
    return NextResponse.json(
      {
        ok: false,
        code: "server_error",
        message: "Couldn't remove your photo. Try again.",
      },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true });
}
