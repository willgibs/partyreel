import "./marketing.css";

import {
  OrganizationJsonLd,
  SoftwareApplicationJsonLd,
  WebsiteJsonLd,
} from "@/components/marketing/jsonld";
import { WebAnalytics } from "@/components/marketing/system/web-analytics";

// The (marketing) group root, slimmed to the cross-skin concerns: the JSON-LD
// emitters + the marketing.css import (motion grammar + skin blocks; loaded once
// for every marketing route). The CHROME lives in the nested (cinema) group
// layout (Track B theme posture; a light body is a PaperChapter inside it, and
// the (paper) group retired when /contact took that shape) so the skin owns its
// wrapper — which also means anything rendered at THIS level (error.tsx) has NO
// header/footer. The site's one 404 is the root's, which brings its own chrome.
// See architecture.md for the route-group domain split.
export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <OrganizationJsonLd />
      <WebsiteJsonLd />
      <SoftwareApplicationJsonLd />
      {/* Web analytics is deliberately MARKETING-scoped: mounting the island in
          this layout (not the root) is what keeps app/guest surfaces untracked
          until that becomes its own decision. */}
      <WebAnalytics />
      {children}
    </>
  );
}
