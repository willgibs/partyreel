import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import {
  DESK_SCREENS,
  isDeskScreen,
  isPhoneScreen,
  PHONE_SCREENS,
  STEPS_WITHOUT_SCREENS,
} from "./registry";

/**
 * EVERY STEP KEEPS ITS SCREEN (help-center r1 `article=screen`, Will's pick: "Each step keeps a small
 * illustration of the surface it describes, next to the sentence").
 *
 *  1. Every `screen="…"` in the library names a drawn screen, and every drawn screen is used.
 *  2. Every step of every how-to carries one; the exceptions are named with why.
 *  3. A picture that quotes a control quotes words the control still says: each quoted string is
 *     held to the file it quotes, so a renamed control fails here rather than lying in a picture.
 */

const ROOT = process.cwd();
const HELP = join(ROOT, "content", "help");

const articles = readdirSync(HELP)
  .filter((file) => file.endsWith(".mdx"))
  .map((file) => ({
    slug: file.replace(/\.mdx$/, ""),
    body: readFileSync(join(HELP, file), "utf8"),
  }));

/** Every opening `<Step …>` and `<Callout …>` tag, with its attributes. */
function tags(body: string, name: "Step" | "Callout"): string[] {
  return [...body.matchAll(new RegExp(`<${name}\\b[^>]*>`, "g"))].map(
    (m) => m[0],
  );
}

function screenOf(tag: string): string | null {
  return /\bscreen="([^"]+)"/.exec(tag)?.[1] ?? null;
}

const used = articles.flatMap(({ slug, body }) =>
  [...tags(body, "Step"), ...tags(body, "Callout")]
    .map((tag) => ({ slug, tag, screen: screenOf(tag) }))
    .filter((entry): entry is { slug: string; tag: string; screen: string } =>
      Boolean(entry.screen),
    ),
);

describe("the screens the library names", () => {
  it("names only screens that are drawn", () => {
    expect(used.length).toBeGreaterThan(0);
    for (const { slug, screen } of used) {
      expect(
        isPhoneScreen(screen) || isDeskScreen(screen),
        `${slug}: screen="${screen}" is not in step-screens/registry.ts`,
      ).toBe(true);
    }
  });

  it("draws no screen that nothing names", () => {
    const named = new Set(used.map(({ screen }) => screen));
    for (const id of [
      ...Object.keys(PHONE_SCREENS),
      ...Object.keys(DESK_SCREENS),
    ]) {
      expect(named.has(id), `${id} is drawn but no article names it`).toBe(
        true,
      );
    }
  });

  it("keeps one id in one kind, each with the words a screen reader hears", () => {
    for (const [id, label] of [
      ...Object.entries(PHONE_SCREENS),
      ...Object.entries(DESK_SCREENS),
    ]) {
      expect(isPhoneScreen(id) && isDeskScreen(id), id).toBe(false);
      expect(label.trim().length, id).toBeGreaterThan(8);
    }
  });
});

describe("every step keeps its screen", () => {
  it("puts a screen beside every step of every how-to", () => {
    for (const { slug, body } of articles) {
      if (Object.hasOwn(STEPS_WITHOUT_SCREENS, slug)) continue;
      for (const tag of tags(body, "Step")) {
        expect(screenOf(tag), `${slug}: ${tag} has no screen`).not.toBeNull();
      }
    }
  });

  it("names an exception only where there are steps to excuse", () => {
    for (const slug of Object.keys(STEPS_WITHOUT_SCREENS)) {
      const article = articles.find((a) => a.slug === slug);
      expect(article, `${slug} is not an article`).toBeDefined();
      expect(tags(article!.body, "Step").length, slug).toBeGreaterThan(0);
    }
  });
});

/* ── A quoted control says what the control says ─────────────────────────────────────────── */

const QUOTES: { file: string; words: string[] }[] = [
  {
    // The share sheet's download menu (desk `qr-download`).
    file: "src/components/app/event-qr.tsx",
    words: [
      "Download the code",
      "SVG (best for print)",
      "PNG (best for screens)",
    ],
  },
  {
    // The reel's glass chrome and its screen posture (desk `reel-controls`, `reel-screen`).
    file: "src/components/guest/reel/live-reel-view.tsx",
    words: [
      'label="Play on a screen"',
      "Press anywhere to fill the screen",
      "Scan to add yours",
    ],
  },
  {
    // The event page's living reel card (desk `reel-card`), whose words are the doors' own (`reelCardFace`).
    file: "src/components/app/event-feed/room-card.ts",
    words: ["Live for guests"],
  },
  {
    // The code screen after a send (phone `door-code*`).
    file: "src/components/auth/email-sign-in.tsx",
    words: [
      "Or tap the link in the same email.",
      "Use a different email",
      "Resend code",
      "`Resend in ${resendIn}s`",
    ],
  },
  // The welcome is no longer quoted (`locked-door` r2's doorway): `door-welcome` draws the real piece,
  // `door/welcome.tsx`'s `WelcomeWords`, so its words cannot drift from the door's.
  {
    // The door's upload step's soft skip (phone `door-photo`).
    file: "src/components/guest/upload-step.tsx",
    words: ["Skip for now"],
  },
  {
    // The report dialog, quoted rather than mounted (phone `report-reason`, and the toast of `report-sent`): its
    // own open state and its toast are not reachable through a prop. The pictures draw a PHOTO'S form (crumbs-19:
    // the article leads with a photo's own Report, and its three screens used to draw the album's form, "Report
    // this event"), so its title and the row that names the one photograph are quoted, and the album's are not.
    file: "src/components/guest/report-dialog.tsx",
    words: [
      "Report this photo",
      ", and only this one",
      "Tell us what&rsquo;s wrong and our team will review it. The",
      "host is never told who reported.",
      "What is it?",
      "Reason",
      "(optional)",
      "What's the problem here?",
      "Your email",
      "Confirm your email",
      "Only so we can ask for more if we need it.",
      "the report closes.",
      "Cancel",
      "Submit report",
      "Thanks. Your report has been sent for review.",
    ],
  },
  {
    // The viewer's capsule, whose Report the first picture marks (phone `report-open`, `report-sent`).
    file: "src/components/shared/media-lightbox-parts/actions.tsx",
    words: ['label="Report"', "Report this ${item.type}"],
  },
];

describe("a picture's quoted words are the product's", () => {
  for (const { file, words } of QUOTES) {
    it(`${file} still says what its picture quotes`, () => {
      const source = readFileSync(join(ROOT, file), "utf8");
      for (const word of words) {
        expect(source.includes(word), `${file} no longer says ${word}`).toBe(
          true,
        );
      }
    });
  }

  it("draws the quoted words the pictures show", () => {
    const desk = readFileSync(
      join(ROOT, "src/components/marketing/help/step-screens/desk-screens.tsx"),
      "utf8",
    );
    const door = readFileSync(
      join(ROOT, "src/components/marketing/help/step-screens/door-screens.tsx"),
      "utf8",
    );
    for (const word of [
      "Download the code",
      "SVG (best for print)",
      "PNG (best for screens)",
      "Play on a screen",
      "Press anywhere to fill the screen",
      "Scan to add yours",
      "Live for guests",
    ]) {
      expect(desk.includes(word), `desk-screens.tsx: ${word}`).toBe(true);
    }
    for (const word of [
      "Or tap the link in the same email.",
      "Use a different email",
      "Resend code",
      "Resend in 42s",
      "Skip for now",
      "Report this photo",
      ", and only this one",
      "Tell us what&rsquo;s wrong and our team will review it. The host is",
      "never told who reported.",
      "What is it?",
      "What's the problem here?",
      "Your email",
      "Confirm your email",
      "Only so we can ask for more if we need it.",
      "the report closes.",
      "Submit report",
      "Thanks. Your report has been sent for review.",
    ]) {
      expect(door.includes(word), `door-screens.tsx: ${word}`).toBe(true);
    }
  });
});
