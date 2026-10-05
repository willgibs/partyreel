"use client";

import { useState } from "react";
import Image from "next/image";
import { Images } from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { DestructiveSheet } from "@/components/admin/destructive-sheet";
import { GalleryEmptyState } from "@/components/guest/gallery-empty-state";
import { Button } from "@/components/ui/button";
import { ConfirmSwitch } from "@/components/ui/confirm-switch";
import { ConsequenceLine } from "@/components/ui/consequence-line";
import { Dormant } from "@/components/ui/dormant";
import { Shutter, type ShutterState } from "@/components/ui/shutter";
import { Switch } from "@/components/ui/switch";
import {
  CommandPalette,
  CommandPaletteContent,
  CommandPaletteFooter,
  CommandPaletteGroup,
  CommandPaletteInput,
  CommandPaletteItem,
  CommandPaletteList,
} from "@/components/ui/command-palette";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { Label } from "@/components/ui/label";
import { TapTooltip } from "@/components/ui/tooltip";
import { PasswordStrengthMeter } from "@/components/shared/password-strength-meter";
import {
  RelationToggle,
  type Relation,
  type RelationAct,
} from "@/components/social/relation-toggle";
import { marketingImage } from "@/lib/constants/marketing-media";
import { cn } from "@/lib/utils";

import { Row } from "@/app/(dev)/design/reference/reference-ui";

/**
 * WHAT A SPECIMEN'S PHOTOGRAPH RENDERS AT: the well it fills, which is the Library's column (about 1200 px at a laptop's
 * window, the window's own width in a hand). A plate that said a fixed 640 asked for a file narrower than the picture it
 * filled, and a `fill` image told `100vw` that renders narrower than the window is what Next warns about.
 */
const PLATE_SIZES = "(min-width: 1024px) 1200px, 100vw";

/**
 * The interactive corner of the components gallery: the primitives that need
 * client state or a handler (toast is imperative, OTP and the strength meter
 * are controlled). All imported from production source, so these are the live
 * components.
 *
 * A demo module belongs in the family directory whose page mounts it, beside
 * that family's `gallery-demos.tsx`.
 *
 * Each demo returns bare content now: the Stage supplies the frame, the label
 * and the light-and-dark split.
 */

export function ToastDemo() {
  return (
    <Row>
      <Button
        variant="outline"
        size="sm"
        onClick={() => toast.success("Saved")}
      >
        Success
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={() => toast.error("Something went wrong")}
      >
        Error
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={() => toast.warning("Photo hidden")}
      >
        Warning
      </Button>
      <Button variant="outline" size="sm" onClick={() => toast("Heads up")}>
        Default
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={() =>
          toast("Photo hidden from the album", {
            action: { label: "Undo", onClick: () => {} },
          })
        }
      >
        With its Undo
      </Button>
    </Row>
  );
}

export function OtpDemo() {
  const [value, setValue] = useState("");
  return (
    <InputOTP maxLength={6} value={value} onChange={setValue}>
      <InputOTPGroup>
        <InputOTPSlot index={0} />
        <InputOTPSlot index={1} />
        <InputOTPSlot index={2} />
      </InputOTPGroup>
      <InputOTPSeparator />
      <InputOTPGroup>
        <InputOTPSlot index={3} />
        <InputOTPSlot index={4} />
        <InputOTPSlot index={5} />
      </InputOTPGroup>
    </InputOTP>
  );
}

/** ConfirmSwitch: on the real edge it asks on (the door page's own "An email first", step 3 of
 *  Who can get in; turning it OFF is the consequential direction). Uncontrolled state, so pressing it
 *  here really opens the dialog and really flips the switch on Confirm. */
export function ConfirmSwitchDemo() {
  const [checked, setChecked] = useState(true);
  return (
    <ConfirmSwitch
      checked={checked}
      onCheckedChange={setChecked}
      label="An email first"
      description="Every photo then has a confirmed address behind it."
      confirmWhen={(next) => !next}
      dialogTitle="Stop asking for an email first?"
      dialogDescription="Guests will add photos under a name they type, with no email behind it. You can turn this back on anytime."
      confirmLabel="Use names only"
      cancelLabel="Keep asking for an email"
    />
  );
}

export function PasswordStrengthDemo() {
  const [pw, setPw] = useState("");
  return (
    <div className="space-y-2">
      <Label htmlFor="ref-pw">New password</Label>
      <Input
        id="ref-pw"
        type="password"
        value={pw}
        onChange={(e) => setPw(e.target.value)}
        placeholder="Type to preview the meter"
      />
      <PasswordStrengthMeter value={pw} />
    </div>
  );
}

const formSchema = z.object({
  name: z.string().min(1, "Required").max(40),
  email: z.email("Enter a valid email"),
});

// The app's form-building pattern, live: react-hook-form + zod via the Form
// primitives. Submit a blank field to see FormMessage surface the zod error.
export function FormDemo() {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { name: "", email: "" },
  });
  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(() => toast.success("Looks good"))}
        className="space-y-3"
      >
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Event name</FormLabel>
              <FormControl>
                <Input placeholder="Maya & Jay's Wedding" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input type="email" placeholder="you@example.com" {...field} />
              </FormControl>
              <FormDescription>
                We only email you about this event.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" size="sm">
          Submit
        </Button>
      </form>
    </Form>
  );
}

/**
 * THE EMPTY GUEST ALBUM WITH ITS CTA, which is here for the one reason this
 * module exists: the promise's button is drawn only when the viewer can upload
 * (`onAddFirst`), and the library's pages are server components, so the handler
 * has to be minted inside a client boundary. The uploads-closed state and the
 * bare river need no handler and stay inline in gallery-demos.tsx, where the
 * Code tab can show the real call.
 *
 * The width is passed rather than inherited: a library frame is as wide as the
 * window, and the WIDTH is the point (the guest page gives its gallery 335px at
 * a phone and 632px from 672 up).
 */
export function EmptyAlbumDemo({ width }: { width: number }) {
  return (
    <div style={{ width }}>
      <GalleryEmptyState onAddFirst={() => {}} />
    </div>
  );
}

/**
 * THE COMMAND PALETTE (admin-wiring, 2026-09-20). Opened by its own button,
 * because the primitive is controlled and a palette that is always on screen is
 * not a palette. The rows are three of the portal's real surfaces and the
 * filtering is the call site's, which is the point of the primitive: it owns
 * the combobox and the keys, and nothing else.
 */
export function CommandPaletteDemo() {
  const [open, setOpen] = useState(false);
  const [chose, setChose] = useState<string | null>(null);
  return (
    <div className="flex flex-col items-start gap-3">
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        Open the palette
      </Button>
      {chose ? (
        <p className="text-caption text-muted-foreground">
          It would have jumped to {chose}.
        </p>
      ) : null}
      <CommandPalette open={open} onOpenChange={setOpen}>
        <CommandPaletteContent label="Search the operations portal">
          <CommandPaletteInput
            label="Search surfaces"
            placeholder="Search or jump to..."
          />
          <CommandPaletteList label="Surfaces">
            <CommandPaletteGroup heading="Surfaces">
              {["Support", "Applicants", "Jobs"].map((name) => (
                <CommandPaletteItem key={name} onSelect={() => setChose(name)}>
                  <span className="flex-1">{name}</span>
                </CommandPaletteItem>
              ))}
            </CommandPaletteGroup>
          </CommandPaletteList>
          <CommandPaletteFooter>
            <span>Arrows to move</span>
            <span>Enter to open</span>
            <span>Esc to close</span>
          </CommandPaletteFooter>
        </CommandPaletteContent>
      </CommandPalette>
    </div>
  );
}

/**
 * THE DESTRUCTIVE SHEET (admin-wiring, 2026-09-20). The reversible wear and the
 * permanent one side by side, which is the whole of the sizing rule: only the
 * act that nothing comes back from asks you to type. Both confirmations here
 * resolve without touching anything, so the panel is the specimen and the act
 * is not.
 */
export function DestructiveSheetDemo() {
  const [reversible, setReversible] = useState(false);
  const [permanent, setPermanent] = useState(false);
  return (
    <div className="flex flex-wrap items-start gap-2">
      <Button variant="outline" size="sm" onClick={() => setReversible(true)}>
        Pause the purge sweep
      </Button>
      <Button
        variant="destructive"
        size="sm"
        onClick={() => setPermanent(true)}
      >
        Delete an account
      </Button>
      <DestructiveSheet
        open={reversible}
        onOpenChange={setReversible}
        title="Pause the purge sweep?"
        lede="It skips every run until you turn it back on."
        verb="Pause the sweep"
        touches={[
          "No storage is reclaimed while it is off",
          "About 40 GB a day, at today's rate",
          "Over-capacity accounts stay blocked",
        ]}
        severity="reversible"
        successMessage="Nothing happened: this is the library."
        onConfirm={async () => ({ ok: true })}
      />
      <DestructiveSheet
        open={permanent}
        onOpenChange={setPermanent}
        title="Delete this account?"
        lede="Immediate and permanent, exactly as if the account holder had done it themselves."
        verb="Delete account"
        touches={[
          "1 Pro subscription, cancelled in Stripe first",
          "18 events and 4,120 photographs, binned now",
          "The profile, anonymised at once",
          "2 events under legal hold, skipped",
        ]}
        severity="permanent"
        confirmText="grace@whitlockevents.co"
        successMessage="Nothing happened: this is the library."
        onConfirm={async () => ({ ok: true })}
      />
    </div>
  );
}

/** Dormant: the reel's look and hold under its switch, asleep until it turns on (event-settings r1). */
export function DormantDemo() {
  const [on, setOn] = useState(false);
  return (
    <div className="max-w-sm space-y-3 rounded-lg bg-card p-4 text-card-foreground ring-1 ring-foreground/10">
      <div className="flex items-center justify-between gap-4">
        <Label htmlFor="library-dormant">Show the reel</Label>
        <Switch id="library-dormant" checked={on} onCheckedChange={setOn} />
      </div>
      <Dormant
        awake={on}
        summary="Its look and its hold. Turn the reel on to choose them."
      >
        <div className="space-y-1.5 pt-1">
          <p className="text-sm font-medium">Look</p>
          <div className="grid grid-cols-4 gap-2">
            {["Cinematic", "Golden", "Noir", "Float"].map((look) => (
              <Button key={look} type="button" size="sm" variant="outline">
                {look}
              </Button>
            ))}
          </div>
        </div>
      </Dormant>
    </div>
  );
}

/** The consequence line: Only me, with guests inside, says so before it acts (event-settings r1). */
export function ConsequenceLineDemo() {
  const [asked, setAsked] = useState(true);
  if (!asked) {
    return (
      <Button type="button" variant="outline" onClick={() => setAsked(true)}>
        Choose Only me again
      </Button>
    );
  }
  return (
    <div className="max-w-sm">
      <ConsequenceLine
        confirmLabel="Close it to everyone"
        onConfirm={() => {
          toast.success("Only you can open it now.");
          setAsked(false);
        }}
        onCancel={() => setAsked(false)}
      >
        31 guests are already in. Only me closes them out completely, until you
        open it again.
      </ConsequenceLine>
    </div>
  );
}

/**
 * TAPTOOLTIP, ON THE TWO FACES IT WAS DRAWN FOR (`ui/tooltip.tsx`'s own doc names both): a glyph and a number with
 * no label beside them (GlyphCount and the code's corner mark wear it) and a row's fine print (the pricing matrix's
 * `RowTip`). Each face is the caller's one button and names itself, so the words only say more.
 *
 * ★ A CLIENT DEMO, NEVER A SERVER MODULE'S SPECIMEN. TapTooltip reads its face as an element (`children.props`), and a
 * server component hands a client one its children as a lazy reference, so the entry's own module drawing it
 * returned a 500 ("Cannot read properties of undefined (reading 'title')"). Every production caller is a client atom
 * for the same reason; this is one more.
 */
export function TapTooltipDemo() {
  return (
    <Row>
      <TapTooltip words="214 photos & videos" side="bottom">
        <button
          type="button"
          aria-label="214 photos & videos"
          className="inline-flex items-center gap-1.5 rounded-full text-label font-semibold tabular-nums outline-none focus-visible:outline-[1.5px] focus-visible:outline-offset-2 focus-visible:outline-foreground focus-visible:outline-solid"
        >
          <Images className="size-3.5 text-muted-foreground" aria-hidden />
          214
        </button>
      </TapTooltip>
      <TapTooltip
        words="A tap opens these words and the next tap on the face puts them away."
        side="top"
      >
        <button
          type="button"
          className="cursor-help rounded-sm text-sm font-medium underline decoration-muted-foreground/40 decoration-dotted underline-offset-4 outline-none focus-visible:outline-[1.5px] focus-visible:outline-offset-2 focus-visible:outline-foreground focus-visible:outline-solid"
        >
          Fine print on a row
        </button>
      </TapTooltip>
    </Row>
  );
}

/**
 * THE ONE RELATION CONTROL, every state, and no press reaches a row (crumbs-44). Each toggle is the
 * real `RelationToggle` handed a write of the Library's own (`act`), which answers after a beat the
 * way a Server Function does, so the flip, the press it refuses while one runs, the ask before a
 * block and a refusal's spring-back are all the production code's; only the write is a stand-in.
 */
const LANDS: RelationAct = () =>
  new Promise((resolve) => setTimeout(() => resolve({ ok: true }), 700));
const REFUSES: RelationAct = () =>
  new Promise((resolve) =>
    setTimeout(
      () =>
        resolve({
          ok: false,
          message: "Couldn't follow right now. Please try again.",
        }),
      700,
    ),
  );

export function RelationToggleDemo({
  relation,
  on = false,
  quiet = false,
  size,
  label,
  refuses = false,
}: {
  relation: Relation;
  on?: boolean;
  quiet?: boolean;
  size?: "xs" | "sm" | "default";
  label?: string;
  refuses?: boolean;
}) {
  return (
    <RelationToggle
      relation={relation}
      profileId="library-specimen"
      on={on}
      person="Maya"
      quiet={quiet}
      size={size}
      label={label}
      act={refuses ? REFUSES : LANDS}
    />
  );
}

/* ── THE EVENT'S HEAD: its atoms (`event-header` r1, the atom contract with identity r2) ───────── */

/**
 * A PHOTOGRAPH TO STAND AN ATOM ON: one of the bootstrap stills, darkened at its foot the way the
 * cover's scrim darkens it, marked `data-surface="photo"` and painted as the room, exactly as the
 * album's cover and the hub's are. An atom made for a photograph is judged on one.
 */
export function OnAPhoto({
  children,
  still = "wedding-toast",
  className,
}: {
  children: React.ReactNode;
  still?: string;
  className?: string;
}) {
  return (
    <div
      data-surface="photo"
      className={cn(
        "dark relative isolate flex min-h-44 items-end overflow-hidden rounded-xl bg-background p-5 text-foreground",
        className,
      )}
    >
      <Image
        src={marketingImage(still).src}
        alt=""
        fill
        sizes={PLATE_SIZES}
        // Eager: a specimen's photograph is its first thing on the entry's own page, and a lazy plate at the top of a
        // page is what Next flags as the Largest Contentful Paint. The file is one the page already holds.
        loading="eager"
        className="-z-10 object-cover"
      />
      <div
        aria-hidden
        className="absolute inset-0 -z-10 bg-linear-to-b from-black/10 via-black/30 to-black/75"
      />
      {children}
    </div>
  );
}

/**
 * THE SHUTTER, PRESSED: the real atom handed a run of the Library's own, three files that go up over
 * three seconds, the ring filling as they go and the count on its shoulder going down, then the beat
 * whole with its check, then rest. Only the run is a stand-in; every state is the atom's.
 */
export function ShutterDemo({ hues }: { hues?: readonly number[] }) {
  const [run, setRun] = useState<{ startedAt: number; at: number } | null>(
    null,
  );
  const [done, setDone] = useState(false);
  const RUN_MS = 3000;
  const FILES = 3;
  const press = () => {
    const startedAt = performance.now();
    setDone(false);
    setRun({ startedAt, at: startedAt });
    const tick = () => {
      const at = performance.now();
      if (at - startedAt >= RUN_MS) {
        setRun(null);
        setDone(true);
        window.setTimeout(() => setDone(false), 1600);
        return;
      }
      setRun({ startedAt, at });
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };
  const progress = run ? Math.min(1, (run.at - run.startedAt) / RUN_MS) : 0;
  const sending = run ? Math.max(1, FILES - Math.floor(progress * FILES)) : 0;
  const state: ShutterState = run ? "sending" : done ? "done" : "idle";
  return (
    <Shutter
      state={state}
      progress={progress}
      count={sending}
      hues={hues}
      onClick={press}
      aria-label={
        sending > 0 ? `Add photos, ${sending} uploading` : "Add photos"
      }
    />
  );
}

/**
 * THE FOOT OF AN ALBUM: photographs to the edge, the page's own ground rising from the foot over them
 * (the shutter's fade while more album lies below), and what stands there. Not the room: at the foot the
 * shutter stands on the page, over the album, so it wears the page's ink.
 */
export function AtTheFoot({
  children,
  still = "reception-table",
}: {
  children: React.ReactNode;
  still?: string;
}) {
  return (
    <div className="relative isolate flex min-h-52 items-end justify-center overflow-hidden rounded-xl pb-5">
      <Image
        src={marketingImage(still).src}
        alt=""
        fill
        sizes={PLATE_SIZES}
        // Eager: a specimen's photograph is its first thing on the entry's own page, and a lazy plate at the top of a
        // page is what Next flags as the Largest Contentful Paint. The file is one the page already holds.
        loading="eager"
        className="-z-10 object-cover"
      />
      <div
        aria-hidden
        className="absolute inset-x-0 bottom-0 -z-10 h-36 bg-linear-to-t from-background via-background/70 to-transparent"
      />
      {children}
    </div>
  );
}
