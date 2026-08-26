import { marketingOgCard, OG_SIZE } from "@/lib/og/marketing-og-card";

export const alt = "Partyreel: how it works";
export const size = OG_SIZE;
export const contentType = "image/png";

export default function HowItWorksOgImage() {
  return marketingOgCard({ heading: "From QR to reel, start to finish." });
}
