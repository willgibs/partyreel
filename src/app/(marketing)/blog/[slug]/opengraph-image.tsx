import { ImageResponse } from "next/og";

import { getAuthor } from "@/lib/content/authors";
import { getAllBlogSlugs, getPost } from "@/lib/content/blog";
import { BRAND_HEX } from "@/lib/constants/site";
import { formatEventDate } from "@/lib/utils";

// Per-post share card — the post title on the branded dark surface + a byline,
// mirroring the use-case card. Built-in font on purpose (Next-16 satori gotcha).
// Prerendered for each slug via generateStaticParams.
export function generateStaticParams() {
  return getAllBlogSlugs().map((slug) => ({ slug }));
}

export const alt = "The Partyreel blog";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function BlogOgImage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = getPost(slug);
  const heading = post?.frontmatter.title ?? "The Partyreel blog";
  const byline = post
    ? `${getAuthor(post.frontmatter.author).name} · ${formatEventDate(post.frontmatter.date)}`
    : "Partyreel";

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        backgroundColor: "#0d0d0d",
        padding: "88px",
        color: "#fafafa",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: "64px",
            height: "64px",
            borderRadius: "16px",
            backgroundColor: "#fafafa",
          }}
        >
          <svg
            width="40"
            height="40"
            viewBox="0 0 24 24"
            fill="none"
            stroke={BRAND_HEX}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="14.31" y1="8" x2="20.05" y2="17.94" />
            <line x1="9.69" y1="8" x2="21.17" y2="8" />
            <line x1="7.38" y1="12" x2="13.12" y2="2.06" />
            <line x1="9.69" y1="16" x2="3.95" y2="6.06" />
            <line x1="14.31" y1="16" x2="2.83" y2="16" />
            <line x1="16.62" y1="12" x2="10.88" y2="21.94" />
          </svg>
        </div>
        <div style={{ fontSize: "32px", fontWeight: 600, color: "#d4d4d8" }}>
          Partyreel Blog
        </div>
      </div>

      <div
        style={{
          display: "flex",
          fontSize: "60px",
          fontWeight: 700,
          lineHeight: 1.1,
          letterSpacing: "-0.02em",
          maxWidth: "1000px",
        }}
      >
        {heading}
      </div>

      <div style={{ display: "flex", fontSize: "30px", color: "#a1a1aa" }}>
        {byline}
      </div>
    </div>,
    { ...size },
  );
}
