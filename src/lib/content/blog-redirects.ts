/**
 * Retired blog slugs and where they go now. The four placeholder posts the blog shipped with at
 * milestone-11 were live on prod and in the sitemap, so their URLs 308 to the post that took up
 * each subject when the library replaced them (2026-09). Consumed by `redirects()` in
 * next.config.ts, which is why this module has NO `@/` imports (the config file is not on the
 * alias). blog.test.ts checks every target is a live post and no source is.
 */
export const BLOG_REDIRECTS: readonly { from: string; to: string }[] = [
  {
    from: "stop-losing-group-photos-to-the-group-chat",
    to: "group-chat-party-photos",
  },
  {
    from: "wedding-photo-qr-guests-will-use",
    to: "qr-code-for-wedding-photos",
  },
  {
    from: "introducing-the-highlight-reel",
    to: "highlight-reel-renders-on-your-phone",
  },
  {
    from: "best-photos-are-on-everyone-elses-phone",
    to: "wedding-photos-photographer-cant-be-there-for",
  },
];
