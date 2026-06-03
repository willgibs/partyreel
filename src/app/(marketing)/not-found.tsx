import type { Metadata } from "next";

import { MarketingNotFound } from "@/components/marketing/marketing-not-found";

// Catches notFound() thrown inside the (marketing) route group (a bad blog / help / events /
// careers [slug]). The (marketing) layout already renders MarketingHeader + <main> +
// MarketingFooter, so this renders ONLY the centered content — adding chrome here would
// double-stack the header/footer (live-caught). WITHOUT this file the ROOT not-found would
// render INSIDE the marketing layout and produce exactly that doubling. min-h (not flex-1)
// because the marketing layout's <main> is flex-grow, not a flex container.
export const metadata: Metadata = {
  title: "Page not found",
  robots: { index: false, follow: false },
};

export default function MarketingNotFoundPage() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-6 py-24">
      <MarketingNotFound />
    </div>
  );
}
