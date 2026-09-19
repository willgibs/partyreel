import { defineExploration } from "@/components/lab/exploration";

/**
 * THE PAGE THAT TELLS THE LOOP, BESIDE THE ARTICLE THAT TELLS IT TOO, ROUND
 * ONE (2026-09-19, the overnight round).
 *
 * Will (docs/design/rulings.md, "the overnight round"): every surface is
 * unprotected, "at worst, net neutral and fully deleted". Eight decisions on
 * the real page pieces (`PageHero`, `PaperChapter`, the spine, `ReelPayoff`,
 * `PricingPointer`, `CtaBand`), drawn at 1440 and 375, every option's height
 * and its first product picture's depth measured in the frame rather than
 * asserted. Not in this round: any production byte; the h1 and hero sub as
 * ratified lines (`voice` has no recorded review yet, so this board keeps
 * today's h1 and writes its own placeholder copy elsewhere, judged for size
 * and wrapping only); what the demo door promises (`demo-event`); `/pricing`
 * (`pricing-page`); the home's film strip (the home's own round).
 *
 * ★ ONE PAGE, EIGHT DECISIONS, TWO OF THEM SHARING NO ORDER (the pricing-page
 * precedent). THE STEPS and THE PICTURES both draw the same spine and carry no
 * `after` between them, so each reads the other's live pick and falls back to
 * its own recommendation (state.ts): answer either first and the other's
 * preview already wears it. THE PHONE alone is staged, because what a phone
 * wraps around the payoff depends on which frame vocabulary THE PICTURES
 * chose.
 */
export const HOW_IT_WORKS = defineExploration({
  id: "how-it-works",
  title: "The page that tells the loop",
  round: {
    n: 1,
    date: "2026-09-19",
    changed:
      "The first round: whether the page and the help article merge or keep two names, who it greets first, how many steps and whether step one tells the truth, whether the pictures wear the site's own frames, the spine's shape, what the payoff proves, the phone, and how the page closes.",
  },
  context:
    "Will (2026-09-19, the overnight round): every surface is unprotected, \"at worst, net neutral and fully deleted\". Eight decisions on the real page pieces, drawn at 1440 and 375, every option's height and first product picture measured in the frame, never asserted.",
  bible: [1, 7, 17, 18, 21, 22],
  asks: [
    /* ── 1. The pair ─────────────────────────────────────────────────── */
    {
      id: "pair",
      label: "The pair",
      question:
        "Should the page and the help article stay two names for one loop, or merge?",
      context:
        "This page and the help article both tell the loop start to finish, and the identical link text \"How Partyreel works\" leads to each from a different place on the site.",
      options: [
        {
          id: "split",
          label: "Two pages, same name",
          means:
            "Keep both exactly as they are: the page and the article, reached by the same three words wherever either is linked.",
        },
        {
          id: "merged",
          label: "One page, folded in",
          means:
            "The article's steps and cost details move onto this page as its own deeper text; the separate article page retires.",
        },
        {
          id: "renamed",
          label: "Both kept, each its own name",
          means:
            "Same two pages, same split, but the link text differs by destination so a click always says where it goes.",
        },
      ],
      recommended: "renamed",
      because:
        "The split does real work: this page orients a first-time visitor on the six-step arc while the article is the dense, linkable reference search and the help center need. The only bug is the identical name, which costs a label change, not a merge.",
      overrule:
        "If almost nobody reaches the article except by search, and the two pages say the same thing twice, folding them into one is the cheaper page to keep current.",
      lands:
        "The spine's GoDeeper link, the mega panel's Resources card, and the help hub's own link here each take a distinct label.",
    },

    /* ── 2. Who first ─────────────────────────────────────────────────── */
    {
      id: "who",
      label: "Who first",
      question: "Who should the page greet first?",
      context:
        "Every CTA on the page today assumes an undecided host: \"Start your first event free\", \"Browse the features\". No guest path leads here, and no planner framing exists yet.",
      options: [
        {
          id: "host",
          label: "The undecided host, as today",
          means:
            "The heading, the steps and the CTAs all speak to someone deciding whether to use Partyreel for their own event.",
        },
        {
          id: "guest",
          label: "A guest who just scanned",
          means:
            "The heading opens on what happens to a guest's own photos and video; host steps read second.",
        },
        {
          id: "planner",
          label: "A planner sizing it for a client",
          means:
            "The heading and proof points speak to someone evaluating Partyreel for events they run for other people.",
        },
      ],
      recommended: "host",
      because:
        "No guest path leads to this page today (a scan opens the event directly, never this URL), and every inbound link (Features' \"New here?\", the pricing pointer, the home's teaser) carries host intent. Reframing the greeting for a reader who cannot arrive that way would orphan the CTAs that convert.",
      overrule:
        "If a footer link or search traffic shows guests genuinely landing here confused about their own photos, the guest greeting earns a real audience.",
      lands: "The hero's heading and subhead, and which CTA leads.",
    },

    /* ── 3. The steps ─────────────────────────────────────────────────── */
    {
      id: "steps",
      label: "The steps",
      question:
        "How many steps should the walkthrough tell, and should step one stop overstating itself?",
      context:
        "Three counts already disagree on one loop: six steps here, five in the help article, four in the mega panel, three on the home. Step one also claims the event \"is live the moment you create it\", but the row is written once, at commit.",
      options: [
        {
          id: "six",
          label: "Six, two-sided, as today",
          means:
            "Create, Scan, Fill, Shape, Browse, Reel: every one, each labelled Host, Guest, Both or Everyone.",
        },
        {
          id: "five",
          label: "Five, matching the article",
          means:
            "The help article's own five: create, scan, fill, curate, share; one fewer seam to keep in step with.",
        },
        {
          id: "three",
          label: "Three, matching the home",
          means:
            "Scan, Upload, Done, the home's own teaser verbatim; this page stops being deeper than its own teaser.",
        },
      ],
      recommended: "six",
      because:
        "The home's teaser already promises \"the full walkthrough, both sides\": if this page also stopped at three, that link would lead to its own summary. Six is the one count genuinely deeper than the teaser and genuinely two-sided.",
      overrule:
        "If the measured page-height numbers say six is simply too long a scroll for what it earns, five loses only the payoff's own step and is the cheaper cut.",
      lands: "spine.tsx's STEPS array and its step one's body copy.",
    },

    /* ── 4. The pictures ──────────────────────────────────────────────── */
    {
      id: "pictures",
      label: "The pictures",
      question:
        "Should the six steps keep their own drawn vocabulary, or wear the site's real frames?",
      context:
        "Five of six steps today are bespoke FrameCard quotes that exist nowhere else on the site; only step three wears a real BrowserFrame. PhoneFrame, QrFrame, AlbumFrame and ReelFrame already exist for these moments.",
      options: [
        {
          id: "bespoke",
          label: "Bespoke quotes, as today",
          means:
            "FrameCard mockups per step, styled to match but built from nothing the rest of the site wears.",
        },
        {
          id: "site",
          label: "The site's own frames",
          means:
            "PhoneFrame for the guest moments, QrFrame for the code, AlbumFrame for the fill, ReelFrame for the payoff.",
        },
        {
          id: "live",
          label: "The product, actually moving",
          means:
            "The real wizard card mid-name, the real QR rendering, tiles landing into the album one by one.",
        },
      ],
      recommended: "site",
      because:
        "The bespoke frames are a fourth visual language for the same six moments /features already draws with the real frame set; switching removes an inconsistency at no new cost. Live motion is a real contender but a bigger build to prove out first.",
      overrule:
        "If a host's first look should feel like watching the product work, not reading a diagram of it, the live option is worth the extra build as its own round.",
      lands:
        "step-frames.tsx: whether its six components stay bespoke or become thin wrappers around the real frame set.",
    },

    /* ── 5. The shape ─────────────────────────────────────────────────── */
    {
      id: "shape",
      label: "The shape",
      question:
        "Should the walkthrough stay one scroll, become a stepper, or split into two columns?",
      context:
        "Today's six steps alternate sides down roughly 3,000 px of an already six-window page. The two-sided idea is a chip and a caption, never two literal columns.",
      options: [
        {
          id: "scroll",
          label: "One scroll, as today",
          means:
            "Alternating left and right, exactly the current rhythm, at whatever step count and picture treatment this round lands on.",
        },
        {
          id: "stepper",
          label: "A numbered stepper",
          means:
            "Six tabs, one step's copy and picture on screen at a time; the page gets dramatically shorter, at the cost of a click.",
        },
        {
          id: "ledger",
          label: "Two columns, host and guest",
          means:
            "A host column and a guest column read down together, so one row shows what each side is doing at that moment.",
        },
      ],
      recommended: "ledger",
      because:
        "It is the one shape that makes \"two-sided\" literally true rather than a caption: a reader sees the host reviewing while the guest is still uploading, in one glance. A stepper reads faster but hides five of six steps behind a click.",
      overrule:
        "If the measured numbers show the ledger reads as two things to track rather than one story, the stepper's shorter page is the safer, more proven shape.",
      lands:
        "Whether Spine becomes a two-column grid, and how a step with no clean host/guest split fills both sides.",
    },

    /* ── 6. The proof ─────────────────────────────────────────────────── */
    {
      id: "proof",
      label: "The proof",
      question:
        "What should the payoff prove: the reel alone, a fact band, or a way to try it now?",
      context:
        "Today's payoff is one sample reel and a link to /reel. Zero real events exist yet, so any \"proof\" has to be a true product fact, never a usage number.",
      options: [
        {
          id: "reel",
          label: "The reel alone, as today",
          means:
            "One sample render, phone-shaped, its own timeline of clips underneath.",
        },
        {
          id: "stats",
          label: "A band of real facts",
          means:
            "A short strip of true, derived numbers beside the reel: how many styles, what it costs, about how long it runs.",
        },
        {
          id: "demo",
          label: "A door to the live demo",
          means:
            "The reel stays, and a real scannable QR into the actual demo event sits beside it.",
        },
      ],
      recommended: "demo",
      because:
        "A reader who reaches the payoff is close to convinced; a real event they can scan into right now is a stronger \"this works\" than a second static number, and the site already has a demo event to point at.",
      overrule:
        "If the demo event's own round has not yet settled what it promises, shipping a door to it here is premature and the reel alone is the safe default.",
      lands:
        "ReelPayoff's own section: whether a QrFrame pointed at the demo event joins it.",
    },

    /* ── 7. The phone (staged after the pictures) ─────────────────────── */
    {
      id: "phone",
      label: "The page in a hand",
      question: "What should change about the page in a guest's hand?",
      context:
        "The payoff's \"phone\" is a plain div, never the site's real PhoneFrame. And at 375 the spine simply stacks, which on a heavier picture treatment runs longer than any other marketing page's scroll.",
      options: [
        {
          id: "div",
          label: "The payoff's phone stays a div",
          means:
            "No change: InlineReelPlayer keeps its plain rounded corner, no bezel.",
        },
        {
          id: "frame",
          label: "The real PhoneFrame",
          means:
            "The same player, inside the site's actual phone bezel, matching every other phone moment on the site.",
        },
        {
          id: "screens",
          label: "One step, one screen",
          means:
            "Below 375 the spine stops stacking: each step its own screen, moved through like the phone in your hand.",
        },
      ],
      recommended: "frame",
      because:
        "Wrapping the real bezel around the payoff is a small, consistent fix matching whatever THE PICTURES round chose. The one-screen-per-step deck is the bigger, more interesting swing, but it is a bigger build and deserves its own measured round.",
      overrule:
        "If the phone numbers show the stack is genuinely too long, screens has real evidence behind it and should be built next, not deferred again.",
      lands:
        "reel-payoff.tsx's phone wrapper, and, if screens wins later, how the spine paginates below sm.",
      after: { ask: "pictures" },
    },

    /* ── 8. The close (optional; fit the reading budget) ──────────────── */
    {
      id: "close",
      label: "The close",
      question:
        "How should the page end: the band alone, folded together, or pointing at the demo?",
      context:
        "Today the pricing pointer and the CTA band are two back-to-back border-y strips making the same closing argument twice: what it costs, then what to do.",
      options: [
        {
          id: "band",
          label: "Pointer, then band, as today",
          means: "Two strips in sequence, each with its own hairline border.",
        },
        {
          id: "folded",
          label: "One closing section",
          means:
            "The free-storage line moves inside the CTA band itself; one seam instead of two.",
        },
        {
          id: "demo",
          label: "The close offers the demo",
          means:
            "The band's second button becomes \"Try the live demo\" instead of \"Browse the features\".",
        },
      ],
      recommended: "folded",
      because:
        "The two strips say adjacent things with nothing between them worth a seam of its own; folding the free-plan line into the band's own subhead removes a whole section transition for free.",
      overrule:
        "If THE PROOF already gave the page its hands-on moment, closing on Browse the features again is redundant, and swapping the second button is the cheaper fix.",
      lands:
        "The order of PricingPointer and CtaBand at the foot of the page, or whether PricingPointer survives as its own section.",
    },
  ],
});
