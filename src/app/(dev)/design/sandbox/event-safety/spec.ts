import type { Control } from "@/components/lab/board-spec";
import { defineExploration } from "@/components/lab/exploration";

/**
 * KEEPING AN EVENT SAFE, ROUND ONE (Will, 2026-09-23).
 *
 * His words, verbatim: "I just thought about one safety feature we should
 * build that hasn't been concepted yet. Let's say a bad actor gets in with a
 * verified email - the host can hide/delete all of their uploads, but there's
 * no way to actually stop those uploads from continuing. We should think of
 * some sort of block feature per event to prevent continued abuse. This may
 * also warrant some sort of invite-only feature as well to ensure events stay
 * closed." And on addresses, the same day: "Guests should not see other
 * confirmed guests' emails, making them more comfortable knowing only the host
 * sees it. Exposing emails publicly would go from a safety feature to privacy
 * concern - the host assumes responsibility of ensuring that safety."
 *
 * ★ HIS THREE ANSWERS ARE THE WALLS EVERY OPTION STANDS INSIDE, never asked
 * again: a block is "Out, uploads removed" (per event, the host's to make and
 * undo; the person cannot join, upload, open the album, like or claim, every
 * refusal re-checked per request; their uploads leave for Deleted in the same
 * step; they meet a plain closed door, never the word "blocked"); the closed
 * doors are "Approve newcomers", "Close to newcomers" and "An invite list"
 * (everyone already in stays in under all three); and all of it is "Both free
 * on every plan", so no lock chip or upgrade prompt appears anywhere here.
 *
 * ★ THE FACTS THE DRAWINGS RESPECT. A block keys on the account, the confirmed
 * address or the guest row, never a device or an IP (device ids are
 * capture-only; a venue shares one IP), so on a names-only party it holds on
 * one browser, and the block's sheet offers Require verified emails. The host
 * sees a confirmed address, a guest never sees another's, and a typed
 * address shows to nobody. A password change evicts nobody for up to 12
 * hours, so no option draws one as a way to close an event.
 *
 * ★ THIRTEEN NARROW STEPS WHERE THE BRIEF NAMED NINE (the manifest's first
 * Question). Four of the nine each held two independent choices: where the
 * blocked list lives AND what comes back when someone is let in; the waiting
 * door AND the host's queue; the closed door AND how "already in" reads; the
 * invite list's editor AND the unlisted person's door. Each pair is two steps
 * now, the second staged behind the first with `after`, so every step is one
 * pick.
 *
 * ★ NEVER ASKED HERE, EACH NAMED WHERE IT IS CARRIED. The credit's own shape
 * is `media-viewer.who`'s (Block rides TODAY's capsule); the door's field, the
 * member nudge, the verified gate's framing, the name menu and undoing an
 * email are `identity-door`'s; the bulk act, its toast and Undo, the waiting
 * count and a mid-visit arrival are `host-curation`'s (the block's own Undo is
 * a different, heavier act; the door's queue is people, not uploads); how
 * the full guest list opens from its faces row is `profile-page.view-all`'s;
 * and the seven lines of `voice-guest` (the welcome, the password ask, the
 * landing, the failure sheet, the empty album, the held photo, the keep) are
 * worn as today's words wherever a door here shows them.
 */

/**
 * THE SCREEN, on every decision. 375 by default: a bad actor turns up in the
 * middle of a party and the host stops him from a phone, and the door he meets
 * is a phone too. Declared here rather than imported from the board's scene: a
 * spec is pure data a server page reads.
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

/** Whose block the sheet is judged on: a confirmed address, or a typed name. */
const PERSON: Control = {
  id: "person",
  label: "Who is blocked",
  options: [
    { id: "confirmed", label: "Dom, a confirmed address" },
    { id: "typed", label: "Rick, a typed name" },
  ],
  default: "confirmed",
};

/** When the blocked person meets the door: at the link, or mid-visit. */
const MOMENT: Control = {
  id: "moment",
  label: "When",
  options: [
    { id: "arrival", label: "Arriving at the link" },
    { id: "midvisit", label: "Mid-visit, a photo refused" },
  ],
  default: "arrival",
};

export const EVENT_SAFETY = defineExploration({
  id: "event-safety",
  title: "Keeping an event safe",
  round: {
    n: 1,
    date: "2026-09-23",
    changed:
      "New board on his concept: a per-event block for a bad actor and three closed doors, all free. Thirteen steps where the brief named nine, since four of its nine each held two separate choices.",
  },
  context:
    "Will, 2026-09-23: a bad actor with a verified email can be hidden photo by photo but never stopped. His three answers bound this board: a block puts the person out of the event and moves their uploads to Deleted; approve newcomers, close to newcomers and an invite list keep an event closed; all of it free on every plan. Everything is drawn on Maya and Jay's wedding, where Dom Hale, a confirmed guest, keeps sending a nightclub to a wedding, at 375 with 1440 on the knob.",
  bible: [1, 4, 12, 15, 19, 21, 22],
  carried: [
    {
      id: "phone-first",
      question: "Which screen are the safety acts judged on first?",
      taken:
        "A phone: a bad actor turns up mid-party and the host acts from the room. 1440 is on every step's knob.",
      overrule:
        "Lead with 1440 if blocking and the door's settings are desk work done the morning after.",
    },
    {
      id: "room-rows",
      question: "What shape does the host's own Guests room take?",
      taken:
        "Rows: each has room for the confirmed address, a count and a menu. The album's list keeps its chips.",
      overrule:
        "Keep the room on the album's chips if one list drawn two ways costs more than room for actions.",
    },
    {
      id: "nothing-behind",
      question: "What stands behind a closed or waiting door?",
      taken:
        "Nothing real: the ghost river a password page shows, never the teaser's photographs.",
      overrule:
        "Show the teaser behind a waiting door if a newcomer should see what they are waiting for.",
    },
    {
      id: "back-in",
      question: "How does someone already in get back on a new phone once the album is closed?",
      taken:
        "The closed door keeps a quiet 'Already a guest? Confirm your email' for anyone with a confirmed address.",
      overrule:
        "Drop it if a closed album should mean the phone you joined on, or nothing.",
    },
  ],
  asks: [
    {
      id: "entry",
      label: "Where Block lives",
      question: "Where should a host be able to block someone from the event?",
      context:
        "Today a host hides or removes a bad actor's photos one at a time, and nothing stops the next. A block puts them out of this event with their uploads, so it needs a door wherever the host meets them.",
      options: [
        {
          id: "credit",
          label: "On their name, in the viewer",
          means:
            "Today's credit under an open photograph becomes a door: their address, their uploads, and Block from this event.",
        },
        {
          id: "guests",
          label: "On their row in the Guests room",
          means:
            "Every row in the host's room carries a menu with Block, beside the address the room already shows.",
        },
        {
          id: "review",
          label: "In Review, when refusing theirs",
          means:
            "Hiding someone's waiting uploads names who sent them, with Block one tap away in the room itself.",
        },
        {
          id: "all",
          label: "All three, into one block",
          means:
            "The name, the row and Review each open the same block, so it is there wherever the host meets them.",
        },
      ],
      recommended: "all",
      because:
        "A host meets a bad actor wherever their photographs land: open in the album, held in Review, or by name in the room. Three doors into one act costs nothing to learn and never strands a host on the wrong screen.",
      overrule:
        "If a block should be deliberate, the Guests room alone keeps it a careful place away from a stray tap in the viewer.",
      lands: "Which surfaces carry Block, and that every one opens the same act.",
      configs: [SCREEN],
    },
    {
      id: "sheet",
      label: "The block itself",
      question:
        "Should Block say what leaves with the person first, or act at once with an Undo?",
      context:
        "A block puts the person out and moves their uploads to Deleted, where each can be restored. A typed name is blocked on one browser only, so Require verified emails is offered right there.",
      options: [
        {
          id: "confirm",
          label: "A sheet that says what leaves",
          means:
            "Who, their uploads, their place on the list and the closed door they will meet, then one red Block.",
        },
        {
          id: "undo",
          label: "At once, with Undo on the toast",
          means:
            "One tap and they are out. The toast counts the uploads moved and offers Undo; the one-browser note rides under it.",
        },
        {
          id: "inline",
          label: "The menu asks a second time",
          means:
            "Block grows in place into what leaves and one more tap. No sheet, no toast, nothing left to dismiss.",
        },
      ],
      recommended: "confirm",
      because:
        "A block takes a person's photographs out of a live album and turns them away, the one act here heavy enough to read before it happens, and the only shape with room for the one-browser note and its switch.",
      overrule:
        "If a host acting mid-party should never meet a sheet, at once with Undo is faster and just as reversible.",
      lands:
        "Whether a block ever happens in one tap, and where the one-browser note and the verified-emails switch appear.",
      after: { ask: "entry" },
      configs: [SCREEN, PERSON],
    },
    {
      id: "door",
      label: "The blocked door",
      question:
        "What should a blocked person meet, arriving at the link or when a photo is refused mid-visit?",
      context:
        "Every request is re-checked, so an album opened before the block closes at the next one. The door is plain and never says blocked; its words are placeholders, judged for size and tone.",
      options: [
        {
          id: "private",
          label: "The private album's locked screen",
          means:
            "What a private album shows: a lock, one plain line, a link home. It reads as if the host closed the album.",
        },
        {
          id: "held",
          label: "The door itself, with nothing past it",
          means:
            "The held door rises as it always does, with the album's name and one plain line where the steps would be.",
        },
        {
          id: "gone",
          label: "The dead link",
          means:
            "The page a mistyped link meets: no name, no album, and a line saying the host may have deleted it.",
        },
      ],
      recommended: "private",
      because:
        "It is the family the product already uses for 'not for you right now', so a blocked person learns nothing a closed album would not tell them, and nothing on it pretends the album is gone.",
      overrule:
        "If a blocked person should not learn the album still exists, the dead link says nothing at all.",
      lands:
        "What every refusal a block causes looks like, at the door and in the middle of a visit.",
      configs: [SCREEN, MOMENT],
    },
    {
      id: "blocked",
      label: "The blocked list",
      question: "Where should a host see who is blocked, and let someone back in?",
      context:
        "A blocked person drops off the guest list and every count, so one place has to keep naming them. Letting them back means they can join again.",
      options: [
        {
          id: "foot",
          label: "At the foot of the Guests room",
          means:
            "Under the guests, a quiet Blocked section: who, since when, and Let back in.",
        },
        {
          id: "settings",
          label: "A row in the event's settings",
          means:
            "The access card says Blocked, 2 people, and the row opens the list inside the sheet.",
        },
        {
          id: "tab",
          label: "A Blocked tab in the Guests room",
          means:
            "The room's heading splits into Guests and Blocked, so the blocked are one tap away and never under the guests.",
        },
      ],
      recommended: "foot",
      because:
        "The room is where people are managed and where Block is pressed, so the way back belongs there, under the list the person left, with nothing else to find.",
      overrule:
        "If blocked names should stay out of sight of anyone glancing at the room, the settings row keeps them one deliberate step away.",
      lands: "Where blocked people are listed, and where Let back in lives.",
      after: { ask: "entry" },
      configs: [SCREEN],
    },
    {
      id: "restore",
      label: "Letting back in",
      question:
        "When a host lets someone back in, should their removed uploads come back too?",
      context:
        "The block moved their uploads to Deleted, where a host can restore them for 30 days. Letting the person back can leave the uploads there, bring them all back, or ask.",
      options: [
        {
          id: "stay",
          label: "They stay in Deleted",
          means:
            "The person can join again; their 7 uploads wait in Deleted for the host to restore by hand.",
        },
        {
          id: "back",
          label: "They come back with them",
          means:
            "Letting them in restores all 7 uploads to the album in the same step, as if the block never happened.",
        },
        {
          id: "ask",
          label: "The confirm asks, off by default",
          means:
            "The confirm names the 7 uploads with a switch to bring them back, off unless the host turns it on.",
        },
      ],
      recommended: "ask",
      because:
        "A host lets someone back for one of two reasons, a mistaken block or a forgiven person, and only the first wants the photographs back. One switch in the confirm answers both without a trip to Deleted.",
      overrule:
        "If a block is almost never a mistake, leaving the uploads in Deleted keeps one rule with nothing to decide.",
      lands: "What letting someone back does to the photographs the block removed.",
      after: { ask: "blocked" },
      configs: [SCREEN],
    },
    {
      id: "room",
      label: "The room, list off",
      question:
        "When the album's guest list is off, should the host's Guests room still list everyone?",
      context:
        "Today the room shows only an invitation to turn the list on, so a host with it off cannot see who added photos, block anyone or let a newcomer in. The switch could govern only what guests see.",
      options: [
        {
          id: "always",
          label: "Always listed, with one quiet line",
          means:
            "The room lists everyone; one line under the heading says only you see it, with a link to show it on the album.",
        },
        {
          id: "today",
          label: "Only the invitation, as today",
          means:
            "Nothing listed until the switch is on; blocking and letting people in happen somewhere else.",
        },
        {
          id: "switch",
          label: "Listed, with the switch at the top",
          means:
            "The room lists everyone under Show this list on the album, flipped right there.",
        },
      ],
      recommended: "always",
      today: "today",
      because:
        "The switch exists to protect guests from each other, never to hide them from the host. With blocking, addresses and the door's queue living here, a room that goes blank is a room the host cannot work in.",
      overrule:
        "If the host should flip the album's list where they are looking at it, the switch in the room saves the trip to settings.",
      lands:
        "Whether the album's list switch governs the host's own room, and how the room says who sees it.",
      configs: [SCREEN],
    },
    {
      id: "choose",
      label: "Who can join",
      question: "How should a host choose who can join, in the event's settings?",
      context:
        "Three closed doors, free on every plan: approve newcomers, close to newcomers, an invite list. They join Require verified emails, Require an upload to view, Review and Pause; the first and last need a confirmed email.",
      options: [
        {
          id: "choice",
          label: "One 'Who can join?' choice of four",
          means:
            "Under Who can see this album, a second choice: anyone, approve newcomers, closed to newcomers, or an invite list.",
        },
        {
          id: "switches",
          label: "A switch for each, with the others",
          means:
            "Three switches in Guest uploads under Require verified emails; turning one on turns the other two off.",
        },
        {
          id: "door",
          label: "One card, in the order a guest meets it",
          means:
            "Who can see, who can join, a confirmed email and a first photo, regrouped as The door, top to bottom.",
        },
      ],
      recommended: "choice",
      because:
        "The four are one state, never two at once, and Who can join reads as the natural second half of Who can see this album. It adds one control and moves nothing.",
      overrule:
        "If two switches that gate viewing living under Guest uploads is the real problem, regrouping them as The door fixes it at its source.",
      lands:
        "How the closed doors are chosen, and where they sit among the switches that already shape the door.",
      configs: [SCREEN],
    },
    {
      id: "waiting",
      label: "Waiting at the door",
      question:
        "With Approve newcomers on, what should a newcomer see while the host decides?",
      context:
        "A newcomer confirms an email, then waits until the host lets them in or declines them, and a decline is a block. Nothing real shows behind a waiting door.",
      options: [
        {
          id: "held",
          label: "The door waits, and opens itself",
          means:
            "The held door says Maya will let you in, and opens onto the album the moment she does. Nothing is sent.",
        },
        {
          id: "email",
          label: "A waiting page, and an email",
          means:
            "A plain page says Maya has been asked; an email with the link arrives when she lets them in.",
        },
        {
          id: "both",
          label: "The door waits, and emails if they go",
          means:
            "The held door waits live as in the first; if they close it before Maya decides, an email brings them back.",
        },
      ],
      recommended: "both",
      because:
        "At a party a host decides in minutes, so the door should open by itself; a newcomer who pockets their phone should not have to keep checking back.",
      overrule:
        "If one more email per guest is more than this needs, the door alone is simpler and sends nothing.",
      lands:
        "What a newcomer holds while waiting, and whether letting someone in ever sends an email.",
      after: { ask: "choose" },
      configs: [SCREEN],
    },
    {
      id: "queue",
      label: "Letting newcomers in",
      question: "Where should a host let newcomers in, or turn them away?",
      context:
        "Newcomers wait with a confirmed address. Letting one in opens their door; declining blocks them. The hub has to say someone is waiting.",
      options: [
        {
          id: "room",
          label: "At the head of the Guests room",
          means:
            "An At the door section above the guests, Let in and Decline on each row; the hub's Guests card counts who waits.",
        },
        {
          id: "review",
          label: "In Review, beside held uploads",
          means:
            "Review holds people as well as photographs: newcomers above the waiting uploads, one count on its card.",
        },
        {
          id: "hub",
          label: "A strip on the event's hub",
          means:
            "A line above the album names who is waiting, with Let in right there and Decline behind See all.",
        },
      ],
      recommended: "room",
      because:
        "The room is where the host already sees every person, their address and Block, and letting someone in is the same kind of act as blocking someone.",
      overrule:
        "If a host already works through Review on a moderated event, one queue for everything waiting beats two rooms to check.",
      lands: "Where newcomers wait for the host, and which hub card counts them.",
      after: { ask: "waiting" },
      configs: [SCREEN],
    },
    {
      id: "newcomer",
      label: "Closed to newcomers",
      question: "When the album is closed to newcomers, what should someone new meet?",
      context:
        "Everyone already in keeps going and nobody new joins, so a newcomer arrives with a working link and gets no further. Someone already in, on a new phone, confirms their email to get back.",
      options: [
        {
          id: "same",
          label: "The same door a blocked person meets",
          means:
            "Word for word the blocked door, so nobody can tell a block from a closed album.",
        },
        {
          id: "honest",
          label: "A door that says it is closed to new guests",
          means:
            "The same form with a truer line: the album is only open to people already in.",
        },
      ],
      recommended: "same",
      because:
        "One door for every refusal means a blocked person learns nothing from it: they meet exactly what a latecomer meets.",
      overrule:
        "If a latecomer deserves to know it is the album and not them, the honest line costs a blocked person's cover.",
      lands:
        "Whether a closed album and a block read the same to the person at the door.",
      after: { ask: "door" },
      configs: [SCREEN],
    },
    {
      id: "inside",
      label: "Who is already in",
      question: "When a host closes to newcomers, how should they see who is already in?",
      context:
        "Already in means everyone past the door, including people who have not added a photo and so are on no list or count. They keep adding; nobody new can join.",
      options: [
        {
          id: "sentence",
          label: "A sentence, no number",
          means:
            "Everyone already in keeps adding, nobody new can join. The guest count stays the only number.",
        },
        {
          id: "count",
          label: "A count of who is in",
          means:
            "31 people are in, 9 have added photos: a second number, for everyone past the door.",
        },
        {
          id: "list",
          label: "The room lists who hasn't added yet",
          means:
            "Below the guests, In with no photos yet, so the host sees everyone the closed door still lets through.",
        },
      ],
      recommended: "sentence",
      because:
        "A guest is someone who added a photo and every count says that one number; a door count would be the first place the product reads a door ticket as attendance.",
      overrule:
        "If a host closing mid-party needs to know how many can still add, the count is the only honest answer.",
      lands:
        "Whether closing to newcomers shows a second number, and whether the room ever lists people with no photos.",
      after: { ask: "choose" },
      configs: [SCREEN],
    },
    {
      id: "editor",
      label: "The invite list",
      question: "How should a host put addresses on the invite list?",
      context:
        "With an invite list on, only listed addresses can confirm in. A wedding's list can run to two hundred, usually already kept somewhere else.",
      options: [
        {
          id: "one",
          label: "One at a time",
          means: "A field and Add; each address becomes a row with its own remove.",
        },
        {
          id: "paste",
          label: "A box to paste them all",
          means:
            "A box that takes a pasted column or a comma list, then shows what it found and what it could not read.",
        },
        {
          id: "both",
          label: "One field that takes either",
          means:
            "Type one and press Enter, or paste two hundred and they land as chips, the unreadable ones flagged.",
        },
      ],
      recommended: "both",
      because:
        "A host adds a latecomer one at a time and a whole list from a spreadsheet once; one field that takes both needs no mode and no second control.",
      overrule:
        "If a list is pasted once and rarely touched, the paste box says what it found more plainly.",
      lands: "How addresses reach the list, and how a bad one is shown.",
      after: { ask: "choose" },
      configs: [SCREEN],
    },
    {
      id: "unlisted",
      label: "Not on the list",
      question: "What should someone whose address is not on the invite list meet?",
      context:
        "The list is checked after the email is confirmed, so the answer only ever describes an address its owner proved. A listed person goes straight in.",
      options: [
        {
          id: "same",
          label: "The same closed door",
          means:
            "After confirming, the plain closed door, word for word; nothing says a list exists.",
        },
        {
          id: "another",
          label: "Not on the list, try another",
          means:
            "The email step says this address is not on the list and offers to confirm a different one.",
        },
        {
          id: "ask",
          label: "A way to ask the host",
          means:
            "One button sends their name and address to the host, who can let them in like a newcomer.",
        },
      ],
      recommended: "another",
      because:
        "The commonest unlisted person at a wedding is an invited guest who confirmed a different address than the one on the list; saying so is the only door that lets them fix it without the host.",
      overrule:
        "If the list itself should stay a secret, the same closed door tells an uninvited person nothing.",
      lands:
        "Whether an invite list can be seen from outside, and whether an unlisted person has a way in.",
      after: { ask: "door" },
      configs: [SCREEN],
    },
  ],
});
