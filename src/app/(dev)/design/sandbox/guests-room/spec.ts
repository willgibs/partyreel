import { defineExploration } from "@/components/lab/exploration";

import { SCREEN } from "./knobs";

/**
 * THE GUESTS ROOM AND A PERSON'S CARD (the guests-room-r1 track, cut
 * 2026-10-07 from Will's note on host-moments r1's Let in: "The UI design of
 * how we present this (and guest card items in general) could definitely be
 * polished").
 *
 * Production's room over the hub (`guests-room.tsx`) draws each standing in a
 * shape of its own: At the door's rows wrap their two acts under three lines
 * at a phone, the people in are chips that fold past twelve into one row of
 * faces opening a second panel, Invited is a ledger of every address with a
 * remove on each, and Blocked says Let in twice ("Let in: into the album,
 * now" beside the press). A name opens a thin card (`GuestPeek`): in the room
 * no viewer id is passed, so it never offers Follow, and Open full profile is
 * its loudest press.
 *
 * ★ TWO ASKS, THE SECOND STAGED: how each person reads in the room (three
 * whole rooms, each one grammar for every standing), then the card, drawn
 * opening from a name in the room he picked.
 *
 * ★ NEVER ASKED, SETTLED: Let in is one press (at the door, and for a
 * declined newcomer whose ask stands); a decline is a block; Block is the
 * quiet last line of a look; who is listed is guest-flow.md's one definition
 * (an approved photo makes a guest); Follow and Block are profiles-social.md's.
 *
 * ★ ASKS NOTHING its neighbours ask: what a follow says when it lands
 * (account-moments r2), the hub's row of faces (presence, not yet cut), where
 * the light lives (signature r1); every frame wears today's brand and hub.
 *
 * ★ A CANDIDATE MAY NEED A READ: a guest's photo count and four of their
 * photographs are not on the list today (ROADMAP's look strip); each option
 * that shows one says so in its costs.
 */
export const GUESTS_ROOM = defineExploration({
  id: "guests-room",
  title: "The Guests room and a person's card",
  surface: "host",
  desk: 42,
  lives: [
    "docs/systems/host-app.md",
    "docs/systems/profiles-social.md",
    "src/app/(app)/dashboard/[eventId]/guests/guests-room.tsx",
    "src/app/(app)/dashboard/[eventId]/guests/at-the-door.tsx",
    "src/app/(app)/dashboard/[eventId]/guests/invited-section.tsx",
    "src/components/app/event-blocks/blocked-section.tsx",
    "src/components/social/guest-list.tsx",
    "src/components/social/guest-peek.tsx",
  ],
  tracks: ["guests-room-r1"],
  round: {
    n: 1,
    date: "2026-10-07",
    changed:
      "A new board from your host-moments note: the Guests room's people and a person's card, polished, each drawn whole on the room as wired.",
  },
  context:
    "Maya & Jay's wedding, Saturday at 9:40 pm: the album is Private with Maya's invite list as the door, 31 guests have added photos, 3 wait at the door, 40 addresses are on the list (28 joined) and 2 people are blocked. Every frame is production's room over the hub, at her phone or her laptop (the Screen knob).",
  opening: {
    about:
      "The Guests room's people and a person's card, polished from your note: how each person stands (at the door, in, invited, blocked) and what can be done for them.",
    settled: [
      "Let in is one press, at the door and for someone you declined who is still asking.",
      "A decline is a block: they meet a closed album and can't ask again.",
      "Block stays the quiet last line of a person's card, for the host alone.",
      "A guest is someone with an approved photo here; a person let in who adds nothing is on no list.",
    ],
    earlier: [
      "Host-moments r1, on Let in: 'The UI design of how we present this (and guest card items in general) could definitely be polished.'",
      "Popups r1: a name opens a card beside it at a desk and the sheet in a hand, its photos drawn in it.",
      "Account-moments r1: 'Don't want to overcrowd the row actions.'",
      "Your standing note: attention earned, never yelled; beautiful and inviting, never crowded.",
    ],
  },
  terms: [
    {
      term: "At the door",
      means:
        "People who confirmed an email and asked to come in; each waits on her Let in or Decline.",
    },
    {
      term: "the tally",
      means:
        "The camera's red a count wears when it waits on her, as on the hub's Guests card.",
    },
  ],
  asks: [
    {
      id: "rows",
      label: "Each person, in the room",
      question:
        "How should each person read in the Guests room, wherever they stand?",
      where: ["Host", "The Guests room", "On the night"],
      when: "Maya opens Guests from her hub at 9:40 pm: three people wait at the door, 31 are in, two are blocked.",
      matters:
        "It is where she answers people at her own party: the one who waits should be one glance and one press.",
      lands:
        "Every person row in the Guests room: at the door, in, invited and blocked, and what each one's act looks like.",
      context:
        "Three frames down the room: opened, scrolled to the invite list, and its foot. Each option is a whole room in one grammar; a name opens today's card.",
      options: [
        {
          id: "today",
          label: "As today: four shapes",
          means:
            "Door rows with their acts under three lines, the people in as one row of faces, every address with a remove, Blocked saying Let in twice.",
          gains: "Built, and each section is already in the order she needs.",
          costs: "Her guests are one line of faces; the door's rows are tall.",
        },
        {
          id: "list",
          label: "One calm row for everyone",
          means:
            "Every person the same row: face, name, a line of how they stand, one act beside it. Let in is the one solid press; the door's count wears the tally.",
          gains: "Scans like a list should; the door is one glance per person.",
          costs: "Each row's photo count is a read the list doesn't carry yet.",
        },
        {
          id: "faces",
          label: "Faces first",
          means:
            "The door as cards side by side, everyone in as a sheet of faces with names, the blocked as dimmed cards; acts only where someone waits.",
          gains: "Feels like her party, and 31 guests fit on one screen.",
          costs:
            "Addresses move into each person's card; a long list is tiles.",
        },
      ],
      recommended: "list",
      today: "today",
      because:
        "One row reads the same at the door, in and blocked, and the one who waits gets the room's only solid press.",
      overrule:
        "If the room should feel like the party more than a list, faces.",
      configs: [SCREEN],
    },
    {
      id: "card",
      label: "A person's card",
      question:
        "When Maya presses a name, what should the card carry, and how should it offer what she can do?",
      where: ["Host", "The Guests room", "A name, pressed"],
      when: "Maya presses Priya Shah's name among the people in, then Aunt Rosa's, then Dev Kapoor's at the door.",
      matters:
        "The card is the one place a person is more than a row: what she can learn and do there decides what the rows can leave out.",
      lands:
        "The card every name opens (the room, the album's guest list, a credit), minus the host's lines for a guest.",
      context:
        "Three frames, drawn on the room you picked: Priya's card (a page, 24 photos), Aunt Rosa's (a typed name) and a name at the door.",
      options: [
        {
          id: "today",
          label: "As today: who they are",
          means:
            "Face, name, the handle or Confirmed their email, the address, Open full profile as its loudest press, Block last. A door name opens nothing.",
          gains: "Small, and it never says more than the album did.",
          costs: "For most guests it repeats the row: a name and an address.",
        },
        {
          id: "photos",
          label: "What they added, first",
          means:
            "Your popups r1 look built: their count and four of their photos lead, then who they are; Follow and their page a quiet pair; Block last.",
          gains: "Every card shows something worth opening it for.",
          costs: "A read of their photos, presigned and gated like the album.",
        },
        {
          id: "standing",
          label: "Their night, and what to do",
          means:
            "One line of how they stand here, their photos, and that standing's act; every name opens it, the door's and Blocked's too.",
          gains: "One place for a person, wherever she meets their name.",
          costs:
            "Two cards in one: the guest's side keeps only the social half.",
        },
      ],
      recommended: "photos",
      today: "today",
      because:
        "The photos are why she opens a guest's card; the acts stay on the rows, so the card stays a look.",
      overrule: "If the card should hold every act for a person, their night.",
      after: { ask: "rows" },
      configs: [SCREEN],
    },
  ],
});
