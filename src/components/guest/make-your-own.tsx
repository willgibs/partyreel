import Link from "next/link";
import { Aperture } from "lucide-react";

import { cn } from "@/lib/utils";

type Variant = "light" | "dark";

/**
 * The growth loop's CTA: a guest who sees how easy this was becomes the next host.
 * A small, tasteful pill linking to the marketing home. Brand color is used only as
 * the tiny mark (punctuation, per the globals.css design rule — never a splash).
 * `dark` renders on the always-dark gallery surface; `light` on default surfaces.
 * Directive-free so it works in both the server album page and the client uploader.
 */
export function MakeYourOwn({
  variant = "light",
  className,
}: {
  variant?: Variant;
  className?: string;
}) {
  return (
    <Link
      href="/"
      className={cn(
        "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
        variant === "dark"
          ? "border-white/15 text-gallery-muted hover:border-white/30 hover:text-gallery-foreground"
          : "border-border text-muted-foreground hover:text-foreground",
        className,
      )}
    >
      <span className="flex size-4 items-center justify-center rounded bg-brand text-brand-foreground">
        <Aperture className="size-3" />
      </span>
      Make your own Partyreel
    </Link>
  );
}
