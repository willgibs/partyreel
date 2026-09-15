import type { Metadata } from "next";

import { requireDesignKey } from "@/lib/design-gate/server";

import { SCREEN_GROUNDS, SCREENS, type ScreenId } from "../screen-ids";
import { ScreenPage } from "../screens";

/**
 * THE ROUNDING BOARD'S SCREEN ROUTE: one app surface, alone, in a document of
 * its own.
 *
 * The board mounts it in an iframe laid out at exactly 1440x930 or 375x760, so
 * the composition inside is at a real viewport: its own Tailwind breakpoints
 * resolve against the canvas rather than the browser, radix panels portal into
 * the canvas rather than over the lab, and `position: fixed` means the canvas.
 * screens.tsx carries the long why; the short version is that the app surfaces
 * a radius has to survive cannot be judged inside a div.
 *
 * Gated like every lab route and never linked: the board builds the URL with
 * the key it was opened with.
 */

export const metadata: Metadata = {
  title: "Rounding screen",
  robots: { index: false, follow: false },
};

function one(
  params: Record<string, string | string[] | undefined>,
  key: string,
): string | undefined {
  const v = params[key];
  return typeof v === "string" ? v : undefined;
}

const IDS = SCREENS.map((s) => s.id) as readonly string[];
const GROUNDS = SCREEN_GROUNDS;

export default async function RoundingScreenRoute({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireDesignKey(searchParams);
  const params = await searchParams;
  const raw = one(params, "screen");
  const screen = (IDS.includes(raw ?? "") ? raw : "dashboard") as ScreenId;
  const rawGround = one(params, "ground");
  const ground = (
    GROUNDS.includes((rawGround ?? "") as (typeof GROUNDS)[number])
      ? rawGround
      : "app-light"
  ) as string;
  return <ScreenPage screen={screen} ground={ground} />;
}
