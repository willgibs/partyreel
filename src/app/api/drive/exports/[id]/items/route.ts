/**
 * WHAT A SEND COULD NOT TAKE (`GET /api/drive/exports/<id>/items?state=failed|skipped&after=<media id>`): the two lists
 * she might want ("2 couldn't be sent: which?", "3 left the album while sending"), a page of 100 at a time on a
 * keyset (never cut at PostgREST's 1,000). Hers through her own RLS read first, else a 404; the items themselves are
 * deny-all, read here on the service role for exactly her send. Each line is the name her Drive would have given it.
 */
import { NextResponse } from "next/server";

import { z } from "zod";

import { readMySend, readSendItems } from "@/lib/db/queries/drive";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const querySchema = z.object({
  state: z.enum(["failed", "skipped"]),
  after: z.uuid().optional(),
});

const PAGE = 100;

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const url = new URL(request.url);
  const parsed = querySchema.safeParse({
    state: url.searchParams.get("state"),
    after: url.searchParams.get("after") ?? undefined,
  });
  if (!z.uuid().safeParse(id).success || !parsed.success) {
    return NextResponse.json(
      { ok: false, code: "bad_request" },
      { status: 400 },
    );
  }
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json(
      { ok: false, code: "unauthorized" },
      { status: 401 },
    );
  const send = await readMySend(id);
  if (!send)
    return NextResponse.json({ ok: false, code: "not_found" }, { status: 404 });

  const items = await readSendItems({
    jobId: id,
    state: parsed.data.state,
    after: parsed.data.after ?? null,
    limit: PAGE,
  });
  return NextResponse.json(
    {
      ok: true,
      items: items.map((i) => ({ name: i.name, reason: i.reason })),
      next: items.length === PAGE ? items[items.length - 1]!.mediaId : null,
    },
    { headers: { "Cache-Control": "private, no-store" } },
  );
}
