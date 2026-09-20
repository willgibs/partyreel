"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { DestructiveSheet } from "@/components/admin/destructive-sheet";
import { GalleryEmptyState } from "@/components/guest/gallery-empty-state";
import { Button } from "@/components/ui/button";
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
import { PasswordStrengthMeter } from "@/components/shared/password-strength-meter";

import { Row } from "@/app/(dev)/design/reference/reference-ui";

/**
 * The interactive corner of the components gallery: the primitives that need
 * client state or a handler (toast is imperative, OTP and the strength meter
 * are controlled). All imported from production source, so these are the live
 * components.
 *
 * Moved here from `reference/` in the gallery round (2026-09-12), and that move
 * was a bug fix: scripts/design-rules/collect.mjs derives a component's
 * specimen route from the DIRECTORY of the page or `-demos` file that imports
 * it, so every primitive demoed from `reference/` was being indexed at
 * /design/reference, a route that has never existed. Six components carried a
 * dead link on the index because of it. A demo module belongs in the family
 * directory whose page mounts it.
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
      <Button variant="outline" size="sm" onClick={() => toast("Heads up")}>
        Default
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
                <CommandPaletteItem
                  key={name}
                  onSelect={() => setChose(name)}
                >
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
      <Button variant="destructive" size="sm" onClick={() => setPermanent(true)}>
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
