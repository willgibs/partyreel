import type { Control } from "@/components/lab/board-spec";
import { defineExploration } from "@/components/lab/exploration";

/**
 * THE SCREEN, the knob every decision here shares. Declared as pure data rather
 * than imported from the board's own stage: a spec is what a SERVER page reads, and
 * a control lifted out of a client module drags that module's tree along with it.
 */
const SCREEN: Control = {
  id: "screen",
  label: "Screen",
  options: [
    { id: "375", label: "375, a phone" },
    { id: "1440", label: "1440, a laptop" },
  ],
  default: "375",
};

/**
 * THE SEEDED DEFAULT AVATAR, ROUND ONE (2026-09-19): Will's ask by name.
 *
 * His words, verbatim (docs/design/rulings.md): "A while back, Vercel introduced
 * seed-generated dither avatars, which made new accounts feel way cooler than
 * something generic. I'd like you to explore https://www.hashvatar.com/ ... so that
 * we can bake our own version into the app for new accounts until a new avatar is
 * uploaded to replace. I noticed that with both our guest lists and default
 * dashboard, without avatars/color it feels very bland. This would immediately
 * bring life to all avatar components, without a generic one being repeated for
 * every new account. Guest lists would feel rich and diverse, even without any
 * custom avatars uploaded. I like the gradient over dither for our purposes."
 *
 * ★ THE ONE TENSION WORTH NAMING, AND IT IS WITH BIBLE 1. "Achromatic UI with one
 * accent; the media is the color" is the rule this whole board pushes on, because a
 * guest list of two dozen hues is colour in the chrome. The reading that holds is
 * that an avatar is not chrome: it is a PERSON, the same class of object as a
 * photograph, and the rule's own carve-out ("a section without a picture is still
 * beautiful, never bare") is exactly the state Will described going bland. Every
 * option is drawn against today's grey so the cost of being wrong about that is on
 * screen rather than in this comment.
 *
 * ★ WHAT IS NOT ASKED HERE. Whether to do this at all: he ruled that, by name, and
 * ruled out dither with it. Neither is the generator's arithmetic a decision: the
 * lightness and chroma are fitted against three contrast floors and a contract test
 * holds a thousand seeds to them (gradient.test.ts), so no option on this board can
 * be picked into an illegible avatar.
 */
const DRAFT = defineExploration({
  id: "seed-avatar",
  title: "The colour a new account is",
  round: {
    n: 1,
    date: "2026-09-19",
    changed:
      "Round one: hashvatar's gradient mode learned and our own generator written in its place, zero dependencies and no canvas, so the guest list can draw it on the server. Seven decisions, every option on the real avatar surfaces with a wedding's twenty-four guests.",
  },
  context:
    "Will asked for this by name: seeded colour for every account until a photograph replaces it, because guest lists and the dashboard feel bland without one, and gradient over dither. Today one letter on grey is the whole answer on six surfaces. Every frame draws that grey beside the option, because his argument is a comparison.",
  bible: [1, 4, 12, 19, 22],
  asks: [
    {
      id: "look",
      label: "The shape",
      question: "What shape should the colour of a new account take?",
      context:
        "An account with no photograph draws one letter on grey today. This replaces that disc with a colour derived from the account itself, on all six surfaces at once. Gradient, never dither, his steer.",
      options: [
        {
          id: "orb",
          label: "A lit sphere",
          means:
            "One hue, a highlight in the upper third and its own shadow under it. hashvatar's gradient mode, redrawn as the sphere it was describing.",
        },
        {
          id: "diagonal",
          label: "Two hues on a diagonal",
          means:
            "A straight ramp from one hue to a second, corner to corner, with no light source at all. Vercel's shape, and the flattest of the four.",
        },
        {
          id: "aurora",
          label: "Two hues thrown across a ground",
          means:
            "Two soft throws over a deep base with a diffuse seam between them: the Aurora register, at the only scale an avatar has room for.",
        },
        {
          id: "flat",
          label: "One flat colour",
          means:
            "The hue and nothing else. No light, no shadow, no gradient: the test of whether the shading earns its place at all.",
        },
      ],
      recommended: "orb",
      because:
        "The sphere is the only one of the four that still reads as an object at 24px, which is where a guest list meets it: a diagonal's seam and an aurora's two throws both collapse into one muddy tone at that size, and flat has nothing to lose but nothing to give either.",
      overrule:
        "If the crowd at 375 looks busier than it looks alive, flat is the honest cut and costs one CSS colour.",
      lands:
        "The shape every account without a photograph wears, on every avatar in the product.",
      tile: "phone",
      configs: [SCREEN],
    },
    {
      id: "the-crowd",
      label: "The crowd",
      question: "How much of a guest list should carry colour?",
      context:
        "Above twelve uploaders the shipped list condenses to six faces and opens into wrapping chips. Both are drawn here, with the same twenty-four people, against the grey they replace. This is the frame his argument was about.",
      options: [
        {
          id: "full",
          label: "Every guest, full colour",
          means:
            "The row a reader meets and the whole opened list, each person their own hue at full strength.",
        },
        {
          id: "quiet",
          label: "Colour on the row, grey in the list",
          means:
            "The six faces carry colour; the opened list of twenty-four keeps today's grey letters.",
        },
        {
          id: "soft",
          label: "Full on the row, softer in the list",
          means:
            "Everyone coloured, with the chroma held back inside the opened list so two dozen hues do not shout at once.",
        },
      ],
      recommended: "full",
      because:
        "His words are that the list itself feels bland. Holding the colour back in the one place he named would answer the faces row and leave the complaint standing; the caption under each frame counts the distinct colours a reader actually meets.",
      overrule:
        "If two dozen hues at full strength pull the eye off the photographs above them, soft keeps everyone distinct at a lower volume.",
      lands:
        "Whether a seeded colour is the same strength wherever a person appears.",
      after: { ask: "look" },
      tile: "phone",
      configs: [SCREEN],
    },
    {
      id: "palette",
      label: "The wheel",
      question: "How far apart should two strangers' colours be?",
      context:
        "Lightness and chroma are already fitted so every colour clears its floors. What is open is which hues the generator may draw from at all, and a wedding puts two dozen of them in one wrapping list.",
      options: [
        {
          id: "wheel",
          label: "The whole wheel",
          means:
            "All 360 degrees. The widest difference between two people, and two neighbours in a row can land eight degrees apart.",
        },
        {
          id: "curated",
          label: "Twelve chosen hues",
          means:
            "A set spaced at least 22 degrees apart: nobody is ever nearly the colour of the person beside them, and the product holds twelve colours.",
        },
        {
          id: "warm",
          label: "One warm arc",
          means:
            "A hundred degrees of red through gold. A crowd reads as one gathering rather than a paint chart, at the cost of half the wheel.",
        },
      ],
      recommended: "wheel",
      because:
        "The whole point of the ask is a list that feels diverse. Twelve hues across twenty-four guests means every colour appears about twice, which reads as a pattern rather than as people, and the warm arc gives away the difference he asked for.",
      overrule:
        "If two near neighbours in one row read as a rendering bug rather than two people, the curated twelve fixes it outright.",
      lands: "The range of colours the product will ever assign.",
      after: { ask: "look" },
      tile: "phone",
      configs: [SCREEN],
    },
    {
      id: "letter",
      label: "The initial",
      question: "Should the initial still sit over the colour?",
      context:
        "The letter is the only thing identifying a face today. Over a colour it is a second signal on top of a first, and on a guest list it is the smallest type on the page. Drawn at all three sizes, each one measured.",
      options: [
        {
          id: "always",
          label: "The initial at every size",
          means:
            "24, 32 and 40 all carry it, in an ink the generator fits a 4.5:1 floor for at every hue.",
        },
        {
          id: "never",
          label: "The colour alone",
          means:
            "No letter anywhere. The colour is the whole mark, and the name beside it does the naming.",
        },
        {
          id: "large",
          label: "The initial from 40px up",
          means:
            "The two bigger sizes keep it; a guest list's 24px chips are colour only.",
        },
      ],
      recommended: "always",
      because:
        "A colour is not a name. Two people in a list can be told apart by hue, but neither can be identified by one, and on the faces row there is no name beside the picture at all.",
      overrule:
        "If the letter reads as noise over a lit sphere at 24px, dropping it there alone is the smallest cut.",
      lands: "Whether the initial survives anywhere once a colour exists.",
      after: { ask: "look" },
      tile: "phone",
      configs: [SCREEN],
    },
    {
      id: "seed",
      label: "The seed",
      question: "What should a person's colour be derived from?",
      context:
        "A seed is public by construction: the colour is painted on every album the person has uploaded to. Never an email, never a token (profiles-social.md). What is left is which public fact feeds it.",
      options: [
        {
          id: "account",
          label: "The account id",
          means:
            "Stable forever. A rename, a new handle and a new email all leave the colour exactly where it was.",
        },
        {
          id: "name",
          label: "The display name",
          means:
            "A person tunes their own colour by editing one field, and every album they appear on repaints the moment they do.",
        },
        {
          id: "handle",
          label: "The handle, where there is one",
          means:
            "The public handle, falling back to the account id for the four in five who have never claimed one.",
        },
      ],
      recommended: "account",
      because:
        "An identity colour that moves when somebody fixes a typo in their name is not an identity colour, and a rename would quietly repaint every guest list they stand in. The handle option is the account id for most people anyway.",
      overrule:
        "If letting a person choose their colour beats a stable one, the display name is the only option that hands them a dial without building one.",
      lands: "What the generator is fed, on every surface, forever.",
      tile: "phone",
      configs: [SCREEN],
    },
    {
      id: "after-upload",
      label: "After a photograph",
      question: "What should the colour do once a real photograph lands?",
      context:
        "A photograph is presigned server-side and can take a beat to arrive; the profile's cards paint black while they wait today. The colour is the only thing already in the right place when that happens.",
      options: [
        {
          id: "replace",
          label: "The photograph replaces it",
          means:
            "The colour unmounts the moment the photo decodes. Nothing of it survives, which is how the fallback behaves today.",
        },
        {
          id: "rim",
          label: "It survives as a rim",
          means:
            "A two pixel ring of the person's own hue around their face, so their colour stays part of who they are.",
        },
        {
          id: "under",
          label: "It waits underneath",
          means:
            "The photo paints over the colour rather than instead of it, so a slow presign shows a person's hue instead of a hole.",
        },
      ],
      recommended: "under",
      because:
        "It costs nothing, it is invisible the instant the photo lands, and it replaces the one genuinely bad state on these surfaces: an empty disc while a presigned URL is still in flight.",
      overrule:
        "If a colour is worth carrying on someone who already has a face, the rim is the only option that keeps it there.",
      lands: "What a reader sees in the second before a photograph arrives.",
      tile: "phone",
      configs: [SCREEN],
    },
    {
      id: "motion",
      label: "Motion",
      question: "Should a seeded avatar ever move?",
      context:
        "hashvatar's own avatars animate forever: six layers rotating, drifting and pulsing. A guest list holds twenty-four at once, and the motion budget is under 300ms with reduced motion honoured everywhere.",
      options: [
        {
          id: "none",
          label: "Still, always",
          means:
            "It never moves. One paint, no loop, nothing running behind a wall of photographs.",
        },
        {
          id: "page",
          label: "A slow drift, on a profile only",
          means:
            "The 80px avatar on a person's own page drifts its light over 14 seconds; every list and menu stays still.",
        },
        {
          id: "hover",
          label: "It shifts under a cursor",
          means:
            "The light moves while a pointer is over one face, and never on a phone, where most of these are met.",
        },
      ],
      recommended: "none",
      because:
        "An avatar is chrome, and two dozen breathing discs under a wall of photographs is the exact inverse of the media carrying the room. Nothing here is a moment; it is the quietest thing on the page by design.",
      overrule:
        "If the profile's own 80px disc feels dead beside the album under it, the profile-only drift touches one avatar on one page.",
      lands: "Whether any avatar in the product animates.",
      tile: "phone",
      configs: [SCREEN],
    },
  ],
});

/**
 * ★ ONE KNOB PER ID, NOT ONE PER DECISION THAT USES IT (`profile-page`'s note,
 * which `guest-upload` found first). `defineExploration` flattens every decision's
 * `configs` into the board's controls, so a screen knob seven decisions share
 * arrives seven times: the strip drew seven identical Screen knobs over the stage
 * and React warned on the duplicate key. Each decision keeps it on its own strip
 * (`configs`); the board declares it once.
 */
export const SEED_AVATAR: typeof DRAFT = {
  ...DRAFT,
  controls: DRAFT.controls?.filter(
    (c, i, all) => all.findIndex((d) => d.id === c.id) === i,
  ),
};
