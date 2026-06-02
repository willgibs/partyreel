import { NextResponse } from "next/server";

import { deleteR2Objects } from "@/lib/r2/delete";
import { avatarObjectKey } from "@/lib/r2/keys";
import { putR2Object } from "@/lib/r2/put";
import { captureError } from "@/lib/observability/sentry";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import {
  AVATAR_CONTENT_TYPE,
  AVATAR_MAX_BYTES,
  isWebp,
} from "@/lib/validation/avatar";

// The AWS S3 SDK (R2) needs Node; this route also reads auth cookies + writes the marker.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Account avatar upload / remove.
//
// The avatar is cropped + re-encoded to a small webp CLIENT-side, POSTed here as the raw blob,
// validated (content-type + size + magic bytes), and PUT to a DETERMINISTIC per-user R2 key
// (avatars/<id>/avatar.webp) that overwrites in place — so replacing an avatar can never orphan
// the old one. The bytes bypass create_media entirely (avatars are account metadata, not event
// media: no storage-cap accounting, no ledger).
//
// profiles.avatar_updated_at is the existence marker. It is SERVICE-ROLE-write-only, so it's
// written here via the admin client AFTER the object lands — keeping the marker in lockstep
// with R2 (the route is the only thing that touches both).

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
    // 1) Object first — the deterministic key overwrites any existing avatar in place.
    await putR2Object({
      key: avatarObjectKey(user.id),
      body: bytes,
      contentType: AVATAR_CONTENT_TYPE,
    });
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
    // R2 FIRST, then the marker — this ordering is the zero-orphan rule. deleteR2Objects treats
    // an absent key as success (idempotent). If we cleared the marker first and the delete
    // failed, the object would be orphaned: the purge cron's media sweep never scans avatars/.
    await deleteR2Objects([avatarObjectKey(user.id)]);
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
