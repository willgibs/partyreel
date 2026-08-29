import { marketingOgCard, OG_SIZE } from "@/lib/og/marketing-og-card";

export const alt = "Partyreel press";
export const size = OG_SIZE;
export const contentType = "image/png";

export default function PressOgImage() {
  return marketingOgCard({ heading: "Press." });
}
