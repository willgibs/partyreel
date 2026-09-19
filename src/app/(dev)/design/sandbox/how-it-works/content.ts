/**
 * THE LOOP'S CONTENT, AT THREE DEPTHS: the same six-moment story, told as this
 * page tells it today (six two-sided steps), as the help article tells it
 * (five, one column), and as the home's teaser tells it (three). THE STEPS
 * decision holds one moment vocabulary steady (`PictureMoment`, in
 * `picture-treatments.tsx`) and swaps the step COUNT; THE PICTURES decision
 * holds the count at six (today's) and swaps the treatment. Every body below
 * is a real quote (spine.tsx, the help article, or the home's film strip),
 * never invented, EXCEPT six's own step one: the shipped copy claims the event
 * "is live the moment you create it," and `create-event-wizard.tsx` creates the
 * row once, at commit, at the END of the design step. Every option here says
 * that truthfully instead (docs/tracks/how-it-works.md, "the step-count trap").
 */

export type StepSide = "Host" | "Guest" | "Both" | "Everyone" | "The payoff";

/** The six moments a step's picture can depict, independent of which step
 *  count is telling the story (five folds review+export+reel differently than
 *  six does, three folds everything into Scan/Upload/Done). */
export type PictureMoment = "create" | "scan" | "fill" | "review" | "export" | "reel";

export type StepDatum = {
  /** Stable across step counts where the same real moment recurs. */
  id: string;
  side: StepSide;
  title: string;
  body: string;
  picture: PictureMoment;
};

/** SIX, two-sided, as today (spine.tsx) — step one corrected. */
export const SIX_STEPS: readonly StepDatum[] = [
  {
    id: "create",
    side: "Host",
    title: "Create the event",
    body: "Name it, then style the QR code to match the invite. Finishing that step is what creates the event: live immediately, with one permanent link to share.",
    picture: "create",
  },
  {
    id: "scan",
    side: "Guest",
    title: "Scan and you're in",
    body: "Guests point a camera at the code and land on a welcome screen, with no app and no account. When you require accounts, they confirm their email with a one-time code and they're in.",
    picture: "scan",
  },
  {
    id: "fill",
    side: "Both",
    title: "The album fills live",
    body: "Uploads land in the album as they're taken, from every phone in the room. Watch it fill from the head table while the event is still going.",
    picture: "fill",
  },
  {
    id: "shape",
    side: "Host",
    title: "Shape it",
    body: "Turn on review and new uploads wait for your approval, or let everything appear live and tidy up afterward. Approve the lot in one tap, hide anything with another.",
    picture: "review",
  },
  {
    id: "browse",
    side: "Everyone",
    title: "Browse, save, download",
    body: "The album is one link, and everything comes back out at the quality it went in. Save a favorite, or download the whole album as a single zip.",
    picture: "export",
  },
  {
    id: "reel",
    side: "The payoff",
    title: "The reel",
    body: "One tap on Create reel and the event cuts itself into a highlight video. Pick a style from the catalog and render it free, right on your phone.",
    picture: "reel",
  },
];

/** FIVE, matching the help article's own <Steps> (content/help/how-partyreel-works.mdx). */
export const FIVE_STEPS: readonly StepDatum[] = [
  {
    id: "create",
    side: "Host",
    title: "Create an event, get a QR code",
    body: "Name your event and pick a QR style: about a minute, and the free plan covers a whole first event at no cost. Finishing gives the event one permanent link, and the QR code is that link in scannable form.",
    picture: "create",
  },
  {
    id: "scan",
    side: "Guest",
    title: "Guests scan and upload",
    body: "A guest points their phone camera at the code, taps Add photos, and uploads at full quality straight from the camera roll. Nothing to install, nothing to sign up for beyond a quick email check if you ask for one.",
    picture: "scan",
  },
  {
    id: "fill",
    side: "Both",
    title: "Everything lands in one live album",
    body: "Uploads appear in the gallery within seconds, for you and for every guest looking at it. Watch it fill up on your own phone, or put it on a screen in the room.",
    picture: "fill",
  },
  {
    id: "curate",
    side: "Host",
    title: "You curate",
    body: "Hide anything that shouldn't be there, remove anything that really shouldn't, or turn on Review so nothing shows until you've approved it. Everything is reversible for a while after.",
    picture: "review",
  },
  {
    id: "share",
    side: "Everyone",
    title: "Share it, download it, cut the reel",
    body: "The same link that collected the photos is the album you share afterward. Anyone who can open it can download originals, and Partyreel turns the best moments into a short highlight reel, free on every plan.",
    picture: "export",
  },
];

/** THREE, matching the home's film strip (film-strip.tsx's SCENES, verbatim). */
export const THREE_STEPS: readonly StepDatum[] = [
  {
    id: "scan",
    side: "Guest",
    title: "Scan",
    body: "Guests point their camera at one QR code and they're in. No app, no account.",
    picture: "scan",
  },
  {
    id: "upload",
    side: "Both",
    title: "Upload",
    body: "Photos and videos land in your album live, from every phone in the room.",
    picture: "fill",
  },
  {
    id: "done",
    side: "Everyone",
    title: "Done",
    body: "The whole event in one place, ready to curate and share.",
    picture: "export",
  },
];

/** The one fixture event every preview on this board quotes (step-frames.tsx's own). */
export const EVENT_NAME = "Maya & Jay's Wedding";
export const EVENT_URL_LABEL = "partyreel.com/a/maya-and-jay";

/** A representative slice of the site's 12-image manifest, reused across
 *  previews so the board never invents its own media. */
export const ALBUM_TILE_IDS = [
  "wedding-golden",
  "party-balloons",
  "reception-table",
  "festival-crowd",
  "wedding-toast",
  "party-dj",
] as const;
