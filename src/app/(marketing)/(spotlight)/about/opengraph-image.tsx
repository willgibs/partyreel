import { ABOUT_STORY } from "@/lib/constants/about";
import { marketingOgCard, OG_SIZE } from "@/lib/og/marketing-og-card";

export const alt = "About Partyreel";
export const size = OG_SIZE;
export const contentType = "image/png";

export default function AboutOgImage() {
  return marketingOgCard({ heading: ABOUT_STORY.heading });
}
