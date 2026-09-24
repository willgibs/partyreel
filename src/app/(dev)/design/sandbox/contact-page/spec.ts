import { defineExploration } from "@/components/lab/exploration";

/**
 * HOW SOMEONE REACHES A PERSON AT PARTYREEL, ROUND ONE (2026-09-19).
 *
 * Will ("stack the lab"): /contact is one of five
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
 *
 * ★ THE OVERTAKEN AUDIT'S RESHAPE (2026-09-21) TOUCHES FOUR OF SIX, TEXT
 * ONLY. `page`, `topic`, `urgency` and `receipt` each gained a precedent a
 * later ruling shipped since 19 Sep (named in their own context/because
 * lines below); every option and every recommendation across all six asks
 * is unchanged. `reach` and `beside` stand as drawn: no badge named them.
 */
export const CONTACT_PAGE = defineExploration({
  id: "contact-page",
  title: "Reaching a person",
  round: {
    n: 1,
    date: "2026-09-21",
    changed:
      "The overtaken audit's reshape touches four of six: page cites pricing-page's own paper-hero precedent; topic cites first-event's style=step; urgency's premise is confirmed by the shipped failure sheet; receipt names the app's own modal precedent. reach and beside stand unbadged.",
  },
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
        "/contact is the last (paper) page, forced light, while /help, /press and /careers open dark. pricing-page proved the fix the other way: a paper hero now opens above its own dark chapter (pricing-page r1, r2).",
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
        "It is the fix the ROADMAP already named, proven since on pricing-page's own real order (a paper hero, then a dark chapter, r1 and r2): the desk moves into a PaperChapter exactly like /press's sheet, under a real dark hero instead of forced light.",
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
        "The first field is a required Select of seven topics; picking one reveals a fastest-path hint. first-event r1 has since ruled the same shape elsewhere: one classifier picked immediately (style=step), the rest deferred.",
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
        "It costs one tap and it is what routes a note today; first-event r1 has since ruled the same trade elsewhere (style=step, picked up front, the rest deferred), which is this field's own case made for a different door.",
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
        "One inbox holds every note today, gated at 8 an hour regardless of subject. guest-upload r1 has since confirmed the premise directly: a failure mid-event got its own end-of-run sheet, the worst hour named, not assumed.",
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
        "Today: the card swaps for a drawn check; the sender gets no receipt of any kind. The app's bar has moved since: a confirmation worth feeling now opens a modal, not a box up top (app-pricing r1's welcome-to-Pro).",
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
        "A second email is a send to an address nobody verified, a real abuse surface (spoofed sends, inbox bombing); the reference line gets most reassurance for one string, and a note is not the celebration a Pro upgrade is (app-pricing r1).",
      overrule:
        "If a note ever deserves that same feeling, the shipped precedent is a modal, not a bigger card: a fourth option this board does not draw yet.",
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
