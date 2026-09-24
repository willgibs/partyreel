/**
 * The bible: Partyreel's ten design principles, the guidance every design starts from, shown at /design/library/rules.
 * Each is a statement and the reason behind it, kept in this one place so a principle changes with one edit when the
 * product teaches us something better. Will owns the wording; like everything else here, it is a working version.
 */

export type BibleGroup = "rising tides" | "experience" | "identity" | "copy";

export const BIBLE_GROUPS: BibleGroup[] = ["rising tides", "experience", "identity", "copy"];

export type BibleRule = {
  /** A stable slug: the principle's anchor in the Library. */
  id: string;
  n: number;
  group: BibleGroup;
  /** The principle, one or two sentences, the way it is said aloud. */
  statement: string;
  /** The reason behind it, in a sentence or two. */
  why: string;
};

export const BIBLE: BibleRule[] = [
  {
    id: "rising-tides",
    n: 1,
    group: "rising tides",
    statement:
      "Rising tides: the goal is the whole platform, not only the task at hand, and nothing is protected or finished. What ships is a working version (a pick was the best of what one round drew, never the perfect answer), so judge what you touch from the ground up, build the best version you can see, and send the improvements you notice nearby to the lab.",
    why: "No round can know the finished bar in advance, so the product improves by iterations that keep raising it, and reopening any decision for a better answer is welcome. Reworking everything loses what we like and polishing forever makes no progress, so the call is made fresh each time.",
  },
  {
    id: "elegant-simplicity",
    n: 2,
    group: "rising tides",
    statement:
      "Elegance wins: between otherwise equal options, the simpler one with less risk surface wins, and every addition, a principle included, earns its place.",
    why: "Every added part is one more thing to maintain, secure and explain, and every added line dilutes the rest.",
  },
  {
    id: "dont-make-me-think",
    n: 3,
    group: "experience",
    statement:
      "Don't make me think: every flow streamlines its friction away, a problem arrives with its fix or its help, anything unclear explains itself, and nothing is a dead end.",
    why: "Flows are roads and features that point to each other are intersections: a finished flow returns somewhere useful instead of stopping at done, and smaller features ride on-ramps under bigger ones, so the product feels rich without crowding.",
  },
  {
    id: "premium-is-the-floor",
    n: 4,
    group: "experience",
    statement:
      "Premium is the floor: the app should feel like magic, the way Apple's platforms do, with every feature beautiful in itself, motion that shows state or earns attention, transitions that connect one flow to the next, and interactions that answer instantly and can be interrupted without error.",
    why: "A feature that is beautiful in itself invites use, the occasional delight sells the whole experience, and seamless, interruptible flows keep fast use effortless.",
  },
  {
    id: "animate-by-frequency",
    n: 5,
    group: "experience",
    statement:
      "Motion by frequency: what happens constantly is instant, what happens occasionally is quick (under 300 ms), and what happens rarely may delight; the design stands complete at rest, and every animation honors reduced motion.",
    why: "Theater on a switch a host flips fifty times a night is friction, and a first-time moment with no beat is a missed chance. An element that arrives hidden stays invisible to anything that never fires its trigger: a throttled tab, a crawler, a reader who asked for less motion.",
  },
  {
    id: "media-is-the-color",
    n: 6,
    group: "identity",
    statement:
      "The media is the color: an achromatic interface with one accent, where color comes from the photographs and from light (the lamps and the Aurora) rather than from UI paint.",
    why: "The interface stays quiet so the pictures carry the room; where there is no photograph, light brings color with a source and a direction, and in dark, depth is light first.",
  },
  {
    id: "guest-surface-is-the-host",
    n: 7,
    group: "identity",
    statement: "A guest surface belongs to the host's event: the host's name first, and as little Partyreel as possible.",
    why: "Guests came for the event, not for us, and the QR works as our growth loop because the page feels like the host's; our reach to guests is email for those who sign up, not the event page.",
  },
  {
    id: "one-token-set",
    n: 8,
    group: "identity",
    statement:
      "One system: marketing and the app share one token set, one type ladder and two faces (Inter to read, Urbanist to be loud), always through tokens; marketing may be louder, never different.",
    why: "A visitor who becomes a host should feel no seam between the site and the product, and one token per decision lets a round retune the whole product in one place; the Library shows the tokens and components themselves.",
  },
  {
    id: "every-frame-is-ours",
    n: 9,
    group: "identity",
    statement:
      "Every frame is ours: a page argues in real photographs made for the slot they fill, never stock, and each marketing chapter opens strong before it ramps down.",
    why: "\"Here is a real event\" over someone else's photograph reads false, and a page of equal-weight sections has no rhythm.",
  },
  {
    id: "affirmative-only",
    n: 10,
    group: "copy",
    statement:
      "Say what we are: name what a guest is spared rather than defining us against someone else, never promise \"no account\", write no em-dashes, and treat every line as open to a better one.",
    why: "Many events ask for an account, so \"no account\" would be untrue, and an em-dash reads as an AI tell. The voice is won one line at a time in its real place, with `marketing-voice.ts` the one home for the lines that ship.",
  },
];

export const BIBLE_GROUP_LABEL: Record<BibleGroup, string> = {
  "rising tides": "Rising tides",
  experience: "Experience",
  identity: "Identity",
  copy: "Copy",
};
