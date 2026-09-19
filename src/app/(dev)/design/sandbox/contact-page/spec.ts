import { defineExploration } from "@/components/lab/exploration";

/**
 * HOW SOMEONE REACHES A PERSON AT PARTYREEL, ROUND ONE (2026-09-19).
 *
 * Will (docs/design/rulings.md, "stack the lab"): /contact is one of five
 * surfaces cut on the free seats while deployments are capped, unprotected
 * like the rest of the app and the guest pages, "absolutely everything is up
 * for relitigation or reconcepting from the ground up." A board that keeps
 * nothing is deleted at no cost.
 *
 * Six decisions on the real desk (PageHero, ContactForm, ContactFacts, the
 * self-serve directory), never a fork of them: a host mid-event with
 * something broken, a planner weighing a plan, and a reporter on background
 * stand in for a visitor, so a topic picker or a reply promise reads against
 * someone real rather than an empty field. Not in this round: any
 * production byte; the email path, the rate limiter and the honeypot stay as
 * they are unless an option says what it changes.
 */
export const CONTACT_PAGE = defineExploration({
  id: "contact-page",
  title: "Reaching a person",
  round: {
    n: 1,
    date: "2026-09-19",
    changed:
      "The first round: does reaching a person need a form at all, what the sender holds afterward, whether something urgent gets its own path, whether the topic picker stays required, the page's rhythm against the rest of the site, and what stands beside the form.",
  },
  bible: [16, 19, 21, 22],
  context:
    "Will (2026-09-19, stack the lab): /contact is unprotected like the rest, a board that keeps nothing deleted at no cost. Six decisions on the real desk, drawn on a host mid-event, a planner weighing a plan, and a reporter on background.",
  asks: [
    /* ── 1. The way in ──────────────────────────────────────────────────── */
    {
      id: "reach",
      label: "The way in",
      question: "Does reaching a person have to go through a form?",
      context:
        "Today: a routed form leads, the address sits beside it as a fact. Drawn on the real hero, ContactForm and ContactFacts, empty as a visitor actually meets them.",
      options: [
        {
          id: "routed",
          label: "The form leads, as today",
          means:
            "The stationery card carries the form; the address stays a fact beside it, never a door of its own.",
        },
        {
          id: "address",
          label: "The address alone, no form",
          means:
            "No fields, no topic picker, no rate limiter. The desk becomes one address and a reply promise.",
        },
        {
          id: "both",
          label: "Both, at equal weight",
          means:
            "Two doors side by side: the routed form, and a plain 'write directly' card the same size.",
        },
      ],
      recommended: "routed",
      because:
        "The topic picker is the one thing a raw address cannot do, and it is what a support routing habit can key on later; the honeypot and the fail-closed limiter exist because a bare public address invites more spam than a gated insert.",
      overrule:
        "If attachments matter more than triage (a reporter's file, a host's screenshot), the address earns its own first-class door.",
      lands:
        "Whether ContactForm, actions.ts and the rate limiter stay the page's spine, or the page turns static.",
    },

    /* ── 5. The page's identity (independent of reach) ──────────────────── */
    {
      id: "page",
      label: "The page's identity",
      question: "Should /contact leave paper for the site's cinema rhythm?",
      context:
        "/contact is the last (paper) page, forced light under a light header, while every sibling utility page (/help, /press, /careers) opens dark (bible 16). Drawn at the top fold: the hero, then what opens the body beneath it.",
      options: [
        {
          id: "desk",
          label: "The desk, as today",
          means:
            "A light PageHero on the light route group; the header stays light throughout the page.",
        },
        {
          id: "cinema",
          label: "The plain cinema rhythm",
          means:
            "A dark hero opens the page like /help and /press; a plain reading column opens the paper body beneath it.",
        },
        {
          id: "chapter",
          label: "The desk, inside a cinema frame",
          means:
            "The same dark hero, but the desk's own form and facts open the paper body, not a generic column.",
        },
      ],
      recommended: "chapter",
      because:
        "It is the fix the ROADMAP already named, and it costs the page nothing it has: the desk moves into a PaperChapter exactly like /press's sheet, under a real dark hero instead of forced light.",
      overrule:
        "If the desk reads as a physical object only because the page is paper, a dark hero is the thing that breaks it; today's chrome is the cheaper hold.",
      lands:
        "Whether (paper) retires as a route group, and the header's skin on this one remaining page.",
    },

    /* ── 3. The topic picker (after reach) ───────────────────────────────── */
    {
      id: "topic",
      label: "The topic picker",
      question: "Should picking a topic stay required before a note can send?",
      context:
        "The first field is a required Select of seven topics; picking one reveals a fastest-path hint inside the form. Drawn on the real ContactForm, a reporter's fixture (Press & partnerships).",
      options: [
        {
          id: "required",
          label: "Required, as today",
          means:
            "Nothing sends until a topic is picked; the hint deflects before the message field.",
        },
        {
          id: "gone",
          label: "Gone: sorted centrally",
          means:
            "The field disappears; every note lands the same way and a person sorts it after the fact.",
        },
        {
          id: "optional",
          label: "Optional, skippable",
          means:
            "The picker stays but nothing forces it; the help, press and careers doors still pre-pick it silently.",
        },
      ],
      recommended: "required",
      because:
        "It costs one tap and it is what routes a note today (the admin support chip reads it); dropping it moves triage from a field to a person's read, the more expensive fix.",
      overrule:
        "If most visitors arrive with no clear category, optional keeps the field for the ones who do know and drops the tax on the ones who do not.",
      lands:
        "Whether contact_submissions.topic stays a gate the schema enforces, or a hint the UI offers.",
      after: { ask: "reach" },
    },

    /* ── 3. Urgency (after reach) ─────────────────────────────────────────── */
    {
      id: "urgency",
      label: "Something urgent",
      question: "Should something going wrong right now get its own path?",
      context:
        "One inbox holds every note today, gated at 8 an hour per network regardless of subject. Drawn on the topic field's hint, the host's fixture: mid-event, uploads stuck.",
      options: [
        {
          id: "one",
          label: "One queue, as today",
          means:
            "Every topic promises the same line, whatever is actually happening on the other end.",
        },
        {
          id: "door",
          label: "A separate door",
          means:
            "'Something's wrong right now' becomes its own entry with its own hint: check troubleshooting first, then a flagged note.",
        },
        {
          id: "stated",
          label: "A promise per topic",
          means:
            "Every topic's hint gains its own timing line, set where the topic is chosen rather than left unsaid.",
        },
      ],
      recommended: "stated",
      because:
        "It costs one line per topic, already-real content rather than a new system, and it answers the gap without a promise the team cannot keep: 'right now' implies staffing this inbox does not have.",
      overrule:
        "If the honest answer is that nothing here is actually faster, one queue for everything is the truthful hold.",
      lands:
        "Whether CONTACT_TOPICS.hint gains a timing field, and whether the copy can say so truthfully.",
      after: { ask: "reach" },
    },

    /* ── 2. The receipt (after reach) ────────────────────────────────────── */
    {
      id: "receipt",
      label: "The receipt",
      question: "What should the sender hold after they send a note?",
      context:
        "Today: the card swaps for a drawn check and nothing else travels; the sender gets no receipt of any kind. Drawn on the real success state, the planner's fixture.",
      options: [
        {
          id: "card",
          label: "The on-page card only",
          means:
            "The check, a headline, the reply line, then 'Send another'. Nothing leaves the server a second time.",
        },
        {
          id: "email",
          label: "A receipt email",
          means:
            "A copy of the note lands in their own inbox within a minute, addressed to the email they typed.",
        },
        {
          id: "reference",
          label: "A reference line",
          means:
            "The success card adds a short code to quote if they follow up, with no status page behind it yet.",
        },
      ],
      recommended: "card",
      because:
        "A second email is a send to an address nobody verified, a real abuse surface (spoofed sends, inbox bombing) that needs its own limit and a bounce story; the reference line gets most of the reassurance for one string.",
      overrule:
        "If a support habit forms around quoting a reference number, it is worth naming even before a status page exists.",
      lands:
        "Whether sendOnce gains a second recipient, and whether contact_submissions.id ever reaches a visitor.",
      after: { ask: "reach" },
    },

    /* ── 6. Beside the form (after reach) ────────────────────────────────── */
    {
      id: "beside",
      label: "Beside the form",
      question: "What should stand beside the form?",
      context:
        "Today: the plain address and a reply-time line, under the header, in a facts list. Drawn beside the real ContactForm; the self-serve directory (help, press, careers) sits lower on the page today.",
      options: [
        {
          id: "facts",
          label: "The address and reply time",
          means:
            "Two rows: the copyable email, and how long a reply usually takes.",
        },
        {
          id: "directory",
          label: "The directory, promoted",
          means:
            "Help center, Press and Careers move up beside the form; the address drops to a footnote.",
        },
        {
          id: "warm",
          label: "One warmer line first",
          means: "A single sentence sets the tone before the plain facts list.",
        },
      ],
      recommended: "directory",
      because:
        "A visitor with a faster path (the help center, the press kit, the careers page) meets it today only after scrolling past the whole form; beside it, the deflection lands before anyone starts typing.",
      overrule:
        "If the address's plainness is the point, the facts card is the more honest neighbor and the directory can stay lower.",
      lands:
        "Whether the self-serve directory keeps its own section, or moves into the grid beside the form.",
      after: { ask: "reach" },
    },
  ],
});
