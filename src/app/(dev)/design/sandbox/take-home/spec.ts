import { type Control, defineExploration } from "@/components/lab/exploration";

/**
 * TAKING PHOTOS HOME, ROUND ONE (the take-home track, cut 2026-10-02).
 *
 * Will's note from his live walk, verbatim: "I was also thinking that
 * 'download all' being such an easy clickable button for guests may shoot us
 * in the foot. for the guest event page, may be easier to drop the direct
 * 'download all' in favor of hitting select then selecting all, then save (the
 * slight friction could reduce our resource expenditure massively if less
 * guests grab everything just because it's an easy 1-click, once they're
 * selecting they may as well get exactly what they want). host benefits
 * massively from everything at full quality, could also include an optimized
 * download option (like to grab everything on a phone for quick social posts,
 * not the version that gets saved to a backup hard drive to keep forever
 * later)."
 *
 * ★ THE COST WAS MEASURED BEFORE IT WAS ARGUED, AND IT IS NOT THE QUESTION.
 * R2 charges nothing for egress (r2/pricing, Oct 2026); a whole-album zip is
 * its Class B reads ($0.36 a million, about 430 for this album with the
 * Worker's check) and the export Worker's CRC over the bytes (I/O wait is not
 * billed, `workers/export/wrangler.jsonc`; $0.02 a million CPU ms), so under a
 * tenth of a cent. What the board decides is what serves a guest and a host.
 *
 * ★ THREE QUESTIONS, ONE ORDER. `guest` is how she reaches "take these home"
 * (Download all as today, Select as his note has it, a tray of the lane's own,
 * or one at a time). `save` waits on it and is drawn on the very selection her
 * way leads to (Everything, her 24, her tray's 9, one photo): what a phone's
 * Save hands over, a zip into Files as today or the share sheet into Photos, at
 * full quality or at phone size. `host` is Maya's whole album, the originals to
 * keep beside a phone-size set to post, and how the two are named and offered.
 *
 * ★ THE NUMBERS HAVE ONE HOME (`model.ts`): a real iPhone photo's bytes (2.9
 * MB, Will's own 2026-10-02 measure), phone size at 2048 px (about a fifth),
 * a party clip of 22 MB that phone size leaves as taken, and a share sheet
 * that carries up to 100 MB. Every menu row, sheet header and toast prints
 * those, so no two frames can disagree.
 *
 * ★ NEVER ASKED HERE: the atoms (identity's); the hub's head above its album
 * (event-header r2's, so the host's frames stand scrolled to the album); a
 * delayed album's wait (the-wait's). One photograph's Save is save-speed's and
 * stays as built.
 */

/** A guest meets the album on the phone she scanned the code with first. */
const GUEST_SCREEN: Control = {
  id: "guest-screen",
  label: "Screen",
  options: [
    { id: "375", label: "375, her phone" },
    { id: "1440", label: "1440, a laptop" },
  ],
  default: "375",
};

export const TAKE_HOME = defineExploration({
  id: "take-home",
  title: "Taking photos home",
  surface: "shared",
  desk: 70,
  lives: [
    "docs/systems/guest-flow.md",
    "docs/systems/uploads-and-r2.md",
    "src/components/guest/live-gallery.tsx",
    "src/components/guest/guest-action-dock.tsx",
    "src/components/app/export/export-dialog.tsx",
    "src/components/app/event-feed/event-gallery.tsx",
    "src/components/shared/media-lightbox-parts/actions.tsx",
    "src/lib/media/share-save.ts",
    "src/lib/export/walk.ts",
    "src/lib/upload/preview.ts",
    "src/lib/r2/keys.ts",
  ],
  round: {
    n: 1,
    date: "2026-10-02",
    changed:
      "Round one, from your note on Download all: how a guest takes photos home, what her Save puts on her phone, and how a host takes the whole album, at full quality or phone size.",
  },
  context:
    "Maya and Jay's wedding, the morning after: 214 photos and videos from 31 guests, the album behind the door boards' door. The guest is Priya on her iPhone; the host is Maya at her desk and on her phone. Sizes are this album's, from a real iPhone photo (2.9 MB, 12 MP), phone size at 2048 px, and clips of about 15 seconds. The phone's own share sheet, Files and Photos are drawn as diagrams, never as ours.",
  opening: {
    about:
      "How photos leave an album: a guest's way to take hers home and what her Save gives, and a host's whole album, to keep or to post.",
    settled: [
      "Cost is not the question: R2 sends every byte free, and a whole album's zip costs its reads and a few Worker seconds, under a tenth of a cent.",
      "One photo's Save stays as built: the viewer already holds its original, so the share sheet opens inside the tap.",
      "Every download keeps its walk: one toast that counts, can be stopped, and says Saved when the last byte has left.",
      "The album, its cover and the shutter are drawn as built; the hub's head is event-header's question, a delayed album's wait the-wait's.",
    ],
    earlier: [
      "'Download all being such an easy clickable button for guests may shoot us in the foot.'",
      "'The slight friction could reduce our resource expenditure massively if less guests grab everything just because it's an easy 1-click.'",
      "'Once they're selecting they may as well get exactly what they want.'",
      "'Host benefits massively from everything at full quality, could also include an optimized download option.'",
      "'To grab everything on a phone for quick social posts, not the version that gets saved to a backup hard drive to keep forever later.'",
    ],
  },
  terms: [
    {
      term: "phone size",
      means:
        "A photo made 2048 px on its long side: about a fifth of its original bytes, the size a phone shows and a post takes.",
    },
    {
      term: "originals",
      means:
        "Each photo and clip exactly as the guest's phone took it, full size: what a print or a drive keeps.",
    },
    {
      term: "share sheet",
      means:
        "The phone's own panel for keeping or sending a file; on an iPhone it holds Save Image, the web's one way into Photos.",
    },
    {
      term: "zip",
      means:
        "One file holding many; on a phone it lands in the Files app, and its photos never reach Photos.",
    },
    {
      term: "select mode",
      means:
        "The album with a check on every photo, so a tap picks it instead of opening it.",
    },
    {
      term: "tray",
      means:
        "Her picks, gathered as she looks, waiting at the album's foot until one Save takes them all.",
    },
    {
      term: "shutter",
      means:
        "The round Add photos at the foot's centre, ringed in the album's light; its ring fills as files go.",
    },
    {
      term: "walk",
      means:
        "A download's one toast: it counts, can be stopped, and says Saved once the last byte has left.",
    },
  ],
  carried: [
    {
      id: "size",
      question: "How big is phone size?",
      taken:
        "2048 px on its long side, as a JPEG: sharp in any post and on any phone, about a fifth of an original's bytes.",
      overrule:
        "1080 px, a post's own width (lighter still), or 3072 px (nearer a print's).",
    },
    {
      id: "made",
      question: "Where is a phone-size copy made?",
      taken:
        "In the uploader's browser beside the tile's preview, as previews are: no fee and no new service, about 20% more storage.",
      overrule:
        "On the way out, by Cloudflare's image transforms: no stored copy, $0.50 per 1,000 photos a month.",
    },
    {
      id: "clips",
      question: "What does phone size do to a clip?",
      taken:
        "Leaves it as taken: a phone's clip is already the size a post takes, and remaking one is a paid transform.",
      overrule:
        "1080p copies made on the way out ($0.50 per 1,000 seconds a month, clips under a minute).",
    },
    {
      id: "sheet",
      question: "How much does one share sheet carry?",
      taken:
        "Up to 100 MB, the product's line for a big file; past it a Save goes in parts, a tap each, as a big zip already does.",
      overrule:
        "A fixed 20 photos a sheet, or the whole set in one sheet whatever it weighs.",
    },
    {
      id: "desk",
      question: "What does a guest's Save give at a desk?",
      taken:
        "One zip of the originals, through today's walk; a single photo downloads as itself.",
      overrule: "Each photo as its own download, or phone size at a desk too.",
    },
    {
      id: "yours",
      question: "Where does Yours go once Download all leaves?",
      taken:
        "Into select mode, beside All: one press picks every photo of hers.",
      overrule: "A Yours row of its own, outside select mode.",
    },
  ],
  asks: [
    {
      id: "guest",
      label: "A guest's way home",
      question: "How should a guest take photos home from the album?",
      where: ["Guest", "The album", "Taking photos home"],
      when: "Priya opens Maya and Jay's album on her iPhone the morning after: 214 photos and videos, 12 of them hers.",
      matters:
        "It is the last thing a guest does with an album, and the reason most open it again after the night.",
      lands:
        "The album's count row (Download all or Select), its select mode, a tray if it has one, and the viewer's capsule.",
      context:
        "Two frames each: the way in, on the album as built, then the act, ready to press. Screen shows a laptop. Every way costs the platform alike: a few reads a photo, under a tenth of a cent an album.",
      options: [
        {
          id: "today",
          label: "Download all, as today",
          means:
            "The count row's Download all opens its menu: Yours, Everything, Photos, Videos. A row is a zip of the originals.",
          gains:
            "Everything in two presses, and Yours brings back her own in two.",
          costs:
            "Most take 964 MB to keep a dozen, and on a phone the zip lands in Files.",
        },
        {
          id: "select",
          label: "Select, then Save",
          means:
            "Select puts a check on every photo; she taps the ones she wants, or All or Yours, and the shutter turns to Save them.",
          gains:
            "Exactly what she wants, the way every photo app selects; everything is three presses.",
          costs:
            "Everything takes a press more, and select mode is one more state to build.",
        },
        {
          id: "tray",
          label: "Gather as she looks",
          means:
            "A + beside Save in the viewer gathers a photo into her tray at the album's foot; one Save takes the tray home.",
          gains:
            "She judges each photo full size, and her tray waits for her across visits.",
          costs:
            "A new idea to learn, and everything means opening every photo.",
        },
        {
          id: "viewer",
          label: "One at a time",
          means:
            "No way to take many: the viewer's Save, one photo at a time; the whole album is the host's to share.",
          gains: "The quietest album: nothing new, and every save is chosen.",
          costs:
            "Twenty photos is twenty saves, each its own sheet on an iPhone.",
        },
      ],
      recommended: "select",
      today: "today",
      because:
        "She takes exactly what she wants, in the grammar every photo app already taught her.",
      overrule:
        "If everything in one press matters most, keep Download all; to judge each photo full size, the tray.",
      configs: [GUEST_SCREEN],
    },
    {
      id: "save",
      label: "What her Save gives",
      question: "When she saves several on her phone, what should she get?",
      where: ["Guest", "The album", "Saving on her phone"],
      when: "Priya has picked the photos she wants on her iPhone and pressed Save.",
      matters:
        "Photos is where she keeps and posts from; a zip lands in Files, an app most never open for photos.",
      lands:
        "What a phone's Save hands over (a zip, or the share sheet), and whether a phone-size copy is made.",
      context:
        "Three frames each, drawn on the way you pick above (Select's 24, Download all's whole album, the tray's 9): the wait after Save, the hand-off, and where her photos live after.",
      options: [
        {
          id: "zip",
          label: "One zip, as today",
          means:
            "Her originals as one file in Files: she unzips them there, and Photos never sees them.",
          gains: "Full quality in one file, the way a desk keeps an album.",
          costs: "On a phone it is a file to open, not photos to see or post.",
        },
        {
          id: "photos",
          label: "Into Photos, full quality",
          means:
            "Her originals through the phone's share sheet (Save 24 Images), up to 100 MB a sheet.",
          gains: "Photos she can see and post at once, every pixel kept.",
          costs:
            "Five times phone size's bytes: slow on a party's network, heavy on her phone.",
        },
        {
          id: "light",
          label: "Into Photos, phone size",
          means:
            "The same share sheet with each photo at phone size, 2048 px: a fifth of the bytes, sharp in any post.",
          gains:
            "Seconds on any network, light on her phone, sharp in every post.",
          costs:
            "Too small for a big print: the originals stay a desk's, as a zip.",
        },
      ],
      recommended: "light",
      today: "zip",
      because:
        "She saves to post and to keep on her phone, and phone size gets her picks there in seconds.",
      overrule:
        "If a guest's Save must always be the original, full quality into Photos.",
      after: { ask: "guest" },
    },
    {
      id: "host",
      label: "A host's take-home",
      question: "How should Maya take the whole album home?",
      where: ["Host", "Her event's album", "Taking everything home"],
      when: "The party is over: Maya opens her event's album at her desk, and later on her phone, to take all 214 home.",
      matters:
        "She keeps every original for good and posts tonight's best from her phone: two jobs, two sizes.",
      lands:
        "The hub album's Download (its menu, or a panel), the phone-size set, and the words each is offered in.",
      context:
        "Each option at her desk (1440) and on her phone (375), the Download open on the hub's album as built. This album is 964 MB of originals; phone size makes its photos 108 MB, and its 18 clips stay as taken.",
      options: [
        {
          id: "today",
          label: "One Download, the originals",
          means:
            "The album's Download opens its menu: Everything, Photos, Videos, each one zip of the originals; Include hidden items flips in place.",
          gains: "Built, and every original in two presses.",
          costs:
            "On her phone it is a 964 MB zip in Files, not photos to post.",
        },
        {
          id: "sizes",
          label: "One menu, two sizes",
          means:
            "The same menu with Originals or Phone size at its head, every row's size following; a phone opens on Phone size.",
          gains: "The smallest change: one door, and the size is a switch.",
          costs: "A choice to read each time, and Phone size is a new word.",
        },
        {
          id: "two",
          label: "Keep and post, named for use",
          means:
            "Download opens a panel of two, each pictured by the album: Originals, to keep for good, and Phone size, to post tonight.",
          gains:
            "Each set says what it is for, its size and where it goes, at a glance.",
          costs:
            "A panel rather than a menu: one more surface to build and read.",
        },
        {
          id: "device",
          label: "Each screen its own",
          means:
            "A desk's Download takes the originals and a phone's takes phone size into Photos; the other is one quiet line away.",
          gains: "No decision at all: each screen gets what it is for.",
          costs:
            "One button gives two things, and originals on a phone hide a line down.",
        },
      ],
      recommended: "two",
      today: "today",
      because:
        "Two jobs, two sets, each named for what it is for: the originals to keep, phone size to post tonight.",
      overrule:
        "If a host should never meet a choice, each screen its own; for the smallest change, one menu.",
    },
  ],
});
