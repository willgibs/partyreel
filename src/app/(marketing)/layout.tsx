import "./marketing.css";

import {
  OrganizationJsonLd,
  WebsiteJsonLd,
} from "@/components/marketing/jsonld";

// The (marketing) group root, slimmed to the cross-skin concerns: the JSON-LD
// emitters + the marketing.css import (motion grammar + skin blocks; loaded once
// for every marketing route). The CHROME lives in the nested (cinema) / (paper)
// group layouts (Track B theme posture) so each skin owns its wrapper — which
// also means anything rendered at THIS level (error.tsx) has NO header/footer;
// the group-owned not-found.tsx files exist for exactly that reason. See
// ADR-0002 for the route-group domain split.
export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <OrganizationJsonLd />
      <WebsiteJsonLd />
      {children}
    </>
  );
}
