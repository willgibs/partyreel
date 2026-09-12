"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

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
import { PasswordStrengthMeter } from "@/components/shared/password-strength-meter";

import { Row } from "../reference/reference-ui";

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
      <Button variant="outline" size="sm" onClick={() => toast.success("Saved")}>
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
