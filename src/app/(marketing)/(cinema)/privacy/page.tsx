import type { Metadata } from "next";

import { BreadcrumbJsonLd } from "@/components/marketing/jsonld";
import { LegalDocument } from "@/components/marketing/legal/legal-document";
import { LEGAL_DOCUMENTS } from "@/lib/constants/legal";
import { PRIVACY_SECTIONS } from "@/lib/constants/legal-privacy";

// THE PRIVACY POLICY PAGE. Composition only: the words live in
// lib/constants/legal-privacy.tsx, the version/date/status in
// lib/constants/legal.ts, and the shell in legal-document.tsx. It sits in
// the (cinema) group by ruling (the utility-page rhythm, marketing-content.md).
const meta = LEGAL_DOCUMENTS.privacy;

export const metadata: Metadata = {
  title: meta.title,
  description: meta.description,
  alternates: { canonical: meta.path },
  openGraph: { type: "article", modifiedTime: meta.lastUpdated },
};

export default function PrivacyPage() {
  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: "Home", href: "/" },
          { name: meta.title, href: meta.path },
        ]}
      />
      <LegalDocument doc="privacy" sections={PRIVACY_SECTIONS} />
    </>
  );
}
