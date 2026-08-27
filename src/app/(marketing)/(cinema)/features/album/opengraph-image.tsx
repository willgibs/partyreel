import { featurePage } from "@/lib/constants/feature-pages";
import { marketingOgCard, OG_SIZE } from "@/lib/og/marketing-og-card";

const page = featurePage("album");

export const alt = `Partyreel: ${page.navLabel}`;
export const size = OG_SIZE;
export const contentType = "image/png";

export default function FeatureOgImage() {
  return marketingOgCard({ heading: page.h1 });
}
