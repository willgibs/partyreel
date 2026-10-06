import type { ReactNode } from "react";

import { DemoDoor as DemoDoorLink } from "@/components/marketing/system/demo-modal/demo-door";
import { DEMO_EVENT_URL } from "@/lib/demo";

import { InlineCode } from "./spec-shared";

/**
 * THE HELP LANE'S MDX COMPONENTS. Components only help articles use go here;
 * the help track owns this file (docs/tracks). When the blog needs one too,
 * the Orchestrator promotes it to spec-shared.tsx at integration. Same rules
 * as the shared file: read a real constant, never type a number, render the
 * bare number and let the prose say the unit. The composer in
 * ../mdx-components.tsx refuses a name that already exists in another file.
 */

/**
 * `<DemoDoor>partyreel.com/demo</DemoDoor>`: the demo's address as a DEMO DOOR (`system/demo-modal/`), the one
 * handle every pointer to the demo wears: at a desk the modal (the code to scan, the demo one press away), on a phone
 * the demo in a new tab. An article that names the demo is one press from it, never an address to retype. The words
 * stay the article's, so the address a reader may say aloud is still the one they see.
 *
 * ★ NO DEMO CONFIGURED, NO DOOR (the `DemoCtaLink` contract): the address falls back to the value plate it was
 * (`InlineCode`), so the article never promises a link that opens nothing.
 */
function DemoDoor({ children }: { children: ReactNode }) {
  if (!DEMO_EVENT_URL) return <InlineCode>{children}</InlineCode>;
  return (
    <DemoDoorLink href={DEMO_EVENT_URL} source="help-article">
      {children}
    </DemoDoorLink>
  );
}

export const helpComponents = { DemoDoor };
