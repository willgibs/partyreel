import { defineExploration } from "@/components/lab/exploration";

/**
 * THE VOICE OF THE GUEST JOURNEY, ROUND ONE (2026-09-23).
 *
 * A NEW BOARD ON HIS WORD (2026-09-22, verbatim): "Still need to nail our
 * voice in the lab, across all main and micro copy." Asked where the first
 * voice board should start, he picked the guest journey: the door, the name
 * step, the upload, the errors and the capture, the most-read micro copy and
 * where most asks live. A catalog, lab-only, no production byte.
 *
 * ★ THE FORM IS HIS, FROM THE LAST TWO VOICE BOARDS. He killed the first for
 * forcing each option into "a very specific tone so it felt differentiated for
 * the sake of the exploration", and asked instead for "tighter comparisons of
 * copy in real cases, one at a time", building the voice from the winners. So
 * every decision here is ONE real line in its real place (the phone, the
 * sheet, the tile it ships on), and bible 21 says why: "the voice is built one
 * won line at a time, in its real place".
 *
 * ★ THE REGISTERS ARE THE SAME FOUR KEYS ON EVERY DECISION: `today` (the
 * shipped words), `warm` (plain and warm), `bright` (bright and playful),
 * `exact` (quiet and exact), the three the brief asks the candidates to span.
 * Each is written for its place rather than as a costume, and each option's
 * `means` ends with what the same register sounds like on another of these
 * lines, so a pick carries. His answers then read as a voice at a glance
 * (welcome=bright, failed=warm, ...), and the voice is whatever they share.
 *
 * ★ THE GUIDANCE HIS WORDS BECAME BINDS EVERY CANDIDATE (`guidance.md`): "An
 * ask says what it gives, where that comes naturally ... where a benefit
 * would be forced, the line is natural or at least neutral, never worded as a
 * rule or in regulatory language. The first welcome reads fun, safe, easy and
 * quick." Lines he ruled verbatim stay verbatim and are never re-asked: "No
 * app required." rides every welcome, "The album starts with you" heads the
 * empty album, the name step's lede and the verified gate's line are not
 * drawn at all, and "Almost in" keeps the password step's eyebrow.
 *
 * ★ WHAT THE STANDING BOARDS ASK, THIS ONE DOES NOT, and each context names
 * its neighbour: `identity-door` (the field, the member nudge, the verified
 * gate's framing, the menu, undoing an email), `guest-capture` (when the
 * capture asks, its shape, whom to follow, the name), `identity-claims`
 * (`pointer`, `after`), `export-flow`, `emails.guest`, `reel-front`'s tile
 * lines and small states, `reel-view`'s chrome, the copy of `reel-cut` and
 * `reel-screen`, and `host-curation.told` (whether a refused photo is ever
 * told, which `waiting`'s line only has to stay true beside).
 *
 * All seven are roots: each holds the other six at today's words and moves
 * only its own line, so he can take them in any order.
 */
export const VOICE_GUEST = defineExploration({
  id: "voice-guest",
  title: "The voice of the guest journey",
  round: {
    n: 1,
    date: "2026-09-24",
    changed:
      "The desk re-cut: waiting and landed now name guest-capture's tracker and reel-front's toast as neighbours; landed's overrule drops the rejected \"Yours is in it\" badge. No line changed.",
  },
  context:
    "Will, 2026-09-22: \"Still need to nail our voice in the lab, across all main and micro copy.\" The guest journey first: seven lines Priya reads between scanning Maya and Jay's code and keeping her photos, each set where it lives on a 375 phone, today's words beside plain and warm, bright and playful, quiet and exact. The lines he picks build the voice one won line at a time, and each option says what its register sounds like on another of the seven, so a pick carries to the host app's board and marketing's after it.",
  bible: [4, 12, 14, 19, 20, 21, 22],
  carried: [
    {
      id: "world",
      question: "Who and where are the lines read?",
      taken:
        "Priya at Maya and Jay's wedding, identity-door's and guest-capture's own world; Tom, signed in, joins only where a line differs for a member.",
      overrule:
        "Nothing turns on the names. They are the desk's, so the page is familiar by the time a line is judged.",
    },
    {
      id: "phone",
      question: "Is a laptop on a knob beside each phone?",
      taken:
        "No: every line is read on a phone at a party, so each frame is 375 by 812. The desk's panel sets the same lines at a similar measure.",
      overrule:
        "If a line must be read at a desk too, a Screen knob draws the panel posture beside every phone.",
    },
    {
      id: "button",
      question: "Does the capture card's button change with its words?",
      taken:
        "No: it reads \"Confirm your email\" in every option, because the Unverified mark and the name menu open the same door with those words.",
      overrule:
        "If the button should say what it keeps, the three doors change together at the wiring.",
    },
  ],
  asks: [
    {
      id: "welcome",
      label: "The welcome",
      question:
        "What should the welcome say under the event's name, the first words a guest reads after scanning?",
      context:
        "The held sheet a guest meets off the code, 48 photos in. Only the two rows under the name change; \"No app required.\" is ruled, so every option keeps it. A sign-in row on this sheet is identity-door's question.",
      options: [
        {
          id: "today",
          label: "As shipped: \"shots land in one album\"",
          means:
            "Its first row is the voice board's ruled pick, as swept to \"No app required.\"; its second was never asked. Elsewhere: \"Everything else is in Maya's album.\"",
        },
        {
          id: "warm",
          label: "Plain and warm: \"in a few taps\"",
          means:
            "Few taps, and the album is named as Maya's, so it reads as hers. Elsewhere: \"The other 6 are in Maya's album.\"",
        },
        {
          id: "bright",
          label: "Bright: \"Caught something good?\"",
          means:
            "A question to open, Maya's album, and a nudge to close (\"48 got there first\"). Elsewhere: \"All 6 landed.\"",
        },
        {
          id: "exact",
          label: "Quiet and exact: \"One shared album\"",
          means:
            "What to do, then the count, in the fewest words. Nothing to misread and nothing warm. Elsewhere: \"6 added.\"",
        },
      ],
      recommended: "bright",
      today: "today",
      because:
        "His bar for the first welcome is fun, safe, easy and quick. Only this one is fun without losing the rest: the question invites, \"No app required.\" keeps it easy, and Maya's album keeps it hers rather than ours.",
      overrule:
        "If a question at the door reads like a sales line, the warm one keeps every fact, Maya's album included, with no wink.",
      lands:
        "The guest door's first impression, and the register every first-time moment after it can borrow.",
      tile: "phone",
    },
    {
      id: "ask",
      label: "The password's ask",
      question: "When the host has set a password, how should the door ask for it?",
      context:
        "The same wedding with a password set: the door's second step, over the locked page. Only the sentence under the title changes. The verified gate's line is ruled and its framing is identity-door's.",
      options: [
        {
          id: "today",
          label: "As shipped: \"from your invite\"",
          means:
            "Why, then an instruction (\"Enter ... to come in\"). Elsewhere this register says \"Waiting for the host.\"",
        },
        {
          id: "warm",
          label: "Plain and warm: \"One password and you're in\"",
          means:
            "Why, then the cost, in the ruled gate's own cadence (\"One tap and you're in\"). Elsewhere: \"The host sees it first.\"",
        },
        {
          id: "bright",
          label: "Bright: \"Guests only, and that means you\"",
          means:
            "Turns the rule into a welcome and says where the password is. Elsewhere: \"Over to the host.\"",
        },
        {
          id: "exact",
          label: "Quiet and exact: \"the host shared\"",
          means:
            "One instruction and nothing else: neutral, never a rule. Elsewhere: \"Only you see this for now.\"",
        },
      ],
      recommended: "warm",
      today: "today",
      because:
        "The ruled gate line already set how a door asks: whose choice, why, what it costs. The password's line in the same shape makes the two doors one voice, and \"just for the guests\" is a benefit that needs no forcing.",
      overrule:
        "If guests stall hunting for the password, only today's line and the bright one say where it is: on the invite.",
      lands:
        "How every door asks for what it needs: the reason and the cost, or an instruction.",
      tile: "phone",
    },
    {
      id: "landed",
      label: "The landing",
      question:
        "When the last of her photos lands, should the stack tile say so, and in which words?",
      context:
        "Priya sent six. The stack at the album's head counts \"N to go\"; today it leaves as the last lands, with a light. Tom is signed in; his may name his account. Reel-front's toast and guest-capture's tracker are its neighbours.",
      options: [
        {
          id: "today",
          label: "As shipped: no words, one pass of light",
          means:
            "The photograph arriving is the whole reply; a screen reader or reduced motion gets none. Elsewhere this register shows, never says.",
        },
        {
          id: "warm",
          label: "Plain and warm: \"All 6 are in the album\"",
          means:
            "Says it in full and tells Tom where the event went. Two lines on the tile. Elsewhere: \"2 didn't make it.\"",
        },
        {
          id: "bright",
          label: "Bright: \"All 6 landed\"",
          means:
            "The welcome's own verb in one line; Tom hears \"Yours to keep\", the card's promise, kept. Elsewhere: \"Get it started.\"",
        },
        {
          id: "exact",
          label: "Quiet and exact: \"6 added\"",
          means:
            "A count and a verb; Tom's adds \"in your account\". Elsewhere: \"2 of 8 didn't upload.\"",
        },
      ],
      recommended: "bright",
      today: "today",
      because:
        "Words reach the guests the light never does (reduced motion, a screen reader), and this line fits the tile's width in one line, in the verb the welcome already uses for the album. Tom's \"Yours to keep\" is the capture card's offer, already true for him.",
      overrule:
        "If the reel's one-time toast lands in the same second, two lines saying one thing is one too many, and today's silence is right.",
      lands:
        "Whether the guest's main act is answered in words, and whether a member ever hears that uploading saved the event.",
    },
    {
      id: "failed",
      label: "A failed upload",
      question:
        "When some of her photos do not go, what should the sheet say, and its way out?",
      context:
        "Priya sent eight on the venue Wi-Fi and two did not go, so this sheet opens once over the album. Its heading, line and retry button change; each file's own reason (here \"That upload did not finish.\"), Retry and \"Not now\" stay.",
      options: [
        {
          id: "today",
          label: "As shipped: \"2 files did not go\"",
          means:
            "Counts files, reassures with \"Everything else\", retries all. No contractions. Elsewhere: \"Be the first to add a photo.\"",
        },
        {
          id: "warm",
          label: "Plain and warm: \"2 didn't make it\"",
          means:
            "How a friend would say it, counting what is safe, then \"Send them again\". Elsewhere: \"Add the first photo.\"",
        },
        {
          id: "bright",
          label: "Bright: \"2 got stuck on the way\"",
          means:
            "Light at the worst moment: stuck, not failed, then \"Give them another go\". Elsewhere: \"Over to the host.\"",
        },
        {
          id: "exact",
          label: "Quiet and exact: \"2 of 8 didn't upload\"",
          means:
            "The whole run in five words, and \"Retry both\" names exactly what the tap does. Elsewhere: \"Add photos.\"",
        },
      ],
      recommended: "warm",
      today: "today",
      because:
        "A failure at a party needs two things read at a glance: what is safe and what fixes the rest. \"The other 6 are in Maya's album\" answers the first with a number, \"Send them again\" the second in her words, and neither jokes at the worst moment.",
      overrule:
        "If the file names and reasons below are what a guest actually reads, the exact heading carries the count and gets out of their way.",
      lands:
        "The failure sheet, the door's upload step that shows the same list, and the /features/album mock that quotes its heading.",
      tile: "phone",
    },
    {
      id: "empty",
      label: "The empty album's button",
      question: "Under \"The album starts with you\", what should the one button say?",
      context:
        "An album nobody has added to yet, met by a guest who skipped the door's upload step: the ghost river, the ruled heading and one button, since the page's own Add steps aside at zero. Only the button changes.",
      options: [
        {
          id: "today",
          label: "As shipped: \"Be the first to add a photo\"",
          means:
            "Says \"first\" again under a heading that already puts her first. Elsewhere: \"Keep these photos.\"",
        },
        {
          id: "warm",
          label: "Plain and warm: \"Add the first photo\"",
          means:
            "The same invitation in four words: the heading says \"starts\", the button says \"first\". Elsewhere: \"Keep this event.\"",
        },
        {
          id: "bright",
          label: "Bright: \"Get it started\"",
          means:
            "A party verb for the album's first moment, the rare beat bible 12 saves delight for. Elsewhere: \"Take it with you.\"",
        },
        {
          id: "exact",
          label: "Quiet and exact: \"Add photos\"",
          means:
            "The label the album's Add button wears everywhere else, so one act has one name. Elsewhere: \"Keep your 6 photos.\"",
        },
      ],
      recommended: "warm",
      today: "today",
      because:
        "The heading does the inviting, so the button's job is the act. \"Add the first photo\" names the act and the moment in four words without saying the heading's idea back to it.",
      overrule:
        "If one name for one act matters more than the moment, \"Add photos\" is the label the page already uses.",
      lands:
        "The empty album's one action, and whether a first-time act gets words of its own or the everyday label.",
      tile: "phone",
    },
    {
      id: "waiting",
      label: "A held photo",
      question:
        "On a photo the host is holding for review, what should its tile say to the guest who sent it?",
      context:
        "Uploads held for review: Priya's two sit dimmed at the album's head with a clock, on a pane about 150px wide. Whether a refusal is told is host-curation's; guest-capture's tracker may reuse this line inline.",
      options: [
        {
          id: "today",
          label: "As shipped: \"Waiting for the host\"",
          means:
            "Clear, and stale the moment Maya decides: a refused photo keeps waiting. Elsewhere: \"2 files did not go.\"",
        },
        {
          id: "warm",
          label: "Plain and warm: \"The host sees it first\"",
          means:
            "Says why without promising the outcome, and stays true whatever Maya decides. Elsewhere: \"The other 6 are in Maya's album.\"",
        },
        {
          id: "bright",
          label: "Bright: \"Over to the host\"",
          means:
            "A light hand-off in one line, true whatever happens next. Elsewhere: \"Guests only, and that means you.\"",
        },
        {
          id: "exact",
          label: "Quiet and exact: \"Only you see this for now\"",
          means:
            "Why the photo is dim (nobody else sees it yet), with the host left out. Elsewhere: \"Enter the password the host shared with guests.\"",
        },
      ],
      recommended: "warm",
      today: "today",
      because:
        "It tells her the one thing the clock cannot, that Maya looks before the album does, and it is still true after Maya decides, which today's line is not (the silence host-curation.told names).",
      overrule:
        "If the pane must hold one line at 150px, \"Over to the host\" does, and says nearly as much.",
      lands:
        "The held tile's words, and whether a waiting state promises what comes next or only says what is true now.",
      tile: "phone",
    },
    {
      id: "keep",
      label: "Keeping it",
      question:
        "After her first photos land, how should the card ask Priya to confirm her email and keep the event?",
      context:
        "Priya added six under her typed name: the card, then the door it opens (her name menu opens it too, before any upload). Confirming keeps the event and her photos in her account. When and how it asks is guest-capture's.",
      options: [
        {
          id: "today",
          label: "As shipped: \"Keep these photos\"",
          means:
            "The photos first, the event as an aside, in the card and its door, which holds before an upload too. Elsewhere: \"Waiting for the host.\"",
        },
        {
          id: "warm",
          label: "Plain and warm: \"Keep this event\"",
          means:
            "The event first, and the future his note asks for: \"to come back to anytime\". Elsewhere: \"All 6 are in the album.\"",
        },
        {
          id: "bright",
          label: "Bright: \"Take it with you\"",
          means:
            "The event travels with her (\"goes where you go\"), her photos and the whole album with it. Elsewhere: \"All 6 landed.\"",
        },
        {
          id: "exact",
          label: "Quiet and exact: \"Keep your 6 photos\"",
          means:
            "One sentence of what confirming does, and nothing more. Elsewhere: \"6 added.\"",
        },
      ],
      recommended: "warm",
      today: "today",
      because:
        "His note asks the capture to \"incentivize the email to save the event under the account for the future\". This says exactly that, event first and \"to come back to anytime\", with nothing forced and the price, a free account, said last in the door.",
      overrule:
        "If the photos she just added pull harder at this moment than the event, today's heading keeps them first.",
      lands:
        "The capture card and the door's keep words, which the Unverified mark and the name menu open too.",
    },
  ],
});
