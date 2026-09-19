import type { Control } from "@/components/lab/board-spec";
import { defineExploration } from "@/components/lab/exploration";

/**
 * EVERY FAILURE PAGE AS ONE GRAMMAR, ROUND ONE (2026-09-19, the overnight
 * round's twelfth and last board).
 *
 * Will (docs/design/rulings.md, "the overnight round"): every surface is
 * unprotected, "at worst, net neutral and fully deleted". Eight decisions on
 * the six not-found pages and the six error boundaries across marketing, the
 * app, the guest pages, auth and admin: `NotFoundScreen`, `MarketingNotFound`
 * and its `MissingFrameStrip`, the render-crash boundaries and the private
 * event's hand-rolled lock, drawn with fabricated `error`/`reset` props inside
 * each surface's own chrome, at 1440 with 375 on a shared knob.
 *
 * ★ WHAT TODAY ALREADY SHARES, AND WHAT IT DOES NOT. `NotFoundScreen` already
 * serves three surfaces and `MarketingNotFound` already wraps it for a fourth;
 * the gap is `RouteError`, duplicated across four call sites with no shared
 * component at all, `GlobalError` (which structurally cannot share a component
 * with anything, since it renders before any stylesheet exists) and the
 * private lock (hand-rolled, sharing no code with the family it visually
 * matches). `grammar` asks whether to close that gap; every option is drawn on
 * a real pair of surfaces so the difference (or its absence) is legible rather
 * than asserted.
 *
 * ★ THE STAGING. `ways-out` and `private-event` wait on `grammar`, because
 * both draw the shape it settles: how many actions a screen offers depends on
 * the primitive it is built from, and the private lock's `family`/`same-page`
 * options are explicitly "the not-found family's screen", which only has one
 * settled shape once `grammar` answers. The other five are independent
 * questions about a different part of the surface each (the photo-strip
 * motif, the digest, the wrapper, the admin host's 404, the last-resort
 * crash) and carry no order between them.
 *
 * ★ WHAT IS DELIBERATELY NOT ASKED. Any production byte; the root 404 (wired
 * on the image trail, drawn only as a reference inside `RootMarketingChrome`);
 * whether the group 404s gain the trail (open, `trail-wiring`'s); the dead
 * profile handle (`profile-page`); the guest door and welcome sheet
 * (`guest-shape`); the sign-in form's inline failure (`app-door`); a failed
 * upload tile (`guest-upload`); the marketing header and footer's own shape
 * (`site-chrome` — every marketing frame here wears today's).
 */

/**
 * THE SCREEN, the knob most decisions share, so one real viewport is on the
 * stage at a time. 1440 by default: a dead end is read at a desk as often as
 * in a hand, and every failure screen's own column is narrow enough that 375
 * changes little beyond the surround around it.
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

const DRAFT = defineExploration({
  id: "error-pages",
  title: "Every failure page as one grammar",
  round: {
    n: 1,
    date: "2026-09-19",
    changed:
      "The first round: one grammar or eight, how many ways out, where the photo strip appears, whether a crash shows its code, what surrounds a failure, the private lock, the admin host's 404, and the last-resort crash.",
  },
  context:
    "Six not-found pages and six error boundaries, today: NotFoundScreen (three call sites) and MarketingNotFound (wrapping it for two more) already share one shape; RouteError repeats that same shape by hand at four more call sites; GlobalError and the private event's lock share no code with anything. Every picture here is a real pair of surfaces with one axis moved.",
  bible: [13, 14, 19, 21, 22],
  asks: [
    {
      id: "grammar",
      label: "One grammar",
      question: "Should every dead end and crash share one grammar, or keep today's separate voices?",
      context:
        "NotFoundScreen already draws the icon-title-description-actions shape for three surfaces. RouteError is the same shape, hand-copied at four more call sites with no shared component. GlobalError and the private lock share none of it.",
      options: [
        {
          id: "today",
          label: "Kept apart, as today",
          means: "NotFoundScreen, RouteError, MarketingRouteError, GlobalError and the lock stay five separate components.",
        },
        {
          id: "shared",
          label: "One primitive, per-surface words",
          means: "RouteError folds into NotFoundScreen (one new prop, a digest slot); a surface still picks its own icon, copy and picture.",
        },
        {
          id: "unified",
          label: "One screen, everywhere",
          means: "The same icon, title and words on every dead end and every crash, marketing included. No surface keeps its own voice.",
        },
      ],
      recommended: "shared",
      because:
        "RouteError is NotFoundScreen's exact shape with a digest paragraph added, copied four times by hand; folding it in is a one-prop change, not a rewrite, and it costs nothing marketing or guest already has.",
      overrule:
        "If keeping the crash boundaries independent keeps a future departure cheap, four small files beat one branching one to reason about.",
      lands: "Whether RouteError folds into NotFoundScreen, and how many failure components the codebase carries.",
      configs: [SCREEN],
    },
    {
      id: "ways-out",
      label: "The ways out",
      question: "How many ways out should a dead end or a crash offer?",
      context:
        "Today's mix: two actions on most screens, one on the guest and admin 404s, and only the marketing pages point further, to help or to contact.",
      options: [
        {
          id: "today",
          label: "One or two, as today",
          means: "The guest and admin 404s keep one action; every other screen keeps two; only marketing adds a third link.",
        },
        {
          id: "two",
          label: "Always two",
          means: "The guest 404 promotes its footnote to a second button; the admin 404 gains a link to the reports inbox.",
        },
        {
          id: "guided",
          label: "Two, and a line to help",
          means: "The same two actions everywhere, plus one quiet line to the help center or contact, worded for its surface.",
        },
      ],
      recommended: "guided",
      because:
        "A dead end is exactly where somebody wants a human, and today only the marketing pages offer one; the line costs one sentence and never competes with the two actions for attention.",
      overrule:
        "If the admin portal is one operator who already knows where support lives, the extra line there is a devtool answering a question nobody asked it.",
      lands: "Whether every failure screen gains a help or contact line, and whether the guest and admin 404s gain a second action.",
      after: { ask: "grammar" },
      configs: [SCREEN],
    },
    {
      id: "picture",
      label: "The picture",
      question: "Where should the tilted photo strip appear?",
      context:
        "MissingFrameStrip sits under the marketing 404 and 500 today. The app, guest and admin dead ends draw a plain icon, and the root 404 now stands on the wired image trail instead.",
      options: [
        {
          id: "today",
          label: "Marketing only, as today",
          means: "The strip stays on the marketing 404 and 500; the app and admin screens stay a plain icon.",
        },
        {
          id: "everywhere",
          label: "Wherever a failure renders",
          means: "The same strip rides every dead end and crash, achromatic and static, one shared motif for all of them.",
        },
        {
          id: "nowhere",
          label: "Nowhere but the trail",
          means: "The strip retires everywhere; the root 404's image trail carries the idea alone.",
        },
      ],
      recommended: "today",
      because:
        "The strip is a marketing-voiced flourish, and the app and admin surfaces are working tools mid-task where the plain icon already reads as calm; spreading decoration to a boundary a host hits mid-upload adds weight where speed matters.",
      overrule:
        "If one motif tying every failure screen together beats each surface's own restraint, 'wherever it renders' is the one-grammar answer made visual.",
      lands: "Whether MissingFrameStrip stays marketing-only or becomes shared vocabulary.",
      configs: [SCREEN],
    },
    {
      id: "code",
      label: "The code",
      question: "Should a crash show its digest, and if so, how?",
      context:
        "RouteError, MarketingRouteError and GlobalError all receive a digest from Next; today it prints as a plain, uncopyable code. A 404 never carries one, because it throws nothing to correlate.",
      options: [
        {
          id: "today",
          label: "A plain code, as today",
          means: "The digest prints in a muted chip with no label beyond 'Error code' and no way to copy it.",
        },
        {
          id: "always",
          label: "Always, with Copy and a line",
          means: "The same chip gains a Copy control and one sentence: this is what helps us find what happened.",
        },
        {
          id: "silent",
          label: "Never shown",
          means: "The digest keeps reaching Sentry; the screen says nothing about it, and a report carries no code.",
        },
      ],
      recommended: "always",
      because:
        "The digest is the one correlation handle support has, and today it is a string somebody retypes by hand into an email; a Copy control and one sentence make it useful instead of decorative.",
      overrule:
        "If most reports arrive with a screenshot anyway, a bare code costs nothing extra to read and Copy is one more control for the rare report that needs it.",
      lands: "Whether every render-crash boundary gains a Copy control on its digest and an explanatory line.",
      configs: [SCREEN],
    },
    {
      id: "surround",
      label: "The surround",
      question: "What should wrap a failure screen: today's mix, the surface's own chrome, or nothing?",
      context:
        "Today's mix: the app and admin screens sit inside their real shell, marketing wears its header and footer (or a logo bar on its crash), and a guest crash renders with no wrapper at all.",
      options: [
        {
          id: "today",
          label: "Today's mix",
          means: "The app and admin keep their shell; marketing keeps its header, footer or logo bar; the guest crash stays bare.",
        },
        {
          id: "shell",
          label: "The surface's own chrome, always",
          means: "Every failure screen renders inside its real surface's shell, guest included: the one gap today leaves closes.",
        },
        {
          id: "bare",
          label: "Bare, always",
          means: "Every wrapper drops. One calm centered page, everywhere, with nothing but the failure itself.",
        },
      ],
      recommended: "shell",
      because:
        "A crash mid-session in the app or the admin portal is not the moment to strip away the one thing telling a host or an operator where they still are; the guest crash losing its header today is the gap, not the model.",
      overrule:
        "If a failure is a moment to say nothing but the failure, wrapping every screen in a live nav invites tapping back into a session that just proved unstable.",
      lands: "Whether the guest crash gains a header, and whether every not-found and error screen formally commits to its surface's shell.",
      configs: [SCREEN],
    },
    {
      id: "private-event",
      label: "The private event",
      question: "Should a private event's lock reuse the not-found family, or stay its own block?",
      context:
        "A private event renders a hand-rolled stack today: a lock icon, one heading, one sentence, no action. It shares no component with NotFoundScreen, which draws the identical icon-title-description shape three times elsewhere.",
      options: [
        {
          id: "today",
          label: "Its own block, as today",
          means: "The lock stays a bespoke stack inside the guest page, sharing no component with the dead-end family.",
        },
        {
          id: "family",
          label: "The not-found family, wearing a lock",
          means: "NotFoundScreen draws the lock icon and the same words, so a private event and a missing one differ only in props.",
        },
        {
          id: "same-page",
          label: "The same page as a missing event",
          means: "A private event 404s exactly like a deleted one: one screen, nothing revealing a private event exists at all.",
        },
      ],
      recommended: "family",
      because:
        "The lock is already NotFoundScreen's shape by eye, an icon circle, a title, one sentence, with none of its code; folding it in is pure de-duplication that changes nothing a guest sees.",
      overrule:
        "If revealing a private event exists at all is one bit too many, 'same page as a missing event' is the don't-leak doctrine, taken all the way.",
      lands: "Whether the private lock becomes a NotFoundScreen variant, and whether a private event stays distinguishable from a deleted one.",
      after: { ask: "grammar" },
    },
    {
      id: "admin-404",
      label: "The admin's 404",
      question: "What should a refused path on the admin host show?",
      context:
        "The admin surface allow-lists its own paths; anything else rewrites to the root marketing 404, whose footnote links (features, pricing, contact) 404 again on that host, because none of those routes exist there.",
      options: [
        {
          id: "today",
          label: "The marketing 404, as today",
          means: "The same root screen every host gets, footnote links included, even though every one dead-ends again here.",
        },
        {
          id: "portal",
          label: "A portal screen, no marketing links",
          means: "The admin's own not-found content, wearing the ops chrome, pointing back at the portal and nothing this host does not serve.",
        },
        {
          id: "redirect",
          label: "Straight back to the portal's home",
          means: "A refused path never renders a 404; it redirects to /admin, or to /login when the operator is signed out.",
        },
      ],
      recommended: "portal",
      because:
        "A 404 that offers three more dead ends is worse than no 404 at all; the fix is answering the surface it actually rewrote to, not shipping the marketing page's links unread.",
      overrule:
        "If nobody but Will and one operator ever reaches this path, a redirect is less to maintain than a second 404 screen and loses nothing a person would notice.",
      lands: "Whether the admin surface gets its own not-found content, still rewritten to the same undiscoverable path.",
      configs: [SCREEN],
    },
    {
      id: "global-crash",
      label: "The global crash",
      question: "What should render when the root layout itself crashes?",
      context:
        "GlobalError is the last resort: inline styles only, no stylesheet, because the layout that would have loaded one is what crashed. Today it offers Try again alone.",
      options: [
        {
          id: "today",
          label: "Try again alone, as today",
          means: "One button, inline-styled, no way home if retrying does not fix it.",
        },
        {
          id: "home",
          label: "Try again, and a way home",
          means: "The same screen gains a plain inline-styled anchor to '/', for when reloading is not enough.",
        },
        {
          id: "plain",
          label: "A code and an email",
          means: "The digest prints with a plain mailto line beneath it, in case even '/' cannot load.",
        },
      ],
      recommended: "home",
      because:
        "Try again cannot fix a genuinely broken deploy, and the one thing this screen can still offer for free is a plain anchor tag, which needs no script and no router to work.",
      overrule:
        "If '/' is exactly as likely to be broken as whatever crashed, the honest screen promises only a reload and adds nothing that might be a second lie.",
      lands: "Whether GlobalError gains a second, inline-styled link home.",
    },
  ],
});

export const ERROR_PAGES: typeof DRAFT = {
  ...DRAFT,
  controls: DRAFT.controls?.filter(
    (c, i, all) => all.findIndex((d) => d.id === c.id) === i,
  ),
};
