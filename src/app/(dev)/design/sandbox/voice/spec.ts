import { defineExploration } from "@/components/lab/exploration";

/**
 * THE VOICE, DERIVED FROM WON LINES (round one, 2026-09-18).
 *
 * ★ THE FORM IS WILL'S, AND IT IS THE DURABLE HALF OF THE KILL. He stopped the
 * last voice board at round seven, unruled, because it "worked too hard trying
 * to generate multiple unique voices rather one that's perfect... forcing each
 * to have a very specific tone so it felt differentiated for the sake of the
 * exploration" (2026-09-17). What he asked for instead: "give me tighter
 * comparisons of copy in real cases, one at a time, and use my winning
 * selections to build the brand voice". And the constraint that survived his own
 * withdrawn two-draft idea: "starting with just a few spot example statements
 * may make a voice sound good in a silo, but not perform well in actual usage.
 * I'd rather shape it as we see the voice applied in real cases."
 *
 * So there is no voice on this board. There are eight real lines, each in the
 * place it is read, each with three or four lines a careful writer would
 * actually weigh for that place, and the voice is whatever his eight wins turn
 * out to share. Nothing here is a tone with a name.
 *
 * ★ THE CANDIDATES ARE CLOSE ON PURPOSE, WHICH IS THE OPPOSITE OF LAST TIME.
 * The killed board's own contract made two voices that agreed owe a written
 * excuse, so its author pushed them apart; `docs/PROGRAM.md` now says two
 * options that land on the same answer is a finding, not a debt. Several
 * candidates below are one clause apart, and two of them (the empty album and
 * the host's empty dashboard) are deliberately the SAME question on two
 * surfaces, so his two answers say whether the app and the guest's phone are
 * meant to speak with one voice or with two.
 *
 * ★ THE FIRST ASK IS BIBLE 20'S OPEN QUESTION, DRAWN RATHER THAN DEBATED. The
 * rule reads "affirmative only: say who we are, never who we are not" and its
 * status is `under exploration: voice`, because nobody has ruled whether it
 * forbids NAMING an absence ("no app, no account") or only a sentence SHAPED as
 * a denial. The guest's first screen says it twice today, so that is where it is
 * asked, on that line, with the same fact affirmed beside it.
 *
 * ★ EVERY CANDIDATE CLEARS THE FENCES BEFORE IT IS A CANDIDATE, so none of
 * these is a trade against a rule: bible 20's two product-truth fences
 * (`src/lib/content-policy.test.ts`), the claims fence, the
 * promise-neutralization doctrine (`docs/systems/marketing-content.md`) and the
 * em-dash policy. The lines themselves live in `lines.ts`; this file carries
 * only the questions and what each answer would do.
 *
 * ★ AND THE THREE PICKS OF 2026-09-17 ARE NOT RE-ASKED: `noun=album`,
 * `unfurl=join` and `counts=hero` are settled and every surface here obeys them.
 */
export const VOICE = defineExploration({
  id: "voice",
  title: "Voice",
  round: {
    n: 1,
    date: "2026-09-18",
    changed:
      "The first round in the form Will asked for: eight real lines in their real places, three or four close candidates each, drawn at true size on the site, in the app and on a guest's phone.",
  },
  context:
    "The voice is never declared and then applied. Each question is one line that ships today, with the lines a careful writer would weigh against it, and the voice is written up from what the winners share. Bible 20 and 21 both wait on this board: 20 for its do's, 21 because no copy is pinned until the voice exists.",
  bible: [19, 20, 21],
  asks: [
    {
      id: "absence",
      label: "Naming an absence",
      question:
        "Which line should a guest read first, and does it get to name what we are not?",
      context:
        "The sheet a guest meets after scanning the code. Today's line names two absences. Bible 20 says affirmative only and is open on whether that forbids naming an absence at all, or only a sentence shaped as a denial.",
      tile: "phone",
      options: [
        {
          id: "named",
          label: "No app, no account",
          means:
            "Names both absences as bare facts. The fastest way to say the two things a guest is wary of, and the shape bible 20 questions.",
        },
        {
          id: "actions",
          label: "Nothing to install, nothing to sign up for",
          means:
            "Names the two actions skipped rather than the two things missing, which is how the home page already says it. Longer, and still built out of absence.",
        },
        {
          id: "phone",
          label: "Your phone is all you need",
          means:
            "The same fact with no negative word in it: what the guest brought, instead of what they are spared. It never mentions the app or the account.",
        },
        {
          id: "roll",
          label: "Straight from your camera roll",
          means:
            "Affirms the mechanism instead of the absence. It answers the app question without raising it, and says nothing at all about an account.",
        },
      ],
      recommended: "phone",
      because:
        "It carries the same fact with no negative in it: a promise about what the guest already has rather than a list of what they are spared. Every other line on this board can then be written the same way.",
      overrule:
        "If the two words a guest is scanning for are app and account, naming them is faster than implying them, and today's line stays.",
      lands:
        "Bible 20, rewritten from the win: whether the rule forbids naming an absence at all, or only a sentence shaped as a denial.",
    },
    {
      id: "hero-sub",
      label: "The home hero's sentence",
      question: "What should the one sentence under the site's thesis do?",
      context:
        "The home page's first paragraph, under the ruled thesis and over the two buttons. It is the only place the site explains itself in full, and at 1440 it is given a 576 px measure to do it in.",
      options: [
        {
          id: "today",
          label: "No more chasing group chats",
          means:
            "How it works, then the morning it saves you. The only line on the page that names the pain, and it names it as an absence.",
        },
        {
          id: "morning",
          label: "The morning after, already in one album",
          means:
            "Today's two-sentence shape with its second half turned around: the same morning, said as what you wake up to rather than what you escape.",
        },
        {
          id: "one",
          label: "One sentence, code to album",
          means:
            "One breath: the code, what it collects and the quality it keeps. The shortest, and it lets the morning go entirely.",
        },
        {
          id: "guests",
          label: "Your guests took the best photos",
          means:
            "Opens on the guests rather than on us, so the case is made before the product is named. The only one that does not start with Partyreel.",
        },
      ],
      recommended: "morning",
      because:
        "The morning after is the half of this sentence a stranger repeats back, and it survives being turned affirmative. It is also the smallest change to a line that already works.",
      overrule:
        "If the hero has to land in one breath on the way past, the single sentence is the only one that can.",
      lands:
        "The site's one explaining sentence, and the register every page's subhead is written in after it.",
    },
    {
      id: "feature-h1",
      label: "A feature page's headline",
      question: "Which headline should a feature page open with?",
      context:
        "The H1 of /features/curation, over the real eyebrow and the registry's own subhead. Six feature pages share this grammar, so whichever wins sets how all six say what they do.",
      options: [
        {
          id: "today",
          label: "Your guests only see the good part",
          means:
            "Written from the guest's side of the host's decision. Warm and a little sly, and the good part is a judgement the page never defines.",
        },
        {
          id: "decide",
          label: "You decide what everyone sees",
          means:
            "The plainest statement of the feature, addressed to the host. Five words of power, with the warmth left to the page under it.",
        },
        {
          id: "pass",
          label: "Every photo lands. You choose.",
          means:
            "Two beats: the guests' part, then the host's. The only one that answers what happens to the photos a host does not pick.",
        },
        {
          id: "album",
          label: "The album you shaped",
          means:
            "Leads on what curation is for rather than on what it does. The longest, and the only one that is not about a control.",
        },
      ],
      recommended: "pass",
      because:
        "A host arrives at this page worried about what curation costs them, and this is the only line that answers it: nothing is lost, you choose what shows.",
      overrule:
        "If the page is there to sell control rather than explain it, five words say it and the body can carry the reassurance.",
      lands:
        "How all six feature pages state what they do: the mechanism, the power, or the outcome.",
    },
    {
      id: "pro-line",
      label: "The Pro card's line",
      question:
        "What should the line under Pro say, read beside the Free card?",
      context:
        "One sentence between the plan's name and its price on /pricing. Free's line beside it is 'Your first event, covered.', and a reader takes the pair in together, so both cards are drawn.",
      options: [
        {
          id: "again",
          label: "For hosts who host again",
          means:
            "Names the person rather than the plan. The whole upgrade argument in five words, and it says nothing about what the money buys.",
        },
        {
          id: "covered",
          label: "Every event after that, covered",
          means:
            "Mirrors the Free card's own line, so the two read as one sentence split across the pair. It owes everything to its neighbour.",
        },
        {
          id: "video",
          label: "Video, longer reels, every event",
          means:
            "Leads on what the money buys. It repeats the list underneath it, and it is the only one a reader can price against.",
        },
        {
          id: "next",
          label: "For your next event, and the one after",
          means:
            "Today's idea said as a sentence rather than a category. Warmer, longer, and it dates the upgrade to a moment rather than a habit.",
        },
      ],
      recommended: "covered",
      because:
        "The two cards are read as a pair and nothing else on the page pairs them. The mirror makes the upgrade obvious with no argument, and it keeps the Free card's own voice.",
      overrule:
        "If the card has to earn its price alone, the line that names video and the longer reel is the only one that does.",
      lands:
        "How a plan is named for a person: by who they are, by what they get, or by the moment they are in.",
    },
    {
      id: "host-empty",
      label: "A host's first screen",
      question:
        "What should a host read on their dashboard before they have made anything?",
      context:
        "The dashboard on the day a host signs up, with no events yet. The button under it already asks for the first event and the blurb already explains the code, so the title is free to do something else.",
      options: [
        {
          id: "land",
          label: "Your events land here",
          means:
            "Names the shelf and asks for nothing. It is the guest album's own empty line wearing a host's noun, which may be a voice or may be a habit.",
        },
        {
          id: "code",
          label: "One event, one code, one album",
          means:
            "Teaches the whole product in six words, at the one moment a host has nothing else to read. The button under it does the asking.",
        },
        {
          id: "start",
          label: "Start with one event",
          means:
            "An instruction, in the register the button already uses. The shortest, the least warm, and it says the same thing twice.",
        },
        {
          id: "album",
          label: "Your first album starts here",
          means:
            "Borrows the album noun the product now uses everywhere, so a host's empty screen and a guest's empty album speak with one voice.",
        },
      ],
      recommended: "code",
      because:
        "An empty screen is the one moment an app has a host's whole attention, and the button under it is already asking. Teaching costs nothing and weakens no ask.",
      overrule:
        "If a first screen should push rather than teach, the instruction is the shortest path to the button.",
      lands:
        "What the app says when it has nothing to show: it names the place, it teaches, or it asks.",
    },
    {
      id: "gate",
      label: "Asking for an email",
      question: "How should the sheet ask a guest for their email?",
      context:
        "The step on an event whose host required a verified email. It is the only friction in the guest flow, it is read standing up at a party, and the sentence has to carry the ask and the reason together.",
      tile: "phone",
      options: [
        {
          id: "today",
          label: "The host asks for a quick email check",
          means:
            "Reason first, then the cost, then the reassurance. Three clauses, and the longest sentence anywhere in the sheet.",
        },
        {
          id: "ask",
          label: "One tap first, then why",
          means:
            "The cost first and the reason second, so the fastest reader meets the ask before the explanation and loses nothing by skipping it.",
        },
        {
          id: "host",
          label: "The host keeps this to guests",
          means:
            "Two short sentences: whose choice it is, then what it costs you. It drops the reassurance about passwords entirely.",
        },
        {
          id: "just",
          label: "Just checking you are a guest",
          means:
            "States the purpose in five words and never mentions the host's setting. The friendliest, and the least precise.",
        },
      ],
      recommended: "ask",
      because:
        "A guest at a party reads one line before deciding. The ask has to be first, and the reason has to still be true when it is skipped.",
      overrule:
        "If the first reaction is why do you want my email, the reason has to lead, and the two-sentence version does it in the fewest words.",
      lands:
        "How the product asks for something it needs: the reason first, or the cost first.",
    },
    {
      id: "empty",
      label: "An empty album",
      question:
        "What should a guest read over an album with nothing in it yet?",
      context:
        "The guest album before the first upload, over the faint ghost grid, with 'Be the first to add a photo' under it. A guest reaches this seconds after scanning, so it is the first thing many of them read.",
      tile: "phone",
      options: [
        {
          id: "lands",
          label: "This is where it all lands",
          means:
            "Names the place rather than the state, and asks for nothing. The button under it carries the whole request.",
        },
        {
          id: "starts",
          label: "The album starts with you",
          means:
            "Puts the reader in the picture: it is empty because nobody has gone first, and they can. It leans on the button rather than repeating it.",
        },
        {
          id: "fills",
          label: "This album fills up fast",
          means:
            "A promise about what happens next rather than about the place. The only one that says an empty album is temporary.",
        },
        {
          id: "every",
          label: "Every photo from today lands here",
          means:
            "Today's idea made concrete: what lands and when, so the ghost grid reads as a shape waiting rather than a void.",
        },
      ],
      recommended: "starts",
      because:
        "The screen has one job, which is to get the first photo in, and this is the only line that asks for it without repeating the button under it.",
      overrule:
        "If this screen is met more often by a guest browsing than by one uploading, naming the place beats asking, and today's line stays.",
      lands:
        "What an empty surface says, here and on the host's: it names the place, it promises, or it asks the reader to start it.",
    },
    {
      id: "moment",
      label: "The upload's answer",
      question: "What should a guest be told the moment their photo has gone?",
      context:
        "The toast at the foot of the phone after an upload lands in an album the host reviews. It is on screen for about four seconds, and it is the product's only reply to the thing a guest came to do.",
      tile: "phone",
      options: [
        {
          id: "today",
          label: "Sent, waiting for host approval",
          means:
            "Reports the state in the system's own words. It tells a guest their photo is being judged, which is not what they asked about.",
        },
        {
          id: "sent",
          label: "Sent to the host",
          means:
            "Says where the photo went and stops. The shortest, and it leaves the wait unmentioned rather than explained.",
        },
        {
          id: "through",
          label: "The host waves it through",
          means:
            "Says what happens next in a guest's terms and names the host as the one who decides, which the album already tells them.",
        },
        {
          id: "got",
          label: "Got it. The host adds it.",
          means:
            "Answers the only live question, which is whether it arrived, then states the host's step as a fact rather than as a wait.",
        },
      ],
      recommended: "through",
      because:
        "A guest who uploads into a reviewed album will look for their photo and not find it. This is the only line that tells them why before they go looking.",
      overrule:
        "If a toast over a party is read in half a second, three words are all that will land, and the short one wins.",
      lands:
        "How a working moment reports itself: in the system's state, or in what the reader will see next.",
    },
  ],
});
