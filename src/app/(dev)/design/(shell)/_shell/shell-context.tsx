"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";

import type { Nav } from "@/app/(dev)/design/_data/catalog";
import type { SearchIndex } from "@/app/(dev)/design/_data/search";
import {
  carryLabState,
  type LabParam,
  type LabState,
  labSearchString,
  readLabState,
  withLabParam,
} from "@/app/(dev)/design/_data/state";

/**
 * WHAT EVERY PIECE OF CHROME READS (the Library x Lab round, 2026-09-15): the
 * nav and the search index (both built server-side by _data/nav.ts and handed
 * down as props), the live URL state, and the palette's latch.
 *
 * Layouts cannot see searchParams, so the state is read here with
 * useSearchParams inside the layout's Suspense boundary. `LabLink` is the only
 * way the chrome links anywhere: it carries the sticky params (the key, the
 * canvas, the ground) onto every internal href, fragment included, and the
 * page-local ones only when the link stays on this page (_data/state.ts).
 */
type ShellValue = {
  nav: Nav;
  index: SearchIndex;
  state: LabState;
  pathname: string;
  paletteOpen: boolean;
  setPaletteOpen: (open: boolean) => void;
};

const EMPTY: ShellValue = {
  nav: [],
  index: [],
  state: {},
  pathname: "/design",
  paletteOpen: false,
  setPaletteOpen: () => {},
};

const Ctx = createContext<ShellValue>(EMPTY);

export function ShellProvider({
  nav,
  index,
  children,
}: {
  nav: Nav;
  index: SearchIndex;
  children: React.ReactNode;
}) {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const [paletteOpen, setPaletteOpen] = useState(false);
  // searchParams is a new object every render; the string is the real identity,
  // so the state object (and every keyed href built from it) stays stable.
  const search = searchParams.toString();
  const state = useMemo(() => readLabState(search), [search]);
  const value = useMemo(
    () => ({ nav, index, state, pathname, paletteOpen, setPaletteOpen }),
    [nav, index, state, pathname, paletteOpen],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useNav(): Nav {
  return useContext(Ctx).nav;
}

export function useSearchIndex(): SearchIndex {
  return useContext(Ctx).index;
}

export function useDesignKey(): string | null {
  return useContext(Ctx).state.key ?? null;
}

/** The whole URL state: what a board's controls and the review session read. */
export function useLabState(): LabState {
  return useContext(Ctx).state;
}

export function usePalette(): {
  open: boolean;
  setOpen: (open: boolean) => void;
} {
  const { paletteOpen, setPaletteOpen } = useContext(Ctx);
  return { open: paletteOpen, setOpen: setPaletteOpen };
}

/**
 * Sets one state param on the CURRENT url without a navigation entry, so a
 * board's switch is shareable and the back button still means "the last page"
 * rather than "the last time you flipped a candidate". `null` removes it.
 */
export function useSetLabParam(): (
  name: LabParam,
  value: string | null,
) => void {
  const router = useRouter();
  const { state, pathname } = useContext(Ctx);
  return useCallback(
    (name: LabParam, value: string | null) => {
      const next = withLabParam(state, name, value);
      router.replace(`${pathname}${labSearchString(next)}`, { scroll: false });
    },
    [router, state, pathname],
  );
}

/** `to("/design/lab/palette#ramp")` keyed and stated for this view. */
export function useKeyed(): (href: string) => string {
  const { state, pathname } = useContext(Ctx);
  return useCallback(
    (href: string) => carryLabState(href, state, pathname),
    [state, pathname],
  );
}

export function LabLink({
  href,
  ...rest
}: Omit<React.ComponentProps<typeof Link>, "href"> & { href: string }) {
  const to = useKeyed();
  return <Link href={to(href)} {...rest} />;
}
