import type { Metadata } from "next";

import { requireDesignKey } from "@/lib/design-gate/server";

import {
  choiceOf,
  groundOf,
  momentOf,
  pageOf,
  viewOf,
  widthOf,
} from "../model";

import { SceneRoot } from "./scene-root";

/**
 * THE IDENTITY BOARD'S SCENE ROUTE: the document every one of its frames
 * loads, a set and a working state (`?set=&loading=`), then
 * `&view=&moment=&w=&ground=&page=&id=` (built by `sceneSrc`, `model.ts`).
 *
 * It renders bare (the design root layout carries no chrome; the lab's lives
 * in `(shell)`), so the frame is the page and nothing else. Gated like every
 * lab route, and never linked: the board builds the address with the key it
 * was opened with. It leaves with the board's folder.
 */
export const metadata: Metadata = {
  title: "Identity scene",
  robots: { index: false, follow: false },
};

export default async function IdentityScenePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireDesignKey(searchParams);
  const params = await searchParams;
  const one = (key: string): string | undefined => {
    const v = params[key];
    return typeof v === "string" ? v : undefined;
  };
  return (
    <SceneRoot
      choice={choiceOf({ set: one("set"), loading: one("loading") })}
      view={viewOf(one("view"))}
      moment={momentOf(one("moment"))}
      w={widthOf(one("w"))}
      ground={groundOf(one("ground"))}
      page={pageOf(one("page"))}
      id={one("id") ?? ""}
    />
  );
}
