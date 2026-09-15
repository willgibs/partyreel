"use client";

import Link from "next/link";
import { createContext, useContext } from "react";

import { withDesignKey } from "@/lib/design-gate/links";

import type { Nav } from "@/app/(dev)/design/_data/catalog";

/**
 * WHAT EVERY PIECE OF CHROME READS (the Library x Lab round, 2026-09-15): the
 * nav (built server-side by _data/nav.ts, handed down as props) and the gate
 * key (forwarded by the proxy as a request header and read by the layout, so
 * no client hook and no Suspense boundary is involved: with one around the
 * page, a keyless request streamed the layout's props under a 200). `LabLink`
 * is the only way the chrome links anywhere: it keeps the key on every
 * internal href, fragment included.
 */
type ShellValue = { nav: Nav; key: string | null };

const Ctx = createContext<ShellValue>({ nav: [], key: null });

export function ShellProvider({
  nav,
  designKey,
  children,
}: {
  nav: Nav;
  designKey: string | null;
  children: React.ReactNode;
}) {
  return (
    <Ctx.Provider value={{ nav, key: designKey }}>{children}</Ctx.Provider>
  );
}

export function useNav(): Nav {
  return useContext(Ctx).nav;
}

export function useDesignKey(): string | null {
  return useContext(Ctx).key;
}

/** `to("/design/lab/palette#ramp")` keyed for this session. */
export function useKeyed(): (href: string) => string {
  const key = useDesignKey();
  return (href) => withDesignKey(href, key);
}

/**
 * No viewport prefetch by default (the Library x Lab round, 2026-09-15): the
 * sidebar alone holds about twenty-five links, every lab route is dynamic
 * (the docs reader runs at request time), and Next prefetches a dynamic
 * route's shell WITHOUT its search params, so each prefetch was a keyless
 * request the proxy gate 404s: twenty-five server renders and twenty-five
 * console errors per page load, for nothing. Hover prefetch still applies.
 */
export function LabLink({
  href,
  prefetch = false,
  ...rest
}: Omit<React.ComponentProps<typeof Link>, "href"> & { href: string }) {
  const to = useKeyed();
  return <Link href={to(href)} prefetch={prefetch} {...rest} />;
}
