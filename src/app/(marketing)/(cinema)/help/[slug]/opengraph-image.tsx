import { getAllSlugs, getArticle } from "@/lib/content/help";
import { marketingOgCard, OG_SIZE } from "@/lib/og/marketing-og-card";

// Per-article share card over the shared marketing OG surface (the blog-slug
// precedent). Prerendered for each slug via generateStaticParams.
export function generateStaticParams() {
  return getAllSlugs().map((slug) => ({ slug }));
}

export const alt = "Partyreel help center";
export const size = OG_SIZE;
export const contentType = "image/png";

export default async function HelpArticleOgImage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const article = getArticle(slug);
  return marketingOgCard({
    heading: article?.frontmatter.title ?? "Help center",
    kicker: "The Partyreel help center",
  });
}
