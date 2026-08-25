import { MarketingFooter } from "@/components/marketing/chrome/marketing-footer";
import { MarketingHeader } from "@/components/marketing/chrome/marketing-header";

// THE PAPER SKIN (Track B theme posture, T2.5 Call 3): reading surfaces stay
// theme-following (light default) — no `dark` class, no viewport override (the
// root layout's light/dark themeColor pair is correct here). data-mkt scopes the
// marketing motion tokens; data-mkt-skin="paper" exists so chrome and CSS can
// address the skin explicitly rather than by absence.
export default function PaperLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      className="flex min-h-0 flex-1 flex-col"
      data-mkt
      data-mkt-skin="paper"
    >
      <MarketingHeader />
      <main className="flex-1">{children}</main>
      <MarketingFooter />
    </div>
  );
}
