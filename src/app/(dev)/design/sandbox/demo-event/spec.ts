import type { Control } from "@/components/lab/board-spec";
import { defineExploration } from "@/components/lab/exploration";

/**
 * THE DEMO AS THE PRODUCT'S FIRST IMPRESSION, ROUND ONE (2026-09-19).
 *
 * Will (docs/design/rulings.md, 2026-09-19): the demo event is unprotected,
 * "absolutely everything is up for relitigation or reconcepting from the
 * ground up"; and (2026-09-19, the counts ask) "the demo is a fake event we're
 * creating, and does not accept new uploads, only simulate the experience...
 * the existing demo content will be completely replaced prior to launch to
 * feel more full and real."
 *
 * ★ THE AUDIENCE IS A HOST, WHICH IS WHY THIS BOARD IS LAPTOP FIRST. Everyone
 * who opens the demo followed a door that said "try the live demo": they are
 * at a desk deciding whether to host, not at a party holding a phone. So 1440
 * by 900 is the default screen on every step and 375 is the knob, which is the
 * exact inverse of `guest-shape`, whose visitor really is a guest. The one
 * decision that is phone-first is `phone`, because a scanned code is the other
 * way in and the whole question there is what the second screen does.
 *
 * ★ WHAT IS DELIBERATELY NOT ASKED. The guest experience's own shape is
 * `guest-shape`'s round (its door, chrome, live signal and dialogs are on
 * Will's desk); every picture here draws the SHIPPED page rather than that
 * board's recommendations, so no answer on this board quietly rides on one he
 * has not given. The marketing site's "Live demo" animation section is a
 * separate thing that shares a word (ruled decoupled). And the demo's security
 * is not a design variable: the capability token, the presigned URLs and the
 * limiters are out of frame, as is the `isDemo` password bypass, which is by
 * design (only `private` locks).
 *
 * ★ THE PINS GUARD FUNCTION, NEVER LOOK. `entry-modal.test.tsx` ("owner and
 * demo never see the surface"), `guest-upload.test.tsx` ("demo mode": no
 * fetch, a synthetic approval, no save prompt), `gallery-empty-state.test.tsx`
 * (bible 4: no demo code inside a host's own album) and `footer-contract.test.ts`
 * hold behaviour that survives every shape below. One of them is a FINDING and
 * not a wall: the entry-modal pin's reading of "the demo never sees the entry
 * surface" is the very thing `arrival` asks about, and two of the three options
 * give the demo a surface of its own. The manifest carries it.
 *
 * ★ THE STAGING. `framing` waits on `arrival`, because what the album still
 * has to say depends on what was already said at the door. `event` waits on it
 * too, because a choice between three parties has to be MADE somewhere and the
 * arrival is the only place it can go. `next` waits on `try`, because one of
 * the try answers already turns a visitor into a host at the moment they add a
 * photograph, and where the STANDING way out sits is a different question once
 * it does. `doors` and `phone` are independent of everything.
 */

/**
 * THE SCREEN, the knob the guest-page decisions share. 1440 by default: see
 * the star above. A phone answer that contradicts the laptop is a finding.
 */
const SCREEN: Control = {
  id: "screen",
  label: "Screen",
  options: [
    { id: "1440", label: "1440, a laptop" },
    { id: "375", label: "375, a phone" },
  ],
  default: "1440",
};

/** Which of the site's demo doors is drawn. */
const PLACE: Control = {
  id: "place",
  label: "Which door",
  options: [
    { id: "hero", label: "The home hero's code" },
    { id: "footer", label: "The footer's pile" },
    { id: "line", label: "A feature page's line" },
  ],
  default: "hero",
};

/** Which end of a scanned demo is on screen. */
const SIDE: Control = {
  id: "side",
  label: "Which screen",
  options: [
    { id: "phone", label: "The phone that scanned" },
    { id: "laptop", label: "The laptop it scanned" },
  ],
  default: "phone",
};

/** Which party the demo is, for the decision that asks how many there are. */
const PARTY: Control = {
  id: "party",
  label: "Which party",
  options: [
    { id: "wedding", label: "A wedding" },
    { id: "birthday", label: "A birthday" },
    { id: "office", label: "A company party" },
  ],
  default: "wedding",
};

const DRAFT = defineExploration({
  id: "demo-event",
  title: "The live demo",
  round: {
    n: 1,
    date: "2026-09-19",
    changed:
      "The first round: what the demo's first seconds are, how it keeps admitting it is a demo, what the one simulated upload is for, where the way out sits, what a door promises before it is opened, what a scan off a laptop does, and how many parties the demo is. Laptop first, on the shipped components.",
  },
  context:
    "Four doors on the marketing site point at one guest page. Arriving, `isDemo` forces full access and empties the entry steps, so a visitor lands inside a wedding album under the ordinary guest header with one grey line of explanation; Save is blanked to an empty span, the report footer is gone, and adding a photograph ramps a local tile for half a second and then nothing happens. Every option below is that page or that door with one thing changed.",
  bible: [1, 4, 15, 21],
  asks: [
    {
      id: "arrival",
      label: "The first seconds",
      question: "What should someone who opens the demo meet in its first seconds?",
      context:
        "A visitor who followed 'Try the live demo, no signup' lands straight on the album: the demo is the one visitor `computeEntry` gives no entry steps, so the welcome, the byline and the legal line all skip.",
      options: [
        {
          id: "album",
          label: "Straight into the album",
          means:
            "Today. Somebody's wedding, 36 photographs, and one grey line above the name saying what you add here is not saved.",
        },
        {
          id: "welcome",
          label: "The welcome a guest gets",
          means:
            "The entry surface the demo skips: the party's name, who is hosting, and the two promises written for a guest, with the album behind it.",
        },
        {
          id: "role",
          label: "A screen that hands you a role",
          means:
            "The demo's own arrival: whose party this is, that you are standing exactly where a guest stands, and the one thing to try.",
        },
      ],
      recommended: "role",
      because:
        "The person who opened this is deciding whether to host, not arriving at a party. The album alone never says what they are looking at, and the guest's welcome is written for somebody who was invited to this wedding.",
      overrule:
        "If the demo should be exactly what a guest gets with nothing added, the welcome is the honest copy of it.",
      lands:
        "The first screen behind every demo door, and whether the demo has a surface of its own at all.",
      configs: [SCREEN],
    },
    {
      id: "framing",
      label: "Saying it is a demo",
      question: "Once they are in the album, how should the demo keep saying it is a demo?",
      context:
        "One grey line sits above the event name and leaves with the first scroll; nothing else ever admits this is not a real wedding. Drawn 460 px down, where a visitor spends the visit, on the arrival you picked.",
      options: [
        {
          id: "banner",
          label: "The grey line, as today",
          means:
            "One line above the event name. It scrolls away with the header in the first flick and never comes back.",
        },
        {
          id: "tag",
          label: "A mark in a header that stays",
          means:
            "A Demo mark beside the wordmark, and the guest header pins to the top of the screen so the mark is on every screen.",
        },
        {
          id: "rail",
          label: "A strip along the foot",
          means:
            "A thin bar pinned to the bottom: what this album is, and one tap out of it, in a thumb's reach the whole way down.",
        },
      ],
      recommended: "tag",
      because:
        "The header is the one strip of this page that is ours (bible 4 leaves the rest to the host), so a mark there costs the album nothing and pinning it costs one property. A second bar is furniture on a page whose job is photographs.",
      overrule:
        "If the demo has to keep teaching while they scroll, only the rail is still in front of them at photograph thirty.",
      lands:
        "What the demo wears on every screen, and whether the guest header becomes sticky.",
      after: { ask: "arrival" },
      configs: [SCREEN],
    },
    {
      id: "try",
      label: "Adding a photo",
      question: "What should happen when a visitor adds a photo to the demo?",
      context:
        "The demo simulates it: a local tile ramps for about 480ms, always comes back approved, gets the green check, and is never written. Then nothing happens at all. Drawn a beat later, at the top of the album.",
      options: [
        {
          id: "quiet",
          label: "It lands, and nothing is said",
          means:
            "Today. The tile joins the album with a green check and the demo never mentions it again.",
        },
        {
          id: "turn",
          label: "It lands, then the turn",
          means:
            "The same upload, then one card under the album's first row: that is what your guests would see, and here is how you get one.",
        },
        {
          id: "look",
          label: "No upload at all",
          means:
            "The demo is an album to look at. Add photos is not offered, and the page says the host's guests are the ones who fill it.",
        },
      ],
      recommended: "turn",
      because:
        "The simulated upload is the demo's one piece of proof and it currently ends in silence. The sentence straight after it is where a visitor is likeliest to become a host, and it costs one card.",
      overrule:
        "If a pitch the moment they touch something reads as a trap, the quiet landing keeps the demo honest.",
      lands:
        "What the demo's only interaction is for, and whether the demo ever pitches inside the album.",
      configs: [SCREEN],
    },
    {
      id: "next",
      label: "The way out",
      question: "Where should the demo's way out into an event of their own sit?",
      context:
        "Today it is the guest header's quiet 'Start for free' and nothing else. The demo also draws a hole: Save is blanked to an empty span, so half a two-button row is empty. Drawn on the try you picked.",
      options: [
        {
          id: "header",
          label: "The header's CTA, as today",
          means:
            "The quiet 'Start for free' beside the wordmark carries the whole thing, exactly as it does for a guest at a real party.",
        },
        {
          id: "slot",
          label: "The empty half of the action row",
          means:
            "The blanked Save slot becomes 'Start your own', beside Invite, in the first screen, where nothing is drawn today.",
        },
        {
          id: "foot",
          label: "A closing card under the album",
          means:
            "The last thing after the photographs, in the spot a real event gives the reel card, where the report footer is hidden.",
        },
      ],
      recommended: "slot",
      because:
        "The demo already draws an empty button-shaped hole in the first screen, and filling it is free. A closing card asks a visitor to scroll a whole album before being offered anything at all.",
      overrule:
        "If the ask belongs after they have seen what they came to see, the closing card is the patient version of it.",
      lands:
        "The demo's one conversion object, and what fills the blanked Save slot.",
      after: { ask: "try" },
      configs: [SCREEN],
    },
    {
      id: "doors",
      label: "What a door promises",
      question: "What should a door to the demo promise before anyone opens it?",
      context:
        "Four objects point at one page: a code on the home hero, a photo pile in the footer, a text line on the feature pages, and a QR ticket in the nav panel. None says what is behind it. The knob picks the place.",
      options: [
        {
          id: "quiet",
          label: "Nothing, as today",
          means:
            "'Try the live demo, no signup' and a bare code. What is on the other side is a surprise until you are inside it.",
        },
        {
          id: "named",
          label: "The door names the party",
          means:
            "Each door says what it opens and how full it is: a real wedding album, this many photos, from this many guests.",
        },
        {
          id: "pile",
          label: "The door shows the party",
          means:
            "The footer's photo pile becomes the rule: one object skinned per place, so every code sits on the album it opens and the nav's ticket goes.",
        },
      ],
      recommended: "named",
      because:
        "A host opens a demo to answer one question, what will mine look like, and a line of words answers it before the click for the price of a line. The pile answers it better and has to be built in four places.",
      overrule:
        "If the footer's pile is already the best object on the site, making it the rule collapses four idioms into one and promises more.",
      lands:
        "Every demo affordance on the marketing site, and whether the nav panel's QR ticket survives.",
      configs: [PLACE, SCREEN],
    },
    {
      id: "phone",
      label: "Scanned off a laptop",
      question: "What should happen when the demo is scanned off the laptop screen?",
      context:
        "The hero's code and the footer's are real and scannable: a host reaches for their phone and the demo opens in their hand while the laptop is still on the page. Today neither screen knows the other exists.",
      options: [
        {
          id: "same",
          label: "The same demo, in a hand",
          means:
            "Today. The phone opens what the laptop was showing, at 375, and the laptop carries on as though nothing happened.",
        },
        {
          id: "scanned",
          label: "The phone names what just happened",
          means:
            "One line at the top of the phone's album: you just did the thing your guests will do, and this is where it lands.",
        },
        {
          id: "pair",
          label: "The two screens are one session",
          means:
            "What the phone adds appears on the laptop's album a second later and the laptop says where it came from. One broadcast channel, no stored bytes.",
        },
      ],
      recommended: "pair",
      because:
        "A host's real question is whether a guest's phone reaches their album, and the only convincing answer is watching it happen on the screen in front of them. It is the one thing a screenshot of a competitor cannot do.",
      overrule:
        "If two screens talking to each other is a week we do not have before launch, naming the scan costs a sentence and gets most of it.",
      lands:
        "What a scanned code opens, and whether the demo ever holds one session across two devices.",
      configs: [SIDE],
    },
    {
      id: "event",
      label: "How many parties",
      question: "How many parties should the demo be?",
      context:
        "One row is the demo today, a wedding, and its photographs are replaced before launch. Whether it stays one party decides how much curated media the launch needs, and what a door can promise.",
      options: [
        {
          id: "one",
          label: "One party, curated once",
          means:
            "The arrival names the wedding and there is nothing to choose. One album to shoot, one row to keep pristine.",
        },
        {
          id: "pick",
          label: "Three, chosen at the door",
          means:
            "A wedding, a birthday and a company party on the arrival screen; the one they pick is the album that opens.",
        },
        {
          id: "switch",
          label: "One album, a switcher above it",
          means:
            "Straight into the wedding, with a control over the album that re-fills it in place when they change the party.",
        },
      ],
      recommended: "one",
      because:
        "One album that feels real beats three that feel thin, and every extra party is another curated shoot and another row to keep pristine. The event-type pages already answer 'is this for my kind of party'.",
      overrule:
        "If 'that is a wedding and mine is a birthday' is the objection the demo exists to kill, three cards at the door kill it.",
      lands:
        "How many demo events exist, and how much curated media the launch has to buy.",
      after: { ask: "arrival" },
      configs: [PARTY, SCREEN],
    },
  ],
});

/**
 * ★ ONE KNOB PER ID, NOT ONE PER DECISION THAT USES IT.
 * `defineExploration` flattens every decision's `configs` into the board's
 * controls, so a knob five decisions share arrives five times: the dock would
 * draw it five times and React would warn on the duplicate key. Each decision
 * keeps it on its own strip (that is what `configs` is for); the board
 * declares it once. The same finding `guest-shape` and `gallery-width` left
 * for the constructor, which could dedupe by id itself.
 */
export const DEMO_EVENT: typeof DRAFT = {
  ...DRAFT,
  controls: DRAFT.controls?.filter(
    (c, i, all) => all.findIndex((d) => d.id === c.id) === i,
  ),
};
