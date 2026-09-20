import type { Control } from "@/components/lab/board-spec";
import { defineExploration } from "@/components/lab/exploration";

/**
 * THE HOST APP'S SHAPE, ROUND TWO: THE HOME ACROSS HOST STATES (2026-09-20).
 *
 * Round one's eight decisions are ruled and wired whole: `home-wiring`
 * (62a82a26) shipped the pulse, the events list behind its cover/row toggle
 * and the personal feeds' move to the profile's owner mode; `hub-wiring`
 * (a91464cb) shipped the event as a hub, the crumb trail, the two sheets and
 * the live QR door. None of that reopens here.
 *
 * His approval of the pulse carried a warning, verbatim (`home=pulse`,
 * 2026-09-20): "This does feel much more actionable for a host dashboard.
 * However, the reason we ended up with the inbox of everything that exists
 * today is to make the full app feel more available & ready to action than a
 * more limited and empty surface that doesn't feel actionable until more
 * things start to happen (which creates a very boring and bland initial host
 * experience sometimes). I am approving this view direction, but it is likely
 * worth more dashboard explorations from here to figure out what feels best
 * across all host states (from a new empty host to a first-event-just-created
 * host to a busy host)."
 *
 * So three decisions, one per state, each drawn on `home-wiring`'s real
 * composition (`NextStepBand`, `JustArrived`, `StorageMeter`, `EventsSection`,
 * `EventsEmptyTeaser`) with fresh fixture data rather than a redrawing of it:
 * a host with nothing, a host with one event made minutes ago, and a host
 * running five at once. `empty`'s own bar is his: "The only goal of empty
 * state is to get to feel polished while getting the user to having one
 * event."
 */

const SIZE: Control = {
  id: "size",
  label: "Window",
  options: [
    { id: "laptop", label: "1440, a laptop" },
    { id: "phone", label: "375, a phone" },
  ],
  default: "laptop",
};

export const APP_SHAPE = defineExploration({
  id: "app-shape",
  title: "The host app",
  round: {
    n: 2,
    date: "2026-09-20",
    changed:
      "Round two: the home across three host states, each drawn on the wired pulse rather than round one's stand-ins. A new host with nothing, a host whose first event is minutes old, and a host running five events who has hit the band's real crowding problem.",
  },
  context:
    "Round one asked what the app IS; round two asks what its one wired page, /dashboard, looks like at both ends of a host's life and under real load, now that the pulse, the events toggle and the profile move are shipped rather than drawn.",
  bible: [1, 2, 21, 22],
  asks: [
    {
      id: "empty",
      label: "A new host",
      question: "What should a host with no events yet see?",
      context:
        'Alex signed up minutes ago, nothing made yet. His bar: "The only goal of empty state is to get to feel polished while getting the user to having one event." Today the page collapses to the storage line and the create teaser alone.',
      options: [
        {
          id: "wizard",
          label: "The wizard's door alone",
          means:
            "Nothing but the create door and the storage line, exactly as the page renders zero events today; the other two bands stay absent, never empty.",
        },
        {
          id: "ghosts",
          label: "The pulse's bands as ghosts",
          means:
            "The next-step band and Just arrived both render faint placeholder rows naming what will appear there, so the shape is visible before any event is.",
        },
        {
          id: "guided",
          label: "A guided first screen",
          means:
            "The pulse is replaced by one welcome moment: a large first-event hero over three short steps, ending in the same create door.",
        },
      ],
      recommended: "wizard",
      because:
        "It already carries his own words (the teaser's own comment quotes this bar) and asks for one thing; the other two spend a page's worth of surface on a moment whose whole job is to end fast.",
      overrule:
        "If the goal is to teach the shape before it holds data, the guided screen sells what the pulse becomes rather than only converting.",
      lands:
        "Whether the pulse ever renders a band with nothing real in it, and what a zero-event host's first screen is.",
      configs: [SIZE],
    },
    {
      id: "first",
      label: "The first event",
      question: "What should the pulse show right after the first event exists?",
      context:
        "Jordan made Jordan's Housewarming a minute ago: zero photos, zero pending, nobody told yet. Free's one-event cap means the create button is already disabled and the plan banner already shows on every option below; that part never changes.",
      options: [
        {
          id: "share",
          label: "The code and the share door first",
          means:
            "A share card leads the page: the code, the link and a copy button, before the pulse's own bands; the one thing not yet done is named first.",
        },
        {
          id: "promise",
          label: "The empty album's promise",
          means:
            "The guest album's own voice turned on the host: 'Your album starts here' over Jordan's one event, rather than a pulse built for many.",
        },
        {
          id: "pulse",
          label: "The pulse with one event",
          means:
            "Today's exact composition, unmodified: the calm 'nothing needs you' line, no arrivals yet, one cover card.",
        },
      ],
      recommended: "share",
      because:
        "The code has not left the phone yet, which is the only real job left; a calm 'nothing needs you' line undersells the one thing this host still has to do.",
      overrule:
        "If every state should look alike so there is one shape to learn, the pulse with one event is what Jordan lives in for the rest of the event's life.",
      lands:
        "Whether the pulse special-cases a host's first live event, and where a share door would sit on the page.",
      configs: [SIZE],
    },
    {
      id: "busy",
      label: "A busy host",
      question: "How should the pulse hold up under a genuinely busy host?",
      context:
        "Maya runs five events at once: two queues waiting (12, 5), one with no reel, one paused, one unopened and dated tomorrow, and her storage at 96 percent. As ruled, that is six chips in the first band alone.",
      options: [
        {
          id: "ruled",
          label: "As ruled, unmodified",
          means:
            "Every chip the real precedence produces, wrapping onto as many lines as six steps take; nothing caps or reorders them.",
        },
        {
          id: "collapsed",
          label: "The queues collapsed",
          means:
            "The band shows the top three by tone and folds the rest behind one 'N more' chip that expands in place.",
        },
        {
          id: "events-first",
          label: "The events first",
          means:
            "Your events leads the page; the next-step band and Just arrived follow beneath it, for a host who already knows their five events.",
        },
      ],
      recommended: "collapsed",
      because:
        "Six events each contributing a chip is not a hypothetical: a host mid-wedding-season hits this by Thursday, and a band wrapping three lines deep stops answering 'what needs you' at a glance.",
      overrule:
        "If the count itself is the useful part, a host may want every chip visible to triage in one glance, and collapsing costs one click to see the rest.",
      lands:
        "Whether the next-step band needs an overflow rule at all, and how many chips it shows before folding.",
      configs: [SIZE],
    },
  ],
});
