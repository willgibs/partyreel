import { defineExploration } from "@/components/lab/exploration";

/**
 * THE ADMIN PORTAL'S SHAPE, ROUND ONE (2026-09-18).
 *
 * Will: "we've barely touched the admin portal since we threw up the first
 * version way back... nothing is unprotected and the full portal could likely
 * be rethought from the ground up... plenty of thought should go into this
 * prior to diving straight in." And on what it should look like: "If we can
 * simply carry over a foundational identity (logo, font family/weight/spacing,
 * achromatic palette [we'll want additional real colors for the admin portal
 * too, like charts], etc) - the rest of the admin is free to be its own thing...
 * more an on-brand devtool" (docs/design/rulings.md, 2026-09-18).
 *
 * So this round asks the SHAPE and nothing else. Seven decisions, every option
 * drawn on the real admin components fed one Tuesday's fixtures, at 1440 by 900,
 * which is a laptop screen: what is below the fold is below the fold, because
 * how much of a day fits on one screen is half of what is being decided.
 *
 * ★ WHAT IS DELIBERATELY NOT ASKED. The chart ramp's five colours are already
 * on the desk (the loose ends board's first two decisions), so asking again
 * here would put two boards on one answer; the state decision below says so in
 * its own context. The security seam (`requireAdmin`, the host guard, AAL2) is
 * never a design variable and no option touches it. And no step is drawn at
 * 375: an operator is on a laptop or a desktop, and a phone answer for this
 * portal is a question for the round that knows what the shape is.
 *
 * ★ THE STAGING IS THE MANIFEST'S. The nav, the density and the health signal
 * all wait on the home, because each of them is a different question once the
 * home has a shape; the chrome waits on the nav, because a bar beside a rail
 * is not the bar the dropdown needs. The colour of a state and the grammar of a
 * destructive act depend on none of it and can be taken in any order.
 */
export const ADMIN = defineExploration({
  id: "admin",
  title: "The admin portal",
  round: {
    n: 1,
    date: "2026-09-18",
    changed:
      "The first round: the home, the nav, the density of a list, the colour of a state, the grammar of a destructive act, where the backend's health is said, and how much of the product's bar the portal keeps. The surfaces themselves follow from these.",
  },
  context:
    "Sixteen routes behind one dropdown, every page a column of cards, no tables and no health signal anywhere but /admin/jobs. Will's ruling of 2026-09-18 keeps the wordmark, the faces and the achromatic base and frees the rest as an on-brand devtool, with real colour allowed. Every option here is the real components on one Tuesday: two backend runs in trouble, one account over its cap, three open reports, nine unanswered messages.",
  bible: [15, 19, 21],
  asks: [
    {
      id: "home",
      label: "The operator's home",
      question: "What should the portal open on?",
      context:
        "Today it is a grid of nine cards badged with counts. Every option draws the same Tuesday: two backend runs in trouble, one account over its cap, three open reports, nine unanswered messages, two unread applications.",
      options: [
        {
          id: "grid",
          label: "The card grid, as today",
          means:
            "Nine doors, three of them carrying a number. A calm platform and a burning one draw the same page.",
        },
        {
          id: "console",
          label: "One ranked list of what is waiting",
          means:
            "Everything open, worst first, with how long it has waited. Surfaces with nothing pending shrink to chips.",
        },
        {
          id: "kpi",
          label: "The numbers first, the queue beneath",
          means:
            "Four figures and a fortnight's trend open the page, and the same queue sits under them.",
        },
      ],
      recommended: "console",
      because:
        "The portal is opened to find out what is wrong, and the nav answers where to click twice over already. Only a ranked list can say that a failed purge outranks a press enquiry.",
      overrule:
        "If you open the admin to read the numbers more often than to fix something, the KPI page is the honest home.",
      lands:
        "What /admin is, and what the eleven other surfaces are reached from.",
    },
    {
      id: "nav",
      label: "The navigation",
      question: "How should twelve surfaces be reached?",
      context:
        "One dropdown holds them today, in four groups you cannot see until you open it. Drawn on the home you just picked, so the two are judged together rather than one at a time.",
      options: [
        {
          id: "dropdown",
          label: "The dropdown, as today",
          means:
            "One control, no pixels spent, and twelve surfaces invisible until you open it.",
        },
        {
          id: "rail",
          label: "A rail down the side, groups on show",
          means:
            "232 px of permanent structure: every surface, its group and its pending count readable without a click.",
        },
        {
          id: "rail-palette",
          label: "The rail, plus a command palette",
          means:
            "The same rail with a search that jumps to a surface, an account or an action. Drawn open, because closed it is one more row.",
        },
      ],
      recommended: "rail-palette",
      because:
        "A solo operator does the same eight things a day, and a palette reaches rows a nav can never hold: an account, a job, an action. It is one component on top of the rail.",
      overrule:
        "If you would rather ship the rail alone and add search once the shape has settled, the rail is this answer minus one component.",
      lands:
        "The shell every admin page sits in, and whether the portal keeps the product's centred column.",
      after: { ask: "home" },
    },
    {
      id: "density",
      label: "Density and the list",
      question: "What shape does a list take in this portal?",
      context:
        "Nine support messages and six accounts, the same rows under each answer. A support row carries a paragraph somebody wrote; an account row carries five numbers. Today both are cards.",
      options: [
        {
          id: "cards",
          label: "Cards, as today",
          means:
            "The whole message on the page, and about 1,400 pixels for nine of them. Storage gets no column and nothing sorts.",
        },
        {
          id: "table",
          label: "One dense table everywhere",
          means:
            "Nine messages and six accounts on a screen, sortable, with checkboxes and a bulk bar. A message truncates to a line.",
        },
        {
          id: "hybrid",
          label: "A table for data, a pane for prose",
          means:
            "Accounts become a table, the inbox a list beside the message you are reading. Two shapes, chosen by what a row holds.",
        },
      ],
      recommended: "hybrid",
      because:
        "A message truncated to one line makes the table useless for the one thing the inbox is opened for, and an account drawn as a card wastes the screen its storage meter needs.",
      overrule:
        "If nine messages a week never becomes ninety, one table everywhere is one shape to build and one to learn.",
      lands:
        "The inboxes, the accounts list, the applicants list and every feed the portal grows.",
      after: { ask: "home" },
    },
    {
      id: "colour",
      label: "Colour for state",
      question: "How far should a state's colour travel?",
      context:
        "The jobs console on the same Tuesday: four jobs in four states, eight runs of which two failed. Today only a failure has colour, so healthy, paused and never-run share one grey. The chart ramp is asked elsewhere.",
      options: [
        {
          id: "achromatic",
          label: "Grey, with red for a failure",
          means:
            "What ships today. Nothing new to keep, and three different meanings sharing one voice.",
        },
        {
          id: "badges",
          label: "Four states, four colours, in the chip",
          means:
            "Green, amber, red and blue in chips and dots only. Text, rows and surfaces stay achromatic.",
        },
        {
          id: "rows",
          label: "The same four, reaching the row",
          means:
            "A failed run tints its own row and takes a leading edge, so a bad run is found by scrolling rather than by reading.",
        },
      ],
      recommended: "badges",
      because:
        "Four states want four voices, and the chip is where an operator already looks. The tint is the first thing that makes a dense table read like a spreadsheet.",
      overrule:
        "If the run table grows past a screen, the tint is the only thing that finds a failure without reading every row.",
      lands:
        "Every badge, dot and row here, and whether the admin gets state tokens the product does not have.",
    },
    {
      id: "destructive",
      label: "Destructive actions",
      question: "What should happen when you press something destructive?",
      context:
        "Three acts side by side: deleting an account is permanent, removing a photo is reversible for seven days, pausing the purge sweep is reversible at once and costs storage every hour. The portal has four answers today.",
      options: [
        {
          id: "mixed",
          label: "As today: each surface decides",
          means:
            "A typed dialog for an account, a plain one for a photo, and a bare switch for the sweep, the cheapest click in the portal.",
        },
        {
          id: "sheet",
          label: "One sheet, sized to the damage",
          means:
            "Every act opens the same panel listing what it touches, and only the permanent one makes you type.",
        },
        {
          id: "arm",
          label: "Arm in place, and write it down",
          means:
            "No dialog: the button arms and a second click does it, and every act lands in a What you did line with an Undo where there is one.",
        },
      ],
      recommended: "sheet",
      because:
        "The damage varies more here than anywhere, and only a panel can say what an act touches before it happens: 18 events, 40 GB a day, two events under legal hold.",
      overrule:
        "If you never want a dialog between you and a fix, arming in place with the audit line is faster and still recoverable.",
      lands:
        "Every destructive control in the portal, and whether an operator's own actions are recorded at all.",
    },
    {
      id: "health",
      label: "The health strip",
      question: "Where should the backend's health be said?",
      context:
        "Two jobs are in trouble and you are not on the jobs page. Drawn on the home and the nav you picked, on a day when the signal is loud rather than green.",
      options: [
        {
          id: "none",
          label: "Only on the jobs page, as today",
          means:
            "The portal stays quiet, and the signal waits on the page that holds the detail.",
        },
        {
          id: "portal",
          label: "A band under the bar, on every page",
          means:
            "Loud on whichever page you are reading, with a chip in the bar beside it. On a good day it is not there at all.",
        },
        {
          id: "home",
          label: "A panel on the home, and nowhere else",
          means:
            "Four jobs and their states at the top of the page you land on; the other eleven surfaces stay clean.",
        },
      ],
      recommended: "portal",
      because:
        "A signal you have to navigate to is one you check when you already suspect. On a good day the band is absent, so it costs nothing to carry.",
      overrule:
        "If you land on the home every time anyway, the panel says the same thing without putting a band on eleven other pages.",
      lands:
        "Whether the shell carries a health signal at all, and what /admin/jobs still owes.",
      after: { ask: "home" },
    },
    {
      id: "chrome",
      label: "The chrome's identity",
      question: "How much of the product's bar should the portal keep?",
      context:
        "The wordmark, the faces and the achromatic base carry over by ruling; the rest of the bar is free. Drawn in the nav you picked, so the bar is judged with whatever sits under it.",
      options: [
        {
          id: "today",
          label: "The wordmark and an Ops chip, as today",
          means:
            "56 px of bar, the Ops chip beside the wordmark, the operator's address in full and a Sign out button.",
        },
        {
          id: "plain",
          label: "The wordmark alone",
          means:
            "Nothing but the mark and the operator. Which surface you are on is the page heading's job.",
        },
        {
          id: "devtool",
          label: "A short tool bar",
          means:
            "44 px, a breadcrumb naming the surface, a live tag, the health chip and an initial. Twelve pixels handed back to the work.",
        },
      ],
      recommended: "devtool",
      because:
        "It is the one option that says which surface, which environment and whether anything is wrong without spending a row, which is what an on-brand devtool means in practice.",
      overrule:
        "If the portal should read as the product with a different job rather than a different tool, today's Ops chip already says that.",
      lands:
        "The header on every admin page, and whether the portal keeps the product's 1280 column.",
      after: { ask: "nav" },
    },
  ],
});
