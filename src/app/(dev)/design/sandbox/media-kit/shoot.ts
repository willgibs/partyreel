/**
 * THE SHOOT, AS A BRIEF (the media-kit track, round two).
 *
 * Round one wrote the kit as six shot lists: one line per frame, enough to argue
 * with and not enough to hold a camera to. This is the same 36 frames written as
 * a call sheet: what happens in the frame, how it is framed, what the light is
 * doing, the crops it has to survive, and the manifest id it inherits.
 *
 * ★ EVERY CONSTRAINT HERE COMES FROM A SURFACE THAT ALREADY EXISTS. The 4:5 card
 * and the 22-to-78 ladder are `blog-covers.ts`; the centre crop at 1200x630 is
 * `blog/[slug]/opengraph-image.tsx`, which does NOT apply the ladder; 120 px is
 * the narrowest the home hero's corridor draws a frame; 1:1 at 512 is ASSETS row
 * 2; 4:5 at 512x640 and 720x900 are rows 9 and 12. Nothing below is a preference.
 *
 * The four hard cases are ASSETS row 7's: one high key, one low key, one candle
 * warm, one stage cool, all landscape, because a palette ramp is only ever wrong
 * against media that fights it. They are four OF the 36, marked here rather than
 * asked for separately.
 */

/**
 * ★ THE SHOOT'S SIX GROUPS ARE NOT THE SHEET'S FIVE KINDS OF EVENT, and round
 * six had to say so out loud. `sources.ts` folds conferences into corporate,
 * because that is how a stock catalogue is searched; a call sheet cannot,
 * because an office party and a keynote floor are two different nights with two
 * different set-ups. The call sheet keeps its own six.
 */
export type ShootGroup =
  | "weddings"
  | "birthdays"
  | "corporate"
  | "conferences"
  | "festivals"
  | "trips";

export type Master = {
  /** Sheet number, stable, so a ruling can name a frame ("W3, not W4"). */
  code: string;
  vertical: ShootGroup;
  /** What happens in the frame. The thing being photographed, not the mood. */
  subject: string;
  /** Where the camera is and how close. */
  framing: string;
  /** What the light is doing, in the grade the whole set shares. */
  light: string;
  /** The crops this frame has to survive, named by the surface that makes them. */
  crops: readonly string[];
  orientation: "landscape" | "portrait";
  /** The manifest ids this frame inherits, by id. Empty where it is new ground. */
  replaces: readonly string[];
  /** One of the three frames that shows a guest holding a phone up (ASSETS row 7). */
  phoneUp?: true;
  /** One of the palette board's four hard cases (ASSETS row 7). */
  hardCase?: "high key" | "low key" | "candle warm" | "stage cool";
};

const LADDER = "4:5 card at the 22 and 78 percent rungs";
const SHARE = "1200x630 centre crop, no ladder";
const CORRIDOR = "legible at 120 px";
const SQUARE = "512 square";
const TALL = "4:5 at 512x640";

export const MASTERS: readonly Master[] = [
  /* ---------------------------------------------------------------- weddings */
  {
    code: "W1",
    vertical: "weddings",
    subject:
      "The couple coming back down the aisle under the arch, through a corridor of guests with their hands out",
    framing:
      "From the far end of the aisle at chest height, long enough to compress the corridor; the couple at a third of the frame height, guests filling both edges",
    light:
      "Backlit, golden hour or the last lamp, no fill. Faces go soft on purpose and the flare stays in",
    crops: [LADDER, SHARE, CORRIDOR],
    orientation: "landscape",
    replaces: ["wedding-golden", "wedding-arch"],
  },
  {
    code: "W2",
    vertical: "weddings",
    subject:
      "A toast mid-sentence: the glass up, the speaker soft, the table sharp and laughing",
    framing:
      "From across the table at seated eye level, the speaker at the edge and the listeners in focus; string lights kept in the top third so the ladder never loses them",
    light:
      "Candle warm, the lights as practicals rather than a key. The left 55 percent of frame in the lower third of the range",
    crops: [LADDER, SHARE, CORRIDOR, SQUARE],
    orientation: "landscape",
    replaces: ["wedding-toast"],
    hardCase: "candle warm",
  },
  {
    code: "W3",
    vertical: "weddings",
    subject: "The dance floor from above, hands up, the edges of the room gone",
    framing:
      "From a balcony or a chair, looking down at about 40 degrees, the floor filling the frame with no ceiling in it",
    light:
      "One lamp on the floor and nothing else. The darkest frame in the set, and the one that proves a dark ramp",
    crops: [LADDER, SHARE, SQUARE],
    orientation: "landscape",
    replaces: ["reception-hall"],
    hardCase: "low key",
  },
  {
    code: "W4",
    vertical: "weddings",
    subject:
      "The exit under petals or confetti, the couple small in the frame and guests filling the edges",
    framing:
      "Portrait, from low and close to the line, wide enough that the petals have somewhere to fall",
    light:
      "Dusk, warm, the sky still holding a little blue at the top of the frame",
    crops: [TALL, "720x900 portrait", CORRIDOR],
    orientation: "portrait",
    replaces: ["wedding-petals"],
  },
  {
    code: "W5",
    vertical: "weddings",
    subject:
      "The dress against a white wall, on its hanger, before anyone is in the room",
    framing:
      "Square to the wall, the dress at a third, plenty of wall. The quietest frame in the set",
    light:
      "Window light only, no lamp. The brightest frame in the set and the one a light ramp has to survive at the top",
    crops: [LADDER, SHARE],
    orientation: "landscape",
    replaces: [],
    hardCase: "high key",
  },
  {
    code: "W6",
    vertical: "weddings",
    subject:
      "The long table from the end, after people have sat down: candles down the middle, hands and rings reaching in",
    framing:
      "Level with the glasses at the end of the table, low, so the candles read as a line rather than a scatter. Shot after the sitting, never before",
    light: "Candles as the key, the room two stops under",
    crops: [LADDER, SHARE, SQUARE, CORRIDOR],
    orientation: "landscape",
    replaces: ["reception-table", "wedding-rings"],
  },

  /* --------------------------------------------------------------- birthdays */
  {
    code: "B1",
    vertical: "birthdays",
    subject: "Candles going out, faces lit from below, the room dark behind",
    framing:
      "Across the cake at the height of the flame, close enough that two faces fill the frame",
    light:
      "The candles are the only source. Everything above the faces falls away",
    crops: [LADDER, SHARE, SQUARE, CORRIDOR],
    orientation: "landscape",
    replaces: ["party-balloons"],
  },
  {
    code: "B2",
    vertical: "birthdays",
    subject: "A sparkler number held up in a dark room",
    framing:
      "Waist height, the holder a silhouette behind the number, nothing else in frame",
    light: "The sparkler only, at whatever shutter keeps the digits readable",
    crops: [LADDER, SQUARE, CORRIDOR],
    orientation: "landscape",
    replaces: [],
  },
  {
    code: "B3",
    vertical: "birthdays",
    subject: "The sofa squeeze: too many people in one frame, all laughing",
    framing:
      "Standing, looking slightly down, wide enough that the pile reads and tight enough that the room does not",
    light: "Lamps in frame, warm, nothing overhead",
    crops: [LADDER, SHARE],
    orientation: "landscape",
    replaces: [],
  },
  {
    code: "B4",
    vertical: "birthdays",
    subject: "Hands and cake, a slice coming out, a plate held up",
    framing:
      "Close, from just above the hands, no faces needed. The frame that has to read at 120 px",
    light: "Warm, one source, the background two stops under",
    crops: [SQUARE, CORRIDOR, LADDER],
    orientation: "landscape",
    replaces: [],
  },
  {
    code: "B5",
    vertical: "birthdays",
    subject: "Balloons against a ceiling with someone underneath looking up",
    framing:
      "Straight up from below, the person at the bottom edge so the frame is not decor",
    light:
      "Whatever the room has, warm. This is the frame that fixes the one birthday still we own, which has nobody in it",
    crops: [TALL, LADDER],
    orientation: "portrait",
    replaces: [],
  },
  {
    code: "B6",
    vertical: "birthdays",
    subject:
      "The table after: plates, confetti, one glass still going, nobody left",
    framing: "From standing, looking down the length of the table",
    light: "One lamp, late, cold coffee warm",
    crops: [LADDER, SHARE],
    orientation: "landscape",
    replaces: [],
  },

  /* --------------------------------------------------------------- corporate */
  {
    code: "C1",
    vertical: "corporate",
    subject: "The offsite long table, warm, phones face down",
    framing:
      "From the end at seated height, the table running away from camera",
    light: "Evening, practicals only, no overhead office light anywhere in it",
    crops: [LADDER, SHARE, CORRIDOR],
    orientation: "landscape",
    replaces: [],
  },
  {
    code: "C2",
    vertical: "corporate",
    subject: "A rooftop drinks circle at golden hour, the city behind",
    framing:
      "Standing in the circle rather than outside it, the horizon at the top third",
    light: "Low sun straight into the lens, faces rimmed",
    crops: [LADDER, SHARE, SQUARE],
    orientation: "landscape",
    replaces: [],
  },
  {
    code: "C3",
    vertical: "corporate",
    subject: "The award handshake, caught mid-clap from inside the room",
    framing:
      "From a seat, over the shoulders in front, the stage small and the room in it",
    light: "Stage light warm, room dark, no flash",
    crops: [LADDER, SHARE],
    orientation: "landscape",
    replaces: [],
  },
  {
    code: "C4",
    vertical: "corporate",
    subject: "Karaoke: two people sharing a mic, the room out of focus",
    framing: "Close and wide open, the pair filling the middle third",
    light: "A screen and one coloured lamp, nothing else",
    crops: [LADDER, SQUARE, CORRIDOR],
    orientation: "landscape",
    replaces: [],
  },
  {
    code: "C5",
    vertical: "corporate",
    subject:
      "The van at the end of the night, doors open, people still talking",
    framing: "From across the car park, the van at a third, the dark around it",
    light: "The van's interior light and a street lamp",
    crops: [LADDER, SHARE],
    orientation: "landscape",
    replaces: [],
  },
  {
    code: "C6",
    vertical: "corporate",
    subject: "A team photo going wrong, half of them laughing at it",
    framing:
      "The posed frame taken one second late, everyone still arranged and nobody still posing",
    light: "Daylight, open shade, no drama",
    crops: [LADDER, SHARE],
    orientation: "landscape",
    replaces: [],
  },

  /* ------------------------------------------------------------- conferences */
  {
    code: "K1",
    vertical: "conferences",
    subject: "The hallway between sessions, lanyards, nobody posing",
    framing:
      "Chest height in the flow of people, a shoulder in the foreground so the viewer is in the crowd",
    light: "Venue light, cool, one warm sign in the frame to break it",
    crops: [LADDER, SHARE],
    orientation: "landscape",
    replaces: [],
  },
  {
    code: "K2",
    vertical: "conferences",
    subject: "The stage from the back of the room, silhouettes and screen glow",
    framing: "Standing at the back, heads across the bottom third",
    light: "The screen is the only source, everything in front of it black",
    crops: [LADDER, SHARE, CORRIDOR],
    orientation: "landscape",
    replaces: [],
  },
  {
    code: "K3",
    vertical: "conferences",
    subject: "A phone held up over the crowd, photographing a slide",
    framing:
      "From just behind the holder's shoulder, the phone at a third and the slide readable past it",
    light: "Screen glow on the back of the phone, room dark",
    crops: [LADDER, SHARE, CORRIDOR, SQUARE],
    orientation: "landscape",
    replaces: [],
    phoneUp: true,
  },
  {
    code: "K4",
    vertical: "conferences",
    subject: "The coffee-break huddle: cups, gesturing hands, no faces needed",
    framing: "Close on the hands and cups, the faces cut by the top edge",
    light: "Window light, cool, a warm cup to hold the grade",
    crops: [SQUARE, CORRIDOR, LADDER],
    orientation: "landscape",
    replaces: [],
  },
  {
    code: "K5",
    vertical: "conferences",
    subject: "A booth handshake, badges legible, faces soft",
    framing: "From the side at chest height, the badge sharp and the face not",
    light: "Booth light, whatever colour it is, kept warm in grade",
    crops: [LADDER, SHARE],
    orientation: "landscape",
    replaces: [],
  },
  {
    code: "K6",
    vertical: "conferences",
    subject: "The badge wall at the end of day one, half the badges gone",
    framing: "Square to the wall, the gaps doing the work",
    light: "Flat venue light, no drama, the one still frame in the vertical",
    crops: [LADDER, SHARE],
    orientation: "landscape",
    replaces: [],
  },

  /* --------------------------------------------------------------- festivals */
  {
    code: "S1",
    vertical: "festivals",
    subject: "The crowd from inside it, hands up against stage light",
    framing:
      "At the height of a person in the middle of the crowd, never from the balcony",
    light: "Stage light through whatever is in the air, warm in grade",
    crops: [LADDER, SHARE, CORRIDOR],
    orientation: "landscape",
    replaces: ["festival-crowd"],
  },
  {
    code: "S2",
    vertical: "festivals",
    subject: "Confetti over a night crowd, phone screens visible in the dark",
    framing: "Inside the crowd looking up and forward, the stage at the edge",
    light: "Stage as the key, the phone screens as the only cool in the frame",
    crops: [LADDER, SHARE, SQUARE],
    orientation: "landscape",
    replaces: ["concert-confetti"],
  },
  {
    code: "S3",
    vertical: "festivals",
    subject:
      "Two friends on shoulders over a crowd at sunset, one of them filming on a phone",
    framing:
      "From below and behind, the pair against the sky, the phone held up and readable",
    light:
      "Sun behind them, faces dark, the phone's screen the brightest thing",
    crops: [LADDER, SHARE, CORRIDOR, TALL],
    orientation: "portrait",
    replaces: [],
    phoneUp: true,
  },
  {
    code: "S4",
    vertical: "festivals",
    subject:
      "A light rig from underneath at dusk, the sky still blue behind it",
    framing: "Directly under the rig looking up, the truss framing the sky",
    light:
      "Cool stage light against the last blue. The coolest frame in the set, and the one a warm ramp has to survive",
    crops: [LADDER, SHARE],
    orientation: "landscape",
    replaces: ["festival-lights"],
    hardCase: "stage cool",
  },
  {
    code: "S5",
    vertical: "festivals",
    subject:
      "The booth from behind the decks, over a shoulder, the floor beyond it out of focus",
    framing: "Behind the DJ at head height; the face is not the subject",
    light: "The floor's light, the booth in silhouette",
    crops: [LADDER, SHARE, CORRIDOR],
    orientation: "landscape",
    replaces: ["party-dj"],
  },
  {
    code: "S6",
    vertical: "festivals",
    subject: "The camp at dawn, one person awake",
    framing: "Wide, low, the tents small, the person at a third",
    light:
      "First light, cold, the one frame that is allowed to be cool and calm",
    crops: [LADDER, SHARE],
    orientation: "landscape",
    replaces: [],
  },

  /* ------------------------------------------------------------------- trips */
  {
    code: "T1",
    vertical: "trips",
    subject: "The car loaded, doors open, someone still deciding",
    framing: "From the front corner, the boot open, bags half in",
    light: "Early morning, flat, honest",
    crops: [LADDER, SHARE],
    orientation: "landscape",
    replaces: [],
  },
  {
    code: "T2",
    vertical: "trips",
    subject: "A terrace table at night, the town below",
    framing:
      "From the end of the table, the lights of the town behind the heads",
    light: "One bulb over the table, the town as the background exposure",
    crops: [LADDER, SHARE, CORRIDOR],
    orientation: "landscape",
    replaces: [],
  },
  {
    code: "T3",
    vertical: "trips",
    subject: "The group on a beach at dusk, backlit, no faces needed",
    framing: "From behind and low, the group as shapes against the water",
    light: "Sun on the horizon straight into the lens",
    crops: [LADDER, SHARE, SQUARE],
    orientation: "landscape",
    replaces: [],
  },
  {
    code: "T4",
    vertical: "trips",
    subject: "Someone photographing someone photographing",
    framing:
      "From the side so both phones are in frame, the far one small and still readable",
    light: "Whatever is there, warm in grade",
    crops: [LADDER, SHARE, CORRIDOR, SQUARE],
    orientation: "landscape",
    replaces: [],
    phoneUp: true,
  },
  {
    code: "T5",
    vertical: "trips",
    subject: "A ridge line with the group small in it",
    framing: "Wide, the figures at a tenth of the frame height",
    light: "Late sun across the ridge, long shadows",
    crops: [LADDER, SHARE],
    orientation: "landscape",
    replaces: [],
  },
  {
    code: "T6",
    vertical: "trips",
    subject: "The last fire, faces lit orange",
    framing: "Across the fire at seated height, two faces and the dark behind",
    light: "The fire only. The warmest frame in the set",
    crops: [LADDER, SHARE, SQUARE, CORRIDOR],
    orientation: "landscape",
    replaces: [],
  },
];

/**
 * WHAT THE SHOOT ALSO YIELDS, WITHOUT A SECOND CALL.
 *
 * ★ ROUND THREE READ THE WHOLE ASSET LOG AND THE ANSWER GOT BIGGER. Round two
 * listed four derived rows. The log has twelve rows; one of them (row 7) IS this
 * shoot, one (row 6) is the ruling this board asks for, and one (row 10) is a
 * noise tile and not a photograph. Every single one of the other NINE is a crop,
 * a recrop, a cut or a setup of the same night. That is the strongest argument
 * the Ours route has, and it was sitting in a file nobody had read end to end.
 *
 * ★ ROW 5 IS THE ONE THAT CHANGES THE SHAPE OF THE ANSWER. "The demo event's
 * curated folder" is the media the live demo event is seeded from, and the live
 * QR on every hero board points at it. If the shoot IS a Partyreel event, the
 * guests upload through the product, the demo event stops being seeded with
 * fixtures and starts being a real album, and the sourcing rule and the product's
 * own claim become the same sentence. The hero-river board reached the same idea
 * from the other end in its round two ("the frames in the stream should BE the
 * demo event's own media"), which is two boards arriving independently.
 *
 * Counts are the requesting board's latest, not the log's: hero-burst raised row
 * 9 from eight portraits to ten in its round two, and the log still says eight.
 */
export type Derived = {
  row: number;
  what: string;
  spec: string;
  /** How it comes out of the shoot. "a separate setup" when it does not. */
  from: string;
  replaces: string;
  askedBy: string;
};

export const DERIVED: readonly Derived[] = [
  {
    row: 1,
    what: "The hero film",
    spec: "15 to 20 s, 12 to 18 shots, 1920x1080 and a 1080x1920 crop of the same edit, mp4 under 1.5 MB plus a webm and two posters, silent, plus the cut list",
    from: "The cut of the night's footage. Film the eight clips (row 4) as one continuous shoot and the film is an edit, not a second production",
    replaces: "hero-candidate-02 (8.25 s, four shots) and its poster",
    askedBy: "hero-reel",
  },
  {
    row: 2,
    what: "24 squares",
    spec: "512x512, one grade, 6 to 35 KB webp each",
    from: "1:1 crops of the 24 masters marked 512 square above. No second shoot",
    replaces:
      "FRAMES in sandbox/home-hero/shared.tsx, which every round-three hero variation cycles",
    askedBy: "hero-source",
  },
  {
    row: 3,
    what: "36 photographs for the gathering's field",
    spec: "1600 px long edge, a third portrait, placed in 3:2, 16:9, 1:1, 4:3, 4:5, 3:4 and 2:3 boxes",
    from: "This row and row 7 are the same 36 frames. Row 7 specifies them by kind of event and row 3 by the boxes they land in, and the crop rules on every card above already satisfy both",
    replaces: "all twelve stand-ins, the same twelve row 7 names",
    askedBy: "hero-gathering",
  },
  {
    row: 4,
    what: "8 vertical clips with posters",
    spec: "3 to 5 s each, 1080x1920, silent, each with its own poster at 1080x1920",
    from: "Filmed at the same events as the stills, between the frames. Three run at once on desktop, so they need to cut together",
    replaces:
      "the three currentTime ranges cut out of hero-candidate-01, which share one poster today",
    askedBy: "hero-gathering",
  },
  {
    row: 5,
    what: "The demo event's curated folder",
    spec: "The photographs and clips the live demo event is seeded from, curated as a host would curate them",
    from: "The guests' own uploads, if the shoot is run AS a Partyreel event: they scan the QR, the album fills, and the seed stops being fixtures. The live QR on every hero board already points here",
    replaces: "the seed's current fixtures in scripts/seed-demo-event.mjs",
    askedBy: "the demo seed",
  },
  {
    row: 8,
    what: "A hand-and-phone cutout",
    spec: "PNG with alpha, 1200 px long edge, the screen area fully transparent, two grips (one hand and two)",
    from: "A SEPARATE SETUP, and the only one on this list. Shoot it at the same event against the darkest wall available, from just behind the holder's shoulder, in the same low warm light as K3, S3 and T4 so the body is nearly a silhouette with one highlight along the edge",
    replaces: "nothing now: the scan hero that drew the device retired with the home hero's round-five ruling (the source won), so the row is withdrawn until a board asks for a phone in hand again",
    askedBy: "hero-scan",
  },
  {
    row: 9,
    what: "10 portrait crops of the squares",
    spec: "512x640, the same photograph recropped, the same grade. Ten, not the log's eight: hero-burst raised the count in its round two so no frame is on screen twice on the desktop canvas",
    from: "4:5 crops of ten of the same 24. Pick the ten whose subject sits off centre, because a centred subject survives a square and loses the tall crop",
    replaces: "the square box on a third of the burst's field",
    askedBy: "hero-burst",
  },
  {
    row: 11,
    what: "A worst-case pair of overlapping photographs",
    spec: "Two frames whose touching edges are both dark and low contrast, 1200 px long edge, so the depth cue is judged against the case it exists for",
    from: "W3 and C1 are already that pair: a dance floor lit by one lamp, and an evening table with no overhead light. Shoot them knowing they will be laid over each other",
    // The light board asked for this pair and retired at its ruling
    // (2026-09-17); its depth scene lives on as the Library's Elevation
    // legend, which is where the pair lands when it is shot.
    replaces:
      "the wedding-rings and reception-table pair in the Library's Elevation legend (library/foundations/elevation-legend.tsx), the one scene where the small shadow and the larger one both land on a photograph",
    askedBy: "the Library's Elevation legend",
  },
  {
    row: 12,
    what: "12 portraits",
    spec: "4:5 at 720x900, one grade, 15 to 60 KB webp, legible at 110 px",
    from: "W4, B5 and S3 are shot portrait; the other nine are 4:5 crops of masters whose subject is vertical (a person, a rig, a bottle, a flame). Guests shoot vertical, so about 45 percent of the river's stream runs portrait",
    replaces:
      "the portrait cards (wf 0.8) in sandbox/home-hero/river.tsx's CARD_POOL, cropped hard from landscape today",
    askedBy: "hero-river",
  },
];

/** The rows in the asset log that are NOT cut from the shoot, and why. */
export const NOT_DERIVED: readonly {
  row: number;
  what: string;
  why: string;
}[] = [
  {
    row: 6,
    what: "A per-batch OK on the twelve stills",
    why: "This board's own ruling, not a file",
  },
  { row: 7, what: "The kit, 36 masters", why: "The shoot itself" },
  {
    row: 10,
    what: "A grain tile",
    why: "256 px of noise. Not a photograph, and the light board can generate it",
  },
];

export const HARD_CASES = MASTERS.filter((m) => m.hardCase);
export const PHONE_UP = MASTERS.filter((m) => m.phoneUp);

/** What a frame must survive before it enters the manifest, and the surface each rule comes from. */
export const KIT_CONSTRAINTS: readonly { rule: string; because: string }[] = [
  {
    rule: "1600 px on the long edge, a third of the set portrait",
    because:
      "Eleven of the twelve stand-ins are landscape and none is wider than 900 px, so one photograph currently feeds every tall slot in the product",
  },
  {
    rule: "Legible at 120 px",
    because:
      "The home hero's corridor draws a frame between 70 and 290 px, where a wide room shot is grey mush",
  },
  {
    rule: "Survives the ladder: 22 percent left to 78 percent right",
    because:
      "blog-covers.ts re-crops one source to six positions, so a frame with its whole subject in the middle loses it four times out of six",
  },
  {
    rule: "Survives a centre crop at 1200x630",
    because:
      "The share card ignores the ladder entirely, so the frame a stranger sees first is always the middle of it",
  },
  {
    rule: "Dark and warm, the left 55 percent in the lower third of the range",
    because:
      "That is what buys a hero with no scrim over the media, which is rule 1 held rather than argued",
  },
  {
    rule: "Three frames show a guest holding a phone up",
    because:
      "Every round-three hero variation wants them, and the many-hands argument lands harder when one frame says it literally",
  },
  {
    rule: "No frame needs a face in focus to work",
    because:
      "The type sits over the left half of the hero, and under rule 1.4 it is what keeps most of the kit clear of the release question",
  },
  {
    rule: "A release signed at the door for every recognisable face",
    because:
      "No free tier supplies one, which is the whole reason the licensed batch is 20 frames of backs, hands and silhouettes",
  },
];

const MASTER_BY_ID = new Map(
  MASTERS.flatMap((m) => m.replaces.map((id) => [id, m] as const)),
);

/** The master frame that inherits a manifest id, for the Ours column. */
export function masterFor(id: string): Master | undefined {
  return MASTER_BY_ID.get(id);
}

const MASTER_BY_CODE = new Map(MASTERS.map((m) => [m.code, m]));

/** A master by its sheet code. Throws on an unknown one, so a typo fails a test. */
export function master(code: string): Master {
  const m = MASTER_BY_CODE.get(code);
  if (!m) throw new Error(`Unknown master frame: ${code}`);
  return m;
}
