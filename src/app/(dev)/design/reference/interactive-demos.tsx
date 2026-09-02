"use client";

import { useState } from "react";
import { Heart } from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { ActionTooltip } from "@/components/shared/action-tooltip";
import { FloatingAddButton } from "@/components/shared/floating-add-button";
import { PasswordStrengthMeter } from "@/components/shared/password-strength-meter";
import { SetNameStep } from "@/components/shared/set-name-step";
import { Button } from "@/components/ui/button";
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

import { Row, Spec } from "./reference-ui";

/**
 * The interactive corner of the Components reference: the few real primitives
 * that need client state or an event handler (toast is imperative; OTP and the
 * strength meter are controlled). Everything else composes fine in the server
 * page. All imported from production source, so it is the live component.
 */

export function ToastDemo() {
  return (
    <Spec label="Toast" hint="sonner · toast()">
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
    </Spec>
  );
}

export function OtpDemo() {
  const [value, setValue] = useState("");
  return (
    <Spec label="Input OTP" hint="input-otp · controlled">
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
    </Spec>
  );
}

export function PasswordStrengthDemo() {
  const [pw, setPw] = useState("");
  return (
    <Spec label="Password strength" hint="shared · live estimate">
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
    </Spec>
  );
}

// SetNameStep takes an onSaved CALLBACK (a function prop), so it can only be
// rendered from a client component (functions can't cross the RSC boundary).
// `inert` makes it a visual-only preview - its real submit hits a server action.
export function SetNameStepDemo() {
  return (
    <Spec label="Set name step" hint="inert preview · submit disabled">
      <div inert>
        <SetNameStep onSaved={() => {}} />
      </div>
    </Spec>
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
    <Spec label="Form" hint="react-hook-form + zod">
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
                  <Input
                    type="email"
                    placeholder="you@example.com"
                    {...field}
                  />
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
    </Spec>
  );
}

/** ActionTooltip: the lightbox-only tooltip around one real action control. */
export function ActionTooltipDemo() {
  const [liked, setLiked] = useState(false);
  return (
    <Spec label="ActionTooltip" hint="shared/action-tooltip · hover or focus">
      <Row>
        <ActionTooltip label={liked ? "Unlike" : "Like"}>
          <button
            type="button"
            aria-pressed={liked}
            aria-label={liked ? "Unlike" : "Like"}
            onClick={() => setLiked((v) => !v)}
            className="flex size-9 items-center justify-center rounded-full bg-muted text-foreground"
          >
            <Heart
              className={liked ? "size-4 fill-like text-like" : "size-4"}
            />
          </button>
        </ActionTooltip>
        <span className="text-sm text-muted-foreground">
          The child keeps its own aria-label; the tooltip is presentational.
        </span>
      </Row>
    </Spec>
  );
}

/** FloatingAddButton: fixed to the viewport, so the demo shows it briefly. */
export function FloatingAddDemo() {
  const [show, setShow] = useState(false);
  return (
    <Spec
      label="FloatingAddButton"
      hint="shared/floating-add-button · fixed bottom"
    >
      <Row>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setShow(true);
            window.setTimeout(() => setShow(false), 4000);
          }}
        >
          Show for 4 seconds
        </Button>
        <span className="text-sm text-muted-foreground">
          Appears at the bottom of the viewport with an uploading count.
        </span>
      </Row>
      <FloatingAddButton
        show={show}
        uploadingCount={2}
        onClick={() => toast("The picker would open here")}
      />
    </Spec>
  );
}
