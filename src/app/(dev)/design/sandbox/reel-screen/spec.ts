import type { Control } from "@/components/lab/board-spec";
import { defineExploration } from "@/components/lab/exploration";

/**
 * THE VENUE SCREEN, ROUND ONE (2026-09-22).
 *
 * A NEW BOARD OF THE REEL ROUND (docs/design/rulings.md, "the reel,
 * reconceived"): Will's own line, "Could play at an event in real-time on a
 * screen or something", and his ruling on it, "A first-class screen mode". A
 * laptop on the venue's television plays the event's reel full bleed with the
 * name and the code on it: scan, add, on the wall a minute later. It is the
 * loop's loudest moment, because every person in the room can see where the
 * photographs are going and how to be in them.
 *
 * ★ WHAT IS DECIDED ALREADY, AND IS NOT ASKED HERE. The screen is its own mode
 * reached from the host's hub; it opens on a one-tap Start plate, because
 * fullscreen and the wake lock both need a gesture in a tab that has none, and
 * the plate returns whenever fullscreen is left; it is landscape; its pacing is
 * slower than the hand's; the host signs in on the screen and the owner bypasses
 * every gate, the password included; it carries no mark on any tier; reduced
 * motion is overridden by the host's own explicit act; and the room's music is
 * the room's, so the wall is silent. Those are the round's calls; the eight
 * below are his.
 *
 * ★ NOTHING HERE EXISTS TODAY. The shipped answer to "put the album on a
 * screen" is the album GRID in a browser tab, and the help article
 * (`show-the-album-live-on-a-screen`) says in its own words that there is no
 * slideshow mode. So no option on this board can be "as today": every one is
 * new, and the article flips at the wiring.
 *
 * ★ `host-curation.count` is the standing board's, and this one asks nothing it
 * asks: how many places tell a host how many uploads are waiting is ITS
 * question; whether the WALL is one of those places is the `review` ask below.
 */

/** The two televisions in the room. Every wall decision is drawn on both. */
const SCREEN: Control = {
  id: "screen",
  label: "Screen",
  options: [
    { id: "1920", label: "1920, the wall" },
    { id: "1440", label: "1440, a smaller one" },
  ],
  default: "1920",
};

export const REEL_SCREEN = defineExploration({
  id: "reel-screen",
  title: "The reel on the wall",
  round: {
    n: 1,
    date: "2026-09-22",
    changed:
      "New board, cut with the reel round on his ruling that the screen is a first-class mode.",
  },
  context:
    "A laptop on the venue's television, signed in as the host, plays Mia and Theo's reel full bleed all night. The room can see the album filling up and can see how to be in it. Eight decisions about what else is on that screen, every one drawn at 1920 by 1080 with a 1440 television on the knob, every reel frame the real engine over the album this desk already judges on.",
  bible: [1, 4, 7, 8, 12, 14, 19, 20, 22],
  carried: [
    {
      id: "look",
      question: "Which mood does the wall wear while these are judged?",
      taken:
        "Sunset, which is full bleed. The engine's default, Cinematic, letterboxes a 16:9 wall and would have put every corner over black instead of over a photograph.",
      overrule:
        "Worth knowing on its own: a host who touches nothing gets Cinematic, and it spends about a sixth of a television on bars.",
    },
    {
      id: "panel",
      question: "Does the side panel carry the event's name, as the sketch had it?",
      taken:
        "No. The name is the `name` ask's one variable, and a panel that printed it too would make all three of that ask's options identical under this one.",
      overrule:
        "If the panel is the name's natural home, `name` becomes a question about the other two codes only.",
    },
    {
      id: "waiting",
      question: "How many uploads is Review holding on the wall?",
      taken:
        "Seven, which is the shared album fixture's own queue. The brief said three; a made-up number would not have been the desk's album.",
      overrule:
        "Nothing turns on the number. It is drawn so the chip is judged at a real width.",
    },
    {
      id: "held",
      question: "Do the walls run, or are they held frames?",
      taken:
        "Held, except pacing, which runs three real players. Seven of eight decisions are furniture over a picture, and furniture is judged against a still.",
      overrule:
        "If a held frame hides something a moving one would show, that decision gets a running wall too.",
    },
  ],
  asks: [
    {
      id: "qr",
      label: "The code",
      question: "Where does the code live on the wall, and how big?",
      context:
        "The growth loop at its loudest: the room can see the wall, and the code is the only way onto it. A phone reads one from across a room at about a tenth of the screen wide, so the trade is how much picture the wall spends.",
      options: [
        {
          id: "corner",
          label: "Small, in a corner, with the ask",
          means:
            "A white plate bottom right with \"Scan to add yours\" and the readable address beside it. The picture keeps the wall.",
        },
        {
          id: "panel",
          label: "A panel down the side",
          means:
            "A quarter of the wall is the event's name, a large code and the ask. The reel plays in the rest.",
        },
        {
          id: "interstitial",
          label: "The whole wall, now and then",
          means:
            "The reel gives the wall to the code for a few seconds every so often, then carries on.",
        },
      ],
      recommended: "corner",
      because:
        "A wall people glance at all night is a picture with a permanent invitation on it, not an invitation with a picture beside it. A corner code is always there for the person who just looked up, and it costs the reel nothing.",
      overrule:
        "If the code has to be read from the back of a hall, the panel is the only one that holds at that distance.",
      lands:
        "How much of the screen is the reel and how much is the invitation, on every wall we ever draw.",
      configs: [SCREEN],
    },
    {
      id: "name",
      label: "The event's name",
      question: "How does the wall say whose event it is?",
      context:
        "A guest surface belongs to the host's event, and a wall is the most public one there is. But the room already knows whose wedding it is at, so the name may be doing less work here than on any other screen we draw.",
      options: [
        {
          id: "wordmark",
          label: "A corner wordmark",
          means:
            "The name and the count sit small in the top corner, at the weight a credit carries.",
        },
        {
          id: "bar",
          label: "A title bar across the head",
          means:
            "A glass strip owns the top of the wall: the name large on the left, the count on the right.",
        },
        {
          id: "none",
          label: "Nothing but the code",
          means:
            "The picture runs edge to edge and the only words on the wall are the ones beside the code.",
        },
      ],
      recommended: "wordmark",
      because:
        "The name is what makes the wall the host's rather than ours, and a corner carries it for the price of one line. A bar takes a tenth of the picture to say something the room already knows.",
      overrule:
        "At a venue with several rooms, or a screen a stranger walks past, the bar is the one that tells them what they are looking at.",
      lands:
        "Whether a wall has chrome of its own, and how loudly a host's event is named on a public screen.",
      configs: [SCREEN],
    },
    {
      id: "caption",
      label: "The just-added beat",
      question: "What does the wall do when a photograph has just landed?",
      context:
        "This is the payoff of the whole loop: a guest adds a photograph and sees it on the wall a minute later. The reel splices new items into its loop within seconds, so the wall can say who it came from without stopping.",
      options: [
        {
          id: "lower-third",
          label: "A lower third, for one hold",
          means:
            "\"Just added\" and the name, large over the bottom left, riding in with the photograph and leaving with it.",
        },
        {
          id: "chip",
          label: "A chip in the corner",
          means:
            "A small glass pill with a live dot: \"Just added by Theo Calder\", the size of a notification.",
        },
        {
          id: "none",
          label: "Nothing at all",
          means:
            "The photograph simply appears in the loop. The room works out whose it is by looking at it.",
        },
      ],
      recommended: "lower-third",
      because:
        "The credit is the reason a shy guest adds a second photograph. A wall that names the person out loud turns one upload into a room of them, and it is the only moment the wall ever speaks.",
      overrule:
        "If a name on a wall is a privacy problem at somebody's wedding, the chip says the same thing quietly and the host can still turn it off.",
      lands:
        "Whether the wall ever credits a guest by name, and how loud a live arrival is on every reel surface.",
      configs: [SCREEN],
    },
    {
      id: "pacing",
      label: "The wall's pace",
      question: "How long does one photograph hold on the wall?",
      context:
        "The hand's own hold is 2.7 seconds, and a wall is slower than a hand: nobody is watching it continuously, so every photograph has to be there long enough to be caught by somebody who just looked up. Three real takes, running.",
      options: [
        {
          id: "brisk",
          label: "3.6 seconds, brisk",
          means:
            "About 20 photographs a minute. Always something new on the wall; a glance from across the room may miss one.",
        },
        {
          id: "wall",
          label: "5 seconds, a wall",
          means:
            "About 14 a minute. Long enough to point at, short enough that the album still feels like it is moving.",
        },
        {
          id: "slow",
          label: "7 seconds, slow",
          means:
            "About 9 a minute. Nearly a photograph you can study, and the room waits longer to see its own come round.",
        },
      ],
      recommended: "wall",
      because:
        "Five seconds is the shortest hold where two people can both notice a photograph and say something about it before it goes, which is what a wall at a party is actually for.",
      overrule:
        "A small album comes round too often at five. If the pace should fall with the count, that is a rule rather than a number.",
      lands:
        "The wall's hold, and whether pacing is one number or something that moves with the album's size.",
      configs: [SCREEN],
    },
    {
      id: "idle",
      label: "Before it begins",
      question: "What is on the wall before there are three photographs?",
      context:
        "The reel starts at the third item, and the host sets the screen up before anyone arrives. This is what is on the television for the first half hour, and the only state where the wall is pure invitation.",
      options: [
        {
          id: "invite",
          label: "The invitation, and what it is waiting for",
          means:
            "The name, a large code, and one honest line: \"The reel begins with the third photo. Two so far.\"",
        },
        {
          id: "code",
          label: "The code alone, as big as it goes",
          means:
            "Nothing but the code and the address, filling the wall. Unmissable from anywhere in the room.",
        },
        {
          id: "stills",
          label: "The photographs there are, held slow",
          means:
            "The one or two already added, dissolving slowly, with the name and a small code in the corners.",
        },
      ],
      recommended: "invite",
      because:
        "The empty wall is the one that has to earn the first three photographs, and a line saying what happens next is what turns a code into a reason to scan it right now.",
      overrule:
        "If the count reads as a scoreboard nobody wants to be first on, the code alone asks the same thing without counting.",
      lands:
        "What every empty reel surface says, and whether we ever count upward in public.",
      configs: [SCREEN],
    },
    {
      id: "start",
      label: "The Start plate",
      question: "What does the host press to start the wall?",
      context:
        "Fullscreen and the wake lock both need a gesture in the tab that asks, and the wall opens in a new one, so the first thing on the screen is always something to press. It returns whenever fullscreen is left.",
      options: [
        {
          id: "button",
          label: "The name and one button",
          means:
            "The event's name, \"Start the reel\", and one line saying it fills the screen and keeps it awake.",
        },
        {
          id: "frame",
          label: "The reel's first frame, with a play mark",
          means:
            "The picture is already there behind a dimmed play mark. Pressing it simply takes the dimming away.",
        },
        {
          id: "countdown",
          label: "A countdown, with a way past it",
          means:
            "The name, a large three counting down, and \"Start now\" for a host who does not want to wait.",
        },
      ],
      recommended: "frame",
      because:
        "The plate is the only thing between a host and the wall, and showing the reel behind it makes the press feel like lifting a cover rather than launching an application.",
      overrule:
        "A plate with no words does not warn a host that the screen is about to go fullscreen and stay awake; the plain button says both.",
      lands:
        "The first thing anyone ever sees of the screen mode, and how a gesture-gated surface introduces itself.",
      configs: [SCREEN],
    },
    {
      id: "review",
      label: "Review on the wall",
      question: "Does the wall say anything about photographs waiting?",
      context:
        "On a moderated event nothing reaches the wall until the host approves it, and the host is in the room with a phone. The screen could be where they notice. It is also read by everyone, so anything on it is said to all.",
      options: [
        {
          id: "host",
          label: "A count for the host, in a corner",
          means:
            "A small glass chip, \"7 waiting, on your phone\". Meant for one person, quiet enough for the room.",
        },
        {
          id: "room",
          label: "A line the room reads",
          means:
            "\"New photos appear once Mia approves them\", centred under the picture, so a guest knows why theirs is not up.",
        },
        {
          id: "none",
          label: "Nothing at all",
          means:
            "The wall shows the album and says nothing about the queue. Review stays entirely on the host's phone.",
        },
      ],
      recommended: "host",
      because:
        "A host at their own party will not be checking a phone, and the wall is the one thing they keep glancing at. A count in a corner is the cheapest reminder we will ever get to place.",
      overrule:
        "If a wall carrying an operational number in front of guests reads as back office, nothing at all is the honest default and the phone already tells them.",
      lands:
        "Whether a public screen ever carries a host-only signal, and where a waiting count may appear.",
      configs: [SCREEN],
    },
    {
      id: "open",
      label: "The way in",
      question: "How does a host open the wall from their own laptop?",
      context:
        "The host signs in on the screen's browser and the owner passes every gate, the password included. This asks where the door sits, and whether a link that opens the wall without a sign-in is ever worth building.",
      options: [
        {
          id: "hub",
          label: "A door in the hub's cards row",
          means:
            "\"Play on a screen\" sits beside Review, Reel, Guests and Settings, opening a new tab, with one line about signing in.",
        },
        {
          id: "link",
          label: "The door, and a screen link, later",
          means:
            "The same card plus a copyable link for a machine that is not yours. It is a capability token, so it needs expiry and revocation.",
        },
        {
          id: "sheet",
          label: "A row inside the settings sheet",
          means:
            "The wall is something a host sets up once, so it lives beside \"Show the reel\" rather than in the row of rooms.",
        },
      ],
      recommended: "hub",
      because:
        "The cards row is already the host's list of what this event can do, and the wall is one of those things. Settings is where you go to change something, not to start it.",
      overrule:
        "If the row is full at four, the wall belongs in the share surface beside the code and the link rather than in settings.",
      lands:
        "Where the screen lives in the host app, and whether a screen link without a session is on the roadmap at all.",
      configs: [SCREEN],
    },
  ],
});
