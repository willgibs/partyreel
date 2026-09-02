import {
  Calendar,
  Heart,
  ImageUp,
  Plus,
  Settings,
  Share2,
  Trash2,
} from "lucide-react";

import { EmptyState } from "@/components/shared/empty-state";
import { Logo } from "@/components/shared/logo";
import { PlayBadge } from "@/components/shared/play-badge";
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
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Progress } from "@/components/ui/progress";
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

import { requireDesignKey } from "@/lib/design-gate/server";
import {
  FormDemo,
  OtpDemo,
  PasswordStrengthDemo,
  ToastDemo,
} from "../reference/interactive-demos";
import { RefHeader, RefSection, Row, Spec } from "../reference/reference-ui";

// THE LIVE COMPONENTS REFERENCE. Every specimen is the REAL primitive imported
// from production (@/components/ui + @/components/shared): edit a component, this
// updates. Overlays compose without handlers; the three stateful ones (toast,
// OTP, strength meter) come from the client island.
export default async function ComponentsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireDesignKey(searchParams);

  return (
    <main className="mx-auto w-full max-w-4xl px-6 pt-8 pb-20">
      <RefHeader
        eyebrow="Reference · live"
        title="Components"
        blurb="The real UI primitives, imported from production source and rendered here. What you tune in the component file shows up on this page and across the app at once."
      />

      <RefSection title="Buttons" blurb="Sharp surfaces, round actions; press feedback only.">
        <div className="grid gap-3 sm:grid-cols-2">
          <Spec label="Variants" hint="buttonVariants">
            <Row>
              <Button>Default</Button>
              <Button variant="outline">Outline</Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="ghost">Ghost</Button>
              <Button variant="destructive">Destructive</Button>
              <Button variant="link">Link</Button>
            </Row>
          </Spec>
          <Spec label="Sizes" hint="sm / default / lg">
            <Row>
              <Button size="sm">Small</Button>
              <Button>Default</Button>
              <Button size="lg">Large</Button>
              <Button size="icon" aria-label="Add">
                <Plus />
              </Button>
            </Row>
          </Spec>
          <Spec label="With icon">
            <Row>
              <Button>
                <ImageUp /> Add photos
              </Button>
              <Button variant="outline">
                <Share2 /> Share
              </Button>
            </Row>
          </Spec>
          <Spec label="Disabled">
            <Row>
              <Button disabled>Default</Button>
              <Button variant="outline" disabled>
                Outline
              </Button>
            </Row>
          </Spec>
        </div>
      </RefSection>

      <RefSection title="Badges" blurb="Inline status; state earns color.">
        <Spec hint="badgeVariants">
          <Row>
            <Badge>Default</Badge>
            <Badge variant="secondary">Secondary</Badge>
            <Badge variant="outline">Outline</Badge>
            <Badge variant="ghost">Ghost</Badge>
            <Badge variant="destructive">Destructive</Badge>
          </Row>
        </Spec>
      </RefSection>

      <RefSection title="Inputs">
        <div className="grid gap-3 sm:grid-cols-2">
          <Spec label="Field" hint="Label + Input">
            <div className="space-y-2">
              <Label htmlFor="ref-name">Event name</Label>
              <Input id="ref-name" placeholder="Maya & Jay's Wedding" />
            </div>
          </Spec>
          <Spec label="States">
            <div className="space-y-2">
              <Input placeholder="Default" />
              <Input placeholder="Disabled" disabled />
              <Input placeholder="Invalid" aria-invalid />
            </div>
          </Spec>
          <Spec label="Textarea" hint="auto-grow">
            <Textarea placeholder="A note for your guests" />
          </Spec>
          <Spec label="Switch" hint="size sm / default">
            <Row>
              <Switch defaultChecked aria-label="On" />
              <Switch aria-label="Off" />
              <Switch size="sm" defaultChecked aria-label="Small on" />
            </Row>
          </Spec>
          <Spec label="Label" hint="dims with its field">
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
          </Spec>
          <FormDemo />
          <OtpDemo />
          <PasswordStrengthDemo />
        </div>
      </RefSection>

      <RefSection title="Surfaces">
        <div className="grid gap-3 sm:grid-cols-2">
          <Spec label="Card" hint="CardTitle = Urbanist">
            <Card>
              <CardHeader>
                <CardTitle>Maya &amp; Jay&rsquo;s Wedding</CardTitle>
                <CardDescription>128 photos and videos from 43 guests</CardDescription>
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
          </Spec>
          <Spec label="Avatar" hint="sm / default / lg">
            <Row>
              <Avatar size="sm">
                <AvatarFallback>MJ</AvatarFallback>
              </Avatar>
              <Avatar>
                <AvatarFallback>MJ</AvatarFallback>
              </Avatar>
              <Avatar size="lg">
                <AvatarFallback>MJ</AvatarFallback>
              </Avatar>
            </Row>
          </Spec>
        </div>
      </RefSection>

      <RefSection title="Feedback">
        <div className="grid gap-3 sm:grid-cols-2">
          <Spec label="Progress">
            <div className="space-y-3">
              <Progress value={32} />
              <Progress value={72} />
            </div>
          </Spec>
          <Spec label="Skeleton">
            <div className="space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          </Spec>
          <Spec label="Separator">
            <div className="text-sm text-muted-foreground">
              Above
              <Separator className="my-3" />
              Below
            </div>
          </Spec>
          <ToastDemo />
        </div>
        <div className="mt-3">
          <Spec label="Empty state" hint="shared/empty-state">
            <EmptyState
              icon={ImageUp}
              title="No photos yet"
              description="Guests add photos and videos in seconds, no app required."
              variant="icon"
            />
          </Spec>
        </div>
      </RefSection>

      <RefSection
        title="Overlays"
        blurb="Trigger-anchored where it belongs; the live components, fully interactive."
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <Spec label="Dialog">
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
          </Spec>
          <Spec label="Sheet">
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
          </Spec>
          <Spec label="Drawer" hint="vaul · bottom">
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
          </Spec>
          <Spec label="Popover">
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
          </Spec>
          <Spec label="Dropdown menu">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <Settings /> Manage
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuLabel>Event</DropdownMenuLabel>
                <DropdownMenuItem>
                  <Share2 /> Share
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Heart /> Save
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem variant="destructive">
                  <Trash2 /> Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </Spec>
          {/* No local TooltipProvider: the root one (providers.tsx, delay 200 /
              skip 300) is in scope here, so this demos the REAL shipped timing. */}
          <Spec label="Tooltip">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="sm">
                  Hover me
                </Button>
              </TooltipTrigger>
              <TooltipContent>Tooltips keep skip-delay</TooltipContent>
            </Tooltip>
          </Spec>
          <Spec label="Tabs" hint="default / line">
            <Tabs defaultValue="all">
              <TabsList>
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="photos">Photos</TabsTrigger>
                <TabsTrigger value="videos">Videos</TabsTrigger>
              </TabsList>
              <TabsContent value="all" className="pt-3 text-sm text-muted-foreground">
                Everything, interleaved.
              </TabsContent>
              <TabsContent value="photos" className="pt-3 text-sm text-muted-foreground">
                Photos only.
              </TabsContent>
              <TabsContent value="videos" className="pt-3 text-sm text-muted-foreground">
                Videos only.
              </TabsContent>
            </Tabs>
          </Spec>
        </div>
      </RefSection>

      <RefSection title="Patterns" blurb="Composed shared pieces.">
        <div className="grid gap-3 sm:grid-cols-2">
          <Spec label="Logo" hint="shared/logo">
            <div className="flex flex-col gap-3">
              <Logo />
              <Logo markOnly />
            </div>
          </Spec>
          <Spec label="Play badge" hint="shared/play-badge">
            <div className="relative flex h-24 items-center justify-center overflow-hidden rounded-lg bg-gallery">
              <PlayBadge />
            </div>
          </Spec>
        </div>
      </RefSection>
    </main>
  );
}
