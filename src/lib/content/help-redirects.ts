/**
 * Retired help slugs and where they go now, each a 308. The identity reshape (2026-09-21) renamed
 * the "Require accounts to upload" article to "Require verified emails, explained" (the switch's
 * own new name); guest by upload (2026-09-22) retired Save, so "Save an event, and find your
 * uploads later" became "Find your uploads, and the events you added to". Consumed by
 * `redirects()` in next.config.ts, which is why this module has NO `@/` imports (the config file
 * is not on the alias). help.test.ts checks every target is a live article and no source is (the
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
];
