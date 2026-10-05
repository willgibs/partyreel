import Link from "next/link";

import { SITE_URL } from "@/lib/constants/site";
import { servesApp } from "@/lib/surface";
import { cn } from "@/lib/utils";

/**
 * The acceptance line ("browsewrap"): the one sentence that ties a sign-in or
 * a guest's entry to /terms and /privacy. It shipped on /login alone; the
 * legal round put it on the guest door too, so
 * both surfaces read from one component and cannot drift.
 *
 * `newTab` is for the guest entry modal: a guest mid-entry who taps Terms must
 * not lose the sheet they were standing in.
 *
 * ★ NEITHER LINK PREFETCHES (compute-levers): the line stands in every guest's
 * door, so its two prefetches were up to eleven requests a join (a prefetch is
 * one per route segment), for pages almost nobody opens, and in the door's new
 * tab a prefetch is never used at all.
 *
 * ★ THE ADMIN DEPLOYMENT SERVES NEITHER PAGE (crumbs-81). It is an allow-list
 * (`src/lib/surface`: the portal, its sign-in and little else), so a relative
 * `/terms` on admin.partyreel.com is a 404, and its sign-in carries this very
 * line. Where the deployment does not serve the app, the links are the app's own
 * pages (`SITE_URL`, the one canonical origin), in a new tab: they leave the
 * host, and a sign-in in the middle of a code must survive the read. Everywhere
 * else they stay relative, so a preview or a local build keeps to itself.
 */
const LINK =
  "underline underline-offset-4 transition-colors duration-150 hover:text-foreground";

export function LegalConsentLine({
  className,
  newTab = false,
}: {
  className?: string;
  newTab?: boolean;
}) {
  const away = !servesApp();
  const origin = away ? SITE_URL : "";
  const external =
    newTab || away ? ({ target: "_blank", rel: "noopener" } as const) : {};
  return (
    <p className={cn("text-xs text-muted-foreground", className)}>
      By continuing you agree to our{" "}
      <Link
        href={`${origin}/terms`}
        prefetch={false}
        className={LINK}
        {...external}
      >
        Terms
      </Link>{" "}
      and{" "}
      <Link
        href={`${origin}/privacy`}
        prefetch={false}
        className={LINK}
        {...external}
      >
        Privacy Policy
      </Link>
      .
    </p>
  );
}
