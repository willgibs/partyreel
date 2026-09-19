import { defineExploration } from "@/components/lab/exploration";

/**
 * THE MARKETING SITE'S CHROME, ROUND ONE (2026-09-19).
 *
 * Will (docs/design/rulings.md, "the overnight round"): every surface is
 * unprotected, "at worst, net neutral and fully deleted". Eight decisions on
 * the real chrome, each drawn over a real fixture page in a true `Frame` at
 * 1440 and 375: the shipped `Container` row on `--mkt-header-h`, the shipped
 * `NavigationMenu` opened without a cursor, the shipped panel rows and
 * `DemoTicket`, the shipped `FooterDemo`, `FooterQr` and `FooterGlow` on the
 * `.surface-ink` slab, and a local replica of the phone's sheet (the real one
 * is a radix portal and would escape the frame). Not in this round: any
 * production byte; what the glass is MADE of (`glass` round two); the app's
 * own header (`app-shape`); the ratified lines (`voice`); what the demo door
 * promises (`demo-event`); the pages the bar links (sibling lanes own them).
 *
 * ★ WHY TWO DECISIONS STAGE AND SIX DO NOT. `holds` is meaningless until the
 * bar has a mechanism (four hover panels and four flat links are not the same
 * question), and `foot-door` is what the foot OFFERS, which can only be asked
 * once the foot has a job. The other six ask about a different part of the
 * chrome each and carry no order between them.
 */
export const SITE_CHROME = defineExploration({
  id: "site-chrome",
  title: "The site's chrome",
  round: {
    n: 1,
    date: "2026-09-19",
    changed:
      "The first round: what the bar's middle holds, which sections it names, what a signed-in host sees, what a phone gets, what scrolling does to it, what the footer is for, what it offers with no demo set, and which of two pages telling one loop the chrome points at.",
  },
  context:
    'Will (2026-09-19, the overnight round): the chrome every marketing page wears is unprotected like the rest, reconceived from the ground up, "at worst, net neutral and fully deleted". Eight decisions on the real header, panel, phone menu and ink slab.',
  bible: [2, 12, 15, 16, 21, 22],
  asks: [
    {
      id: "shape",
      label: "The shape",
      question: "What should the marketing header's middle hold?",
      context:
        "Three hover panels (Features, Events, Resources) and a flat Pricing, between the wordmark and two doors to /login. The panels hold seventeen rows the footer already lists in full.",
      options: [
        {
          id: "panels",
          label: "Three panels and a flat link, as today",
          means:
            "A hover opens a wide panel of rows, descriptions and a card. Seventeen pages reachable without leaving the one you are on.",
        },
        {
          id: "flat",
          label: "Flat links, no panel at all",
          means:
            "Every entry goes straight to its hub, which already sells its own children better than a one-line panel row can.",
        },
        {
          id: "door",
          label: "The wordmark and one door",
          means:
            "Nothing in the middle. The whole index lives in the footer and the bar is a logo, a login and Start free.",
        },
      ],
      recommended: "flat",
      because:
        "The panel's seventeen rows are the footer's four columns again, and each hub page sells its children better than a one-line description. A flat bar is faster to skim and costs a click almost nobody was taking.",
      overrule:
        "If the six feature pages lean on the header for discovery, a panel is the only place they are one hover away.",
      lands:
        "Whether MegaPanel, the measured indicator and the hover-intent machinery ship at all.",
    },
    {
      id: "holds",
      label: "What it holds",
      question: "Which sections should the bar name?",
      context:
        "Four today: Features, Events, Resources, Pricing. Resources (help, blog, press, contact) is support, and the footer already carries the same four links verbatim as a column.",
      options: [
        {
          id: "four",
          label: "Four, as today",
          means:
            "Features, Events, Resources, Pricing. Resources appears twice on every page of the site, in the bar and in the footer.",
        },
        {
          id: "three",
          label: "Three: Features, Events, Pricing",
          means:
            "Resources folds into the footer, where it already lives. The bar names only what a visitor is deciding about.",
        },
        {
          id: "two",
          label: "Two: How it works, Pricing",
          means:
            "The two questions a first visitor actually has. Everything else is reached through the page and the footer.",
        },
      ],
      recommended: "three",
      because:
        "Resources is where someone goes after something went wrong, not while deciding, and it is already a full footer column. Dropping it leaves the bar naming the product, the occasions and the price.",
      overrule:
        "If the blog and the help center are how strangers arrive, they have earned a door at the top of every page.",
      lands:
        "Whether PRIMARY_NAV keeps its Resources group, and whether the header-to-footer mirror pin survives.",
      after: { ask: "shape" },
    },
    {
      id: "returning",
      label: "The returning host",
      question: "What should the bar show a host who is already signed in?",
      context:
        "Nothing: the marketing chrome has no idea anyone is signed in, so a returning host meets Log in and Start free on every page and clicks through the login route to reach their own events.",
      options: [
        {
          id: "both",
          label: "Log in and Start free, as today",
          means:
            "The chrome stays static and fully cacheable, and a returning host takes one extra hop through /login.",
        },
        {
          id: "dashboard",
          label: "Dashboard in the CTA's place",
          means:
            "A small island reads whether a session cookie exists and swaps the label. A hint, never authorization: the route still checks.",
        },
        {
          id: "avatar",
          label: "The host's avatar and name",
          means:
            "The app's own header, on the marketing site. Needs a real profile read on a page a stranger usually sees.",
        },
      ],
      recommended: "dashboard",
      because:
        "Around fifty marketing routes are statically prerendered, so anything personal has to be a client island. A label swap needs one boolean; an avatar needs a profile fetch on every page for a visitor who is usually a stranger.",
      overrule:
        "If a signed-in host never lands on a marketing page, the honest answer is to change nothing and keep the chrome dumb.",
      lands:
        "Whether the marketing header gains a client island and a session hint, and what that island may read.",
    },
    {
      id: "phone",
      label: "The phone's menu",
      question: "What should a phone get in place of the bar?",
      context:
        "A hamburger opens a full-screen sheet: the bar mirrored at the top, a single-open accordion of the groups, Log in and Start free at the foot. Seventeen links, two taps deep.",
      options: [
        {
          id: "sheet",
          label: "The accordion sheet, as today",
          means:
            "Every group collapsed, one open at a time. Two taps to a feature page, one to a hub, and the menu resets when it closes.",
        },
        {
          id: "flat",
          label: "A sheet of flat rows",
          means:
            "No accordion. Each entry is one tap to its hub, and the hub lists its own children on a page built to show them.",
        },
        {
          id: "bar",
          label: "A standing bar at the thumb",
          means:
            "No hamburger at all: four destinations fixed to the bottom of every page, always one tap and never hidden.",
        },
      ],
      recommended: "flat",
      because:
        "With three or four entries an accordion is a step between a tap and a page that buys nothing. A flat sheet opens tidy, holds no state, and matches whatever the bar above it becomes.",
      overrule:
        "If the panels survive with four groups, the accordion is the only way seventeen rows stay scannable on a phone.",
      lands:
        "Whether the mobile sheet keeps its single-open accordion, and whether a marketing page gains a standing bottom bar.",
      tile: "phone",
    },
    {
      id: "on-scroll",
      label: "On scroll",
      question: "What should the header do once the page has moved?",
      context:
        "It crossfades from transparent to glass and stays 64 px, on every route, forever. The frames below are all scrolled past the hero, which is the only place the three answers differ.",
      options: [
        {
          id: "stay",
          label: "64 px, always, as today",
          means:
            "One height for every page. Anchors, sticky reading rails and scroll margins all ride the same one knob.",
        },
        {
          id: "shrink",
          label: "Shrinks to a 48 px rail",
          means:
            "Past the first screen the bar drops its nav and keeps the wordmark and the action. Sixteen pixels back.",
        },
        {
          id: "hide",
          label: "Hides going down, returns coming up",
          means:
            "The bar gets out of the way while someone is reading and comes back the moment the scroll reverses.",
        },
      ],
      recommended: "stay",
      because:
        "Every anchor, sticky rail and scroll margin on the site derives from one header height, so a bar that changes it mid-page moves all of them. Sixteen pixels is a poor trade, and a hidden bar removes the one control that is always there.",
      overrule:
        "On a phone 64 px is eight percent of the screen; if long reading matters more than the CTA, hiding wins there alone.",
      lands:
        "Whether --mkt-header-h stays one constant, and whether the chrome gains a scroll-direction listener.",
    },
    {
      id: "foot-job",
      label: "The foot's job",
      question: "What should the footer be for?",
      context:
        "Three registers: a sign-off around the demo code, a sitemap of twenty-two links beside the brand block, and a legal bar. It is the last thing on every page of the site.",
      options: [
        {
          id: "three",
          label: "A sign-off, a sitemap, a close",
          means:
            "Today's shape: the demo invitation on top, the index under it, the legal bar last, all at one weight.",
        },
        {
          id: "sitemap",
          label: "The sitemap alone",
          means:
            "No invitation down here. The footer is a directory and a legal bar, and conversion belongs to the page above it.",
        },
        {
          id: "close",
          label: "A closing invitation, the index beneath",
          means:
            "The demo becomes the page's last word at full scale, and the index drops to a quiet directory under it.",
        },
      ],
      recommended: "close",
      because:
        "The footer is the most-seen surface on the site and today's sign-off is half a close already. Every page deserves a last offer, and the index loses nothing by being quieter underneath one.",
      overrule:
        "A footer is often reached on purpose, hunting for Terms; a bigger close puts a wall in front of that reader.",
      lands:
        "Whether the slab's first register grows into a closing hero and the sitemap drops a type step.",
    },
    {
      id: "foot-door",
      label: "The foot's door",
      question: "What should the footer offer when no demo event is set?",
      context:
        "The invitation and the footer's only conversion action vanish together with the demo. On /about, /press, /careers and the 404 there is no CtaBand either, so those pages end with nothing to do.",
      options: [
        {
          id: "vanish",
          label: "Both vanish, as today",
          means:
            "No demo means no code and no Start free: the footer falls back to the thesis alone, with no action on it.",
        },
        {
          id: "always",
          label: "Start free always, the demo when it is set",
          means:
            "The action never depends on an env var. The code appears beside it whenever a demo event is configured.",
        },
        {
          id: "demo",
          label: "The demo alone, the CTA in the header",
          means:
            "One offer per surface: the footer invites you to look, and the sticky bar is the only place you sign up.",
        },
      ],
      recommended: "always",
      because:
        "A conversion action should never be wired to whether a demo event happens to be configured. Four paper routes and the 404 currently end with nothing to do at all, which is the case this fixes.",
      overrule:
        "If Start free is always in view in the bar anyway, a second one in the footer is a repeat rather than a rescue.",
      lands:
        "Whether the footer's CTA is decoupled from DEMO_EVENT_URL, and what the paper routes end on.",
      after: { ask: "foot-job" },
    },
    {
      id: "two-doors",
      label: "Two doors, one loop",
      question: "Two pages tell the same story. Which should the chrome name?",
      context:
        "The Features panel ends on a door to /how-it-works; the Resources card points at the help article telling the same loop. Nothing separates them, and the card says four steps where the article has five.",
      options: [
        {
          id: "unlabelled",
          label: "Two doors, as today",
          means:
            "Both stay and neither says which is which. A visitor picks one and finds most of the same story behind it.",
        },
        {
          id: "one",
          label: "One door: the page",
          means:
            "The chrome links /how-it-works only. The article stays one row under Help center, where a stuck reader is already looking.",
        },
        {
          id: "named",
          label: "Two doors, named apart",
          means:
            "The page is the one to watch and the article the one to read, and each door says which it is in its own words.",
        },
      ],
      recommended: "one",
      because:
        "One idea deserves one door in a bar. The article is not lost by this: it sits under Help center, which is where a reader with a problem goes, and the page is what a stranger wants.",
      overrule:
        "If the help article outranks the page in search, the card is real traffic and should be named apart, not removed.",
      lands:
        "Whether the Resources panel keeps a how-it-works card, and what the footer's Product column points at.",
    },
  ],
});
