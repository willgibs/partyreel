import {
  Briefcase,
  Bug,
  Camera,
  CreditCard,
  LifeBuoy,
  MessageCircle,
  Newspaper,
  PartyPopper,
  ShieldCheck,
  type LucideIcon,
} from "lucide-react";

// The /contact topic router's single source (the contact round, 2026-08-28):
// the form's chip picker, the zod enum, the notify-email subject prefix, and
// the /admin/support chip all read THIS list. The DB CHECK in
// supabase/migrations/20260828001000_contact_topic.sql mirrors the values;
// change one -> change the other. A structured topic (unlike the free-text
// subject) is what future support routing can key on, which is why the picker
// is required on the form while the DB column stays nullable (legacy rows).
export const CONTACT_TOPIC_VALUES = [
  "hosting",
  "guest",
  "billing",
  "press",
  "privacy",
  "bug",
  "other",
] as const;

export type ContactTopicValue = (typeof CONTACT_TOPIC_VALUES)[number];

/**
 * The reply promise, one home (the library phase, 2026-09-11): /contact's subhead
 * and metadata, the form's commit point and its thank-you, /help's and /press's
 * closing notes, and the careers "not sure yet" card all read this line. The
 * content policy names it as the standard line; the two help articles that
 * quote it are prose (MDX) and keep the sentence as text.
 */
export const REPLY_LINE = "Every note gets a reply, usually within a day.";

export type ContactHintLink = {
  /** A real route or a help anchor; contact.test.ts resolves every one. */
  href: string;
  /** The destination in a few words: a noun phrase, never "Learn more". */
  label: string;
};

/**
 * The topic's own answers, shown INSIDE the form once it is picked: deflection
 * where it helps, never a wall in front of the message field. contact-page r1
 * (`urgency`, Will: "custom per topic instead of one generic 'try
 * troubleshooting'"): each topic names the articles that settle ITS questions,
 * so a visitor can be answered before writing at all.
 *
 * ★ A hint makes no reply-timing promise of its own. The only true timing for a
 * note is REPLY_LINE (nothing here runs a faster queue for one topic), so a
 * per-topic line would be invented; the timings a hint may state are the
 * product's own (an upgrade lands the moment payment clears), which the help
 * article behind it already says.
 */
export type ContactHint = {
  /** One short sentence, specific to the topic (two lines in the card at most). */
  text: string;
  /** One to four answers, most useful first. */
  links: readonly ContactHintLink[];
};

export type ContactTopic = {
  value: ContactTopicValue;
  /** Chip label on /contact; also the admin chip and the email subject tag. */
  label: string;
  icon: LucideIcon;
  hint: ContactHint | null;
};

export const CONTACT_TOPICS: readonly ContactTopic[] = [
  {
    value: "hosting",
    label: "Hosting an event",
    icon: PartyPopper,
    hint: {
      text: "Getting an event ready? These walk you through it.",
      links: [
        {
          href: "/help/create-your-first-event",
          label: "Create your first event",
        },
        {
          href: "/help/customize-and-share-your-qr",
          label: "Share your QR code",
        },
        {
          href: "/help/event-settings-explained",
          label: "Event settings, explained",
        },
      ],
    },
  },
  {
    value: "guest",
    label: "Joining as a guest",
    icon: Camera,
    hint: {
      text: "Adding photos, the email step, a photo you’d like gone: each has a short answer.",
      links: [
        {
          href: "/help/how-guests-join-and-upload",
          label: "Join and add your photos",
        },
        {
          href: "/help/why-an-event-asks-for-your-email",
          label: "Why an event asks for your email",
        },
        {
          href: "/help/report-a-problem-as-a-guest",
          label: "Get a photo taken down",
        },
      ],
    },
  },
  {
    value: "billing",
    label: "Plans & billing",
    icon: CreditCard,
    // The help center owns the operational billing answers (upgrades,
    // storage, receipts); /pricing#faq stays the sales-side FAQ (Will's
    // ruling, the help-catalog round 2026-09-01). A refund is the one thing the
    // help articles themselves send to a note.
    hint: {
      text: "Cards, receipts and cancelling are self-serve. For a refund, send us a note.",
      links: [
        {
          href: "/help/pro-vs-event-pass",
          label: "Pro vs. Event Pass",
        },
        {
          href: "/help/upgrade-downgrade-or-cancel",
          label: "Upgrade, downgrade, or cancel",
        },
        {
          href: "/help/payments-receipts-and-invoices",
          label: "Receipts and invoices",
        },
      ],
    },
  },
  {
    value: "press",
    label: "Press & partnerships",
    icon: Newspaper,
    hint: {
      text: "The press kit has the boilerplate, the fact sheet, and brand marks.",
      links: [{ href: "/press", label: "Open the press kit" }],
    },
  },
  {
    value: "privacy",
    label: "Privacy & data",
    icon: ShieldCheck,
    hint: {
      text: "You can take everything with you, and delete your account yourself, any time.",
      links: [
        {
          href: "/help/your-data-and-deleting-your-account",
          label: "Your data and deleting your account",
        },
        {
          href: "/help/who-can-see-your-event",
          label: "Who can see your event",
        },
        {
          href: "/help/reporting-and-safety",
          label: "Reporting and safety",
        },
      ],
    },
  },
  {
    value: "bug",
    label: "Something broke",
    icon: Bug,
    hint: {
      text: "Uploads, sign-in and QR codes have quick fixes. Start with the one that sounds like yours.",
      links: [
        {
          href: "/help/an-upload-wont-finish",
          label: "Upload won’t finish",
        },
        {
          href: "/help/a-photo-is-missing-from-the-album",
          label: "Photo is missing",
        },
        { href: "/help/you-cant-sign-in", label: "Can’t sign in" },
        {
          href: "/help/the-qr-wont-scan-or-the-link-wont-open",
          label: "QR won’t scan",
        },
      ],
    },
  },
  {
    value: "other",
    label: "Something else",
    icon: MessageCircle,
    hint: null,
  },
];

/** Label for a stored topic value (admin + email). Null-safe for legacy rows. */
export function contactTopicLabel(
  value: string | null | undefined,
): string | null {
  return CONTACT_TOPICS.find((t) => t.value === value)?.label ?? null;
}

export type ContactDirectoryEntry = {
  title: string;
  /** One line on what is there, in the site's own words. */
  body: string;
  href: string;
  icon: LucideIcon;
};

/**
 * The self-serve doors beside the form (contact-page r1 `beside=directory`):
 * the paths that answer a visitor before a note is needed. Two today.
 * ★ Press is not one: /press folds into /about (the press-page pick) and About
 * carries no kit yet, so a tile would point at a page that is going away or at
 * one with nothing to take; the `press` topic's hint keeps the kit's link while
 * /press exists.
 */
export const CONTACT_DIRECTORY: readonly ContactDirectoryEntry[] = [
  {
    title: "Help center",
    body: "Guides for every step, from the first QR to the final download.",
    href: "/help",
    icon: LifeBuoy,
  },
  {
    title: "Careers",
    body: "How the team works, and the roles open right now.",
    href: "/careers",
    icon: Briefcase,
  },
];
