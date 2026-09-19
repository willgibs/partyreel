import { defineExploration } from "@/components/lab/exploration";
import {
  EVENT_PASS_RENEWAL_PRICE_LABEL,
  MAX_EVENTS,
  planById,
  plansForTier,
} from "@/lib/constants/tiers";
import { formatBytes } from "@/lib/utils";

/**
 * THE MARKETING PRICING PAGE, PART BY PART (2026-09-19).
 *
 * Will: "a more granular exploration than simply comparing new page versions
 * themselves at such a high level. Again, everything is unprotected and may be
 * reconceived from scratch or relitigate absolutely anything."
 * (docs/design/rulings.md.)
 *
 * So there is no page version to rule on here. Eight questions, each about ONE
 * part of the page, every option drawn on the real components at 1440 and 375,
 * and a measured line under every frame saying how tall the part runs and how
 * far down its first price sits.
 *
 * ★ THE STAGING IS THE ARGUMENT. Three decisions wait on the pair, because how
 * a size is picked, where the Event Pass stands and what the plans do in a hand
 * are all different questions once the plan row has a shape. The opening, the
 * pair, the fit block, the sheet and the close depend on none of each other and
 * can be taken in any order.
 *
 * ★ NOT ONE NUMBER IS TYPED HERE. Every price, cap, event count and plan name
 * on this board comes out of `tiers.ts`, the single source the Stripe webhook
 * and the SQL enforcement read. The prices themselves are locked (PRICING.md,
 * 2026-05-29) and this board reads them, never argues them.
 *
 * ★ WHAT IS DELIBERATELY NOT ASKED. The in-app pricing surface is
 * `app-pricing`'s round, running in parallel: this page is its "learn more"
 * second layer and neither board assumes the other's answer. The FAQ
 * accordion's LOOK is `loose-ends`, already on the desk, so the close asks how
 * many questions and whether they are folded, never how a row is styled.
 */

const free = planById("free");
const pass = planById("event_pass");
const pro = plansForTier("pro");
const proFrom = pro[0];
const proTop = pro[pro.length - 1];

export const PRICING_PAGE = defineExploration({
  id: "pricing-page",
  title: "The pricing page",
  round: {
    n: 1,
    date: "2026-09-19",
    changed:
      "The first round: what the page opens on, how Free and Pro stand, how a size is picked, where the Event Pass stands, what Find your size is for, how much of the sheet is shown, how the page ends, and what the plans do in a hand.",
  },
  bible: [1, 5, 18, 21, 22],
  context: `Eight sections today: a dark hero, the plans on paper, four unlock tiles, the album-fill calculator, a twenty-row table on paper again, seven shared chips, eight folded questions and the band. Three plans underneath it: ${free.name} at ${free.priceLabel}, the ${pass.name} at ${pass.priceLabel}, and Pro from ${proFrom.priceLabel} to ${proTop.priceLabel}. Nothing on this board can reach Checkout.`,
  asks: [
    /* ── 1. What the page opens on ─────────────────────────────────────── */
    {
      id: "opening",
      label: "What the page opens on",
      question: "What should the pricing page open on?",
      context:
        "A dark hero carries the ruled line and a subhead, and the first price sits most of a screen below it. Drawn with the real header and lockup, the fold ruled at 900 px and measured under every frame.",
      options: [
        {
          id: "line",
          label: "Today: the line, then the prices",
          means:
            "The dark hero, the ruled golden line, and the paper chapter of plans below it.",
        },
        {
          id: "plans",
          label: "The plans are the opening",
          means:
            "The page opens on paper: the same words one step quieter, sitting directly over the cards.",
        },
        {
          id: "fork",
          label: "The question first, then its answer",
          means:
            "One event, or hosting again? Two priced doors, and the plans below show only the side you press.",
        },
      ],
      recommended: "fork",
      because:
        "Measured in the frame: the first price lands 426 px down here against 735 today, and it is the whole range rather than one card. It also asks the question the rest of the page is arguing about, before the cards start arguing it.",
      overrule:
        "If every plan must be on screen without a press, the plans-first opening buys 100 px and today's hero is the safest.",
      lands:
        "pricing/page.tsx: whether the page keeps a PageHero, and where its first paper chapter starts.",
    },

    /* ── 2. How Free and Pro stand ─────────────────────────────────────── */
    {
      id: "pair",
      label: "How Free and Pro stand",
      question: "How should Free and Pro stand beside each other?",
      context: `Ruled 2026-08-27 as two cards, Free on paper and Pro the same sheet in ink. Free is ${MAX_EVENTS.free} event, ${formatBytes(free.storageBytes)}, photos only: a trial, not a tier, holding half the row. The pass and the size sit at this board's picks until you answer them.`,
      options: [
        {
          id: "two",
          label: "Today: two cards, Pro in ink",
          means:
            "Equal halves. Free is the paper sheet, Pro the same sheet inverted, each with its ruled photo stack.",
        },
        {
          id: "pro",
          label: "Pro takes the row, Free a line",
          means:
            "Pro alone across the row, its list beside its price; Free is one honest line underneath with its own button.",
        },
        {
          id: "even",
          label: "Both on paper, Pro badged",
          means:
            "The ink inversion goes. Two calm cards of the same weight, and only a badge says which one most people take.",
        },
      ],
      recommended: "pro",
      because:
        "Free is one event with no card: it is the way in, not a plan anyone compares. Giving Pro the row lets its three sizes and five lines breathe, and leaves the second seat for the pass, which is what most visitors need.",
      overrule:
        "If the free first event is the page's main job, today's pair says so loudest and is already ruled.",
      lands:
        "plan-cards.tsx: whether PlanPair stays a pair, and whether the ink inversion survives.",
    },

    /* ── 3. Choosing a size ────────────────────────────────────────────── */
    {
      id: "size",
      label: "Choosing a size",
      question: "How should Pro's size and its cadence be picked?",
      context: `Three sizes (${pro.map((p) => formatBytes(p.storageBytes)).join(", ")}) and two cadences on one card: a three-way switch shows one price at a time while the monthly-or-yearly switch floats above the whole block. Drawn on the pair you picked.`,
      options: [
        {
          id: "selector",
          label: "Today: a switch, one price at a time",
          means:
            "The sizes as a three-way switch inside the card; the cadence switch sits above the plans.",
        },
        {
          id: "rows",
          label: "Three rows, all three prices at once",
          means:
            "Each size a row with its price and what it holds, and the cadence in the card head beside the money it moves.",
        },
        {
          id: "slider",
          label: "One slider, the price following",
          means:
            "Drag from the smallest room to the largest; the price, the stats and the button all follow the thumb.",
        },
      ],
      recommended: "rows",
      because:
        "A switch hides two of the three prices, which is the one thing someone comparing sizes wants to see. Rows show all three, and moving the cadence into the card puts it beside the number it changes.",
      overrule:
        "If the card must stay short beside Free, the switch is the compact one: the rows cost it about 50 px.",
      lands:
        "plan-cards.tsx: the Pro card's size control, and whether the cadence switch keeps its own row.",
      after: { ask: "pair" },
    },

    /* ── 4. Where the pass stands ──────────────────────────────────────── */
    {
      id: "pass",
      label: "Where the pass stands",
      question: "Where should the Event Pass stand?",
      context: `A wide ticket under the pair, read third. It is ${pass.priceLabel} for ${formatBytes(pass.storageBytes)} and one event, about a year, ${EVENT_PASS_RENEWAL_PRICE_LABEL} a year after that: the answer for the one-party host most visitors are. Drawn in the pair you picked.`,
      options: [
        {
          id: "under",
          label: "Today: a wide ticket under the plans",
          means:
            "Read after Free and Pro, full width, with the dashed stub rule splitting identity from what you get.",
        },
        {
          id: "beside",
          label: "In the row, as an equal card",
          means:
            "The pass becomes a card beside the others: the same grammar, the same weight, its own stack of prints.",
        },
        {
          id: "first",
          label: "First, before the subscription",
          means:
            "A wide ticket above the plans carrying the badge, so the one-event answer is the page's opening offer.",
        },
      ],
      recommended: "beside",
      because:
        "The comparison table already calls these three equal plans, and the cards say two-plus-an-afterthought. Putting the pass in the row makes the page agree with its own sheet, and with what most visitors came for.",
      overrule:
        "If the subscription is the business, the pass stays second, and first is the swing that bets the other way.",
      lands:
        "pricing/page.tsx and pass-card.tsx: whether PassCard is a row card or a full-width ticket.",
      after: { ask: "pair" },
    },

    /* ── 5. Find your size ─────────────────────────────────────────────── */
    {
      id: "fit",
      label: "Find your size",
      question: "What should the Find your size block be?",
      context:
        "The ruled album fill (2026-08-27): a slider over a small gallery that fills as you drag, a video switch, a once-or-again switch, and a receipt naming a plan. It is the page's tallest block and its only piece of teaching.",
      options: [
        {
          id: "wall",
          label: "Today: the slider and the filling wall",
          means:
            "Drag, and a small album fills on the real gallery grammar; the receipt names the plan, its price and a runner-up.",
        },
        {
          id: "cut",
          label: "Cut it: one line of capacity each",
          means:
            "No calculator. One quiet row per plan saying its room and about how many photos and hours that is.",
        },
        {
          id: "ask",
          label: "Two questions, no slider",
          means:
            "Video, and one event or hosting again: the only two inputs that change the answer, answered with a plan.",
        },
      ],
      recommended: "wall",
      because:
        "Nobody knows what a hundred gigabytes of a wedding looks like, and this is the one place the page shows rather than tells. The two questions answer faster but drop the size, which is the thing being sold.",
      overrule:
        "If the wall reads as a toy beside real prices, the two questions keep the honest answer without the theater.",
      lands:
        "calculator.tsx, and whether recommendPlan keeps a storage input at all.",
    },

    /* ── 6. The grid, the table, the band ──────────────────────────────── */
    {
      id: "sheet",
      label: "The grid, the table, the band",
      question: "How much of the full sheet should the page show?",
      context:
        "Between the plans and the questions the page says the same thing three times: four tiles naming where Free ends, a twenty-row table saying it again with every plan beside it, and seven shared chips. The length is the question.",
      options: [
        {
          id: "both",
          label: "Today: the tiles, the table, the band",
          means:
            "All three in that order, about two and a half laptop screens between the plans and the questions.",
        },
        {
          id: "table",
          label: "The table alone, with the shared floor",
          means:
            "The tiles go. The table carries every row they were paraphrasing, and the floor every plan shares closes its chapter.",
        },
        {
          id: "fold",
          label: "The tiles, the table folded away",
          means:
            "The four tiles stay as the visible answer and the whole matrix waits behind one Compare everything line.",
        },
      ],
      recommended: "table",
      because:
        "The tiles are four of the table's own rows written a second time. Keeping the instrument and dropping the paraphrase takes a section off the page without losing a single fact.",
      overrule:
        "If a twenty-row matrix is the wrong first answer, the folded version keeps the tiles and hides the sheet.",
      lands:
        "pricing/page.tsx: whether UnlockGrid ships at all, and which chapter SharedBand sits in.",
    },

    /* ── 7. The questions and the close ────────────────────────────────── */
    {
      id: "close",
      label: "The questions and the close",
      question: "How should the page end?",
      context:
        "Eight questions folded in an accordion, then the band. Four of the eight settle money; the other four are guest and upload questions that Help answers too. The accordion is the one place this page's copy is not open.",
      options: [
        {
          id: "eight",
          label: "Today: eight, folded, then the band",
          means:
            "One accordion of eight, every answer a click away, then the closing band. The JSON-LD carries all eight.",
        },
        {
          id: "four",
          label: "Four, open, then the band",
          means:
            "The four that settle money, read open in two columns; the other four move to Help behind one line.",
        },
        {
          id: "none",
          label: "No questions: the band closes",
          means:
            "Each card's own footnote settles its own question, and the page ends on the band.",
        },
      ],
      recommended: "four",
      because:
        "Bible 21 says copy is open, and an accordion of eight puts eight clicks between a buyer and the four answers they need. Four open questions read in about the time it takes to open one.",
      overrule:
        "The FAQ structured data shrinks with the list: if that reach matters more than the reading, today's eight.",
      lands:
        "pricing-faq-data.ts's split between this page and Help, and the FaqPage JSON-LD the page emits.",
    },

    /* ── 8. The page in a hand ─────────────────────────────────────────── */
    {
      id: "phone",
      label: "The page in a hand",
      question: "What should the plans do at 375?",
      context:
        "Everything stacks, so the plans alone run two to three phone screens before the first section that is not a card. Drawn in the pair you picked, from the top of the page to the end of the plans, with the scroll measured.",
      options: [
        {
          id: "stack",
          label: "Today: one card under another",
          means:
            "The laptop's order, one full column each, scrolled through from the first price to the last button.",
        },
        {
          id: "swipe",
          label: "A swipe row, one card at a time",
          means:
            "The plans become a snapping row with the next card peeking at the edge; everything below stays stacked.",
        },
        {
          id: "tabs",
          label: "Two tabs: one event, hosting again",
          means:
            "The page's real fork as two tabs at the top, each showing only the plans on its own side.",
        },
      ],
      recommended: "swipe",
      because:
        "Measured at 375: stacking runs 1,850 px of plans, more than two phone screens, before the first section that is not a card. The row keeps every card at full width and puts the whole set one gesture away, at 1,250.",
      overrule:
        "A swipe hides what it does not show: if a phone visitor must see every plan without a gesture, the tabs say so out loud and today's stack is the safest.",
      lands:
        "How the plan block lays out below sm, in plan-cards.tsx and pass-card.tsx.",
      after: { ask: "pair" },
      tile: "phone",
    },
  ],
});
