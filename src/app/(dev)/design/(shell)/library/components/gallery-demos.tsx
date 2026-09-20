import {
  Calendar,
  Compass,
  Heart,
  ImageUp,
  Plus,
  Settings,
  Share2,
  Trash2,
} from "lucide-react";

import {
  GalleryEmptyState,
  GUEST_GHOST_FRAMES,
} from "@/components/guest/gallery-empty-state";
import { LiveAlbumStage } from "@/components/marketing/sections/features/album/live-album-stage";
import { AlbumStream } from "@/components/shared/album-stream/album-stream";
import { PhotoSection } from "@/components/shared/backdrop/photo-section";
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
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
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
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
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
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import type { GalleryEntry } from "@/app/(dev)/design/gallery/entry";
import { Row } from "@/app/(dev)/design/reference/reference-ui";
import {
  CommandPaletteDemo,
  DestructiveSheetDemo,
  EmptyAlbumDemo,
  FormDemo,
  OtpDemo,
  PasswordStrengthDemo,
  ToastDemo,
} from "./interactive-demos";

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
];

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
  { started: "06:30", job: "Database backup", outcome: "Succeeded", took: "31s" },
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
  /* THE PORTAL'S THREE NEW PARTS (added by lp/admin-wiring at the HEAD of the
     list, so several lanes in one round land on distinct hunks). The admin is
     the one surface in the product nothing automated can sign into, so these
     specimens are the only eye `lab:smoke` has on them. */
  {
    id: "table",
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
    lede: "The portal's dense row, and the one thing it adds to shadcn's: `tone` as a data attribute, so a failed run tints its own row and takes a leading edge (`colour=rows`, Will 2026-09-20, with his note: \"Makes it a bit harder to miss\"). The same rules ride an <li> in the inbox list and the home's queue, which is why they are scoped by data value rather than split into four class strings.",
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
    badge: "new",
    family: "components",
    section: "The operations portal",
    title: "DestructiveSheet",
    lede: "One panel for every destructive act in the portal, sized to the damage (`destructive=sheet`, Will 2026-09-20). It had four grammars and the severity did not line up with the friction: a typed dialog for an account, a plain one for a photograph, an arm-then-confirm for a legal hold, and a bare switch for the purge sweep. Every act now lists what it touches before it happens, and only the permanent one makes you type.",
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
    badge: "new",
    family: "components",
    section: "Surfaces",
    lede: "Photographs falling out of the room around a hero's words and into the album beneath it, and the album they fall into: the live guest masonry under the host's own header, its foot dissolving, lit from behind by the Glow halo. Will ruled both on the album page (visual=live, motion=stream, light=halo, 2026-09-19).",
    specimens: [
      {
        label: "The album, at the scale's 896 step",
        hint: "the halo lights the frame's rim, its window bar and the header type from BEHIND, so the photographs stay exactly as they are (bible 1); the foot dissolves under a mask rather than a scrim, so the album reads as going on",
        node: <CinemaGround>{<LiveAlbumStage />}</CinemaGround>,
      },
      {
        // ★ ITS COMPOSITION IS THE HERO'S OWN WIDTH, which a library column is
        // not: every horizontal in the engine is a share of the hero's
        // half-width, and the layer reads that from its own box. So this block
        // is pinned to 1280, the narrowest window the side-band composition
        // serves, and the page itself is where it is judged.
        label: "and the fall into it",
        hint: "1280, the narrowest window this composition serves. Decorative and inert: nothing in it is focusable, every frame carries its resting position as server HTML, and reduced motion leaves that resting frame standing with no loop at all",
        node: (
          <div className="max-w-full overflow-x-auto">
            <CinemaGround>
              <div
                className="relative isolate overflow-x-clip"
                style={{ width: 1280 }}
              >
                <AlbumStream />
                <div style={{ height: 520 }} />
                <LiveAlbumStage />
                <div style={{ height: 150 }} />
              </div>
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
    badge: "new",
    family: "components",
    section: "Surfaces",
    lede: "Photographs laid down behind a moving point, each sliding after it and then fading and shrinking away where it lies. Will ruled its look and its home on 2026-09-19: 140 px of travel between photographs, three seconds to go, thrown the way the hand went, 180 px and 100 at a phone, and the root 404 as the page it lives on. It is decorative, it takes no pointer, and it never lays anything over the words: inside their own box a photograph yields instead, which is what keeps the type the loudest thing on the screen.",
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
    badge: "new",
    family: "components",
    section: "Surfaces",
    title: "The QR door's picture",
    lede: "The album pouring out of a real scannable code, which is what fills the QR feature door. Will ruled the pair on river-card (2026-09-19): the code a tenth of the way down the tall door, the whole card streaming behind the copy, no label at all, and /demo as what it opens. Every length is a fraction of the door's width, so the code, the birth point and the flow agree at any size with nothing measured and no resize listener.",
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
        ],
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
    ],
  },
  {
    id: "badge",
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
        hint: "inline status; state earns color",
        node: (
          <Row>
            <Badge>Live</Badge>
            <Badge variant="secondary">Draft</Badge>
            <Badge variant="outline">Private</Badge>
            <Badge variant="destructive">Over cap</Badge>
          </Row>
        ),
      },
    ],
  },

  {
    id: "input",
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
    id: "select",
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
    family: "components",
    section: "Inputs",
    specimens: [
      { label: "Input OTP", hint: "controlled, six slots", node: <OtpDemo /> },
    ],
  },

  {
    id: "card",
    family: "components",
    section: "Surfaces",
    specimens: [
      {
        label: "Card",
        hint: "CardTitle takes the heading face",
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
    specimens: [],
  },
  {
    id: "separator",
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
    family: "components",
    section: "Surfaces",
    specimens: [
      {
        label: "Skeleton",
        hint: "--animate-shimmer",
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
        // photographs (bible 1).
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
    badge: "new",
    family: "components",
    section: "Surfaces",
    lede: "A section that stands on a full-bleed photograph and switches it as the reader moves, with its copy on a glass plate. Will ruled it a PAGE device on 2026-09-18: a full-image section can close a chapter, open one, or separate two, used sometimes and never at every cut, so a page turns through a picture instead of over a hairline. Its first home closes the home page's first chapter.",
    specimens: [
      {
        label: "The room, under a cursor",
        hint: "move across it: the pool is indexed by WHERE you are, so going back brings back the photograph you just left. The rail at the foot is that readout, and it is drawn for a cursor and for nothing else.",
        node: (
          <PhotoSection source="pointer">
            <PlateCopy />
          </PhotoSection>
        ),
      },
      {
        // ★ `source` is forced HERE and nowhere else. Production asks the
        // reader's own device; this is the only way to put both rules on one
        // screen for a reviewer sitting at a laptop.
        label: "and under a thumb",
        hint: "scroll THIS page: five of the six pass at steps as the section goes by, never all six and never a tap. Stop scrolling and everything stops, which is the whole point of the rule.",
        node: (
          <div style={{ width: 375 }}>
            <PhotoSection source="scroll">
              <PlateCopy />
            </PhotoSection>
          </div>
        ),
      },
      {
        label: "With no copy at all",
        hint: "no children, no plate: the instance that exists to separate two chapters. It is also what a crawler, a tab with scripting off and a reader who asked for less motion get, standing on the pool's first photograph with no loop anywhere.",
        node: <PhotoSection className="min-h-56" />,
      },
    ],
  },

  {
    id: "tabs",
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
    family: "components",
    section: "Feedback",
    play: "progress",
    specimens: [
      {
        label: "Two fills",
        node: (
          <div className="space-y-3">
            <Progress value={32} />
            <Progress value={72} />
          </div>
        ),
      },
    ],
  },
  {
    id: "password-strength-meter",
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
    id: "dialog",
    family: "components",
    section: "Overlays",
    lede: "Trigger-anchored where it belongs; the live components, fully interactive.",
    specimens: [
      {
        label: "Dialog",
        node: (
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                Open dialog
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Delete this event?</DialogTitle>
                <DialogDescription>
                  This removes the event and everything in it. There is no undo.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter showCloseButton>
                <Button variant="destructive" size="sm">
                  Delete
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        ),
      },
    ],
  },
  {
    id: "sheet",
    family: "components",
    section: "Overlays",
    specimens: [
      {
        label: "Sheet",
        node: (
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="sm">
                Open sheet
              </Button>
            </SheetTrigger>
            <SheetContent>
              <SheetHeader>
                <SheetTitle>Share this event</SheetTitle>
                <SheetDescription>
                  Your guests scan one QR code to join and upload.
                </SheetDescription>
              </SheetHeader>
            </SheetContent>
          </Sheet>
        ),
      },
    ],
  },
  {
    id: "drawer",
    family: "components",
    section: "Overlays",
    specimens: [
      {
        label: "Drawer",
        hint: "vaul · bottom, drag to dismiss",
        node: (
          <Drawer>
            <DrawerTrigger asChild>
              <Button variant="outline" size="sm">
                Open drawer
              </Button>
            </DrawerTrigger>
            <DrawerContent>
              <DrawerHeader>
                <DrawerTitle>Add to your event</DrawerTitle>
                <DrawerDescription>
                  The mobile sheet pattern, with drag-to-dismiss.
                </DrawerDescription>
              </DrawerHeader>
            </DrawerContent>
          </Drawer>
        ),
      },
    ],
  },
  {
    id: "popover",
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
    family: "components",
    section: "Overlays",
    // CARD, AS THE WORKING VERSION (Will, floating-surfaces r7, 2026-09-17:
    // "Card is my overall favorite"). Two specimens, because the ruling is two
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
                {/* The one branch the family allows, and the last one: a Sub
                    inside a Sub throws at render (Will: a third level "gets too
                    complicated"). */}
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
    family: "components",
    section: "Overlays",
    specimens: [
      {
        // No local TooltipProvider: the root one (providers.tsx, delay 200 /
        // skip 300) is in scope here, so this is the REAL shipped timing.
        label: "Tooltip",
        hint: "the root provider's delay, not a local one",
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
    ],
  },
];

/**
 * The copy a plate specimen carries. Deliberately NOT a real marketing section:
 * the collector derives a component's specimen route from which library module
 * imports it, so pulling `full-quality.tsx` in here would make the index claim
 * a home-page section lives in the component gallery.
 *
 * The muted line is in it on purpose: over a photograph the plate takes the
 * body copy off the muted tier (the measured rule in photo-section.css), and
 * this is where that is visible rather than described.
 */
function PlateCopy() {
  return (
    <div className="mx-auto max-w-xl px-6 py-12 text-center">
      <p className="text-xs font-medium tracking-[0.14em] text-muted-foreground uppercase">
        The room
      </p>
      {/* A <p>, not a heading: a specimen's own words are not part of the
          library page's outline, and an h3 here lands in its "on this page"
          list once per specimen under the same text. */}
      <p className="mt-3 font-heading text-section">
        The picture changes as you move through it.
      </p>
      <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
        Six photographs, one plate, and a rail at the foot that says where you
        are. Nothing fades: the next one arrives from the side you came from and
        the one underneath stays exactly where it was.
      </p>
    </div>
  );
}
