import type { Metadata } from "next";

import { HOME_SECTIONS } from "@/components/marketing/sections/home";

// Home keeps the default "Partyreel" title (no template) and inherits the root
// SITE_DESCRIPTION (the ruled thesis register, single-sourced in site.ts);
// only the canonical is declared here.
export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

// The 13-section made-from arc (T2.5 Call 2 + Will's 2026-08-25 order ruling).
// sections/home/index.ts is the ONE source of the order (Vitest-pinned via
// section-ids.ts); this page just maps it, so reshuffling is an index edit.
export default function MarketingHome() {
  return (
    <>
      {HOME_SECTIONS.map(({ id, Component }) => (
        <Component key={id} />
      ))}
    </>
  );
}
