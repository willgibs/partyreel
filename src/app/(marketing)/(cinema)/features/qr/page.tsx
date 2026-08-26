import type { Metadata } from "next";

import { featurePage } from "@/lib/constants/feature-pages";

import { FeatureStub } from "../feature-stub";

// PHASE-A STUB: the Phase-B track replaces this page's body wholesale (the
// registry keeps metadata + hero truthful in the meantime).
const page = featurePage("qr");

export const metadata: Metadata = {
  title: page.navLabel,
  description: page.heroSub,
  alternates: { canonical: "/features/qr" },
};

export default function QrFeaturePage() {
  return <FeatureStub slug="qr" />;
}
