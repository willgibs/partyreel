import type { Control } from "@/components/lab/board-spec";
import { defineExploration } from "@/components/lab/exploration";

/**
 * EVERY EMAIL PARTYREEL SENDS, ROUND ONE (2026-09-19).
 *
 * Will ("the overnight round"): explore every
 * surface, everything unprotected, "at worst, net neutral and fully
 * deleted." Mail is the one surface of the product that arrives inside
 * someone else's inbox rather than inside ours, so it is asked from the
 * shell up: does every mail wear one wrapper, what does that wrapper carry
 * of the brand, who does it say it's from, does it carry the lines an
 * unsubscribe law expects, what could the one mail out of this repo's reach
 * become, which moments deserve a send at all, whether a guest is ever one
 * of them, and how the whole thing reads in a dark inbox.
 *
 * ★ EVERY OPTION IS THE REAL `templates.ts` FUNCTION, CALLED WITH A FIXTURE.
 * `fixtures.ts` calls the ten real exports with one fixed cast (three hosts,
 * two outside senders); nothing on this board writes mail copy of its own.
 * Three decisions (`shell`, `brand`, `dark`) are about the WRAPPER around
 * that real copy, so they read it back out with `extract.splitLayout`
 * (heading, body, button, footer) and re-skin only the wrapper; the other
 * five draw the real `{ subject, html }` unmodified, or (the sign-in code,
 * out of this repo, and the four dormant switches, wired to nothing) a mock
 * labelled as one. No preview imports `send.ts` or `client.ts`; nothing here
 * sends.
 *
 * ★ THE FLOW REFRESH (2026-09-28). Two reached asks redrawn, and two asks
 * moved in from other boards; `shell`, `brand`, `sender`, `foot`, `code` and
 * `dark` are untouched, word for word and drawing for drawing.
 *  - `moments`: Will's `identity-claims` r3 `pointer=line` keeps the event
 *    self-contained, so `identity` is one mail sent after she confirms at the
 *    keep, echoing the dashboard banner claims-wiring built, never from a
 *    confirmation before her first upload.
 *  - `guest`: the keep (guest-door) mails every confirming guest a code, so
 *    "nothing ever arrives" was false; the ask narrows to the one guest with
 *    an address and nothing sent, the one who said Maybe later.
 *  - `letin` (event-safety `waiting`'s mail half, its three roads) and
 *    `reporter` (admin-triage `notice`'s `both`, plus the outcome said as a
 *    genuine third) are their own asks: three triggers to three people are
 *    three decisions, and forcing them into one would draw its options as
 *    combinations rather than contenders.
 */

/** The knob every decision shares, so one inbox width is on the stage at a
 * time: a phone's by default, a laptop's on the knob. */
const SCREEN: Control = {
  id: "screen",
  label: "Screen",
  options: [
    { id: "375", label: "375, a phone" },
    { id: "1440", label: "1440, a laptop" },
  ],
  default: "375",
};

const DRAFT = defineExploration({
  id: "emails",
  title: "Every email Partyreel sends",
  round: {
    n: 1,
    date: "2026-09-28",
    changed:
      "The flow refresh: moments' identity mail follows the keep and echoes the dashboard banner; guest narrows to Maybe later; the let-in mail (event-safety) and the reporter's note (admin-triage) join as their own asks.",
  },
  context:
    "Ten templates ship today from templates.ts, all from one address, in two hand-maintained wrappers; a guest's only mail is her sign-in code, a Supabase template. Every option here is the real function where one exists, read inside an inbox mock at a phone's width and a laptop's.",
  carried: [
    {
      id: "three-asks",
      question:
        "Are a guest's link, a let-in mail and a reporter's note one decision?",
      taken:
        "Three: three triggers to three people, each its own ask over two inboxes, every option the two boards had kept.",
      overrule:
        "Fold them back into one guest ask if a single question about a guest's mail reads faster.",
    },
    {
      id: "outcome-third",
      question: "What is the reporter ask's third road?",
      taken:
        "A note that says what was decided, beside silence and a note in the same words whatever happened.",
      overrule:
        "Drop it if an operator's decision should never leave the portal.",
    },
  ],
  asks: [
    /* ── 1. One shell ────────────────────────────────────────────────── */
    {
      id: "shell",
      label: "One shell",
      question:
        "Should every Partyreel email share one wrapper, now a repeated control is ruled into one component elsewhere?",
      context:
        "App-vocabulary r1 turns a repeated control into one component with props, leaving unifying discretionary for genuinely different purposes. Mail's four alerts hand-roll the same div, exactly the case that decision was written for.",
      options: [
        {
          id: "today",
          label: "Two wrappers, as today",
          means:
            "Host mail keeps its card; each operator alert keeps its own hand-rolled div.",
        },
        {
          id: "unified",
          label: "One wrapper, two feet",
          means:
            "Every mail shares one card at one width; only the footer line (host or operator) differs.",
        },
        {
          id: "plain",
          label: "Operator mail goes plain text",
          means:
            "Host mail keeps its card; the four operator alerts drop to plain text, no styling at all.",
        },
      ],
      recommended: "unified",
      because:
        "The batch already folded four near-identical components into one apiece elsewhere; mail's four hand-rolled alerts are the same duplication with the same fix, one wrapper and a foot parameter.",
      overrule:
        "If nobody but Will ever opens an operator alert, plain text is honestly less to maintain.",
      lands: "Whether layout() gains a foot parameter, or the two idioms stay two code paths.",
      tile: "phone",
      configs: [SCREEN],
    },

    /* ── 2. The brand (after shell) ──────────────────────────────────── */
    {
      id: "brand",
      label: "The brand",
      question: "How should the shell carry the brand?",
      context:
        "Today's card has no logo anywhere and a rose button (#e11d48) the product uses nowhere else; theme.css calls the brand ink only. Drawn on the same over-cap mail, inside the unified shell.",
      options: [
        {
          id: "bare",
          label: "Bare, the rose button",
          means: "As today: no logo, the rose CTA.",
        },
        {
          id: "ink",
          label: "Ink only",
          means: "No logo; the CTA takes the brand's own ink, not the rose.",
        },
        {
          id: "wordmark",
          label: "The wordmark at the head",
          means:
            "The inline SVG wordmark every other door already wears, above the heading.",
        },
        {
          id: "aurora",
          label: "The wordmark and the aurora",
          means:
            "The wordmark, plus a soft aurora band behind it, the marketing site's own light.",
        },
      ],
      recommended: "wordmark",
      because:
        "Every other door already carries the wordmark alone in ink (2026-09-17); mail is the one surface still saying nothing is Partyreel until the footer line, and it costs no raster asset.",
      overrule:
        "If the aurora survives real inbox clients (Gmail and Outlook both guess at background gradients), it is the fuller moment for cheap.",
      lands: "Whether templates.ts's shared layout() gains a logo and drops the rose.",
      after: { ask: "shell" },
      tile: "phone",
      configs: [SCREEN],
    },

    /* ── 3. The sender ───────────────────────────────────────────────── */
    {
      id: "sender",
      label: "The sender",
      question: "Who should a Partyreel email say it's from?",
      context:
        "Every mail sends as \"Partyreel <noreply@partyreel.com>\" today; two of the four operator alerts tag their subject (\"[Partyreel] ...\"), two don't. Drawn on the over-cap mail and the contact-form alert.",
      options: [
        {
          id: "system",
          label: "Noreply, as today",
          means: "Every mail, host and operator alike, from the same system address.",
        },
        {
          id: "person",
          label: "A person for host mail",
          means: "Host mail from \"Will at Partyreel\"; a reply reaches someone.",
        },
        {
          id: "tagged",
          label: "Operator subjects, tagged",
          means:
            "Sender stays noreply; all four operator alerts gain the same tag, not just two.",
        },
      ],
      recommended: "tagged",
      because:
        "A person-sender promises a reply the product can't back yet at one operator; the tag is free, already half-shipped, and helps filter today's inbox.",
      overrule: "Once a real support rotation reads a shared inbox, a person becomes honest.",
      lands: "Whether EMAIL_FROM varies by kind, and whether every operator subject shares one tag.",
      tile: "phone",
      configs: [SCREEN],
    },

    /* ── 4. The foot ─────────────────────────────────────────────────── */
    {
      id: "foot",
      label: "The foot",
      question: "Should every email carry an unsubscribe and an address?",
      context:
        "One line today (\"you're receiving this because you host an event\"), no unsubscribe, no postal address, on any of the ten. Drawn on the renewal nudge, the mail that reads closest to a sales prompt.",
      options: [
        {
          id: "line",
          label: "One line, as today",
          means: "No unsubscribe, no address, on any mail.",
        },
        {
          id: "commercial",
          label: "On the commercial-leaning four",
          means: "An unsubscribe and an address on the renewal nudge and the over-cap trio only.",
        },
        {
          id: "every",
          label: "On every mail",
          means: "An unsubscribe and an address, even on deletion warnings and operator alerts.",
        },
      ],
      recommended: "commercial",
      because:
        "The renewal nudge and the over-cap trio read closest to an upsell; the other six are account and service mail, where an unsubscribe on a deletion warning would make no sense.",
      overrule: "A blanket rule is simpler to audit if legal weight ever needs to win over nuance.",
      lands: "Whether layout() takes a footAddress flag, and which callers pass it.",
      tile: "phone",
      configs: [SCREEN],
    },

    /* ── 5. The code ─────────────────────────────────────────────────── */
    {
      id: "code",
      label: "The code",
      question:
        "Now the verified-required gate itself promises \"One tap and you're in,\" what should the mail actually ask her to tap?",
      context:
        "App-door r1 makes the code the way in for everybody, and a tapped link still strands an iPhone PWA, so digits lead with a way to continue beneath them. They are also the one thing she can act on without leaving her inbox.",
      options: [
        {
          id: "continue",
          label: "\"Continue\", as drawn",
          means: "The digits lead; a plain Continue button sits under them for the link path.",
        },
        {
          id: "promise",
          label: "The gate's own words",
          means:
            "The same button, reading \"One tap, you're in\" instead, echoing the line she just read on the gate.",
        },
        {
          id: "copy",
          label: "No button: the digits themselves",
          means:
            "The code sits in a highlighted block, captioned for a tap-and-hold copy; a small text link beneath covers the PWA-stranded fallback.",
        },
      ],
      recommended: "copy",
      because:
        "Both button labels argue about a tap this mail rarely resolves alone: \"Continue\" undersells it, the gate's words repeat a promise this inbox can't keep. No client can wire a real one-tap copy, but her app has an input waiting for six digits, and captioning the code for it needs no button at all.",
      overrule:
        "If most people read this on a different device than the one waiting for it, a Continue button that jumps straight to the browser is the safer default.",
      lands:
        "What the dashboard template's tap target could be, if it's ever redrawn; nothing here is wired.",
      tile: "phone",
      configs: [SCREEN],
    },

    /* ── 6. The moments ──────────────────────────────────────────────── */
    {
      id: "moments",
      label: "The moments",
      question:
        "Which moments should really send a mail now: the three as drawn, nothing yet, or one after the keep's confirm?",
      context:
        "A dead switch is ruled absent, never drawn empty (app-shape r2). His pointer=line keeps the event self-contained: a guest's other waiting events are hers to handle on her dashboard later, never a pointer out before she uploads.",
      options: [
        {
          id: "shipped",
          label: "The three as drawn",
          means:
            "The three switches gain real sends, drawn here as labelled subjects.",
        },
        {
          id: "retired",
          label: "Build nothing yet",
          means:
            "The dead switches leave; no replacement mail ships this round, the roster stays at ten.",
        },
        {
          id: "identity",
          label: "One mail after the keep's confirm",
          means:
            "Retire the three; when a guest confirms at the keep and other events wait under her address, one mail says what the dashboard's banner says.",
        },
      ],
      recommended: "identity",
      because:
        "The three as drawn were written before an email could make an account. The moment worth a real send is her confirm at the keep, after her upload: one mail in the banner's own words, pointing at her dashboard, never out of the event before she has added to it.",
      overrule:
        "If the banner is enough on its own (she meets it the next time she opens her dashboard), build nothing and keep the roster at ten.",
      lands:
        "Whether notification-prefs-form.tsx keeps any dormant rows, and which template templates.ts gains next.",
      tile: "phone",
      configs: [SCREEN],
    },

    /* ── 7. The guest's (after moments) ──────────────────────────────── */
    {
      id: "guest",
      label: "The guest's link",
      question:
        "Should a guest who said Maybe later, but left her address at the door, get her album's link once?",
      context:
        "Confirming at the keep, after her first upload, mails a guest her code. One guest gets nothing: she typed an address at the door, uploaded, then chose Maybe later. It is unproved and never mailed alone; ROADMAP holds a one-shot link.",
      options: [
        {
          id: "none",
          label: "Only the code, as today",
          means:
            "A guest who confirms gets her code; one who said Maybe later hears nothing, her address stored and never mailed.",
        },
        {
          id: "link",
          label: "Her album's link, once",
          means:
            "Maybe later with an address on file sends one mail, once, with her album's link and a This wasn't me that takes the address off.",
        },
        {
          id: "both",
          label: "The link, and one after the party",
          means:
            'The link mail, plus a later "your photographs are in" once the party is behind her.',
        },
      ],
      recommended: "link",
      today: "none",
      because:
        "A guest who put the keep down still left an address and her photographs; her album's link, once, is the one thing worth sending, and This wasn't me undoes a mistyped address. The party has no end (events have no end date) to time a second mail by.",
      overrule:
        "If mailing an address nobody proved is one risk too many, her code stays the only mail a guest ever gets.",
      lands:
        "Whether the keep's Maybe later sends one sendOnce mail (guest_event_link) to her unproved address.",
      after: { ask: "moments" },
      tile: "phone",
      configs: [SCREEN],
    },

    /* ── 8. Let in (from event-safety) ───────────────────────────────── */
    {
      id: "letin",
      label: "A newcomer let in",
      question:
        "When a host lets a waiting newcomer in, should Partyreel mail her?",
      context:
        "If Approve newcomers or an invite list ships (event-safety), a newcomer with a confirmed email waits at the door until the host lets her in, and the door opens by itself. That board kept the door; its mail half moved here.",
      options: [
        {
          id: "none",
          label: "No mail: the door opens itself",
          means:
            "The held door opens onto the album the moment the host lets her in. Nothing is sent; one who left checks back.",
        },
        {
          id: "always",
          label: "A mail every time she's let in",
          means:
            "The door still opens by itself, and a You're in mail with the album's link follows every let-in.",
        },
        {
          id: "left",
          label: "A mail only if she has left",
          means:
            "The door opens while she watches; only if she closed it before the host decided does a You're in mail bring her back.",
        },
      ],
      recommended: "left",
      because:
        "At a party a host decides in minutes, so the door should open by itself while she watches; one who pocketed her phone should not have to keep checking back. Her address is confirmed here, so the mail reaches her and no one else.",
      overrule:
        "If one more mail per guest is more than a party needs, the door alone is simpler and sends nothing.",
      lands:
        "Whether letting a waiting guest in sends a mail, and whether the door knows she has gone.",
      tile: "phone",
      configs: [SCREEN],
    },

    /* ── 9. The reporter (from admin-triage) ─────────────────────────── */
    {
      id: "reporter",
      label: "The reporter",
      question:
        "When an operator closes a report, should the guest who sent it hear back?",
      context:
        "A report queues an operator's review and hides nothing. No report keeps who sent it (no reporter column, by choice: a privacy decision of its own), and only a confirmed address is ever mailed. The host's line stays in admin-triage.",
      options: [
        {
          id: "none",
          label: "Nothing, as today",
          means:
            "The report closes in silence and keeps no one's name. She sees what she reported gone or still there, and is told nothing.",
        },
        {
          id: "note",
          label: "A closing note, the same words",
          means:
            "One mail as it closes: we looked, thank you, the same words whatever the operator did. Who sent it is kept only until then.",
        },
        {
          id: "outcome",
          label: "A note that says what happened",
          means:
            "One mail as it closes, saying whether what she reported was removed or stays up. Who sent it is kept only until then.",
        },
      ],
      recommended: "note",
      today: "none",
      because:
        "A report that vanishes teaches a guest not to report again. One note, the same words whatever was decided, closes the loop without saying what an operator did, so a legal hold still reads like any other review.",
      overrule:
        "If keeping who reported whom, even until the report closes, is a privacy line not to cross, the report stays anonymous and silent.",
      lands:
        "Whether a report keeps who sent it until it closes, and whether an operator's close sends a note.",
      tile: "phone",
      configs: [SCREEN],
    },

    /* ── 10. The dark inbox (after brand) ─────────────────────────────── */
    {
      id: "dark",
      label: "The dark inbox",
      question: "How should the shell read in a dark inbox?",
      context:
        "layout() declares a text colour and no background at all, so a dark-mode client is free to guess. Drawn on the over-cap mail beside a light and a dark reading pane.",
      options: [
        {
          id: "today",
          label: "Undeclared, as today",
          means: "No colour-scheme hint; a dark client inherits its own ground under near-black text.",
        },
        {
          id: "light",
          label: "Declares light",
          means: "An explicit white island, forced, whatever the inbox around it does.",
        },
        {
          id: "both",
          label: "Drawn for both",
          means: "A true dark rendition: a dark surface, light text, its own button contrast.",
        },
      ],
      recommended: "light",
      because:
        "Dark-mode guessing is inconsistent across Gmail, Outlook and Apple Mail; forcing light is the one-line fix that guarantees the card is never illegible.",
      overrule: "Once mail is a bigger surface, matching the app's own dark chrome earns the extra testing.",
      lands: "Whether layout() declares color-scheme:light, or grows a real dark variant.",
      after: { ask: "brand" },
      tile: "phone",
      configs: [SCREEN],
    },
  ],
});

/**
 * ★ ONE KNOB PER ID, NOT ONE PER DECISION THAT USES IT (guest-upload's fix,
 * carried here). `defineExploration` flattens every decision's `configs`
 * into the board's controls, so the shared `screen` knob would otherwise
 * arrive eight times.
 */
export const EMAILS: typeof DRAFT = {
  ...DRAFT,
  controls: DRAFT.controls?.filter(
    (c, i, all) => all.findIndex((d) => d.id === c.id) === i,
  ),
};
