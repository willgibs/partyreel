import {
  Bug,
  Camera,
  CreditCard,
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

export type ContactTopic = {
  value: ContactTopicValue;
  /** Chip label on /contact; also the admin chip and the email subject tag. */
  label: string;
  icon: LucideIcon;
  /**
   * The fastest-path hint shown INSIDE the form once this topic is picked:
   * deflection where it helps, never a wall in front of the message field.
   * Hrefs must be real routes/anchors (the help page renders id={category.slug};
   * /pricing#faq exists).
   */
  hint: { text: string; href: string; linkLabel: string } | null;
};

export const CONTACT_TOPICS: readonly ContactTopic[] = [
  {
    value: "hosting",
    label: "Hosting an event",
    icon: PartyPopper,
    hint: {
      text: "Setting up? The getting-started guides cover it step by step.",
      href: "/help#getting-started",
      linkLabel: "Open the guides",
    },
  },
  {
    value: "guest",
    label: "Joining as a guest",
    icon: Camera,
    hint: {
      text: "Joining an event? The guest guide clears up the common snags.",
      href: "/help/how-guests-join-and-upload",
      linkLabel: "Read the guest guide",
    },
  },
  {
    value: "billing",
    label: "Plans & billing",
    icon: CreditCard,
    hint: {
      text: "Most plan and billing questions are answered in the pricing FAQ.",
      href: "/pricing#faq",
      linkLabel: "Open the pricing FAQ",
    },
  },
  {
    value: "press",
    label: "Press & partnerships",
    icon: Newspaper,
    hint: {
      text: "The press kit has the boilerplate, the fact sheet, and brand marks.",
      href: "/press",
      linkLabel: "Open the press kit",
    },
  },
  {
    value: "privacy",
    label: "Privacy & data",
    icon: ShieldCheck,
    hint: {
      text: "The privacy page covers visibility, location data, and reports.",
      href: "/features/privacy",
      linkLabel: "See the privacy page",
    },
  },
  {
    value: "bug",
    label: "Something broke",
    icon: Bug,
    hint: {
      text: "The troubleshooting guides clear up the frequent culprits fast.",
      href: "/help#troubleshooting",
      linkLabel: "Try troubleshooting",
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
