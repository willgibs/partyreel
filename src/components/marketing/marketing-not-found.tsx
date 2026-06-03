import Link from "next/link";
import { Compass } from "lucide-react";

import { NotFoundScreen } from "@/components/shared/not-found-screen";
import { Button } from "@/components/ui/button";

// The site/marketing 404 content (a lost visitor) — single-sourced so it can't drift
// between the two places it renders: the root app/not-found.tsx (UNMATCHED URLs, which fall
// through to the root layout with NO route-group chrome, so that file supplies its own
// header/footer) and (marketing)/not-found.tsx (a notFound() thrown INSIDE a marketing route,
// where the marketing layout ALREADY renders the header/footer — so that file must NOT add
// chrome, or it double-stacks). Each caller wraps this with the centering right for its context.
export function MarketingNotFound() {
  return (
    <NotFoundScreen
      icon={Compass}
      eyebrow="404"
      title="We lost this page"
      description="The link may be broken or the page may have moved. Let us point you back to Partyreel."
      actions={
        <>
          <Button asChild size="lg" className="h-11 px-6 text-base">
            <Link href="/">Back home</Link>
          </Button>
          <Button
            asChild
            size="lg"
            variant="outline"
            className="h-11 px-6 text-base"
          >
            <Link href="/help">Visit the help center</Link>
          </Button>
        </>
      }
      footnote={
        <span className="text-muted-foreground">
          Looking for something specific? Try{" "}
          <Link
            href="/features"
            className="font-medium text-foreground underline-offset-4 hover:underline"
          >
            features
          </Link>
          ,{" "}
          <Link
            href="/pricing"
            className="font-medium text-foreground underline-offset-4 hover:underline"
          >
            pricing
          </Link>
          , or{" "}
          <Link
            href="/contact"
            className="font-medium text-foreground underline-offset-4 hover:underline"
          >
            contact us
          </Link>
          .
        </span>
      }
    />
  );
}
