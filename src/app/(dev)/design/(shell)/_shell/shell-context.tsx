"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { createContext, useContext } from "react";

import { withDesignKey } from "@/lib/design-gate/links";

import type { Nav } from "@/app/(dev)/design/_data/catalog";

/**
 * WHAT EVERY PIECE OF CHROME READS (the Library x Lab round, 2026-09-15): the
 * nav (built server-side by _data/nav.ts, handed down as props) and the gate
 * key (from the URL; layouts cannot see searchParams, so the provider reads it
 * with useSearchParams inside the layout's Suspense boundary). `LabLink` is
 * the only way the chrome links anywhere: it keeps the key on every internal
 * href, fragment included.
 */
type ShellValue = { nav: Nav; key: string | null };

const Ctx = createContext<ShellValue>({ nav: [], key: null });

export function ShellProvider({
  nav,
  children,
}: {
  nav: Nav;
  children: React.ReactNode;
}) {
  const key = useSearchParams().get("key");
  return <Ctx.Provider value={{ nav, key }}>{children}</Ctx.Provider>;
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

export function LabLink({
  href,
  ...rest
}: Omit<React.ComponentProps<typeof Link>, "href"> & { href: string }) {
  const to = useKeyed();
  return <Link href={to(href)} {...rest} />;
}
