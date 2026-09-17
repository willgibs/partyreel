import {
  Calendar,
  Heart,
  ImageUp,
  Plus,
  Settings,
  Share2,
  Trash2,
} from "lucide-react";

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
import { Textarea } from "@/components/ui/textarea";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import type { GalleryEntry } from "@/app/(dev)/design/gallery/entry";
import { Row } from "@/app/(dev)/design/reference/reference-ui";
import {
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

const buttonSizes = [
  "xs",
  "sm",
  "default",
  "lg",
  "icon",
  "icon-xs",
  "icon-sm",
  "icon-lg",
];

const badgeVariantNames = [
  "default",
  "secondary",
  "destructive",
  "outline",
  "ghost",
  "link",
];

export const COMPONENT_ENTRIES: GalleryEntry[] = [
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
