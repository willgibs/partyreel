"use client";

/**
 * THE 404'S TRAIL, LOADED WHEN A 404 IS DRAWN AND NOT BEFORE (crumbs-22). The root `not-found.tsx` is the one
 * place the trail is drawn, and Next puts a root 404's whole tree in EVERY route's payload: its client
 * references are preloaded on every page, and every stylesheet under it is preloaded too (crumbs-10 read the
 * "preloaded but not used" warning for `trail.css` on `/`, `/pricing`, `/help`, `/login` and `/about`). So the
 * 404 reaches the trail only through this wrapper, and the wrapper's `import()` is a real split because it
 * sits in a client module: Next does not split a dynamic import made from a Server Component (its
 * lazy-loading guide says so), which is why `not-found.tsx` cannot call `dynamic` itself.
 *
 * What is split off is the engine, the component and `trail.css`. The server still renders the stage and the
 * words (the trail's photographs were always drawn on the client, after a measurement), so the first paint,
 * the words and their links are what they were; the photographs arrive a chunk later and fade in as they
 * always did. `trail-lazy.test.ts` refuses a static import of the trail, or of any stylesheet, under the 404.
 * The Library's demos import `Trail` itself.
 */
import dynamic from "next/dynamic";
import type { ComponentProps } from "react";

import type { Trail } from "./trail";

const LazyTrail = dynamic(() => import("./trail").then((m) => m.Trail));

export function TrailLazy(props: ComponentProps<typeof Trail>) {
  return <LazyTrail {...props} />;
}
