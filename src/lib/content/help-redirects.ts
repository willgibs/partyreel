/**
 * Retired help slugs and where they go now, each a 308. The identity reshape (2026-09-21) renamed
 * the "Require accounts to upload" article to "Require verified emails, explained" (the switch's
 * own new name); guest by upload (2026-09-22) retired Save, so "Save an event, and find your
 * uploads later" became "Find your uploads, and the events you added to". The live reel
 * (2026-09-25) retold the Highlight reel shelf: the album-on-a-screen article merged into the
 * reel's screen, the moments article became the clip maker's, the reel's download troubleshooter
 * became the clip's, and the two articles the live reel made false (a downloadable reel video, a
 * reel the host shares) point at their nearest truth. Consumed by `redirects()` in
 * next.config.ts, which is why this module has NO `@/` imports (the config file is not on the
 * alias). help.test.ts checks every target is a live article and no source is (the
 * blog-redirects.ts pattern).
 */
export const HELP_REDIRECTS: readonly { from: string; to: string }[] = [
  {
    from: "require-accounts-to-upload-explained",
    to: "require-verified-emails-explained",
  },
  {
    from: "save-an-event-and-find-your-uploads",
    to: "find-your-uploads-and-events",
  },
  {
    from: "show-the-album-live-on-a-screen",
    to: "play-the-reel-on-a-screen",
  },
  {
    from: "pick-and-reorder-reel-moments",
    to: "make-your-own-clip",
  },
  {
    from: "download-the-reel-as-a-video",
    to: "make-your-own-clip",
  },
  {
    from: "share-the-reel-with-guests",
    to: "the-highlight-reel",
  },
  {
    from: "the-reel-wont-download",
    to: "a-clip-wont-finish-or-save",
  },
];
