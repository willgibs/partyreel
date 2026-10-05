/**
 * THE ALBUMS SHE CAN SEND (`GET /api/drive/albums?hidden=1`, Your events' picker; Will's desk-2 `doors = both`): her
 * live hosted albums, newest first, each with what a send would take and what is new to her Drive (the stage's album
 * included, which Your events' own list leaves to the stage). Her events through her own session (RLS, `host_id`),
 * the sizes in one statement (`cloud_export_preview`). The newest 200.
 */
import { NextResponse } from "next/server";

import { mustQuery } from "@/lib/db/must-query";
import { previewAlbums } from "@/lib/db/queries/drive";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const NEWEST = 200;

export async function GET(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json(
      { ok: false, code: "unauthorized" },
      { status: 401 },
    );

  // Her newest 200 live albums, the picker's whole list (a planner past it sends the rest from each album).
  const events = await mustQuery(
    supabase
      .from("events")
      .select("id, created_at")
      .eq("host_id", user.id)
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .limit(NEWEST),
    "drive: the albums she can send",
  );
  const ids = (events ?? []).map((e) => e.id);
  const { albums } = await previewAlbums({
    userId: user.id,
    eventIds: ids,
    includeHidden: new URL(request.url).searchParams.get("hidden") === "1",
  });
  return NextResponse.json(
    {
      ok: true,
      albums: ids.map((id) => albums.get(id)).filter(Boolean),
      more: ids.length === NEWEST,
    },
    { headers: { "Cache-Control": "private, no-store" } },
  );
}
