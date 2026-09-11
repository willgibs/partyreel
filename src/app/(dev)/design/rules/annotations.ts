/**
 * THE HAND LAYER of the rules registry (the library phase, 2026-09-11). The
 * collector derives every enforced rule from code (rules.generated.json);
 * this file says what a human decided about it: which scope a guard file
 * holds down, who ruled it and when, and Will's verdict on each rule as he
 * works /design/rules. rules-annotations.test.ts keeps it complete: every
 * guard file has one entry, every verdict points at a rule that exists (or a
 * tombstone whose rule is gone on purpose).
 *
 * How verdicts arrive: Will sets them on the page, exports the block, pastes
 * it in chat, and the Orchestrator writes them here. Then the prune round:
 * `drop` deletes the it() block or the ★ run, `merge` folds a one-off into
 * the global rule it was a case of (`mergeInto`), `keep` stays.
 */

export type Scope =
  | "global"
  | "marketing"
  | "shared"
  | "lab"
  | "app"
  | "data-integrity"
  | "tooling";

export type Verdict = "unreviewed" | "keep" | "merge" | "drop";

/** One per guard test file: the default scope and provenance of its rules. */
export type FileAnnotation = {
  /** Repo-relative path of the guard test. */
  file: string;
  scope: Scope;
  /** One line: what this whole file holds down. */
  guards: string;
  /** Who set the rules this file pins. Agents never sign; "agent" is inferred. */
  ruledBy: "will" | "agent" | "unknown";
  /** ISO date of the ruling or the round that wrote the file; null when unknown. */
  ruledOn: string | null;
};

/** Sparse: only where Will overrides a file's default or records a verdict. */
export type RuleAnnotation = {
  /** A RuleRecord id (t:... or d:...) or r:<RulingId>. */
  id: string;
  /** The title as annotated; a drift detector, never a key. */
  title: string;
  scope?: Scope;
  /** One line, at most 170 characters. */
  intent?: string;
  verdict: Verdict;
  note?: string;
  /** The id this rule folds into, when verdict is "merge". */
  mergeInto?: string;
  /** ISO date: the rule's code is gone on purpose; the guard expects it absent. */
  droppedOn?: string;
};

export const FILE_ANNOTATIONS: FileAnnotation[] = [
  {
    file: "src/app/(dev)/design/marketing/marketing-library.test.ts",
    scope: "lab",
    guards:
      "the marketing library page imports only production modules and renders every system component and shared atom",
    ruledBy: "agent",
    ruledOn: "2026-09-02",
  },
  {
    file: "src/app/(dev)/design/rules/rules-annotations.test.ts",
    scope: "lab",
    guards:
      "the rules registry's hand layer keeps up with the derived one: every guard file annotated, every verdict on a live rule or a tombstone, every unrendered component excused",
    ruledBy: "will",
    ruledOn: "2026-09-11",
  },
  {
    file: "src/app/(dev)/design/rules/rules-registry.test.ts",
    scope: "lab",
    guards:
      "the committed rules artifact equals what the collector derives from the guard tests, the docs and the library pages",
    ruledBy: "will",
    ruledOn: "2026-09-11",
  },
  {
    file: "src/app/(dev)/design/touchpoints.test.ts",
    scope: "lab",
    guards:
      "the rulings registry stays a registry: unique ids, one-line whys, a home for every rule, boards only where one stands",
    ruledBy: "agent",
    ruledOn: "2026-09-02",
  },
  {
    file: "src/app/(marketing)/marketing-css-policy.test.ts",
    scope: "marketing",
    guards:
      "marketing.css stays contained: no :root, no theme ease names, no bare element selectors, mkt- keyframes, the sanctioned colour set",
    ruledBy: "will",
    ruledOn: "2026-09-01",
  },
  {
    file: "src/app/(marketing)/marketing-h1-policy.test.ts",
    scope: "marketing",
    guards: "no marketing h1 is gated on the cut or the rise (the LCP rule)",
    ruledBy: "agent",
    ruledOn: "2026-09-01",
  },
  {
    file: "src/app/css-source-policy.test.ts",
    scope: "global",
    guards:
      "two Tailwind entries, one theme: globals.css excludes the lab and docs; design.css references theme.css and scans the lab alone",
    ruledBy: "agent",
    ruledOn: "2026-09-02",
  },
  {
    file: "src/app/globals-theme-contract.test.ts",
    scope: "global",
    guards:
      "surface-paper aliases the light block, the PaperChapter doctrine, and the lamp set is light, never UI",
    ruledBy: "will",
    ruledOn: "2026-09-01",
  },
  {
    file: "src/app/keyframe-uniqueness.test.ts",
    scope: "global",
    guards:
      "every @keyframes name is declared exactly once across every sheet the app or the lab can load",
    ruledBy: "agent",
    ruledOn: "2026-09-02",
  },
  {
    file: "src/app/legal-print.test.ts",
    scope: "marketing",
    guards:
      "the legal print block: an opt-in hook, page breaks between sections, spelled-out link addresses, no @page rule",
    ruledBy: "agent",
    ruledOn: "2026-09-02",
  },
  {
    file: "src/components/dev/border-beam-vendor.test.ts",
    scope: "tooling",
    guards:
      "the vendored border-beam keeps its notice and marked deviations, never takes a hard-coded radius, and its palette is a derived register of the lamp set",
    ruledBy: "will",
    ruledOn: "2026-08-31",
  },
  {
    file: "src/components/dev/glow-contrast.test.ts",
    scope: "tooling",
    guards:
      "the contrast instrument's maths, and its lamp set module tracks the shipped --lamp-1..5",
    ruledBy: "agent",
    ruledOn: null,
  },
  {
    file: "src/components/marketing/chrome/footer-contract.test.ts",
    scope: "marketing",
    guards:
      "the ink footer redeclares its tokens, never nests .dark, keeps the QR server-rendered, and lights its seam through the primitive",
    ruledBy: "agent",
    ruledOn: "2026-09-01",
  },
  {
    file: "src/components/marketing/legal/legal-document-contract.test.ts",
    scope: "marketing",
    guards:
      "the legal shell rides the cinema hero and the reading spine, its rail stretches and scrolls, no mono status line, no dark: utilities",
    ruledBy: "agent",
    ruledOn: "2026-09-01",
  },
  {
    file: "src/components/marketing/mock-parity.test.ts",
    scope: "marketing",
    guards:
      "every app string a marketing mock quotes exists verbatim in the app",
    ruledBy: "agent",
    ruledOn: null,
  },
  {
    file: "src/components/marketing/sections/features/album/album-copy.test.ts",
    scope: "marketing",
    guards:
      "the album page's copy sets hold their rows, the FAQ is verdict-first, no em-dashes or banned identity language",
    ruledBy: "will",
    ruledOn: "2026-09-02",
  },
  {
    file: "src/components/marketing/sections/features/shared/feature-door.test.ts",
    scope: "marketing",
    guards:
      "the feature doors: a manifest photograph per page but the QR plate, none twice, no lamp, no tilt, no glare, the white focus ring",
    ruledBy: "agent",
    ruledOn: "2026-09-01",
  },
  {
    file: "src/components/marketing/system/page-hero-contract.test.ts",
    scope: "marketing",
    guards:
      "the page hero lockup: the h1 never reveal-hidden, one shared gap, the display step's trims, the named entrances, the stage after the lockup",
    ruledBy: "will",
    ruledOn: "2026-09-01",
  },
  {
    file: "src/components/marketing/system/screen-lamp.test.ts",
    scope: "marketing",
    guards:
      "the screen lamp is a seam below the object, its sibling after the children, full-bleed, sampled from the DOM",
    ruledBy: "agent",
    ruledOn: "2026-09-01",
  },
  {
    file: "src/components/shared/glow-contract.test.ts",
    scope: "shared",
    guards:
      "the spill engine: the pause contract, base beside band, one filter host mounted once, no unread knob, every beam names its theme",
    ruledBy: "agent",
    ruledOn: "2026-09-01",
  },
  {
    file: "src/components/shared/glow-placement.test.ts",
    scope: "shared",
    guards:
      "no lamp inside a clipping ancestor, a sampled palette wherever media is present, the reel lamp held to the screen",
    ruledBy: "will",
    ruledOn: "2026-09-01",
  },
  {
    file: "src/components/shared/legal-consent-line.test.tsx",
    scope: "shared",
    guards:
      "LegalConsentLine links both documents, and both consumers use the component rather than a copy",
    ruledBy: "agent",
    ruledOn: null,
  },
  {
    file: "src/lib/constants/contact.test.ts",
    scope: "data-integrity",
    guards:
      "CONTACT_TOPICS mirrors the DB CHECK, with unique values and real routes",
    ruledBy: "agent",
    ruledOn: "2026-08-28",
  },
  {
    file: "src/lib/constants/feature-pages.test.ts",
    scope: "marketing",
    guards:
      "the feature-pages registry: the six-page carve in order, a full identity layer, the directory lines in one band",
    ruledBy: "will",
    ruledOn: "2026-09-02",
  },
  {
    file: "src/lib/constants/legal.test.ts",
    scope: "marketing",
    guards:
      "the legal single-source: well-formed meta, the status lines, the pinned anchors, the plain-language register, the party while pending",
    ruledBy: "agent",
    ruledOn: "2026-09-01",
  },
  {
    file: "src/lib/constants/marketing-media.test.ts",
    scope: "marketing",
    guards:
      "the media manifest: every file exists, no orphans, a licence line each, unique ids, recorded orientations",
    ruledBy: "agent",
    ruledOn: null,
  },
  {
    file: "src/lib/constants/marketing-voice.test.ts",
    scope: "marketing",
    guards:
      "the voice single-source: the golden lines byte-matched, the ruled lines, the primary CTA",
    ruledBy: "will",
    ruledOn: "2026-08-25",
  },
  {
    file: "src/lib/constants/press-kit.test.ts",
    scope: "data-integrity",
    guards:
      "the press kit: real byte sizes, unique assets, the committed zip identical to the manifest, the QR encodes the site",
    ruledBy: "agent",
    ruledOn: null,
  },
  {
    file: "src/lib/constants/tier-limits-parity.test.ts",
    scope: "data-integrity",
    guards: "tiers.ts mirrors public.tier_limits() column for column",
    ruledBy: "agent",
    ruledOn: null,
  },
  {
    file: "src/lib/content-policy.test.ts",
    scope: "marketing",
    guards:
      "no em-dashes in MDX, none of the fenced claims anywhere, no human-response promises",
    ruledBy: "will",
    ruledOn: "2026-08-28",
  },
  {
    file: "src/lib/content/blog-tags.test.ts",
    scope: "marketing",
    guards:
      "the blog tag registry: the six ruled tags, unique ids, one-line descriptions, import-free",
    ruledBy: "agent",
    ruledOn: null,
  },
  {
    file: "src/lib/content/help-ui-labels.test.ts",
    scope: "marketing",
    guards: "every <UiLabel> in the help catalog quotes a shipped app string",
    ruledBy: "agent",
    ruledOn: "2026-09-01",
  },
  {
    file: "src/lib/db/migration-guards.test.ts",
    scope: "data-integrity",
    guards:
      "the cap row locks survive a body replacement, create_guest inherits the read gate, get_upload_context feeds the lock re-check",
    ruledBy: "agent",
    ruledOn: "2026-07-29",
  },
  {
    file: "src/lib/db/queries/request-auth-policy.test.ts",
    scope: "app",
    guards:
      "request-auth owns the single getUser(), wrapped in cache(); no query module calls it directly",
    ruledBy: "agent",
    ruledOn: null,
  },
  {
    file: "src/lib/env-example-parity.test.ts",
    scope: "tooling",
    guards:
      ".env.example declares every var env.ts reads and nothing else, one comment each, no credential-shaped value",
    ruledBy: "agent",
    ruledOn: "2026-09-02",
  },
  {
    file: "src/lib/forensics/migration-guards.test.ts",
    scope: "data-integrity",
    guards:
      "restore_media's guards and the media SELECT column-scoping survive replacement; the hold columns are never granted",
    ruledBy: "agent",
    ruledOn: "2026-07-08",
  },
  {
    file: "src/lib/lifecycle/account-deletion.test.ts",
    scope: "data-integrity",
    guards: "the anonymisation patch and the sweep's destruction order",
    ruledBy: "agent",
    ruledOn: "2026-09-02",
  },
  {
    file: "src/lib/moderation/escalation-guards.test.ts",
    scope: "data-integrity",
    guards:
      "the QA Q3 migration's guards: escalation, un-delete, provenance, grant contractions, anon redactions",
    ruledBy: "agent",
    ruledOn: "2026-07-29",
  },
  {
    file: "src/lib/no-em-dash-policy.test.ts",
    scope: "global",
    guards: "no em-dashes in user-facing copy (comments exempt)",
    ruledBy: "will",
    ruledOn: "2026-08-31",
  },
  {
    file: "src/lib/r2/grid-items.email-safety.test.ts",
    scope: "app",
    guards: "the guest-facing GridMedia builder never carries an email",
    ruledBy: "agent",
    ruledOn: null,
  },
  {
    file: "src/lib/reel/build-reel-props.test.ts",
    scope: "app",
    guards:
      "buildReelProps: the order, the cover hoist, poster resolution, the length cap, guest-shaped items",
    ruledBy: "agent",
    ruledOn: null,
  },
  {
    file: "src/lib/reel/guest-download-contract.test.ts",
    scope: "app",
    guards:
      "the /api/reel/download wire contract, and a response union that leaks no publish-state oracle",
    ruledBy: "agent",
    ruledOn: null,
  },
  {
    file: "src/lib/reel/guest-reel-contract.test.ts",
    scope: "app",
    guards: "the guest reel's anon allow-list stays at its eight keys",
    ruledBy: "agent",
    ruledOn: null,
  },
  {
    file: "src/lib/reel/quick-add.test.ts",
    scope: "app",
    guards:
      "pickQuickAdd: deterministic, the counts, likes, recency, uploader coverage, the photo/video mix, chronological output",
    ruledBy: "agent",
    ruledOn: null,
  },
  {
    file: "src/lib/reel/upload-contract.test.ts",
    scope: "app",
    guards: "the /api/reel/upload wire contract, phase by phase",
    ruledBy: "agent",
    ruledOn: null,
  },
  {
    file: "src/lib/shared/sampled-palette.test.ts",
    scope: "shared",
    guards:
      "spill sampling (law 3): five spread hues in the atmosphere register, and the CORS-clean loader",
    ruledBy: "will",
    ruledOn: null,
  },
  {
    file: "src/lib/single-source-policy.test.ts",
    scope: "global",
    guards:
      "no UPPER_SNAKE constant is exported from two modules under src/lib",
    ruledBy: "agent",
    ruledOn: "2026-09-02",
  },
  {
    file: "src/lib/track-manifests.test.ts",
    scope: "tooling",
    guards:
      "track manifests are well-formed and no two live tracks claim overlapping paths",
    ruledBy: "agent",
    ruledOn: "2026-09-02",
  },
];

/**
 * Will's verdicts, one entry per ruled rule. Empty until the rules pass; the
 * page renders "unreviewed" for everything not listed.
 */
export const RULE_ANNOTATIONS: RuleAnnotation[] = [];

export type ComponentNote = {
  /** One line: what the component is for. */
  for?: string;
  /** Why the library does not render it (a specimen is the default). */
  unspecimened?: string;
};

/**
 * Notes on the component index. A component file the library does not
 * import needs an `unspecimened` reason here, or rules-annotations.test.ts
 * fails; the reasons are the exceptions, not the rule.
 */
export const COMPONENT_NOTES: Record<string, ComponentNote> = {
  "src/components/marketing/system/web-analytics.tsx": {
    for: "the analytics singleton and the data-track listener",
    unspecimened:
      "a document singleton mounted once in the marketing layout; a second mount doubles every event, so the page lists it as text",
  },
  "src/components/shared/glow-filter.tsx": {
    for: "the turbulence field every Glow warps through",
    unspecimened:
      "a document singleton mounted once in the root layout; the lab must never mount a second",
  },
  "src/components/ui/sonner.tsx": {
    for: "the themed Toaster",
    unspecimened:
      "mounted once in the root layout; the toast demo on /design/components fires it",
  },
  "src/components/shared/app-shell.tsx": {
    for: "the signed-in app frame",
    unspecimened: "provider-bound (auth, the nav state); no in-lab harness",
  },
  "src/components/shared/claim-uploads-on-auth.tsx": {
    for: "claims a guest's uploads onto the account that just signed in",
    unspecimened:
      "an effect with no render of its own; it talks to Supabase on mount",
  },
  "src/components/shared/media-lightbox.tsx": {
    for: "the media lightbox with its gesture physics",
    unspecimened:
      "data- and provider-heavy; its behaviour pins live in media-lightbox.test.tsx",
  },
  "src/components/shared/media-lightbox.lazy.tsx": {
    for: "the lazy wrapper around the lightbox",
    unspecimened: "the lightbox's loader; see media-lightbox.tsx",
  },
  "src/components/shared/route-error.tsx": {
    for: "the route error boundary",
    unspecimened:
      "fires Sentry on mount; /design/patterns renders a static mock of its screen",
  },
  "src/components/shared/upload-thumbnail.tsx": {
    for: "the per-file thumbnail in the upload queue",
    unspecimened:
      "specimen pending: lands with the library phase's third commit",
  },
  "src/components/marketing/frames/album-frame.tsx": {
    for: "the album frame",
    unspecimened:
      "specimen pending: lands with the library phase's third commit",
  },
  "src/components/marketing/frames/browser-frame.tsx": {
    for: "the browser window frame with an optional bar",
    unspecimened:
      "specimen pending: lands with the library phase's third commit",
  },
  "src/components/marketing/frames/gallery-frame.tsx": {
    for: "the gallery frame",
    unspecimened:
      "specimen pending: lands with the library phase's third commit",
  },
  "src/components/marketing/frames/live-qr.tsx": {
    for: "a scannable QR that opens the live demo",
    unspecimened:
      "specimen pending: lands with the library phase's third commit",
  },
  "src/components/marketing/frames/phone-frame.tsx": {
    for: "the phone bezel (PhoneShell) and the upload mock inside it (PhoneFrame)",
    unspecimened:
      "specimen pending: lands with the library phase's third commit",
  },
  "src/components/marketing/frames/qr-frame.tsx": {
    for: "the QR card frame",
    unspecimened:
      "specimen pending: lands with the library phase's third commit",
  },
  "src/components/marketing/frames/reel-frame.tsx": {
    for: "the reel poster frame",
    unspecimened:
      "specimen pending: lands with the library phase's third commit",
  },
  "src/components/marketing/sections/features/shared/feature-door.tsx": {
    for: "the photographic door to a feature page, with its signature chip",
    unspecimened:
      "specimen pending: lands with the library phase's third commit",
  },
  "src/components/marketing/sections/features/shared/feature-faq.tsx": {
    for: "the shared FAQ band with its FAQPage JSON-LD",
    unspecimened:
      "specimen pending: lands with the library phase's third commit",
  },
  "src/components/marketing/sections/features/shared/feature-hero-eyebrow.tsx":
    {
      for: "the feature hero's one eyebrow",
      unspecimened:
        "specimen pending: lands with the library phase's third commit",
    },
  "src/components/marketing/sections/features/shared/ghost-grid.tsx": {
    for: "the locked-gallery ghost grid",
    unspecimened:
      "specimen pending: lands with the library phase's third commit",
  },
  "src/components/marketing/sections/features/shared/go-deeper.tsx": {
    for: "the quiet help-center pointer row",
    unspecimened:
      "specimen pending: lands with the library phase's third commit",
  },
  "src/components/marketing/sections/features/shared/related-features.tsx": {
    for: "the sibling-features band that opens a feature page's close",
    unspecimened:
      "specimen pending: lands with the library phase's third commit",
  },
  "src/components/marketing/sections/features/shared/text-swap.tsx": {
    for: "the blur-swap text island",
    unspecimened:
      "specimen pending: lands with the library phase's third commit",
  },
};
