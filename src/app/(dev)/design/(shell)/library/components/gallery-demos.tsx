import {
  Calendar,
  Clapperboard,
  Compass,
  Eye,
  EyeOff,
  Heart,
  ImageUp,
  Images,
  LayoutGrid,
  ListChecks,
  Play,
  Plus,
  QrCode,
  Rows3,
  Settings,
  Share2,
  Table2,
  Trash2,
  Users,
  Video,
} from "lucide-react";

import {
  GalleryEmptyState,
  GUEST_GHOST_FRAMES,
} from "@/components/guest/gallery-empty-state";
import {
  LiveAlbum,
  LiveAlbumStage,
} from "@/components/marketing/sections/features/album/live-album-stage";
import { AlbumStream } from "@/components/shared/album-stream/album-stream";
import {
  QR_DOOR_FRAMES,
  QR_DOOR_SIZES,
} from "@/components/shared/river/qr-door-frames";
import {
  qrRiverOrigin,
  QrRiverPlate,
} from "@/components/shared/river/qr-plate";
import { River } from "@/components/shared/river/river";
import { Trail } from "@/components/shared/trail/trail";
import { StyledQr } from "@/components/app/styled-qr";
import { resolveQrPreset } from "@/lib/constants/qr-presets";
import {
  Avatar,
  AvatarBadge,
  AvatarFallback,
  AvatarGroup,
  AvatarGroupCount,
} from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CodeChip } from "@/components/ui/code-chip";
import { CodeMat } from "@/components/ui/code-mat";
import { Empty } from "@/components/ui/empty";
import { GlyphCount } from "@/components/ui/glyph-count";
import { Shutter } from "@/components/ui/shutter";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuFooter,
  DropdownMenuGroup,
  DropdownMenuHeader,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuMeta,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import type { GalleryEntry } from "@/app/(dev)/design/gallery/entry";
import { Row } from "@/app/(dev)/design/reference/reference-ui";
import {
  CommandPaletteDemo,
  ConfirmSwitchDemo,
  AtTheFoot,
  OnAPhoto,
  ShutterDemo,
  ConsequenceLineDemo,
  DormantDemo,
  DestructiveSheetDemo,
  EmptyAlbumDemo,
  FormDemo,
  OtpDemo,
  PasswordStrengthDemo,
  RelationToggleDemo,
  TapTooltipDemo,
  ToastDemo,
  WorkingButtonDemo,
} from "./interactive-demos";
import { DialogSheetDemo } from "./overlay-demos";
import { PhotoSectionDemo } from "./photo-section-demos";
import {
  ArrivalGuardDemo,
  PopupKindDemo,
  PopupSizeSample,
} from "./popup-demos";
import { DisplayMenuDemo } from "./toggle-group-demo";

/**
 * THE PRIMITIVES, declared (the gallery round, 2026-09-12).
 *
 * Every specimen here is the REAL primitive imported from production: edit a
 * component and this updates. What is new is the DECLARATION around it. An
 * entry carries the component's variants as data, so the gallery can render a
 * matrix and the guard can check the list against the component's own cva
 * block or prop union. That check paid for itself on the first pass: the old
 * page showed five Badge variants of six and four Button sizes of eight, and
 * nobody could see the gap, because the page was a document rather than a
 * model of the component.
 */

/**
 * THE GROUND THE ALBUM STREAM SHIPS ON. Both specimens below are marketing
 * pieces and the library's components page is the app's skin, so they are given
 * the cinema chapter they are drawn for; without it the halo has no dark to
 * spill into and the frames have no room to read against.
 */
function CinemaGround({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="dark rounded-lg bg-background p-4 text-foreground"
      data-mkt=""
      data-mkt-skin="cinema"
    >
      {children}
    </div>
  );
}

/**
 * THE QR DOOR'S PICTURE SLOT, drawn exactly as `feature-door.tsx` composes it:
 * the ink ground, the flow born at the code's centre between the door's two
 * scrims, and the plate over everything. The door's own scrims and copy are on
 * its entry (/design/library/marketing); what this shows is the picture, at the
 * two widths a door is really drawn at. `rvr-ink` is the placement's ground,
 * not the theme's: `--shadow-lift` is per theme, and on a light page it is a
 * dark shadow that vanishes against ink.
 */
const DOOR_RATIO = 5 / 4;

function QrDoorPicture({ width }: { width: number }) {
  return (
    <div
      className="relative overflow-hidden rounded-xl bg-[oklch(0.13_0_0)]"
      style={{ width, aspectRatio: `1 / ${DOOR_RATIO}` }}
    >
      <River
        className="rvr-ink"
        frames={QR_DOOR_FRAMES}
        ratio={DOOR_RATIO}
        origin={qrRiverOrigin(DOOR_RATIO)}
        sizes={QR_DOOR_SIZES}
      />
      <QrRiverPlate ratio={DOOR_RATIO} value="https://partyreel.com/demo" />
    </div>
  );
}

const buttonSizes = [
  "xs",
  "sm",
  "default",
  "lg",
  "cta",
  "icon",
  "icon-xs",
  "icon-sm",
  "icon-lg",
  // The 44px round (`event-header` r1): a cover's glass rounds and the shutter's flanks.
  "icon-cta",
];

const badgeVariantNames = [
  "default",
  "secondary",
  "destructive",
  // The other three states, added when the admin's `colour=rows` gave the
  // portal four voices instead of one red (admin-wiring, 2026-09-20).
  "success",
  "warning",
  "info",
  "outline",
  "ghost",
  "link",
  // The live mark (`event-header` r1, the atom contract with identity r2).
  "live",
];

/** A code that scans, as the hub's mat and the help's pictures draw one: a fixed address, the house's classic look. */
const SPECIMEN_CODE =
  "https://partyreel.com/e/3f0c1d2e4a5b6c7d8e9f0a1b2c3d4e5f";

/**
 * THE TRAIL'S WORDS (the trail-wiring lane, 2026-09-19). The shape of the 404's
 * own block rather than the block itself: the real one carries an <h1> and two
 * <Link>s, and a specimen may not put a heading in the library page's outline or
 * a way out of the page under a reader's cursor. What the specimen is for is the
 * SHY FADE, so what it needs is type of the 404's sizes in the 404's places.
 */
function TrailWords() {
  return (
    <div className="flex max-w-md flex-col items-center gap-5 text-center">
      <div className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <Compass className="size-6" aria-hidden />
      </div>
      <div className="flex flex-col gap-3">
        <p className="text-sm font-medium text-brand">404</p>
        <p className="font-heading text-prose text-balance">
          We lost this page
        </p>
        <p className="text-pretty text-muted-foreground">
          The link may be broken or the page may have moved. Let us point you
          back to Partyreel.
        </p>
      </div>
      <div className="flex flex-col gap-3 sm:flex-row">
        <Button size="cta">Back home</Button>
        <Button size="cta" variant="outline">
          Visit the help center
        </Button>
      </div>
    </div>
  );
}

/**
 * One Tuesday's runs, the fixture the retired `admin` board drew them from:
 * eight rows, two of which failed. It is a real table of the real primitive, so
 * what the library shows is the tone rules doing their job rather than a
 * description of them.
 */
const RUNS: {
  started: string;
  job: string;
  outcome: "Succeeded" | "Failed" | "Skipped" | "Running";
  took: string;
}[] = [
  { started: "04:00", job: "Purge sweep", outcome: "Failed", took: "12s" },
  { started: "04:00", job: "Purge orphans", outcome: "Succeeded", took: "4s" },
  { started: "05:00", job: "Backup reconcile", outcome: "Running", took: "" },
  { started: "06:00", job: "Backup prune", outcome: "Skipped", took: "" },
  {
    started: "06:30",
    job: "Database backup",
    outcome: "Succeeded",
    took: "31s",
  },
];

const RUN_TONE = {
  Failed: "destructive",
  Succeeded: undefined,
  Skipped: undefined,
  Running: undefined,
} as const;

const RUN_CHIP = {
  Failed: "destructive",
  Succeeded: "success",
  Skipped: "outline",
  Running: "info",
} as const;

function AdminRunsTable() {
  return (
    <div className="w-full overflow-hidden rounded-float border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Started</TableHead>
            <TableHead>Job</TableHead>
            <TableHead>Outcome</TableHead>
            <TableHead className="text-right">Took</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {RUNS.map((run) => (
            <TableRow key={run.job} tone={RUN_TONE[run.outcome]}>
              <TableCell className="text-muted-foreground tabular-nums">
                {run.started}
              </TableCell>
              <TableCell>{run.job}</TableCell>
              <TableCell>
                <Badge variant={RUN_CHIP[run.outcome]}>{run.outcome}</Badge>
              </TableCell>
              <TableCell className="text-right text-muted-foreground tabular-nums">
                {run.took}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

export const COMPONENT_ENTRIES: GalleryEntry[] = [
  /* THE EVENT'S HEAD, ITS ATOMS (added by lp/header-wiring at the HEAD of the list, under a heading of
     its own, so it lands on its own hunk). The atom contract with identity r2: every hook below is one
     its board styles (`data-slot="shutter"` and its `data-state` and `--progress`, `data-surface="photo"`,
     Button's `on-photo` and `glass`, `data-slot="code-mat"`, `data-slot="code-chip"`,
     `data-slot="glyph-count"`, Badge's `live`). */
  {
    id: "shutter",
    file: "src/components/ui/shutter.tsx",
    for: "the album's one round Add once the cover has scrolled away, in the album's light: its ring is the progress of hers on their way",
    test: "src/components/ui/shutter.test.tsx",
    badge: "new",
    family: "components",
    section: "The event's head",
    title: "Shutter",
    lede: "The round Add at the foot of an album (`stays=shutter`): a camera's gesture, the least over the photographs, in the thumb's reach. At rest its ring is the album's own light with a soft glow under it; while files go, the same light fills round from the top as the run moves, the count still on its way on its shoulder; when a run lands it stands whole with a check for a beat, then rests. Still a button in every state (a press while files go adds more), and its name says the count. Reduced motion keeps the ring and the fill and drops the glow's breath and the glide.",
    variants: [
      {
        prop: "state",
        source: "prop",
        fallback: "idle",
        options: ["idle", "sending", "done"],
        note: "The caller's word, never guessed: `sending` while a run goes, `done` for the beat after one lands, then `idle`.",
        sample: (o) => (
          <Shutter
            state={o as "idle"}
            progress={o === "sending" ? 0.62 : 0}
            count={o === "sending" ? 3 : 0}
            aria-label="Add photos"
          />
        ),
      },
    ],
    specimens: [
      {
        label: "Press it",
        hint: "a run of three of the Library's own: the ring fills, the count goes down, the check, then rest",
        node: (
          <Row>
            <ShutterDemo />
          </Row>
        ),
      },
      {
        label: "In the album's light",
        hint: "`hues`: an album's sampled light (here a wedding's warm three), the house five where it has none",
        node: (
          <Row>
            <Shutter aria-label="Add photos" />
            <Shutter aria-label="Add photos" hues={[45, 20, 350]} />
            <Shutter aria-label="Add photos" hues={[250, 290, 200]} />
          </Row>
        ),
      },
      {
        label: "At the foot, over the album",
        hint: "Invite and its twin flank it, the album's own ground rising under them while more lies below",
        node: (
          <AtTheFoot>
            <div className="flex items-center gap-5">
              <Button
                variant="outline"
                size="icon-cta"
                aria-label="Invite"
                className="bg-background shadow-layer"
              >
                <QrCode />
              </Button>
              <ShutterDemo hues={[45, 20, 350]} />
              <Button
                variant="outline"
                size="icon-cta"
                aria-label="Watch the highlight reel"
                className="bg-background shadow-layer"
              >
                <Play className="fill-current" />
              </Button>
            </div>
          </AtTheFoot>
        ),
      },
    ],
  },
  {
    id: "glyph-count",
    file: "src/components/ui/glyph-count.tsx",
    for: "a count as an icon and a number on a head, its words on hover, a keyboard's focus and a tap",
    test: "src/components/ui/glyph-count.test.tsx",
    badge: "new",
    family: "components",
    section: "The event's head",
    title: "GlyphCount",
    lede: "Will's note on the code's mark, taken by the heads: icons work nearly every time, and a tooltip clarifies. The glance is the glyph; the words are the button's name and its tooltip, which a tap opens and shuts too (the tooltip primitive refuses a finger on purpose, so the atom answers it). The number is a readout in the camera's voice (the `label` step, semibold, tabular figures) in the ground's ink, the glyph a step back in the muted grey; on a photograph both are white.",
    specimens: [
      {
        label: "On paper",
        hint: "hover, focus or tap one for its words",
        node: (
          <Row>
            <span className="flex items-center gap-3 text-sm text-muted-foreground">
              <GlyphCount
                icon={<Images />}
                count={214}
                label="214 photos & videos"
              />
              <GlyphCount icon={<Users />} count={31} label="31 guests" />
              <GlyphCount icon={<Eye />} count={486} label="486 views" />
            </span>
          </Row>
        ),
      },
      {
        label: "On a photograph",
        hint: '`data-surface="photo"`: the glyph and the number white',
        node: (
          <OnAPhoto>
            <span className="flex items-center gap-3 text-sm text-white/85">
              <GlyphCount
                icon={<Images />}
                count={1240}
                label="1,240 photos & videos"
              />
              <GlyphCount icon={<Users />} count={58} label="58 guests" />
            </span>
          </OnAPhoto>
        ),
      },
    ],
  },
  {
    id: "code-mat",
    file: "src/components/ui/code-mat.tsx",
    for: "a scannable code standing on its white mat, wherever it stands: the hub's head on its cover, scannable from across a table",
    test: "src/components/ui/code-mat.test.tsx",
    badge: "new",
    family: "components",
    section: "The event's head",
    title: "CodeMat",
    lede: "A code that scans is always on white with its quiet zone, on paper, in the room and on a photograph alike: the mat is that rule as an object. Always a button (a mat opens the code's card), and dimmed is the code's alone, the white staying, for a door that takes no photo. A corner mark rides beside it, never on the modules.",
    specimens: [
      {
        label: "Bright, and dimmed",
        hint: "`dimmed`: paused uploads or Only me fade the modules, never the mat",
        node: (
          <Row>
            <CodeMat aria-label="Show the code for Maya & Jay">
              <StyledQr
                value={SPECIMEN_CODE}
                size={112}
                style={resolveQrPreset("classic")}
              />
            </CodeMat>
            <CodeMat aria-label="Show the code for Maya & Jay" dimmed>
              <StyledQr
                value={SPECIMEN_CODE}
                size={112}
                style={resolveQrPreset("classic")}
              />
            </CodeMat>
          </Row>
        ),
      },
      {
        label: "On the cover",
        hint: "the hub's head: the code in the cover's corner",
        node: (
          <OnAPhoto still="reception-hall" className="justify-end">
            <CodeMat aria-label="Show the code for Maya & Jay">
              <StyledQr
                value={SPECIMEN_CODE}
                size={112}
                style={resolveQrPreset("classic")}
              />
            </CodeMat>
          </OnAPhoto>
        ),
      },
    ],
  },
  {
    id: "code-chip",
    file: "src/components/ui/code-chip.tsx",
    for: "the code as a chip in the hub's sticky band, once the head's code has scrolled away: one press from the code, never a shrunken one",
    test: "src/components/ui/code-chip.test.tsx",
    badge: "new",
    family: "components",
    section: "The event's head",
    title: "CodeChip",
    lede: "Under the module floor a code cannot scan, so a thumbnail that looked like a code would be a code that does not work. The chip is the code's glyph on the white a code stands on, at the band's own height, and a press opens the real one.",
    specimens: [
      {
        label: "In the band",
        hint: "the stuck pills, then the code",
        node: (
          <div className="flex items-center gap-2 rounded-xl border bg-background/85 p-2">
            <span className="flex h-9 items-center gap-1.5 rounded-xl border border-border px-3 text-xs font-medium">
              <Clapperboard
                className="size-4 text-muted-foreground"
                aria-hidden
              />
              Highlight reel
            </span>
            <span className="flex h-9 items-center gap-1.5 rounded-xl border border-border px-3 text-xs font-medium">
              <ListChecks
                className="size-4 text-muted-foreground"
                aria-hidden
              />
              Review
            </span>
            <CodeChip aria-label="Show the code for Maya & Jay" />
          </div>
        ),
      },
    ],
  },
  /* THE ONE RELATION CONTROL (added by lp/crumbs-44 at the HEAD of the list, under a heading of its
     own, so it lands on its own hunk). */
  {
    id: "relation-toggle",
    file: "src/components/social/relation-toggle.tsx",
    for: "every face of following or blocking a person, on one contract: the flip at once, the ask before a block, a refusal sprung back with the server's words, the page re-read by the Server Function itself",
    test: "src/components/social/relation-toggle.test.tsx",
    badge: "new",
    family: "components",
    section: "People",
    title: "RelationToggle",
    lede: "The one control behind Follow and Block. The profile's Follow, the quieter Follow beside an album, the profile menu's Block row and the Connections card's rows were three hand-rolled controls with three sets of manners; each is a face of this now. A press flips at once and takes no second press while it runs, turning a block on asks first, a refusal springs back and says why, and a landed flip says nothing, because the control shows it. Every write here is the Library's own and lands or refuses after a beat, so no press reaches a row.",
    variants: [
      {
        prop: "relation",
        source: "prop",
        options: ["follow", "block"],
        note: "Follow is a toggle whose label is its state (Follow, Following); Block names its act in both states (Block, Unblock) and asks before it blocks.",
      },
    ],
    specimens: [
      {
        label: "Follow, the profile's own",
        hint: "filled until it is on, then the outline Following; press either and it flips at once, then lands",
        node: (
          <Row>
            <RelationToggleDemo relation="follow" />
            <RelationToggleDemo relation="follow" on />
          </Row>
        ),
      },
      {
        label: "The quieter Follow, beside an album's own actions",
        hint: "`quiet`: the small ghost in the muted ink, naming whom it follows where nothing beside it does",
        node: (
          <Row>
            <RelationToggleDemo relation="follow" quiet size="xs" label="Tom" />
            <RelationToggleDemo
              relation="follow"
              quiet
              size="xs"
              label="Tom"
              on
            />
          </Row>
        ),
      },
      {
        label: "Block and Unblock, a Connections row's size",
        hint: "Block asks first (the one copy of what a block does); Unblock acts at once",
        node: (
          <Row>
            <RelationToggleDemo relation="block" size="sm" />
            <RelationToggleDemo relation="block" size="sm" on />
          </Row>
        ),
      },
      {
        label: "A refusal",
        hint: "this write refuses: the control springs back and the server's words arrive in one toast",
        node: <RelationToggleDemo relation="follow" refuses />,
      },
    ],
  },
  /* THE PORTAL'S THREE NEW PARTS (added by lp/admin-wiring at the HEAD of the
     list, so several lanes in one round land on distinct hunks). The admin is
     the one surface in the product nothing automated can sign into, so these
     specimens are the only eye `lab:smoke` has on them. */
  {
    id: "table",
    file: "src/components/ui/table.tsx",
    for: "the portal's dense row, and the only table in the product: `tone` writes `data-tone`, and `tableRowVariants` is the same rule set the inbox list and the home's queue wear on an <li>, so a failed run tints identically wherever it is drawn",
    test: "src/components/ui/table.test.tsx",
    badge: "new",
    family: "components",
    // ★ A SECTION OF THEIR OWN, and not "Surfaces" and "Overlays". A family
    // page groups by section in FIRST-APPEARANCE order, so an entry added at
    // the head under a heading that already exists further down opens a second
    // block with the same key: React drops one of them, silently. A lane adds
    // at the head (so several lanes land on distinct hunks) and therefore
    // brings its own heading.
    section: "The operations portal",
    title: "Table",
    lede: "The portal's dense row, and the one thing it adds to shadcn's: `tone` as a data attribute, so a failed run tints its own row and takes a leading edge, which makes it harder to miss. The same rules ride an <li> in the inbox list and the home's queue, which is why they are scoped by data value rather than split into four class strings.",
    specimens: [
      {
        label: "Recent runs",
        hint: "four states in the chip, and the tint on the two that are worth finding by scrolling",
        node: <AdminRunsTable />,
      },
    ],
  },
  {
    id: "command-palette",
    file: "src/components/ui/command-palette.tsx",
    for: "a combobox in a dialog and nothing else: no index, no ranking, no router, no skin. The active row is read from the DOM rather than a registry, because the order an arrow key means is the order a reader sees",
    test: "src/components/ui/command-palette.test.tsx",
    badge: "new",
    family: "components",
    section: "The operations portal",
    title: "CommandPalette",
    lede: "A combobox in a dialog, and nothing else: no index, no ranking, no router and no skin. The help centre shipped one of these welded to the help library; this is the mechanism on its own, so the admin's ⌘K and any future palette are call sites. The active row is found in the DOM rather than in a registry, so the order an arrow key means is the order a reader sees.",
    specimens: [
      {
        label: "Opened",
        hint: "arrows move, Enter opens the highlighted row, Esc closes; the first row is active before a key is pressed, so Enter always does something",
        node: <CommandPaletteDemo />,
      },
    ],
  },
  {
    id: "destructive-sheet",
    file: "src/components/admin/destructive-sheet.tsx",
    for: "the ONE panel every destructive act in the portal opens, sized to the damage: it lists what an act touches before it happens, and only a permanent act with something to identify asks you to type. `GuardedSwitch` beside it is the same panel on a kill switch's OFF edge, since turning one back on is free",
    test: "src/components/admin/destructive-sheet.test.tsx",
    badge: "new",
    family: "components",
    section: "The operations portal",
    title: "DestructiveSheet",
    lede: "One panel for every destructive act in the portal, sized to the damage: every act lists what it touches before it happens, and only the permanent one makes you type, so the friction follows the severity.",
    specimens: [
      {
        label: "Reversible, and permanent",
        hint: "the same panel twice: the pause asks for nothing, the deletion asks for the address it is about to delete; both confirmations here resolve without touching anything",
        node: <DestructiveSheetDemo />,
      },
    ],
  },
  /* THE ALBUM STREAM (added by lp/album-wiring at the HEAD of the list, so the
     three lanes of this round can each add their own without touching
     another's; the Orchestrator keeps every side at the merge). */
  {
    id: "album-stream",
    file: "src/components/shared/album-stream/album-stream.tsx",
    for: "photographs falling out of the room around a hero's words and into the album beneath it, each one taken in as an upload; decorative, and its resting frame is server HTML so a reader with no script still meets the composition",
    test: "src/components/shared/album-stream/album-stream.test.tsx",
    badge: "new",
    family: "components",
    section: "Surfaces",
    lede: "Photographs falling out of the room around a hero's words, drawn in and dissolving at the album beneath it as the album takes each one in the way it takes an upload, its row opening from the left; and the album they fall into: the guest album's own rows under the host's own header, its foot dissolving, lit from behind by the Glow halo.",
    specimens: [
      {
        label: "The album, at the scale's 896 step",
        hint: "the halo lights the frame's rim, its window bar and the header type from BEHIND, so the photographs stay exactly as they are; the foot dissolves under a mask rather than a scrim, so the album reads as going on",
        node: <CinemaGround>{<LiveAlbumStage />}</CinemaGround>,
      },
      {
        // ★ ITS COMPOSITION IS THE HERO'S OWN WIDTH, which a library column is
        // not: every horizontal in the engine is a share of the hero's
        // half-width, and the layer reads that from its own box. So this block
        // is pinned to 1280, the narrowest window the side-band composition
        // serves, and the page itself is where it is judged.
        label: "and the fall into it",
        hint: "1280, the narrowest window this composition serves, over the album that takes each photograph in (one LiveAlbum holds it for both). Decorative and inert: nothing in it is focusable, every frame carries its resting position as server HTML, and reduced motion leaves that resting frame standing with no loop at all",
        node: (
          <div className="max-w-full overflow-x-auto">
            <CinemaGround>
              <LiveAlbum>
                <div
                  className="relative isolate overflow-x-clip"
                  style={{ width: 1280 }}
                >
                  <AlbumStream />
                  <div style={{ height: 520 }} />
                  <LiveAlbumStage />
                  <div style={{ height: 150 }} />
                </div>
              </LiveAlbum>
            </CinemaGround>
          </div>
        ),
      },
    ],
  },
  // ★ THE IMAGE TRAIL, at the head of the entries because three wiring lanes add
  // one this round and each landing at the top is what keeps the three merges
  // apart; the Orchestrator keeps all of them. Declared INLINE rather than as a
  // named const: collect-specimens.mjs lifts each specimen's `node` expression
  // out of this array's own source, and an entry hoisted into a variable would
  // render perfectly and ship with no code panel.
  {
    id: "trail",
    file: "src/components/shared/trail/trail.tsx",
    for: "photographs laid down behind a cursor, or behind a figure walked on its own; decorative, and the words it is given stand inside it rather than over it",
    test: "src/components/shared/trail/trail.test.tsx",
    badge: "new",
    family: "components",
    section: "Surfaces",
    lede: "Photographs laid down behind a moving point, each sliding after it and then fading and shrinking away where it lies, thrown the way the hand went; the root 404 is where it lives today. It is decorative, it takes no pointer, and it never lays anything over the words: inside their own box a photograph yields instead, which keeps the type the loudest thing on the screen.",
    specimens: [
      {
        label: "On paper, under a cursor",
        hint: "draw across it. A photograph is born every time the hand has travelled far enough, arrives BEHIND the cursor and turns the way it was thrown. Stop moving and the newest one simply stays with you (the keeper) while the trail behind it goes, and the loop stops asking for frames entirely while it stands.",
        node: (
          <div className="surface-paper overflow-hidden rounded-lg border bg-background text-foreground">
            <Trail
              source="pointer"
              className="flex min-h-[26rem] flex-col items-center justify-center px-6 py-12"
            >
              <TrailWords />
            </Trail>
          </div>
        ),
      },
      {
        label: "and walking its own figure at a phone",
        hint: "375 px, where there is no cursor and a drag is a scroll: the trail walks a wander of its own at the same pace, alive the moment the page opens and asking nothing of a finger. The figure never repeats inside a visit and opens somewhere else on the next one.",
        node: (
          <div
            className="surface-paper overflow-hidden rounded-lg border bg-background text-foreground"
            style={{ width: 375 }}
          >
            <Trail
              source="path"
              className="flex min-h-[32rem] flex-col items-center justify-center px-5 py-12"
            >
              <TrailWords />
            </Trail>
          </div>
        ),
      },
      {
        label: "With nothing to stay off",
        hint: "no children, so no words are measured and no photograph yields anywhere: the trail whole, which is what a placement that puts its own copy beside it would get. This is also the one to watch the decay in, three seconds from laid down to gone.",
        node: (
          <div className="overflow-hidden rounded-lg border">
            <Trail source="pointer" className="min-h-[22rem]" />
          </div>
        ),
      },
    ],
  },
  {
    id: "qr-plate",
    file: "src/components/shared/river/qr-plate.tsx",
    for: "the real scannable code a river is born from inside a feature door; server-rendered, no link and no label, and sized off its own value so a module never drops under the scan floor",
    test: "src/components/shared/river/qr-plate.test.tsx",
    badge: "new",
    family: "components",
    section: "Surfaces",
    title: "The QR door's picture",
    lede: "The album pouring out of a real scannable code, which is what fills the QR feature door: the code near the top of the tall door, the whole card streaming behind the copy, and /demo as what it opens. Every length is a fraction of the door's width, so the code, the birth point and the flow agree at any size with nothing measured and no resize listener.",
    specimens: [
      // The two widths the door is really drawn at: (1024 - 32) / 3 in the
      // /features grid at 1440, and 375 minus the site's gutters on a phone.
      // Fixed on purpose: the WIDTH is what the scan floor is measured
      // against, and a library frame is as wide as the window.
      {
        label: "The tall door's picture at 1440",
        hint: "331px: the code lands on 30% of the door, which is its 99px scan floor at exactly this width, and the flow is born inside the plate",
        node: <QrDoorPicture width={331} />,
      },
      {
        label: "and on a phone",
        hint: "343px: one geometry, no second tuning; the code grows with the door and can never fall under 3px a module",
        node: <QrDoorPicture width={343} />,
      },
      {
        // ★ WHY THE PLATE IS ITS OWN LAYER: it rises over both of the door's
        // scrims, because a scrim across white greys the code into exactly the
        // square a short value exists to avoid. The flow runs between them.
        label: "The code alone, on the door's ink",
        hint: "server-rendered, zero client JS, no link and no label: the door is already one link, and the code is an Easter egg for a camera",
        node: (
          <div
            className="relative aspect-4/5 overflow-hidden rounded-xl bg-[oklch(0.13_0_0)]"
            style={{ width: 331 }}
          >
            <QrRiverPlate ratio={5 / 4} value="https://partyreel.com/demo" />
          </div>
        ),
      },
    ],
  },
  {
    id: "button",
    file: "src/components/ui/button.tsx",
    for: "every action in the product: the round family whose radius rides its height",
    badge: "updated",
    family: "components",
    section: "Actions",
    play: "button",
    variants: [
      {
        prop: "variant",
        source: "cva",
        fallback: "default",
        options: [
          "default",
          "outline",
          "secondary",
          "ghost",
          "destructive",
          "link",
          "on-photo",
          "glass",
        ],
        note: "`on-photo` and `glass` stand on a photograph (the cover's Add, its rounds): drawn here on the page, they are judged in the specimen on one.",
        sample: (o) => <Button variant={o as "default"}>Share</Button>,
      },
      {
        prop: "size",
        source: "cva",
        fallback: "default",
        note: "Radius rides height at a ratio of about 0.4, so the four icon sizes match their text siblings.",
        options: buttonSizes,
        sample: (o) =>
          o.startsWith("icon") ? (
            <Button size={o as "icon"} aria-label="Add">
              <Plus />
            </Button>
          ) : (
            <Button size={o as "default"}>Share</Button>
          ),
      },
    ],
    specimens: [
      {
        label: "With an icon",
        hint: "the icon slot sets its own padding",
        node: (
          <Row>
            <Button>
              <ImageUp /> Add photos
            </Button>
            <Button variant="outline">
              <Share2 /> Share
            </Button>
          </Row>
        ),
      },
      {
        label: "On a photograph",
        hint: '`on-photo`, the white primary standing on it, and the `glass` rounds beside it (`size="icon-cta"`)',
        node: (
          <OnAPhoto>
            <div className="flex items-center gap-2">
              <Button variant="on-photo" size="cta">
                <ImageUp /> Add photos
              </Button>
              <Button
                variant="glass"
                size="icon-cta"
                aria-label="Watch the highlight reel"
              >
                <Play className="fill-current" />
              </Button>
              <Button variant="glass" size="icon-cta" aria-label="Invite">
                <QrCode />
              </Button>
            </div>
          </OnAPhoto>
        ),
      },
      {
        label: "Disabled",
        node: (
          <Row>
            <Button disabled>Default</Button>
            <Button variant="outline" disabled>
              Outline
            </Button>
          </Row>
        ),
      },
      {
        label: "Working",
        hint: "busy, never off: it keeps its face and its focus, the arc and its words in place of its own",
        // A client demo (`interactive-demos.tsx`): a working key holds its own click, which no server module can pass.
        node: <WorkingButtonDemo />,
      },
    ],
  },
  {
    id: "badge",
    file: "src/components/ui/badge.tsx",
    for: "a state as a light and its word (status=lights): the admin portal's states are most of its work, and the live mark breathes in the recording red",
    family: "components",
    section: "Actions",
    play: "badge",
    variants: [
      {
        prop: "variant",
        source: "cva",
        fallback: "default",
        options: badgeVariantNames,
        sample: (o) => <Badge variant={o as "default"}>Badge</Badge>,
      },
    ],
    specimens: [
      {
        label: "In a row",
        hint: "an LED beside a readout: colour only where a state means it, an unlit ring where it has none",
        node: (
          <Row>
            <Badge variant="live">Live</Badge>
            <Badge variant="success">Approved</Badge>
            <Badge variant="warning">12 waiting</Badge>
            <Badge variant="destructive">Over cap</Badge>
            <Badge variant="secondary">Draft</Badge>
            <Badge variant="outline">Private</Badge>
          </Row>
        ),
      },
    ],
  },

  {
    id: "input",
    file: "src/components/ui/input.tsx",
    for: "the one text field, from the guest password gate to the admin console",
    family: "components",
    section: "Inputs",
    specimens: [
      {
        label: "Field",
        hint: "Label + Input",
        node: (
          <div className="space-y-2">
            <Label htmlFor="ref-name">Event name</Label>
            <Input id="ref-name" placeholder="Maya & Jay's Wedding" />
          </div>
        ),
      },
      {
        label: "States",
        hint: "default / disabled / aria-invalid",
        node: (
          <div className="space-y-2">
            <Input placeholder="Default" />
            <Input placeholder="Disabled" disabled />
            <Input placeholder="Invalid" aria-invalid />
          </div>
        ),
      },
    ],
  },
  {
    id: "textarea",
    file: "src/components/ui/textarea.tsx",
    for: "the long-form field: an event description, a report, an announcement",
    family: "components",
    section: "Inputs",
    specimens: [
      {
        label: "Textarea",
        hint: "auto-grow",
        node: <Textarea placeholder="A note for your guests" />,
      },
    ],
  },
  {
    id: "label",
    file: "src/components/ui/label.tsx",
    for: "the field label in Inter 500: the per-setting tier under a card's title",
    family: "components",
    section: "Inputs",
    specimens: [
      {
        label: "Label",
        hint: "dims with its field",
        node: (
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="ref-l1">Enabled</Label>
              <Input id="ref-l1" placeholder="Active field" />
            </div>
            <div className="group space-y-1.5" data-disabled="true">
              <Label htmlFor="ref-l2">Disabled</Label>
              <Input id="ref-l2" placeholder="Disabled field" disabled />
            </div>
          </div>
        ),
      },
    ],
  },
  {
    id: "switch",
    file: "src/components/ui/switch.tsx",
    for: "the settings toggle, from an event's upload rules to the admin kill switches",
    family: "components",
    section: "Inputs",
    variants: [
      {
        prop: "size",
        source: "declared",
        fallback: "default",
        options: ["sm", "default"],
        sample: (o) =>
          o === "sm" ? (
            <Switch size="sm" defaultChecked aria-label="Small, on" />
          ) : (
            <Switch defaultChecked aria-label="On" />
          ),
      },
    ],
    specimens: [
      {
        label: "On and off",
        node: (
          <Row>
            <Switch defaultChecked aria-label="On" />
            <Switch aria-label="Off" />
          </Row>
        ),
      },
    ],
  },
  {
    id: "confirm-switch",
    file: "src/components/ui/confirm-switch.tsx",
    for: "the switch that asks first: the glyph and the deferred-open confirm dance owned once, for any switch whose consequential edge should not flip silently",
    test: "src/components/ui/confirm-switch.test.tsx",
    badge: "new",
    family: "components",
    section: "Inputs",
    lede: "The switch that asks first: one component owns the glyph beside the label and the deferred-open confirm dance, so a consequential switch never flips silently and the setTimeout dodge for radix's dismissable layer is written once.",
    specimens: [
      {
        label: "Turn it off to see the ask",
        hint: "confirmWhen={(next) => !next}: the ON direction is instant, same as any plain Switch",
        node: <ConfirmSwitchDemo />,
      },
    ],
  },
  {
    id: "toggle-group",
    file: "src/components/ui/toggle-group.tsx",
    for: "the segmented choice: the dashboard's display menu (its layout tiles and its sort, whose and when pills) and the profile wizard's one-time show-all choice",
    family: "components",
    section: "Inputs",
    badge: "new",
    lede: "One press picks one (type single: the pressed item stays pressed) or any number of them (type multiple), each item a button with `aria-pressed`, the group one tab stop with arrow keys between. It wears its caller's shape through className (a tray of pills, a row of tiles, an outlined pair); the two axes are the stock ones. Four callers today: the display menu's three groups and the profile wizard's pair.",
    variants: [
      {
        prop: "variant",
        source: "cva",
        fallback: "default",
        options: ["default", "outline"],
        sample: (o) => (
          <ToggleGroup
            type="single"
            variant={o as "default" | "outline"}
            defaultValue="all"
            aria-label={`Show, ${o}`}
          >
            <ToggleGroupItem value="all">All</ToggleGroupItem>
            <ToggleGroupItem value="mine">Mine</ToggleGroupItem>
          </ToggleGroup>
        ),
      },
      {
        prop: "size",
        source: "cva",
        fallback: "default",
        options: ["default", "sm"],
        sample: (o) => (
          <ToggleGroup
            type="single"
            variant="outline"
            size={o as "default" | "sm"}
            defaultValue="all"
            aria-label={`Show, ${o}`}
          >
            <ToggleGroupItem value="all">All</ToggleGroupItem>
            <ToggleGroupItem value="mine">Mine</ToggleGroupItem>
          </ToggleGroup>
        ),
      },
    ],
    specimens: [
      {
        label: "One choice, drawn as the state it leaves",
        hint: "the profile wizard's pair: type single, outline, sm; press the one already pressed and nothing changes",
        node: (
          <ToggleGroup
            type="single"
            variant="outline"
            size="sm"
            defaultValue="none"
            aria-label="Show your events on your page"
          >
            <ToggleGroupItem value="all">Show all 12</ToggleGroupItem>
            <ToggleGroupItem value="none">Keep all private</ToggleGroupItem>
          </ToggleGroup>
        ),
      },
      {
        label: "Several at once",
        hint: "type multiple: each item is its own switch; none is a valid state",
        node: (
          <ToggleGroup
            type="multiple"
            variant="outline"
            defaultValue={["photos", "videos"]}
            aria-label="Show"
          >
            <ToggleGroupItem value="photos">
              <Images /> Photos
            </ToggleGroupItem>
            <ToggleGroupItem value="videos">
              <Video /> Videos
            </ToggleGroupItem>
            <ToggleGroupItem value="hidden">
              <EyeOff /> Hidden
            </ToggleGroupItem>
          </ToggleGroup>
        ),
      },
      {
        label: "Tiles",
        hint: "the display menu's layout: a grid of three, each an icon over its word, the pressed one outlined in ink",
        node: (
          <ToggleGroup
            type="single"
            defaultValue="gallery"
            aria-label="Layout"
            className="grid w-full max-w-xs grid-cols-3 gap-1.5"
          >
            {[
              { id: "gallery", label: "Gallery", icon: <LayoutGrid /> },
              { id: "table", label: "Table", icon: <Table2 /> },
              { id: "list", label: "List", icon: <Rows3 /> },
            ].map((l) => (
              <ToggleGroupItem
                key={l.id}
                value={l.id}
                className="flex h-14 flex-col gap-1 rounded-xl border border-border text-xs data-[state=on]:border-foreground data-[state=on]:bg-muted"
              >
                {l.icon}
                {l.label}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        ),
      },
      {
        label: "In the dashboard's display menu",
        hint: "the real menu over a state of its own: press Display, then any tile or pill; the badge counts what is set, Reset clears it",
        node: <DisplayMenuDemo />,
      },
      {
        label: "Disabled",
        hint: "a group a host cannot change right now: every item dims and takes no press",
        node: (
          <ToggleGroup
            type="single"
            variant="outline"
            size="sm"
            defaultValue="all"
            disabled
            aria-label="Show your events on your page (unavailable)"
          >
            <ToggleGroupItem value="all">Show all 12</ToggleGroupItem>
            <ToggleGroupItem value="none">Keep all private</ToggleGroupItem>
          </ToggleGroup>
        ),
      },
    ],
  },
  {
    id: "dormant",
    file: "src/components/ui/dormant.tsx",
    for: "a setting with no effect right now, tucked under the switch that controls it as one quiet line, unfolding into its controls when that switch wakes it",
    test: "src/components/ui/dormant.test.tsx",
    badge: "new",
    family: "components",
    section: "Inputs",
    lede: "A setting that does nothing yet stays in view as one quiet line naming what waits, nested on the rule its controls stand on, and unfolds when its switch turns on; asleep, its controls are out of reach, and under reduced motion nothing moves. The reel's look and hold, A photo first while uploads are paused, the size cap under Videos and the door's steps under Only me all ride it.",
    specimens: [
      {
        label: "Turn the reel on",
        hint: "awake={on}: the line folds away as the controls unfold",
        node: <DormantDemo />,
      },
    ],
  },
  {
    id: "select",
    file: "src/components/ui/select.tsx",
    for: "the option picker; the contact form's topic is its one call site today",
    family: "components",
    section: "Inputs",
    specimens: [
      {
        label: "Select",
        hint: "Radix, portal-rendered",
        node: (
          <div className="max-w-xs">
            <Select defaultValue="public">
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Visibility" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="public">Public</SelectItem>
                <SelectItem value="password">Password</SelectItem>
                <SelectItem value="private">Private</SelectItem>
              </SelectContent>
            </Select>
          </div>
        ),
      },
    ],
  },
  {
    id: "form",
    file: "src/components/ui/form.tsx",
    for: "the react-hook-form field stack, hand-authored: the radix-nova registry has no form item",
    family: "components",
    section: "Inputs",
    specimens: [
      {
        label: "Form",
        hint: "react-hook-form + zod; submit blank to see the message",
        node: <FormDemo />,
      },
    ],
  },
  {
    id: "input-otp",
    file: "src/components/ui/input-otp.tsx",
    title: "InputOTP",
    for: "the six-slot code field: the emailed sign-in code, and the delete-account confirm",
    family: "components",
    section: "Inputs",
    specimens: [
      { label: "Input OTP", hint: "controlled, six slots", node: <OtpDemo /> },
    ],
  },

  {
    id: "card",
    file: "src/components/ui/card.tsx",
    for: "the panel the settings, dashboard, admin and auth surfaces are built out of",
    family: "components",
    section: "Surfaces",
    specimens: [
      {
        label: "Card",
        hint: "flat as its tone alone, no line and no shadow; CardTitle takes the heading face",
        node: (
          <Card>
            <CardHeader>
              <CardTitle>Maya &amp; Jay&rsquo;s Wedding</CardTitle>
              <CardDescription>
                128 photos and videos from 43 guests
              </CardDescription>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Card content sits here, on the card surface.
            </CardContent>
            <CardFooter>
              <Button size="sm" variant="outline">
                <Calendar /> June 14
              </Button>
            </CardFooter>
          </Card>
        ),
      },
    ],
  },
  {
    id: "avatar",
    file: "src/components/ui/avatar.tsx",
    for: "the account face: the user menu, the account page, a guest in the list; seeded into a colour by seedFor(profiles.id) until a photo replaces it",
    test: "src/components/ui/avatar.test.tsx",
    family: "components",
    section: "Surfaces",
    play: "avatar",
    variants: [
      {
        prop: "size",
        source: "prop",
        fallback: "default",
        options: ["sm", "default", "lg"],
        sample: (o) => (
          <Avatar size={o as "default"}>
            <AvatarFallback>MJ</AvatarFallback>
          </Avatar>
        ),
      },
    ],
    specimens: [
      {
        label: "A row of faces, and one present",
        hint: "a face carries no line; a row overlaps by a quarter of a face, parted by the ground, its count an unlit ring; presence is a green light",
        node: (
          <Row>
            {(["sm", "default"] as const).map((size) => (
              <AvatarGroup key={size}>
                {["Maya", "Jay", "Sam", "Ines"].map((name) => (
                  <Avatar key={name} size={size} seed={`library-${name}`}>
                    <AvatarFallback>{name[0]}</AvatarFallback>
                  </Avatar>
                ))}
                <AvatarGroupCount>+12</AvatarGroupCount>
              </AvatarGroup>
            ))}
            <Avatar size="lg" seed="library-Maya">
              <AvatarFallback>M</AvatarFallback>
              <AvatarBadge />
            </Avatar>
          </Row>
        ),
      },
    ],
  },
  {
    id: "separator",
    file: "src/components/ui/separator.tsx",
    for: "the hairline rule, and the or divider between the two sign-in paths",
    family: "components",
    section: "Surfaces",
    specimens: [
      {
        label: "Separator",
        node: (
          <div className="text-sm text-muted-foreground">
            Above
            <Separator className="my-3" />
            Below
          </div>
        ),
      },
    ],
  },
  {
    id: "skeleton",
    file: "src/components/ui/skeleton.tsx",
    for: "the loading block: it breathes, a light waiting, and stands still under reduced motion",
    family: "components",
    section: "Surfaces",
    specimens: [
      {
        label: "Skeleton",
        hint: "--animate-skeleton-breathe",
        node: (
          <div className="space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        ),
      },
    ],
  },
  {
    id: "river",
    file: "src/components/shared/river/river.tsx",
    for: "a flow of photographs falling through a box, sized by its container; decorative, and a placement that wants it quiet filters its own wrapper",
    test: "src/components/guest/gallery-empty-state.test.tsx",
    badge: "new",
    family: "components",
    section: "Surfaces",
    lede: "A flow of photographs falling through a box, sized by its container. Its first home is the empty guest album, where the PLACEMENT fades it; the component itself is always at full luminance and never carries a layer over a photograph.",
    specimens: [
      // The real call site, at the two widths the guest page actually gives its
      // gallery (event-experience.tsx: max-w-2xl inside px-5, so 335 at a phone
      // and 632 from 672 up). Fixed widths on purpose: a library frame is as
      // wide as the window, and the WIDTH is the point of these two, so the
      // specimen states it rather than inheriting whatever the stage has.
      // The two with a CTA go through a client demo: the button is only drawn
      // when the viewer can upload, and a server module cannot mint a handler
      // (interactive-demos.tsx says the rest).
      {
        label: "The empty guest album, at a phone",
        hint: "335px: exactly what live-gallery.tsx mounts when an album has nothing in it yet",
        node: <EmptyAlbumDemo width={335} />,
      },
      {
        label: "and at the guest column's full width",
        hint: "632px: one geometry, no second tuning, because every length in the flow is a fraction of the box",
        node: <EmptyAlbumDemo width={632} />,
      },
      {
        label: "Uploads closed",
        hint: "no onAddFirst: the promise stands over the flow on its own",
        node: (
          <div style={{ width: 335 }}>
            <GalleryEmptyState />
          </div>
        ),
      },
      {
        // ★ WHAT A LATER PLACEMENT NEEDS TO SEE: the fade above belongs to the
        // empty album (an album with nothing in it may not promise pictures
        // that do not exist), NOT to the river. Everywhere else it pours at
        // full luminance, and a placement that wants it quiet filters its own
        // wrapper rather than dimming the component or laying a scrim over the
        // photographs.
        label: "The river itself, unfaded",
        hint: "decorative, aria-hidden, nothing focusable; one rAF loop, paused off screen and under reduced motion",
        node: (
          <div style={{ width: 335 }}>
            <River frames={GUEST_GHOST_FRAMES} />
          </div>
        ),
      },
    ],
  },

  {
    id: "photo-section",
    file: "src/components/shared/backdrop/photo-section.tsx",
    for: "a section standing on a full-bleed photograph that switches as the reader moves, its copy on a glass plate; the device that carries a chapter cut",
    test: "src/components/shared/backdrop/photo-section.test.tsx",
    badge: "new",
    family: "components",
    section: "Surfaces",
    lede: "A section that stands on a full-bleed photograph and switches it as the reader moves, with its copy on a glass plate. It is a page device: a full-image section can close a chapter, open one, or separate two, so a page turns through a picture instead of over a hairline. Today it closes the home page's first chapter. Each specimen stands in a laptop-wide viewport, which is what the section is full-bleed in (its plates say `sizes=\"100vw\"` and load lazily, because it is never a page's first screen), zoomed down to the column.",
    specimens: [
      {
        label: "The room, under a cursor",
        hint: "move across it: the pool is indexed by WHERE you are, so going back brings back the photograph you just left. The rail at the foot is that readout, and it is drawn for a cursor and for nothing else.",
        node: <PhotoSectionDemo source="pointer" />,
      },
      {
        // ★ `source` is forced in these, and nowhere else (the demo says why).
        label: "and under a thumb",
        hint: "source=scroll: scroll THIS page and five of the six pass at steps as the section goes by, never all six and never a tap. Stop scrolling and everything stops, which is the whole point of the rule.",
        node: <PhotoSectionDemo source="scroll" />,
      },
      {
        label: "With no copy at all",
        hint: "no children, no plate: the instance that exists to separate two chapters. It is also what a crawler, a tab with scripting off and a reader who asked for less motion get, standing on the pool's first photograph with no loop anywhere.",
        node: <PhotoSectionDemo source="pointer" copy={false} />,
      },
    ],
  },

  {
    id: "tabs",
    file: "src/components/ui/tabs.tsx",
    for: "the tab group, filled or underlined; only the design lab mounts it today",
    family: "components",
    section: "Navigation",
    variants: [
      {
        prop: "variant",
        source: "cva",
        fallback: "default",
        note: "On TabsList: the filled group, or the underlined line.",
        options: ["default", "line"],
        sample: (o) => (
          <Tabs defaultValue="all">
            <TabsList variant={o as "default"}>
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="photos">Photos</TabsTrigger>
            </TabsList>
          </Tabs>
        ),
      },
    ],
    specimens: [
      {
        label: "With panels",
        node: (
          <Tabs defaultValue="all">
            <TabsList>
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="photos">Photos</TabsTrigger>
              <TabsTrigger value="videos">Videos</TabsTrigger>
            </TabsList>
            <TabsContent
              value="all"
              className="pt-3 text-sm text-muted-foreground"
            >
              Everything, interleaved.
            </TabsContent>
            <TabsContent
              value="photos"
              className="pt-3 text-sm text-muted-foreground"
            >
              Photos only.
            </TabsContent>
            <TabsContent
              value="videos"
              className="pt-3 text-sm text-muted-foreground"
            >
              Videos only.
            </TabsContent>
          </Tabs>
        ),
      },
    ],
  },
  {
    id: "navigation-menu",
    file: "src/components/ui/navigation-menu.tsx",
    for: "the mega-menu primitive behind the marketing header, held to the floating-layer contract",
    family: "components",
    section: "Navigation",
    lede: "The mega-menu primitive behind the marketing header: one sliding viewport shared by every trigger.",
    specimens: [
      {
        label: "NavigationMenu",
        hint: "hover a trigger",
        node: (
          <NavigationMenu>
            <NavigationMenuList>
              <NavigationMenuItem>
                <NavigationMenuTrigger>Features</NavigationMenuTrigger>
                <NavigationMenuContent>
                  <ul className="grid w-72 gap-1 p-2 text-sm">
                    <li className="rounded-md px-3 py-2 hover:bg-muted">
                      Uploads
                    </li>
                    <li className="rounded-md px-3 py-2 hover:bg-muted">
                      Curation
                    </li>
                    <li className="rounded-md px-3 py-2 hover:bg-muted">
                      Sharing
                    </li>
                  </ul>
                </NavigationMenuContent>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <NavigationMenuTrigger>Events</NavigationMenuTrigger>
                <NavigationMenuContent>
                  <ul className="grid w-72 gap-1 p-2 text-sm">
                    <li className="rounded-md px-3 py-2 hover:bg-muted">
                      Weddings
                    </li>
                    <li className="rounded-md px-3 py-2 hover:bg-muted">
                      Parties
                    </li>
                  </ul>
                </NavigationMenuContent>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <NavigationMenuLink className={navigationMenuTriggerStyle()}>
                  Pricing
                </NavigationMenuLink>
              </NavigationMenuItem>
            </NavigationMenuList>
          </NavigationMenu>
        ),
      },
    ],
  },

  {
    id: "progress",
    file: "src/components/ui/progress.tsx",
    for: "the meter as twelve frames that fill as a roll fills, in the state's light: an upload's bytes, a reel's stitch, a guest's download",
    family: "components",
    section: "Feedback",
    play: "progress",
    specimens: [
      {
        label: "Filling, and failed",
        hint: "`aria-invalid` on the meter fills it in the failure red",
        node: (
          <div className="space-y-3">
            <Progress value={32} />
            <Progress value={72} />
            <Progress value={40} aria-invalid />
          </div>
        ),
      },
    ],
  },
  {
    id: "empty",
    file: "src/components/ui/empty.tsx",
    for: "the one empty place, everywhere nothing is here yet: a glyph in its lens, a title, a line and the one act that starts it, never a dashed box",
    badge: "new",
    family: "components",
    section: "Feedback",
    title: "Empty",
    lede: "Identity r2's `one-empty`, in its lights build: a camera shows nothing as a lens with nothing in front of it. The shared EmptyState and the feed's section empty are this atom; the glyph is an element, so a server page hands it one.",
    specimens: [
      {
        label: "With its glyph and its act",
        hint: "`icon`, `title`, `line`, `action`",
        node: (
          <Empty
            icon={<Images />}
            title="Nothing waiting"
            line="Photos you hold for review land here."
            action={
              <Button size="sm" variant="outline">
                Open the album
              </Button>
            }
          />
        ),
      },
      {
        label: "Quiet",
        hint: "no glyph: the title and the line alone, never a lighter title",
        node: (
          <Empty
            title="No likes yet"
            line="Tap the heart on any photo or video to save it here."
          />
        ),
      },
    ],
  },
  {
    id: "consequence-line",
    file: "src/components/ui/consequence-line.tsx",
    for: "a change that reaches people already in, said before it happens, in the control's own place rather than a dialog over it",
    test: "src/components/ui/consequence-line.test.tsx",
    badge: "new",
    family: "components",
    section: "Feedback",
    lede: "The one sentence of what a change does to people, under the control that asked, with the change as its primary act and the way back beside it; nothing is written until the first is pressed, and the sentence is announced. The door's swaps ride it; the disposable camera's mode switch will.",
    specimens: [
      {
        label: "Only me, with 31 guests inside",
        hint: "announced, never focused: the control that asked keeps focus",
        node: <ConsequenceLineDemo />,
      },
    ],
  },
  {
    id: "password-strength-meter",
    file: "src/components/shared/password-strength-meter.tsx",
    for: "soft guidance while a new password is typed; never a gate, the validators enforce",
    family: "components",
    section: "Feedback",
    specimens: [
      {
        label: "Password strength",
        hint: "live estimate as you type",
        node: <PasswordStrengthDemo />,
      },
    ],
  },
  {
    id: "sonner",
    file: "src/components/ui/sonner.tsx",
    title: "Toaster",
    for: "the Toaster, every toast the display with its state a lit glyph: top-center under the tallest bar in the product, always expanded rather than sonner's hover-to-open pile, an error held open behind a close control until dismissed while every other kind clears on its own clock, and one trailing action slot every toast reserves (a named door, Undo, Retry)",
    test: "src/components/ui/sonner.test.tsx",
    family: "components",
    section: "Feedback",
    specimens: [
      {
        label: "Toast",
        hint: "sonner · toast()",
        node: <ToastDemo />,
      },
    ],
  },

  {
    id: "popup-kinds",
    file: "src/components/ui/popup-kinds.ts",
    test: "src/components/ui/popup-kinds.test.ts",
    title: "Popup kinds",
    for: "the one table that says where each kind of popup opens, at a desk and in a hand: eight kinds, and a call site only ever names its kind",
    badge: "new",
    family: "components",
    section: "Overlays",
    lede: "Every popup in the product is one of eight kinds, and each kind has one answer at a desk and one in a hand (the product's one breakpoint, 640 px), so a call site says `kind=\"confirm\"` and never spells a posture. Each is drawn open in a real viewport at a laptop and a phone over a stand-in album, closed by its own control, with the captions read off the popup standing in each frame. The five that `PopupContent` draws wear stand-in words; the choice, the share and the peek are primitives of their own and are the real ones (the responsive menu, the code card, the look), and the plan is the real plans' sheet over inert doors. The kinds with a field (the form, the settings' name) take the keyboard on the phone.",
    variants: [
      {
        prop: "kind",
        source: "declared",
        options: [
          "list",
          "confirm",
          "form",
          "choice",
          "share",
          "plan",
          "settings",
          "peek",
        ],
        note: "A row of the table is a kind: a shape for a desk, a shape for a hand, where focus lands at a desk, and how a screen reader announces it. The edge shapes (panel, screen, cover, sheet) and the centred ones (dialog, wide) are one Radix element; a menu, the code card and a card at a name are primitives of their own.",
      },
    ],
    specimens: [
      {
        label: "list",
        hint: "lists=panel · a panel beside the screen at a desk, the whole screen under a back arrow in a hand",
        node: <PopupKindDemo kind="list" />,
      },
      {
        label: "confirm",
        hint: "confirm=dialog · a centred alertdialog on its safe answer, wider when it lists what leaves",
        node: <PopupKindDemo kind="confirm" />,
      },
      {
        label: "form",
        hint: "forms=dialog · one question with a field, standing in the band the keyboard leaves",
        node: <PopupKindDemo kind="form" />,
      },
      {
        label: "choice",
        hint: "choices=menu · ResponsiveMenu: under the button that asked, at the thumb with Cancel beneath in a hand",
        node: <PopupKindDemo kind="choice" />,
      },
      {
        label: "share",
        hint: "share=card · the code card: white for a scanner, a card at a desk and the whole screen in a hand",
        node: <PopupKindDemo kind="share" />,
      },
      {
        label: "plan",
        hint: "plans=wide · the plans' sheet: stacked cards in a wide dialog, the whole screen under a close in a hand",
        node: <PopupKindDemo kind="plan" />,
      },
      {
        label: "settings",
        hint: "settings=panel · a panel at a desk, the whole screen in a hand; the name's field takes the keyboard",
        node: <PopupKindDemo kind="settings" />,
      },
      {
        label: "peek",
        hint: "peek=card · the look: a card beside the name at a desk, the sheet in a hand",
        node: <PopupKindDemo kind="peek" />,
      },
    ],
  },
  {
    id: "popup",
    file: "src/components/ui/popup.tsx",
    test: "src/components/ui/popup.test.tsx",
    for: "the one element every dialog-shaped popup is: it names its kind and the table picks the shape for the width it opens at, one structure at every shape (a header, a body that scrolls, a footer that stays), keyboard-safe, and a layer a tap opened takes no tap until it has settled",
    badge: "new",
    family: "components",
    section: "Overlays",
    lede: "The Dialog and the Sheet as one element: `<PopupContent kind=\"confirm\">` is the whole of a call site's answer to where it opens, and the kind's row in the table (`popup-kinds.ts`, drawn on its own entry) picks the shape. A centred dialog, a side panel and a phone's whole screen are the same three parts at different sizes, so the parts read the shape they stand in. Two things are worth pressing: how wide a centred shape is (by what it says), and what a layer does with a tap that lands while it is still arriving.",
    variants: [
      {
        prop: "size",
        source: "prop",
        fallback: "sm",
        options: ["sm", "md", "lg"],
        note: "How wide a centred shape is, by what it says: sm a question, md one that lists what leaves, lg a long form. The edge shapes ignore it. Each sample opens the live layer in this window.",
        sample: (o) => <PopupSizeSample size={o as "sm" | "md" | "lg"} />,
      },
    ],
    specimens: [
      {
        label: "A tap that lands while it arrives",
        hint: "the second tap of a double tap lands inside the layer the first one opened: the guard takes no press until the entrance has run out",
        node: <ArrivalGuardDemo />,
      },
    ],
  },
  {
    id: "dialog",
    file: "src/components/ui/dialog.tsx",
    test: "src/components/ui/dialog.test.tsx",
    for: "the dialog primitive: the centred shape under the confirm and form kinds, and the dialogs the popups board left alone (Welcome to Pro, the avatar cropper, the demo modal, the photograph viewer's own), plus the fullScreen takeover a whole-screen surface asks for",
    badge: "updated",
    family: "components",
    section: "Overlays",
    lede: "A kind of popup opens through `PopupContent` (see Popup kinds), which wears this primitive's centred shape for the confirm and the form; the Dialog itself stays what the dialogs outside the table draw with. Each is drawn open in a real viewport at a laptop and a phone, closed by its own control, the captions read off what stands in each frame.",
    specimens: [
      {
        label: "Dialog",
        hint: "the centred shape · a press on X, Cancel or the scrim closes it · Replay opens it again",
        node: <DialogSheetDemo variant="dialog" />,
      },
      {
        label: "Takeover",
        hint: "fullScreen: an edge-to-edge room that holds the page still behind it",
        node: <DialogSheetDemo variant="takeover" />,
      },
    ],
  },
  {
    id: "sheet",
    file: "src/components/ui/sheet.tsx",
    test: "src/components/ui/sheet.test.tsx",
    for: "the edge sheet: the guest door's one sheet (a bottom sheet in a hand, a panel from the right at a desk, standing on the keyboard), the failure and email sheets, and at a fixed side the marketing phone menu and the design shell's panel",
    badge: "updated",
    family: "components",
    section: "Overlays",
    lede: "The product's popups open through `PopupContent` by kind (see Popup kinds); the Sheet stays the guest door's surface and the edge panel of two shells. `responsive` is the door's: one surface that is a bottom sheet in a hand and a full-height panel at a desk, with no centred float anywhere, and it stands on the keyboard while a field in it holds focus. A fixed side is for a surface with no desk posture.",
    specimens: [
      {
        label: "Responsive, the guest door's",
        hint: "responsive · a bottom sheet in a hand, a panel at a desk · switch the keyboard up on the phone",
        node: <DialogSheetDemo variant="responsive" />,
      },
      {
        label: "A fixed side",
        hint: "side=right (the default) · the phone menu's and the shell's posture",
        node: <DialogSheetDemo variant="side" />,
      },
    ],
  },
  {
    id: "popover",
    file: "src/components/ui/popover.tsx",
    for: "the tap-to-open note: the storage meter's breakdown, the Anonymous explainer",
    family: "components",
    section: "Overlays",
    specimens: [
      {
        label: "Popover",
        node: (
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm">
                Open popover
              </Button>
            </PopoverTrigger>
            <PopoverContent>
              <p className="text-sm font-medium">Storage</p>
              <p className="mt-1 text-sm text-muted-foreground">
                1.2 GB of 5 GB used.
              </p>
            </PopoverContent>
          </Popover>
        ),
      },
    ],
  },
  {
    id: "dropdown-menu",
    file: "src/components/ui/dropdown-menu.tsx",
    for: "the menu behind the user menu, the notification bell and the admin controls",
    test: "src/components/ui/dropdown-menu.test.tsx",
    family: "components",
    section: "Overlays",
    // CARD, AS THE WORKING VERSION (floating-surfaces r7:
    // "Card is my overall favorite"). Two specimens, because the point is two
    // claims: the parts exist, AND a menu with nothing to say wears none of
    // them. The full anatomy alone would read as a house style every overflow
    // has to obey, which is the cost Card was judged against.
    specimens: [
      {
        label: "A menu with something to say",
        hint: "a title row, labelled groups, an icon rail, state on the right, a footer rail",
        node: (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Settings /> Manage
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-64">
              <DropdownMenuHeader meta="Pro">Ana and Theo</DropdownMenuHeader>
              <DropdownMenuGroup>
                <DropdownMenuLabel>Share</DropdownMenuLabel>
                <DropdownMenuItem>
                  <Share2 /> Copy the guest link
                </DropdownMenuItem>
              </DropdownMenuGroup>
              <DropdownMenuGroup>
                <DropdownMenuLabel>The album</DropdownMenuLabel>
                <DropdownMenuItem>
                  <Heart /> Saved
                  <DropdownMenuMeta>412</DropdownMenuMeta>
                </DropdownMenuItem>
                {/* One branch, and it stops there: two levels read simpler,
                    and a branch that wants a third is a group of its own
                    under its name. */}
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger>
                    <Settings /> Who can upload
                  </DropdownMenuSubTrigger>
                  <DropdownMenuSubContent>
                    <DropdownMenuLabel>Who can upload</DropdownMenuLabel>
                    <DropdownMenuItem>Anyone with the link</DropdownMenuItem>
                    <DropdownMenuItem>
                      Guests who verify an email
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      Nobody, uploads are closed
                    </DropdownMenuItem>
                  </DropdownMenuSubContent>
                </DropdownMenuSub>
              </DropdownMenuGroup>
              <DropdownMenuFooter>
                <DropdownMenuItem variant="destructive">
                  <Trash2 /> Delete the event
                </DropdownMenuItem>
              </DropdownMenuFooter>
            </DropdownMenuContent>
          </DropdownMenu>
        ),
      },
      {
        label: "A menu with nothing to say",
        hint: "every part is optional: a two-row overflow wears the layer and stops",
        node: (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                Download
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem>SVG (best for print)</DropdownMenuItem>
              <DropdownMenuItem>PNG (best for screens)</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ),
      },
    ],
  },
  {
    id: "tooltip",
    file: "src/components/ui/tooltip.tsx",
    for: "the hover and focus label for a control that names itself, which refuses a finger on purpose; TapTooltip is the one press model where the words are what a finger asks for",
    test: "src/components/ui/tooltip.test.tsx",
    badge: "updated",
    family: "components",
    section: "Overlays",
    lede: "Two components in one file, drawn side by side. `Tooltip` labels a control whose own name is its label: a cursor's hover and a key's focus open it, and a tap never does (its arrow would land under the finger and take the click). `TapTooltip` is for a control whose words are the thing asked for, a glyph with no label beside it or a table row's fine print: a tap toggles the words, a cursor's hover opens them and its click keeps them open, a key toggles them.",
    specimens: [
      {
        // No local TooltipProvider: the root one (providers.tsx, delay 0 /
        // skip 300) is in scope here, so this is the REAL shipped timing.
        label: "Tooltip",
        hint: "the root provider's delay, not a local one; a tap on its face opens nothing",
        node: (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" size="sm">
                Hover me
              </Button>
            </TooltipTrigger>
            <TooltipContent>Tooltips keep skip-delay</TooltipContent>
          </Tooltip>
        ),
      },
      {
        // A client demo (`interactive-demos.tsx`): TapTooltip cannot be drawn from this server module.
        label: "TapTooltip",
        hint: "tap a face to open its words and again to shut them; hover and focus open them and a cursor's click keeps them; Escape or a tap elsewhere puts them away",
        node: <TapTooltipDemo />,
      },
    ],
  },
];
