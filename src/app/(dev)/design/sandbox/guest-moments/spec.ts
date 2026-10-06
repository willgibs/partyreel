import { defineExploration } from "@/components/lab/exploration";

import { SCREEN } from "./knobs";

/**
 * GUEST MOMENTS, ROUND ONE (the guest-moments-r1 track, cut 2026-10-06):
 * four moments of a guest's night that the calls lab's round 15 settled in
 * text on 2026-10-04 and wiring built that way, each now asked as a picture
 * with its built answer drawn as one option (production's own):
 *
 *  - `own` (C7): her own photo landing on her phone. Production lights it
 *    with one sweep (`arrival.ts`: "your own never glows, it sweeps") while
 *    the host's grid glows it like any guest's.
 *  - `batch` (Q3): others' photos landing at the album's top, about every
 *    15 s (`ALBUM_BATCH_MS`): every place opens at once and each photo wipes
 *    in from its left edge (`arrival=push`), so the top reads empty for the
 *    glide's 450 ms, and a photo past the gate's 2 s comes in grey.
 *  - `limit` and `where` (D3): taking a shot back. Production's ceiling is
 *    `ROLL_RETAKES = 3` ROLLS' worth (72 shots on a roll of 24), said only in
 *    Settings' camera line ("up to 72 shots in all"); the brief's "up to 3
 *    shots in all" read that line as Will's flat 3, which customize r1's
 *    opening records as his word and which production never built. The X
 *    lives in Your shots alone. `where` waits on `limit`, so its words are
 *    the picked limit's.
 *  - `opening` (G6): the reel's curtain, black until the player's first
 *    window draws, with no mark (about 1 s on a slow phone, 0.3 s warmed).
 *
 * ★ PRODUCTION DRAWS EVERY FRAME it can: the cover, the camera's parts, the
 * roll's end and Your shots are production's components with production's
 * words; the album's rows are production's layout engine; the arrival lights
 * are `arrival.css`'s numbers. The reel's resting bar is retyped (the view
 * mounts only inside its dialog and its store).
 *
 * Nothing here asks what a standing board asks: brand r2's take (the colour
 * of the light would follow it, never which option wins), event-header r6's
 * card and attention, the-wait's develop, customize's roll size.
 */
export const GUEST_MOMENTS = defineExploration({
  id: "guest-moments",
  title: "Guest moments: four beats of her night",
  surface: "guest",
  desk: 45,
  // The system docs and the production paths the board redraws: a wiring
  // lane's owns start here, and a merge that touches one flags the open asks.
  lives: [
    "docs/systems/guest-flow.md",
    "docs/systems/disposable-mode.md",
    "docs/systems/reel.md",
    "src/components/shared/arrival.css",
    "src/lib/shared/arrival.ts",
    "src/components/shared/album-window.tsx",
    "src/components/guest/camera/",
    "src/components/guest/event-experience.tsx",
  ],
  tracks: ["guest-moments-r1"],
  round: {
    n: 1,
    date: "2026-10-06",
    changed:
      "Four calls made in text on Oct 4 and built that way, each now drawn against real alternatives: her photo landing, a batch of others', taking a shot back, the reel's first second.",
  },
  opening: {
    about:
      "Four moments of a guest's night, built from text on Oct 4 and now drawn: her photo landing, others' landing, taking a shot back, the reel's first second.",
    settled: [
      "Every frame is production as it stands: identity r5's atoms on Afterglow's tokens; brand r2's take would recolour the light, not change a pick.",
      "The host's album keeps its glow on every guest's photo, whatever is picked for the guest's own.",
      "A shot taken back gives its frame back and purges that night; only how many, and from where, are asked.",
    ],
    earlier: [
      "Arrivals are one grammar on both sides: 'Would feel weird for it to be handled differently on either' (Sept 21).",
      "'The shimmer feels more like a delight moment' (Sept 17): spent on her own newest photo alone.",
      "arrival=push: 'The row opens ... Nothing fades; it reads as inserted' (album-columns r2).",
      "Re-shoots: a flat 3 at any roll size, your word (customize r1); production still allows three rolls' worth.",
    ],
  },
  terms: [
    {
      term: "sweep",
      means:
        "One pass of light across her own newest photo as it lands, 0.9 s.",
    },
    {
      term: "glow",
      means:
        "The white rim and wash that lights a photo new to the album, 2 s, for anyone but its sender.",
    },
    {
      term: "re-shoots",
      means:
        "The shots past her roll that taking a shot back can free: today two more rolls' worth.",
    },
    {
      term: "curtain",
      means:
        "The black the page holds over everything while the reel's player loads.",
    },
  ],
  asks: [
    /* ── 1. C7: her own photo landing ───────────────────────────────────── */
    {
      id: "own",
      label: "Her own photo lands",
      question:
        "When a guest's own photo lands in the album on her phone, how should she see it arrive?",
      where: ["Guest", "The album", "Her photo lands"],
      when: "A Live album at the party: she sends a photo with Add photos and it joins the top of the album.",
      matters:
        "It is the first proof her photo is in: the moment the whole product turns on for a guest.",
      lands:
        "How every album lights a photo for the one who sent it; the host's glow stays for everyone else's.",
      context:
        "Priya's phone at the wedding, the album scrolled to its top: her first photo of the night landing (playing), then held: her first at its brightest, and her third an hour on. Maya sees every one glow, whichever is picked.",
      options: [
        {
          id: "sweep",
          label: "One sweep of light, as today",
          means:
            "Her own photo gets one pass of light across it (0.9 s); other guests' photos glow; the host sees hers glow.",
          gains:
            "Hers and theirs read differently: the delight is spent on hers alone.",
          costs: "One quick pass is easy to miss on a phone at arm's length.",
        },
        {
          id: "glow",
          label: "It glows, as everyone's does",
          means:
            "Her own photo wears the same rim and wash as any arrival (2 s): one light for every photo new to the album.",
          gains:
            "One light for every arrival, the same on her phone as on the host's.",
          costs: "Hers reads like anyone's: nothing says this one is yours.",
        },
        {
          id: "first",
          label: "Her first one says so",
          means:
            "Her first photo of the night glows and says 'Yours is in' on the tile for 2 s; every later one sweeps.",
          gains:
            "The moment she learns it works is named once, then gets out of the way.",
          costs:
            "A word on her own tile again, which no-mark-on-mine (Sept 27) took off.",
        },
        {
          id: "quiet",
          label: "It simply stands there",
          means:
            "No light on her own: the photo is at the top, as it is for anyone scrolling there.",
          gains: "Nothing to miss or tire of; the photograph is the news.",
          costs: "The one delight moment by definition goes unmarked.",
        },
      ],
      recommended: "first",
      today: "sweep",
      because:
        "Her first photo landing is the one moment that must read; naming it once costs no clarity, and every later one keeps the sweep.",
      configs: [SCREEN],
    },

    /* ── 2. Q3: a batch of others' photos ───────────────────────────────── */
    {
      id: "batch",
      label: "Others' photos land",
      question:
        "When a few photos from other guests reach the album's top together, how should they come in?",
      where: ["Guest", "The album", "Others' photos land"],
      when: "She is at the album's top while others shoot: their photos arrive in batches, about every 15 seconds.",
      matters:
        "At a phone a batch of six opens the top at once and reads empty for a moment, right where she looks.",
      lands:
        "How the rows take in new photos at the top of every live album, the host's included.",
      context:
        "Priya's phone at the album's top as six photos from the dance floor land in one batch: the moving frame, then two held instants: 0.15 s in, and settled. The sixth is slow to draw. Every option keeps the glow on others' photos.",
      options: [
        {
          id: "push",
          label: "The row opens, as today",
          means:
            "All six places open at once and each photo is revealed from its left edge (0.45 s), glowing; one not drawn yet comes in grey.",
          gains:
            "Your pick, arrival=push: it reads as inserted, and nothing fades.",
          costs:
            "For half a second the top is six open places; a slow photo stays grey.",
        },
        {
          id: "settle",
          label: "Each stands whole, and glows",
          means:
            "Each photo is whole in its place from the first frame its place opens, glowing; the neighbours still glide.",
          gains: "Never an empty place: the top is always photographs.",
          costs:
            "Loses the wipe that reads as inserted; waits for its slowest photo, 2 s at most.",
        },
        {
          id: "file",
          label: "One after another",
          means:
            "They come in one at a time, 0.16 s apart, each whole and glowing, each only once it is drawn.",
          gains: "Reads as people arriving, not a block; never an empty place.",
          costs: "The top keeps moving for a second while she reads it.",
        },
        {
          id: "pill",
          label: "They wait behind '6 new'",
          means:
            "At the top too they wait behind the arrivals pill; her press lets them in, glowing.",
          gains:
            "Nothing moves under her thumb unasked: a clear state and a way in.",
          costs:
            "A press owed every 15 s; a guest who never presses reads a stale top.",
        },
      ],
      recommended: "settle",
      today: "push",
      because:
        "It keeps the insert and loses only the empty half second, at the gate that already waits for each photo to draw.",
      configs: [SCREEN],
    },

    /* ── 3. D3: how many shots she may take back ────────────────────────── */
    {
      id: "limit",
      label: "How many re-shoots",
      question:
        "How many shots may a guest take back and shoot again on one roll?",
      where: ["Guest", "The camera", "Taking a shot back"],
      when: "A Disposable at the party: her shots are sealed till 9 am, and each is hers to take back from Your shots.",
      matters:
        "It bounds what a roll means: a roll of 24 that can be shot 72 times is hardly a roll.",
      lands:
        "The ceiling the server counts, what Settings says of it, and what her camera says.",
      context:
        "Priya's camera on a roll of 24, at a phone only: Your shots after she has taken one back (its head says what is left, where the option says it), then the roll's end once her re-shoots are spent.",
      options: [
        {
          id: "rolls",
          label: "Three rolls' worth, as today",
          means:
            "Up to 72 shots on a roll of 24 (48 re-shoots), said only in Settings; met, unsaid, at the shot past it.",
          gains: "Room enough that nobody meets it at an ordinary party.",
          costs:
            "A number nobody holds, and a ceiling she meets with no warning.",
        },
        {
          id: "three",
          label: "A flat 3 re-shoots",
          means:
            "Three re-shoots at any roll size, counted where she takes one back: '2 re-shoots left'.",
          gains: "Your word; a number she can hold, so a re-shoot is a choice.",
          costs: "A guest who fumbles four shots on a big roll has none left.",
        },
        {
          id: "roll",
          label: "One roll's worth",
          means:
            "Up to 24 re-shoots on a roll of 24 (48 shots in all), counted in Your shots.",
          gains:
            "Scales with the roll the host picked; still a bound she can read.",
          costs: "A second roll in all but name, and a count that runs long.",
        },
      ],
      recommended: "three",
      today: "rolls",
      because:
        "Your word in customize r1, and a count she can see turns a ceiling she trips over into a choice she makes.",
    },

    /* ── 4. D3: where she takes one back ────────────────────────────────── */
    {
      id: "where",
      label: "Where she takes one back",
      question:
        "Where should she take a shot back: from her list of shots, or right from the reel?",
      where: ["Guest", "The camera", "Taking a shot back"],
      when: "She has just taken a shot she doesn't want, and the camera is still open in her hand.",
      matters:
        "A take-back is wanted right after the shot, and today it is a list and two presses deep.",
      lands:
        "Where the camera offers a take-back; Your shots keeps its X either way.",
      context:
        "Priya's camera at a phone, six shots in: what a press on the reel's newest frame opens, then the moment she takes it back. Drawn at the re-shoots you picked.",
      after: { ask: "limit" },
      options: [
        {
          id: "list",
          label: "From Your shots, as today",
          means:
            "The reel opens Your shots, where each shot has its X; a press takes it back, no confirm.",
          gains: "One place for every shot; the camera stays a camera.",
          costs: "Two presses and a list to find the one she just took.",
        },
        {
          id: "reel",
          label: "From the reel's newest frame",
          means:
            "A press on the reel's newest frame opens that shot with Take it back and Keep it; the list keeps its X.",
          gains:
            "The take-back is where the regret is: one press after the shot.",
          costs: "A second door to the same act, and a sheet over the picture.",
        },
      ],
      recommended: "reel",
      today: "list",
      because:
        "The wish to take a shot back comes the second after it; the reel's newest frame is already where her eye goes.",
    },

    /* ── 5. G6: the reel opening ────────────────────────────────────────── */
    {
      id: "opening",
      label: "The reel's first second",
      question:
        "When the reel opens, what should she see before its first photograph is ready?",
      where: ["Guest", "The reel", "As it opens"],
      when: "She opens a shared reel link, or the host presses her hub's Reel card, and the player is still loading.",
      matters:
        "Today it is a black screen with no mark for up to a second: at the very start, it reads as broken.",
      lands:
        "The curtain on every reel opening: a shared link, the Reel card and the screen on a wall.",
      context:
        "The reel opening on a phone (a laptop by the Screen knob): the moving frame plays a slow phone's second, then three held instants: the press, half a second on, and the reel playing.",
      options: [
        {
          id: "black",
          label: "Black, then the reel, as today",
          means:
            "The page's curtain is black until the first frame draws: about a second on a slow phone, a third warmed.",
          gains:
            "Nothing to design or keep in step; the reel arrives as a cut.",
          costs: "A black screen with no mark and no way out reads as broken.",
        },
        {
          id: "still",
          label: "The first photo, at once",
          means:
            "The curtain is the reel's first photograph, already on the page as the cover; the reel starts from it, Close beside it.",
          gains: "No wait to see: the reel seems to start on the press.",
          costs:
            "Needs the still with the page; a reel opening on a video has only its poster.",
        },
        {
          id: "mark",
          label: "The bar first, its line running",
          means:
            "Black, but the reel's own bar stands at once with its line running, and Close beside it.",
          gains: "A clear state and a way out, in the reel's own furniture.",
          costs: "Says 'loading' for a wait that is often a third of a second.",
        },
      ],
      recommended: "still",
      today: "black",
      because:
        "The first photograph is already on the page as the cover; standing it at once turns the wait into the reel's first hold.",
      configs: [SCREEN],
    },
  ],
});
