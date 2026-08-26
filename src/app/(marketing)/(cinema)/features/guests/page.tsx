import type { Metadata } from "next";

import { featurePage } from "@/lib/constants/feature-pages";

import { FeatureStub } from "../feature-stub";

// PHASE-A STUB: the Phase-B track replaces this page's body wholesale (the
// registry keeps metadata + hero truthful in the meantime).
const page = featurePage("guests");

export const metadata: Metadata = {
  title: page.navLabel,
  description: page.heroSub,
  alternates: { canonical: "/features/guests" },
};

export default function GuestsFeaturePage() {
  return <FeatureStub slug="guests" />;
}
