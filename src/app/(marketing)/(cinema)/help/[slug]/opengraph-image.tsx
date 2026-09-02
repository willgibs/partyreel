import { getAllSlugs, getArticle, getCategory } from "@/lib/content/help";
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
  // The kicker names the category so a shared card says which shelf it is
  // from ("Help center · Highlight reel"), not just that it is help.
  const kicker = article
    ? `Help center · ${getCategory(article.frontmatter.category).title}`
    : "The Partyreel help center";
  return marketingOgCard({
    heading: article?.frontmatter.title ?? "Help center",
    kicker,
  });
}
