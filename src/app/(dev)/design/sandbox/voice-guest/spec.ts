import { defineExploration } from "@/components/lab/exploration";

/**
 * THE VOICE OF THE GUEST JOURNEY, ROUND TWO (2026-09-28).
 *
 * Round one's answers (docs/reviews/voice-guest.json): `welcome=today`,
 * `ask=warm`, `landed=today`, `failed=exact`, `empty=warm`. Those five leave
 * the asks and stand as he took them; none of their lines sits on a screen
 * this round draws, so none is redrawn. Two came back unclear, and his notes
 * are this round's direction:
 *
 *  - `waiting=?`: "Is this not being handled separately in a queue from a past
 *    selection?" Partly: guest-capture's tracker (`tracker=button`) lists her
 *    held photos in the same words, but the album still shows them as dim
 *    tiles at its head, and a refused one keeps saying Waiting there until her
 *    visit ends, because the album's sync moves only in and out of approved.
 *    With his `landed` note ("not a fan of adding notices within the media
 *    cards ... notify the user where they are without real interruption, if we
 *    even need to notify them at all"), that becomes `held`: WHERE a held photo
 *    shows, which also decides what a refused one does there.
 *  - `keep=?`: "Want to ensure this is not a repeat question." It is not:
 *    guest-capture r1 settled when the keep asks and its shape (the door's last
 *    screen) and identity-door r3 its look; its words were never asked, and
 *    round one drew them on the retired card. So `keep` is round one's
 *    registers redrawn where the ask ships (`KeepOffer`).
 *
 * ★ `status` FOLDS IN host-curation's `told=line` NOTE (that ledger leaves with
 * its board: `git show e199f43f:docs/reviews/host-curation.json`): "maybe we
 * can be more clear than 'Not in the album', because a guest may not
 * immediately understand why not. 'Rejected' seems harsh ... Can you think of
 * better language there? Or could we handle differently in the uploads
 * queue?" So its options are better words AND one different handling (a
 * section of its own with one sentence of why), and the registers differ in
 * what they say (where, who, which rule), not in costume.
 *
 * ★ THE FORM IS HIS, FROM THE LAST VOICE BOARDS: "tighter comparisons of copy
 * in real cases, one at a time". Every option is drawn in its real place on a
 * 375 phone: the album as it ships today, her uploads where `popups`'
 * `lists=panel` opens a list (the whole screen under a back arrow in a hand),
 * the door's held sheet. `held` draws each option as a whole strategy over
 * time (the moment, later, her uploads), `identity-claims` r3's shape.
 *
 * ★ WHAT THE STANDING BOARDS ASK, THIS ONE DOES NOT: which moments may mail a
 * guest (`emails.guest`, where `flow-refresh` merges two more mail questions),
 * whether a refusal is told at all (host-curation settled `told=line`), when
 * the keep asks and its shape (guest-capture), its look (identity-door).
 *
 * All three are roots: each holds the other two at today's words and moves
 * only its own, so he can take them in any order.
 */
export const VOICE_GUEST = defineExploration({
  id: "voice-guest",
  title: "The voice of the guest journey",
  round: {
    n: 2,
    date: "2026-09-28",
    changed:
      "Three questions from your round one notes: where a held photo shows to the guest who sent it, what her uploads call one the host is deciding on and one left out (host-curation's told note folded in), and the keep's words redrawn on the door's last screen.",
  },
  history: [
    {
      n: 1,
      date: "2026-09-24",
      changed:
        "Seven lines in five registers. You took today's welcome, the warm password ask, today's silent landing, the exact failure sheet and the warm empty button; a held photo came back asking about the queue, and the keep asking whether it was a repeat.",
    },
  ],
  context:
    "Round two, from your round one notes. Priya at Maya and Jay's wedding, signed out under the name she typed, every frame a 375 phone in the album as it ships today, her uploads opening where popups put a list: their own screen under a back arrow. Held and status imagine the wedding holding uploads for Maya's review; keep meets it open, where her 6 have just gone in. Round one's five picks left the asks and stand as you took them.",
  carried: [
    {
      id: "world",
      question: "Who and where are the lines read?",
      taken:
        "Priya at Maya and Jay's wedding, signed out under her typed name; held and status imagine uploads held for Maya's review, keep the wedding open.",
      overrule:
        "Nothing turns on the names: they are the desk's own, so the page is familiar by the time a line is judged.",
    },
    {
      id: "refusal-read",
      question: "When does her badge stop counting a photo Maya left out?",
      taken:
        "When her uploads re-read her rows: at each opening, as today, and also when one of hers arrives in the album, since a host decides a pick in one go.",
      overrule:
        "If her next look is soon enough, only an opening re-reads; if it must be live, her rows join the album's poll.",
    },
    {
      id: "host-name",
      question: "Do her uploads name the host?",
      taken:
        'No: "the host", as the list\'s own line and the upload area say it. Your round one picks twice took the line without her name.',
      overrule:
        'If a name reads warmer, "Waiting for Maya" and "Maya didn\'t add this one" swap in at the wiring.',
    },
    {
      id: "keep-confirm",
      question:
        "Does the screen Confirm your email opens take the ask's words?",
      taken:
        "No: it wears the account door's keep wear, which the Unverified mark and her name menu open before any upload, so it promises her photos first.",
      overrule:
        "If the keep's two screens should read as one, its confirm screen heads with the ask's own title and line.",
    },
  ],
  asks: [
    {
      id: "held",
      label: "Where a held photo shows",
      question:
        "When the host reviews uploads, where should a photo still waiting show to the guest who sent it?",
      context:
        "Priya just sent 2 to Maya's held wedding. Each option is drawn three ways: the moment they go, later once Maya has let one in and left one out, and her uploads opened as their own screen. Your note: no notices inside media cards.",
      options: [
        {
          id: "tiles",
          label: "At the album's head, as today",
          means:
            "Each waits dimmed under a clock until Maya lets it in or the visit ends. One left out keeps saying Waiting there, and the badge counts it until she looks.",
        },
        {
          id: "uploads",
          label: "Only in her uploads, the badge counting",
          means:
            "Nothing of hers stands in the album until Maya lets it in. The badge beside Add photos counts what waits; one left out is told only in her uploads.",
        },
        {
          id: "line",
          label: "One line at the album's head",
          means:
            "Where her tiles stood, one quiet line in the Yours filter's grammar opens her uploads and goes when nothing waits. One left out is told only there.",
        },
        {
          id: "toast",
          label: "A toast as they go, then her uploads",
          means:
            "One toast in the keep's own Sent words as the stack finishes, then the badge counts. One left out is told only in her uploads.",
        },
      ],
      today: "tiles",
      recommended: "uploads",
      because:
        "Your notes asked for no notices inside media cards, a word only where she is if at all, and pointed at the queue you picked. The badge sits on the Add she just pressed and rides the dock as she scrolls, and the album shows only what is in it.",
      overrule:
        "If her photos leaving the album's head reads as a failure, the line keeps a word where the stack was, and opens the same list.",
      lands:
        "The album's head on a held event, whether the waiting tile stays, and where a guest learns one of hers was left out.",
      tile: "phone",
    },
    {
      id: "status",
      label: "Her uploads' words",
      question:
        "In her uploads, what should a photo the host is still deciding on say, and one the host left out?",
      context:
        'Later that evening Priya opens her uploads: 1 still with Maya, 2 in the album, 1 Maya left out. Your host-curation note: clearer than "Not in the album" without "Rejected"\'s edge. One option gives a left-out photo its own section.',
      options: [
        {
          id: "today",
          label: 'As shipped: "Not in the album"',
          means:
            'Says where it is and never why, so it can read as an upload of hers that failed. Waiting reads "Waiting for the host".',
        },
        {
          id: "host",
          label: 'Plain: "The host didn\'t add this one"',
          means:
            "Waiting keeps its one name on the page; the left-out line says who decided, in the words a friend would use, and passes no verdict on the photo.",
        },
        {
          id: "approval",
          label: 'Exact: "Waiting for approval", "Not approved"',
          means:
            "Both lines name the review she read about when she sent them, so the why is the event's rule rather than a person's choice.",
        },
        {
          id: "apart",
          label: "Left out in a section of its own",
          means:
            'Rows keep today\'s words; a left-out photo moves to the foot under "Not added to the album" with one sentence of why, said once.',
        },
      ],
      today: "today",
      recommended: "host",
      because:
        "It says why in five words: the host chose what went into the host's album, a curation rather than a verdict on her photo. The waiting line keeps its one name on the page, and the list stays one row a photo, the way it scans.",
      overrule:
        "If a left-out photo deserves its reason in a whole sentence, its own section says it once, at the list's foot.",
      lands:
        "Her uploads' two lines, the badge's spoken count, the keep's Sent line on a held event, and the marketing mock that quotes it.",
      tile: "phone",
    },
    {
      id: "keep",
      label: "Keeping it",
      question:
        "On the door's last screen, after her photos are sent, what should the ask to confirm her email say?",
      context:
        "Not a repeat: guest-capture settled when it asks and its shape, identity-door its look; its words were never asked on this screen. Priya's 6 just joined Maya's album. Only the ask's title and line change, in round one's registers.",
      options: [
        {
          id: "today",
          label: 'As shipped: "Keep these photos"',
          means:
            "The photos first and the event as an aside, counted again under a Sent line that has just counted them.",
        },
        {
          id: "warm",
          label: 'Plain and warm: "Keep this event"',
          means:
            'The event first, and the future your 22 September note asked for: "to come back to anytime".',
        },
        {
          id: "bright",
          label: 'Bright: "Take it with you"',
          means:
            "The event goes where she goes, her photos and the whole album with it.",
        },
        {
          id: "exact",
          label: 'Quiet and exact: "Keep your 6 photos"',
          means: "One sentence of what confirming does, and nothing more.",
        },
        {
          id: "tender",
          label: 'Soft and tender: "Hold onto today"',
          means: "The day, not just the photos, is what she is keeping.",
        },
      ],
      today: "today",
      recommended: "warm",
      because:
        'Your 22 September note: the capture after upload "should incentivize the email to save the event under the account for the future". This says exactly that, the event first and to come back to anytime, and the Sent line above it has already counted her photos.',
      overrule:
        "If the photos she just sent pull harder at this moment than the event, today's title keeps them first.",
      lands:
        "The keep's ask on the door's last screen. The account door's keep wear, which opens before an upload too, stays as it is.",
      tile: "phone",
    },
  ],
});
