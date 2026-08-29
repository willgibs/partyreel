import { readFileSync } from "node:fs";
import { join } from "node:path";

import { ImageResponse } from "next/og";

import { getAuthor } from "@/lib/content/authors";
import { getAllBlogSlugs, getPost } from "@/lib/content/blog";
import { coverFor } from "@/lib/content/blog-covers";
import { BRAND_HEX } from "@/lib/constants/site";
import { formatEventDate } from "@/lib/utils";

/**
 * Per-post share card — the FEATURED CARD as a share image: the post's cover under an ink scrim
 * with the title over it, so a shared link looks like the site it came from. It used to be a flat
 * #0d0d0d rectangle with the title on it, which was the last place the blog was not media-led.
 *
 * ★ The cover is READ OFF DISK and inlined as a data URI, never fetched. satori can load a remote
 * image, but the only absolute base available here is NEXT_PUBLIC_SITE_URL, which inlines to the
 * PROD url on preview builds (testing-verification.md) — so a preview would silently render prod's
 * asset, and a build with no network would render nothing. The file is right there in public/.
 *
 * Built-in font on purpose (the Next-16 satori font gotcha): do not add a custom font loader.
 * Prerendered for each slug via generateStaticParams.
 */
export function generateStaticParams() {
  return getAllBlogSlugs().map((slug) => ({ slug }));
}

export const alt = "The Partyreel blog";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const MIME_BY_EXT: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
};

/** The cover as a data URI, or null if it cannot be read — the card then falls back to bare ink. */
function coverDataUri(slug: string, explicit?: string): string | null {
  try {
    const { src } = coverFor(slug, explicit);
    const type = MIME_BY_EXT[src.split(".").pop()?.toLowerCase() ?? ""];
    if (!type) return null;
    const bytes = readFileSync(join(process.cwd(), "public", src));
    return `data:${type};base64,${bytes.toString("base64")}`;
  } catch {
    return null;
  }
}

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
  const cover = post ? coverDataUri(slug, post.frontmatter.cover) : null;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "flex-end",
          backgroundColor: "#0d0d0d",
          color: "#fafafa",
          position: "relative",
        }}
      >
        {cover && (
          // A raw <img> is correct here and needs no eslint-disable: satori renders its own
          // element tree, and there is no next/image inside an ImageResponse.
          <img
            src={cover}
            alt=""
            width={size.width}
            height={size.height}
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover",
            }}
          />
        )}
        {/* ★ NO PADDING ON THE ROOT. satori resolves `inset: 0` against the PADDING box, not the
            border box, so a padded root inset the cover and the scrim by exactly that padding and
            the card rendered with black bars down the left and along the bottom (caught by looking
            at the built PNG, not by the build passing). Every full-bleed layer is inset:0 on an
            unpadded root; the padding moved onto the content that needs it. */}
        {/* TWO scrim layers, not one gradient. ★ A single bottom-weighted gradient was not enough:
            on a BRIGHT cover (a sunlit reception table) the byline sat on white linen and all but
            disappeared, while it looked fine on the dark confetti shot. Covers are slug-derived, so
            there is no opportunity to hand-check the pairing for a post that does not exist yet -
            the card has to be legible over ANY photograph in the pool. A flat base sets a
            guaranteed floor, and a simple two-stop gradient does the heavy lifting under the text.
            Caught by looking at the built PNG for a second post, not by the first one passing.

            ★ EXPLICIT width/height, not `inset: 0`. satori gives an EMPTY div no size from inset
            alone, so the first fix rendered two zero-area layers and changed the output by exactly
            nothing - the rebuilt card came out byte-identical, which is the only reason it got
            caught. The <img> works because it carries width/height attributes. */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            display: "flex",
            width: `${size.width}px`,
            height: `${size.height}px`,
            backgroundColor: "rgba(0,0,0,0.3)",
          }}
        />
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            display: "flex",
            width: `${size.width}px`,
            height: `${size.height}px`,
            background:
              "linear-gradient(to top, rgba(0,0,0,0.92), rgba(0,0,0,0) 60%)",
          }}
        />

        {/* The mark, top-left, over the scrim. */}
        <div
          style={{
            position: "absolute",
            top: "80px",
            left: "80px",
            display: "flex",
            alignItems: "center",
            gap: "20px",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: "56px",
              height: "56px",
              borderRadius: "14px",
              backgroundColor: "#fafafa",
            }}
          >
            <svg
              width="34"
              height="34"
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
          <div style={{ fontSize: "28px", fontWeight: 600, color: "#e4e4e7" }}>
            Partyreel Blog
          </div>
        </div>

        <div
          style={{
            position: "relative",
            display: "flex",
            flexDirection: "column",
            gap: "22px",
            padding: "0 80px 80px",
          }}
        >
          <div
            style={{
              display: "flex",
              fontSize: "58px",
              fontWeight: 700,
              lineHeight: 1.08,
              letterSpacing: "-0.02em",
              maxWidth: "980px",
            }}
          >
            {heading}
          </div>
          <div style={{ display: "flex", fontSize: "28px", color: "#d4d4d8" }}>
            {byline}
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
