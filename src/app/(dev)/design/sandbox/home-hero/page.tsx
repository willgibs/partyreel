import type { Metadata } from "next";

import { requireDesignKey } from "@/lib/design-gate/server";

import { HomeScene } from "./scene";
import { isStreamId, type StreamId } from "./stream-ids";

/**
 * THE HOME PAGE, WEARING A STREAM (round six, 2026-09-16): the board's viewport.
 *
 * ★ A CSS PASTE CANNOT SWAP A HERO. Every other board's frames load the real
 * route and write a candidate stylesheet into it, which is enough when the
 * ruling is a token, a radius or a ground. This ruling is a COMPOSITION: the
 * thing being judged is a different first screen, so there is nothing a sheet
 * could say. A route of its own is the only honest 1:1 surface, and this is it:
 * the real marketing chrome, the real cinema wrapper, the real fourteen sections
 * of `/` in the real order, with the hero swapped for the treatment. Its own
 * document means real breakpoints, real scroll, a real sticky header over the
 * hero and a real seam where the cinema chapter cuts to paper, none of which a
 * div on a board can give.
 *
 * ★ THE ONLY PARAM IS WHAT THE SCENE IS. The treatment also arrives as `lab:set`
 * so a knob never reloads the document (the kit's Frame, landmine 4); the param
 * is what seeds the FIRST paint, because a push lands an effect later and a
 * frame that painted the wrong stream for one frame is a frame that lies on a
 * board about which stream to ship.
 *
 * Gated like every lab route and never linked: the board builds the URL with the
 * key it was opened with. The (dev) design layout is deliberately thin, so a
 * sandbox route renders bare and this page owns its own chrome.
 */

export const metadata: Metadata = {
  title: "Home hero scene",
  robots: { index: false, follow: false },
};

export default async function HomeHeroScenePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireDesignKey(searchParams);
  const params = await searchParams;
  // ★ THE IDS COME FROM `stream-ids.ts`, NOT FROM `streams.ts`. This is a server
  // component and `streams.ts` reaches `CANVAS` through the lab's client barrel,
  // so every constant it exports is a client reference here and touching one is
  // a TypeError that takes the whole route down. The note is in stream-ids.ts.
  const raw = params.stream;
  const asked = typeof raw === "string" ? raw : undefined;
  const stream: StreamId = isStreamId(asked) ? asked : "band";
  return <HomeScene stream={stream} phone={params.w === "375"} />;
}
