/**
 * WHAT A SEND WOULD TAKE (`GET /api/drive/preview?events=<id,...>&hidden=1`): the final press's facts before she
 * presses (each album's originals and their bytes, how many are new to her Drive, an earlier send's day, a send under
 * way), read in one statement (`cloud_export_preview`: her Download panel's Originals over what she can read). Albums
 * not hers, or in Deleted, are simply absent. At most 50 an ask.
 */
import { NextResponse } from "next/server";

import { z } from "zod";

import { MAX_ALBUMS_A_PRESS } from "@/lib/drive/press";
import { previewAlbums } from "@/lib/db/queries/drive";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ids = z.array(z.uuid()).min(1).max(MAX_ALBUMS_A_PRESS);

export async function GET(request: Request) {
  const url = new URL(request.url);
  const parsed = ids.safeParse(
    (url.searchParams.get("events") ?? "").split(",").filter(Boolean),
  );
  if (!parsed.success)
    return NextResponse.json(
      { ok: false, code: "bad_request" },
      { status: 400 },
    );
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json(
      { ok: false, code: "unauthorized" },
      { status: 401 },
    );

  const { albums } = await previewAlbums({
    userId: user.id,
    eventIds: parsed.data,
    includeHidden: url.searchParams.get("hidden") === "1",
  });
  return NextResponse.json(
    { ok: true, albums: Object.fromEntries(albums) },
    { headers: { "Cache-Control": "private, no-store" } },
  );
}
