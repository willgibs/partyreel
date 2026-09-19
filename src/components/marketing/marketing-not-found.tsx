import Link from "next/link";
import { Compass } from "lucide-react";

import { NotFoundScreen } from "@/components/shared/not-found-screen";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// The site/marketing 404 content (a lost visitor) — single-sourced so it can't drift
// between the THREE places it renders: the root app/not-found.tsx (UNMATCHED URLs, which fall
// through to the root layout with NO route-group chrome, so that file supplies its own
// header/footer) and the (cinema)/(paper) group not-found.tsx files (a notFound() thrown
// INSIDE a marketing route, where the group layout ALREADY renders the header/footer — so
// those files must NOT add chrome, or it double-stacks). Each caller wraps this with the
// centering right for its context. NotFoundScreen is SHARED with the guest/host boundaries:
// style AROUND it (icon choice, footnote content), never its internals.
export function MarketingNotFound({
  /**
   * ★ THE STRIP YIELDS WHERE THE TRAIL RUNS (the trail-wiring lane, 2026-09-19).
   * The root 404 now stands on the image trail Will ruled onto it
   * (`home=notfound`, 2026-09-19), and the strip says the same sentence in a
   * quieter voice: photographs, one of them missing. Two devices making one
   * point is noise, and the weaker of the two here is a row of grey placeholder
   * tiles sitting among real photographs, which reads as something still
   * loading. So the root 404 turns it off and the trail carries the idea. The
   * GROUP 404s keep it (a notFound() thrown inside a marketing route, dark or
   * paper, in a 60vh box that is nobody's whole screen and carries no trail),
   * and so do the 500 screen and the help palette that borrow it.
   *
   * ★ AND WHERE IT RUNS, IT RUNS ABOVE THE WORDS NOW (Will, `picture=today`
   * with his note, 2026-09-19): "it does look weird beneath the content. It may
   * look better as a replacement for the icon above. The page has one visual
   * image plus the image trail behind." So the strip is the screen's ONE
   * visual, standing where the Compass circle stood, and the footnote goes back
   * to being a line of words. `strip=false` (the root 404, which has the trail
   * behind it) keeps the Compass, and the union on NotFoundScreen's props makes
   * "both at once" unrepresentable rather than merely discouraged.
   */
  strip = true,
}: { strip?: boolean } = {}) {
  const picture = strip
    ? ({ visual: <MissingFrameStrip /> } as const)
    : ({ icon: Compass } as const);
  return (
    <NotFoundScreen
      // The marketing half, so the title takes the `prose` step and not the
      // app's `page` step (Will's type ruling, 2026-09-17). Declared, never
      // sniffed: the root 404 renders OUTSIDE (marketing), so [data-mkt] is
      // absent there and an ancestor selector would read it as the app.
      surface="marketing"
      {...picture}
      eyebrow="404"
      title="We lost this page"
      description="The link may be broken or the page may have moved. Let us point you back to Partyreel."
      actions={
        <>
          <Button asChild size="cta">
            <Link href="/">Back home</Link>
          </Button>
          <Button asChild size="cta" variant="outline">
            <Link href="/help">Visit the help center</Link>
          </Button>
        </>
      }
      // ★ NO `help` LINE HERE, AND THAT IS THE ONE PLACE `ways-out=guided`
      // DOES NOT LAND (a call stated in the errors-wiring Handoff, his to
      // overrule). The guided verdict exists to give every OTHER surface the
      // quiet line to a human that "only the marketing pages" already had: the
      // help center is a full ACTION on this screen and contact sits in the
      // footnote below it. A fourth pointer would name /help twice, three lines
      // apart, on the one screen the verdict was generalizing FROM.
      footnote={
        <span className="text-muted-foreground">
          Looking for something specific? Try{" "}
          <FootnoteLink href="/features">features</FootnoteLink>,{" "}
          <FootnoteLink href="/pricing">pricing</FootnoteLink>, or{" "}
          <FootnoteLink href="/contact">contact us</FootnoteLink>.
        </span>
      }
    />
  );
}

function FootnoteLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="font-medium text-foreground underline decoration-border underline-offset-4 transition-colors duration-150 hover:decoration-foreground"
    >
      {children}
    </Link>
  );
}

// The quiet epilogue: a hand-laid strip of album tiles with one frame missing —
// the page that went missing, in the product's own visual language. Decorative
// (aria-hidden), achromatic, static by design (the 404 is a dead end, not a
// show). Since Will's `picture` note (2026-09-19) it rides NotFoundScreen's
// `visual` slot, standing where the icon circle stood rather than trailing the
// footnote, so the shared [data-not-found] entrance still staggers it in for
// free and it now arrives FIRST, on beat 0.
// Tokens only (border/muted), so it reads correctly on paper AND cinema.
const STRIP_TILES: { missing?: boolean; className?: string }[] = [
  { className: "rotate-[-5deg]" },
  { className: "rotate-[2deg] translate-y-0.5" },
  { missing: true, className: "rotate-[1deg]" },
  { className: "rotate-[4deg]" },
  { className: "rotate-[-2deg] translate-y-0.5" },
];

/**
 * The tilted photo-strip with one missing frame. Exported since R5: the
 * marketing error screen reuses it with a "500" label so the two dead-end
 * surfaces read as siblings.
 */
export function MissingFrameStrip({ label = "404" }: { label?: string }) {
  return (
    <div aria-hidden className="flex items-center justify-center gap-2.5">
      {STRIP_TILES.map((tile, i) => (
        <span
          key={i}
          className={cn(
            "block aspect-[4/5] w-9",
            tile.missing
              ? "flex items-center justify-center rounded-md border border-dashed border-muted-foreground/40"
              : "rounded-md border bg-muted/70",
            tile.className,
          )}
        >
          {tile.missing && (
            <span className="text-[9px] tracking-wider text-faint">
              {label}
            </span>
          )}
        </span>
      ))}
    </div>
  );
}
