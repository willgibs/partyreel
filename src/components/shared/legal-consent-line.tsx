import Link from "next/link";

import { cn } from "@/lib/utils";

/**
 * The acceptance line ("browsewrap"): the one sentence that ties a sign-in or
 * a guest's entry to /terms and /privacy. It shipped on /login alone; the
 * legal round put it on the guest door too, so
 * both surfaces read from one component and cannot drift.
 *
 * `newTab` is for the guest entry modal: a guest mid-entry who taps Terms must
 * not lose the sheet they were standing in.
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
  const external = newTab
    ? ({ target: "_blank", rel: "noopener" } as const)
    : {};
  return (
    <p className={cn("text-xs text-muted-foreground", className)}>
      By continuing you agree to our{" "}
      <Link href="/terms" className={LINK} {...external}>
        Terms
      </Link>{" "}
      and{" "}
      <Link href="/privacy" className={LINK} {...external}>
        Privacy Policy
      </Link>
      .
    </p>
  );
}
