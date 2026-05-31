import {
  OrganizationJsonLd,
  WebsiteJsonLd,
} from "@/components/marketing/jsonld";
import { MarketingFooter } from "@/components/marketing/marketing-footer";
import { MarketingHeader } from "@/components/marketing/marketing-header";

// Chrome for the public marketing surface. Lives in its own route group so the
// host app `(app)` and guest `(guest)` groups can render completely different
// layouts on the SAME domain — clean shared links, no full reload between
// groups (the one minimal root layout in app/layout.tsx ties them together).
// See ADR-0002.
export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <OrganizationJsonLd />
      <WebsiteJsonLd />
      <MarketingHeader />
      <main className="flex-1">{children}</main>
      <MarketingFooter />
    </>
  );
}
