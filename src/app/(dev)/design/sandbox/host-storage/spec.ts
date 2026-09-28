import { defineExploration } from "@/components/lab/exploration";

import { SCREEN } from "./screens";

/**
 * WHERE THE LARGEST FILES ARE, ROUND TWO: THE SIX PRICES ALONE (2026-09-28).
 *
 * Round one's answers (docs/reviews/host-storage.json): `order=flat`, with his
 * note asking for a filter of All or one event ("offering both is a great mini
 * feature"); `goal=live`, the strip that counts down and finishes the switch;
 * `refusal=inline`, with his note: stacked vertically, "so each card's lines
 * don't break". `prices` came back unclear: "I don't believe these are the
 * best ideas we can come up with here. Would also like to bake in previous
 * selection so I have a more current idea how this gets entered at this
 * point."
 *
 * ★ SO THIS ROUND IS `prices` ALONE, WITH THE WIDEST GOOD SET: five whole
 * strategies for the same six numbers, each answering a different first
 * question (every price; how much room; what to change; build the plan; the
 * one change that suits her), production's plain rows among them as the
 * reference, since they shipped after round one was drawn.
 *
 * ★ HIS NOTE IS THE GROUND. Every frame is the plan as it ships for a Pro host
 * (`pricing-sheet.tsx`, kind `plan`: popups' wide dialog at a desk, the whole
 * screen under a close in a hand), opened from a real door (the Plan card on
 * Account, the storage meter on the dashboard), and his round-one picks are
 * built in and live: the tapped size flips in place, full width, and See
 * what's using space opens the flat list with its event filter and the strip
 * that finishes the switch. Round one's other asks left `asks` (the ledger
 * keeps their answers) and `storage-wiring` builds them after this round.
 *
 * ★ A CATALOG, NOTHING WIRING PRODUCTION: no button here starts Checkout, the
 * change-plan route or the billing portal (`world.tsx`), and every figure is
 * read from `tiers.ts` and the storage guard's own functions.
 */

export const HOST_STORAGE = defineExploration({
  id: "host-storage",
  title: "Where the largest files are",
  round: {
    n: 2,
    date: "2026-09-28",
    changed:
      "Prices alone, five answers drawn whole on the plan as it ships (popups' wide dialog, a whole screen in a hand): opened from her Plan card, then from the storage meter with Pro 100 GB tapped. Your round-one picks are the ground: the flip, the list, the strip.",
  },
  history: [
    {
      n: 1,
      date: "2026-09-24",
      changed:
        "Four decisions over one videographer's 110.8 GB. You took largest first with an All or per-event filter, the live strip that finishes the switch, and the tapped size flipping in place, stacked; prices came back asking for better ideas.",
    },
  ],
  context:
    "Priya Anand, a wedding videographer on Pro 500 GB monthly, stores 110.8 GB across four events, so her plan meets every case: a size too small (100 GB), her own size yearly, and a size up (2 TB). Each answer is drawn twice on the shipped plan: opened from her Plan card, then from the storage meter with Pro 100 GB tapped. Your round-one picks are live in both: the flip in place, and See what's using space opening the list and its strip.",
  carried: [
    {
      id: "list-stacks",
      question: "Where does See what's using space open from the plan?",
      taken:
        "Popups' side panel, stacked over the plan at a desk; its own screen in a hand, whose Back says Your plan. Closing it returns to the plan.",
      overrule:
        "If the plan should close first, the list opens alone and its strip is the only way back to a switch.",
    },
    {
      id: "strip-removes",
      question:
        "What does the strip's button do while items are only selected?",
      taken:
        "Remove and switch: they go to Deleted first, since the check counts what is stored. Once they have gone, it reads Switch.",
      overrule:
        "If a switch should never remove anything by itself, the button waits until Remove has run.",
    },
    {
      id: "keep-plan",
      question:
        "What is the refusal's second way out when the size that fits is hers?",
      taken:
        "Keep Pro 500 GB, which flips it back. Tapped yearly, it offers Pro 500 GB, yearly instead, a real switch.",
      overrule:
        "If every refusal should offer a switch, it names the next size up instead.",
    },
    {
      id: "head-stays",
      question: "Does the plan's head change with the prices?",
      taken:
        "No: every answer wears production's You are on Pro already and its line, so only the six prices differ.",
      overrule:
        "If the head should name her plan, it becomes Pro 500 GB, monthly, and the line moves under it.",
    },
  ],
  asks: [
    {
      id: "prices",
      label: "The six prices",
      question:
        "How should a Pro host's six prices sit in her plan, including the size that cannot hold what she stores?",
      context:
        "Your note asked for better ideas, seen where a host meets them: five strategies, each on the plan as it ships, as it opens and with Pro 100 GB tapped. Press anything; See what's using space opens your round-one list.",
      options: [
        {
          id: "shipped",
          label: "Six rows, as it ships today",
          means:
            "Production's list: every price a row, hers marked, Switch on the rest. The one change is your pick: Too small now flips its row to the refusal.",
        },
        {
          id: "sizes",
          label: "Three sizes, her bytes in each",
          means:
            "A card per size shows how full her 110.8 GB would make it, and its monthly and yearly prices are its two switches. All six at once, no toggle.",
        },
        {
          id: "moves",
          label: "Her plan, then the ways to change it",
          means:
            "Her plan held on top; under it pay yearly, more room and less room, each price saying what it costs against today, such as $20 more a month.",
        },
        {
          id: "pick",
          label: "A size and a billing, then one button",
          means:
            "Two choices opening on hers, one price, and one button naming the exact change. The shortest plan; the other prices wait behind the choices.",
        },
        {
          id: "advised",
          label: "The change that suits her, then every price",
          means:
            "It leads with the one change what she stores makes sensible (yearly, $38 less a year), then production's six rows under it.",
        },
      ],
      today: "shipped",
      recommended: "sizes",
      because:
        "Every price in one glance with no toggle, stacked as your plans note asked, and fit drawn before a tap: the size that cannot hold 110.8 GB is visibly full, and tapping either of its prices flips that card in place.",
      overrule:
        "If a host thinks in changes rather than sizes, moves prices each against today; if a phone's length matters most, pick is the shortest.",
      lands:
        "What `pro-price-list.tsx` becomes: how the six prices sit in the plan, and how a size too small reads before and after a tap.",
      configs: [SCREEN],
    },
  ],
});
