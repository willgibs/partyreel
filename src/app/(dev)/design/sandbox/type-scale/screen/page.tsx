import type { Metadata } from "next";

import { requireDesignKey } from "@/lib/design-gate/server";

import { DashboardScreen } from "../screens";

/**
 * THE TYPE-SCALE BOARD'S SCREEN ROUTE: one app surface, alone, in a document
 * of its own, so a frame can load the app at a real viewport without a
 * sign-in. `screens.tsx` carries the long why.
 *
 * Gated like every lab route and never linked: the board builds the URL with
 * the key it was opened with.
 */

export const metadata: Metadata = {
  title: "Type scale screen",
  robots: { index: false, follow: false },
};

/** The ids this route answers to; the board's `COMPARED` list names them. */
const SCREENS = ["dashboard"] as const;

export default async function TypeScaleScreenRoute({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireDesignKey(searchParams);
  const params = await searchParams;
  const raw = typeof params.screen === "string" ? params.screen : "";
  const screen = (SCREENS as readonly string[]).includes(raw)
    ? raw
    : SCREENS[0];
  return screen === "dashboard" ? <DashboardScreen /> : null;
}
