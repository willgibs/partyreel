import { type ComponentProps } from "react";

import { cn } from "@/lib/utils";

// The ONE source for app PAGE titles (Dashboard, Settings, Account, event name, admin pages).
// Renders the brand heading face via the `font-heading` utility = Urbanist 700 + -0.03em tracking
// (globals.css). This is the PAGE tier of the heading scale: card/section titles are CardTitle
// (Urbanist 600), per-setting labels stay Inter 500 (FormLabel). Three clear levels.
//
// Do NOT add `font-semibold` (it would drop the 700 to 600) or `tracking-tight` (our theme zeroes
// --tracking-tight, which would CANCEL the utility's -0.03em). Size rides via className (twMerge
// wins) - e.g. the event-name hero passes `text-3xl`.
export function PageHeading({ className, ...props }: ComponentProps<"h1">) {
  return <h1 className={cn("font-heading text-2xl", className)} {...props} />;
}
