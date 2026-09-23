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
    date: "2026-09-21",
    changed:
      "The overtaken audit's reshape: four questions reframed with app-vocabulary r1, app-door r1, first-event r1, app-shape r2 and the identity reshape folded in; moments gains a new option, the set the identity door implies.",
  },
  context:
    "Ten templates ship today, all from one address, none to a guest, in two hand-maintained wrappers. Every option here is the real function in templates.ts, read inside an inbox mock at a phone's width and a laptop's.",
  bible: [1, 2, 19, 21, 22],
  asks: [
    /* ── 1. One shell ────────────────────────────────────────────────── */
    {
      id: "shell",
      label: "One shell",
      question:
        "Should every Partyreel email share one wrapper, now a repeated control is ruled into one component elsewhere?",
      context:
        "App-vocabulary r1 turns a repeated control into one component with props, though his note leaves unifying discretionary for genuinely different purposes. Mail's four alerts hand-roll the same div, the case the ruling was written for.",
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
        "Now the verified-required gate itself promises \"One tap and you're in,\" what should the mail's own button say?",
      context:
        "App-door r1 makes the code the way in for everybody, and a tapped link still strands an iPhone PWA, so digits lead with a button beneath. What's open is only the button's word, now the gate has already promised \"one tap.\"",
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
      ],
      recommended: "continue",
      because:
        "\"Continue\" is honest about what the tap actually does (it still has to land her back in the browser); the gate's own line already told her how it will feel, and repeating it here turns a promise into a claim the button has to live up to a second time.",
      overrule:
        "If the mail should carry the same voice the gate just used, echoing it here is one word away and costs nothing the layout doesn't already have room for.",
      lands: "What the dashboard template's button could say, if it's ever redrawn; nothing here is wired.",
      tile: "phone",
      configs: [SCREEN],
    },

    /* ── 6. The moments ──────────────────────────────────────────────── */
    {
      id: "moments",
      label: "The moments",
      question:
        "Which moments should really send a mail now: the three as drawn, nothing yet, or the set the new door implies?",
      context:
        "A dead switch is ruled absent, never drawn empty (app-shape r2): the reel's own is impossible now, not unbuilt. What's open is what gets built for real; identity adds a candidate the three never saw.",
      options: [
        {
          id: "shipped",
          label: "The three as drawn",
          means: "The three switches gain real sends, drawn here as labelled subjects.",
        },
        {
          id: "retired",
          label: "Build nothing yet",
          means: "The dead switches leave; no replacement mail ships this round, the roster stays at ten.",
        },
        {
          id: "identity",
          label: "The set the new door implies",
          means: "Retire the three as drawn; wire the moment the identity reshape's capture flow creates instead, an email confirmed into an account.",
        },
      ],
      recommended: "identity",
      because:
        "The three as drawn were written before an email could ever make an account; the identity reshape's own door is the moment most worth a real send right now, and it costs no more than one of the three it replaces.",
      overrule:
        "If identity-claims settles on a bell or banner, wire this mail as its echo; if guest-capture's own offer differs, follow that instead of the three as drawn.",
      lands: "Whether notification-prefs-form.tsx keeps any dormant rows, and which template templates.ts gains next.",
      tile: "phone",
      configs: [SCREEN],
    },

    /* ── 7. The guest's (after moments) ──────────────────────────────── */
    {
      id: "guest",
      label: "The guest's",
      question:
        "Should a guest ever get a mail from Partyreel, now confirming an email makes the account?",
      context:
        "Guest-shape r1 takes the address on a promise to keep the album. Will's identity ruling (2026-09-22): a names-mode door captures an optional unconfirmed email, never mailed on its own; a one-shot album mail only after a completed upload.",
      options: [
        {
          id: "none",
          label: "Nothing, as today",
          means: "The address is stored; no mail ever follows it.",
        },
        {
          id: "link",
          label: "The album link, once",
          means: "One mail on their first completed upload, once an address is on file, carrying their album's link.",
        },
        {
          id: "both",
          label: "The link, and one after the party",
          means: "The link mail, plus a later \"your photographs are in.\"",
        },
      ],
      recommended: "link",
      because:
        "The second mail still needs a \"the party is over\" signal the product doesn't have (events have no end date, by design), so the one thing worth sending stays the link, whether it rides inside the verification or right after it.",
      overrule: "If a real end-of-event signal ever lands, the second mail becomes cheap.",
      lands: "Whether the capture-email route gains a sendOnce call and a new template.",
      after: { ask: "moments" },
      tile: "phone",
      configs: [SCREEN],
    },

    /* ── 8. The dark inbox (after brand) ─────────────────────────────── */
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
