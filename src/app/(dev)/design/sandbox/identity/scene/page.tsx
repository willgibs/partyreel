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
 * loads, the mix's seven traits and the edge
 * (`?field=&button=&focus=&selected=&press=&loading=&toggles=&edge=`), then
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
      choice={choiceOf({
        field: one("field"),
        button: one("button"),
        focus: one("focus"),
        selected: one("selected"),
        press: one("press"),
        loading: one("loading"),
        toggles: one("toggles"),
        edge: one("edge"),
      })}
      view={viewOf(one("view"))}
      moment={momentOf(one("moment"))}
      w={widthOf(one("w"))}
      ground={groundOf(one("ground"))}
      page={pageOf(one("page"))}
      id={one("id") ?? ""}
    />
  );
}
