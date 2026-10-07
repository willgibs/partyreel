import { defineExploration } from "@/components/lab/exploration";

import { DESK, GROUND, SCREEN } from "./knobs";

/**
 * THE ALBUM AFTER ITS PARTY, ROUND ONE (the after-party-r1 track, cut
 * 2026-10-07 from the gap audit, app-gaps-r1's gap 7, its highest design gap:
 * "after the party nothing changes"). The album at `/e/[token]` reads the
 * morning after and a week on as it did at the party, Add its hero; its card
 * draws its name alone; the host meets no recap; a guest's Start for free
 * leads to the home page. crumbs-87 made the link's words follow uploads
 * (`card/words.ts`), the one piece built.
 *
 * ★ THE RULES ARE THE FRAME, NEVER ASKED: events never expire and nothing
 * depends on a timeline, so the album's phase is read from her act (closing
 * adding, or a wrap of its own), and a date may only offer it, never switch
 * it (the carried `date` says so where he can overrule it); a card carries
 * photographs only where anyone with the link sees the album whole, never a
 * Private album's, a hidden or waiting photo, or a face; no email or push is
 * assumed (X11), so every moment is met in the app.
 *
 * ★ FIVE ASKS, THE MODEL FIRST: what tells the album its party is over (every
 * other frame waits on it); what a returning guest meets (drawn in that
 * answer: Add gone or receded); the card every shared link wears; where the
 * host meets her morning after; where a guest who wants her own party is
 * taken. The anniversary is carried (it waits on the recap's home), and so
 * are a card's faces, an email recap and the date's switch.
 *
 * ★ EVERY FRAME IS PRODUCTION'S SURFACE: the guest's cover, bar, rows, Guests
 * and dock, the hub's cover, doors, light and album, the dashboard's stage,
 * the card route's own markup and Create's room are production's components
 * or their markup recomposed where an option needs a slot; an option draws
 * only what differs, in today's tokens (brand-marks r1 and signature r1 ask
 * the marks and where the light lives; nothing here asks them again).
 */
export const AFTER_PARTY = defineExploration({
  id: "after-party",
  title: "The album after its party",
  surface: "shared",
  desk: 12,
  lives: [
    "docs/systems/guest-flow.md",
    "docs/systems/host-app.md",
    "src/app/(guest)/e/[token]/page.tsx",
    "src/app/(guest)/e/[token]/card/route.tsx",
    "src/app/(guest)/e/[token]/card/words.ts",
    "src/components/guest/event-experience.tsx",
    "src/components/guest/event-experience-head.tsx",
    "src/components/guest/guest-header.tsx",
    "src/components/app/event-feed/event-hub-head.tsx",
    "src/components/app/event-feed/checklist.tsx",
    "src/components/app/dashboard/stage.tsx",
    "src/components/app/create-event-wizard.tsx",
    "content/help/share-the-album-after-the-event.mdx",
  ],
  round: {
    n: 1,
    date: "2026-10-07",
    changed:
      "A new board from the gap audit's first design gap: what an album becomes once its party is over, for a guest who comes back, for whoever its link reaches, and for Maya the morning after.",
  },
  opening: {
    about:
      "What an album becomes after its party: for a guest who comes back, whoever it's shared with, Maya the morning after, and a guest who wants a party of her own.",
    settled: [
      "Events never expire: a date only says when a party happens, so no date turns an album by itself; it may only offer a step she takes.",
      "A card shows photographs only where anyone with the link sees the whole album: never a Private one's, a hidden or waiting photo, or the guest row's faces.",
      "No email or push is assumed (your X11 call): every moment here is met in the app.",
      "Aperture: colour from the photographs, then the party's seed, then the house; one light to a screen, still until something happens.",
      "The morning after, the album already reads in the order the day happened (your customize pick); every frame here keeps it.",
    ],
    earlier: [
      "Customize r1: 'it would feel weird to scroll backwards through time if we have a good idea of when the event is over to flip.'",
      "The wait r1: you liked a premiere 'to open with the reel idea clearly', with an easy skip.",
      "Drive export r1: 'Just streamlining offramping media so they don't feel locked in', never a one-click delete.",
      "Desk 4: 'not like a junior designer was told to build a rainbow app. We are world-class tastemakers.'",
    ],
  },
  terms: [
    {
      term: "keepsake",
      means:
        "The album once its party is over: the same link and photos, read as something to keep rather than a party to join.",
    },
    {
      term: "wrap",
      means:
        "Her own press that tells the album its party is over, apart from closing adding.",
    },
    {
      term: "recap",
      means:
        "What her party made, said to her the morning after: its numbers, and what to do with them.",
    },
    {
      term: "card",
      means:
        "The picture a pasted link unfolds into in a chat, above the link's title and line, which stay as they are.",
    },
    {
      term: "morning after",
      means:
        "9 am the day after a dated party's last day, in its own time zone: when the album already turns its order.",
    },
  ],
  carried: [
    {
      id: "faces",
      question:
        "Does a card ever carry the guest row, each guest's own picture?",
      taken:
        "Never, whatever the door: the guest row stays inside the album, and a card carries only the album's own photographs, where its door allows.",
      overrule: "An open album's card shows its guest row beside its name.",
    },
    {
      id: "email",
      question: "Does anyone hear of the morning after outside the app?",
      taken:
        "No one: the recap and the keepsake are met in the app; mailing Maya her recap waits on your X11 call.",
      overrule:
        "Mail Maya her recap the morning after, once X11 lets a host hear of her party's moments.",
    },
    {
      id: "anniversary",
      question: "Does anything mark the album's first anniversary?",
      taken:
        "Not this round: a year on is the recap's own later moment, drawn once you pick where the recap lives.",
      overrule: "Draw the anniversary now, beside the recap.",
    },
  ],
  asks: [
    {
      id: "over",
      label: "When it's over",
      question: "What should tell Maya's album that her party is over?",
      where: ["Host", "Her event's hub", "The days after"],
      when: "Maya & Jay married on Saturday; by Wednesday the photos have stopped, and the album still asks everyone to add theirs.",
      matters:
        "Every keepsake moment waits on it: until the album knows, its link and its card keep asking for photos.",
      lands:
        "What turns an album from its party into its keepsake, and how she is offered it: her own press, never a date alone.",
      context:
        "Maya's hub at a laptop or her phone (her screen): Sunday, the morning after; Wednesday, once the photos stop; the moment she presses (today, where the switch waits in Settings); and her guests' cover a week on, Add as each answer leaves it.",
      options: [
        {
          id: "switch",
          label: "As today: she closes adding in Settings",
          means:
            "The album turns keepsake only once she finds Settings, What guests can add, and turns Accepting uploads off, as help tells her; nothing in the app offers it.",
          gains: "Built, and nothing happens that she didn't choose.",
          costs:
            "Few hosts ever find it, so most albums keep asking for photos for good.",
        },
        {
          id: "offer",
          label: "Close adding, offered once the photos stop",
          means:
            "Two days after its last photo, dated or not, her hub offers Close adding beside what the party made; she closes it, or keeps it open.",
          gains:
            "One press, offered when it's true, and no date switches anything.",
          costs:
            "Add goes until she reopens it: a camera roll found next month has nowhere to go.",
        },
        {
          id: "wrap",
          label: "Her wrap the morning after, with Add still open",
          means:
            "The morning after, her hub offers Wrap the party (an undated party wraps any time): the album turns keepsake, and Add recedes to a quiet line for late photos.",
          gains: "The keepsake arrives while the late photos still can.",
          costs:
            "A new state and word to learn, and Add stops leading while the last camera rolls still come in.",
        },
      ],
      recommended: "offer",
      today: "switch",
      because:
        "Sunday is still for adding (28 more came that week), so the keepsake is offered once the photos stop, on the one switch she already has.",
      overrule:
        "If the keepsake should greet the morning-after shares, her wrap, with Add receded to a quiet line for late photos.",
      configs: [DESK],
    },
    {
      id: "recap",
      label: "Her morning after",
      question:
        "The morning after, where should Maya meet what her party made?",
      where: ["Host", "The morning after", "Her home and her hub"],
      when: "Sunday at 9: the party was last night, and Maya opens Partyreel with her coffee; 186 photos and videos from 39 guests.",
      matters:
        "It's the host's payoff, where Partyreel earns her next party: what she meets decides whether she shares it.",
      lands:
        "Where a host's morning-after recap stands and what it offers: Share the album, Make a clip, Download all.",
      context:
        "Maya at a laptop or her phone (her screen), on paper or in the room (Ground), Sunday at 9 in your first answer: her home's stage and her hub, each as the answer draws it, and for the cover, where its code goes.",
      options: [
        {
          id: "stage",
          label: "As today: 'Yesterday' on her home's stage",
          means:
            "Her home's stage says Yesterday with the album's numbers, Share the album and Open; her hub reads as it did at the party.",
          gains: "Built: her home already turns to the party just past.",
          costs:
            "Her hub, where she ran the party, says nothing of what it made.",
        },
        {
          id: "hub",
          label: "A recap heading her hub",
          means:
            "Where the checklist stood, a plate under her cover, lit by the cover's own light: 'Your party made 186', its three acts and a quiet Put away.",
          gains: "The payoff on the page she opens most, each act one press.",
          costs:
            "One more block above her album, until she shares it or puts it away.",
        },
        {
          id: "cover",
          label: "Her hub's cover turns to the recap",
          means:
            "Under her cover's name, 'Your party made 186' and what it made; Share the album, Make a clip and Download all stand where the code stood.",
          gains: "No new block: the cover she knows becomes the payoff.",
          costs:
            "The code steps off the cover into Share the album: a press further for a late guest.",
        },
        {
          id: "home",
          label: "Her home's stage, made the recap",
          means:
            "Her home's stage shows nine of the night's photos and 'Your party made 186', with Share the album, Make a clip and Download all.",
          gains:
            "Met the moment she opens Partyreel, before she picks an event.",
          costs:
            "A host who goes straight to her event (an open tab, its link) never sees it.",
        },
      ],
      recommended: "home",
      today: "stage",
      because:
        "She comes back through her home, whose stage already turns to the party: made the recap there, it's met first, with no new block to put away.",
      overrule:
        "If the hub where she ran the party should say it (last night's open tab), the plate under her cover; if nothing new, the cover turns.",
      after: { ask: "over" },
      configs: [DESK, GROUND],
    },
    {
      id: "keepsake",
      label: "The album, after",
      question:
        "When a guest comes back to the album after its party, what should lead?",
      where: ["Guest", "Maya & Jay's album", "A week on"],
      when: "Priya taps the group chat's link a week on: the album holds 214, nine of them hers, and its party is over.",
      matters:
        "It's the album's longest life: every visit after the party, and everyone it's shared with, starts here.",
      lands:
        "What a keepsake album's cover leads with, where Add goes, and how a guest finds her own photos.",
      context:
        "Maya & Jay's album a week on, at a phone or a laptop (Screen), on paper or in the room (Ground): Priya's first screen, where its second act lands, and a newcomer who added nothing; Add as your first answer leaves it.",
      options: [
        {
          id: "closed",
          label: "As today: the album, its Add gone",
          means:
            "The live cover without Add (the reel's round, Invite), and one line under it: 'The host has closed uploads. You can still browse the album.'",
          gains: "Built, and the album looks just as she remembers it.",
          costs:
            "It reads as a party with its door shut: a notice where a keepsake should be.",
        },
        {
          id: "reel",
          label: "The reel leads: Watch the party",
          means:
            "The cover's one white act is Watch the party, the reel from its first photo; a round beside it, Take them home, opens Select, then Save.",
          gains:
            "The party relived in one press: the reel is a keepsake's best minute.",
          costs: "A guest who came back for one photo is offered a film first.",
        },
        {
          id: "hers",
          label: "Her own photos lead",
          means:
            "Under the name, three of her photos overlap beside 'Yours \u00b7 9', opening her nine; the cover's button is Take yours home.",
          gains: "The first thing she meets is her own part in the party.",
          costs:
            "A newcomer has none, so the reel leads for her instead: the cover takes two shapes.",
        },
        {
          id: "still",
          label: "A still title page",
          means:
            "The cover holds one photograph as a title page: its day in full over the name, a hairline, '214 photos and videos from 41 guests', and no buttons on it.",
          gains: "It reads as a finished thing, still until something happens.",
          costs:
            "The cover's movement goes, and nothing on it leads her on: the reel waits in the dock.",
        },
      ],
      recommended: "reel",
      today: "closed",
      because:
        "The reel is the party relived in one press for every guest, new or not, and taking photos home is one round beside it.",
      overrule:
        "If the keepsake should feel finished and quiet, the still title page; if personal, her own photos (the reel still leads for a newcomer).",
      after: { ask: "over" },
      configs: [SCREEN, GROUND],
    },
    {
      id: "card",
      label: "Its card in a chat",
      question:
        "When the album's link is pasted into a chat, what should its card show?",
      where: ["Shared", "A pasted link", "In a group chat"],
      when: "The morning after, Maya pastes the album into the family chat; a week on, Priya sends it to a friend who wasn't there.",
      matters:
        "The card is the album's first sight for everyone who wasn't there, and every shared album invites the next party.",
      lands:
        "The one card family every shared link wears: the album while it takes photos and as its keepsake, one photo, a gated album.",
      context:
        "Two chats at a phone: the family's the morning after (the album, one photo's link) and a friend's a week on, in dark mode; each card at its true size, live and kept; a password album's card beside a Private one's.",
      options: [
        {
          id: "name",
          label: "As today: its name on a dark card",
          means:
            "Partyreel's mark, the album's name and one line (Add your photos, or See the photos); every album alike; a photo's link is that photo.",
          gains:
            "Built, and private by construction: nothing of the album leaves.",
          costs:
            "Every album looks alike in the chat, and nothing shows it holds photos.",
        },
        {
          id: "cover",
          label: "Its cover photograph, the name on it",
          means:
            "The cover's own photograph edge to edge and the name over its foot, as the album's cover sets it; a gated album's card is its name alone.",
          gains:
            "The card is the album's cover: the same first sight in the chat as on arrival.",
          costs:
            "One photo speaks for the party, and one she hides later stays in chats it was pasted into.",
        },
        {
          id: "strip",
          label: "A strip of its photographs",
          means:
            "Four of its photographs side by side over its name, on the room's dark; a gated album's card is its name alone.",
          gains: "A whole album at a glance: many moments, many people.",
          costs:
            "Small pictures at a chat's size, and four photos leave with every paste.",
        },
        {
          id: "light",
          label: "Its light, never a photograph",
          means:
            "The name in the album's own light, read from its photographs as a Bloom behind it, and no picture; a password album wears its light too.",
          gains:
            "Its own light, read from its photographs, and its card never carries one.",
          costs:
            "No picture of the party, and warm parties light alike: gold to coral, near the house's own.",
        },
      ],
      recommended: "cover",
      today: "name",
      because:
        "One photograph reads at a chat's size where four can't, and the card becomes the album's cover: the same first sight in the chat as on arrival.",
      overrule:
        "If no photograph should leave an album, its light; if a card should show many moments, the strip.",
    },
    {
      id: "bridge",
      label: "Her own party",
      question:
        "When a guest wants a party of her own, how should Maya's album show her the way?",
      where: ["Guest", "Maya & Jay's album", "Signed out"],
      when: "Priya, signed out, has spent ten minutes in the album and has a birthday next month.",
      matters:
        "A guest becoming a host is how Partyreel grows, and today her one way in leaves the album for the home page.",
      lands:
        "Where a signed-out guest's way to her own album stands, and where it leads: the home page, or Create in this album's style.",
      context:
        "Maya & Jay's album at a phone, signed out, as your keepsake answer draws it: its corner and its end, then where the way leads: the home page as it is, or Create in this album's style once she signs up.",
      options: [
        {
          id: "home",
          label: "As today: Start for free, to the home page",
          means:
            "The header's quiet Start for free leads to the home page, where she learns what Partyreel is and starts from nothing.",
          gains: "Built, and quiet: the album stays Maya's, never an ad.",
          costs:
            "She leaves her delight for a page about Partyreel, and starts over.",
        },
        {
          id: "header",
          label: "The same corner, into Create in this style",
          means:
            "The header's quiet link says Make one like this; after she signs up, Create opens with the style and the code's look answered: only her name is asked.",
          gains:
            "Straight from delight to her own party: after sign-up, Create asks only her name.",
          costs: "Still a quiet corner of the header, easy to miss.",
        },
        {
          id: "end",
          label: "The corner, and a line at the album's end",
          means:
            "The corner says Make one like this, and past the last photo, before Guests, one quiet line: 'Your party next? Make one like this', into the same Create.",
          gains:
            "Met when she's finished looking, by every guest, signed in or not.",
          costs:
            "A line of Partyreel's own on Maya's album; many guests never reach its end.",
        },
      ],
      recommended: "header",
      today: "home",
      because:
        "The way stays the album's one quiet corner, as little Partyreel as possible, and now starts her party in the style she loved.",
      overrule:
        "If more guests should meet it once they're done looking, the line at the album's end as well.",
      after: { ask: "keepsake" },
      configs: [SCREEN],
    },
  ],
});
