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
 * ★ TWO ASKS, THE SECOND STAGED: how each person reads in the room (four
 * whole rooms: today's, calm rows for everyone, faces first, and rows where
 * she acts with the guests as faces), then the card, drawn opening from four
 * names in the room he picked. The standing card takes the door's Decline off
 * the row (`card.tsx`'s `declineOnRow`), so its pictures move the rows too.
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
    "Maya & Jay's wedding, Saturday at 9:40 pm. The album is Private with Maya's invite list as the door: listed addresses come straight in, anyone else asks at the door. 31 guests have added photos, 3 wait at the door, 40 addresses are on the list (28 joined) and 2 people are blocked. Every frame is production's room over the hub, at her phone or her laptop (the Screen knob); a press answers and writes nothing.",
  opening: {
    about:
      "The Guests room's people and a person's card, polished from your note: how each person stands (at the door, a guest, invited, blocked) and what she can do.",
    settled: [
      "Let in is one press, at the door and for someone you declined who is still asking.",
      "A decline is a block: they meet a closed album and can't ask again.",
      "Block stays the quiet last line of a person's card, for the host alone.",
      "A guest is someone with an approved photo here; a person let in who adds nothing is on no list.",
    ],
    earlier: [
      "Host-moments r1, on Let in: 'The UI design of how we present this (and guest card items in general) could definitely be polished.'",
      "Popups r1: a name opens a card beside it at a desk and the sheet in a hand, its photos drawn in it.",
      "Account-moments r1: 'Can guest names be clicked ... for additional actions beyond the row action flip? ... Don't want to overcrowd the row actions.'",
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
      when: "Her invite list is the door. At 9:40 pm Maya opens Guests: three wait at the door, 31 guests are in, two are blocked.",
      matters:
        "It is where she answers people at her own party: the one who waits should be one glance and one press.",
      lands:
        "How every person in the Guests room reads (at the door, a guest, invited, blocked) and how their act looks.",
      context:
        "Four frames down the room: opened, scrolled to the guests, to the invite list, and its foot. Each option is a whole room; a name opens today's card, and a Let in pressed leaves its row, as production's does.",
      options: [
        {
          id: "today",
          label: "As today",
          means:
            "Door rows with their keys under three lines; the guests as one row of faces that opens a second panel; every address with a remove; Blocked says Let in twice.",
          gains:
            "Built, and each section already stands in the order she needs.",
          costs: "Her guests are one line of faces; the door's rows run tall.",
        },
        {
          id: "list",
          label: "One calm row for everyone",
          means:
            "Every person one row: face, name, how they stand, its act at the end (the door's Decline a quiet ✕ beside Let in). The door's count wears the tally.",
          gains: "Reads like a list should: the door is one glance a person.",
          costs:
            "Photo counts are a read the list lacks; the ✕ is a block in a dismiss's shape.",
        },
        {
          id: "faces",
          label: "Faces first",
          means:
            "The door as cards side by side, the guests as a sheet of faces, the invites as empty seats, the blocked as quiet cards.",
          gains: "Feels like her party: all 31 guests on one screen.",
          costs:
            "Addresses and removes move into cards and seats; the joined fold into faces.",
        },
        {
          id: "mixed",
          label: "Rows to act, faces to look",
          means:
            "The door, the invite list and Blocked as calm rows, where she acts; the guests as a sheet of faces, where she looks.",
          gains:
            "Each section in the shape of its job: the door scans, the party shows.",
          costs:
            "Guests' addresses move into their cards; two shapes in one room.",
        },
      ],
      recommended: "list",
      today: "today",
      because:
        "One row reads alike at the door, among the guests and in Blocked, the address stays in sight, and the one who waits has the only solid key.",
      overrule:
        "If her guests should read as her party's faces, rows to act, faces to look.",
      configs: [SCREEN],
    },
    {
      id: "card",
      label: "A person's card",
      question: "What should open when Maya presses someone's name?",
      where: ["Host", "The Guests room", "A name, pressed"],
      when: "Maya presses Priya Shah among the guests, then Aunt Rosa, Dev Kapoor at the door, and Chris Doyle in Blocked.",
      matters:
        "The card is where a person is more than a row: what it holds decides what the rows can leave out.",
      lands:
        "The card every name opens: in the room, the album's guest list and a photo's credit (a guest's has no host lines).",
      context:
        "Four frames on the room you picked: Priya's card (she has a page and 24 photos), Aunt Rosa's (a typed name), a name at the door and a blocked name. A name that opens nothing says so under its frame.",
      options: [
        {
          id: "today",
          label: "As today: who they are",
          means:
            "Face, name, the handle or Confirmed their email, the address, Open full profile as the loudest key, Block last. A door or Blocked name opens nothing.",
          gains: "Small, and never says more than the album did.",
          costs: "For most guests it repeats the row: a name and an address.",
        },
        {
          id: "photos",
          label: "Who they are, and their photos",
          means:
            "Your popups r1 card, built: who they are, four of their photos and See all, Follow and their page quiet, Block last. Door and Blocked names open nothing.",
          gains: "Every guest's card shows something worth opening it for.",
          costs:
            "A read of their photos, and See all wants the album filtered to one guest.",
        },
        {
          id: "standing",
          label: "Their night here, from every name",
          means:
            "The same card, plus how they stand tonight and its act; every name opens it, so the door's Decline moves off the row and into the card.",
          gains: "Each row keeps one act; the acts beyond it are a press away.",
          costs:
            "A decline takes two presses; the guest's side gets the photos card.",
        },
      ],
      recommended: "standing",
      today: "today",
      because:
        "Your Connections note, answered: a name opens the card for the acts beyond the row's one, so every row keeps a single act.",
      overrule:
        "If the card should stay a look at a guest's photos, who they are and their photos.",
      after: { ask: "rows" },
      configs: [SCREEN],
    },
  ],
});
