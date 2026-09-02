import { LEGAL_DOCUMENTS } from "@/lib/constants/legal";
import { marketingOgCard, OG_SIZE } from "@/lib/og/marketing-og-card";

const meta = LEGAL_DOCUMENTS.privacy;

export const alt = `Partyreel ${meta.title}`;
export const size = OG_SIZE;
export const contentType = "image/png";

export default function PrivacyOgImage() {
  return marketingOgCard({ heading: meta.title, kicker: meta.ogKicker });
}
