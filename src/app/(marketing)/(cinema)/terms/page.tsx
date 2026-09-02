import type { Metadata } from "next";

import { BreadcrumbJsonLd } from "@/components/marketing/jsonld";
import { LegalDocument } from "@/components/marketing/legal/legal-document";
import { LEGAL_DOCUMENTS } from "@/lib/constants/legal";
import { TERMS_SECTIONS } from "@/lib/constants/legal-terms";

// THE TERMS OF SERVICE PAGE. Composition only: the words live in
// lib/constants/legal-terms.tsx, the version/date/status in
// lib/constants/legal.ts, and the shell in legal-document.tsx. It sits in
// the (cinema) group by ruling (the utility-page rhythm, marketing-content.md).
const meta = LEGAL_DOCUMENTS.terms;

export const metadata: Metadata = {
  title: meta.title,
  description: meta.description,
  alternates: { canonical: meta.path },
  openGraph: { type: "article", modifiedTime: meta.lastUpdated },
};

export default function TermsPage() {
  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: "Home", href: "/" },
          { name: meta.title, href: meta.path },
        ]}
      />
      <LegalDocument doc="terms" sections={TERMS_SECTIONS} />
    </>
  );
}
