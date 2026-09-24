import type { Control } from "@/components/lab/board-spec";
import { defineExploration } from "@/components/lab/exploration";

/**
 * THE REEL'S FULL-SCREEN VIEW, ROUND ONE (THE REEL ROUND, Will, 2026-09-22;
 * "the reel, reconceived").
 *
 * The reel is the event's now: a live, looping montage of everything the album
 * shows, alive from the third item, spliced by the album's own doorbell, faster
 * in the hand than on a wall. This board asks only the VIEW itself, the thing a
 * tap on the album's living tile or a `?reel` link opens: its chrome and how it
 * fades, the six controls and their arrangement, the beat a fresh upload gets,
 * what a tap on the picture does, whether it follows the device's own shape,
 * how fast a photograph holds, how a fresh loop announces itself, and what
 * reduced motion starts on. `media-viewer` owns what a photograph opens AS and
 * how a video meets a guest there; this board asks nothing they ask.
 *
 * ★ EVERY FRAME IS THE REAL ENGINE'S. Every specimen mounts `CanvasReelPlayer`
 * chrome-less over the shared wedding album (`gallery-fixtures.ts`), exactly as
 * the shipped guest overlay already does; the view's own chrome, drawn here, is
 * the only thing that changes between options. Close stays a corner circle on
 * every option, the way it already stands in the guest overlay and the
 * lightbox: nothing on this board asks whether a guest can always leave.
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
  id: "reel-view",
  title: "The reel's full-screen view",
  round: {
    n: 1,
    date: "2026-09-22",
    changed:
      "A new board for THE REEL ROUND: the view itself, drawn fresh over the real engine and the shared wedding album. Nothing here answers what the reel's mood is, how a cut is made, or the venue screen: those are the round's other boards.",
  },
  context:
    "Every option plays the same wedding album (gallery-fixtures.ts, Mia & Theo's) through the real drawReelFrame engine, at 1440 with 375 on the knob. Two items are re-typed to video so Include videos has something to toggle. No option presigns, uploads or writes anything; the mood shown throughout is Cinematic, a stand-in for the loop-tuned default mood no board has designed yet.",
  asks: [
    {
      id: "chrome",
      label: "The chrome",
      question: "What should the view's chrome be, and how should it fade?",
      context:
        "Will's own words: fade controls on rest, return them on movement. Close keeps its own corner circle on every option, as the shipped guest overlay's Close already does.",
      options: [
        {
          id: "bare",
          label: "Nothing, until the pointer moves",
          means:
            "A full-bleed picture with no foot controls at all until a cursor or a touch moves, then it eases in and fades again at rest.",
        },
        {
          id: "thin",
          label: "A thin bar that fades",
          means:
            "A slim strip at the foot stays faintly visible at rest and brightens into the full dock on movement, so the view never reads as totally bare.",
        },
        {
          id: "foot",
          label: "Controls always on, at the foot",
          means:
            "The full foot dock stays lit the whole time. Nothing to summon, nothing to lose track of.",
        },
      ],
      recommended: "bare",
      because:
        "It is his own brief: fade on rest, return on movement. A picture this immersive earns the moment with nothing standing on it.",
      overrule:
        "If a first-time guest might never discover the controls exist at all, the thin bar that never fully disappears is the safer default.",
      lands: "Whether the reel ever shows fully bare, and what a resting pointer costs the chrome.",
      configs: [SCREEN],
    },
    {
      id: "controls",
      label: "The controls",
      question: "How should the five foot controls arrange and order themselves?",
      context:
        "Play/pause, Include videos, Style, Add yours, Make your own: five ruled controls beside Close's own corner circle, drawn here fully up so the arrangement itself can be judged rather than a hidden dock.",
      options: [
        {
          id: "row",
          label: "One row, in the ruled order",
          means:
            "All five sit in a single foot row, evenly weighted, end to end in the order the brief names them.",
        },
        {
          id: "weighted",
          label: "Two big verbs, three small",
          means:
            "Add yours and Make your own stand out as two pill buttons on their own row; play/pause, Include videos and Style ride a slim row above them.",
        },
        {
          id: "split",
          label: "Utility in a corner, verbs at the foot",
          means:
            "Play/pause, Include videos and Style sit in a compact cluster at the opposite corner from Close; Add yours and Make your own float alone as the foot's own pair.",
        },
      ],
      recommended: "weighted",
      because:
        "Two verbs do the growth work, a guest adding a photograph and a guest making a cut; the other three are upkeep and can read smaller without disappearing.",
      overrule:
        "If six controls should read as one family with no hierarchy between them, the single row is the plainest answer.",
      lands: "Which two controls get top billing, and how much foot space the utility row costs.",
      configs: [SCREEN],
    },
    {
      id: "arrival",
      label: "The arrival",
      question: "How should a freshly-added item announce itself in the reel?",
      context:
        "The album's own doorbell splices a new upload into the loop within seconds of it landing. Shown here on a beat every few seconds so it can be caught without triggering anything by hand.",
      options: [
        {
          id: "caption",
          label: "A caption, held for one breath",
          means:
            "\"Just added by Theo\" fades in low on the frame and clears after one hold, then the reel carries on as before.",
        },
        {
          id: "chip",
          label: "A small corner chip",
          means:
            "A quiet pill in the free corner names the uploader for one hold, never covering the picture's own centre.",
        },
        {
          id: "none",
          label: "Nothing at all",
          means:
            "The new item simply plays its turn in the montage. No name, no chip, no announcement of any kind.",
        },
      ],
      recommended: "caption",
      because:
        "A guest who just uploaded should see their own name land inside the reel they are already watching, once, for one hold, never repeated for the same item.",
      overrule:
        "If the reel should stay a pure, wordless montage, silence keeps the picture the whole story with nothing written on it.",
      lands: "Whether an upload gets any credit inside the loop itself, beyond the album's own attribution.",
      configs: [SCREEN],
    },
    {
      id: "tap",
      label: "The tap",
      question: "What should a tap on the picture itself do?",
      context:
        "media-viewer owns what a photograph opens as; this asks only what the reel's own surface does when its picture is tapped, never the lightbox's own shape or how a video meets a guest there.",
      options: [
        {
          id: "lightbox",
          label: "Opens the item in the lightbox",
          means:
            "The reel pauses and the tapped clip opens full detail in the shared viewer, exactly as an album tile would.",
        },
        {
          id: "pause",
          label: "Pauses the reel in place",
          means:
            "A tap freezes the current clip where it stands; a second tap resumes. Nothing else opens.",
        },
        {
          id: "none",
          label: "Nothing",
          means:
            "The picture itself takes no tap at all. Only named controls, play/pause and Close, do anything.",
        },
      ],
      recommended: "lightbox",
      because:
        "It bridges back to the traditional gallery a guest could always explore: someone who wants one photograph closer should get it, not a frozen loop.",
      overrule:
        "If tapping the reel should feel like tapping a video rather than a photograph, pausing in place is the simpler, more predictable answer.",
      lands: "Whether the reel doors into the album's own viewer, or stays a self-contained loop with its own pause.",
      configs: [SCREEN],
    },
    {
      id: "posture",
      label: "The posture",
      question: "Should the reel's shape follow the device, or stay one fixed aspect?",
      context:
        "A phone shoots portrait; a laptop's window is wide. The engine already renders both orientations of the same event from one seed (build-reel-props.ts).",
      options: [
        {
          id: "follow",
          label: "One composition, following the viewport",
          means:
            "Portrait at a phone, landscape at a laptop: the same event, the engine's other orientation, each filling more of its own screen.",
        },
        {
          id: "letterboxed",
          label: "The reel's own aspect, letterboxed",
          means:
            "One fixed portrait aspect everywhere, centred with the dark backdrop filling the rest of a wide window.",
        },
      ],
      recommended: "follow",
      because:
        "A wider picture at a laptop earns the immersive read his brief wants; a narrow portrait strip stranded in a wide window reads unfinished by comparison.",
      overrule:
        "If one render must stay identical on every device with nothing extra to keep in sync, letterboxed is the simpler system.",
      lands: "Whether the engine renders two orientations for one event, and what a laptop's reel looks like at rest.",
      configs: [SCREEN],
    },
    {
      id: "pacing",
      label: "The pacing",
      question: "How fast should a photograph hold, in the hand?",
      context:
        "Faster in the hand than on a wall is his own rule. Three real running takes of the same wedding, only the hold length changed; the wall's own pace is the reel-screen board's knob, not this one's.",
      options: [
        {
          id: "quick",
          label: "About a second a photo",
          means:
            "A brisk 1.0 second hold, closer to a scroll than a slideshow: built for a guest glancing over between bites.",
        },
        {
          id: "steady",
          label: "About a second and a half",
          means:
            "A 1.5 second hold: enough to register a face before the next clip takes over.",
        },
        {
          id: "unhurried",
          label: "About two seconds and a bit",
          means:
            "A 2.2 second hold, closer to today's post-event pace: calmer, closer to a wall's own rhythm.",
        },
      ],
      recommended: "quick",
      because:
        "Faster in the hand than on a wall is his own rule; a guest holding a phone at a party is not sitting down for a slideshow.",
      overrule:
        "If a fast cut reads as frantic on a first watch, the steady one-and-a-half-second hold is the safer middle.",
      lands: "The live reel's base hold length in the hand; the wall's own pace belongs to reel-screen.",
      configs: [SCREEN],
    },
    {
      id: "loop",
      label: "The loop",
      question: "How should a fresh loop announce itself?",
      context:
        "Every loop reshuffles a new take from the same pool, a fresh seed each time. Shown here on the same beat the arrival ask uses, so it can be caught without triggering anything by hand.",
      options: [
        {
          id: "continues",
          label: "Nothing, it just continues",
          means:
            "The last clip's own transition carries straight into the new take. No seam is announced at all.",
        },
        {
          id: "breath",
          label: "A breath between takes",
          means:
            "A brief held beat of near-black, under a second, then the new take begins.",
        },
        {
          id: "title",
          label: "A title card",
          means:
            "The event's own name appears once, briefly, then clears into the new take.",
        },
      ],
      recommended: "continues",
      because:
        "The reel is meant to feel alive and continuous, never sessioned: a guest who has been watching for a minute should never feel it restart.",
      overrule:
        "If a loop needs to feel like a fresh cut rather than one endless montage, the breath marks the seam without asking anyone to read anything.",
      lands: "Whether a loop is ever a seam a guest can notice, and whether the event's name interrupts the montage.",
      configs: [SCREEN],
    },
    {
      id: "reduced",
      label: "Reduced motion",
      question: "What should reduced motion start the reel on?",
      context:
        "A guest who asks for less motion should still meet the reel as a finished thing, never a blank frame. Drawn as the picture itself, regardless of the reviewer's own setting.",
      options: [
        {
          id: "paused",
          label: "Paused, with controls up",
          means:
            "The first frame holds and the foot dock is already visible, never faded away; play is one tap from wherever the eye lands.",
        },
        {
          id: "frame",
          label: "The first frame, with a play mark",
          means:
            "A single still and a centred play mark, nothing else on the picture: the same minimal state a poster card wears before anyone has pressed it.",
        },
        {
          id: "slower",
          label: "It plays, just slower",
          means:
            "The reel still moves; reduced motion only stretches the hold well past pacing's own slowest, closer to a wall's calm.",
        },
      ],
      recommended: "paused",
      because:
        "It is the shipped guest overlay's own behaviour today: settled on frame 0 with its controls already up, play one tap away. This view should not invent a second rule for the same setting.",
      overrule:
        "If the chrome fade rule should hold even under reduced motion, the bare first frame with a play mark is the more consistent answer.",
      lands: "Whether reduced motion ever fully freezes the reel, and whether its chrome starts summoned or hidden.",
      configs: [SCREEN],
    },
  ],
});

export const REEL_VIEW: typeof DRAFT = {
  ...DRAFT,
  controls: DRAFT.controls?.filter(
    (c, i, all) => all.findIndex((d) => d.id === c.id) === i,
  ),
};
